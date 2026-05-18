/* =============================================
   SubTrack - kopīgas palīgfunkcijas (panelis, analītika, paziņojumi)
   ============================================= */

var CATEGORY_PHRASE_KEY = {
    subscription: 'landing.mock.pill_subscription',
    bill: 'landing.mock.pill_bill',
    credit: 'landing.mock.pill_credit',
    leasing: 'landing.mock.pill_leasing',
    insurance: 'landing.mock.pill_insurance',
    other: 'landing.mock.pill_other'
};

/** Atkāpe bez React bootstrap */
var SUB_CATEGORY_LABELS_LV = {
    subscription: 'Abonements',
    bill: 'Rēķins',
    credit: 'Kredīts',
    leasing: 'Līzings',
    insurance: 'Apdrošināšana',
    other: 'Citi maksājumi'
};

function fsIntlLocale() {
    var meta = typeof window !== 'undefined' && window.__SUBTRACK_FS_META ? window.__SUBTRACK_FS_META : null;
    if (meta && meta.intlLocale) return String(meta.intlLocale);
    return 'lv-LV';
}

/** @returns { string } tulkošana vai tukša ja nav bootstrap */
function FsT(key) {
    var m = typeof window !== 'undefined' ? window.__SUBTRACK_FS_I18N : null;
    if (!m || typeof key !== 'string') return '';
    var s = m[key];
    return typeof s === 'string' && s.length ? s : '';
}

function normalizeCategoryKey(key) {
    if (key && CATEGORY_PHRASE_KEY[key]) return key;
    return 'subscription';
}

function categoryLabel(key) {
    var nk = normalizeCategoryKey(key);
    var phraseKey = CATEGORY_PHRASE_KEY[nk];
    var txt = FsT(phraseKey);
    if (txt) return txt;
    return SUB_CATEGORY_LABELS_LV[nk] || nk;
}

function monthlyAmount(amount, period) {
    if (period === 'yearly') return amount / 12;
    if (period === 'weekly') return amount * 4.33;
    return amount;
}

function sumDeviceAmounts(s) {
    if (!s.devices || !s.devices.length) return 0;
    return s.devices.reduce(function (a, d) {
        return a + (parseFloat(d.amount) || 0);
    }, 0);
}

function subscriptionMonthlyTotal(s) {
    return monthlyAmount(s.amount, s.period) + sumDeviceAmounts(s);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    var iso = normalizeSubscriptionDateIso(dateStr);
    if (!iso) return '-';
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return '-';
    try {
        return new Intl.DateTimeFormat(fsIntlLocale(), { day: 'numeric', month: 'long' }).format(d);
    } catch (e) {
        return d.getDate() + '.' + (d.getMonth() + 1) + '.';
    }
}

function addOneBillingPeriod(d, period) {
    var x = new Date(d.getTime());
    if (period === 'yearly') {
        x.setFullYear(x.getFullYear() + 1);
    } else if (period === 'weekly') {
        x.setDate(x.getDate() + 7);
    } else {
        x.setMonth(x.getMonth() + 1);
    }
    return x;
}

function toISODateLocal(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1);
    if (m.length < 2) m = '0' + m;
    var day = String(d.getDate());
    if (day.length < 2) day = '0' + day;
    return y + '-' + m + '-' + day;
}

/** Vienots YYYY-MM-DD kalendāram / salīdzinājumiem (DB reizēm atgriež ar laika daļu). */
function normalizeSubscriptionDateIso(dateStr) {
    if (dateStr == null || dateStr === '') return '';
    var s = String(dateStr).trim();
    var m = s.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
    var d = new Date(s);
    if (isNaN(d.getTime())) return '';
    return toISODateLocal(d);
}

/** Nekas no sessionStorage: pēc veiksmīgas GET sinhronizācijas neielādēt SSR bootstrap, kas dzēstu svaigus PATCH datus. */
function subtrackMarkSubsSyncedFromApi() {
    if (typeof window !== 'undefined') {
        window.__subtrackSubsApiSyncedOnce = true;
    }
}

/**
 * JSON teksts no elementa ar `id` — `<template>` (React 19 FS bootstrap) vai vecā `<script type="application/json">`.
 * @param { string } id
 * @returns { string }
 */
function subtrackReadBootstrapJsonTextById(id) {
    var el = document.getElementById(id);
    if (!el) return '';
    var raw;
    if (typeof HTMLTemplateElement !== 'undefined' && el instanceof HTMLTemplateElement) {
        raw = el.content.textContent || '';
    } else {
        raw = el.textContent || '';
    }
    return String(raw).trim();
}

