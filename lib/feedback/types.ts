export type FeedbackRow = {
  id: string;
  userId: string;
  body: string;
  starRating: number;
  approvedForLanding: boolean;
  createdAt: string;
  updatedAt: string;
  authorDisplay: string;
  isOwn: boolean;
};

/** Publiskai landing lapai (apstiprinātās). */
export type LandingFeedbackRow = {
  id: string;
  body: string;
  starRating: number;
  authorDisplay: string;
  createdAt: string;
};
