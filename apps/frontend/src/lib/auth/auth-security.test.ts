import test from "node:test";
import assert from "node:assert/strict";

import { safeRedirect } from "./safe-redirect.ts";
import {
  assertProxyPathAllowed,
  ProxyPathError,
} from "../api/proxy-allowlist.ts";

test("safeRedirect allows relative paths", () => {
  assert.equal(safeRedirect("/checkout"), "/checkout");
  assert.equal(safeRedirect(null), "/");
});

test("safeRedirect blocks external URLs", () => {
  assert.equal(safeRedirect("https://evil.com"), "/");
  assert.equal(safeRedirect("//evil.com"), "/");
  assert.equal(safeRedirect("/\\evil.com"), "/");
});

test("proxy allowlist permits storefront routes", () => {
  assert.doesNotThrow(() => assertProxyPathAllowed(["orders", "checkout"]));
  assert.doesNotThrow(() => assertProxyPathAllowed(["tryon", "jobs"]));
});

test("proxy allowlist blocks admin and auth paths", () => {
  assert.throws(
    () => assertProxyPathAllowed(["admin", "catalog", "products"]),
    ProxyPathError
  );
  assert.throws(() => assertProxyPathAllowed(["auth", "token"]), ProxyPathError);
});
