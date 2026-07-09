import { createDjangoClient } from "@/lib/api/django";

import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE,
  COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE,
} from "./constants";
import { getAccessToken, getRefreshToken } from "./session";

async function refreshAccessToken(refresh: string): Promise<{
  access: string;
  refresh?: string;
} | null> {
  try {
    const django = createDjangoClient();
    const { data } = await django.post<{ access: string; refresh?: string }>(
      "/auth/token/refresh/",
      { refresh }
    );
    return data;
  } catch {
    return null;
  }
}

/** Return a valid access token, refreshing server-side when needed. */
export async function getValidAccessToken(): Promise<string | undefined> {
  const access = await getAccessToken();
  if (access) return access;

  const refresh = await getRefreshToken();
  if (!refresh) return undefined;

  const tokens = await refreshAccessToken(refresh);
  return tokens?.access;
}

export async function refreshTokensOnServer(): Promise<{
  access?: string;
  refresh?: string;
} | null> {
  const refresh = await getRefreshToken();
  if (!refresh) return null;
  return refreshAccessToken(refresh);
}

export function applyRefreshedTokens(
  response: import("next/server").NextResponse,
  tokens: { access: string; refresh?: string }
) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.access, {
    ...COOKIE_OPTIONS,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
  if (tokens.refresh) {
    response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refresh, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60,
    });
  }
}
