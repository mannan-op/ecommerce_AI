const ALLOWED_ROOTS = new Set([
  "cart",
  "orders",
  "catalog",
  "accounts",
  "notifications",
  "tryon",
]);

const BLOCKED_SEGMENTS = new Set(["admin", "schema", "docs", "redoc", "auth"]);

export function assertProxyPathAllowed(path: string[]): void {
  if (!path.length) {
    throw new ProxyPathError("Empty proxy path");
  }

  const root = path[0];
  if (!ALLOWED_ROOTS.has(root)) {
    throw new ProxyPathError(`Path not allowed: ${root}`);
  }

  for (const segment of path) {
    if (BLOCKED_SEGMENTS.has(segment)) {
      throw new ProxyPathError(`Segment not allowed: ${segment}`);
    }
  }
}

export class ProxyPathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProxyPathError";
  }
}
