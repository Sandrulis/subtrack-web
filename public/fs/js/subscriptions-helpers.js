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

var CATEGORY_CATALOG_BY_KEY = null;
var CATEGORY_OPTIONS_BOOTSTRAP = null;

function loadCategoryOptionsBootstrap() {
    if (CATEGORY_OPTIONS_BOOTSTRAP) return CATEGORY_OPTIONS_BOOTSTRAP;
    var tpl = document.getElementById('subtrack-category-options-bootstrap-json');
    if (!tpl || !tpl.innerHTML) return null;
    try {
        var rows = JSON.parse(tpl.innerHTML.trim());
        if (!Array.isArray(rows) || !rows.length) return null;
        CATEGORY_OPTIONS_BOOTSTRAP = rows;
        return rows;
    } catch (e) {
        return null;
    }
}

function loadCategoryCatalogByKey() {
    if (CATEGORY_CATALOG_BY_KEY) return CATEGORY_CATALOG_BY_KEY;
    var rows = loadCategoryOptionsBootstrap();
    if (!rows) return null;
    var map = {};
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        if (!row || !row.key) continue;
        map[String(row.key)] = String(row.label || row.key);
    }
    if (!Object.keys(map).length) return null;
    CATEGORY_CATALOG_BY_KEY = map;
    return map;
}

/**
 * Kārto #sub-category pēc lietotāja lietojuma, globālās popularitātes un admin secības.
 * @param {Array<{category?: string}>|null|undefined} userSubscriptions
 */
function reorderSubCategorySelect(userSubscriptions) {
    var select = document.getElementById('sub-category');
    if (!select) return;
    var options = loadCategoryOptionsBootstrap();
    if (!options || !options.length) return;

    var userCounts = {};
    var subs = userSubscriptions || [];
    for (var i = 0; i < subs.length; i++) {
        var rawKey = subs[i] && subs[i].category != null ? String(subs[i].category) : '';
        var k = rawKey.trim().toLowerCase();
        if (!k) continue;
        userCounts[k] = (userCounts[k] || 0) + 1;
    }

    var ranked = options.slice().sort(function (a, b) {
        var ak = String(a.key || '').trim().toLowerCase();
        var bk = String(b.key || '').trim().toLowerCase();
        var ua = userCounts[ak] || 0;
        var ub = userCounts[bk] || 0;
        if (ub !== ua) return ub - ua;
        var ga = Number(a.usage_count) || 0;
        var gb = Number(b.usage_count) || 0;
        if (gb !== ga) return gb - ga;
        var sa = Number(a.sort_order) || 0;
        var sb = Number(b.sort_order) || 0;
        if (sa !== sb) return sa - sb;
        return ak.localeCompare(bk, fsIntlLocale(), { sensitivity: 'base' });
    });

    var currentVal = select.value;
    var frag = document.createDocumentFragment();
    for (var j = 0; j < ranked.length; j++) {
        var opt = ranked[j];
        if (!opt || !opt.key) continue;
        var el = document.createElement('option');
        el.value = String(opt.key);
        el.textContent = String(opt.label || opt.key);
        frag.appendChild(el);
    }
    select.innerHTML = '';
    select.appendChild(frag);
    select.value = normalizeCategoryKey(currentVal);
}

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
    var catalog = loadCategoryCatalogByKey();
    if (catalog) {
        if (key && catalog[key]) return key;
        var keys = Object.keys(catalog);
        return keys.length ? keys[0] : 'subscription';
    }
    if (key && CATEGORY_PHRASE_KEY[key]) return key;
    return 'subscription';
}

