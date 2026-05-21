import type { SubscriptionClient } from "@/lib/subscriptions/subscription-client";

export type FamilySharingLinkStatus = "pending" | "active" | "revoked";

export type FamilySharingLinkClient = {
  id: string;
  ownerUserId: string;
  inviteEmail: string;
  status: FamilySharingLinkStatus;
  partnerUserId: string | null;
  partnerLabel: string;
  /** Otras puses e-pasts (saņemts: uzaicinātāja; nosūtīts: uzaicinātā). */
  counterpartyEmail: string;
  partnerDisplayColor: string;
  /** Saskaitīt kopīgos izdevumus šī lietotāja kopsummā (owner/partner atsevišķi DB). */
  combineInTotals: boolean;
  /** Es izveidoju uzaicinājumu (redzu partnera ierakstus). */
  isOwner: boolean;
  /** Gaidu apstiprinājumu kā uzaicinātais. */
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
  /** Pašreizējā sesijas lietotāja ID (dashboard JS kopsummai). */
  viewerUserId?: string;
  links: FamilySharingLinkClient[];
};
