"use client";

import { useMemo, type ReactNode } from "react";
import { calendarWeekdayHeaders } from "@/lib/dashboard/payment-calendar-weekdays";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";

function cellPreviewLocked(cellIndex: number, previewLocked: boolean): boolean {
  return previewLocked && Math.floor(cellIndex / 7) >= 1;
}

/**
 * Sākotnējais kalendāra režģis (pirms `dashboard.js` boot), lai tukšā panelī
 * kalendārs jau ir redzams.
 */
export function DashboardPayCalendarInitial({
  previewLocked = false,
  dueCountByDay,
  paidDays,
}: {
  previewLocked?: boolean;
  dueCountByDay?: Record<number, number>;
  /** Samaksāto dienu numuri (1–31) šajā mēnesī. */
  paidDays?: number[];
}) {
  const { locale } = useSubtrackIntl();
  const intlLocale = uiLocaleCodeToBcp47ForIntl(locale);

  const view = useMemo(() => {
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() };
  }, []);

  const weekdays = useMemo(
    () => calendarWeekdayHeaders(intlLocale),
    [intlLocale],
  );

  const paidDaySet = useMemo(() => {
    const out = new Set<number>();
    if (!paidDays) return out;
    for (const d of paidDays) {
      if (d >= 1 && d <= 31) out.add(d);
    }
    return out;
  }, [paidDays]);

  const cells = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const first = new Date(view.y, view.m, 1);
    const startPad = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
    const out: ReactNode[] = [];

    for (let i = 0; i < startPad; i++) {
      const classes = ["pay-cal-cell", "pay-cal-cell--empty"];
      if (cellPreviewLocked(i, previewLocked)) {
        classes.push("pay-cal-cell--preview-week-lock");
      }
      out.push(
        <div key={`pad-${i}`} className={classes.join(" ")} aria-hidden="true" />,
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(view.y, view.m, day);
      cellDate.setHours(0, 0, 0, 0);
      const classes = ["pay-cal-cell"];
      const idx = startPad + day - 1;
      if (cellPreviewLocked(idx, previewLocked)) {
        classes.push("pay-cal-cell--preview-week-lock");
      }
      if (cellDate.getTime() === today.getTime()) {
        classes.push("pay-cal-cell--today");
      }

      const dueCount = dueCountByDay?.[day] ?? 0;
      const isPaid = paidDaySet.has(day);
      const children: ReactNode[] = [day];

      if (dueCount > 0) {
        classes.push("pay-cal-cell--due");
        if (cellDate.getTime() < today.getTime()) {
          classes.push("pay-cal-cell--overdue");
        }
        if (isPaid) {
          classes.push("pay-cal-cell--due-with-paid");
        }
        if (dueCount > 1) {
          children.push(
            <span key="more" className="pay-cal-cell-more" aria-hidden="true">
              +{dueCount}
            </span>,
          );
        }
      } else if (isPaid) {
        classes.push("pay-cal-cell--paid-past");
      }

      out.push(
        <div key={`day-${day}`} className={classes.join(" ")}>
          {children}
        </div>,
      );
    }

    return out;
  }, [dueCountByDay, paidDaySet, previewLocked, view.m, view.y]);

  return (
    <>
      <div className="pay-cal-weekdays">
        {weekdays.map((wd) => (
          <span key={wd} className="pay-cal-wd">
            {wd}
          </span>
        ))}
      </div>
      <div className="pay-cal-grid">{cells}</div>
    </>
  );
}
