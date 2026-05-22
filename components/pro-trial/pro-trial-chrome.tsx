"use client";

import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import type { ProTrialProgress } from "@/lib/auth/pro-trial-access";

function trialProgressLabel(
  t: (key: string) => string,
  progress: ProTrialProgress,
): string {
  return t("trial.progress_label")
    .replace(/\{remaining\}/g, String(progress.daysRemaining))
    .replace(/\{total\}/g, String(progress.daysTotal));
}

export function ProTrialProgressBlock({
  progress,
  fullWidth = false,
}: {
  progress: ProTrialProgress;
  /** 100% platums virs lapas satura (dashboard / analītika). */
  fullWidth?: boolean;
}) {
  const { t } = useSubtrackIntl();
  const label = trialProgressLabel(t, progress);
  const periodLabel = t("trial.period_dates")
    .replace(/\{start\}/g, progress.startsOnFormatted)
    .replace(/\{end\}/g, progress.endsOnFormatted);

  return (
    <div
      className={
        "pro-trial-page-progress" + (fullWidth ? " pro-trial-page-progress--full" : "")
      }
    >
      <div className="pro-trial-progress-head">
        <p className="pro-trial-progress-label">{label}</p>
        <p className="pro-trial-period-dates" title={periodLabel}>
          {periodLabel}
        </p>
      </div>
      <div className="pro-trial-progress-row">
        <div
          className="pro-trial-bar-track"
          role="progressbar"
          aria-valuenow={progress.percentElapsed}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        >
          <div
            className="pro-trial-bar-fill"
            style={{ width: `${progress.percentElapsed}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/** Pro badge (izmēģinājuma režīmā). */
export function ProTrialProBadge({ className = "" }: { className?: string }) {
  const { t } = useSubtrackIntl();
  return (
    <span
      className={`dash-nav-pro-pill pro-trial-pro-badge${className ? ` ${className}` : ""}`}
      title={t("trial.badge_aria")}
      aria-label={t("trial.badge_aria")}
    >
      {t("nav.pro_badge")}
    </span>
  );
}

/** Kalendāra karte: tikai Pro badge augšējā labajā stūrī (bez progress teksta). */
export function ProTrialCalendarBadge() {
  return <ProTrialProBadge className="pay-calendar-pro-badge" />;
}
