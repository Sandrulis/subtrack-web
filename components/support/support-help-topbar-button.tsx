"use client";

import { SubtrackTooltip } from "@/components/subtrack-tooltip";
import { useSupportHelp } from "@/components/support/support-help-provider";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";

/** Atbalsta poga augšējā joslā (≥961px). */
export function SupportHelpTopbarButton() {
  const { t } = useSubtrackIntl();
  const { open } = useSupportHelp();
  const label = t("support.trigger_label");

  return (
    <SubtrackTooltip label={label} wrapperClassName="support-help-topbar-wrap">
      <button
        type="button"
        className="dash-topbar-icon-btn dash-topbar-icon-btn--support"
        aria-haspopup="dialog"
        aria-label={label}
        onClick={open}
      >
        <i className="fas fa-question" aria-hidden="true" />
      </button>
    </SubtrackTooltip>
  );
}
