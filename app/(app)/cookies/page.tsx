import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { getSessionUserDisplaySafe } from "@/lib/auth/user-display";
import { buildPublicPageMetadata } from "@/lib/seo/public-page-metadata";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  const title = await getUiPhraseForRequest("meta.title.legal.cookies");
  return buildPublicPageMetadata({ canonicalPath: "/cookies", title });
}

export default async function CookiesPage() {
  const userDisplay = await getSessionUserDisplaySafe();
  return <LegalDocumentPage doc="cookies" userDisplay={userDisplay} />;
}
