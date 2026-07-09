"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/components/providers/AuthProvider";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api/types";
import type { StaffUser } from "@/lib/api/types";
import { safeRedirect } from "@/lib/auth/safe-redirect";
import { useCartStore } from "@/lib/cart/store";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const mergeWithBackend = useCartStore((s) => s.mergeWithBackend);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.auth.login({
        email,
        password,
      });
      setUser(data.user as StaffUser);
      await mergeWithBackend();
      const redirect = safeRedirect(searchParams.get("redirect"));
      router.push(redirect);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <h1 className="heading-display text-center text-3xl">Sign in</h1>
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
      />
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <Button type="submit" fullWidth loading={loading}>
        Sign in
      </Button>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const { setUser } = useAuth();
  const mergeWithBackend = useCartStore((s) => s.mergeWithBackend);
  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.auth.register(form);
      const { data } = await api.auth.login({
        email: form.email,
        password: form.password,
      });
      setUser(data.user as StaffUser);
      await mergeWithBackend();
      router.push("/");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Registration failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <h1 className="heading-display text-center text-3xl">Create account</h1>
      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
      />
      <Input
        label="Password"
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required
        minLength={8}
      />
      <Input
        label="First name"
        value={form.first_name}
        onChange={(e) => setForm({ ...form, first_name: e.target.value })}
      />
      <Input
        label="Last name"
        value={form.last_name}
        onChange={(e) => setForm({ ...form, last_name: e.target.value })}
      />
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <Button type="submit" fullWidth loading={loading}>
        Create account
      </Button>
    </form>
  );
}
