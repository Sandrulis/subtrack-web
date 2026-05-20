"use client";

import {
  bumpPwaCacheRevisionAction,
  savePwaSettingsAction,
} from "@/lib/admin/pwa-actions";
import {
  PWA_DEFAULT_BACKGROUND_COLOR,
  PWA_DEFAULT_SHORT_NAME,
  PWA_DEFAULT_THEME_COLOR,
} from "@/lib/pwa/defaults";
import type { PublicPwaSettings } from "@/lib/pwa/public-pwa-settings";
import Link from "next/link";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { pushDomToast } from "@/lib/push-dom-toast";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";
import { useState, useTransition } from "react";

function PwaSwitch({
  checked,
  disabled,
  onCheckedChange,
  ariaLabelledBy,
}: {
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (next: boolean) => void;
  ariaLabelledBy: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      className={`admin-switch${checked ? " is-on" : ""}`}
      aria-checked={checked}
      aria-labelledby={ariaLabelledBy}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
    >
      <span className="admin-switch-track" aria-hidden />
      <span className="admin-switch-thumb" aria-hidden />
    </button>
  );
}

export type AdminPwaPanelProps = {
  loadError: string | null;
  initial: PublicPwaSettings;
  updatedAt: string | null;
};

export function AdminPwaPanel({ loadError, initial, updatedAt }: AdminPwaPanelProps) {
  const { t, locale, brandLogo } = useSubtrackIntl();
  const [pending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(initial.enabled);
  const [banner, setBanner] = useState(initial.installBannerEnabled);
  const [settingsInstall, setSettingsInstall] = useState(initial.installSettingsEnabled);
  const [shortName, setShortName] = useState(
    initial.shortName === PWA_DEFAULT_SHORT_NAME ? "" : initial.shortName,
  );
  const [themeColor, setThemeColor] = useState(
    initial.themeColor === PWA_DEFAULT_THEME_COLOR ? "" : initial.themeColor,
  );
  const [backgroundColor, setBackgroundColor] = useState(
    initial.backgroundColor === PWA_DEFAULT_BACKGROUND_COLOR ? "" : initial.backgroundColor,
  );
  const [cacheRevision, setCacheRevision] = useState(initial.cacheRevision);

  const intlLocale = uiLocaleCodeToBcp47ForIntl(locale);
  const updatedLabel =
    updatedAt &&
    new Intl.DateTimeFormat(intlLocale, { dateStyle: "short", timeStyle: "short" }).format(
      new Date(updatedAt),
    );

  const onSave = () => {
    const fd = new FormData();
    fd.set("pwa_enabled", enabled ? "1" : "0");
    fd.set("pwa_install_banner_enabled", banner ? "1" : "0");
    fd.set("pwa_install_settings_enabled", settingsInstall ? "1" : "0");
    fd.set("pwa_short_name", shortName);
    fd.set("pwa_theme_color", themeColor);
    fd.set("pwa_background_color", backgroundColor);
    startTransition(async () => {
      const res = await savePwaSettingsAction(fd);
      if (res.ok) {
        pushDomToast(t("admin.pwa.toast_saved"), "success");
      } else {
        pushDomToast(res.message, "error");
      }
    });
  };

  const onBumpCache = () => {
    startTransition(async () => {
      const res = await bumpPwaCacheRevisionAction();
      if (res.ok) {
        setCacheRevision((r) => r + 1);
        pushDomToast(t("admin.pwa.toast_cache_bumped"), "success");
      } else {
        pushDomToast(res.message, "error");
      }
    });
  };

  return (
    <div className="admin-lang-stack">
      {loadError ? (
        <div className="admin-alert admin-alert--error" role="alert">
          {loadError}
        </div>
      ) : null}

      <div className="admin-lang-card">
        <form
          className="admin-lang-new-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
        >
          <div
            className="form-group"
            style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}
          >
            <PwaSwitch
              checked={enabled}
              disabled={loadError !== null || pending}
              onCheckedChange={setEnabled}
              ariaLabelledBy="pwa_enabled_label"
            />
            <span id="pwa_enabled_label">{t("admin.pwa.enabled_label")}</span>
          </div>

          <div
            className="form-group"
            style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 12 }}
          >
            <PwaSwitch
              checked={banner}
              disabled={!enabled || loadError !== null || pending}
              onCheckedChange={setBanner}
              ariaLabelledBy="pwa_banner_label"
            />
            <span id="pwa_banner_label">{t("admin.pwa.banner_label")}</span>
          </div>

          <div
            className="form-group"
            style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 12 }}
          >
            <PwaSwitch
              checked={settingsInstall}
              disabled={!enabled || loadError !== null || pending}
              onCheckedChange={setSettingsInstall}
              ariaLabelledBy="pwa_settings_label"
            />
            <span id="pwa_settings_label">{t("admin.pwa.settings_install_label")}</span>
          </div>

          <p className="form-section-label" style={{ marginTop: 20 }}>
            {t("admin.pwa.section_manifest")}
          </p>

          <p className="form-hint" style={{ marginTop: 4, marginBottom: 10 }}>
            {t("admin.pwa.logo_icons_hint")}{" "}
            <Link href="/admin/system" prefetch={false}>
              {t("admin.nav.system")}
            </Link>
            . {t("admin.pwa.logo_icons_after_change")}
          </p>

          {brandLogo ? (
            <div className="admin-pwa-logo-preview" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brandLogo.icon192} alt="" width={48} height={48} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brandLogo.maskable512}
                alt=""
                width={48}
                height={48}
                className="admin-pwa-logo-preview-maskable"
              />
              <span className="form-hint">{t("admin.pwa.logo_icons_custom")}</span>
            </div>
          ) : (
            <p className="form-hint" style={{ marginBottom: 10 }}>
              {t("admin.pwa.logo_icons_default")}
            </p>
          )}

          <div className="form-group">
            <label htmlFor="pwa_short_name">{t("admin.pwa.short_name")}</label>
            <input
              id="pwa_short_name"
              name="pwa_short_name"
              type="text"
              maxLength={12}
              placeholder={PWA_DEFAULT_SHORT_NAME}
              value={shortName}
              disabled={!enabled || loadError !== null || pending}
              onChange={(e) => setShortName(e.target.value)}
            />
          </div>

          <div className="form-row" style={{ marginTop: 12 }}>
            <div className="form-group">
              <label htmlFor="pwa_theme_color">{t("admin.pwa.theme_color")}</label>
              <input
                id="pwa_theme_color"
                name="pwa_theme_color"
                type="text"
                placeholder={PWA_DEFAULT_THEME_COLOR}
                value={themeColor}
                disabled={!enabled || loadError !== null || pending}
                onChange={(e) => setThemeColor(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="pwa_background_color">{t("admin.pwa.background_color")}</label>
              <input
                id="pwa_background_color"
                name="pwa_background_color"
                type="text"
                placeholder={PWA_DEFAULT_BACKGROUND_COLOR}
                value={backgroundColor}
                disabled={!enabled || loadError !== null || pending}
                onChange={(e) => setBackgroundColor(e.target.value)}
              />
            </div>
          </div>

          <p className="form-hint" style={{ marginTop: 16 }}>
            {t("admin.pwa.hint_deploy_sw")}
          </p>

          <p className="form-hint">
            {t("admin.pwa.cache_revision")}: <strong>{cacheRevision}</strong>
            {updatedLabel ? ` · ${updatedLabel}` : ""}
          </p>

          <div className="form-actions" style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button type="submit" className="btn btn-primary" disabled={loadError !== null || pending}>
              {t("admin.pwa.save")}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={loadError !== null || pending}
              onClick={onBumpCache}
            >
              {t("admin.pwa.bump_cache")}
            </button>
            <a
              className="btn btn-ghost"
              href="/manifest.webmanifest"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("admin.pwa.preview_manifest")}
            </a>
            <a className="btn btn-ghost" href="/offline" target="_blank" rel="noopener noreferrer">
              /offline
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
