/** Prevent open redirects — only allow same-origin relative paths. */
export function safeRedirect(value: string | null | undefined, fallback = "/"): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("://") || trimmed.includes("\\")) return fallback;
  return trimmed;
}
