import { NextResponse } from "next/server";
import {
  readEmailNotificationPreferences,
  toEmailNotificationPreferencesJson,
  type EmailNotificationPreferences,
} from "@/lib/emails/email-notification-preferences";
import { apiJsonError } from "@/lib/api/json-response";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireApiSession } from "@/lib/api/require-api-session";

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
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) return parsedBody.response;
  const body = parsedBody.body as Body;

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
    return apiJsonError(500, error.message);
  }

  return NextResponse.json({ success: true, preferences: next });
}
