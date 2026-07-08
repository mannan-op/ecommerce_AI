import axios from "axios";
import { type NextRequest, NextResponse } from "next/server";

import { createDjangoClient } from "@/lib/api/django";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const django = createDjangoClient();
    const { data } = await django.post("/accounts/register/", body);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        error.response?.data ?? { detail: "Registration failed" },
        { status: error.response?.status ?? 400 }
      );
    }
    return NextResponse.json({ detail: "Registration failed" }, { status: 500 });
  }
}
