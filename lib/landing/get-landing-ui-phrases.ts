import { cache } from "react";
import { getUiPhrasesForRequest } from "@/lib/ui/server-ui-phrases";
import { LANDING_UI_PHRASE_KEYS } from "@/lib/landing/landing-phrase-keys";

export const getLandingUiPhrases = cache(async (): Promise<Record<string, string>> => {
  return getUiPhrasesForRequest(LANDING_UI_PHRASE_KEYS);
});
