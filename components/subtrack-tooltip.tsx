"use client";

import { useSupportsHoverTooltip } from "@/lib/use-supports-hover-tooltip";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type SubtrackTooltipProps = {
  /** Tooltip text (shown only when non-empty after trim). */
  label: string;
  children: ReactNode;
  /** Extra classes on the outer wrapper (e.g. full-width table cells). */
  wrapperClassName?: string;
};

type AnchorPoint = { left: number; top: number };

function measureAnchor(el: HTMLElement | null): AnchorPoint | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left + r.width / 2, top: r.top };
}

/**
 * Hover/focus tooltip for fine pointers only (hidden on touch / coarse pointers).
 * Rendered with fixed positioning in a portal so parent overflow (e.g. admin tables)
 * does not clip it.
 */
export function SubtrackTooltip({ label, children, wrapperClassName }: SubtrackTooltipProps) {
  const supports = useSupportsHoverTooltip();
  const [open, setOpen] = useState(false);
  const [anchorPt, setAnchorPt] = useState<AnchorPoint | null>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const hoverAnchorRef = useRef(false);
  const hoverBubbleRef = useRef(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const text = label.trim();
  const active = supports && text.length > 0;

  const wrapClass = wrapperClassName
    ? `subtrack-tooltip-wrap ${wrapperClassName}`
    : "subtrack-tooltip-wrap";

  function openTooltip() {
    if (!active) return;
    cancelScheduledClose();
    const pt = measureAnchor(anchorRef.current);
    if (pt) setAnchorPt(pt);
    setOpen(true);
  }

  function cancelScheduledClose() {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function closeTooltip() {
    cancelScheduledClose();
    setOpen(false);
    setAnchorPt(null);
  }

  function scheduleCloseIfNotHovered(delayMs = 80) {
    cancelScheduledClose();
    closeTimerRef.current = setTimeout(() => {
      if (!hoverAnchorRef.current && !hoverBubbleRef.current) {
        closeTooltip();
      }
    }, delayMs);
  }

  function syncAnchorFromDom() {
    const pt = measureAnchor(anchorRef.current);
    if (pt) setAnchorPt(pt);
  }

  useEffect(() => {
    if (!open || !active) return undefined;

    function onScrollOrResize() {
      syncAnchorFromDom();
    }

    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, active]);

  useEffect(() => () => cancelScheduledClose(), []);

  const portalBubble =
    open &&
    active &&
    text &&
    anchorPt &&
    typeof document !== "undefined" &&
    document.body
      ? createPortal(
          <span
            role="tooltip"
            className="subtrack-tooltip-bubble is-visible"
            style={{ left: anchorPt.left, top: anchorPt.top }}
            onMouseEnter={() => {
              hoverBubbleRef.current = true;
              cancelScheduledClose();
              openTooltip();
            }}
            onMouseLeave={() => {
              hoverBubbleRef.current = false;
              scheduleCloseIfNotHovered();
            }}
          >
            {label}
          </span>,
          document.body,
        )
      : null;

  return (
    <>
      <span
        ref={anchorRef}
        className={wrapClass}
        onMouseEnter={() => {
          hoverAnchorRef.current = true;
          openTooltip();
        }}
        onMouseLeave={() => {
          hoverAnchorRef.current = false;
          scheduleCloseIfNotHovered();
        }}
        onFocusCapture={openTooltip}
        onBlurCapture={(e) => {
          const next = e.relatedTarget as Node | null;
          if (!next || !e.currentTarget.contains(next)) closeTooltip();
        }}
      >
        {children}
      </span>
      {portalBubble}
    </>
  );
}
