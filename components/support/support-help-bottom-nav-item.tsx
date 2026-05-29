"use client";

import { useSupportHelp } from "@/components/support/support-help-provider";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";

/** Atbalsta poga apakšējā navigācijā (≤960px). */
export function SupportHelpBottomNavItem() {
  const { t } = useSubtrackIntl();
  const { open } = useSupportHelp();
  const label = t("support.trigger_label");

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
          <i className="fas fa-question mobile-bottom-nav-icon-fa" aria-hidden="true" />
        </span>
        <span className="mobile-bottom-nav-label">{label}</span>
      </span>
    </button>
  );
}
