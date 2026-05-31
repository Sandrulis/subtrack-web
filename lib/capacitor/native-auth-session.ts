import { isNativeCapacitorApp } from "@/lib/capacitor/native-app";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const NATIVE_AUTH_SESSION_KEY = "subtrack_native_auth_session_v1";

export type NativeAuthSessionPayload = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
};

export async function persistNativeAuthSession(
  payload: NativeAuthSessionPayload | null,
): Promise<void> {
  if (!isNativeCapacitorApp()) return;
  try {
    const { Preferences } = await import("@capacitor/preferences");
    if (!payload?.access_token || !payload.refresh_token) {
      await Preferences.remove({ key: NATIVE_AUTH_SESSION_KEY });
      return;
    }
    await Preferences.set({
      key: NATIVE_AUTH_SESSION_KEY,
      value: JSON.stringify(payload),
    });
  } catch {
    /* ignore */
  }
}

export async function clearNativeAuthSession(): Promise<void> {
  await persistNativeAuthSession(null);
}

export async function restoreNativeAuthSession(): Promise<boolean> {
  if (!isNativeCapacitorApp()) return false;
  try {
    const { Preferences } = await import("@capacitor/preferences");
    const { value } = await Preferences.get({ key: NATIVE_AUTH_SESSION_KEY });
    if (!value) return false;

    const parsed = JSON.parse(value) as Partial<NativeAuthSessionPayload>;
    if (
      typeof parsed.access_token !== "string" ||
      typeof parsed.refresh_token !== "string"
    ) {
      await Preferences.remove({ key: NATIVE_AUTH_SESSION_KEY });
      return false;
    }

    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase.auth.setSession({
      access_token: parsed.access_token,
      refresh_token: parsed.refresh_token,
    });

    if (error || !data.session) {
      await Preferences.remove({ key: NATIVE_AUTH_SESSION_KEY });
      return false;
    }

    await persistNativeAuthSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at ?? undefined,
    });

    return true;
  } catch {
    return false;
  }
}
