import type { Metadata } from "next";
import Link from "next/link";

import { RegisterForm } from "@/components/auth/AuthForms";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Create account",
};

export default function RegisterPage() {
  return (
    <div className="container-luxury flex min-h-[70vh] items-center justify-center py-16">
      <Reveal className="w-full max-w-md">
        <div className="rounded-[2rem] border border-border bg-surface p-8 shadow-elevated lg:p-10">
          <RegisterForm />
          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </Reveal>
    </div>
  );
}
