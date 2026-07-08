import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { getAccessToken } from "@/lib/auth/session";
import { serverApi } from "@/lib/api/server";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    redirect("/login?redirect=/admin");
  }

  const user = await serverApi.getCurrentUser(accessToken);
  if (!user?.is_staff) {
    redirect("/");
  }

  return <AdminShell>{children}</AdminShell>;
}
