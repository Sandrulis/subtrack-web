"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type SubscribeSuccessBillingSyncProps = {
  sessionId: string | null;
};

const SYNC_ATTEMPTS = 8;
const SYNC_DELAY_MS = 1500;

/**
 * Pēc Checkout sinhronizē `paid_plan_active` (fallback, ja webhook vēl nav).
 */
export function SubscribeSuccessBillingSync({
  sessionId,
}: SubscribeSuccessBillingSyncProps) {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (!sessionId || ran.current) return;
    ran.current = true;

    void (async () => {
      for (let attempt = 0; attempt < SYNC_ATTEMPTS; attempt++) {
        try {
          const res = await fetch("/api/billing/sync-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId }),
          });
          if (res.ok) break;
          if (res.status !== 409) break;
        } catch {
          /* webhook var vēl pabeigt */
        }
        if (attempt < SYNC_ATTEMPTS - 1) {
          await new Promise((r) => setTimeout(r, SYNC_DELAY_MS));
        }
      }
      router.refresh();
    })();
  }, [sessionId, router]);

  return null;
}
