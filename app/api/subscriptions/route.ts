import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchSubscriptionsForSession } from "@/lib/subscriptions/fetch-subscriptions-server";
import {
  mapSubscriptionRowToClient,
  parseSubscriptionPayload,
} from "@/lib/subscriptions/subscription-map";
import type { SubscriptionRow } from "@/lib/subscriptions/subscription-client";

export async function GET() {
  try {
    const list = await fetchSubscriptionsForSession();
    return NextResponse.json({ subscriptions: list });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to load subscriptions" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = parseSubscriptionPayload(
    json as Parameters<typeof parseSubscriptionPayload>[0],
  );
  if (!parsed.ok) {
    return NextResponse.json(
      { success: false, message: parsed.message },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const insertRow = {
    ...parsed.row,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from("subscriptions")
    .insert(insertRow)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message ?? "Insert failed",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    subscription: mapSubscriptionRowToClient(data as SubscriptionRow),
  });
}
