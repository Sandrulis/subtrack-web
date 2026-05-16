import type { Metadata } from "next";
import { ChangePasswordFsView } from "@/components/fs/change-password-fs-view";
import { getSessionUserDisplay } from "@/lib/auth/user-display";

export const metadata: Metadata = {
  title: "Mainīt paroli",
};

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const userDisplay = await getSessionUserDisplay();
  const sp = await searchParams;

  return (
    <div className="auth-page">
      <ChangePasswordFsView
        userDisplay={userDisplay}
        flashError={sp.error}
        flashMessage={sp.message}
      />
    </div>
  );
}
