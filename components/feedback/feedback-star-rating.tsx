"use client";

import { useSubtrackIntl } from "@/components/subtrack-intl-provider";

type FeedbackStarRatingProps = {
  value: number;
  onChange?: (next: number) => void;
  disabled?: boolean;
  size?: "md" | "sm";
  labelId?: string;
};

const MAX = 5;

export function FeedbackStarRating({
  value,
  onChange,
  disabled = false,
  size = "md",
  labelId,
}: FeedbackStarRatingProps) {
  const { t } = useSubtrackIntl();
  const readOnly = onChange == null;
  const clamped = Math.min(MAX, Math.max(0, Math.trunc(value)));

  return (
    <div
      className={
        "feedback-stars" +
        (readOnly ? " feedback-stars--readonly" : "") +
        (size === "sm" ? " feedback-stars--sm" : "")
      }
      role={readOnly ? "img" : "group"}
      aria-label={
        readOnly ? t("feedback.stars_aria_value").replace("{n}", String(clamped)) : undefined
      }
      aria-labelledby={!readOnly ? labelId : undefined}
    >
      {Array.from({ length: MAX }, (_, i) => {
        const star = i + 1;
        const filled = star <= clamped;
        if (readOnly) {
          return (
            <span key={star} className="feedback-star-readonly" aria-hidden="true">
              <i className={filled ? "fas fa-star" : "far fa-star"} />
            </span>
          );
        }
        return (
          <button
            key={star}
            type="button"
            className={
              "feedback-star-btn" + (filled ? " is-filled" : "") + (disabled ? " is-disabled" : "")
            }
            disabled={disabled}
            aria-label={t("feedback.stars_aria_set").replace("{n}", String(star))}
            aria-pressed={filled}
            onClick={() => onChange(star)}
          >
            <i className={filled ? "fas fa-star" : "far fa-star"} aria-hidden="true" />
          </button>
        );
      })}
      {!readOnly ? (
        <button
          type="button"
          className="feedback-stars-clear"
          disabled={disabled || clamped === 0}
          onClick={() => onChange(0)}
        >
          {t("feedback.stars_clear")}
        </button>
      ) : null}
    </div>
  );
}
