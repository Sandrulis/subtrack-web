"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth/require-admin";
import {
  migrationHint,
  parsePriority,
  parseStatus,
  purgeExpiredAdminTodos,
} from "@/lib/admin/admin-todos-data";
import type { AdminTodoStatus } from "@/lib/admin/admin-todos-types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AdminTodosActionResult = { ok: true } | { ok: false; message: string };

const TITLE_MAX = 200;
const DESCRIPTION_MAX = 4000;

function readTrimmed(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function completedAtForStatus(status: AdminTodoStatus): string | null {
  return status === "done" ? new Date().toISOString() : null;
}

async function afterTodosMutation() {
  revalidatePath("/admin/todos");
}

async function nextSortOrder(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  status: AdminTodoStatus,
): Promise<number> {
  const { data } = await supabase
    .from("admin_todos")
    .select("sort_order")
    .eq("status", status)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const max =
    typeof data?.sort_order === "number"
      ? data.sort_order
      : Number.parseInt(String(data?.sort_order ?? "0"), 10) || 0;
  return max + 1;
}

export async function createAdminTodoAction(
  formData: FormData,
): Promise<AdminTodosActionResult> {
  await requireAdminUser();

  const title = readTrimmed(formData, "title");
  const description = readTrimmed(formData, "description");
  const priority = parsePriority(readTrimmed(formData, "priority")) ?? "medium";

  if (!title) return { ok: false, message: "Norādi uzdevuma nosaukumu." };
  if (title.length > TITLE_MAX) {
    return { ok: false, message: `Nosaukums drīkst būt līdz ${TITLE_MAX} rakstzīmēm.` };
  }
  if (description.length > DESCRIPTION_MAX) {
    return {
      ok: false,
      message: `Apraksts drīkst būt līdz ${DESCRIPTION_MAX} rakstzīmēm.`,
    };
  }

  const supabase = await createServerSupabaseClient();
  const sort_order = await nextSortOrder(supabase, "todo");
  const { error } = await supabase.from("admin_todos").insert({
    title,
    description,
    priority,
    status: "todo",
    sort_order,
    completed_at: null,
  });

  if (error) return { ok: false, message: migrationHint(error.message) };
  await afterTodosMutation();
  return { ok: true };
}

export async function updateAdminTodoAction(
  formData: FormData,
): Promise<AdminTodosActionResult> {
  await requireAdminUser();

  const id = readTrimmed(formData, "id");
  const title = readTrimmed(formData, "title");
  const description = readTrimmed(formData, "description");
  if (!id) return { ok: false, message: "Trūkst uzdevuma identifikatora." };
  if (!title) return { ok: false, message: "Norādi uzdevuma nosaukumu." };
  if (title.length > TITLE_MAX) {
    return { ok: false, message: `Nosaukums drīkst būt līdz ${TITLE_MAX} rakstzīmēm.` };
  }
  if (description.length > DESCRIPTION_MAX) {
    return {
      ok: false,
      message: `Apraksts drīkst būt līdz ${DESCRIPTION_MAX} rakstzīmēm.`,
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("admin_todos")
    .update({ title, description })
    .eq("id", id);

  if (error) return { ok: false, message: migrationHint(error.message) };
  await afterTodosMutation();
  return { ok: true };
}

export async function deleteAdminTodoAction(
  formData: FormData,
): Promise<AdminTodosActionResult> {
  await requireAdminUser();
  const id = readTrimmed(formData, "id");
  if (!id) return { ok: false, message: "Trūkst uzdevuma identifikatora." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("admin_todos").delete().eq("id", id);
  if (error) return { ok: false, message: migrationHint(error.message) };
  await afterTodosMutation();
  return { ok: true };
}

export async function moveAdminTodoAction(
  id: string,
  status: AdminTodoStatus,
  sortOrder?: number,
): Promise<AdminTodosActionResult> {
  await requireAdminUser();
  if (!id) return { ok: false, message: "Trūkst uzdevuma identifikatora." };
  if (!parseStatus(status)) return { ok: false, message: "Nederīgs statuss." };

  const supabase = await createServerSupabaseClient();
  await purgeExpiredAdminTodos(supabase);

  const order =
    typeof sortOrder === "number" && Number.isFinite(sortOrder)
      ? Math.max(0, Math.trunc(sortOrder))
      : await nextSortOrder(supabase, status);

  const { error } = await supabase
    .from("admin_todos")
    .update({
      status,
      sort_order: order,
      completed_at: completedAtForStatus(status),
    })
    .eq("id", id);

  if (error) return { ok: false, message: migrationHint(error.message) };
  await afterTodosMutation();
  return { ok: true };
}

export async function reorderAdminTodosColumnAction(
  status: AdminTodoStatus,
  orderedIds: string[],
): Promise<AdminTodosActionResult> {
  await requireAdminUser();
  if (!parseStatus(status)) return { ok: false, message: "Nederīgs statuss." };
  if (!orderedIds.length) return { ok: true };

  const supabase = await createServerSupabaseClient();
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("admin_todos")
      .update({ sort_order: i })
      .eq("id", orderedIds[i])
      .eq("status", status);
    if (error) return { ok: false, message: migrationHint(error.message) };
  }
  await afterTodosMutation();
  return { ok: true };
}

export async function refreshAdminTodosAction(): Promise<AdminTodosActionResult> {
  await requireAdminUser();
  const supabase = await createServerSupabaseClient();
  await purgeExpiredAdminTodos(supabase);
  await afterTodosMutation();
  return { ok: true };
}
