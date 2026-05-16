import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sistēmas iestatījumi",
};

export default function AdminSystemPage() {
  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h1 className="admin-page-title">Sistēmas iestatījumi</h1>
        <p className="admin-page-lead">
          Globālie parametri (SMTP, apkopes režīms, u.tml.). Šī sadaļa ir
          sagatavošanas stadijā — datu saglabāšana un API tiks pieslēgti vēlāk.
        </p>
      </div>
      <div className="admin-placeholder-card">
        <p>Drīzumā šeit būs konfigurācijas forma un servera vērtību lasīšana.</p>
      </div>
    </div>
  );
}
