/**
 * Rewrite internal Docker MinIO hostnames to browser-accessible URLs.
 * Also resolves relative /media/ paths against the Django origin.
 */
export function normalizeMediaUrl(
  url: string | null | undefined
): string | null {
  if (!url) return null;

  let normalized = url;

  // Fix malformed URLs from django-storages (http: + //host → must be http://host)
  normalized = normalized.replace(/^http\/\//, "http://");
  normalized = normalized.replace(/^https\/\//, "https://");

  // Docker internal hostname → localhost (existing seeded URLs)
  normalized = normalized.replace("://minio:", "://localhost:");

  if (normalized.startsWith("/media/")) {
    const apiBase =
      process.env.NEXT_PUBLIC_DJANGO_API_URL ??
      process.env.DJANGO_API_URL ??
      "http://localhost:8000/api";
    const origin = apiBase.replace(/\/api\/?$/, "");
    normalized = `${origin}${normalized}`;
  }

  return normalized;
}
