"use client";

import { useState, useTransition } from "react";
import {
  CRON_JOB_IDS,
  cronJobSupportsForceSchedule,
  type CronJobId,
} from "@/lib/cron/cron-job-registry";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { pushDomToast } from "@/lib/push-dom-toast";

const JOB_LABEL_KEYS: Record<
  CronJobId,
  { title: string; desc: string }
> = {
  "due-today-payment-emails": {
    title: "admin.cron_jobs.job_due_today",
    desc: "admin.cron_jobs.job_due_today_desc",
  },
  "weekly-summary-emails": {
    title: "admin.cron_jobs.job_weekly",
    desc: "admin.cron_jobs.job_weekly_desc",
  },
  "trial-ending-emails": {
    title: "admin.cron_jobs.job_trial",
    desc: "admin.cron_jobs.job_trial_desc",
  },
  "payment-push-notifications": {
    title: "admin.cron_jobs.job_push",
    desc: "admin.cron_jobs.job_push_desc",
  },
};

export type AdminCronJobsPanelProps = {
  cronSecretConfigured: boolean;
  resendConfigured: boolean;
  vapidConfigured: boolean;
};

export function AdminCronJobsPanel({
  cronSecretConfigured,
  resendConfigured,
  vapidConfigured,
}: AdminCronJobsPanelProps) {
  const { t } = useSubtrackIntl();
  const [pending, startTransition] = useTransition();
  const [activeJob, setActiveJob] = useState<CronJobId | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const runJob = (job: CronJobId) => {
    startTransition(async () => {
      setActiveJob(job);
      try {
        const res = await fetch("/api/admin/cron/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            job,
            forceSchedule: cronJobSupportsForceSchedule(job),
          }),
        });
        const data = (await res.json()) as Record<string, unknown>;
        setLastResult(JSON.stringify(data, null, 2));
        const cron = data.cron;
        const cronRec =
          cron && typeof cron === "object"
            ? (cron as Record<string, unknown>)
            : null;
        const sent = cronRec?.sent ?? cronRec?.sentUsers;
        if (res.ok && data.success !== false) {
          pushDomToast(
            t("admin.cron_jobs.toast_ok").replace(
              "{sent}",
              sent != null ? String(sent) : "0",
            ),
            "success",
          );
        } else {
          const msg =
            typeof cronRec?.message === "string"
              ? cronRec.message
              : typeof data.message === "string"
                ? data.message
                : t("admin.cron_jobs.toast_error");
          pushDomToast(msg, "error");
        }
      } catch {
        pushDomToast(t("admin.cron_jobs.toast_error"), "error");
      } finally {
        setActiveJob(null);
      }
    });
  };

  const jobNeedsResend = (job: CronJobId) =>
    job !== "payment-push-notifications";
  const jobNeedsVapid = (job: CronJobId) =>
    job === "payment-push-notifications";

  return (
    <div className="admin-cron-jobs">
      <p className="admin-alert admin-alert--warning" role="status">
        {t("admin.cron_jobs.force_hint")}
      </p>
      <ul className="admin-cron-env-list">
          <li>
            <code>CRON_SECRET</code>:{" "}
            {cronSecretConfigured
              ? t("admin.cron_jobs.env_ok")
              : t("admin.cron_jobs.env_missing_cron")}
          </li>
          <li>
            <code>RESEND_API_KEY</code> + <code>EMAIL_FROM</code>:{" "}
            {resendConfigured
              ? t("admin.cron_jobs.env_ok")
              : t("admin.cron_jobs.env_missing_resend")}
          </li>
          <li>
            <code>VAPID_*</code>:{" "}
            {vapidConfigured
              ? t("admin.cron_jobs.env_ok")
              : t("admin.cron_jobs.env_missing_vapid")}
          </li>
      </ul>

      <div className="admin-table-wrap">
        <table className="admin-table admin-table--cron-jobs">
          <thead>
            <tr>
              <th scope="col">{t("admin.cron_jobs.col_job")}</th>
              <th scope="col" className="admin-table-actions-col">
                {t("admin.cron_jobs.col_action")}
              </th>
            </tr>
          </thead>
          <tbody>
            {CRON_JOB_IDS.map((job) => {
              const keys = JOB_LABEL_KEYS[job];
              const envOk =
                cronSecretConfigured &&
                (jobNeedsResend(job) ? resendConfigured : true) &&
                (jobNeedsVapid(job) ? vapidConfigured : true);
              const running = pending && activeJob === job;
              return (
                <tr key={job}>
                  <td>
                    <p className="admin-cron-job-title">{t(keys.title)}</p>
                    <p className="admin-cron-job-desc">{t(keys.desc)}</p>
                    <p className="admin-cron-job-path">
                      <code>{`/api/cron/${job}`}</code>
                    </p>
                  </td>
                  <td className="admin-table-actions-col">
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      disabled={!envOk || pending}
                      onClick={() => runJob(job)}
                    >
                      {running
                        ? t("admin.cron_jobs.running")
                        : t("admin.cron_jobs.run")}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {lastResult ? (
        <div className="admin-cron-result">
          <p className="admin-cron-result-title">{t("admin.cron_jobs.result_title")}</p>
          <pre className="admin-cron-result-pre">{lastResult}</pre>
        </div>
      ) : null}
    </div>
  );
}
