import type { NavUserDisplay } from "@/lib/auth/user-display";
import { SettingsFsViewClient } from "@/components/fs/settings-fs-view-client";

export function SettingsFsView({
  userDisplay,
  dbPreferencesRaw,
}: {
  userDisplay?: NavUserDisplay | null;
  dbPreferencesRaw: unknown | null;
}) {
  return (
    <SettingsFsViewClient
      userDisplay={userDisplay}
      dbPreferencesRaw={dbPreferencesRaw}
    />
  );
}
