"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BillingSubscriptionModal } from "@/components/billing/billing-subscription-modal";
import { navUserHasProEntitlement } from "@/lib/auth/pro-plan-access";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import {
  shouldShowBillingMenu,
  type SessionBillingSummary,
} from "@/lib/billing/session-billing-summary";
import {
  DISPLAY_PREFERENCES_DEFAULTS,
  mergeDisplayPreferences,
  type DisplayPreferences,
} from "@/lib/user-display-preferences";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";

type NavUserBillingEntryProps = {
  userDisplay: NavUserDisplay | null | undefined;
  /** Aizver lietotāja izvēlni pirms modāļa atvēršanas */
  onCloseMenu: () => void;
};

export function useNavUserBillingVisible(
  userDisplay: NavUserDisplay | null | undefined,
): SessionBillingSummary | null {
  const billing = userDisplay?.billingSummary;
  if (!billing || !shouldShowBillingMenu(billing)) return null;
  if (!navUserHasProEntitlement(userDisplay)) return null;
  return billing;
}

export function NavUserBillingMenuItem({
  userDisplay,
  onCloseMenu,
  onOpenModal,
}: NavUserBillingEntryProps & {
  onOpenModal: () => void;
}) {
  const { t } = useSubtrackIntl();
  const billing = useNavUserBillingVisible(userDisplay);

  if (!billing) return null;

  return (
    <button
      type="button"
      className="dash-user-dropdown-item dash-user-dropdown-item--pro"
      role="menuitem"
      onClick={(e) => {
        e.stopPropagation();
        onCloseMenu();
        queueMicrotask(() => onOpenModal());
      }}
    >
      <i
        className="fa-solid fa-crown dash-user-dropdown-icon dash-user-dropdown-icon--fa"
        aria-hidden="true"
      />
      <span>{t("session.pro_subscription")}</span>
    </button>
  );
}

type NavUserBillingModalProps = {
  billing: SessionBillingSummary;
  displayPrefs?: DisplayPreferences;
  open: boolean;
  onClose: () => void;
};

export function NavUserBillingModal({
  billing,
  displayPrefs,
  open,
  onClose,
}: NavUserBillingModalProps) {
  const prefs = mergeDisplayPreferences(
    DISPLAY_PREFERENCES_DEFAULTS,
    displayPrefs,
  );

  return (
    <BillingSubscriptionModal
      open={open}
      onClose={onClose}
      billing={billing}
      displayPrefs={prefs}
    />
  );
}

/** Atver modāli pēc Stripe portāla (?billing=1). */
export function NavUserBillingQueryListener({
  userDisplay,
}: {
  userDisplay: NavUserDisplay | null | undefined;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const billing = useNavUserBillingVisible(userDisplay);
  const [modalOpen, setModalOpen] = useState(false);

  const clearBillingQuery = useCallback(() => {
    if (searchParams.get("billing") !== "1") return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete("billing");
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (searchParams.get("billing") === "1" && billing) {
      setModalOpen(true);
      clearBillingQuery();
    }
  }, [billing, clearBillingQuery, searchParams]);

  if (!billing) return null;

  return (
    <NavUserBillingModal
      billing={billing}
      displayPrefs={userDisplay?.displayPreferences}
      open={modalOpen}
      onClose={() => setModalOpen(false)}
    />
  );
}
