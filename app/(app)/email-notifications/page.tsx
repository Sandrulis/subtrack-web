import type { Metadata } from "next";
import { Suspense } from "react";
import { EmailNotificationsView } from "@/components/email-notifications/email-notifications-view";
import { getSessionUserDisplay } from "@/lib/auth/user-display";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.app.email_notifications"),
  };
}

export default async function EmailNotificationsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialPreferences: unknown = null;
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("email_notification_preferences")
      .eq("id", user.id)
      .maybeSingle();
    initialPreferences = data?.email_notification_preferences ?? null;
  }

  const userDisplay = await getSessionUserDisplay();

  return (
    <div className="auth-page">
      <Suspense fallback={null}>
        <EmailNotificationsView
          userDisplay={userDisplay}
          initialPreferences={initialPreferences}
        />
      </Suspense>
    </div>
  );
}
