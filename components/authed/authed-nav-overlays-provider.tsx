"use client";

import { FeedbackProvider } from "@/components/feedback/feedback-provider";
import { SuggestionsProvider } from "@/components/suggestions/suggestions-provider";
import { SupportHelpProvider } from "@/components/support/support-help-provider";
import type { ReactNode } from "react";

/** Atbalsta, ieteikumu un atsauksmju modāļi ielogotam lietotājam. */
export function AuthedNavOverlaysProvider({ children }: { children: ReactNode }) {
  return (
    <SupportHelpProvider>
      <SuggestionsProvider>
        <FeedbackProvider>{children}</FeedbackProvider>
      </SuggestionsProvider>
    </SupportHelpProvider>
  );
}
