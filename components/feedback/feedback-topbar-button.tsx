"use client";

import { SubtrackTooltip } from "@/components/subtrack-tooltip";
import { useFeedback } from "@/components/feedback/feedback-provider";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";

/** Atsauksmju poga augšējā joslā (≥961px). */
export function FeedbackTopbarButton() {
  const { t } = useSubtrackIntl();
  const { open } = useFeedback();
  const label = t("feedback.trigger_label");

  return (
    <SubtrackTooltip label={label} wrapperClassName="feedback-topbar-wrap">
      <button
        type="button"
        className="dash-topbar-icon-btn dash-topbar-icon-btn--feedback"
        aria-haspopup="dialog"
        aria-label={label}
        onClick={open}
      >
        <i className="far fa-thumbs-up" aria-hidden="true" />
      </button>
    </SubtrackTooltip>
  );
}
