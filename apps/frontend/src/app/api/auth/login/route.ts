import axios from "axios";
import { type NextRequest, NextResponse } from "next/server";

import { createDjangoClient } from "@/lib/api/django";
import { ApiError } from "@/lib/api/types";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE,
  COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
  SESSION_COOKIE,
} from "@/lib/auth/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const django = createDjangoClient();
    const { data: tokens } = await django.post<{
      access: string;
      refresh: string;
    }>("/auth/token/", {
      email: body.email,
      password: body.password,
    });

    const authed = createDjangoClient(tokens.access);
    const { data: user } = await authed.get("/accounts/me/");

    const sessionKey =
      body.session_key ?? request.cookies.get(SESSION_COOKIE)?.value;
    if (sessionKey) {
      try {
        await django.post(
          "/cart/merge/",
          { session_key: sessionKey },
          { headers: { Authorization: `Bearer ${tokens.access}` } }
        );
      } catch {
        // non-blocking
      }
    }

    const response = NextResponse.json({ user });
    response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.access, {
      ...COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });
    response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refresh, {
      ...COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
    if (sessionId) {
      response.cookies.set(SESSION_COOKIE, sessionId, {
        ...COOKIE_OPTIONS,
        maxAge: 60 * 60 * 24 * 14,
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
      return NextResponse.json(error.response?.data ?? { detail: "Login failed" }, {
        status: error.response?.status ?? 401,
      });
    }
    return NextResponse.json({ detail: "Login failed" }, { status: 500 });
  }
}
