import type { Metadata } from "next";
import { AnalyticsFsView } from "@/components/fs/analytics-fs-view";

export const metadata: Metadata = {
  title: "Analītika",
};

export default function AnalyticsPage() {
  return <AnalyticsFsView />;
}