function categoryLabel(key) {
    var nk = normalizeCategoryKey(key);
    var catalog = loadCategoryCatalogByKey();
    if (catalog && catalog[nk]) return catalog[nk];
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

/**
 * Parsē summu no formas teksta; pieņem komatu kā decimālo atdalītāju (9,99 → 9.99).
 * @returns {number} NaN, ja nav derīgs skaitlis
 */
function parseDecimalAmountInput(raw) {
    var s = String(raw == null ? '' : raw).trim();
    if (!s) return NaN;
    s = s.replace(/\s+/g, '').replace(/€/gi, '');
    if (!s || !/^-?\d[\d.,]*$/.test(s)) return NaN;

    var lastComma = s.lastIndexOf(',');
    var lastDot = s.lastIndexOf('.');

    if (lastComma !== -1 && lastDot !== -1) {
        if (lastComma > lastDot) {
            s = s.replace(/\./g, '').replace(',', '.');
        } else {
            s = s.replace(/,/g, '');
        }
    } else if (lastComma !== -1) {
        s = s.replace(',', '.');
    }

    var n = parseFloat(s);
    return Number.isFinite(n) ? n : NaN;
}

function normalizeRefDate(refDate) {
    var ref = refDate ? new Date(refDate) : new Date();
    if (isNaN(ref.getTime())) ref = new Date();
    ref.setHours(0, 0, 0, 0);
    return ref;
}

/** Vai termiņš (termEnd) ir beidzies salīdzinājumā ar atsauces datumu. */
function isTermEndedForRef(termEndStr, refDate) {
    var termEnd = normalizeSubscriptionDateIso(termEndStr);
    if (!termEnd) return false;
    var ref = normalizeRefDate(refDate);
    var te = new Date(termEnd + 'T00:00:00');
    te.setHours(0, 0, 0, 0);
    return ref.getTime() > te.getTime();
}

/** Vai nākamais maksājuma datums ir termiņa ietvaros. */
function isDueDateWithinTerm(dueIso, termEndStr) {
    var due = normalizeSubscriptionDateIso(dueIso);
    var termEnd = normalizeSubscriptionDateIso(termEndStr);
    if (!termEnd) return true;
    if (!due) return false;
    return due <= termEnd;
}

/** Vai abonements/kredīts vēl rāda maksājumus (kopsavilkums, paziņojumi). */
function isSubscriptionDueActive(s, refDate) {
    if (!s) return false;
    if (isTermEndedForRef(s.termEnd, refDate)) return false;
    return isDueDateWithinTerm(s.date, s.termEnd);
}

function sumDeviceAmounts(s, refDate) {
    if (!s.devices || !s.devices.length) return 0;
    return s.devices.reduce(function (a, d) {
        if (isTermEndedForRef(d.termEnd, refDate)) return a;
        return a + (parseFloat(d.amount) || 0);
    }, 0);
}

/** Bāzes summa periodam: iestatījumu `amount` vai tikai tekošā termiņa pārklājums. */
function effectiveBaseAmountForDue(s, dueIso) {
    if (!s || !isSubscriptionDueActive(s, dueIso)) return 0;
    var due = normalizeSubscriptionDateIso(dueIso);
    var subDue = normalizeSubscriptionDateIso(s.date);
    if (
        s.dynamicAmount === true &&
        due &&
        subDue &&
        due === subDue &&
        s.dueAmountOverride != null &&
        !isNaN(parseFloat(s.dueAmountOverride)) &&
        normalizeSubscriptionDateIso(s.dueAmountOverrideFor) === due
    ) {
        return parseFloat(s.dueAmountOverride) || 0;
    }
    return parseFloat(s.amount) || 0;
}

function clearDuePeriodAmountOverride(s) {
    if (!s) return;
    s.dueAmountOverride = null;
    s.dueAmountOverrideFor = '';
}

function setDuePeriodAmountOverride(s, amount, dueIso) {
    if (!s) return;
    var due = normalizeSubscriptionDateIso(dueIso);
    var subDue = normalizeSubscriptionDateIso(s.date);
    if (!due || !subDue || due !== subDue) return;
    var base = parseFloat(s.amount) || 0;
    if (Math.abs(amount - base) < 0.0001) {
        clearDuePeriodAmountOverride(s);
    } else {
        s.dueAmountOverride = amount;
        s.dueAmountOverrideFor = due;
    }
}

/** Faktiskā / plānotā summa vienam termiņam (abonements + aktīvas papildu rindas). */
function subscriptionPaymentAmountForDue(s, paidOnIso) {
    if (!s) return 0;
    return effectiveBaseAmountForDue(s, paidOnIso) + sumDeviceAmounts(s, paidOnIso);
}

/** PATCH ķermenis „atzīmēt samaksāts” (DB `subscription_payments`). */
function subtrackMarkPaidPatchBody(s, newDate, paidOnIso) {
    var paidIso = normalizeSubscriptionDateIso(paidOnIso);
    var body = {
        date: newDate,
        markPaid: true,
        paidOn: paidIso,
    };
    if (s && paidIso && typeof subscriptionPaymentAmountForDue === 'function') {
        body.amountPaid = subscriptionPaymentAmountForDue(s, paidIso);
    }
    return body;
}

function subscriptionMonthlyTotal(s, refDate) {
    var ref = refDate != null ? refDate : s && s.date;
    var base = 0;
    if (isSubscriptionDueActive(s, ref)) {
        base = monthlyAmount(effectiveBaseAmountForDue(s, ref), s.period);
    }
    return base + sumDeviceAmounts(s, refDate);
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

/** Diena no YYYY-MM-DD (1–31) – perioda „vēlamā” maksājuma diena mēnesī. */
function subscriptionBillingDayFromIso(iso) {
    var n = normalizeSubscriptionDateIso(iso);
    if (!n) return 1;
    var parts = n.split('-');
    var day = parseInt(parts[2], 10);
    return Number.isFinite(day) && day >= 1 && day <= 31 ? day : 1;
}

function daysInCalendarMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate();
}

/** Mēneša datums: min(vēlamā diena, dienas mēnesī) – 31. → feb. 28/29, apr. 30 u.tml. */
function calendarDateOnBillingDay(year, monthIndex, billingDay) {
    var preferred = Number.isFinite(billingDay) && billingDay >= 1 ? billingDay : 1;
    var dim = daysInCalendarMonth(year, monthIndex);
    var day = Math.min(preferred, dim);
    var x = new Date(year, monthIndex, day);
    x.setHours(0, 0, 0, 0);
    return x;
}

/**
 * Stabila vēlamā diena (no term_start vai next_payment_date), lai pēc „samaksāts”
 * februāris 28/29 nezaudētu 31. dienas mēnešus.
 */
function subscriptionPreferredBillingDay(s) {
    if (!s) return 1;
    if (s._preferredBillingDay >= 1 && s._preferredBillingDay <= 31) {
        return s._preferredBillingDay;
    }
    var day = subscriptionBillingDayFromIso(s.date);
    s._preferredBillingDay = day;
    return day;
}

function addOneBillingPeriod(d, period, billingDay) {
    var preferred =
        billingDay != null && billingDay >= 1 && billingDay <= 31
            ? billingDay
            : d.getDate();
    if (period === 'yearly') {
        return calendarDateOnBillingDay(
            d.getFullYear() + 1,
            d.getMonth(),
            preferred,
        );
    }
    if (period === 'weekly') {
        var x = new Date(d.getTime());
        x.setDate(x.getDate() + 7);
        x.setHours(0, 0, 0, 0);
        return x;
    }
    var y = d.getFullYear();
    var m = d.getMonth() + 1;
    if (m > 11) {
        y++;
        m = 0;
    }
    return calendarDateOnBillingDay(y, m, preferred);
}

function subtractOneBillingPeriod(d, period, billingDay) {
    var preferred =
        billingDay != null && billingDay >= 1 && billingDay <= 31
            ? billingDay
            : d.getDate();
    if (period === 'yearly') {
        return calendarDateOnBillingDay(
            d.getFullYear() - 1,
            d.getMonth(),
            preferred,
        );
    }
    if (period === 'weekly') {
        var x = new Date(d.getTime());
        x.setDate(x.getDate() - 7);
        x.setHours(0, 0, 0, 0);
        return x;
    }
    var y = d.getFullYear();
    var m = d.getMonth() - 1;
    if (m < 0) {
        y--;
        m = 11;
    }
    return calendarDateOnBillingDay(y, m, preferred);
}

/**
 * Visi periodiskie termiņi abonementam konkrētajā kalendāra mēnesī (ne tikai next_payment_date).
 * @returns {string[]} ISO YYYY-MM-DD
 */
function subscriptionDueDatesInMonth(s, y, m) {
    if (!s) return [];
    var anchorIso = normalizeSubscriptionDateIso(s.date);
    if (!anchorIso) return [];

    var period = s.period || 'monthly';
    var monthStart = new Date(y, m, 1);
    monthStart.setHours(0, 0, 0, 0);
    var monthEnd = new Date(y, m + 1, 0);
    monthEnd.setHours(0, 0, 0, 0);

    var termEndIso = normalizeSubscriptionDateIso(s.termEnd);
    var termEndDate = termEndIso ? new Date(termEndIso + 'T00:00:00') : null;
    if (termEndDate) termEndDate.setHours(0, 0, 0, 0);

    if (!isSubscriptionDueActive(s, monthEnd)) {
        return [];
    }

    var billingDay = subscriptionPreferredBillingDay(s);

    var cur = new Date(anchorIso + 'T00:00:00');
    cur.setHours(0, 0, 0, 0);

    var guard = 0;
    while (cur.getTime() >= monthStart.getTime() && guard < 600) {
        cur = subtractOneBillingPeriod(cur, period, billingDay);
        guard++;
    }

    cur = addOneBillingPeriod(cur, period, billingDay);
    guard = 0;
    var out = [];
    while (cur.getTime() <= monthEnd.getTime() && guard < 600) {
        if (termEndDate && cur.getTime() > termEndDate.getTime()) {
            break;
        }
        var iso = toISODateLocal(cur);
        if (
            cur.getTime() >= monthStart.getTime() &&
            isDueDateWithinTerm(iso, s.termEnd)
        ) {
            out.push(iso);
        }
        cur = addOneBillingPeriod(cur, period, billingDay);
        guard++;
    }
    return out;
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
                o._preferredBillingDay = subscriptionBillingDayFromIso(o.date);
                return o;
            });
            if (typeof window.subtrackRefreshFamilySharedCache === 'function') {
                window.subtrackRefreshFamilySharedCache();
            }
        }
    } catch (ignore) {}
}

