import type { SubscriptionClient } from "@/lib/subscriptions/subscription-client";

export type FamilySharingLinkStatus = "pending" | "active" | "revoked";

export type FamilySharingLinkClient = {
  id: string;
  inviteEmail: string;
  status: FamilySharingLinkStatus;
  partnerUserId: string | null;
  partnerLabel: string;
  partnerDisplayColor: string;
  combineInTotals: boolean;
  isIncoming: boolean;
};

export type FamilyShareMeta = {
  linkId: string;
  partnerUserId: string;
  partnerLabel: string;
  tintColor: string;
};

export type SubscriptionWithFamilyShare = SubscriptionClient & {
  familyShare?: FamilyShareMeta;
  readOnly?: boolean;
};

export type FamilySharingDashboardBootstrap = {
  enabled: boolean;
  links: FamilySharingLinkClient[];
};
