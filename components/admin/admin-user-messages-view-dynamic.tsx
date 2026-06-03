"use client";

import dynamic from "next/dynamic";
import type {
  AdminFeedbackRow,
  AdminSuggestionRow,
  AdminSupportRequestRow,
  AdminUserMessageTab,
} from "@/lib/admin/admin-user-messages-types";

const AdminUserMessagesView = dynamic(
  () =>
    import("@/components/admin/admin-user-messages-view").then((mod) => ({
      default: mod.AdminUserMessagesView,
    })),
  { ssr: false },
);

type AdminUserMessagesViewDynamicProps = {
  suggestions: AdminSuggestionRow[];
  feedback: AdminFeedbackRow[];
  supportRequests: AdminSupportRequestRow[];
  loadError: string | null;
  initialTab: AdminUserMessageTab;
};

export function AdminUserMessagesViewDynamic(props: AdminUserMessagesViewDynamicProps) {
  return <AdminUserMessagesView {...props} />;
}
