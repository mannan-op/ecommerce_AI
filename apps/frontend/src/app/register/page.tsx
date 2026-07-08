import type { Metadata } from "next";
import Link from "next/link";

import { RegisterForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = {
  title: "Create account",
};

export default function RegisterPage() {
  return (
    <div className="container page auth-page">
      <RegisterForm />
      <p className="auth-switch">
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </div>
  );
}
