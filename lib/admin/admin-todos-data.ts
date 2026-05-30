import { requireAdminUser } from "@/lib/auth/require-admin";
import {
  ADMIN_TODO_DONE_TTL_MS,
  ADMIN_TODO_PRIORITIES,
  ADMIN_TODO_STATUSES,
  type AdminTodoPriority,
  type AdminTodoRow,
  type AdminTodoStatus,
} from "@/lib/admin/admin-todos-types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export function migrationHint(message: string): string {
  if (/relation .* does not exist/i.test(message) || /schema cache/i.test(message)) {
    return "Migrācija database/supabase/096_admin_todos.sql vēl nav palaista.";
  }
  return message;
}

export function parsePriority(raw: string): AdminTodoPriority | null {
  const p = raw.trim().toLowerCase();
  return (ADMIN_TODO_PRIORITIES as readonly string[]).includes(p)
    ? (p as AdminTodoPriority)
    : null;
}

export function parseStatus(raw: string): AdminTodoStatus | null {
  const s = raw.trim();
  return (ADMIN_TODO_STATUSES as readonly string[]).includes(s)
    ? (s as AdminTodoStatus)
    : null;
}

function doneExpiryCutoffIso(): string {
  return new Date(Date.now() - ADMIN_TODO_DONE_TTL_MS).toISOString();
}

export async function purgeExpiredAdminTodos(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
): Promise<void> {
  const cutoff = doneExpiryCutoffIso();
  await supabase
    .from("admin_todos")
    .delete()
    .eq("status", "done")
    .not("completed_at", "is", null)
    .lt("completed_at", cutoff);
}

function mapRow(raw: Record<string, unknown>): AdminTodoRow | null {
  const id = typeof raw.id === "string" ? raw.id : "";
  if (!id) return null;
  const priority = parsePriority(String(raw.priority ?? ""));
  const status = parseStatus(String(raw.status ?? ""));
  if (!priority || !status) return null;
  const sortRaw = raw.sort_order;
  const sort_order =
    typeof sortRaw === "number"
      ? Math.max(0, Math.trunc(sortRaw))
      : Number.parseInt(String(sortRaw ?? "0"), 10) || 0;
  return {
    id,
    title: String(raw.title ?? "").trim(),
    description: String(raw.description ?? ""),
    priority,
    status,
    sort_order,
    completed_at:
      typeof raw.completed_at === "string" && raw.completed_at ? raw.completed_at : null,
    created_at: String(raw.created_at ?? ""),
    updated_at: String(raw.updated_at ?? ""),
  };
}

/** Admin `/admin/todos` SSR – tikai servera komponente (ne `use server` actions fails). */
export async function loadAdminTodosForPage(): Promise<{
  rows: AdminTodoRow[];
  loadError: string | null;
}> {
  await requireAdminUser();
  const supabase = await createServerSupabaseClient();
  await purgeExpiredAdminTodos(supabase);

  const { data, error } = await supabase
    .from("admin_todos")
    .select(
      "id, title, description, priority, status, sort_order, completed_at, created_at, updated_at",
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return { rows: [], loadError: migrationHint(error.message) };
  }

  const rows: AdminTodoRow[] = [];
  for (const raw of data ?? []) {
    const row = mapRow(raw as Record<string, unknown>);
    if (!row) continue;
    if (row.status === "done") continue;
    rows.push(row);
  }
  return { rows, loadError: null };
}
