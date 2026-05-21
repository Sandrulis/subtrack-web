"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NavDash } from "@/components/nav-dash";
import { SiteLandingFooter } from "@/components/legal/site-landing-footer";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import type {
  FamilySharingLinkClient,
  FamilySharingLinkStatus,
} from "@/lib/family-sharing/family-sharing-types";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import type { SubscriptionClient } from "@/lib/subscriptions/subscription-client";
import { FS_COLOR_DOTS } from "@/lib/fs-icons";
import { pushDomToast } from "@/lib/push-dom-toast";
import { SubtrackTooltip } from "@/components/subtrack-tooltip";
import type { FamilySharingDashboardBootstrap } from "@/lib/family-sharing/family-sharing-types";

function FamilySharingIconActionBtn({
  busy,
  disabled = false,
  className,
  iconClass,
  ariaLabel,
  onClick,
}: {
  busy: boolean;
  disabled?: boolean;
  className: string;
  iconClass: string;
  ariaLabel: string;
  onClick: () => void;
}) {
  const isDisabled = disabled || busy;
  return (
    <button
      type="button"
      className={`${className}${busy ? " is-loading" : ""}`}
      disabled={isDisabled}
      aria-busy={busy}
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={() => void onClick()}
    >
      <i
        className={`${iconClass} family-sharing-action-icon${busy ? " hidden" : ""}`}
        aria-hidden="true"
      />
      <span
        className={`mark-paid-spinner btn-spinner family-sharing-action-spinner${busy ? "" : " hidden"}`}
        aria-hidden="true"
      />
    </button>
  );
}

function FamilySharingRevokeButton({
  busy,
  disabled = false,
  t,
  onRevoke,
  labelKey = "family_sharing.btn_revoke",
}: {
  busy: boolean;
  disabled?: boolean;
  t: (k: string) => string;
  onRevoke: () => void | Promise<void>;
  labelKey?: string;
}) {
  const label = t(labelKey);
  return (
    <SubtrackTooltip label={label}>
      <FamilySharingIconActionBtn
        busy={busy}
        disabled={disabled}
        className="icon-btn delete family-sharing-revoke-btn"
        iconClass="fa-solid fa-times"
        ariaLabel={label}
        onClick={onRevoke}
      />
    </SubtrackTooltip>
  );
}

function FamilySharingLeaveButton({
  busy,
  disabled = false,
  t,
  onLeave,
}: {
  busy: boolean;
  disabled?: boolean;
  t: (k: string) => string;
  onLeave: () => void | Promise<void>;
}) {
  const label = t("family_sharing.btn_leave");
  return (
    <SubtrackTooltip label={label}>
      <FamilySharingIconActionBtn
        busy={busy}
        disabled={disabled}
        className="icon-btn delete family-sharing-leave-btn"
        iconClass="fa-solid fa-times"
        ariaLabel={label}
        onClick={onLeave}
      />
    </SubtrackTooltip>
  );
}

