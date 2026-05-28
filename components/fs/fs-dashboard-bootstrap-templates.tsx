import type { FamilySharingDashboardBootstrap } from "@/lib/family-sharing/family-sharing-types";
import type { SubscriptionWithFamilyShare } from "@/lib/family-sharing/family-sharing-types";
import type { DashboardFreeTierGatePayload } from "@/lib/subscriptions/dashboard-free-tier-gate-payload";
import type { SubscriptionCategoryUiOption } from "@/lib/subscriptions/subscription-categories-server";
import { getFsIconPickerSearchBootstrap } from "@/lib/fs-icon-picker-search";
import { getSubscriptionVisualSuggestBootstrap } from "@/lib/subscription-visual-suggest";

const SUBTRACK_ICON_SEARCH_BOOTSTRAP = JSON.stringify({
  icons: getFsIconPickerSearchBootstrap(),
}).replace(/</g, "\\u003c");

const SUBTRACK_VISUAL_SUGGEST_BOOTSTRAP = JSON.stringify(
  getSubscriptionVisualSuggestBootstrap(),
).replace(/</g, "\\u003c");

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
      <template
        id="subtrack-icon-search-bootstrap"
        dangerouslySetInnerHTML={{ __html: SUBTRACK_ICON_SEARCH_BOOTSTRAP }}
      />
      <template
        id="subtrack-visual-suggest-bootstrap"
        dangerouslySetInnerHTML={{ __html: SUBTRACK_VISUAL_SUGGEST_BOOTSTRAP }}
      />
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
