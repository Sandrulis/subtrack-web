import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { getSessionUserDisplay } from "@/lib/auth/user-display";

export const metadata: Metadata = {
  title: "Administrācija",
};

export default async function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminUser();
  const userDisplay = await getSessionUserDisplay();
  return <AdminShell userDisplay={userDisplay}>{children}</AdminShell>;
}
