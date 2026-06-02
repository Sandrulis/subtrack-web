import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { getSessionUserDisplaySafe } from "@/lib/auth/user-display";
import { buildPublicPageMetadata } from "@/lib/seo/public-page-metadata";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  const title = await getUiPhraseForRequest("meta.title.legal.privacy");
  return buildPublicPageMetadata({ canonicalPath: "/privacy", title });
}

export default async function PrivacyPage() {
  const userDisplay = await getSessionUserDisplaySafe();
  return <LegalDocumentPage doc="privacy" userDisplay={userDisplay} />;
}
