"use client";

import dynamic from "next/dynamic";
import type { AdminTodoRow } from "@/lib/admin/admin-todos-types";

const AdminTodosBoard = dynamic(
  () =>
    import("@/components/admin/admin-todos-board").then((mod) => ({
      default: mod.AdminTodosBoard,
    })),
  { ssr: false },
);

type AdminTodosBoardDynamicProps = {
  initialRows: AdminTodoRow[];
  loadError: string | null;
};

export function AdminTodosBoardDynamic(props: AdminTodosBoardDynamicProps) {
  return <AdminTodosBoard {...props} />;
}
