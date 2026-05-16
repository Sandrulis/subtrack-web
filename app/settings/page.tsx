import type { Metadata } from "next";
import { SettingsFsView } from "@/components/fs/settings-fs-view";

export const metadata: Metadata = {
  title: "Iestatījumi",
};

export default function SettingsPage() {
  return (
    <div className="auth-page">
      <SettingsFsView />
    </div>
  );
}
