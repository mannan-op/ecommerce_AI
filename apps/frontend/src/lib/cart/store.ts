import { create } from "zustand";
import { persist } from "zustand/middleware";

import { api } from "@/lib/api";
import type { CartItem, ProductVariant } from "@/lib/api/types";

export interface LocalCartItem {
  variantId: string;
  quantity: number;
  sku?: string;
  productName?: string;
  price?: string;
  color?: string;
  size?: string;
  fabricType?: string;
  image?: string | null;
  backendItemId?: string;
}

interface CartState {
  items: LocalCartItem[];
  isSyncing: boolean;
  addItem: (
    variant: ProductVariant,
    productMeta: { name: string; image?: string | null },
    quantity?: number
  ) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clear: () => Promise<void>;
  mergeWithBackend: () => Promise<void>;
  hydrateFromBackend: () => Promise<void>;
  itemCount: () => number;
  subtotal: () => number;
}

function mapBackendItem(item: CartItem): LocalCartItem {
  return {
    variantId: item.variant.id,
    quantity: item.quantity ?? 1,
    sku: item.variant.sku,
    productName: item.variant.sku,
    price: item.variant.price,
    color: item.variant.color,
    size: item.variant.size,
    fabricType: item.variant.fabric_type,
    backendItemId: item.id,
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isSyncing: false,

      itemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, item) => {
          const price = parseFloat(item.price ?? "0");
          return sum + price * item.quantity;
        }, 0),

      addItem: async (variant, productMeta, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.variantId === variant.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === variant.id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                variantId: variant.id,
                quantity,
                sku: variant.sku,
                productName: productMeta.name,
                price: variant.price,
                color: variant.color,
                size: variant.size,
                fabricType: variant.fabric_type,
                image: productMeta.image,
              },
            ],
          };
        });

        try {
          const { data } = await api.cart.addItem({
            variant_id: variant.id,
            quantity,
          });
          set((state) => ({
            items: state.items.map((i) =>
              i.variantId === variant.id
                ? { ...i, backendItemId: data.id }
                : i
            ),
          }));
        } catch {
          // offline/local fallback
        }
      },

      updateQuantity: async (variantId, quantity) => {
        const item = get().items.find((i) => i.variantId === variantId);
        if (!item) return;
        set({
          items: get().items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i
          ),
        });
        if (item.backendItemId) {
          try {
            await api.cart.updateItem(item.backendItemId, quantity);
          } catch {
            // keep local
          }
        }
      },

      removeItem: async (variantId) => {
        const item = get().items.find((i) => i.variantId === variantId);
        set({ items: get().items.filter((i) => i.variantId !== variantId) });
        if (item?.backendItemId) {
          try {
            await api.cart.removeItem(item.backendItemId);
          } catch {
            // keep local
          }
        }
      },

      clear: async () => {
        set({ items: [] });
        try {
          await api.cart.clear();
        } catch {
          // noop
        }
      },

      hydrateFromBackend: async () => {
        try {
          const { data } = await api.cart.get();
          const cart = Array.isArray(data) ? data[0] : data;
          if (cart?.items?.length) {
            set({ items: cart.items.map(mapBackendItem) });
          }
        } catch {
          // use persisted local cart
        }
      },

      mergeWithBackend: async () => {
        set({ isSyncing: true });
        try {
          await api.cart.merge(null);
          const { data } = await api.cart.get();
          const cart = Array.isArray(data) ? data[0] : data;
          if (cart?.items?.length) {
            set({ items: cart.items.map(mapBackendItem) });
          }
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    { name: "ecommerce-cart", partialize: (state) => ({ items: state.items }) }
  )
);
