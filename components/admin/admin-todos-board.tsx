"use client";

import {
  createAdminTodoAction,
  deleteAdminTodoAction,
  moveAdminTodoAction,
  refreshAdminTodosAction,
  reorderAdminTodosColumnAction,
  updateAdminTodoAction,
  type AdminTodosActionResult,
} from "@/lib/admin/admin-todos-actions";
import {
  ADMIN_TODO_STATUSES,
  sortAdminTodos,
  type AdminTodoRow,
  type AdminTodoStatus,
} from "@/lib/admin/admin-todos-types";
import { AdminTodosIntro } from "@/components/admin/admin-intros";
import { SubtrackTooltip } from "@/components/subtrack-tooltip";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { pushDomToast } from "@/lib/push-dom-toast";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";

type AdminTodosBoardProps = {
  initialRows: AdminTodoRow[];
  loadError: string | null;
};

type ColumnDef = { status: AdminTodoStatus; labelKey: string };

const BOARD_COLUMNS: ColumnDef[] = [
  { status: "todo", labelKey: "admin.todos.column.todo" },
  { status: "in_progress", labelKey: "admin.todos.column.in_progress" },
];

function actionToast(result: AdminTodosActionResult, t: (k: string) => string) {
  if (result.ok) {
    pushDomToast(t("admin.todos.toast.saved"), "success");
  } else {
    pushDomToast(result.message, "error");
  }
}

function groupByStatus(rows: AdminTodoRow[]): Record<AdminTodoStatus, AdminTodoRow[]> {
  const grouped: Record<AdminTodoStatus, AdminTodoRow[]> = {
    todo: [],
    in_progress: [],
    done: [],
  };
  for (const row of rows) {
    if (grouped[row.status]) grouped[row.status].push(row);
  }
  for (const status of ADMIN_TODO_STATUSES) {
    grouped[status] = sortAdminTodos(grouped[status]);
  }
  return grouped;
}

type DropInsert = {
  status: AdminTodoStatus;
  beforeId: string | null;
};

function applyTodoDrop(
  rows: AdminTodoRow[],
  draggedId: string,
  targetStatus: AdminTodoStatus,
  beforeId: string | null,
): { rows: AdminTodoRow[]; sourceStatus: AdminTodoStatus } | null {
  const dragged = rows.find((r) => r.id === draggedId);
  if (!dragged) return null;

  const sourceStatus = dragged.status;
  const without = rows.filter((r) => r.id !== draggedId);
  const lists: Record<AdminTodoStatus, AdminTodoRow[]> = {
    todo: [],
    in_progress: [],
    done: [],
  };
  for (const r of without) {
    if (lists[r.status]) lists[r.status].push(r);
  }
  for (const status of ADMIN_TODO_STATUSES) {
    lists[status] = sortAdminTodos(lists[status]);
  }

  const target = [...lists[targetStatus]];
  let insertAt = beforeId ? target.findIndex((r) => r.id === beforeId) : target.length;
  if (insertAt < 0) insertAt = target.length;

  target.splice(insertAt, 0, {
    ...dragged,
    status: targetStatus,
    sort_order: insertAt,
    updated_at: new Date().toISOString(),
  });
  lists[targetStatus] = target.map((r, i) => ({ ...r, status: targetStatus, sort_order: i }));

  if (sourceStatus !== targetStatus) {
    lists[sourceStatus] = lists[sourceStatus].map((r, i) => ({ ...r, sort_order: i }));
  }

  return { rows: [...lists.todo, ...lists.in_progress], sourceStatus };
}

function orderedIdsForStatus(rows: AdminTodoRow[], status: AdminTodoStatus): string[] {
  return sortAdminTodos(rows.filter((r) => r.status === status)).map((r) => r.id);
}

function IconPlus() {
  return (
    <svg className="admin-btn-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg className="admin-btn-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
      />
    </svg>
  );
}

