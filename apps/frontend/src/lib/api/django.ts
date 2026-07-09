import axios, { type AxiosError, type AxiosInstance } from "axios";

import { ApiError } from "./types";

const DJANGO_API_URL =
  process.env.DJANGO_API_URL ?? "http://localhost:8000/api";

function isRetryableNetworkError(error: AxiosError): boolean {
  const code = error.code;
  return (
    code === "ECONNREFUSED" ||
    code === "ECONNRESET" ||
    code === "ENOTFOUND" ||
    code === "ETIMEDOUT" ||
    error.message.includes("timeout")
  );
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function attachErrorInterceptor(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<{ detail?: string }>) => {
      const config = error.config as (typeof error.config & {
        __retryCount?: number;
      }) | undefined;

      if (
        config &&
        isRetryableNetworkError(error) &&
        (config.__retryCount ?? 0) < 3
      ) {
        config.__retryCount = (config.__retryCount ?? 0) + 1;
        await sleep(1000 * config.__retryCount);
        return instance.request(config);
      }

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
    timeout: 30_000,
  });
  attachErrorInterceptor(client);
  return client;
}

export const djangoClient = createDjangoClient();
