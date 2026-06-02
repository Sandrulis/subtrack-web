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
}: {
  previewLocked?: boolean;
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
      out.push(
        <div key={`day-${day}`} className={classes.join(" ")}>
          {day}
        </div>,
      );
    }

    return out;
  }, [previewLocked, view.m, view.y]);

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
