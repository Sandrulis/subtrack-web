"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useAuthToastDispatch } from "@/components/auth-toasts-host";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

export type LoginSocialButtonsProps = {
  googleEnabled: boolean;
  appleEnabled: boolean;
  /** OAuth `next` uz `/auth/callback`; noklusējums `/dashboard` */
  nextPath?: string;
};

/**
 * Google / Apple OAuth caur Supabase - attēlojam tikai pēc flagām no `integrations` (`login_google`, `login_apple`).
 */
export function LoginSocialButtons({
  googleEnabled,
  appleEnabled,
  nextPath = "/dashboard",
}: LoginSocialButtonsProps) {
  const { t } = useSubtrackIntl();
  const setFlash = useAuthToastDispatch();
  const [busy, setBusy] = useState<"google" | "apple" | null>(null);

  if (!googleEnabled && !appleEnabled) {
    return null;
  }

  async function signInWithOAuth(provider: "google" | "apple") {
    setFlash?.(null);
    const cfg = getSupabasePublicConfig();
    if (!cfg) {
      setFlash?.(t("auth.social.flash_missing_supabase_env"));
      return;
    }

    setBusy(provider);
    const supabase = createBrowserClient(cfg.url, cfg.anonKey);
    const safeNext =
      nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard";
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;

    const { data, error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });

    if (oauthErr) {
      setBusy(null);
      setFlash?.(oauthErr.message);
      return;
    }

    if (data.url) {
      window.location.assign(data.url);
      return;
    }

    setBusy(null);
    setFlash?.(t("auth.social.flash_oauth_url_missing"));
  }

  return (
    <div className="auth-social">
      <div className="auth-social-divider" role="presentation">
        <span className="auth-social-divider-line" aria-hidden="true" />
        <span className="auth-social-divider-text">{t("auth.social.divider")}</span>
        <span className="auth-social-divider-line" aria-hidden="true" />
      </div>
      <div className="auth-social-buttons">
        {googleEnabled ? (
          <button
            type="button"
            className="btn btn-social btn-social-google btn-block"
            aria-label={t("auth.social.aria_google")}
            disabled={busy !== null}
            onClick={() => void signInWithOAuth("google")}
          >
            <i className="fa-brands fa-google" aria-hidden="true" />
            <span className="btn-social-label">
              {busy === "google" ? "…" : t("auth.social.google_label")}
            </span>
          </button>
        ) : null}
        {appleEnabled ? (
          <button
            type="button"
            className="btn btn-social btn-social-apple btn-block"
            aria-label={t("auth.social.aria_apple")}
            disabled={busy !== null}
            onClick={() => void signInWithOAuth("apple")}
          >
            <i className="fa-brands fa-apple" aria-hidden="true" />
            <span className="btn-social-label">
              {busy === "apple" ? "…" : t("auth.social.apple_label")}
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
