"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { StaffUser } from "@/lib/api/types";
import { useHasMounted } from "@/lib/hooks/useHasMounted";
import { useCartStore } from "@/lib/cart/store";

export function Header() {
  const mounted = useHasMounted();
  const itemCount = useCartStore((s) => s.itemCount());
  const displayCount = mounted ? itemCount : 0;
  const [user, setUser] = useState<StaffUser | null>(null);

  useEffect(() => {
    api.auth
      .me()
      .then((res) => setUser(res.data as StaffUser))
      .catch(() => setUser(null));
  }, []);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="logo">
          E-Commerce AI
        </Link>
        <nav className="nav">
          <Link href="/shop">Shop</Link>
          <Link href="/orders">Orders</Link>
          <Link href="/cart" className="cart-link">
            Cart
            {displayCount > 0 ? (
              <span className="cart-badge">{displayCount}</span>
            ) : null}
          </Link>
          {user ? (
            <>
              {user.is_staff ? (
                <Link href="/admin">Admin</Link>
              ) : null}
              <span className="nav-user">{user.email}</span>
              <LogoutButton />
            </>
          ) : (
            <Link href="/login">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <p>© {new Date().getFullYear()} E-Commerce AI. All rights reserved.</p>
      </div>
    </footer>
  );
}

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await api.auth.logout();
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