/** Atkārtoti nolasa `#subtrack-subs-bootstrap-json` (klienta navigācija starp /dashboard un /analytics). */
function subtrackReloadSubscriptionsFromBootstrap() {
    var raw = subtrackReadBootstrapJsonTextById('subtrack-subs-bootstrap-json');
    if (!raw) return;
    try {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            subscriptions = parsed.map(function (item) {
                if (!item || typeof item !== 'object') return item;
                var o = Object.assign({}, item);
                if (o.date) o.date = normalizeSubscriptionDateIso(o.date);
                return o;
            });
        }
    } catch (ignore) {}
}

(function subtrackHydrateSubscriptionsFromDom() {
    subtrackReloadSubscriptionsFromBootstrap();
})();

/**
 * Kalendārs: dienas, kurās panelī / zvanā atzīmēts „samaksāts”, lai šūna paliek redzama pēc termiņa pārcelšanas.
 * localStorage – izdzīvo pārlādē; objekts { "YYYY-MM-DD": skaits }.
 */
var SUBTRACK_CAL_PAID_LS_KEY = 'subtrack_cal_paid_marked_v1';

function subtrackReadPaidCalendarCounts() {
    if (typeof localStorage === 'undefined') return {};
    try {
        var raw = localStorage.getItem(SUBTRACK_CAL_PAID_LS_KEY);
        if (!raw) return {};
        var o = JSON.parse(raw);
        if (!o || typeof o !== 'object' || Array.isArray(o)) return {};
        return o;
    } catch (e) {
        return {};
    }
}

function subtrackWritePaidCalendarCounts(obj) {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(SUBTRACK_CAL_PAID_LS_KEY, JSON.stringify(obj));
    } catch (e) {}
}

function subtrackAddPaidCalendarDay(isoDay) {
    var iso = normalizeSubscriptionDateIso(isoDay);
    if (!iso) return;
    var map = subtrackReadPaidCalendarCounts();
    var prev = parseInt(map[iso], 10) || 0;
    map[iso] = prev + 1;
    subtrackWritePaidCalendarCounts(map);
}

/** Notīra kalendāra „samaksāts” vēsturi (localStorage), ja aktīvo ierakstu vairs nav. */
function subtrackClearPaidCalendarMarks() {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.removeItem(SUBTRACK_CAL_PAID_LS_KEY);
    } catch (e) {}
}

function subtrackPaidCalendarDayMapForMonth(y, m) {
    var map = subtrackReadPaidCalendarCounts();
    var out = {};
    Object.keys(map).forEach(function (iso) {
        var n = parseInt(map[iso], 10) || 0;
        if (n < 1) return;
        var parts = iso.split('-');
        if (parts.length !== 3) return;
        var yy = parseInt(parts[0], 10);
        var mo = parseInt(parts[1], 10) - 1;
        if (yy === y && mo === m) {
            out[iso] = n;
        }
    });
    return out;
}

/** Kalendāra slēdzis: vai rādīt arī dienas „atzīmēts samaksāts” (localStorage). */
var SUBTRACK_CAL_INCLUDE_PAID_KEY = 'subtrack_cal_include_paid_marks';

function subtrackCalendarIncludePaidMarks() {
    if (typeof localStorage === 'undefined') return true;
    try {
        var v = localStorage.getItem(SUBTRACK_CAL_INCLUDE_PAID_KEY);
        /* Nav ieraksta: noklusējums kā „ieslēgts” – rādīt arī veiktās / atzīmētās dienas. */
        if (v === null || v === '') return true;
        return v === '1';
    } catch (e) {
        return true;
    }
}

function subtrackSetCalendarIncludePaidMarks(show) {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(SUBTRACK_CAL_INCLUDE_PAID_KEY, show ? '1' : '0');
    } catch (e) {}
}

/** Nākamais termiņš pēc „samaksāts“ (neejam uz pagātni salīdzinājumā ar šodienu). */
function advanceNextDueAfterPayment(dateStr, period) {
    var iso = normalizeSubscriptionDateIso(dateStr);
    if (!iso) {
        return toISODateLocal(new Date());
    }
    var next = addOneBillingPeriod(new Date(iso + 'T00:00:00'), period);
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var guard = 0;
    while (next < today && guard < 240) {
        next = addOneBillingPeriod(next, period);
        guard++;
    }
    return toISODateLocal(next);
}

/** Kredīta / līzingu – mēneši līdz „līdz” datumam */
function formatMonthsRemainingLong(n) {
    if (n <= 0) return '';
    var lc = fsIntlLocale().toLowerCase();
    if (lc === 'lv' || lc.startsWith('lv-')) {
        if (n === 1) return 'atlikuši 1 mēnesis';
        return 'atlikuši ' + n + ' mēneši';
    }
    var tpl = FsT('fs.dashboard.months_remaining');
    if (!tpl) {
        var en = '{n} months left'.replace('{n}', String(n));
        return en;
    }
    return tpl.replace(/\{n\}/g, String(n));
}

