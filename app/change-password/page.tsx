import type { Metadata } from "next";
import { ChangePasswordFsView } from "@/components/fs/change-password-fs-view";

export const metadata: Metadata = {
  title: "Mainīt paroli",
};

export default function ChangePasswordPage() {
  return (
    <div className="auth-page">
      <ChangePasswordFsView />
    </div>
  );
}
