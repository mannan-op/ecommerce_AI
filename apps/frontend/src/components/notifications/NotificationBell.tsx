"use client";

import { Bell, CheckCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/components/providers/AuthProvider";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { useHasMounted } from "@/lib/hooks/useHasMounted";
import { cn } from "@/lib/utils";

function formatWhen(iso: string) {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

export function NotificationBell() {
  const mounted = useHasMounted();
  const { user } = useAuth();
  const router = useRouter();
  const { unreadCount, notifications, loading, markRead, markAllRead, refresh } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!mounted || !user) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) refresh();
        }}
        className="relative rounded-2xl p-2.5 text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-primary">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-3 w-[min(92vw,360px)] overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-elevated">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <p className="font-display text-sm">Notifications</p>
            <button
              type="button"
              onClick={() => markAllRead()}
              className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          </div>

          <div className="max-h-[min(60vh,400px)] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : null}
            {!loading && notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">
                You&apos;re all caught up.
              </p>
            ) : null}
            {notifications.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={async () => {
                  if (!item.is_read) await markRead(item.id);
                  setOpen(false);
                  if (item.action_url) router.push(item.action_url);
                }}
                className={cn(
                  "block w-full border-b border-border/40 px-4 py-3 text-left transition-colors hover:bg-surface-elevated/60",
                  !item.is_read && "bg-accent/5"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm text-foreground">{item.title}</p>
                  <span className="shrink-0 text-[10px] text-muted">
                    {formatWhen(item.created_at)}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                  {item.body}
                </p>
              </button>
            ))}
          </div>

          <div className="border-t border-border/60 px-4 py-3 text-center">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-accent hover:underline"
            >
              View all
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
