import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { FsNotifyI18nBootstrap } from "@/components/fs/fs-notify-i18n-bootstrap";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { loadNavBrandSnapshot } from "@/lib/brand/nav-brand-snapshot";
import { getSessionUserDisplay } from "@/lib/auth/user-display";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.admin.shell"),
  };
}

export default async function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminUser();
  const [userDisplay, brand] = await Promise.all([
    getSessionUserDisplay(),
    loadNavBrandSnapshot(),
  ]);
  return (
    <>
      <FsNotifyI18nBootstrap />
      <AdminShell userDisplay={userDisplay} brand={brand}>
        {children}
      </AdminShell>
    </>
  );
}