function AdminTodosTrashDropZone({
  t,
  active,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  t: (k: string) => string;
  active: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  return (
    <div
      className={"admin-todos-trash-zone" + (active ? " admin-todos-trash-zone--active" : "")}
      role="region"
      aria-label={t("admin.todos.complete")}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <span className="admin-todos-trash-zone-icon" aria-hidden="true">
        <i className="fas fa-trash" />
      </span>
    </div>
  );
}

type TodoCardProps = {
  row: AdminTodoRow;
  t: (k: string) => string;
  disabled: boolean;
  onComplete: (id: string) => void;
  onEdit: (row: AdminTodoRow) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
};

function TodoCard({
  row,
  t,
  disabled,
  onComplete,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
}: TodoCardProps) {
  return (
    <article
      className="admin-todos-card"
      draggable={!disabled}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", row.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(row.id);
      }}
      onDragEnd={onDragEnd}
      onDoubleClick={() => !disabled && onEdit(row)}
    >
      <div className="admin-todos-card-head">
        <h3 className="admin-todos-card-title">{row.title}</h3>
        <div className="admin-todos-card-meta">
          <div className="admin-todos-card-actions">
            <SubtrackTooltip label={t("admin.todos.complete")}>
              <button
                type="button"
                className="admin-icon-btn admin-icon-btn--save admin-todos-icon-btn"
                disabled={disabled}
                aria-label={t("admin.todos.complete")}
                onClick={() => onComplete(row.id)}
              >
                <i className="fas fa-check" aria-hidden="true" />
              </button>
            </SubtrackTooltip>
            <SubtrackTooltip label={t("admin.todos.edit")}>
              <button
                type="button"
                className="admin-icon-btn admin-icon-btn--edit admin-todos-icon-btn"
                disabled={disabled}
                aria-label={t("admin.todos.edit")}
                onClick={() => onEdit(row)}
              >
                <i className="fas fa-edit" aria-hidden="true" />
              </button>
            </SubtrackTooltip>
            <SubtrackTooltip label={t("admin.todos.delete")}>
              <button
                type="button"
                className="admin-icon-btn admin-icon-btn--delete admin-todos-icon-btn"
                disabled={disabled}
                aria-label={t("admin.todos.delete")}
                onClick={() => onDelete(row.id)}
              >
                <IconTrash />
              </button>
            </SubtrackTooltip>
          </div>
        </div>
      </div>
      {row.description ? (
        <p className="admin-todos-card-desc">{row.description}</p>
      ) : null}
    </article>
  );
}

type TodoFormState = {
  id: string | null;
  title: string;
  description: string;
};

const emptyForm = (): TodoFormState => ({
  id: null,
  title: "",
  description: "",
});

