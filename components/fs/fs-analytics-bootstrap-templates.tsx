import type { SubscriptionClient } from "@/lib/subscriptions/subscription-client";
import type { DashboardFreeTierGatePayload } from "@/lib/subscriptions/dashboard-free-tier-gate-payload";

/** Servera FS bootstrap analītikai – ārpus klienta koka. */
export function FsAnalyticsBootstrapTemplates({
  initialSubscriptions,
  freeTierGate,
}: {
  initialSubscriptions: SubscriptionClient[];
  freeTierGate: DashboardFreeTierGatePayload;
}) {
  return (
    <>
      <template
        id="subtrack-subs-bootstrap-json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(initialSubscriptions).replace(/</g, "\\u003c"),
        }}
      />
      <template
        id="subtrack-free-tier-gate-json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(freeTierGate).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
