"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useAuthToastDispatch } from "@/components/auth-toasts-host";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { buildAuthOAuthRedirectTo } from "@/lib/auth/oauth-redirect";
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
    const redirectTo = buildAuthOAuthRedirectTo(window.location.origin, nextPath);

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
            <span className="btn-social-label auth-submit-btn-inner">
              <span
                className={`btn-spinner auth-submit-spinner${busy === "google" ? "" : " hidden"}`}
                aria-hidden="true"
              />
              <i className="fa-brands fa-google" aria-hidden="true" />
              <span>
                {busy === "google"
                  ? t("auth.status.login_pending")
                  : t("auth.social.google_label")}
              </span>
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
            <span className="btn-social-label auth-submit-btn-inner">
              <span
                className={`btn-spinner auth-submit-spinner${busy === "apple" ? "" : " hidden"}`}
                aria-hidden="true"
              />
              <i className="fa-brands fa-apple" aria-hidden="true" />
              <span>
                {busy === "apple"
                  ? t("auth.status.login_pending")
                  : t("auth.social.apple_label")}
              </span>
            </span>
          </button>
        ) : null}
      </div>
      {googleEnabled ? (
        <p className="auth-social-hint">{t("auth.social.same_account_hint")}</p>
      ) : null}
    </div>
  );
}
