import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { getSessionUserDisplaySafe } from "@/lib/auth/user-display";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.legal.terms"),
  };
}

export default async function TermsPage() {
  const userDisplay = await getSessionUserDisplaySafe();
  return <LegalDocumentPage doc="terms" userDisplay={userDisplay} />;
}
