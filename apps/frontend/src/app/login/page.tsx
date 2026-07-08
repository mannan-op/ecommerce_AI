import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="container page auth-page">
      <Suspense fallback={<p className="notice">Loading…</p>}>
        <LoginForm />
      </Suspense>
      <p className="auth-switch">
        No account? <Link href="/register">Create one</Link>
      </p>
    </div>
  );
}
