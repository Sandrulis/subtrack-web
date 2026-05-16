import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Lietotāji",
};

type UserRow = {
  id: string;
  name: string;
  surname: string;
  email: string;
  is_admin: number;
  created_at: string;
};

export default async function AdminUsersPage() {
  const supabase = await createServerSupabaseClient();

  const { data: rows, error } = await supabase
    .from("users")
    .select("id, name, surname, email, is_admin, created_at")
    .order("created_at", { ascending: false });

  const list = (rows ?? []) as UserRow[];

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h1 className="admin-page-title">Lietotāju saraksts</h1>
        <p className="admin-page-lead">
          Visi reģistrētie lietotāji no tabulas{" "}
          <code className="admin-inline-code">public.users</code>.
        </p>
      </div>

      {error ? (
        <div className="admin-alert admin-alert--error" role="alert">
          Neizdevās ielādēt lietotājus: {error.message}. Ja ziņojumā ir{" "}
          <strong>infinite recursion</strong> RLS politikai &quot;users&quot;,
          Supabase SQL redaktorā atkārtoti palaid pilnu{" "}
          <code className="admin-inline-code">
            database/supabase/003_admin_users_select_policy.sql
          </code>{" "}
          (funkcija <code className="admin-inline-code">current_user_is_admin</code>{" "}
          + politika <code className="admin-inline-code">users_select_all_if_admin</code>).
        </div>
      ) : list.length === 0 ? (
        <p className="admin-empty">Nav lietotāju ierakstu.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>E-pasts</th>
                <th>Vārds</th>
                <th>Uzvārds</th>
                <th>Loma</th>
                <th>Reģistrēts</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id}>
                  <td>{u.email || "–"}</td>
                  <td>{u.name?.trim() || "–"}</td>
                  <td>{u.surname?.trim() || "–"}</td>
                  <td>
                    {u.is_admin > 0 ? (
                      <span className="admin-badge admin-badge--admin">
                        Administrators
                      </span>
                    ) : (
                      <span className="admin-badge">Lietotājs</span>
                    )}
                  </td>
                  <td>{formatLvDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatLvDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("lv-LV", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}
