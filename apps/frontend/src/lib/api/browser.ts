import axios, { type AxiosError } from "axios";

import { parseApiError } from "./errors";
import { ApiError } from "./types";

/** Browser Axios client — calls Next.js API routes (never Django directly). */
export const browserClient = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 15_000,
});

browserClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && original && !original.headers["X-Retry"]) {
      try {
        await axios.post("/api/auth/refresh", {}, { withCredentials: true });
        original.headers["X-Retry"] = "1";
        return browserClient(original);
      } catch {
        // refresh failed
      }
    }

    const parsed = parseApiError(error.response?.data, error.message);
    throw new ApiError(
      parsed.message,
      status ?? 500,
      error.response?.data,
      parsed.code,
      parsed.fields
    );
  }
);
