"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";

export function LogoutButton() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await api.auth.logout();
      setUser(null);
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="ghost" onClick={handleLogout} loading={loading}>
      Sign out
    </Button>
  );
}