function AdminTodosCompleteConfirmModal({
  open,
  busy,
  t,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  busy: boolean;
  t: (k: string) => string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    const tmr = window.setTimeout(() => confirmBtnRef.current?.focus(), 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(tmr);
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay modal-backdrop-close-confirm-overlay open"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        className="modal modal-backdrop-close-confirm admin-todos-complete-confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-body">
          <div
            className="modal-backdrop-close-confirm-icon admin-todos-complete-confirm-icon"
            aria-hidden="true"
          >
            <i className="fas fa-check" />
          </div>
          <h3 id={titleId}>{t("admin.todos.complete")}</h3>
          <p>{t("admin.todos.complete_confirm")}</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={onCancel}>
            {t("admin.todos.cancel")}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className="btn btn-primary"
            disabled={busy}
            aria-busy={busy}
            onClick={onConfirm}
          >
            {t("admin.todos.complete")}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminTodosDeleteConfirmModal({
  open,
  busy,
  t,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  busy: boolean;
  t: (k: string) => string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    const tmr = window.setTimeout(() => confirmBtnRef.current?.focus(), 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(tmr);
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay modal-backdrop-close-confirm-overlay open"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        className="modal modal-backdrop-close-confirm admin-todos-delete-confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-body">
          <div
            className="modal-backdrop-close-confirm-icon admin-todos-delete-confirm-icon"
            aria-hidden="true"
          >
            <i className="fa-solid fa-triangle-exclamation" />
          </div>
          <h3 id={titleId}>{t("admin.todos.delete")}</h3>
          <p>{t("admin.todos.delete_confirm")}</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={onCancel}>
            {t("admin.todos.cancel")}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className="btn btn-danger"
            disabled={busy}
            aria-busy={busy}
            onClick={onConfirm}
          >
            {t("admin.todos.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminTodosBoard({ initialRows, loadError }: AdminTodosBoardProps) {
  const { t } = useSubtrackIntl();
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<TodoFormState>(emptyForm);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropInsert, setDropInsert] = useState<DropInsert | null>(null);
  const [trashDropActive, setTrashDropActive] = useState(false);
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);
  const [completePendingId, setCompletePendingId] = useState<string | null>(null);
  const [uiPending, startUiTransition] = useTransition();
  const dropLockRef = useRef(false);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const grouped = useMemo(() => groupByStatus(rows), [rows]);

  const runRefresh = useCallback(() => {
    startUiTransition(async () => {
      await refreshAdminTodosAction();
      router.refresh();
    });
  }, [router]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") runRefresh();
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [runRefresh]);

  const openCreate = () => {
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (row: AdminTodoRow) => {
    setForm({
      id: row.id,
      title: row.title,
      description: row.description,
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setForm(emptyForm());
  };

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    if (form.id) fd.set("id", form.id);
    fd.set("title", form.title);
    fd.set("description", form.description);
    startUiTransition(async () => {
      const result = form.id
        ? await updateAdminTodoAction(fd)
        : await createAdminTodoAction(fd);
      actionToast(result, t);
      if (result.ok) {
        closeForm();
        router.refresh();
      }
    });
  };

  const requestComplete = (id: string) => {
    setCompletePendingId(id);
  };

  const cancelComplete = () => {
    if (!uiPending) setCompletePendingId(null);
  };

  const confirmComplete = () => {
    if (!completePendingId) return;
    const id = completePendingId;
    const snapshot = rows;
    setCompletePendingId(null);
    setRows((prev) => prev.filter((r) => r.id !== id));

    void moveAdminTodoAction(id, "done").then((result) => {
      if (!result.ok) {
        setRows(snapshot);
        actionToast(result, t);
        return;
      }
      pushDomToast(t("admin.todos.toast.completed"), "success");
    });
  };

  const requestDelete = (id: string) => {
    setDeletePendingId(id);
  };

  const cancelDelete = () => {
    if (!uiPending) setDeletePendingId(null);
  };

  const confirmDelete = () => {
    if (!deletePendingId) return;
    const id = deletePendingId;
    const snapshot = rows;
    setDeletePendingId(null);
    setRows((prev) => prev.filter((r) => r.id !== id));

    const fd = new FormData();
    fd.set("id", id);
    void deleteAdminTodoAction(fd).then((result) => {
      actionToast(result, t);
      if (!result.ok) setRows(snapshot);
    });
  };

  const clearDragState = () => {
    dropLockRef.current = false;
    setDraggingId(null);
    setDropInsert(null);
    setTrashDropActive(false);
  };

  const completeFromDrop = (id: string) => {
    if (dropLockRef.current || uiPending) return;
    const snapshot = rows;
    clearDragState();
    setRows((prev) => prev.filter((r) => r.id !== id));

    void moveAdminTodoAction(id, "done").then((result) => {
      if (!result.ok) {
        setRows(snapshot);
        actionToast(result, t);
        return;
      }
      pushDomToast(t("admin.todos.toast.completed"), "success");
    });
  };

  const handleTrashDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggingId) {
      e.dataTransfer.dropEffect = "none";
      return;
    }
    e.dataTransfer.dropEffect = "move";
    setTrashDropActive(true);
    setDropInsert(null);
  };

  const handleTrashDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setTrashDropActive(false);
  };

  const handleTrashDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const id = e.dataTransfer.getData("text/plain") || draggingId;
    if (!id) {
      clearDragState();
      return;
    }
    completeFromDrop(id);
  };

  const setDropFromPointer = (
    e: React.DragEvent,
    status: AdminTodoStatus,
    rowId: string | null,
    nextRowId: string | null,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggingId) {
      e.dataTransfer.dropEffect = "none";
      return;
    }
    e.dataTransfer.dropEffect = "move";
    if (rowId) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const before = e.clientY < rect.top + rect.height / 2;
      setDropInsert({ status, beforeId: before ? rowId : nextRowId });
    } else {
      setDropInsert({ status, beforeId: null });
    }
  };

  const handleDrop = (draggedId: string, insert: DropInsert) => {
    if (dropLockRef.current) return;
    const applied = applyTodoDrop(rows, draggedId, insert.status, insert.beforeId);
    if (!applied) {
      clearDragState();
      return;
    }

    dropLockRef.current = true;
    const { rows: nextRows, sourceStatus } = applied;
    const targetStatus = insert.status;
    const snapshot = rows;
    setRows(nextRows);
    clearDragState();

    const targetIds = orderedIdsForStatus(nextRows, targetStatus);
    const insertIndex = targetIds.indexOf(draggedId);
    const persist = async () => {
      if (sourceStatus !== targetStatus) {
        const moveResult = await moveAdminTodoAction(
          draggedId,
          targetStatus,
          insertIndex >= 0 ? insertIndex : undefined,
        );
        if (!moveResult.ok) return moveResult;
        const sourceIds = orderedIdsForStatus(nextRows, sourceStatus);
        if (sourceIds.length) {
          const reorderSource = await reorderAdminTodosColumnAction(sourceStatus, sourceIds);
          if (!reorderSource.ok) return reorderSource;
        }
      }
      return reorderAdminTodosColumnAction(targetStatus, targetIds);
    };

    void persist().then((result) => {
      dropLockRef.current = false;
      if (!result.ok) {
        setRows(snapshot);
        actionToast(result, t);
      }
    });
  };

  const renderKanbanColumn = (col: ColumnDef, extraClass = "") => {
    const list = grouped[col.status];
    return (
      <section key={col.status} className={"admin-todos-column" + extraClass}>
        <header className="admin-todos-column-head">
          <h2 className="admin-todos-column-title">{t(col.labelKey)}</h2>
          <span className="admin-todos-column-count">{list.length}</span>
        </header>
        <div
          className="admin-todos-column-body"
          onDragOver={(e) => setDropFromPointer(e, col.status, null, null)}
          onDrop={(e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData("text/plain") || draggingId;
            if (!id) {
              clearDragState();
              return;
            }
            const insert = dropInsert ?? { status: col.status, beforeId: null };
            handleDrop(id, insert.status === col.status ? insert : { status: col.status, beforeId: null });
          }}
        >
          {list.map((row, index) => {
            const showStripe =
              dropInsert?.status === col.status &&
              dropInsert.beforeId === row.id &&
              draggingId !== row.id;
            return (
              <div
                key={row.id}
                className={
                  "admin-todos-card-wrap" +
                  (draggingId === row.id ? " admin-todos-card-wrap--dragging" : "") +
                  (showStripe ? " admin-todos-card-wrap--drop-before" : "")
                }
                onDragOver={(e) =>
                  setDropFromPointer(e, col.status, row.id, list[index + 1]?.id ?? null)
                }
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const id = e.dataTransfer.getData("text/plain") || draggingId;
                  if (!id) {
                    clearDragState();
                    return;
                  }
                  const insert =
                    dropInsert?.status === col.status
                      ? dropInsert
                      : { status: col.status, beforeId: row.id };
                  handleDrop(id, insert);
                }}
              >
                <TodoCard
                  row={row}
                  t={t}
                  disabled={uiPending}
                  onComplete={requestComplete}
                  onEdit={openEdit}
                  onDelete={requestDelete}
                  onDragStart={setDraggingId}
                  onDragEnd={clearDragState}
                />
              </div>
            );
          })}
          {dropInsert?.status === col.status &&
          dropInsert.beforeId === null &&
          draggingId &&
          list.length > 0 ? (
            <div className="admin-todos-drop-slot" aria-hidden="true" />
          ) : null}
          {list.length === 0 ? (
            <p
              className="admin-todos-column-empty"
              onDragOver={(e) => setDropFromPointer(e, col.status, null, null)}
            >
              {t("admin.todos.column_empty")}
            </p>
          ) : null}
        </div>
      </section>
    );
  };

  return (
    <div className="admin-lang-stack admin-todos-board">
      <AdminTodosIntro
        titleActions={
          <button
            type="button"
            className="btn btn-primary admin-lang-add-btn"
            disabled={uiPending || !!loadError}
            onClick={openCreate}
          >
            <IconPlus />
            {t("admin.todos.add")}
          </button>
        }
      />

      {loadError ? (
        <div className="admin-alert admin-alert--error" role="alert">
          {loadError}
        </div>
      ) : null}

      <div className="admin-todos-layout" aria-busy={uiPending}>
        <AdminTodosTrashDropZone
          t={t}
          active={trashDropActive}
          onDragOver={handleTrashDragOver}
          onDragLeave={handleTrashDragLeave}
          onDrop={handleTrashDrop}
        />
        <div className="admin-todos-columns-top">
          {BOARD_COLUMNS.map((col) => renderKanbanColumn(col))}
        </div>
        <AdminTodosTrashDropZone
          t={t}
          active={trashDropActive}
          onDragOver={handleTrashDragOver}
          onDragLeave={handleTrashDragLeave}
          onDrop={handleTrashDrop}
        />
      </div>

      {formOpen ? (
        <div
          className="modal-overlay open"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !uiPending) closeForm();
          }}
        >
          <div
            className="modal admin-todos-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-todos-form-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <form onSubmit={submitForm}>
              <div className="modal-header">
                <h2 id="admin-todos-form-title">
                  {form.id ? t("admin.todos.form_edit") : t("admin.todos.form_new")}
                </h2>
                <button
                  type="button"
                  className="modal-close"
                  disabled={uiPending}
                  aria-label={t("admin.todos.cancel")}
                  onClick={closeForm}
                >
                  ×
                </button>
              </div>
              <div className="modal-body admin-todos-modal-body">
                <div className="form-group">
                  <label htmlFor="admin_todo_title">{t("admin.todos.field_title")}</label>
                  <input
                    id="admin_todo_title"
                    name="title"
                    required
                    maxLength={200}
                    value={form.title}
                    disabled={uiPending}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="admin_todo_description">{t("admin.todos.field_description")}</label>
                  <textarea
                    id="admin_todo_description"
                    name="description"
                    rows={4}
                    maxLength={4000}
                    value={form.description}
                    disabled={uiPending}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={uiPending}
                  onClick={closeForm}
                >
                  {t("admin.todos.cancel")}
                </button>
                <button type="submit" className="btn btn-primary" disabled={uiPending}>
                  {t("admin.todos.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <AdminTodosCompleteConfirmModal
        open={completePendingId !== null}
        busy={uiPending}
        t={t}
        onCancel={cancelComplete}
        onConfirm={confirmComplete}
      />

      <AdminTodosDeleteConfirmModal
        open={deletePendingId !== null}
        busy={uiPending}
        t={t}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
