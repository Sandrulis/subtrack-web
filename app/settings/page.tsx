import type { Metadata } from "next";
import { SettingsFsView } from "@/components/fs/settings-fs-view";
import { getSessionDisplayPreferencesRow } from "@/lib/auth/display-preferences-server";
import { getSessionUserDisplay } from "@/lib/auth/user-display";

export const metadata: Metadata = {
  title: "Iestatījumi",
};

export default async function SettingsPage() {
  const [userDisplay, dbPreferencesRaw] = await Promise.all([
    getSessionUserDisplay(),
    getSessionDisplayPreferencesRow(),
  ]);
  return (
    <div className="auth-page">
      <SettingsFsView
        userDisplay={userDisplay}
        dbPreferencesRaw={dbPreferencesRaw}
      />
    </div>
  );
}
