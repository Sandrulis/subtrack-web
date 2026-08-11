import type { FamilySharingDashboardBootstrap } from "@/lib/family-sharing/family-sharing-types";
import type { SubscriptionWithFamilyShare } from "@/lib/family-sharing/family-sharing-types";
import type { DashboardFreeTierGatePayload } from "@/lib/subscriptions/dashboard-free-tier-gate-payload";
import type { SubscriptionCategoryUiOption } from "@/lib/subscriptions/subscription-categories-server";

function jsonTemplate(id: string, payload: unknown) {
  return (
    <template
      id={id}
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(payload).replace(/</g, "\\u003c"),
      }}
    />
  );
}

/** Servera FS bootstrap – ārpus klienta koka, lai `<template>` neizjauktu hydrāciju. */
export function FsDashboardBootstrapTemplates({
  initialSubscriptions,
  initialPaidCalendarDays = {},
  familySharingBootstrap = { enabled: false, links: [] },
  freeTierGate,
  categoryOptions = [],
  monthlyBudget = null,
  demoMode = false,
}: {
  initialSubscriptions: SubscriptionWithFamilyShare[];
  initialPaidCalendarDays?: Record<string, number>;
  familySharingBootstrap?: FamilySharingDashboardBootstrap;
  freeTierGate: DashboardFreeTierGatePayload;
  categoryOptions?: SubscriptionCategoryUiOption[];
  monthlyBudget?: number | null;
  demoMode?: boolean;
}) {
  return (
    <>
      {jsonTemplate("subtrack-subs-bootstrap-json", initialSubscriptions)}
      {jsonTemplate("subtrack-category-options-bootstrap-json", categoryOptions)}
      {!demoMode
        ? jsonTemplate("subtrack-paid-calendar-bootstrap-json", initialPaidCalendarDays)
        : null}
      {!demoMode
        ? jsonTemplate("subtrack-display-prefs-bootstrap-json", { monthlyBudget })
        : null}
      {jsonTemplate("subtrack-free-tier-gate-json", freeTierGate)}
      {!demoMode
        ? jsonTemplate(
            "subtrack-family-sharing-bootstrap-json",
            familySharingBootstrap,
          )
        : null}
    </>
  );
}
