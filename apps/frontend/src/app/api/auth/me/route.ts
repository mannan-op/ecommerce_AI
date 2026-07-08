import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createDjangoClient } from "@/lib/api/django";
import { ApiError } from "@/lib/api/types";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE,
  COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/constants";

async function refreshAccessToken(refresh: string): Promise<string | null> {
  try {
    const django = createDjangoClient();
    const { data } = await django.post<{ access: string }>(
      "/auth/token/refresh/",
      { refresh }
    );
    return data.access;
  } catch {
    return null;
  }
}

export async function GET() {
  const cookieStore = await cookies();
  let access = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const refresh = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!access && refresh) {
    access = (await refreshAccessToken(refresh)) ?? undefined;
  }

  if (!access) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  try {
    const django = createDjangoClient(access);
    const { data } = await django.get("/accounts/me/");
    const response = NextResponse.json(data);
    if (access !== cookieStore.get(ACCESS_TOKEN_COOKIE)?.value) {
      response.cookies.set(ACCESS_TOKEN_COOKIE, access, {
        ...COOKIE_OPTIONS,
        maxAge: ACCESS_TOKEN_MAX_AGE,
      });
    }
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        error.data ?? { detail: error.message },
        { status: error.status }
      );
    }
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { detail: error.response?.data?.detail ?? "Unauthorized" },
        { status: error.response?.status ?? 401 }
      );
    }
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
}
