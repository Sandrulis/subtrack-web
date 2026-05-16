import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Valodas",
};

export default function AdminLanguagesPage() {
  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h1 className="admin-page-title">Valodas</h1>
        <p className="admin-page-lead">
          Atbalstītās valodas un to statuss programmā.
        </p>
      </div>
      <div className="admin-placeholder-card">
        <p>
          Drīzumā būs CRUD vai vismaz administrēšanas skats valodu ierakstiem
          datubāzē (piem. lv, en, ru).
        </p>
      </div>
    </div>
  );
}
