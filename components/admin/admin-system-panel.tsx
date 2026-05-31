"use client";

import { saveSystemSettingsAction } from "@/lib/admin/system-actions";
import {
  formatDisplayPreferencesPreview,
  type DisplayPreferences,
} from "@/lib/user-display-preferences";
import { pushDomToast } from "@/lib/push-dom-toast";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";
import { AdminSystemLogoUpload } from "@/components/admin/admin-system-logo-upload";
import { AdminSystemTopbarLogoUpload } from "@/components/admin/admin-system-topbar-logo-upload";
import {
  formatPaidPlanDiscountPercent,
  isValidPaidPlanAnnualPrice,
  paidPlanAnnualDiscountPercent,
  paidPlanAnnualEquivMonthlyFromAnnual,
} from "@/lib/paid-plan-annual";
import {
  formatLifetimeEndsAtForDatetimeLocal,
  type PaidPlanLifetimeConfig,
} from "@/lib/paid-plan-lifetime";
import { useEffect, useMemo, useRef, useState } from "react";

export type AdminSystemPanelProps = {
  loadError: string | null;
  initialSystemName: string;
  initialSupportContactEmail: string;
  initialLogoRevision: number;
  initialTopbarLogoRevision: number;
  initialDefaults: DisplayPreferences;
  initialPaidPlan: {
    enabled: boolean;
    priceEur: number;
    freeSubscriptionLimit: number;
    annualBillingEnabled: boolean;
    annualPriceEur: number | null;
  };
  initialProTrial: {
    enabled: boolean;
    days: number;
  };
  initialPaidPlanLifetime: PaidPlanLifetimeConfig;
};

const AUTOSAVE_DEBOUNCE_MS = 450;

type SaveHud = "idle" | "saving" | "saved";

