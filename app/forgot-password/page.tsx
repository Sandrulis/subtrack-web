import type { Metadata } from "next";
import { AuthToastsHost } from "@/components/auth-toasts-host";
import { ForgotPasswordFsView } from "@/components/fs/forgot-password-fs-view";
import { NavLanding } from "@/components/nav-landing";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.auth.forgot_password"),
  };
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="auth-page">
      <NavLanding />
      <AuthToastsHost urlError={sp.error} urlMessage={sp.message}>
        <ForgotPasswordFsView />
      </AuthToastsHost>
    </div>
  );
}
