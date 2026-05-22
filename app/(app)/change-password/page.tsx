import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthToastsHost } from "@/components/auth-toasts-host";
import { FsNotifyI18nBootstrap } from "@/components/fs/fs-notify-i18n-bootstrap";
import { ChangePasswordFsView } from "@/components/fs/change-password-fs-view";
import { NavLanding } from "@/components/nav-landing";
import { getSessionUserDisplay } from "@/lib/auth/user-display";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.auth.change_password"),
  };
}

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; recovery?: string }>;
}) {
  const sp = await searchParams;
  const isRecovery = sp.recovery === "1";

  if (isRecovery) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect(
        "/login?error=" +
          encodeURIComponent(
            "Paroles atjaunošanas saite nav derīga vai ir beigusies derīguma termiņš. Pieprasī jaunu e-pastu.",
          ),
      );
    }

    return (
      <div className="auth-page">
        <FsNotifyI18nBootstrap />
        <NavLanding />
        <AuthToastsHost urlError={sp.error} urlMessage={sp.message}>
          <ChangePasswordFsView recoveryMode />
        </AuthToastsHost>
      </div>
    );
  }

  const userDisplay = await getSessionUserDisplay();

  return (
    <div className="auth-page">
      <FsNotifyI18nBootstrap />
      <ChangePasswordFsView
        userDisplay={userDisplay}
        flashError={sp.error}
        flashMessage={sp.message}
      />
    </div>
  );
}
