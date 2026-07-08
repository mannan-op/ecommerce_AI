import { parseApiError } from "./errors";
import { ApiError } from "./types";

export interface TryOnJob {
  id: string;
  product: string;
  product_name: string;
  product_slug: string;
  variant: string | null;
  variant_color: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  provider: string;
  result_image: string | null;
  user_photo: string | null;
  error_message: string;
  consent_given: boolean;
  consent_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CSRHandoff {
  id: string;
  tryon_job: string;
  product_name: string;
  tryon_status: string;
  result_image: string | null;
  message: string;
  contact_email: string;
  contact_phone: string;
  preferred_channel: "email" | "whatsapp" | "phone";
  status: "pending" | "contacted" | "resolved";
  staff_notes: string;
  assigned_to: string | null;
  user_email?: string;
  created_at: string;
  updated_at: string;
}

export interface TryOnConfig {
  provider: string;
  is_demo: boolean;
  is_free: boolean;
  estimated_seconds: number;
  message: string;
}

export interface PaginatedCSRHandoffs {
  count: number;
  next: string | null;
  previous: string | null;
  results: CSRHandoff[];
}

async function parseResponse<T>(response: Response, fallback: string): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const parsed = parseApiError(data, fallback);
    throw new ApiError(
      parsed.message,
      response.status,
      data,
      parsed.code,
      parsed.fields
    );
  }
  return data as T;
}

export async function fetchTryOnConfig(): Promise<TryOnConfig> {
  const response = await fetch("/api/proxy/tryon/jobs/config", {
    credentials: "include",
  });
  return parseResponse(response, "Could not load try-on config.");
}

export async function createTryOnJob(formData: FormData): Promise<TryOnJob> {
  const response = await fetch("/api/proxy/tryon/jobs", {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  return parseResponse(response, "Could not start try-on.");
}

export async function fetchTryOnJob(jobId: string): Promise<TryOnJob> {
  const response = await fetch(`/api/proxy/tryon/jobs/${jobId}`, {
    credentials: "include",
  });
  return parseResponse(response, "Could not load try-on job.");
}

export async function createCSRHandoff(payload: {
  tryon_job_id: string;
  message: string;
  contact_email: string;
  contact_phone?: string;
  preferred_channel: CSRHandoff["preferred_channel"];
}): Promise<CSRHandoff> {
  const response = await fetch("/api/proxy/tryon/csr", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse(response, "Could not reach stylist.");
}

export async function fetchAdminCSRQueue(): Promise<PaginatedCSRHandoffs> {
  const response = await fetch("/api/proxy/admin/tryon/csr", {
    credentials: "include",
  });
  return parseResponse(response, "Could not load stylist queue.");
}

export async function updateAdminCSRHandoff(
  id: string,
  payload: Partial<Pick<CSRHandoff, "status" | "staff_notes">>
): Promise<CSRHandoff> {
  const response = await fetch(`/api/proxy/admin/tryon/csr/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse(response, "Could not update handoff.");
}

export async function pollTryOnJob(
  jobId: string,
  options?: { intervalMs?: number; timeoutMs?: number }
): Promise<TryOnJob> {
  const intervalMs = options?.intervalMs ?? 2000;
  const timeoutMs = options?.timeoutMs ?? 180_000;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const job = await fetchTryOnJob(jobId);
    if (job.status === "completed" || job.status === "failed") {
      return job;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new ApiError(
    "Try-on is taking longer than expected. Please check back shortly.",
    408
  );
}
