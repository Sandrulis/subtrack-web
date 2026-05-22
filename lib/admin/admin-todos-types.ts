export const ADMIN_TODO_STATUSES = ["todo", "in_progress", "done"] as const;
export type AdminTodoStatus = (typeof ADMIN_TODO_STATUSES)[number];

export const ADMIN_TODO_PRIORITIES = ["low", "medium", "high"] as const;
export type AdminTodoPriority = (typeof ADMIN_TODO_PRIORITIES)[number];

export type AdminTodoRow = {
  id: string;
  title: string;
  description: string;
  priority: AdminTodoPriority;
  status: AdminTodoStatus;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export const ADMIN_TODO_DONE_TTL_MS = 8 * 60 * 60 * 1000;

/** Manuāla kārtība: zemāks sort_order augšā; vienādi - pēc id. */
export function compareAdminTodos(a: AdminTodoRow, b: AdminTodoRow): number {
  if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
  return a.id.localeCompare(b.id);
}

export function sortAdminTodos(rows: AdminTodoRow[]): AdminTodoRow[] {
  return [...rows].sort(compareAdminTodos);
}
