"use client";

import { useFormStatus } from "react-dom";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";

export type AuthSubmitButtonProps = {
  /** Tulkošanas atslēga pogas tekstam (prioritāte pār `label`). */
  labelKey?: string;
  /** Tulkošanas atslēga pogas tekstam ielādes laikā. */
  pendingLabelKey?: string;
  /** Teksts, ja nav `labelKey`. */
  label?: string;
  /** Teksts ielādes laikā, ja nav `pendingLabelKey`. */
  pendingLabel?: string;
  /** Statusa rindiņa zem pogas ielādes laikā. */
  statusDetailKey: string;
  disabled?: boolean;
  /** Ja `useActionState` vai cits avots - pārraksta `useFormStatus`. */
  pending?: boolean;
  className?: string;
};

export function AuthSubmitButton({
  labelKey,
  pendingLabelKey,
  label,
  pendingLabel,
  statusDetailKey,
  disabled = false,
  pending: pendingOverride,
  className = "btn btn-primary btn-block",
}: AuthSubmitButtonProps) {
  const { pending: formPending } = useFormStatus();
  const { t } = useSubtrackIntl();
  const isBusy = pendingOverride ?? formPending;
  const isDisabled = disabled || isBusy;

  const idleLabel = labelKey ? t(labelKey) : (label ?? "");
  const busyLabel = pendingLabelKey
    ? t(pendingLabelKey)
    : (pendingLabel ?? idleLabel);

  return (
    <>
      <button
        type="submit"
        className={`${className}${isBusy ? " is-loading" : ""}`}
        disabled={isDisabled}
        aria-busy={isBusy}
      >
        <span className="auth-submit-btn-inner">
          <span
            className={`btn-spinner auth-submit-spinner${isBusy ? "" : " hidden"}`}
            aria-hidden="true"
          />
          <span>{isBusy ? busyLabel : idleLabel}</span>
        </span>
      </button>
      {isBusy ? (
        <p className="auth-submit-status" role="status" aria-live="polite">
          {t(statusDetailKey)}
        </p>
      ) : null}
    </>
  );
}
