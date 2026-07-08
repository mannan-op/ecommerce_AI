import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/AuthForms";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="container-luxury flex min-h-[70vh] items-center justify-center py-16">
      <Reveal className="w-full max-w-md">
        <div className="rounded-[2rem] border border-border bg-surface p-8 shadow-elevated lg:p-10">
          <Suspense fallback={<p className="text-muted">Loading…</p>}>
            <LoginForm />
          </Suspense>
          <p className="mt-6 text-center text-sm text-muted">
            No account?{" "}
            <Link href="/register" className="text-accent hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </Reveal>
    </div>
  );
}
