"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Heart,
  Menu,
  Moon,
  Search,
  ShoppingBag,
  Sun,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { api } from "@/lib/api";
import type { Category } from "@/lib/api/types";
import { useHasMounted } from "@/lib/hooks/useHasMounted";
import { useCartStore } from "@/lib/cart/store";
import { cn } from "@/lib/utils";
import { useWishlistStore } from "@/lib/wishlist/store";

interface StoreNavbarProps {
  categories?: Category[];
}

export function StoreNavbar({ categories = [] }: StoreNavbarProps) {
  const mounted = useHasMounted();
  const { user, setUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const itemCount = useCartStore((s) => s.itemCount());
  const displayCount = mounted ? itemCount : 0;
  const wishlistCount = useWishlistStore((s) => (mounted ? s.count() : 0));
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [megaOpen, setMegaOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
    setSearchQuery("");
  }

  async function handleLogout() {
    await api.auth.logout();
    setUser(null);
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-500",
          scrolled
            ? "border-b border-border/60 bg-surface/85 shadow-soft backdrop-blur-xl"
            : "bg-surface/70 backdrop-blur-md"
        )}
      >
        <div className="container-luxury">
          <div className="flex h-16 items-center justify-between gap-4 lg:h-20">
            <button
              type="button"
              className="rounded-2xl p-2 text-foreground lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link
              href="/"
              className="font-display text-xl tracking-tight text-foreground lg:text-2xl"
            >
              MAISON<span className="text-accent">.</span>
            </Link>

            <nav className="hidden items-center gap-8 lg:flex">
              <div
                className="relative"
                onMouseEnter={() => setMegaOpen(true)}
                onMouseLeave={() => setMegaOpen(false)}
              >
                <button
                  type="button"
                  className="text-sm tracking-wide text-muted transition-colors hover:text-foreground"
                >
                  Collections
                </button>
                <AnimatePresence>
                  {megaOpen && categories.length > 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute left-1/2 top-full z-50 mt-4 w-[520px] -translate-x-1/2 rounded-3xl border border-border/60 bg-surface/95 p-6 shadow-elevated backdrop-blur-xl"
                    >
                      <p className="mb-4 text-xs uppercase tracking-widest text-muted">
                        Shop by category
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {categories.map((cat) => (
                          <Link
                            key={cat.id}
                            href={`/categories/${cat.slug}`}
                            className="rounded-2xl px-4 py-3 text-sm transition-colors hover:bg-surface-elevated hover:text-accent"
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                      <Link
                        href="/shop"
                        className="mt-4 block text-sm text-accent hover:underline"
                      >
                        View all products →
                      </Link>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
              <Link
                href="/shop"
                className="text-sm tracking-wide text-muted transition-colors hover:text-foreground"
              >
                Shop
              </Link>
              <Link
                href="/shop?ordering=-newest"
                className="text-sm tracking-wide text-muted transition-colors hover:text-foreground"
              >
                New Arrivals
              </Link>
            </nav>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => setSearchOpen((v) => !v)}
                className="rounded-2xl p-2.5 text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {mounted ? (
                <button
                  type="button"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="hidden rounded-2xl p-2.5 text-muted transition-colors hover:bg-surface-elevated hover:text-foreground sm:block"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </button>
              ) : null}

              <Link
                href="/shop"
                className="relative rounded-2xl p-2.5 text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
                aria-label="Wishlist"
              >
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 ? (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-primary">
                    {wishlistCount}
                  </span>
                ) : null}
              </Link>

              <Link
                href="/cart"
                className="relative rounded-2xl p-2.5 text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
                aria-label="Cart"
              >
                <ShoppingBag className="h-5 w-5" />
                {displayCount > 0 ? (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-background">
                    {displayCount}
                  </span>
                ) : null}
              </Link>

              {user ? (
                <div className="relative hidden items-center gap-2 lg:flex">
                  {user.is_staff ? (
                    <Link
                      href="/admin"
                      className="text-xs uppercase tracking-wider text-accent"
                    >
                      Admin
                    </Link>
                  ) : null}
                  <Link
                    href="/orders"
                    className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-muted hover:bg-surface-elevated hover:text-foreground"
                  >
                    <User className="h-4 w-4" />
                    <span className="max-w-[120px] truncate">{user.email}</span>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    Sign out
                  </Button>
                </div>
              ) : (
                <Link href="/login" className="hidden lg:block">
                  <Button variant="outline" size="sm">
                    Sign in
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <AnimatePresence>
            {searchOpen ? (
              <motion.form
                onSubmit={handleSearch}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-border/40 pb-4 pt-4"
              >
                <div className="flex gap-2">
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search collections, fabrics, styles…"
                    className="h-12 flex-1 rounded-2xl border border-border bg-surface-elevated px-4 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    autoFocus
                  />
                  <Button type="submit" variant="accent">
                    Search
                  </Button>
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="rounded-2xl p-3 text-muted hover:bg-surface-elevated"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </motion.form>
            ) : null}
          </AnimatePresence>
        </div>
      </header>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu">
        <nav className="flex flex-col gap-1">
          <Link
            href="/shop"
            className="rounded-2xl px-4 py-3 hover:bg-surface-elevated"
            onClick={() => setMenuOpen(false)}
          >
            Shop all
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="rounded-2xl px-4 py-3 text-muted hover:bg-surface-elevated hover:text-foreground"
              onClick={() => setMenuOpen(false)}
            >
              {cat.name}
            </Link>
          ))}
          <Link
            href="/orders"
            className="rounded-2xl px-4 py-3 hover:bg-surface-elevated"
            onClick={() => setMenuOpen(false)}
          >
            Orders
          </Link>
          {user ? (
            <Button variant="ghost" onClick={handleLogout} className="mt-4">
              Sign out
            </Button>
          ) : (
            <Link href="/login" onClick={() => setMenuOpen(false)}>
              <Button fullWidth className="mt-4">
                Sign in
              </Button>
            </Link>
          )}
        </nav>
      </Drawer>
    </>
  );
}