function FamilySharingColorPicker({
  selectedColor,
  disabled,
  savingColor,
  onPick,
}: {
  selectedColor: string;
  disabled: boolean;
  savingColor: string | null;
  onPick: (color: string) => void;
}) {
  return (
    <div className="color-picker-row family-sharing-color-picker-row">
      {FS_COLOR_DOTS.map((c) => {
        const isSaving = savingColor === c;
        const isSelected = selectedColor === c;
        return (
          <button
            key={c}
            type="button"
            className={
              "color-dot family-sharing-color-dot" +
              (isSelected ? " selected" : "") +
              (isSaving ? " is-saving" : "")
            }
            style={{ background: c }}
            disabled={disabled || (savingColor !== null && !isSaving)}
            aria-busy={isSaving}
            aria-label={c}
            onClick={() => onPick(c)}
          >
            {isSaving ? (
              <span
                className="btn-spinner family-sharing-color-dot-spinner"
                aria-hidden="true"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

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
  colorBusy,
  onPatch,
  onRequestConfirm,
}: {
  link: FamilySharingLinkClient;
  t: (k: string) => string;
  busyId: string | null;
  colorBusy: { linkId: string; color: string } | null;
  onPatch: (
    id: string,
    body: Record<string, unknown>,
  ) => Promise<boolean>;
  onRequestConfirm: (
    id: string,
    body: Record<string, unknown>,
    message: string,
  ) => void;
}) {
  const cardBusy = busyId === link.id;
  const anyBusy = busyId !== null || colorBusy !== null;
  const savingColor = colorBusy?.linkId === link.id ? colorBusy.color : null;
  return (
    <article className="stat-card family-sharing-card">
      <div className="family-sharing-card-head">
        <div className="family-sharing-partner-title-main">
          <h3 className="family-sharing-card-title">{link.partnerLabel}</h3>
          {link.counterpartyEmail ? (
            <p className="family-sharing-card-meta">{link.counterpartyEmail}</p>
          ) : null}
        </div>
        <FamilySharingLeaveButton
          busy={cardBusy}
          disabled={anyBusy}
          t={t}
          onLeave={() =>
            onRequestConfirm(
              link.id,
              { action: "leave" },
              t("family_sharing.confirm_leave").replace("{name}", link.partnerLabel),
            )
          }
        />
      </div>
      <div className="family-sharing-outgoing-settings">
        <span className="stat-label family-sharing-outgoing-color-label">
          {t("family_sharing.label_color")}
        </span>
        <div className="family-sharing-outgoing-color-row">
          <FamilySharingColorPicker
            selectedColor={link.partnerDisplayColor}
            disabled={anyBusy}
            savingColor={savingColor}
            onPick={(c) => void onPatch(link.id, { color: c })}
          />
          <div className="family-sharing-outgoing-aside family-sharing-outgoing-aside--combine">
            <FamilySharingSwitch
              checked={link.combineInTotals}
              disabled={anyBusy}
              ariaLabel={t("family_sharing.label_combine")}
              onChange={(next) => void onPatch(link.id, { combineInTotals: next })}
            />
            <p className="form-hint family-sharing-combine-hint">
              {t("family_sharing.hint_combine")}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function OutgoingLinkCard({
  link,
  t,
  busyId,
  colorBusy,
  onPatch,
  onRequestConfirm,
}: {
  link: FamilySharingLinkClient;
  t: (k: string) => string;
  busyId: string | null;
  colorBusy: { linkId: string; color: string } | null;
  onPatch: (
    id: string,
    body: Record<string, unknown>,
  ) => Promise<boolean>;
  onRequestConfirm: (
    id: string,
    body: Record<string, unknown>,
    message: string,
  ) => void;
}) {
  if (!link.isOwner) {
    return null;
  }
  const cardBusy = busyId === link.id;
  const anyBusy = busyId !== null || colorBusy !== null;
  const savingColor = colorBusy?.linkId === link.id ? colorBusy.color : null;
  const linkStatus = familyLinkStatus(link);
  const statusLabel =
    linkStatus === "active"
      ? t("family_sharing.status_active")
      : t("family_sharing.status_pending");

  const showInviteEmailSubtitle =
    link.partnerLabel.trim().toLowerCase() !== link.inviteEmail.trim().toLowerCase();

  return (
    <article className="stat-card family-sharing-card">
      {linkStatus === "pending" ? (
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
            <div className="family-sharing-card-aside family-sharing-card-aside--end">
              <FamilySharingRevokeButton
                busy={cardBusy}
                disabled={anyBusy}
                t={t}
                labelKey="family_sharing.btn_cancel_invite"
                onRevoke={() =>
                  onRequestConfirm(
                    link.id,
                    { action: "revoke" },
                    t("family_sharing.confirm_cancel_invite").replace(
                      "{name}",
                      showInviteEmailSubtitle ? link.partnerLabel : link.inviteEmail,
                    ),
                  )
                }
              />
              <p className="family-sharing-card-meta family-sharing-aside-status">
                {statusLabel}
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="family-sharing-card-head">
          <div>
            <h3 className="family-sharing-card-title">{link.partnerLabel}</h3>
            <p className="family-sharing-card-meta">{link.inviteEmail}</p>
          </div>
          <FamilySharingRevokeButton
            busy={cardBusy}
            disabled={anyBusy}
            t={t}
            onRevoke={() =>
              onRequestConfirm(
                link.id,
                { action: "revoke" },
                t("family_sharing.confirm_revoke_active").replace(
                  "{name}",
                  link.partnerLabel,
                ),
              )
            }
          />
        </div>
      )}
      {linkStatus === "active" ? (
        <div className="family-sharing-outgoing-settings">
          <span className="stat-label family-sharing-outgoing-color-label">
            {t("family_sharing.label_color")}
          </span>
          <div className="family-sharing-outgoing-color-row">
            <FamilySharingColorPicker
              selectedColor={link.partnerDisplayColor}
              disabled={anyBusy}
              savingColor={savingColor}
              onPick={(c) => void onPatch(link.id, { color: c })}
            />
            <div className="family-sharing-outgoing-aside family-sharing-outgoing-aside--combine">
              <FamilySharingSwitch
                checked={link.combineInTotals}
                disabled={anyBusy}
                ariaLabel={t("family_sharing.label_combine")}
                onChange={(next) => void onPatch(link.id, { combineInTotals: next })}
              />
              <p className="form-hint family-sharing-combine-hint">
                {t("family_sharing.hint_combine")}
              </p>
            </div>
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
  onRequestConfirm,
}: {
  link: FamilySharingLinkClient;
  t: (k: string) => string;
  busyId: string | null;
  onPatch: (
    id: string,
    body: Record<string, unknown>,
  ) => Promise<boolean>;
  onRequestConfirm: (
    id: string,
    body: Record<string, unknown>,
    message: string,
  ) => void;
}) {
  const cardBusy = busyId === link.id;
  const anyBusy = busyId !== null;
  const showInviterEmail =
    link.counterpartyEmail.length > 0 &&
    link.partnerLabel.trim().toLowerCase() !== link.counterpartyEmail.trim().toLowerCase();

  return (
    <article className="stat-card family-sharing-card family-sharing-card--incoming">
      <div className="family-sharing-incoming-head">
        <div className="family-sharing-incoming-title-row">
          <div className="family-sharing-incoming-title-main">
            <h3 className="family-sharing-card-title">{link.partnerLabel}</h3>
            {showInviterEmail ? (
              <p className="family-sharing-card-meta">{link.counterpartyEmail}</p>
            ) : null}
          </div>
          <div className="family-sharing-card-aside family-sharing-card-aside--end">
            <div className="family-sharing-incoming-actions">
              <FamilySharingIconActionBtn
                busy={cardBusy}
                disabled={anyBusy}
                className="icon-btn mark-paid family-sharing-incoming-action"
                iconClass="fa-solid fa-check"
                ariaLabel={t("family_sharing.aria_accept")}
                onClick={() => void onPatch(link.id, { action: "accept" })}
              />
              <FamilySharingIconActionBtn
                busy={cardBusy}
                disabled={anyBusy}
                className="icon-btn delete family-sharing-incoming-action"
                iconClass="fa-solid fa-times"
                ariaLabel={t("family_sharing.aria_decline")}
                onClick={() =>
                  onRequestConfirm(
                    link.id,
                    { action: "decline" },
                    t("family_sharing.confirm_decline").replace("{name}", link.partnerLabel),
                  )
                }
              />
            </div>
            <p className="family-sharing-card-meta family-sharing-aside-status">
              {t("family_sharing.status_pending")}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

type FamilySharingConfirmState = {
  linkId: string;
  body: Record<string, unknown>;
  message: string;
};

function FamilySharingConfirmModal({
  pending,
  busy,
  t,
  onCancel,
  onConfirm,
}: {
  pending: FamilySharingConfirmState | null;
  busy: boolean;
  t: (k: string) => string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!pending) return null;
  return (
    <div
      className="modal-overlay open family-sharing-confirm-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        className="modal modal-backdrop-close-confirm family-sharing-confirm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="fs-confirm-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-body">
          <div className="modal-backdrop-close-confirm-icon" aria-hidden="true">
            <i className="fa-solid fa-circle-question" />
          </div>
          <h3 id="fs-confirm-title">{t("family_sharing.confirm_title")}</h3>
          <p>{pending.message}</p>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy}
            onClick={onCancel}
          >
            {t("family_sharing.confirm_btn_cancel")}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={busy}
            aria-busy={busy}
            onClick={onConfirm}
          >
            {t("family_sharing.confirm_btn_ok")}
          </button>
        </div>
      </div>
    </div>
  );
}

function familyLinkStatus(link: FamilySharingLinkClient): FamilySharingLinkStatus {
  const s = String(link.status ?? "").trim().toLowerCase();
  if (s === "active" || s === "pending" || s === "revoked") return s;
  return "pending";
}

function FamilySharingBootstrapJson({
  bootstrap,
}: {
  bootstrap: FamilySharingDashboardBootstrap;
}) {
  const json = useMemo(
    () => JSON.stringify(bootstrap).replace(/</g, "\\u003c"),
    [bootstrap],
  );
  return (
    <template
      id="subtrack-family-sharing-bootstrap-json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

export function FamilySharingView({
  userDisplay,
  initialBootstrap,
  initialLinks,
  initialSubscriptions,
}: {
  userDisplay: NavUserDisplay | null;
  initialBootstrap: FamilySharingDashboardBootstrap;
  initialLinks: FamilySharingLinkClient[];
  initialSubscriptions: SubscriptionClient[];
}) {
  const { t } = useSubtrackIntl();
  const router = useRouter();
  const [links, setLinks] = useState(initialLinks);
  const [email, setEmail] = useState("");
  const [inviteColor, setInviteColor] = useState(FS_COLOR_DOTS[3] ?? "#f59e0b");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [colorBusy, setColorBusy] = useState<{ linkId: string; color: string } | null>(
    null,
  );
  const [inviteBusy, setInviteBusy] = useState(false);
  const [confirmPending, setConfirmPending] = useState<FamilySharingConfirmState | null>(
    null,
  );

  useEffect(() => {
    setLinks(initialLinks);
  }, [initialLinks]);

  const familyBootstrap = useMemo(
    (): FamilySharingDashboardBootstrap => ({
      enabled: initialBootstrap.enabled,
      viewerUserId: initialBootstrap.viewerUserId,
      links,
    }),
    [initialBootstrap.enabled, initialBootstrap.viewerUserId, links],
  );

  useEffect(() => {
    const win = window as Window & {
      __subtrackFamilySharingNotifyCache?: {
        enabled: boolean;
        viewerUserId: string;
        links: FamilySharingLinkClient[];
      };
    };
    win.__subtrackFamilySharingNotifyCache = {
      enabled: familyBootstrap.enabled,
      viewerUserId: familyBootstrap.viewerUserId ?? "",
      links: familyBootstrap.links,
    };
  }, [familyBootstrap]);

  const sentInvites = links.filter((l) => l.isOwner);
  const outgoingPending = sentInvites.filter(
    (l) => familyLinkStatus(l) === "pending",
  );
  const outgoingActive = sentInvites.filter(
    (l) => familyLinkStatus(l) === "active",
  );
  const incoming = links.filter((l) => l.isIncoming);
  const sharedWithMe = links.filter(
    (l) =>
      !l.isOwner &&
      !l.isIncoming &&
      familyLinkStatus(l) === "active",
  );

  const requestConfirm = useCallback(
    (linkId: string, body: Record<string, unknown>, message: string) => {
      if (busyId) return;
      setConfirmPending({ linkId, body, message });
    },
    [busyId],
  );

  const applyFamilyBootstrapPayload = useCallback((data: unknown) => {
    const rec =
      typeof data === "object" && data !== null ? (data as Record<string, unknown>) : null;
    if (!rec || !Array.isArray(rec.links)) return;
    setLinks(rec.links as FamilySharingLinkClient[]);
    const apply = (
      window as Window & { subtrackApplyFamilySharingBootstrap?: (d: unknown) => void }
    ).subtrackApplyFamilySharingBootstrap;
    if (typeof apply === "function") apply(rec);
    const notifyCache = window as Window & {
      __subtrackFamilySharingNotifyCache?: {
        enabled: boolean;
        viewerUserId: string;
        links: FamilySharingLinkClient[];
      };
    };
    notifyCache.__subtrackFamilySharingNotifyCache = {
      enabled: rec.enabled === true,
      viewerUserId: typeof rec.viewerUserId === "string" ? rec.viewerUserId : "",
      links: rec.links as FamilySharingLinkClient[],
    };
  }, []);

  const reload = useCallback(async () => {
    const res = await fetch("/api/family-sharing", { credentials: "same-origin" });
    if (!res.ok) {
      router.refresh();
      return false;
    }
    const data = await res.json();
    applyFamilyBootstrapPayload(data);
    const syncDash = (
      window as Window & { subtrackSyncFamilySharingBootstrapFromApi?: () => Promise<void> }
    ).subtrackSyncFamilySharingBootstrapFromApi;
    if (typeof syncDash === "function") {
      await syncDash();
    }
    return true;
  }, [applyFamilyBootstrapPayload, router]);

  async function runConfirmedAction(): Promise<void> {
    if (!confirmPending) return;
    const ok = await patchLink(confirmPending.linkId, confirmPending.body);
    if (ok) setConfirmPending(null);
  }

  async function patchLink(id: string, body: Record<string, unknown>): Promise<boolean> {
    const isColorPatch = body.color !== undefined;
    if (busyId || colorBusy) return false;
    if (isColorPatch) {
      setColorBusy({ linkId: id, color: String(body.color) });
    } else {
      setBusyId(id);
    }
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
      } else if (body.action === "decline") {
        pushDomToast(t("family_sharing.toast_declined"), "info");
      } else if (body.action === "revoke" || body.action === "leave") {
        pushDomToast(t("family_sharing.toast_revoked"), "info");
      } else {
        pushDomToast(t("family_sharing.toast_saved"), "success");
      }
      await reload();
      return true;
    } finally {
      setBusyId(null);
      setColorBusy(null);
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
      const refreshed = await reload();
      if (!refreshed) router.refresh();
    } finally {
      setInviteBusy(false);
    }
  }

  if (!initialBootstrap.enabled) {
    return (
      <div className="app-layout app-layout-stacked">
        <template
          id="subtrack-subs-bootstrap-json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(initialSubscriptions).replace(/</g, "\\u003c"),
          }}
        />
        <NavDash userDisplay={userDisplay} reloadSubscriptionsFromBootstrap />
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
      <template
        id="subtrack-subs-bootstrap-json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(initialSubscriptions).replace(/</g, "\\u003c"),
        }}
      />
      <FamilySharingBootstrapJson bootstrap={familyBootstrap} />
      <NavDash
        userDisplay={userDisplay}
        reloadSubscriptionsFromBootstrap
      />
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
              <div className="form-group family-sharing-invite-color-group">
                <label>{t("family_sharing.label_color")}</label>
                <div className="family-sharing-invite-color-row">
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
                  <div className="family-sharing-invite-actions">
                    <button type="submit" className="btn btn-primary" disabled={inviteBusy}>
                      {t("family_sharing.btn_invite")}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </section>

        </div>

        {incoming.length > 0 ||
        outgoingPending.length > 0 ||
        outgoingActive.length > 0 ||
        sharedWithMe.length > 0 ? (
          <div className="family-sharing-sections">
            {incoming.length > 0 ? (
              <section
                className="family-sharing-section-block"
                aria-labelledby="fs-incoming-heading"
              >
                <div className="section-header family-sharing-section-block-header">
                  <h2 id="fs-incoming-heading" className="section-heading">
                    {t("family_sharing.section_incoming")}
                  </h2>
                </div>
                <div className="family-sharing-links-grid">
                  {incoming.map((link) => (
                    <IncomingLinkCard
                      key={link.id}
                      link={link}
                      t={t}
                      busyId={busyId}
                      onPatch={patchLink}
                      onRequestConfirm={requestConfirm}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {outgoingPending.length > 0 || outgoingActive.length > 0 ? (
              <section
                className="family-sharing-section-block"
                aria-labelledby="fs-outgoing-heading"
              >
                <div className="section-header family-sharing-section-block-header">
                  <h2 id="fs-outgoing-heading" className="section-heading">
                    {t("family_sharing.section_outgoing")}
                  </h2>
                </div>
                {outgoingPending.length > 0 ? (
                  <div className="family-sharing-links-grid">
                    {outgoingPending.map((link) => (
                      <OutgoingLinkCard
                        key={link.id}
                        link={link}
                        t={t}
                        busyId={busyId}
                        colorBusy={colorBusy}
                        onPatch={patchLink}
                        onRequestConfirm={requestConfirm}
                      />
                    ))}
                  </div>
                ) : null}
                {outgoingActive.length > 0 ? (
                  <>
                    <h3 className="family-sharing-subsection-heading">
                      {t("family_sharing.section_active_outgoing")}
                    </h3>
                    <div className="family-sharing-links-grid">
                      {outgoingActive.map((link) => (
                        <OutgoingLinkCard
                          key={link.id}
                          link={link}
                          t={t}
                          busyId={busyId}
                          colorBusy={colorBusy}
                          onPatch={patchLink}
                          onRequestConfirm={requestConfirm}
                        />
                      ))}
                    </div>
                  </>
                ) : null}
              </section>
            ) : null}

            {sharedWithMe.length > 0 ? (
              <section
                className="family-sharing-section-block"
                aria-labelledby="fs-shared-with-me-heading"
              >
                <div className="section-header family-sharing-section-block-header">
                  <h2 id="fs-shared-with-me-heading" className="section-heading">
                    {t("family_sharing.section_shared_with_me")}
                  </h2>
                </div>
                <div className="family-sharing-links-grid">
                  {sharedWithMe.map((link) => (
                    <PartnerActiveCard
                      key={link.id}
                      link={link}
                      t={t}
                      busyId={busyId}
                      colorBusy={colorBusy}
                      onPatch={patchLink}
                      onRequestConfirm={requestConfirm}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </main>
      <FamilySharingConfirmModal
        pending={confirmPending}
        busy={busyId !== null}
        t={t}
        onCancel={() => {
          if (busyId) return;
          setConfirmPending(null);
        }}
        onConfirm={() => void runConfirmedAction()}
      />
      <SiteLandingFooter />
    </div>
  );
}
