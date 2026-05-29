"use client";

import { useFeedback } from "@/components/feedback/feedback-provider";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";

/** Atsauksmju poga apakšējā navigācijā (≤960px). */
export function FeedbackBottomNavItem() {
  const { t } = useSubtrackIntl();
  const { open } = useFeedback();
  const label = t("feedback.trigger_label");

  return (
    <button
      type="button"
      className="mobile-bottom-nav-link mobile-bottom-nav-link--action"
      aria-haspopup="dialog"
      aria-label={label}
      onClick={open}
    >
      <span className="mobile-bottom-nav-item">
        <span className="mobile-bottom-nav-icon-slot" aria-hidden="true">
          <i className="far fa-thumbs-up mobile-bottom-nav-icon-fa" aria-hidden="true" />
        </span>
        <span className="mobile-bottom-nav-label">{label}</span>
      </span>
    </button>
  );
}
