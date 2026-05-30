import { NextResponse } from "next/server";
import { apiJsonError } from "@/lib/api/json-response";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireApiSession } from "@/lib/api/require-api-session";
import { isValidUuid } from "@/lib/validation/uuid";
import { fetchAllowedSubscriptionCategoryKeys } from "@/lib/subscriptions/subscription-categories-server";
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
  resolveBaseAmountForDue,
} from "@/lib/subscriptions/subscription-payment";
import {
  appendNextLoanPaymentIfOwing,
  coerceLoanPaymentsFromDb,
  markPrivateLoanPaymentPaid,
  resolvePrivateLoanScheduledAmount,
  subscriptionIsPrivateLoan,
  syncPrivateLoanDerivedFields,
} from "@/lib/subscriptions/private-loan";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!isValidUuid(id, true)) {
    return apiJsonError(400, "Invalid subscription id");
  }

  const parsedBody = await parseJsonBody(request, "Invalid JSON body");
  if (!parsedBody.ok) return parsedBody.response;
  const json = parsedBody.body;
  const body = json as Record<string, unknown>;

  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  const { data: existing, error: fetchErr } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !existing) {
    return apiJsonError(404, "Update failed or not found");
  }

  const mergedName = Object.prototype.hasOwnProperty.call(body, "name")
    ? String(body.name ?? "").trim()
    : String(existing.name ?? "").trim();

  const mergedDevices = Object.prototype.hasOwnProperty.call(body, "devices")
    ? body.devices
    : existing.devices;

  const devNorm = normalizeDevicesForSubscription(mergedDevices);
  if (!devNorm.ok) {
    return apiJsonError(400, devNorm.message);
  }
  if (devNorm.devices.length > 0 && !mergedName) {
    return apiJsonError(400, "Name is required when add-ons are present");
  }

  const existingRow = existing as SubscriptionRow;
  const allowedCategories = await fetchAllowedSubscriptionCategoryKeys();

  const parsed = parseSubscriptionPatch(
    json as Parameters<typeof parseSubscriptionPatch>[0],
    existingRow,
    { allowedCategories },
  );
  if (!parsed.ok) {
    return apiJsonError(400, parsed.message);
  }

  if (isMarkPaidPatchBody(body)) {
    if (subscriptionIsPrivateLoan(existingRow)) {
      const dueIso = String(existingRow.next_payment_date ?? "").trim();
      const currentPayments = coerceLoanPaymentsFromDb(existingRow.loan_payments).map(
        (p) => ({
          id: p.id,
          date: p.date,
          amount: p.amount,
          paidOn: p.paidOn || null,
        }),
      );
      const paidOn = parsePaidOnFromPatch(
        body,
        String(existingRow.next_payment_date ?? ""),
      );
      if (!paidOn) {
        return apiJsonError(400, "paidOn must be YYYY-MM-DD");
      }
      const amountScheduled = resolvePrivateLoanScheduledAmount(existingRow, paidOn);
      const override = parseAmountPaidOverride(body.amountPaid);
      const amountPaid = override ?? amountScheduled;
      const marked = markPrivateLoanPaymentPaid(
        currentPayments,
        dueIso,
        paidOn,
        amountPaid,
      );
      if (!marked.ok) {
        return apiJsonError(400, marked.message);
      }
      const totalRepay = parseFloat(String(existingRow.loan_total_repay ?? ""));
      let nextPayments = marked.payments;
      if (Number.isFinite(totalRepay) && totalRepay > 0) {
        nextPayments = appendNextLoanPaymentIfOwing(
          nextPayments,
          totalRepay,
          dueIso,
          amountPaid,
        );
      }
      parsed.row.loan_payments = nextPayments;
      syncPrivateLoanDerivedFields(parsed.row);
      parsed.row.due_amount_override = null;
      parsed.row.due_amount_override_for = null;
    } else {
    const carryPrevious =
      existingRow.is_dynamic_amount === true &&
      existingRow.is_dynamic_carry_previous === true;
    const nextDue = String(parsed.row.next_payment_date ?? "").trim();
    if (carryPrevious && /^\d{4}-\d{2}-\d{2}$/.test(nextDue)) {
      const paidOn = parsePaidOnFromPatch(
        body,
        String(existingRow.next_payment_date ?? ""),
      );
      if (paidOn) {
        const carriedBase = resolveBaseAmountForDue(existingRow, paidOn);
        const baseNum = parseFloat(String(existingRow.amount ?? 0));
        const base = Number.isFinite(baseNum) ? baseNum : 0;
        if (Math.abs(carriedBase - base) >= 0.0001) {
          parsed.row.due_amount_override = carriedBase;
          parsed.row.due_amount_override_for = nextDue;
        } else {
          parsed.row.due_amount_override = null;
          parsed.row.due_amount_override_for = null;
        }
      } else {
        parsed.row.due_amount_override = null;
        parsed.row.due_amount_override_for = null;
      }
    } else {
      parsed.row.due_amount_override = null;
      parsed.row.due_amount_override_for = null;
    }
    }
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .update(parsed.row)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error || !data) {
    return apiJsonError(404, error?.message ?? "Update failed or not found");
  }

  let paidCalendarDays: Record<string, number> | undefined;

  if (isMarkPaidPatchBody(body) && parsed.row.next_payment_date != null) {
    const paidOn = parsePaidOnFromPatch(
      body,
      String(existingRow.next_payment_date ?? ""),
    );
    if (!paidOn) {
      return apiJsonError(400, "paidOn must be YYYY-MM-DD");
    }

    const amountScheduled =
      subscriptionIsPrivateLoan(existingRow)
        ? resolvePrivateLoanScheduledAmount(existingRow, paidOn)
        : computeScheduledPaymentAmount(existingRow, paidOn);
    const override = parseAmountPaidOverride(body.amountPaid);
    const amountPaid = override ?? amountScheduled;

    const payRes = await insertSubscriptionPayment(supabase, {
      userId: user.id,
      subscriptionId: id,
      paidOn,
      amountPaid,
      amountScheduled,
      period: String(
        subscriptionIsPrivateLoan(existingRow) ? "once" : (existingRow.period ?? "monthly"),
      ),
      nextPaymentDateAfter: String(parsed.row.next_payment_date),
    });

    if (!payRes.ok) {
      return apiJsonError(400, payRes.message);
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
  if (!isValidUuid(id, true)) {
    return apiJsonError(400, "Invalid subscription id");
  }

  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return apiJsonError(400, error.message);
  }

  return NextResponse.json({ success: true });
}