function PaidPlanSwitch({
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

function buildFormData(
  systemName: string,
  supportContactEmail: string,
  prefs: DisplayPreferences,
  paid: {
    enabled: boolean;
    priceEur: number;
    freeSubscriptionLimit: number;
    annualBillingEnabled: boolean;
    annualPriceEur: number | null;
  },
  trial: { enabled: boolean; days: number },
  lifetime: PaidPlanLifetimeConfig,
): FormData | null {
  const name = systemName.trim();
  if (!name) {
    return null;
  }
  const fd = new FormData();
  fd.set("system_name", name);
  fd.set("support_contact_email", supportContactEmail.trim());
  fd.set("currency", prefs.currency);
  fd.set("date_order", prefs.date_order);
  fd.set("date_sep", prefs.date_sep);
  fd.set("time_format", prefs.time_format);
  fd.set("time_sep", prefs.time_sep);
  fd.set("timezone", prefs.timezone);
  fd.set("week_start", prefs.week_start);
  fd.set("paid_plan_enabled", paid.enabled ? "1" : "0");
  fd.set(
    "paid_plan_annual_enabled",
    paid.enabled && paid.annualBillingEnabled ? "1" : "0",
  );
  if (paid.enabled && paid.annualBillingEnabled && paid.annualPriceEur != null) {
    fd.set("paid_plan_annual_price_eur", paid.annualPriceEur.toFixed(2));
  }
  fd.set("paid_plan_price_eur", paid.priceEur.toFixed(2));
  fd.set("paid_plan_free_subscription_limit", String(paid.freeSubscriptionLimit));
  fd.set("pro_trial_enabled", paid.enabled && trial.enabled ? "1" : "0");
  fd.set("pro_trial_days", String(trial.days));
  fd.set(
    "paid_plan_lifetime_enabled",
    paid.enabled && lifetime.enabled ? "1" : "0",
  );
  if (paid.enabled && lifetime.enabled) {
    if (lifetime.priceEur != null) {
      fd.set("paid_plan_lifetime_price_eur", lifetime.priceEur.toFixed(2));
    }
    if (lifetime.endsAt) {
      fd.set("paid_plan_lifetime_ends_at", lifetime.endsAt);
    }
    if (lifetime.purchaseLimit != null) {
      fd.set("paid_plan_lifetime_purchase_limit", String(lifetime.purchaseLimit));
    }
  }
  return fd;
}

function fdSignature(fd: FormData): string {
  return (
    `${String(fd.get("system_name"))}\0${String(fd.get("support_contact_email"))}\0${String(fd.get("currency"))}` +
    `\0${String(fd.get("date_order"))}\0${String(fd.get("date_sep"))}` +
    `\0${String(fd.get("time_format"))}\0${String(fd.get("time_sep"))}` +
    `\0${String(fd.get("timezone"))}\0${String(fd.get("week_start"))}` +
    `\0${String(fd.get("paid_plan_enabled"))}\0${String(fd.get("paid_plan_annual_enabled"))}` +
    `\0${String(fd.get("paid_plan_annual_price_eur"))}` +
    `\0${String(fd.get("paid_plan_price_eur"))}` +
    `\0${String(fd.get("paid_plan_free_subscription_limit"))}` +
    `\0${String(fd.get("pro_trial_enabled"))}\0${String(fd.get("pro_trial_days"))}` +
    `\0${String(fd.get("paid_plan_lifetime_enabled"))}` +
    `\0${String(fd.get("paid_plan_lifetime_price_eur"))}` +
    `\0${String(fd.get("paid_plan_lifetime_ends_at"))}` +
    `\0${String(fd.get("paid_plan_lifetime_purchase_limit"))}`
  );
}

export function AdminSystemPanel({
  loadError,
  initialSystemName,
  initialSupportContactEmail,
  initialLogoRevision,
  initialTopbarLogoRevision,
  initialDefaults,
  initialPaidPlan,
  initialProTrial,
  initialPaidPlanLifetime,
}: AdminSystemPanelProps) {
  const { t, locale } = useSubtrackIntl();
  const [systemName, setSystemName] = useState(initialSystemName);
  const [supportContactEmail, setSupportContactEmail] = useState(
    initialSupportContactEmail,
  );
  const [prefs, setPrefs] = useState<DisplayPreferences>(() => ({
    ...initialDefaults,
  }));
  const [paidPlanEnabled, setPaidPlanEnabled] = useState(initialPaidPlan.enabled);
  const [paidPlanAnnualEnabled, setPaidPlanAnnualEnabled] = useState(
    initialPaidPlan.annualBillingEnabled,
  );
  const [paidPlanAnnualPrice, setPaidPlanAnnualPrice] = useState(
    initialPaidPlan.annualPriceEur != null
      ? initialPaidPlan.annualPriceEur.toFixed(2)
      : "",
  );
  const [paidPlanPrice, setPaidPlanPrice] = useState(
    initialPaidPlan.priceEur.toFixed(2),
  );
  const [paidPlanFreeLimit, setPaidPlanFreeLimit] = useState(
    String(initialPaidPlan.freeSubscriptionLimit),
  );
  const [proTrialEnabled, setProTrialEnabled] = useState(initialProTrial.enabled);
  const [proTrialDays, setProTrialDays] = useState(String(initialProTrial.days));
  const [paidPlanLifetimeEnabled, setPaidPlanLifetimeEnabled] = useState(
    initialPaidPlanLifetime.enabled,
  );
  const [paidPlanLifetimePrice, setPaidPlanLifetimePrice] = useState(
    initialPaidPlanLifetime.priceEur != null
      ? initialPaidPlanLifetime.priceEur.toFixed(2)
      : "",
  );
  const [paidPlanLifetimeEndsAt, setPaidPlanLifetimeEndsAt] = useState(
    formatLifetimeEndsAtForDatetimeLocal(initialPaidPlanLifetime.endsAt),
  );
  const [paidPlanLifetimePurchaseLimit, setPaidPlanLifetimePurchaseLimit] = useState(
    initialPaidPlanLifetime.purchaseLimit != null
      ? String(initialPaidPlanLifetime.purchaseLimit)
      : "",
  );
  const [saveHud, setSaveHud] = useState<SaveHud>("idle");

  const hydratedRef = useRef(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistedSigRef = useRef<string>("");

  const loadErrRef = useRef(false);
  loadErrRef.current = loadError !== null;

  const snapshotRef = useRef({
    systemName: initialSystemName,
    supportContactEmail: initialSupportContactEmail,
    prefs: initialDefaults,
    paid: initialPaidPlan,
    trial: initialProTrial,
    lifetime: initialPaidPlanLifetime,
  });
  snapshotRef.current = {
    systemName,
    supportContactEmail,
    prefs,
    paid: {
      enabled: paidPlanEnabled,
      priceEur: Number.parseFloat(String(paidPlanPrice).replace(",", ".")) || 0,
      freeSubscriptionLimit: Number.parseInt(paidPlanFreeLimit, 10) || 0,
      annualBillingEnabled: paidPlanEnabled && paidPlanAnnualEnabled,
      annualPriceEur:
        paidPlanEnabled && paidPlanAnnualEnabled
          ? (() => {
              const raw = String(paidPlanAnnualPrice).replace(",", ".").trim();
              if (!raw) return null;
              const n = Number.parseFloat(raw);
              return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
            })()
          : null,
    },
    trial: {
      enabled: paidPlanEnabled && proTrialEnabled,
      days: Number.parseInt(proTrialDays, 10) || initialProTrial.days,
    },
    lifetime: {
      enabled: paidPlanEnabled && paidPlanLifetimeEnabled,
      priceEur:
        paidPlanEnabled && paidPlanLifetimeEnabled
          ? (() => {
              const raw = String(paidPlanLifetimePrice).replace(",", ".").trim();
              if (!raw) return null;
              const n = Number.parseFloat(raw);
              return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
            })()
          : null,
      endsAt:
        paidPlanEnabled && paidPlanLifetimeEnabled && paidPlanLifetimeEndsAt.trim()
          ? (() => {
              const ms = Date.parse(paidPlanLifetimeEndsAt.trim());
              return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
            })()
          : null,
      purchaseLimit:
        paidPlanEnabled && paidPlanLifetimeEnabled && paidPlanLifetimePurchaseLimit.trim()
          ? Number.parseInt(paidPlanLifetimePurchaseLimit, 10) || null
          : null,
      purchaseCount: initialPaidPlanLifetime.purchaseCount,
    },
  };

  const intlLocale = useMemo(() => uiLocaleCodeToBcp47ForIntl(locale), [locale]);

  const fmtEur = useMemo(
    () => (amount: number) =>
      new Intl.NumberFormat(intlLocale, {
        style: "currency",
        currency: "EUR",
      }).format(Number.isFinite(amount) ? amount : 0),
    [intlLocale],
  );

  const annualPricePreview = useMemo(() => {
    if (!paidPlanEnabled || !paidPlanAnnualEnabled) return null;
    const monthly =
      Number.parseFloat(String(paidPlanPrice).replace(",", ".")) || 0;
    const annualRaw = String(paidPlanAnnualPrice).replace(",", ".").trim();
    if (!annualRaw) return null;
    const annual = Number.parseFloat(annualRaw);
    if (!isValidPaidPlanAnnualPrice(annual)) return null;
    const discount = paidPlanAnnualDiscountPercent(monthly, annual);
    return {
      equivMonthlyEur: paidPlanAnnualEquivMonthlyFromAnnual(annual),
      discountPercent: discount != null && discount > 0 ? discount : null,
    };
  }, [paidPlanAnnualEnabled, paidPlanAnnualPrice, paidPlanEnabled, paidPlanPrice]);

  const preview = useMemo(
    () =>
      formatDisplayPreferencesPreview(prefs, intlLocale, {
        week: t("preferences.preview.label_week"),
        currency: t("preferences.preview.label_currency"),
        ui: t("preferences.preview.label_ui"),
      }),
    [intlLocale, prefs, t],
  );

  async function persistFlushSilent(): Promise<void> {
    if (!hydratedRef.current || loadErrRef.current) return;
    const {
      systemName: sn,
      supportContactEmail: sce,
      prefs: p,
      paid: pd,
      trial: tr,
    } = snapshotRef.current;
    const fd = buildFormData(sn, sce, p, pd, tr, snapshotRef.current.lifetime);
    if (!fd) return;
    const sig = fdSignature(fd);
    if (sig === persistedSigRef.current) return;
    try {
      const res = await saveSystemSettingsAction(fd);
      if (res.ok) persistedSigRef.current = sig;
    } catch {
      /* lapas nomaiņa kluss flush */
    }
  }

  async function persistDebouncedUi(): Promise<void> {
    if (loadErrRef.current) return;
    const {
      systemName: sn,
      supportContactEmail: sce,
      prefs: p,
      paid: pd,
      trial: tr,
    } = snapshotRef.current;
    const fd = buildFormData(sn, sce, p, pd, tr, snapshotRef.current.lifetime);
    if (!fd) {
      pushDomToast(t("admin.forms.err_system_name_required"), "error");
      return;
    }

    const sig = fdSignature(fd);
    if (sig === persistedSigRef.current) {
      return;
    }

    pushDomToast(t("admin.forms.toast_saving"), "info");
    try {
      const res = await saveSystemSettingsAction(fd);
      if (res.ok) {
        persistedSigRef.current = sig;
        pushDomToast(t("admin.forms.toast_saved"), "success");
      } else {
        pushDomToast(res.message, "error");
      }
    } catch {
      pushDomToast(t("admin.forms.conn_error"), "error");
    }
  }

  function scheduleAutosave(): void {
    if (!hydratedRef.current || loadErrRef.current) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      autosaveTimerRef.current = null;
      void persistDebouncedUi();
    }, AUTOSAVE_DEBOUNCE_MS);
  }

  function updatePref<K extends keyof DisplayPreferences>(
    key: K,
    value: DisplayPreferences[K],
  ): void {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    scheduleAutosave();
  }

  useEffect(() => {
    queueMicrotask(() => {
      hydratedRef.current = true;
      const fd = buildFormData(
        initialSystemName,
        initialSupportContactEmail,
        initialDefaults,
        initialPaidPlan,
        initialProTrial,
        initialPaidPlanLifetime,
      );
      if (fd) persistedSigRef.current = fdSignature(fd);
    });
  }, [
    initialDefaults,
    initialSupportContactEmail,
    initialSystemName,
    initialPaidPlan,
    initialProTrial,
    initialPaidPlanLifetime,
  ]);

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
      if (savedClearTimerRef.current) {
        clearTimeout(savedClearTimerRef.current);
        savedClearTimerRef.current = null;
      }
      void persistFlushSilent();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- flush izmanto šī brīža refs
  }, []);

  const saveStatusText =
    saveHud === "saving"
      ? t("admin.forms.toast_saving")
      : saveHud === "saved"
        ? t("admin.forms.toast_saved")
        : "";

  return (
    <div className="admin-lang-stack">
      {loadError ? (
        <div className="admin-alert admin-alert--error" role="alert">
          {t("admin.forms.sys_load_fail")} {loadError}.{" "}
          {t("admin.forms.sys_load_sql_hint")}
        </div>
      ) : null}

      <div className="admin-lang-card">
        <p className="admin-lang-card-title">{t("admin.forms.section_title")}</p>
        <p className="form-hint admin-system-autosave-hud" aria-live="polite" style={{ minHeight: 22 }}>
          {saveStatusText}
        </p>

        <form className="admin-lang-new-form" style={{ marginTop: "8px" }} noValidate>
          <div className="form-group">
            <label htmlFor="sys_name">{t("admin.forms.label_product_name")}</label>
            <input
              id="sys_name"
              type="text"
              name="system_name"
              autoComplete="organization"
              value={systemName}
              disabled={loadError !== null}
              onChange={(e) => {
                setSystemName(e.target.value);
                scheduleAutosave();
              }}
            />
          </div>

          <AdminSystemLogoUpload
            initialLogoRevision={initialLogoRevision}
            disabled={loadError !== null}
          />

          <AdminSystemTopbarLogoUpload
            initialTopbarLogoRevision={initialTopbarLogoRevision}
            disabled={loadError !== null}
          />

          <p className="form-section-label" style={{ marginTop: "20px" }}>
            {t("admin.forms.section_support")}
          </p>
          <div className="form-group">
            <label htmlFor="sys_support_email">
              {t("admin.forms.label_support_contact_email")}
            </label>
            <input
              id="sys_support_email"
              type="email"
              name="support_contact_email"
              autoComplete="email"
              inputMode="email"
              placeholder={t("admin.forms.placeholder_support_contact_email")}
              value={supportContactEmail}
              disabled={loadError !== null}
              onChange={(e) => {
                setSupportContactEmail(e.target.value);
                scheduleAutosave();
              }}
            />
            <p className="form-hint">{t("admin.forms.hint_support_contact_email")}</p>
          </div>

          <p className="form-section-label" style={{ marginTop: "20px" }}>
            {t("admin.forms.section_paid_plan")}
          </p>
          <div
            className="form-group"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <PaidPlanSwitch
              checked={paidPlanEnabled}
              disabled={loadError !== null}
              onCheckedChange={(next) => {
                setPaidPlanEnabled(next);
                if (!next) {
                  setPaidPlanAnnualEnabled(false);
                  setProTrialEnabled(false);
                  setPaidPlanLifetimeEnabled(false);
                }
                scheduleAutosave();
              }}
              ariaLabelledBy="sys_paid_toggle_label"
            />
            <span id="sys_paid_toggle_label">{t("admin.forms.paid_plan_enable")}</span>
          </div>
          {paidPlanEnabled ? (
            <>
              <div className="form-row" style={{ marginTop: 12 }}>
                <div className="form-group">
                  <label htmlFor="sys_paid_price">{t("admin.forms.label_paid_plan_price")}</label>
                  <input
                    id="sys_paid_price"
                    type="number"
                    name="paid_plan_price_eur"
                    min={0.01}
                    max={9999.99}
                    step={0.01}
                    value={paidPlanPrice}
                    disabled={loadError !== null}
                    onChange={(e) => {
                      setPaidPlanPrice(e.target.value);
                      scheduleAutosave();
                    }}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="sys_paid_limit">
                    {t("admin.forms.label_paid_plan_free_limit")}
                  </label>
                  <input
                    id="sys_paid_limit"
                    inputMode="numeric"
                    name="paid_plan_free_subscription_limit"
                    value={paidPlanFreeLimit}
                    disabled={loadError !== null}
                    onChange={(e) => {
                      setPaidPlanFreeLimit(
                        e.target.value.replace(/\D/g, "").slice(0, 6),
                      );
                      scheduleAutosave();
                    }}
                  />
                </div>
              </div>
              <div className="form-row form-row--paid-plan-annual" style={{ marginTop: 12 }}>
                <div
                  className="form-group form-group--switch-inline"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 0,
                  }}
                >
                  <PaidPlanSwitch
                    checked={paidPlanAnnualEnabled}
                    disabled={loadError !== null}
                    onCheckedChange={(next) => {
                      setPaidPlanAnnualEnabled(next);
                      scheduleAutosave();
                    }}
                    ariaLabelledBy="sys_paid_annual_toggle_label"
                  />
                  <span id="sys_paid_annual_toggle_label">
                    {t("admin.forms.paid_plan_annual_enable")}
                  </span>
                </div>
                {paidPlanAnnualEnabled ? (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="sys_paid_annual_price">
                      {t("admin.forms.label_paid_plan_annual_price")}
                    </label>
                    <input
                      id="sys_paid_annual_price"
                      type="number"
                      name="paid_plan_annual_price_eur"
                      min={0.01}
                      max={9999.99}
                      step={0.01}
                      value={paidPlanAnnualPrice}
                      disabled={loadError !== null}
                      onChange={(e) => {
                        setPaidPlanAnnualPrice(e.target.value);
                        scheduleAutosave();
                      }}
                    />
                  </div>
                ) : (
                  <div className="form-group form-group--annual-price-placeholder" aria-hidden />
                )}
              </div>
              {paidPlanAnnualEnabled ? (
                <>
                  <p className="form-hint" style={{ marginTop: 8 }}>
                    {t("admin.forms.paid_plan_annual_hint")}
                  </p>
                  {annualPricePreview ? (
                    <p className="form-hint" style={{ marginTop: 4 }}>
                      {t("admin.forms.paid_plan_annual_hint_equiv_monthly").replace(
                        /\{equiv\}/g,
                        fmtEur(annualPricePreview.equivMonthlyEur),
                      )}
                    </p>
                  ) : null}
                  {annualPricePreview?.discountPercent != null ? (
                    <p className="form-hint" style={{ marginTop: 4 }}>
                      {t("admin.forms.paid_plan_annual_hint_discount").replace(
                        /\{discount\}/g,
                        formatPaidPlanDiscountPercent(annualPricePreview.discountPercent),
                      )}
                    </p>
                  ) : null}
                </>
              ) : null}
              <div
                className="form-group"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                  marginTop: 16,
                }}
              >
                <PaidPlanSwitch
                  checked={paidPlanLifetimeEnabled}
                  disabled={loadError !== null}
                  onCheckedChange={(next) => {
                    setPaidPlanLifetimeEnabled(next);
                    scheduleAutosave();
                  }}
                  ariaLabelledBy="sys_paid_lifetime_toggle_label"
                />
                <span id="sys_paid_lifetime_toggle_label">
                  {t("admin.forms.paid_plan_lifetime_enable")}
                </span>
              </div>
              {paidPlanLifetimeEnabled ? (
                <>
                  <div className="form-row" style={{ marginTop: 12 }}>
                    <div className="form-group">
                      <label htmlFor="sys_paid_lifetime_price">
                        {t("admin.forms.label_paid_plan_lifetime_price")}
                      </label>
                      <input
                        id="sys_paid_lifetime_price"
                        type="number"
                        name="paid_plan_lifetime_price_eur"
                        min={0.01}
                        max={9999.99}
                        step={0.01}
                        value={paidPlanLifetimePrice}
                        disabled={loadError !== null}
                        onChange={(e) => {
                          setPaidPlanLifetimePrice(e.target.value);
                          scheduleAutosave();
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="sys_paid_lifetime_limit">
                        {t("admin.forms.label_paid_plan_lifetime_purchase_limit")}
                      </label>
                      <input
                        id="sys_paid_lifetime_limit"
                        inputMode="numeric"
                        name="paid_plan_lifetime_purchase_limit"
                        placeholder={t("admin.forms.placeholder_paid_plan_lifetime_purchase_limit")}
                        value={paidPlanLifetimePurchaseLimit}
                        disabled={loadError !== null}
                        onChange={(e) => {
                          setPaidPlanLifetimePurchaseLimit(
                            e.target.value.replace(/\D/g, "").slice(0, 7),
                          );
                          scheduleAutosave();
                        }}
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginTop: 12, maxWidth: 320 }}>
                    <label htmlFor="sys_paid_lifetime_ends">
                      {t("admin.forms.label_paid_plan_lifetime_ends_at")}
                    </label>
                    <input
                      id="sys_paid_lifetime_ends"
                      type="datetime-local"
                      name="paid_plan_lifetime_ends_at"
                      value={paidPlanLifetimeEndsAt}
                      disabled={loadError !== null}
                      onChange={(e) => {
                        setPaidPlanLifetimeEndsAt(e.target.value);
                        scheduleAutosave();
                      }}
                    />
                  </div>
                  <p className="form-hint" style={{ marginTop: 8 }}>
                    {t("admin.forms.paid_plan_lifetime_hint")}
                  </p>
                  {initialPaidPlanLifetime.purchaseCount > 0 ? (
                    <p className="form-hint" style={{ marginTop: 4 }}>
                      {t("admin.forms.paid_plan_lifetime_purchase_count").replace(
                        /\{count\}/g,
                        String(initialPaidPlanLifetime.purchaseCount),
                      )}
                    </p>
                  ) : null}
                </>
              ) : null}
              <p className="form-hint" style={{ marginTop: 8 }}>
                {t("admin.forms.paid_plan_hint")}
              </p>
              <div className="form-row" style={{ marginTop: 16 }}>
                <div
                  className="form-group form-group--switch-inline"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 0,
                  }}
                >
                  <PaidPlanSwitch
                    checked={proTrialEnabled}
                    disabled={loadError !== null}
                    onCheckedChange={(next) => {
                      setProTrialEnabled(next);
                      scheduleAutosave();
                    }}
                    ariaLabelledBy="sys_pro_trial_toggle_label"
                  />
                  <span id="sys_pro_trial_toggle_label">
                    {t("admin.forms.pro_trial_enable")}
                  </span>
                </div>
                {proTrialEnabled ? (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="sys_pro_trial_days">
                      {t("admin.forms.label_pro_trial_days")}
                    </label>
                    <input
                      id="sys_pro_trial_days"
                      inputMode="numeric"
                      name="pro_trial_days"
                      min={1}
                      max={365}
                      value={proTrialDays}
                      disabled={loadError !== null}
                      onChange={(e) => {
                        setProTrialDays(e.target.value.replace(/\D/g, "").slice(0, 3));
                        scheduleAutosave();
                      }}
                    />
                  </div>
                ) : (
                  <div className="form-group form-group--annual-price-placeholder" aria-hidden />
                )}
              </div>
              <p className="form-hint" style={{ marginTop: 8 }}>
                {t("admin.forms.pro_trial_hint")}
              </p>
            </>
          ) : null}

          <p className="form-section-label" style={{ marginTop: "20px" }}>
            {t("admin.forms.section_currency")}
          </p>
          <div className="form-group">
            <label htmlFor="sys_currency">{t("admin.forms.label_currency")}</label>
            <select
              id="sys_currency"
              name="currency"
              className="form-select"
              value={prefs.currency}
              disabled={loadError !== null}
              onChange={(e) =>
                updatePref("currency", e.target.value as DisplayPreferences["currency"])
              }
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="SEK">SEK (kr)</option>
              <option value="PLN">PLN (zł)</option>
              <option value="CHF">CHF (Fr)</option>
            </select>
          </div>

          <p className="form-section-label form-section-label--spaced">
            {t("admin.forms.section_date")}
          </p>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sys_date_order">
                {t("admin.forms.label_date_order")}
              </label>
              <select
                id="sys_date_order"
                name="date_order"
                className="form-select"
                value={prefs.date_order}
                disabled={loadError !== null}
                onChange={(e) =>
                  updatePref(
                    "date_order",
                    e.target.value as DisplayPreferences["date_order"],
                  )
                }
              >
                <option value="dmy">d-m-Y (piem., 07.06.2024)</option>
                <option value="ymd">Y-m-d (piem., 2024.06.07)</option>
                <option value="mdy">m-d-Y (piem., 06.07.2024)</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="sys_date_sep">
                {t("admin.forms.label_date_sep")}
              </label>
              <select
                id="sys_date_sep"
                name="date_sep"
                className="form-select"
                value={prefs.date_sep}
                disabled={loadError !== null}
                onChange={(e) =>
                  updatePref("date_sep", e.target.value as DisplayPreferences["date_sep"])
                }
              >
                <option value=".">Punkts (.) </option>
                <option value="-">Defise (-)</option>
                <option value="/">Slīpsvītra (/)</option>
              </select>
            </div>
          </div>

          <p className="form-section-label form-section-label--spaced">
            {t("admin.forms.section_time")}
          </p>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sys_time_format">
                {t("admin.forms.label_time_fmt")}
              </label>
              <select
                id="sys_time_format"
                name="time_format"
                className="form-select"
                value={prefs.time_format}
                disabled={loadError !== null}
                onChange={(e) =>
                  updatePref(
                    "time_format",
                    e.target.value as DisplayPreferences["time_format"],
                  )
                }
              >
                <option value="24">24 stundas</option>
                <option value="12">12 stundas</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="sys_time_sep">
                {t("admin.forms.label_time_sep_field")}
              </label>
              <select
                id="sys_time_sep"
                name="time_sep"
                className="form-select"
                value={prefs.time_sep}
                disabled={loadError !== null}
                onChange={(e) =>
                  updatePref("time_sep", e.target.value as DisplayPreferences["time_sep"])
                }
              >
                <option value=":">Divkrops (:)</option>
                <option value=".">Punkts (.)</option>
              </select>
            </div>
          </div>

          <p className="form-section-label form-section-label--spaced">
            {t("admin.forms.section_tz")}
          </p>
          <div className="form-group">
            <label htmlFor="sys_tz">{t("admin.forms.label_timezone")}</label>
            <select
              id="sys_tz"
              name="timezone"
              className="form-select"
              value={prefs.timezone}
              disabled={loadError !== null}
              onChange={(e) => updatePref("timezone", e.target.value)}
            >
              <option value="Europe/Riga">Eiropa/Rīga</option>
              <option value="Europe/Tallinn">Eiropa/Tallina</option>
              <option value="Europe/Vilnius">Eiropa/Viļņa</option>
              <option value="Europe/Helsinki">Eiropa/Helsinki</option>
              <option value="Europe/Warsaw">Eiropa/Varšava</option>
              <option value="Europe/Berlin">Eiropa/Berlīne</option>
              <option value="Europe/Paris">Eiropa/Parīze</option>
              <option value="Europe/London">Eiropa/Londona</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">Amerika/New_York</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="sys_week_start">{t("admin.forms.label_week_start")}</label>
            <select
              id="sys_week_start"
              name="week_start"
              className="form-select"
              value={prefs.week_start}
              disabled={loadError !== null}
              onChange={(e) =>
                updatePref(
                  "week_start",
                  e.target.value as DisplayPreferences["week_start"],
                )
              }
            >
              <option value="monday">{t("admin.forms.week_mon")}</option>
              <option value="sunday">{t("admin.forms.week_sun")}</option>
            </select>
          </div>

          <div
            className="dash-settings-hint-box"
            style={{ marginTop: "16px" }}
            aria-live="polite"
          >
            <strong>{t("admin.forms.preview_intro")}</strong> <span>{preview}</span>
          </div>
        </form>
      </div>
    </div>
  );
}
