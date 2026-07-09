import { type Method } from "axios";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { createDjangoClient, getDjangoApiUrl } from "@/lib/api/django";
import {
  assertProxyPathAllowed,
  isAdminProxyPath,
  ProxyPathError,
} from "@/lib/api/proxy-allowlist";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE,
  COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE,
  SESSION_COOKIE,
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

async function isStaffUser(access: string | undefined): Promise<boolean> {
  if (!access) return false;
  try {
    const django = createDjangoClient(access);
    const { data } = await django.get<{ is_staff?: boolean }>("/accounts/me/");
    return Boolean(data.is_staff);
  } catch {
    return false;
  }
}

function forwardSetCookie(
  from: string | undefined,
  response: NextResponse,
  name: string
) {
  if (!from) return;
  const match = from.match(new RegExp(`${name}=([^;]+)`));
  if (match) {
    response.cookies.set(name, match[1], {
      ...COOKIE_OPTIONS,
      httpOnly: true,
      maxAge: name === SESSION_COOKIE ? 60 * 60 * 24 * 14 : undefined,
    });
  }
}

async function proxyRequest(
  request: NextRequest,
  path: string[],
  method: Method
) {
  const cookieStore = await cookies();
  let access = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const refresh = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!access && refresh) {
    const newAccess = await refreshAccessToken(refresh);
    if (newAccess) access = newAccess;
  }

  try {
    assertProxyPathAllowed(path);
  } catch (error) {
    if (error instanceof ProxyPathError) {
      return NextResponse.json({ detail: "Forbidden path" }, { status: 403 });
    }
    throw error;
  }

  if (isAdminProxyPath(path) && !(await isStaffUser(access))) {
    return NextResponse.json({ detail: "Staff access required" }, { status: 403 });
  }

  const targetPath = path.join("/");
  const url = `${getDjangoApiUrl()}/${targetPath}/`;
  const search = request.nextUrl.search;
  const fullUrl = `${url}${search}`;

  const incomingType = request.headers.get("content-type") ?? "";
  const isMultipart = incomingType.includes("multipart/form-data");

  const headers: Record<string, string> = {};
  if (access) headers.Authorization = `Bearer ${access}`;
  if (sessionId) headers.Cookie = `${SESSION_COOKIE}=${sessionId}`;
  if (!isMultipart && method !== "GET" && method !== "DELETE") {
    headers["Content-Type"] = "application/json";
  }

  let body: BodyInit | undefined;
  if (method !== "GET" && method !== "DELETE") {
    body = isMultipart ? await request.formData() : await request.text();
  }

  try {
    const djangoResponse = await fetch(fullUrl, {
      method,
      headers,
      body,
    });

    if (djangoResponse.status === 204 || djangoResponse.status === 205) {
      const response = new NextResponse(null, { status: djangoResponse.status });
      if (access && access !== cookieStore.get(ACCESS_TOKEN_COOKIE)?.value) {
        response.cookies.set(ACCESS_TOKEN_COOKIE, access, {
          ...COOKIE_OPTIONS,
          maxAge: ACCESS_TOKEN_MAX_AGE,
        });
      }
      return response;
    }

    const contentType = djangoResponse.headers.get("content-type") ?? "";
    const responseData = contentType.includes("application/json")
      ? await djangoResponse.json()
      : { detail: await djangoResponse.text() };

    const response = NextResponse.json(responseData, {
      status: djangoResponse.status,
    });

    if (access && access !== cookieStore.get(ACCESS_TOKEN_COOKIE)?.value) {
      response.cookies.set(ACCESS_TOKEN_COOKIE, access, {
        ...COOKIE_OPTIONS,
        maxAge: ACCESS_TOKEN_MAX_AGE,
      });
    }

    const setCookie = djangoResponse.headers.get("set-cookie");
    if (setCookie) {
      forwardSetCookie(setCookie, response, SESSION_COOKIE);
    }

    return response;
  } catch {
    return NextResponse.json({ detail: "Proxy error" }, { status: 502 });
  }
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path, "GET");
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path, "POST");
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path, "PATCH");
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path, "PUT");
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path, "DELETE");
}
