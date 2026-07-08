import type { components } from "./generated";

export type { components, operations, paths } from "./generated";

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type ProductList = components["schemas"]["ProductList"];
export type ProductDetail = components["schemas"]["ProductDetail"];
export type Category = components["schemas"]["Category"];
export type User = components["schemas"]["User"];
export type Cart = components["schemas"]["Cart"];
export type Order = components["schemas"]["Order"];
