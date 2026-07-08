import type { components, Order, User } from "@ecommerce/types";

export type {
  Category,
  Order,
  ProductDetail,
  ProductList,
  User,
} from "@ecommerce/types";

export type StaffUser = User & { is_staff: boolean };

export type Address = components["schemas"]["Address"];
export type Cart = components["schemas"]["Cart"];
export type CartItem = components["schemas"]["CartItem"];
export type ProductVariant = components["schemas"]["ProductVariant"];
export type ProductImage = components["schemas"]["ProductImage"];
export type OrderItem = components["schemas"]["OrderItem"];
export type Payment = components["schemas"]["Payment"];
export type PaginatedProductList =
  components["schemas"]["PaginatedProductListList"];
export type PaginatedCategoryList =
  components["schemas"]["PaginatedCategoryList"];
export type PaginatedOrderList = components["schemas"]["PaginatedOrderList"];

/** Order detail with nested address (OpenAPI may lag behind serializer). */
export type OrderDetail = Omit<Order, "shipping_address"> & {
  shipping_address: Address;
  subtotal?: string;
  shipping_cost?: string;
  tax?: string;
  discount?: string;
  estimated_delivery?: string | null;
};
export type PaginatedAddressList = components["schemas"]["PaginatedAddressList"];
export type TokenObtainPairRequest =
  components["schemas"]["TokenObtainPairRequest"];
export type RegisterRequest = components["schemas"]["RegisterRequest"];
export type AddCartItemRequest = components["schemas"]["AddCartItemRequest"];
export type CreateOrderRequest = components["schemas"]["CreateOrderRequest"];
export type AddressRequest = components["schemas"]["AddressRequest"];

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
    public code = "API_ERROR",
    public fields?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
  }
}
