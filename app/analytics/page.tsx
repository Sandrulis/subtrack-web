import type { Metadata } from "next";
import { AnalyticsFsView } from "@/components/fs/analytics-fs-view";
import { getSessionUserDisplay } from "@/lib/auth/user-display";

export const metadata: Metadata = {
  title: "Analītika",
};

export default async function AnalyticsPage() {
  const userDisplay = await getSessionUserDisplay();
  return <AnalyticsFsView userDisplay={userDisplay} />;
}
