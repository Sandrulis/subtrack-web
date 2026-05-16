import type { Metadata } from "next";
import { DashboardFsView } from "@/components/fs/dashboard-fs-view";
import { getSessionUserDisplay } from "@/lib/auth/user-display";

export const metadata: Metadata = {
  title: "Mani abonamenti",
};

export default async function DashboardPage() {
  const userDisplay = await getSessionUserDisplay();
  return <DashboardFsView userDisplay={userDisplay} />;
}
