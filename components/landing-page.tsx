import type { ReactNode } from "react";
import Link from "next/link";

const HM_Y = 2026;
const HM_M = 5;
const HM_DEMO_TODAY = 16;

const HM_CELL: Record<number, string> = {
  8: "pay-cal-cell pay-cal-cell--due pay-cal-cell--overdue",
  10: "pay-cal-cell pay-cal-cell--due",
  15: "pay-cal-cell pay-cal-cell--due",
  18: "pay-cal-cell pay-cal-cell--due",
  24: "pay-cal-cell pay-cal-cell--due",
};

export function LandingHeroCalendarMock() {
  const first = new Date(HM_Y, HM_M - 1, 1);
  const hmPad = (first.getDay() + 6) % 7;
  const hmDim = new Date(HM_Y, HM_M, 0).getDate();
  const weekdays = ["Pr", "Ot", "Tr", "Ce", "Pk", "Se", "Sv"];

  const cells: ReactNode[] = [];
  for (let i = 0; i < hmPad; i++) {
    cells.push(
      <div
        key={`pad-${i}`}
        className="pay-cal-cell pay-cal-cell--empty"
        aria-hidden="true"
      />,
    );
  }
  for (let d = 1; d <= hmDim; d++) {
    let cls = HM_CELL[d] ?? "pay-cal-cell";
    if (
      (cls === "pay-cal-cell" || !cls.includes("pay-cal-cell--overdue")) &&
      d === HM_DEMO_TODAY
    ) {
      cls += " pay-cal-cell--today";
    }
    cells.push(
      <div key={d} className={cls.trim()}>
        {d}
      </div>,
    );
  }

  return (
    <div className="dashboard-top-calendar">
      <div className="pay-calendar-card">
        <div className="pay-calendar-toolbar landing-hero-cal-toolbar">
          <span className="pay-cal-nav landing-hero-cal-nav-faux" tabIndex={-1}>
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
          </span>
          <div className="pay-calendar-title landing-hero-cal-title">
            Maijs {HM_Y}
          </div>
          <span className="pay-cal-nav landing-hero-cal-nav-faux" tabIndex={-1}>
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </span>
        </div>
        <div className="pay-calendar">
          <div className="pay-cal-weekdays">
            {weekdays.map((wd) => (
              <span key={wd} className="pay-cal-wd">
                {wd}
              </span>
            ))}
          </div>
          <div className="pay-cal-grid landing-hero-cal-grid">{cells}</div>
        </div>
        <p className="pay-calendar-hint landing-hero-cal-hint">
          <span
            className="pay-cal-legend-i pay-cal-legend-i--due"
            aria-hidden="true"
          />
          gaidāms maksājums
          <span className="pay-calendar-hint-sep">·</span>
          <span
            className="pay-cal-legend-i pay-cal-legend-i--overdue"
            aria-hidden="true"
          />
          kavēts
        </p>
      </div>
    </div>
  );
}

