"use client";

import { useFeedback } from "@/components/feedback/feedback-provider";
import { useSuggestions } from "@/components/suggestions/suggestions-provider";
import { useSupportHelp } from "@/components/support/support-help-provider";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";

export function AuthedFooterActionLinks() {
  const { t } = useSubtrackIntl();
  const { open: openSuggestions } = useSuggestions();
  const { open: openFeedback } = useFeedback();
  const { open: openSupport } = useSupportHelp();

  return (
    <nav
      className="legal-footer-links authed-footer-action-links"
      aria-label={t("footer.authed_nav_aria")}
    >
      <button
        type="button"
        className="legal-footer-links-btn"
        onClick={openSuggestions}
      >
        {t("suggestions.trigger_label")}
      </button>
      <span className="legal-footer-links-sep" aria-hidden="true">
        ·
      </span>
      <button
        type="button"
        className="legal-footer-links-btn"
        onClick={openFeedback}
      >
        {t("feedback.trigger_label")}
      </button>
      <span className="legal-footer-links-sep" aria-hidden="true">
        ·
      </span>
      <button
        type="button"
        className="legal-footer-links-btn"
        onClick={openSupport}
      >
        {t("support.trigger_label")}
      </button>
    </nav>
  );
}