(function subtrackHydrateSubscriptionsFromDom() {
    subtrackReloadSubscriptionsFromBootstrap();
})();

/**
 * Kalendārs: dienas ar „atzīmēts samaksāts” (DB `subscription_payments`, sinhronizācija starp ierīcēm).
 * Objekts { "YYYY-MM-DD": skaits } – `subtrackPaidCalendarDays`.
 */
var subtrackPaidCalendarDays = {};
var SUBTRACK_CAL_PAID_LS_KEY = 'subtrack_cal_paid_marked_v1';

function subtrackNormalizePaidCalendarMap(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    var out = {};
    Object.keys(raw).forEach(function (iso) {
        var n = parseInt(raw[iso], 10) || 0;
        if (n > 0) out[iso] = n;
    });
    return out;
}

function subtrackReadPaidCalendarLsFallback() {
    if (typeof localStorage === 'undefined') return {};
    try {
        var raw = localStorage.getItem(SUBTRACK_CAL_PAID_LS_KEY);
        if (!raw) return {};
        return subtrackNormalizePaidCalendarMap(JSON.parse(raw));
    } catch (e) {
        return {};
    }
}

function subtrackSetPaidCalendarDays(map) {
    subtrackPaidCalendarDays = subtrackNormalizePaidCalendarMap(map);
}

