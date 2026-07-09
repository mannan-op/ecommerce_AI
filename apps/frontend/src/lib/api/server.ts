import type {
  Category,
  PaginatedProductList,
  ProductDetail,
  ProductList,
} from "./types";
import { djangoClient } from "./django";

export interface ProductQueryParams {
  page?: number;
  search?: string;
  category?: string;
  fabric?: string;
  color?: string;
  size?: string;
  min_price?: string;
  max_price?: string;
  ordering?: string;
}

export interface PaginatedResult<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  page: number;
  totalPages: number;
}

export const serverApi = {
  async getCategories(): Promise<Category[]> {
    const { data } = await djangoClient.get<{ results: Category[] }>(
      "/catalog/categories/"
    );
    return data.results;
  },

  async getCategory(slug: string): Promise<Category | null> {
    try {
      const { data } = await djangoClient.get<Category>(
        `/catalog/categories/${slug}/`
      );
      return data;
    } catch {
      return null;
    }
  },

  async getProducts(
    params: ProductQueryParams = {}
  ): Promise<PaginatedResult<ProductList>> {
    const { data } = await djangoClient.get<PaginatedProductList>(
      "/catalog/products/",
      { params }
    );
    const page = params.page ?? 1;
    const totalPages = Math.ceil(data.count / 20) || 1;
    return {
      count: data.count,
      results: data.results,
      page,
      totalPages,
      next: data.next ?? null,
      previous: data.previous ?? null,
    };
  },

  async getProductsByCategory(
    categoryId: string,
    params: ProductQueryParams = {}
  ): Promise<PaginatedResult<ProductList>> {
    const category = await djangoClient
      .get<{ results: Category[] }>("/catalog/categories/")
      .then((r) => r.data.results.find((c) => c.id === categoryId));
    if (!category) {
      return { count: 0, next: null, previous: null, results: [], page: 1, totalPages: 1 };
    }
    return this.getProducts({ ...params, category: category.slug });
  },

  async getProduct(slug: string): Promise<ProductDetail | null> {
    try {
      const { data } = await djangoClient.get<ProductDetail>(
        `/catalog/products/${slug}/`
      );
      return data;
    } catch {
      return null;
    }
  },

  async getOrder(
    id: string,
    accessToken: string
  ): Promise<import("./types").OrderDetail | null> {
    try {
      const client = (await import("./django")).createDjangoClient(accessToken);
      const { data } = await client.get<import("./types").OrderDetail>(
        `/orders/${id}/`
      );
      return data;
    } catch {
      return null;
    }
  },

  async getCurrentUser(accessToken: string) {
    try {
      const client = (await import("./django")).createDjangoClient(accessToken);
      const { data } = await client.get("/accounts/me/");
      return data;
    } catch {
      return null;
    }
  },
};
