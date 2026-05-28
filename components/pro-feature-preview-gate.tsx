"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";

type ProFeaturePreviewFeature = "calendar" | "analytics";

const TITLE_KEY: Record<ProFeaturePreviewFeature, string> = {
  calendar: "subscribe.benefit.calendar.title",
  analytics: "subscribe.benefit.analytics.title",
};

/** Kopīga CTA kartīte (analītikas vārtiem vai kalendāra daļējai aizsardzībai). */
export function ProFeaturePreviewCtaCard({
  feature,
  className = "",
}: {
  feature: ProFeaturePreviewFeature;
  className?: string;
}) {
  const { t } = useSubtrackIntl();
  const title = t(TITLE_KEY[feature]);

  return (
    <div className={"pro-feature-preview-gate__card" + (className ? ` ${className}` : "")}>
      <div className="pro-feature-preview-gate__icon-wrap" aria-hidden="true">
        <i className="fa-solid fa-lock" />
      </div>
      <h3 className="pro-feature-preview-gate__title">{title}</h3>
      <Link href="/subscribe" className="btn btn-primary btn-sm pro-feature-preview-gate__cta">
        {t("dashboard.link_get_pro")}
      </Link>
    </div>
  );
}

export function ProFeaturePreviewGate({
  locked,
  feature,
  children,
  className = "",
}: {
  locked: boolean;
  feature: ProFeaturePreviewFeature;
  children: ReactNode;
  className?: string;
}) {
  const { t } = useSubtrackIntl();

  if (!locked) {
    return <>{children}</>;
  }

  return (
    <div
      className={
        "pro-feature-preview-gate pro-feature-preview-gate--locked" +
        (className ? ` ${className}` : "")
      }
    >
      <div className="pro-feature-preview-gate__content" inert>
        {children}
      </div>
      <div className="pro-feature-preview-gate__overlay">
        <ProFeaturePreviewCtaCard feature={feature} />
      </div>
    </div>
  );
}