function formatOverdueLabel(days) {
    var lc = fsIntlLocale().toLowerCase();
    if (lc === 'lv' || lc.startsWith('lv-')) {
        if (days === 1) return '1 diena kavējumā';
        var mod10 = days % 10;
        var mod100 = days % 100;
        if (mod10 === 1 && mod100 !== 11) return days + ' diena kavējumā';
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 > 20))
            return days + ' dienas kavējumā';
        return days + ' dienu kavējumā';
    }
    var oneTpl = FsT('fs.dashboard.overdue_one');
    var othTpl = FsT('fs.dashboard.overdue_other');
    if (days === 1) {
        if (oneTpl) return oneTpl.replace(/\{days\}/g, '1');
        return '1 day overdue';
    }
    if (othTpl) return othTpl.replace(/\{days\}/g, String(days));
    return days + ' days overdue';
}

function periodTextUi(period) {
    var k =
        period === 'yearly'
            ? 'fs.dashboard.period_yearly'
            : period === 'weekly'
              ? 'fs.dashboard.period_weekly'
              : period === 'monthly'
                ? 'fs.dashboard.period_monthly'
                : '';
    if (!k) return period;
    var t = FsT(k);
    if (t) return t;
    if (period === 'monthly') return 'mēnesī';
    if (period === 'yearly') return 'gadā';
    if (period === 'weekly') return 'nedēļā';
    return period;
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escAttr(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/'/g, '&#39;');
}

/** REST: viena abonementa URL (session cookie). */
function apiSubscriptionUrl(id) {
    return '/api/subscriptions/' + encodeURIComponent(String(id));
}

function parseApiJson(res) {
    return res.json().then(function (data) {
        if (!res.ok) {
            var msg = data && data.message ? String(data.message) : 'HTTP ' + res.status;
            throw new Error(msg);
        }
        return data;
    });
}

/**
 * Iegūst abonementu sarakstu no API (saskaņo ar DB pēc klienta navigācijas vai keša).
 * Kļūdas gadījumā klusa iziešana – paliek `subscriptions` no bootstrap.
 */
function subtrackSyncSubscriptionsFromApi() {
    if (
        typeof window !== 'undefined' &&
        (window.__SUBTRACK_DEMO_DASHBOARD__ || window.__SUBTRACK_DEMO_ANALYTICS__)
    ) {
        return Promise.resolve();
    }
    if (typeof fetch === 'undefined' || typeof subscriptions === 'undefined') {
        return Promise.resolve();
    }
    return fetch('/api/subscriptions', { credentials: 'same-origin' })
        .then(parseApiJson)
        .then(function (data) {
            if (data && Array.isArray(data.subscriptions)) {
                subscriptions = data.subscriptions.map(function (item) {
                    if (!item || typeof item !== 'object') return item;
                    var o = Object.assign({}, item);
                    if (o.date) o.date = normalizeSubscriptionDateIso(o.date);
                    return o;
                });
                subtrackMarkSubsSyncedFromApi();
            }
        })
        .catch(function () {
            /* saglabāt bootstrap datus */
        });
}

/**
 * Apvieno API atbildes `subscription` ar globālo `subscriptions` masīvu.
 * (`dash-alerts.js` var izsaukt pirms `dashboard.js` ielādes.)
 */
function mergeSubscriptionFromApi(sub) {
    if (!sub || sub.id == null || typeof subscriptions === 'undefined') return;
    var sid = String(sub.id);
    var idx = subscriptions.findIndex(function (x) {
        return String(x.id) === sid;
    });
    var row = {
        id: sid,
        name: sub.name,
        category: sub.category,
        amount: typeof sub.amount === 'number' ? sub.amount : parseFloat(sub.amount),
        period: sub.period,
        date: normalizeSubscriptionDateIso(sub.date),
        icon: sub.icon || 'fa-solid fa-box',
        color: sub.color || '#0d9488',
        note: sub.note || '',
        termStart: sub.termStart || '',
        termEnd: sub.termEnd || '',
        devices: Array.isArray(sub.devices) ? sub.devices : [],
    };
    if (idx === -1) {
        subscriptions.push(row);
    } else {
        subscriptions[idx] = row;
    }
}

/** Aktīvie „atzīmēt kā samaksāts” pieprasījumi (subscription id). */
var subtrackMarkPaidPending = {};

function subtrackIsMarkPaidPending(rawId) {
    return !!subtrackMarkPaidPending[String(rawId)];
}

function subtrackMarkPaidButtonInnerHtml() {
    return (
        '<i class="fa-solid fa-check mark-paid-icon" aria-hidden="true"></i>' +
        '<span class="mark-paid-spinner btn-spinner hidden" aria-hidden="true"></span>'
    );
}

function subtrackApplyMarkPaidButtonPending(btn, pending) {
    if (!btn) return;
    var icon = btn.querySelector('.mark-paid-icon');
    var spinner = btn.querySelector('.mark-paid-spinner');
    btn.disabled = !!pending;
    btn.setAttribute('aria-busy', pending ? 'true' : 'false');
    if (icon) icon.classList.toggle('hidden', !!pending);
    if (spinner) spinner.classList.toggle('hidden', !pending);
    btn.classList.toggle('mark-paid--pending', !!pending);
}

function subtrackSyncMarkPaidButtonsPending() {
    var ids = Object.keys(subtrackMarkPaidPending);
    if (!ids.length) return;
    ids.forEach(function (id) {
        if (!subtrackMarkPaidPending[id]) return;
        document
            .querySelectorAll(
                '.mark-paid[data-subscription-id], .dash-notify-mark-paid-ok[data-subscription-id]',
            )
            .forEach(function (btn) {
                if (String(btn.getAttribute('data-subscription-id')) !== String(id)) return;
                subtrackApplyMarkPaidButtonPending(btn, true);
            });
    });
}

function subtrackSetMarkPaidPending(rawId, pending) {
    var id = String(rawId);
    if (pending) {
        subtrackMarkPaidPending[id] = true;
    } else {
        delete subtrackMarkPaidPending[id];
    }
    document
        .querySelectorAll(
            '.mark-paid[data-subscription-id], .dash-notify-mark-paid-ok[data-subscription-id]',
        )
        .forEach(function (btn) {
            if (String(btn.getAttribute('data-subscription-id')) !== id) return;
            subtrackApplyMarkPaidButtonPending(btn, pending);
        });
}

/** Aktīvie dzēšanas pieprasījumi (subscription id). */
var subtrackDeletePending = {};

function subtrackIsDeletePending(rawId) {
    return !!subtrackDeletePending[String(rawId)];
}

function subtrackDeleteButtonInnerHtml() {
    return (
        '<i class="fa-solid fa-trash delete-icon" aria-hidden="true"></i>' +
        '<span class="delete-spinner btn-spinner hidden" aria-hidden="true"></span>'
    );
}

function subtrackApplyDeleteButtonPending(btn, pending) {
    if (!btn) return;
    var icon = btn.querySelector('.delete-icon');
    var spinner = btn.querySelector('.delete-spinner');
    btn.disabled = !!pending;
    btn.setAttribute('aria-busy', pending ? 'true' : 'false');
    if (icon) icon.classList.toggle('hidden', !!pending);
    if (spinner) spinner.classList.toggle('hidden', !pending);
    btn.classList.toggle('delete--pending', !!pending);
}

function subtrackSyncDeleteButtonsPending() {
    var ids = Object.keys(subtrackDeletePending);
    if (!ids.length) return;
    ids.forEach(function (id) {
        if (!subtrackDeletePending[id]) return;
        document
            .querySelectorAll('.icon-btn.delete[data-subscription-id]')
            .forEach(function (btn) {
                if (String(btn.getAttribute('data-subscription-id')) !== String(id)) return;
                subtrackApplyDeleteButtonPending(btn, true);
            });
    });
}

function subtrackSetDeletePending(rawId, pending) {
    var id = String(rawId);
    if (pending) {
        subtrackDeletePending[id] = true;
    } else {
        delete subtrackDeletePending[id];
    }
    document.querySelectorAll('.icon-btn.delete[data-subscription-id]').forEach(function (btn) {
        if (String(btn.getAttribute('data-subscription-id')) !== id) return;
        subtrackApplyDeleteButtonPending(btn, pending);
    });
}

/** Toast ziņojumi (lapā nepieciešams elements #toast-container). */
function showToast(msg, type) {
    var container = document.getElementById('toast-container');
    if (!container) return;
    var toast = document.createElement('div');
    toast.className = 'toast ' + (type || '');
    var prefix = '';
    if (type === 'success') prefix = '<i class="fa-solid fa-check"></i> ';
    else if (type === 'error') prefix = '<i class="fa-solid fa-circle-exclamation"></i> ';
    toast.innerHTML = prefix + escHtml(msg);
    container.appendChild(toast);
    setTimeout(function () {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity .3s';
        setTimeout(function () {
            toast.remove();
        }, 320);
    }, 2800);
}

if (typeof window !== 'undefined') {
    window.subtrackReloadSubscriptionsFromBootstrap = subtrackReloadSubscriptionsFromBootstrap;
}
