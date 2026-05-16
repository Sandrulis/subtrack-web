"use client";

import { useEffect, useRef, useState } from "react";

const AUTO_DISMISS_MS = 4200;

export type FlashVariant = "error" | "success";

type HoverPauseToastProps = {
  show: boolean;
  text: string;
  variant: FlashVariant;
  /** FlashParamToast: noņem query, lai pārlādējot neatkārtojas. */
  stripUrlSearchOnShow?: boolean;
  /** Pēc auto-aizvēršanas (taimeris, bez hover virs). */
  onDismissed?: () => void;
};

/**
 * Uznirstošs logs: auto-aizvēršanās; hover/pointer aptur taimeri;
 * pointer leave atsāk taimeri.
 */
export function HoverPauseToast({
  show,
  text,
  variant,
  stripUrlSearchOnShow = false,
  onDismissed,
}: HoverPauseToastProps) {
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoveringRef = useRef(false);
  const strippedRef = useRef(false);
  const onDismissedRef = useRef(onDismissed);
  onDismissedRef.current = onDismissed;

  const clearHideTimer = () => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const scheduleDismiss = () => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      if (!hoveringRef.current) {
        setVisible(false);
        onDismissedRef.current?.();
      }
    }, AUTO_DISMISS_MS);
  };

  useEffect(() => {
    if (!show || !text.trim()) {
      setVisible(false);
      strippedRef.current = false;
      clearHideTimer();
      return undefined;
    }

    setVisible(true);

    if (
      stripUrlSearchOnShow &&
      typeof window !== "undefined" &&
      window.location.search &&
      !strippedRef.current
    ) {
      strippedRef.current = true;
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.hash}`,
      );
    }

    hoveringRef.current = false;
    scheduleDismiss();

    return () => {
      clearHideTimer();
    };
  }, [show, text, variant, stripUrlSearchOnShow]);

  const onPointerEnter = () => {
    hoveringRef.current = true;
    clearHideTimer();
  };

  const onPointerLeave = () => {
    hoveringRef.current = false;
    scheduleDismiss();
  };

  if (!visible) return null;

  return (
    <div
      className={`toast toast--dismiss-hover ${variant}`}
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {variant === "error" ? (
        <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
      ) : (
        <i className="fa-solid fa-check" aria-hidden="true" />
      )}
      <span>{text}</span>
    </div>
  );
}

type FlashParamToastProps = {
  error?: string;
  message?: string;
};

/** SSR / URL parametri: kļūda vai info ziņojums. */
export function FlashParamToast({ error, message }: FlashParamToastProps) {
  const errT = typeof error === "string" ? error.trim() : "";
  const msgT = typeof message === "string" ? message.trim() : "";
  const text = errT || msgT;
  const show = Boolean(text);
  const variant: FlashVariant = errT ? "error" : "success";

  return (
    <HoverPauseToast
      show={show}
      text={text}
      variant={variant}
      stripUrlSearchOnShow
    />
  );
}
