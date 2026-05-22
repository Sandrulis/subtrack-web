import type { Metadata } from "next";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.app.offline"),
  };
}

export default function OfflineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
