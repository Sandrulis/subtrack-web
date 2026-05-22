"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { buildAuthOAuthRedirectTo } from "@/lib/auth/oauth-redirect";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { pushDomToast } from "@/lib/push-dom-toast";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

type SettingsConnectGoogleProps = {
  googleEnabled: boolean;
};

/**
 * Ielogotam lietotājam: piesaista Google identitāti esošajam kontam (`linkIdentity`).
 * Nepieciešams Supabase **Manual linking** (skat. README Google OAuth).
 */
export function SettingsConnectGoogle({ googleEnabled }: SettingsConnectGoogleProps) {
  const { t } = useSubtrackIntl();
  const [hasGoogle, setHasGoogle] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!googleEnabled) {
      setHasGoogle(null);
      return;
    }

    const cfg = getSupabasePublicConfig();
    if (!cfg) {
      setHasGoogle(false);
      return;
    }

    const supabase = createBrowserClient(cfg.url, cfg.anonKey);
    let cancelled = false;

    void (async () => {
      const { data, error } = await supabase.auth.getUserIdentities();
      if (cancelled) return;
      if (error) {
        setHasGoogle(false);
        return;
      }
      const linked = (data?.identities ?? []).some(
        (id) => id.provider === "google",
      );
      setHasGoogle(linked);
    })();

    return () => {
      cancelled = true;
    };
  }, [googleEnabled]);

  if (!googleEnabled || hasGoogle === null) {
    return null;
  }

  async function connectGoogle() {
    const cfg = getSupabasePublicConfig();
    if (!cfg) {
      pushDomToast(t("auth.social.flash_missing_supabase_env"), "error");
      return;
    }

    setBusy(true);
    const supabase = createBrowserClient(cfg.url, cfg.anonKey);
    const redirectTo = buildAuthOAuthRedirectTo(
      window.location.origin,
      "/settings",
    );

    const { data, error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: { redirectTo },
    });

    if (error) {
      setBusy(false);
      pushDomToast(error.message, "error");
      return;
    }

    if (data.url) {
      window.location.assign(data.url);
      return;
    }

    setBusy(false);
    pushDomToast(t("auth.social.flash_oauth_url_missing"), "error");
  }

  return (
    <section className="settings-section settings-google-connect">
      <h2 className="settings-section-title">{t("settings.google_connect.title")}</h2>
      {hasGoogle ? (
        <p className="settings-hint settings-google-connect-linked">
          {t("settings.google_connect.linked")}
        </p>
      ) : (
        <>
          <p className="settings-hint">{t("settings.google_connect.lead")}</p>
          <button
            type="button"
            className="btn btn-outline btn-block settings-google-connect-btn"
            disabled={busy}
            onClick={() => void connectGoogle()}
          >
            {busy ? t("auth.status.login_pending") : t("settings.google_connect.btn")}
          </button>
        </>
      )}
    </section>
  );
}
