import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ProductList } from "@/lib/api/types";

const MAX_ITEMS = 8;

interface RecentlyViewedState {
  items: ProductList[];
  add: (product: ProductList) => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      items: [],
      add: (product) =>
        set((state) => ({
          items: [
            product,
            ...state.items.filter((p) => p.id !== product.id),
          ].slice(0, MAX_ITEMS),
        })),
    }),
    { name: "ecommerce-recently-viewed" }
  )
);
