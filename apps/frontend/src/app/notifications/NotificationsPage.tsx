"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/AuthProvider";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString();
}

export function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { notifications, loading, markRead, markAllRead, refresh } =
    useNotifications();

  if (!user) {
    return (
      <div className="container-luxury py-20 text-center">
        <p className="text-muted">Sign in to view your notifications.</p>
        <Link href="/login?next=/notifications" className="mt-4 inline-block text-accent">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="container-luxury py-12">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-accent">Inbox</p>
            <h1 className="heading-display mt-2 text-3xl">Notifications</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => refresh()}>
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={() => markAllRead()}>
              Mark all read
            </Button>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {loading && notifications.length === 0 ? (
            <p className="text-sm text-muted">Loading notifications…</p>
          ) : null}
          {!loading && notifications.length === 0 ? (
            <p className="rounded-3xl border border-border/60 bg-surface-elevated/40 px-6 py-10 text-center text-sm text-muted">
              No notifications yet. We&apos;ll alert you when your try-on is ready or your
              order updates.
            </p>
          ) : null}
          {notifications.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={async () => {
                if (!item.is_read) await markRead(item.id);
                if (item.action_url) router.push(item.action_url);
              }}
              className={cn(
                "w-full rounded-3xl border border-border/60 px-5 py-4 text-left transition-colors hover:border-accent/40",
                !item.is_read ? "bg-accent/5" : "bg-surface-elevated/30"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-lg">{item.title}</p>
                <span className="shrink-0 text-xs text-muted">
                  {formatWhen(item.created_at)}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
