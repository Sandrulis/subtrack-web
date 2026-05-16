import type { Metadata } from "next";
import { DashboardFsView } from "@/components/fs/dashboard-fs-view";

export const metadata: Metadata = {
  title: "Mani abonamenti",
};

export default function DashboardPage() {
  return <DashboardFsView />;
}
