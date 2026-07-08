import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createDjangoClient } from "@/lib/api/django";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants";

export async function GET() {
  const cookieStore = await cookies();
  const access = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!access) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  try {
    const django = createDjangoClient(access);
    const { data } = await django.get("/accounts/me/");
    return NextResponse.json(data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { detail: error.response?.data?.detail ?? "Unauthorized" },
        { status: error.response?.status ?? 401 }
      );
    }
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
}
