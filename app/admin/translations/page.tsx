import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tulkojumi",
};

export default function AdminTranslationsPage() {
  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h1 className="admin-page-title">Tulkojumi</h1>
        <p className="admin-page-lead">
          Atslēgu teksti pēc valodām - meklēšana, eksports un maiņas vēsture šeit
          būs pieejamas kā papildu funkcijas.
        </p>
      </div>
      <div className="admin-placeholder-card">
        <p>
          Līdz tulkošanas tabulas shēmai paliek plānojuma vieta UI; struktūras
          lēmums būs jāsaskaņo ar produkcijas API.
        </p>
      </div>
    </div>
  );
}
