import type { Metadata } from "next";

import { NotificationsPage } from "./NotificationsPage";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Your MAISON alerts — orders, try-on results, and stylist updates.",
};

export default function Page() {
  return <NotificationsPage />;
}
