import { parseApiError } from "./errors";
import { ApiError } from "./types";

export interface Notification {
  id: string;
  event_type: string;
  title: string;
  body: string;
  action_url: string;
  payload: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface PaginatedNotifications {
  count: number;
  next: string | null;
  previous: string | null;
  results: Notification[];
}

async function parseResponse<T>(response: Response, fallback: string): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const parsed = parseApiError(data, fallback);
    throw new ApiError(parsed.message, response.status, data, parsed.code, parsed.fields);
  }
  return data as T;
}

export async function fetchNotifications(): Promise<PaginatedNotifications> {
  const response = await fetch("/api/proxy/notifications", {
    credentials: "include",
  });
  return parseResponse(response, "Could not load notifications.");
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const response = await fetch("/api/proxy/notifications/unread-count", {
    credentials: "include",
  });
  const data = await parseResponse<{ count: number }>(
    response,
    "Could not load notification count."
  );
  return data.count;
}

export async function markNotificationRead(id: string): Promise<Notification> {
  const response = await fetch(`/api/proxy/notifications/${id}/read`, {
    method: "PATCH",
    credentials: "include",
  });
  return parseResponse(response, "Could not update notification.");
}

export async function markAllNotificationsRead(): Promise<number> {
  const response = await fetch("/api/proxy/notifications/mark-all-read", {
    method: "POST",
    credentials: "include",
  });
  const data = await parseResponse<{ updated: number }>(
    response,
    "Could not mark notifications read."
  );
  return data.updated;
}
