import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  mapSubscriptionRowToClient,
  normalizeDevicesForSubscription,
  parseSubscriptionPatch,
} from "@/lib/subscriptions/subscription-map";
import type { SubscriptionRow } from "@/lib/subscriptions/subscription-client";
import {
  computeScheduledPaymentAmount,
  fetchPaidCalendarDayCounts,
  insertSubscriptionPayment,
  isMarkPaidPatchBody,
  parseAmountPaidOverride,
  parsePaidOnFromPatch,
} from "@/lib/subscriptions/subscription-payment";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json(
      { success: false, message: "Invalid subscription id" },
      { status: 400 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const body = json as Record<string, unknown>;

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

  const { data: existing, error: fetchErr } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !existing) {
    return NextResponse.json(
      { success: false, message: "Update failed or not found" },
      { status: 404 },
    );
  }

  const mergedName = Object.prototype.hasOwnProperty.call(body, "name")
    ? String(body.name ?? "").trim()
    : String(existing.name ?? "").trim();

  const mergedDevices = Object.prototype.hasOwnProperty.call(body, "devices")
    ? body.devices
    : existing.devices;

  const devNorm = normalizeDevicesForSubscription(mergedDevices);
  if (!devNorm.ok) {
    return NextResponse.json(
      { success: false, message: devNorm.message },
      { status: 400 },
    );
  }
  if (devNorm.devices.length > 0 && !mergedName) {
    return NextResponse.json(
      {
        success: false,
        message: "Name is required when add-ons are present",
      },
      { status: 400 },
    );
  }

  const existingRow = existing as SubscriptionRow;

  const parsed = parseSubscriptionPatch(
    json as Parameters<typeof parseSubscriptionPatch>[0],
    existingRow,
  );
  if (!parsed.ok) {
    return NextResponse.json(
      { success: false, message: parsed.message },
      { status: 400 },
    );
  }

  if (isMarkPaidPatchBody(body)) {
    parsed.row.due_amount_override = null;
    parsed.row.due_amount_override_for = null;
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .update(parsed.row)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message ?? "Update failed or not found",
      },
      { status: 404 },
    );
  }

  let paidCalendarDays: Record<string, number> | undefined;

  if (isMarkPaidPatchBody(body) && parsed.row.next_payment_date != null) {
    const paidOn = parsePaidOnFromPatch(
      body,
      String(existingRow.next_payment_date ?? ""),
    );
    if (!paidOn) {
      return NextResponse.json(
        { success: false, message: "paidOn must be YYYY-MM-DD" },
        { status: 400 },
      );
    }

    const amountScheduled = computeScheduledPaymentAmount(existingRow, paidOn);
    const override = parseAmountPaidOverride(body.amountPaid);
    const amountPaid = override ?? amountScheduled;

    const payRes = await insertSubscriptionPayment(supabase, {
      userId: user.id,
      subscriptionId: id,
      paidOn,
      amountPaid,
      amountScheduled,
      period: String(existingRow.period ?? "monthly"),
      nextPaymentDateAfter: String(parsed.row.next_payment_date),
    });

    if (!payRes.ok) {
      return NextResponse.json(
        { success: false, message: payRes.message },
        { status: 400 },
      );
    }

    paidCalendarDays = await fetchPaidCalendarDayCounts(supabase, user.id);
  }

  const payload: {
    success: true;
    subscription: ReturnType<typeof mapSubscriptionRowToClient>;
    paidCalendarDays?: Record<string, number>;
  } = {
    success: true,
    subscription: mapSubscriptionRowToClient(data as SubscriptionRow),
  };
  if (paidCalendarDays) {
    payload.paidCalendarDays = paidCalendarDays;
  }

  return NextResponse.json(payload);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json(
      { success: false, message: "Invalid subscription id" },
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

  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true });
}
