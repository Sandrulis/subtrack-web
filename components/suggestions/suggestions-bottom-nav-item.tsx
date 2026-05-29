"use client";

import { useSuggestions } from "@/components/suggestions/suggestions-provider";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";

/** Ieteikumu poga apakšējā navigācijā (≤960px). */
export function SuggestionsBottomNavItem() {
  const { t } = useSubtrackIntl();
  const { open } = useSuggestions();
  const label = t("suggestions.trigger_label");

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
          <i className="fas fa-child mobile-bottom-nav-icon-fa" aria-hidden="true" />
        </span>
        <span className="mobile-bottom-nav-label">{label}</span>
      </span>
    </button>
  );
}
