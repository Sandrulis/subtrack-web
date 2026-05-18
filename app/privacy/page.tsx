import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.legal.privacy"),
  };
}

export default function PrivacyPage() {
  return <LegalDocumentPage doc="privacy" />;
}
