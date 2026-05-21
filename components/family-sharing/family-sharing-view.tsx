"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { NavDash } from "@/components/nav-dash";
import { SiteLandingFooter } from "@/components/legal/site-landing-footer";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import type { FamilySharingLinkClient } from "@/lib/family-sharing/family-sharing-types";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import { FS_COLOR_DOTS } from "@/lib/fs-icons";
import { pushDomToast } from "@/lib/push-dom-toast";
import type { FamilySharingDashboardBootstrap } from "@/lib/family-sharing/family-sharing-types";

function FamilySharingSwitch({
  checked,
  disabled,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`admin-switch${checked ? " is-on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className="admin-switch-track" aria-hidden />
      <span className="admin-switch-thumb" aria-hidden />
    </button>
  );
}

function PartnerActiveCard({
  link,
  t,
  busyId,
  onPatch,
}: {
  link: FamilySharingLinkClient;
  t: (k: string) => string;
  busyId: string | null;
  onPatch: (
    id: string,
    body: Record<string, unknown>,
  ) => Promise<boolean>;
}) {
  const busy = busyId === link.id;
  return (
    <article className="stat-card family-sharing-card">
      <div className="family-sharing-card-head">
        <div>
          <h3 className="family-sharing-card-title">{link.partnerLabel}</h3>
          <p className="family-sharing-card-meta">{t("family_sharing.lead_as_partner")}</p>
        </div>
        <span className="family-sharing-status">{t("family_sharing.status_active")}</span>
      </div>
      <div className="family-sharing-outgoing-settings">
        <span className="stat-label family-sharing-outgoing-color-label">
          {t("family_sharing.label_color")}
        </span>
        <div className="family-sharing-outgoing-color-row">
          <div className="color-picker-row family-sharing-color-picker--readonly">
            {FS_COLOR_DOTS.map((c) => (
              <span
                key={c}
                className={
                  "color-dot" + (link.partnerDisplayColor === c ? " selected" : "")
                }
                style={{ background: c }}
                aria-hidden
              />
            ))}
          </div>
          <div className="family-sharing-outgoing-aside">
            <FamilySharingSwitch
              checked={link.combineInTotals}
              disabled={busy}
              ariaLabel={t("family_sharing.label_combine")}
              onChange={(next) => void onPatch(link.id, { combineInTotals: next })}
            />
          </div>
        </div>
        <div className="family-sharing-outgoing-footer">
          <p className="form-hint family-sharing-combine-hint">{t("family_sharing.hint_combine")}</p>
          <button
            type="button"
            className="btn btn-ghost btn-sm family-sharing-revoke-link"
            disabled={busy}
            onClick={() => void onPatch(link.id, { action: "leave" })}
          >
            {t("family_sharing.btn_leave")}
          </button>
        </div>
      </div>
    </article>
  );
}

function OutgoingLinkCard({
  link,
  t,
  busyId,
  onPatch,
}: {
  link: FamilySharingLinkClient;
  t: (k: string) => string;
  busyId: string | null;
  onPatch: (
    id: string,
    body: Record<string, unknown>,
  ) => Promise<boolean>;
}) {
  if (!link.isOwner) {
    return null;
  }
  const busy = busyId === link.id;
  const statusLabel =
    link.status === "active"
      ? t("family_sharing.status_active")
      : t("family_sharing.status_pending");

  const showInviteEmailSubtitle =
    link.partnerLabel.trim().toLowerCase() !== link.inviteEmail.trim().toLowerCase();

  return (
    <article className="stat-card family-sharing-card">
      {link.status === "pending" ? (
        <>
          <div className="family-sharing-pending-title-row">
            <div className="family-sharing-pending-title-main">
              <h3 className="family-sharing-card-title">
                {showInviteEmailSubtitle ? link.partnerLabel : link.inviteEmail}
              </h3>
              {showInviteEmailSubtitle ? (
                <p className="family-sharing-card-meta">{link.inviteEmail}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm family-sharing-revoke-link"
              disabled={busy}
              onClick={() => void onPatch(link.id, { action: "revoke" })}
            >
              {t("family_sharing.btn_revoke")}
            </button>
          </div>
          <p className="family-sharing-card-meta family-sharing-pending-status">
            {statusLabel}
          </p>
        </>
      ) : (
        <div className="family-sharing-card-head">
          <div>
            <h3 className="family-sharing-card-title">{link.partnerLabel}</h3>
            <p className="family-sharing-card-meta">{link.inviteEmail}</p>
          </div>
          <span className="family-sharing-status">{statusLabel}</span>
        </div>
      )}
      {link.status === "active" ? (
        <div className="family-sharing-outgoing-settings">
          <span className="stat-label family-sharing-outgoing-color-label">
            {t("family_sharing.label_color")}
          </span>
          <div className="family-sharing-outgoing-color-row">
            <div className="color-picker-row">
              {FS_COLOR_DOTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={
                    "color-dot" + (link.partnerDisplayColor === c ? " selected" : "")
                  }
                  style={{ background: c }}
                  disabled={busy}
                  aria-label={c}
                  onClick={() => void onPatch(link.id, { color: c })}
                />
              ))}
            </div>
            <div className="family-sharing-outgoing-aside">
              <FamilySharingSwitch
                checked={link.combineInTotals}
                disabled={busy}
                ariaLabel={t("family_sharing.label_combine")}
                onChange={(next) => void onPatch(link.id, { combineInTotals: next })}
              />
            </div>
          </div>
          <div className="family-sharing-outgoing-footer">
            <p className="form-hint family-sharing-combine-hint">{t("family_sharing.hint_combine")}</p>
            <button
              type="button"
              className="btn btn-ghost btn-sm family-sharing-revoke-link"
              disabled={busy}
              onClick={() => void onPatch(link.id, { action: "revoke" })}
            >
              {t("family_sharing.btn_revoke")}
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function IncomingLinkCard({
  link,
  t,
  busyId,
  onPatch,
}: {
  link: FamilySharingLinkClient;
  t: (k: string) => string;
  busyId: string | null;
  onPatch: (
    id: string,
    body: Record<string, unknown>,
  ) => Promise<boolean>;
}) {
  const busy = busyId === link.id;
  return (
    <article className="stat-card family-sharing-card family-sharing-card--incoming">
      <div className="family-sharing-incoming-head">
        <div className="family-sharing-incoming-title-row">
          <h3 className="family-sharing-card-title">{link.partnerLabel}</h3>
          <button
            type="button"
            className="btn btn-primary btn-sm family-sharing-incoming-accept"
            disabled={busy}
            onClick={() => void onPatch(link.id, { action: "accept" })}
          >
            {t("family_sharing.btn_accept")}
          </button>
        </div>
        <p className="family-sharing-card-meta">{t("family_sharing.status_pending")}</p>
      </div>
    </article>
  );
}

export function FamilySharingView({
  userDisplay,
  initialBootstrap,
  initialLinks,
}: {
  userDisplay: NavUserDisplay | null;
  initialBootstrap: FamilySharingDashboardBootstrap;
  initialLinks: FamilySharingLinkClient[];
}) {
  const { t } = useSubtrackIntl();
  const [links, setLinks] = useState(initialLinks);
  const [email, setEmail] = useState("");
  const [inviteColor, setInviteColor] = useState(FS_COLOR_DOTS[3] ?? "#f59e0b");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [inviteBusy, setInviteBusy] = useState(false);

  const sentInvites = links.filter((l) => l.isOwner);
  const incoming = links.filter((l) => l.isIncoming);
  const sharedWithMe = links.filter(
    (l) => !l.isOwner && !l.isIncoming && l.status === "active",
  );

  const reload = useCallback(async () => {
    const res = await fetch("/api/family-sharing");
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data.links)) {
      setLinks(data.links as FamilySharingLinkClient[]);
    }
  }, []);

  async function patchLink(id: string, body: Record<string, unknown>): Promise<boolean> {
    setBusyId(id);
    try {
      const res = await fetch(`/api/family-sharing/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };
      if (!res.ok || data.success === false) {
        pushDomToast(
          typeof data.message === "string" ? data.message : t("fs.dashboard.toast_api_save_failed"),
          "error",
        );
        return false;
      }
      if (body.action === "accept") {
        pushDomToast(t("family_sharing.toast_accepted"), "success");
      } else if (body.action === "revoke" || body.action === "leave") {
        pushDomToast(t("family_sharing.toast_revoked"), "info");
      } else {
        pushDomToast(t("family_sharing.toast_saved"), "success");
      }
      await reload();
      return true;
    } finally {
      setBusyId(null);
    }
  }

  async function onInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || inviteBusy) return;
    setInviteBusy(true);
    try {
      const res = await fetch("/api/family-sharing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), color: inviteColor }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        pushDomToast(
          typeof data.message === "string" ? data.message : t("fs.dashboard.toast_api_save_failed"),
          "error",
        );
        return;
      }
      pushDomToast(t("family_sharing.toast_invited"), "success");
      setEmail("");
      await reload();
    } finally {
      setInviteBusy(false);
    }
  }

  if (!initialBootstrap.enabled) {
    return (
      <div className="app-layout app-layout-stacked">
        <NavDash userDisplay={userDisplay} />
        <main className="main-content">
          <p>{t("family_sharing.err_disabled")}</p>
          <Link href="/dashboard">{t("nav.dashboard")}</Link>
        </main>
        <SiteLandingFooter />
      </div>
    );
  }

  return (
    <div className="app-layout app-layout-stacked">
      <NavDash userDisplay={userDisplay} />
      <main className="main-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">{t("family_sharing.heading")}</h1>
            <p className="page-subtitle">{t("family_sharing.lead")}</p>
          </div>
        </header>

        <div className="family-sharing-grid">
          <section className="stat-card family-sharing-card family-sharing-card--invite">
            <h2 className="stat-label">{t("family_sharing.invite_title")}</h2>
            <form className="family-sharing-invite-form" onSubmit={onInvite}>
              <div className="form-group">
                <label htmlFor="fs-invite-email">{t("family_sharing.label_email")}</label>
                <input
                  id="fs-invite-email"
                  type="email"
                  autoComplete="email"
                  placeholder={t("family_sharing.placeholder_email")}
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t("family_sharing.label_color")}</label>
                <div className="color-picker-row">
                  {FS_COLOR_DOTS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={"color-dot" + (inviteColor === c ? " selected" : "")}
                      style={{ background: c }}
                      aria-label={c}
                      onClick={() => setInviteColor(c)}
                    />
                  ))}
                </div>
              </div>
              <div className="family-sharing-invite-actions">
                <button type="submit" className="btn btn-primary" disabled={inviteBusy}>
                  {t("family_sharing.btn_invite")}
                </button>
              </div>
            </form>
          </section>

        </div>

        <div className="family-sharing-sections">
          <section className="family-sharing-section-block" aria-labelledby="fs-incoming-heading">
            <div className="section-header family-sharing-section-block-header">
              <h2 id="fs-incoming-heading" className="section-heading">
                {t("family_sharing.section_incoming")}
              </h2>
            </div>
            {incoming.length === 0 ? (
              <div className="stat-card family-sharing-empty-card">
                <p className="family-sharing-empty-text">{t("family_sharing.empty_incoming")}</p>
              </div>
            ) : (
              <div className="family-sharing-links-grid">
                {incoming.map((link) => (
                  <IncomingLinkCard
                    key={link.id}
                    link={link}
                    t={t}
                    busyId={busyId}
                    onPatch={patchLink}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="family-sharing-section-block" aria-labelledby="fs-outgoing-heading">
            <div className="section-header family-sharing-section-block-header">
              <h2 id="fs-outgoing-heading" className="section-heading">
                {t("family_sharing.section_outgoing")}
              </h2>
            </div>
            {sentInvites.length === 0 ? (
              <div className="stat-card family-sharing-empty-card">
                <p className="family-sharing-empty-text">{t("family_sharing.empty_outgoing")}</p>
              </div>
            ) : (
              <div className="family-sharing-links-grid">
                {sentInvites.map((link) => (
                  <OutgoingLinkCard
                    key={link.id}
                    link={link}
                    t={t}
                    busyId={busyId}
                    onPatch={patchLink}
                  />
                ))}
              </div>
            )}
          </section>

          <section
            className="family-sharing-section-block"
            aria-labelledby="fs-shared-with-me-heading"
          >
            <div className="section-header family-sharing-section-block-header">
              <h2 id="fs-shared-with-me-heading" className="section-heading">
                {t("family_sharing.section_shared_with_me")}
              </h2>
            </div>
            {sharedWithMe.length === 0 ? (
              <div className="stat-card family-sharing-empty-card">
                <p className="family-sharing-empty-text">
                  {t("family_sharing.empty_shared_with_me")}
                </p>
              </div>
            ) : (
              <div className="family-sharing-links-grid">
                {sharedWithMe.map((link) => (
                  <PartnerActiveCard
                    key={link.id}
                    link={link}
                    t={t}
                    busyId={busyId}
                    onPatch={patchLink}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <SiteLandingFooter />
    </div>
  );
}
