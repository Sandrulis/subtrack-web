import type { Metadata } from "next";
import { NavLanding } from "@/components/nav-landing";
import { ForgotPasswordFsView } from "@/components/fs/forgot-password-fs-view";

export const metadata: Metadata = {
  title: "Atjaunot paroli",
};

export default function ForgotPasswordPage() {
  return (
    <div className="auth-page">
      <NavLanding />
      <ForgotPasswordFsView />
    </div>
  );
}
