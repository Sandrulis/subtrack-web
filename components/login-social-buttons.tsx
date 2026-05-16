"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useAuthToastDispatch } from "@/components/auth-toasts-host";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

/**
 * Google / Apple OAuth caur Supabase (Dashboard: Authentication → Providers).
 */
export function LoginSocialButtons() {
  const setFlash = useAuthToastDispatch();
  const [busy, setBusy] = useState<"google" | "apple" | null>(null);

  async function signInWithOAuth(provider: "google" | "apple") {
    setFlash?.(null);
    const cfg = getSupabasePublicConfig();
    if (!cfg) {
      setFlash?.(
        "Pievieno .env.local: NEXT_PUBLIC_SUPABASE_URL un NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
      return;
    }

    setBusy(provider);
    const supabase = createBrowserClient(cfg.url, cfg.anonKey);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/dashboard")}`;

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
    setFlash?.("OAuth URL netika atgriezts. Pārbaudi providerus Supabase.");
  }

  return (
    <div className="auth-social">
      <div className="auth-social-divider" role="presentation">
        <span className="auth-social-divider-line" aria-hidden="true" />
        <span className="auth-social-divider-text">vai turpināt ar</span>
        <span className="auth-social-divider-line" aria-hidden="true" />
      </div>
      <div className="auth-social-buttons">
        <button
          type="button"
          className="btn btn-social btn-social-google btn-block"
          aria-label="Turpināt ar Google kontu"
          disabled={busy !== null}
          onClick={() => void signInWithOAuth("google")}
        >
          <i className="fa-brands fa-google" aria-hidden="true" />
          <span className="btn-social-label">
            {busy === "google" ? "…" : "Turpināt ar Google"}
          </span>
        </button>
        <button
          type="button"
          className="btn btn-social btn-social-apple btn-block"
          aria-label="Turpināt ar Apple kontu"
          disabled={busy !== null}
          onClick={() => void signInWithOAuth("apple")}
        >
          <i className="fa-brands fa-apple" aria-hidden="true" />
          <span className="btn-social-label">
            {busy === "apple" ? "…" : "Turpināt ar Apple"}
          </span>
        </button>
      </div>
    </div>
  );
}
