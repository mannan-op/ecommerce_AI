import type { Category, ProductDetail, ProductImage, ProductVariant } from "./types";
import { browserClient } from "./browser";
import { parseApiError } from "./errors";
import { ApiError } from "./types";

export interface AdminProductListItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  category_name: string;
  is_active: boolean;
  variant_count: number;
  image_count: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedAdminProducts {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminProductListItem[];
}

export interface ProductWritePayload {
  name: string;
  slug: string;
  description?: string;
  category: string;
  is_active: boolean;
}

export interface VariantWritePayload {
  product: string;
  sku: string;
  price: string;
  fabric_type?: string;
  color: string;
  size?: string;
  stock_quantity: number;
  is_active: boolean;
}

async function uploadFormData(path: string, formData: FormData) {
  const response = await fetch(`/api/proxy/${path}/`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const parsed = parseApiError(data, "Upload failed");
    throw new ApiError(
      parsed.message,
      response.status,
      data,
      parsed.code,
      parsed.fields
    );
  }
  return data;
}

export const adminApi = {
  products: {
    list: (params?: { search?: string; page?: number }) =>
      browserClient.get<PaginatedAdminProducts>("/proxy/admin/catalog/products/", {
        params,
      }),
    get: (id: string) =>
      browserClient.get<ProductDetail>(`/proxy/admin/catalog/products/${id}/`),
    create: (data: ProductWritePayload) =>
      browserClient.post<ProductDetail>("/proxy/admin/catalog/products/", data),
    update: (id: string, data: Partial<ProductWritePayload>) =>
      browserClient.patch<ProductDetail>(
        `/proxy/admin/catalog/products/${id}/`,
        data
      ),
    delete: (id: string) =>
      browserClient.delete(`/proxy/admin/catalog/products/${id}/`),
  },

  categories: {
    list: () =>
      browserClient.get<{ results: Category[] }>(
        "/proxy/admin/catalog/categories/"
      ),
    create: (data: {
      name: string;
      slug: string;
      description?: string;
      parent?: string | null;
    }) =>
      browserClient.post<Category>("/proxy/admin/catalog/categories/", data),
    update: (
      id: string,
      data: Partial<{
        name: string;
        slug: string;
        description: string;
        parent: string | null;
      }>
    ) =>
      browserClient.patch<Category>(
        `/proxy/admin/catalog/categories/${id}/`,
        data
      ),
    delete: (id: string) =>
      browserClient.delete(`/proxy/admin/catalog/categories/${id}/`),
  },

  variants: {
    create: (data: VariantWritePayload) =>
      browserClient.post<ProductVariant>("/proxy/admin/catalog/variants/", data),
    update: (id: string, data: Partial<VariantWritePayload>) =>
      browserClient.patch<ProductVariant>(
        `/proxy/admin/catalog/variants/${id}/`,
        data
      ),
    delete: (id: string) =>
      browserClient.delete(`/proxy/admin/catalog/variants/${id}/`),
  },

  images: {
    upload: (
      productId: string,
      file: File,
      options?: { alt_text?: string; is_primary?: boolean; sort_order?: number }
    ) => {
      const formData = new FormData();
      formData.append("product", productId);
      formData.append("image", file);
      if (options?.alt_text) formData.append("alt_text", options.alt_text);
      if (options?.is_primary !== undefined) {
        formData.append("is_primary", String(options.is_primary));
      }
      if (options?.sort_order !== undefined) {
        formData.append("sort_order", String(options.sort_order));
      }
      return uploadFormData("admin/catalog/images", formData) as Promise<ProductImage>;
    },
    update: (
      id: string,
      data: Partial<{ alt_text: string; is_primary: boolean; sort_order: number }>
    ) =>
      browserClient.patch<ProductImage>(
        `/proxy/admin/catalog/images/${id}/`,
        data
      ),
    delete: (id: string) =>
      browserClient.delete(`/proxy/admin/catalog/images/${id}/`),
  },
};
