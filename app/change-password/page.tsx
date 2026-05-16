import type { Metadata } from "next";
import { FsNotifyI18nBootstrap } from "@/components/fs/fs-notify-i18n-bootstrap";
import { ChangePasswordFsView } from "@/components/fs/change-password-fs-view";
import { getSessionUserDisplay } from "@/lib/auth/user-display";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.auth.change_password"),
  };
}

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const userDisplay = await getSessionUserDisplay();
  const sp = await searchParams;

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
