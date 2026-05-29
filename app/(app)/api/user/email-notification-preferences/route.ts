import { NextResponse } from "next/server";
import {
  readEmailNotificationPreferences,
  toEmailNotificationPreferencesJson,
  type EmailNotificationPreferences,
} from "@/lib/emails/email-notification-preferences";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Body = {
  dueToday?: unknown;
  weekly?: unknown;
  trialEnd?: unknown;
  winBack?: unknown;
};

function pickBool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }

  const { data: row } = await supabase
    .from("users")
    .select("email_notification_preferences")
    .eq("id", user.id)
    .maybeSingle();

  const current = readEmailNotificationPreferences(row?.email_notification_preferences);

  const next: EmailNotificationPreferences = {
    dueToday: pickBool(body.dueToday, current.dueToday),
    weekly: pickBool(body.weekly, current.weekly),
    trialEnd: pickBool(body.trialEnd, current.trialEnd),
    winBack: pickBool(body.winBack, current.winBack),
  };

  const { error } = await supabase
    .from("users")
    .update({ email_notification_preferences: toEmailNotificationPreferencesJson(next) })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, preferences: next });
}
