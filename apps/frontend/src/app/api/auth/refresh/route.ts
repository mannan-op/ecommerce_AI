import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createDjangoClient } from "@/lib/api/django";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE,
  COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/constants";

export async function POST() {
  const cookieStore = await cookies();
  const refresh = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refresh) {
    return NextResponse.json({ detail: "No refresh token" }, { status: 401 });
  }

  try {
    const django = createDjangoClient();
    const { data } = await django.post<{ access: string }>("/auth/token/refresh/", {
      refresh,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ACCESS_TOKEN_COOKIE, data.access, {
      ...COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });
    return response;
  } catch {
    const response = NextResponse.json(
      { detail: "Token refresh failed" },
      { status: 401 }
    );
    response.cookies.set(ACCESS_TOKEN_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
    response.cookies.set(REFRESH_TOKEN_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
    return response;
  }
}