function subtrackReloadPaidCalendarFromBootstrap() {
    var raw = subtrackReadBootstrapJsonTextById('subtrack-paid-calendar-bootstrap-json');
    if (!raw) return;
    try {
        subtrackSetPaidCalendarDays(JSON.parse(raw));
    } catch (ignore) {}
}

function subtrackReadPaidCalendarCounts() {
    var server = subtrackPaidCalendarDays || {};
    if (Object.keys(server).length > 0) return server;
    return subtrackReadPaidCalendarLsFallback();
}

function subtrackAddPaidCalendarDay(isoDay) {
    var iso = normalizeSubscriptionDateIso(isoDay);
    if (!iso) return;
    var map = subtrackReadPaidCalendarCounts();
    var prev = parseInt(map[iso], 10) || 0;
    map[iso] = prev + 1;
    subtrackSetPaidCalendarDays(map);
}

/** Notīra kalendāra „samaksāts” kešu (atmiņa + vecais localStorage), ja aktīvo ierakstu vairs nav. */
function subtrackClearPaidCalendarMarks() {
    subtrackPaidCalendarDays = {};
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.removeItem(SUBTRACK_CAL_PAID_LS_KEY);
    } catch (e) {}
}

(function subtrackHydratePaidCalendarFromDom() {
    subtrackReloadPaidCalendarFromBootstrap();
})();

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
function advanceNextDueAfterPayment(dateStr, period, termEndStr, billingDay) {
    var iso = normalizeSubscriptionDateIso(dateStr);
    if (!iso) {
        return toISODateLocal(new Date());
    }
    var preferred =
        billingDay != null && billingDay >= 1 && billingDay <= 31
            ? billingDay
            : subscriptionBillingDayFromIso(iso);
    var next = addOneBillingPeriod(
        new Date(iso + 'T00:00:00'),
        period,
        preferred,
    );
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var guard = 0;
    while (next < today && guard < 240) {
        next = addOneBillingPeriod(next, period, preferred);
        guard++;
    }
    var nextIso = toISODateLocal(next);
    var termEnd = normalizeSubscriptionDateIso(termEndStr);
    if (termEnd && nextIso > termEnd) {
        return termEnd;
    }
    return nextIso;
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

/** Ģimenes dalīšana: cita personas ieraksts (tikai lasāms panelī). */
function subtrackSubscriptionIsShared(s) {
    return !!(s && s.familyShare && s.familyShare.partnerUserId);
}

/** Paziņojumi (zvans, kavētie, šodien, gaidāmie) – tikai paši abonementi. */
function subtrackSubscriptionsForNotifyList() {
    if (typeof subscriptions === 'undefined') return [];
    return subscriptions.filter(function (s) {
        return !subtrackSubscriptionIsShared(s);
    });
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
                    o._preferredBillingDay = subscriptionBillingDayFromIso(o.date);
                    return o;
                });
                if (typeof window.subtrackEnrichAllSubscriptionsFamilyShare === 'function') {
                    window.subtrackEnrichAllSubscriptionsFamilyShare();
                }
                if (typeof window.subtrackRefreshFamilySharedCache === 'function') {
                    window.subtrackRefreshFamilySharedCache();
                } else if (typeof window.subtrackMergeFamilySharedIntoSubscriptions === 'function') {
                    window.subtrackMergeFamilySharedIntoSubscriptions();
                }
                subtrackMarkSubsSyncedFromApi();
            }
            if (data && data.paidCalendarDays && typeof subtrackSetPaidCalendarDays === 'function') {
                subtrackSetPaidCalendarDays(data.paidCalendarDays);
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
        dynamicAmount: sub.dynamicAmount === true,
        dynamicCarryPrevious: sub.dynamicCarryPrevious === true,
        dueAmountOverride:
            sub.dueAmountOverride != null && !isNaN(parseFloat(sub.dueAmountOverride))
                ? parseFloat(sub.dueAmountOverride)
                : null,
        dueAmountOverrideFor: sub.dueAmountOverrideFor || '',
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
        row._preferredBillingDay = subscriptionBillingDayFromIso(row.date);
        subscriptions.push(row);
    } else {
        var prev = subscriptions[idx];
        var prevDate = normalizeSubscriptionDateIso(prev.date);
        if (row.date !== prevDate) {
            row._preferredBillingDay = subscriptionBillingDayFromIso(row.date);
        } else if (prev._preferredBillingDay >= 1 && prev._preferredBillingDay <= 31) {
            row._preferredBillingDay = prev._preferredBillingDay;
        } else {
            row._preferredBillingDay = subscriptionBillingDayFromIso(row.date);
        }
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
function attachToastHoverDismiss(toast, dismissMs) {
    var hovering = false;
    var hideTimer = null;
    var fadeTimer = null;

    function clearTimers() {
        if (hideTimer !== null) clearTimeout(hideTimer);
        if (fadeTimer !== null) clearTimeout(fadeTimer);
        hideTimer = null;
        fadeTimer = null;
    }

    function startDismiss() {
        clearTimers();
        hideTimer = setTimeout(function () {
            if (hovering) return;
            toast.style.opacity = '0';
            toast.style.transition = 'opacity .3s';
            fadeTimer = setTimeout(function () {
                toast.remove();
            }, 320);
        }, dismissMs);
    }

    toast.classList.add('toast--dismiss-hover');
    toast.addEventListener('pointerenter', function () {
        hovering = true;
        clearTimers();
        toast.style.opacity = '1';
        toast.style.transition = '';
    });
    toast.addEventListener('pointerleave', function () {
        hovering = false;
        startDismiss();
    });
    startDismiss();
}

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
    attachToastHoverDismiss(toast, type === 'info' ? 1600 : 2800);
}

function subtrackNotifyPageContentReady() {
    if (typeof window === 'undefined') return;
    try {
        window.dispatchEvent(new CustomEvent('subtrack-page-content-ready'));
    } catch (e) {}
}

if (typeof window !== 'undefined') {
    window.subtrackReloadSubscriptionsFromBootstrap = subtrackReloadSubscriptionsFromBootstrap;
    window.subtrackNotifyPageContentReady = subtrackNotifyPageContentReady;
}
