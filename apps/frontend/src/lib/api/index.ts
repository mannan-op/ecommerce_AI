import type {
  AddCartItemRequest,
  Address,
  AddressRequest,
  Cart,
  CartItem,
  Order,
  PaginatedAddressList,
  PaginatedOrderList,
  RegisterRequest,
  TokenObtainPairRequest,
  ProductDetail,
  User,
} from "./types";
import { browserClient } from "./browser";

export interface CheckoutPreview {
  subtotal: string;
  discount: string;
  shipping_cost: string;
  tax: string;
  total: string;
  items: Array<{
    product_name: string;
    variant_sku: string;
    quantity: number;
    unit_price: string;
    subtotal: string;
  }>;
}

export interface CheckoutResponse {
  order: Order;
  client_secret: string | null;
  provider_reference: string;
  provider?: string;
  duplicate: boolean;
}

export const api = {
  auth: {
    login: (data: TokenObtainPairRequest & { session_key?: string }) =>
      browserClient.post<{ user: User }>("/auth/login", data),
    logout: () => browserClient.post("/auth/logout"),
    me: () => browserClient.get<User>("/auth/me"),
    register: (data: RegisterRequest) =>
      browserClient.post<User>("/auth/register", data),
  },

  cart: {
    get: () => browserClient.get<Cart>("/proxy/cart/"),
    addItem: (data: AddCartItemRequest) =>
      browserClient.post<CartItem>("/proxy/cart/items/", data),
    updateItem: (itemId: string, quantity: number) =>
      browserClient.patch<CartItem>(`/proxy/cart/items/${itemId}/`, {
        quantity,
      }),
    removeItem: (itemId: string) =>
      browserClient.delete(`/proxy/cart/items/${itemId}/`),
    clear: () => browserClient.delete("/proxy/cart/clear/"),
    merge: (sessionKey?: string | null) =>
      browserClient.post<Cart>("/proxy/cart/merge/", {
        session_key: sessionKey,
      }),
  },

  orders: {
    list: () => browserClient.get<PaginatedOrderList>("/proxy/orders/"),
    get: (id: string) => browserClient.get<Order>(`/proxy/orders/${id}/`),
    paymentConfig: () =>
      browserClient.get<{ provider: string; stripe_publishable_key: string }>(
        "/proxy/orders/payments/config/"
      ),
    preview: () =>
      browserClient.post<CheckoutPreview>("/proxy/orders/checkout/preview/"),
    checkout: (data: {
      shipping_address_id: string;
      idempotency_key: string;
      payment_provider?: string;
    }) =>
      browserClient.post<CheckoutResponse>("/proxy/orders/checkout/", data),
    confirmPayment: (data: { order_id: string; provider_reference: string }) =>
      browserClient.post<{ order: Order; already_paid: boolean }>(
        "/proxy/orders/payments/confirm/",
        data
      ),
  },

  addresses: {
    list: () =>
      browserClient.get<PaginatedAddressList>("/proxy/accounts/addresses/"),
    create: (data: AddressRequest) =>
      browserClient.post<Address>("/proxy/accounts/addresses/", data),
  },

  products: {
    getBySlug: (slug: string) =>
      browserClient.get<ProductDetail>(`/proxy/catalog/products/${slug}/`),
  },
};
