"use client";

import { SubtrackTooltip } from "@/components/subtrack-tooltip";
import { useSuggestions } from "@/components/suggestions/suggestions-provider";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";

/** Ieteikumu poga augšējā joslā (≥961px). */
export function SuggestionsTopbarButton() {
  const { t } = useSubtrackIntl();
  const { open } = useSuggestions();
  const label = t("suggestions.trigger_label");

  return (
    <SubtrackTooltip label={label} wrapperClassName="suggestions-topbar-wrap">
      <button
        type="button"
        className="dash-topbar-icon-btn dash-topbar-icon-btn--suggestions"
        aria-haspopup="dialog"
        aria-label={label}
        onClick={open}
      >
        <i className="fas fa-child" aria-hidden="true" />
      </button>
    </SubtrackTooltip>
  );
}
