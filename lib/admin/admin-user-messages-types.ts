export type AdminUserMessageTab = "suggestions" | "feedback" | "support";

export type AdminSuggestionRow = {
  id: string;
  userId: string;
  title: string;
  body: string;
  createdAt: string;
  voteCount: number;
  authorDisplay: string;
  authorEmail: string;
};

export type AdminFeedbackRow = {
  id: string;
  userId: string;
  body: string;
  starRating: number;
  approvedForLanding: boolean;
  createdAt: string;
  updatedAt: string;
  authorDisplay: string;
  authorEmail: string;
};

export type AdminSupportRequestRow = {
  id: string;
  userId: string;
  message: string;
  emailSent: boolean;
  createdAt: string;
  authorDisplay: string;
  authorEmail: string;
};

export function parseAdminUserMessageTab(raw: unknown): AdminUserMessageTab {
  const t = String(raw ?? "").trim().toLowerCase();
  if (t === "feedback" || t === "support") return t;
  return "suggestions";
}
