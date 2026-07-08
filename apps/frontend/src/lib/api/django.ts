import axios, { type AxiosError, type AxiosInstance } from "axios";

import { ApiError } from "./types";

const DJANGO_API_URL =
  process.env.DJANGO_API_URL ?? "http://localhost:8000/api";

function attachErrorInterceptor(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ detail?: string }>) => {
      const status = error.response?.status ?? 500;
      const message =
        error.response?.data?.detail ??
        error.message ??
        "An unexpected error occurred";
      throw new ApiError(message, status, error.response?.data);
    }
  );
}

/** Server-side Axios client — talks directly to Django. */
export function createDjangoClient(accessToken?: string): AxiosInstance {
  const client = axios.create({
    baseURL: DJANGO_API_URL,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    timeout: 15_000,
  });
  attachErrorInterceptor(client);
  return client;
}

export const djangoClient = createDjangoClient();
