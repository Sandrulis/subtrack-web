import type { SubscriptionClient } from "@/lib/subscriptions/subscription-client";

/** Servera FS bootstrap analītikai – ārpus klienta koka. */
export function FsAnalyticsBootstrapTemplates({
  initialSubscriptions,
}: {
  initialSubscriptions: SubscriptionClient[];
}) {
  return (
    <template
      id="subtrack-subs-bootstrap-json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(initialSubscriptions).replace(/</g, "\\u003c"),
      }}
    />
  );
}