export function LandingHeroDashboardMock() {
  return (
    <div className="landing-hero-dashboard-mock" aria-hidden="true">
      <div className="dashboard-top-split">
        <LandingHeroCalendarMock />
        <div className="dashboard-top-aside">
          <div className="stats-row stats-row--aside landing-hero-mock-stats">
            <div className="stat-card">
              <div className="stat-label">Kopējā mēneša summa</div>
              <div className="stat-value">€184.35</div>
              <div className="stat-note">par mēnesi</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Aktīvie abonamenti</div>
              <div className="stat-value">8</div>
              <div className="stat-note">kopā</div>
            </div>
            <div className="stat-card stat-card--next-pay">
              <div className="stat-label">Nākamais maksājums</div>
              <div className="stat-next-body">
                <div className="stat-next-text">
                  <div className="stat-value stat-value--next">18. maijā</div>
                  <div className="stat-next-name">Telefona rēķins</div>
                </div>
                <div className="stat-next-amount">€30.50</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="section-header landing-hero-mock-section-h">
        <h3 className="section-heading">Jūsu abonamenti</h3>
      </div>

      <div className="sub-list landing-hero-mock-subs">
        <div className="sub-item">
          <div className="sub-item-top">
            <div className="sub-icon-col">
              <span className="sub-icon-bg">
                <i className="fa-solid fa-music" style={{ color: "#1DB954" }} />
              </span>
            </div>
            <div className="sub-main">
              <div className="sub-info">
                <div className="sub-name-row">
                  <span className="sub-name">Spotify</span>
                  <span className="sub-category-pill">Abonements</span>
                </div>
                <div className="sub-date soon">
                  <i className="fa-solid fa-hourglass-half" />
                  <span>Nākamais maksājums: 10. maijā</span>
                </div>
              </div>
              <div className="sub-right">
                <div className="sub-amount-wrap">
                  <div className="sub-amount">€9.99</div>
                  <div className="sub-period">mēnesī</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sub-item">
          <div className="sub-item-top">
            <div className="sub-icon-col">
              <span className="sub-icon-bg">
                <i className="fa-solid fa-film" style={{ color: "#E50914" }} />
              </span>
            </div>
            <div className="sub-main">
              <div className="sub-info">
                <div className="sub-name-row">
                  <span className="sub-name">Netflix</span>
                  <span className="sub-category-pill">Abonements</span>
                </div>
                <div className="sub-date">
                  <i className="fa-regular fa-calendar" />
                  <span>Nākamais maksājums: 15. maijā</span>
                </div>
              </div>
              <div className="sub-right">
                <div className="sub-amount-wrap">
                  <div className="sub-amount">€10.99</div>
                  <div className="sub-period">mēnesī</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sub-item">
          <div className="sub-item-top">
            <div className="sub-icon-col">
              <span className="sub-icon-bg">
                <i
                  className="fa-solid fa-mobile-screen-button"
                  style={{ color: "#0ea5e9" }}
                />
              </span>
            </div>
            <div className="sub-main">
              <div className="sub-info">
                <div className="sub-name-row">
                  <span className="sub-name">Telefona rēķins</span>
                  <span className="sub-category-pill">Rēķins</span>
                </div>
                <div className="sub-date">
                  <i className="fa-regular fa-calendar" />
                  <span>Nākamais maksājums: 18. maijā</span>
                </div>
              </div>
              <div className="sub-right">
                <div className="sub-amount-wrap">
                  <div className="sub-amount">€30.50</div>
                  <div className="sub-period">mēnesī</div>
                </div>
              </div>
            </div>
          </div>
          <div className="sub-term-block">
            <div className="sub-term-header">
              <div className="sub-term-label">
                <i className="fa-solid fa-hourglass-half" />
                Atmaksas termiņš: 15.06.2024 - 15.06.2027
                <span className="sub-term-atlikums">(atlikuši 26 mēneši)</span>
              </div>
              <span className="sub-term-pct">
                <strong>48%</strong> no termiņa
              </span>
            </div>
            <div className="sub-term-bar-track">
              <div
                className="sub-term-bar-fill"
                style={{ width: "48%", background: "#0ea5e9" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPageContent() {
  const year = new Date().getFullYear();
  return (
    <>
      <section className="landing-hero-section">
        <div className="landing-hero-grid">
          <div className="landing-hero-text">
            <div className="hero-badge">
              <i className="fa-solid fa-bolt" />
              Moderna abonementu pārvaldība
            </div>
            <h1 className="hero-title">
              Pārvaldi visus savus
              <br />
              abonementus un rēķinus <span>vienuviet</span>
            </h1>
            <p className="hero-subtitle">
              SubTrack palīdz sekot Netflix, Spotify, kredītiem, apdrošināšanai
              un citiem periodiskajiem maksājumiem - vienā pārskatāmā panelī ar
              kalendāru, analītiku un atgādinājumiem.
            </p>
            <div className="hero-actions">
              <Link href="/signup" className="btn btn-primary btn-lg">
                Izmēģināt bez maksas
                <i className="fa-solid fa-arrow-right" />
              </Link>
              <Link href="/dashboard" className="btn btn-outline btn-lg">
                Skatīt demonstrāciju
              </Link>
            </div>
            <div className="hero-users">
              <div className="hero-users-icons">
                <span>
                  <i className="fa-solid fa-user" />
                </span>
                <span>
                  <i className="fa-solid fa-user" />
                </span>
                <span>
                  <i className="fa-solid fa-user" />
                </span>
              </div>
              <p>Vienkāršs veids, kā kontrolēt savus ikmēneša izdevumus.</p>
            </div>
          </div>
          <div className="landing-hero-preview">
            <LandingHeroDashboardMock />
          </div>
        </div>
      </section>

      <section className="landing-trust">
        <div className="landing-trust-inner">
          <p className="trust-title">
            Kontrolē izdevumus, izvairies no aizmirstiem maksājumiem un redzi
            visu vienā vietā.
          </p>
          <div className="trust-grid">
            <div className="trust-item">
              <strong>100+</strong>
              <span>demonstrācijas ierakstu</span>
            </div>
            <div className="trust-item">
              <strong>6</strong>
              <span>maksājumu kategorijas</span>
            </div>
            <div className="trust-item">
              <strong>24/7</strong>
              <span>pieejams pārlūkā</span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features" id="features">
        <div className="features-inner">
          <div className="section-label">Iespējas</div>
          <h2 className="section-title">
            Viss nepieciešamais maksājumu pārvaldībai
          </h2>
          <p className="section-sub section-sub-wide">
            Vienkāršs, moderns un pārskatāms veids, kā kontrolēt abonementus un
            periodiskos maksājumus.
          </p>
          <div className="features-grid">
            {[
              {
                icon: "fa-solid fa-calendar-days",
                title: "Nekad neaizmirsti maksājumu",
                text: "Maksājumu kalendārs palīdz sekot visiem gaidāmajiem datumiem vienuviet.",
              },
              {
                icon: "fa-solid fa-chart-pie",
                title: "Redzi, kur aiziet tava nauda",
                text: "Analītika un kategorijas palīdz saprast ikmēneša tēriņus.",
              },
              {
                icon: "fa-solid fa-bell",
                title: "Atgādinājumi un steidzamība",
                text: "Ātri pamani gaidāmos vai kavētos maksājumus.",
              },
              {
                icon: "fa-solid fa-tags",
                title: "Pārskatāmas kategorijas",
                text: "Abonementi, kredīti, rēķini, apdrošināšana un citi maksājumi.",
              },
              {
                icon: "fa-solid fa-chart-column",
                title: "Detalizēta analītika",
                text: "Skati mēneša, gada un nākamo 30 dienu prognozes.",
              },
              {
                icon: "fa-solid fa-pen-to-square",
                title: "Vienkārša pārvaldība",
                text: "Pievieno, labo un dzēs ierakstus dažu sekunžu laikā.",
              },
            ].map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon-wrap">
                  <i className={f.icon} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="how-it-works" id="how">
        <div className="how-inner">
          <div className="section-label">Kā tas darbojas</div>
          <h2 className="section-title">Sāc izmantot dažu minūšu laikā</h2>
          <div className="steps-grid">
            <div className="step-card">
              <span>1</span>
              <h3>Pievieno maksājumus</h3>
              <p>
                Ievadi abonementus, kredītus, rēķinus vai citus periodiskos
                maksājumus.
              </p>
            </div>
            <div className="step-card">
              <span>2</span>
              <h3>Skati kalendārā</h3>
              <p>Redzi datumus, summas un nākamos maksājumus.</p>
            </div>
            <div className="step-card">
              <span>3</span>
              <h3>Kontrolē izdevumus</h3>
              <p>Analītika palīdz saprast un optimizēt tēriņus.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-explore" id="demo">
        <div className="landing-explore-inner">
          <div className="section-label">Demonstrācijas skati</div>
          <h2 className="section-title">Apskati paneli un analītiku</h2>
          <div className="landing-explore-grid">
            <Link href="/dashboard" className="landing-explore-card">
              <div className="landing-explore-card-icon">
                <i className="fa-solid fa-gauge-high" />
              </div>
              <h3>Panelis</h3>
              <p>
                Maksājumu kalendārs, statistika, saraksti un pārvaldība vienā
                vietā.
              </p>
              <span className="landing-explore-more">
                Atvērt paneli
                <i className="fa-solid fa-arrow-right" />
              </span>
            </Link>
            <Link href="/analytics" className="landing-explore-card">
              <div className="landing-explore-card-icon">
                <i className="fa-solid fa-chart-line" />
              </div>
              <h3>Analītika</h3>
              <p>Grafiki, kategoriju sadalījumi un tēriņu prognozes.</p>
              <span className="landing-explore-more">
                Atvērt analītiku
                <i className="fa-solid fa-arrow-right" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="faq-section" id="faq">
        <div className="faq-inner">
          <div className="section-label">FAQ</div>
          <h2 className="section-title">Biežāk uzdotie jautājumi</h2>
          <div className="faq-grid">
            <details className="faq-item">
              <summary>Vai dati tiek saglabāti?</summary>
              <p>
                Šī ir demonstrācijas versija: datu glabāšanu nodrošinās backend
                (Supabase), kad tas būs pieslēgts.
              </p>
            </details>
            <details className="faq-item">
              <summary>Vai darbojas mobilajās ierīcēs?</summary>
              <p>Jā, dizains ir pielāgots mazākiem ekrāniem.</p>
            </details>
            <details className="faq-item">
              <summary>Vai nepieciešama instalācija?</summary>
              <p>
                Nē, web versija darbojas pārlūkā. Vēlāk būs arī mobilst lietotne.
              </p>
            </details>
            <details className="faq-item">
              <summary>Vai tas ir gatavs produkts?</summary>
              <p>
                Tie ir izstrādes posma ekrāni; prototipa apraksts ir{" "}
                <code className="faq-code">FS/readme.md</code> sākotnējā projektā.
              </p>
            </details>
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <div className="cta-box">
          <h2>Sāc kontrolēt savus abonementus jau šodien</h2>
          <p>
            Vienkāršs veids, kā sekot visiem periodiskajiem maksājumiem
            vienuviet.
          </p>
          <div className="landing-cta-actions">
            <Link href="/signup" className="btn btn-white btn-lg">
              Izveidot kontu
              <i className="fa-solid fa-arrow-right" />
            </Link>
            <Link href="/dashboard" className="btn btn-outline-light btn-lg">
              Skatīt demonstrāciju
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p>
          &copy; {year} SubTrack - moderns abonementu un periodisko maksājumu
          prototips.
        </p>
      </footer>
    </>
  );
}
