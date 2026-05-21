/* =============================================
   SubTrack - Dashboard JS
   ============================================= */

var selectedIcon = 'fa-solid fa-film';
var selectedColor = '#0d9488';
/** Pievienošanā: lietotājs manuāli izvēlējās ikonu/krāsu (netiek pārrakstīts no nosaukuma). */
var userPickedIcon = false;
var userPickedColor = false;
var visualSuggestBootstrap = null;
var editingId = null;
var deletingId = null;
var amountEditId = null;
var calendarView = null;
/** Kopīgotie ieraksti no SSR bootstrap – saglabāti pēc API sinhronizācijas. */
var subtrackCachedFamilySharedSubs = [];

/* ---- Family sharing (bootstrap no #subtrack-family-sharing-bootstrap-json) ---- */
var subtrackFamilySharingBootstrapCache = null;

function subtrackApplyFamilySharingBootstrap(data) {
    if (!data || typeof data !== 'object') return;
    subtrackFamilySharingBootstrapCache = {
        enabled: data.enabled === true,
        viewerUserId:
            typeof data.viewerUserId === 'string' ? data.viewerUserId : '',
        links: Array.isArray(data.links) ? data.links : [],
    };
    if (typeof subscriptions !== 'undefined' && subscriptions.length) {
        subtrackEnrichAllSubscriptionsFamilyShare();
        subtrackRefreshFamilySharedCache();
        if (typeof renderList === 'function') renderList();
    }
}

function subtrackReadFamilySharingBootstrap() {
    if (subtrackFamilySharingBootstrapCache) {
        return subtrackFamilySharingBootstrapCache;
    }
    var raw =
        typeof subtrackReadBootstrapJsonTextById === 'function'
            ? subtrackReadBootstrapJsonTextById('subtrack-family-sharing-bootstrap-json')
            : '';
    if (!raw) return { enabled: false, links: [] };
    try {
        var parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return { enabled: false, links: [] };
        return {
            enabled: parsed.enabled === true,
            viewerUserId:
                typeof parsed.viewerUserId === 'string' ? parsed.viewerUserId : '',
            links: Array.isArray(parsed.links) ? parsed.links : [],
        };
    } catch (e) {
        return { enabled: false, links: [] };
    }
}

function subtrackSyncFamilySharingBootstrapFromApi() {
    if (typeof fetch === 'undefined') return Promise.resolve();
    return fetch('/api/family-sharing', { credentials: 'same-origin' })
        .then(function (res) {
            if (!res.ok) return null;
            return res.json();
        })
        .then(function (data) {
            if (data) subtrackApplyFamilySharingBootstrap(data);
        })
        .catch(function () {
            /* paliek SSR bootstrap */
        });
}

function subtrackFamilySharingCombineActive() {
    var boot = subtrackReadFamilySharingBootstrap();
    if (!boot.enabled || !boot.links || !boot.links.length) return false;
    var viewerId = boot.viewerUserId || '';
    for (var i = 0; i < boot.links.length; i++) {
        var l = boot.links[i];
        if (l.status !== 'active' || l.combineInTotals !== true) continue;
        if (l.isOwner === true) return true;
        if (
            viewerId &&
            l.partnerUserId === viewerId &&
            !l.isOwner
        ) {
            return true;
        }
    }
    return false;
}

/** Atjaunina krāsu/etiķeti no family-sharing bootstrap (pēc krāsas maiņas). */
function subtrackResolveFamilyShareDisplay(familyShare) {
    if (!familyShare || !familyShare.linkId) return familyShare;
    var boot = subtrackReadFamilySharingBootstrap();
    if (!boot.links || !boot.links.length) return familyShare;
    for (var i = 0; i < boot.links.length; i++) {
        var l = boot.links[i];
        if (l.id === familyShare.linkId && l.status === 'active') {
            return {
                linkId: l.id,
                partnerUserId: familyShare.partnerUserId,
                partnerLabel: familyShare.partnerLabel,
                tintColor: l.partnerDisplayColor || familyShare.tintColor,
            };
        }
    }
    return familyShare;
}

function subtrackEnrichSubscriptionFamilyShare(sub) {
    if (!subtrackSubscriptionIsShared(sub) || !sub.familyShare) return sub;
    var fs = subtrackResolveFamilyShareDisplay(sub.familyShare);
    if (fs === sub.familyShare) return sub;
    var copy = {};
    var k;
    for (k in sub) {
        if (Object.prototype.hasOwnProperty.call(sub, k)) copy[k] = sub[k];
    }
    copy.familyShare = fs;
    return copy;
}

function subtrackEnrichAllSubscriptionsFamilyShare() {
    subscriptions = subscriptions.map(subtrackEnrichSubscriptionFamilyShare);
}

function subtrackSubscriptionsForStatsList() {
    if (!subtrackFamilySharingCombineActive()) {
        return subscriptions.filter(function (s) {
            return !subtrackSubscriptionIsShared(s);
        });
    }
    return subscriptions.slice();
}

function subtrackSubscriptionsOwnOnly() {
    return subscriptions.filter(function (s) {
        return !subtrackSubscriptionIsShared(s);
    });
}

function subtrackRefreshFamilySharedCache() {
    subtrackCachedFamilySharedSubs = subscriptions
        .filter(function (s) {
            return subtrackSubscriptionIsShared(s);
        })
        .map(subtrackEnrichSubscriptionFamilyShare);
}

function subtrackMergeFamilySharedIntoSubscriptions() {
    var own = subscriptions.filter(function (s) {
        return !subtrackSubscriptionIsShared(s);
    });
    var ownIds = {};
    own.forEach(function (s) {
        if (s && s.id != null) ownIds[String(s.id)] = true;
    });
    var shared = subtrackCachedFamilySharedSubs.filter(function (s) {
        return s && s.id != null && !ownIds[String(s.id)];
    });
    subscriptions = own.concat(shared);
}

function subtrackFamilySharingTintCss(hex) {
    var h = String(hex || '#f59e0b').trim();
    if (h.length === 4 && h.charAt(0) === '#') {
        h =
            '#' +
            h.charAt(1) +
            h.charAt(1) +
            h.charAt(2) +
            h.charAt(2) +
            h.charAt(3) +
            h.charAt(3);
    }
    var r = parseInt(h.slice(1, 3), 16);
    var g = parseInt(h.slice(3, 5), 16);
    var b = parseInt(h.slice(5, 7), 16);
    if (!isFinite(r) || !isFinite(g) || !isFinite(b)) {
        return 'rgba(245, 158, 11, 0.12)';
    }
    return 'rgba(' + r + ',' + g + ',' + b + ',0.14)';
}

/* ---- Init ----
 * Paneļa skripti tiek ielādēti pēc React mount (FsScripts); DOMContentLoaded
 * šajā brīdī jau ir noticis – inicializāciju jāpalaiž arī tad.
 */
function continueDashboardBoot() {
    subtrackEnrichAllSubscriptionsFamilyShare();
    subtrackRefreshFamilySharedCache();
    setDefaultDate();
    renderList();
    initCalendarNav();
    initPayCalIncludePaidToggle();
    initSubDynamicAmountSwitch();
    initSubAmountInlineEdit();
    initIconPicker();
    initColorPicker();
}

function fsBootDashboard() {
    var skip =
        typeof window !== 'undefined' &&
        window.__subtrackSubsApiSyncedOnce;
    if (!skip && typeof subtrackReloadSubscriptionsFromBootstrap === 'function') {
        subtrackReloadSubscriptionsFromBootstrap();
        subtrackRefreshFamilySharedCache();
    }
    Promise.all([
        subtrackSyncSubscriptionsFromApi(),
        subtrackSyncFamilySharingBootstrapFromApi(),
    ]).then(function () {
        continueDashboardBoot();
    });
}

window.fsBootDashboard = fsBootDashboard;
window.subtrackRefreshFamilySharedCache = subtrackRefreshFamilySharedCache;
window.subtrackMergeFamilySharedIntoSubscriptions = subtrackMergeFamilySharedIntoSubscriptions;
window.subtrackApplyFamilySharingBootstrap = subtrackApplyFamilySharingBootstrap;
window.subtrackEnrichAllSubscriptionsFamilyShare = subtrackEnrichAllSubscriptionsFamilyShare;

/* ---- Render ---- */
function renderList(scrollToItemId) {
    var list = document.getElementById('sub-list');
    var empty = document.getElementById('empty-state');
    if (!list || !empty) {
        subtrackRefreshFreeTierAddButtons();
        return;
    }

    updateStats();

    if (subscriptions.length === 0) {
        if (typeof subtrackClearPaidCalendarMarks === 'function') {
            subtrackClearPaidCalendarMarks();
        }
        renderPaymentCalendar();
        list.innerHTML = '';
        empty.classList.remove('hidden');
        if (typeof refreshDashNotifications === 'function') {
            refreshDashNotifications();
        }
        subtrackRefreshFreeTierAddButtons();
        return;
    }

    renderPaymentCalendar();

    empty.classList.add('hidden');
    var sorted = subscriptions.slice().sort(function (a, b) {
        return new Date(a.date + 'T00:00:00') - new Date(b.date + 'T00:00:00');
    });
    list.innerHTML = sorted.map(buildItem).join('');

    if (scrollToItemId != null) {
        smoothScrollToItemAfterRender(scrollToItemId, sorted);
    }
    if (typeof refreshDashNotifications === 'function') {
        refreshDashNotifications();
    }
    subtrackRefreshFreeTierAddButtons();
    if (typeof subtrackSyncMarkPaidButtonsPending === 'function') {
        subtrackSyncMarkPaidButtonsPending();
    }
    if (typeof subtrackSyncDeleteButtonsPending === 'function') {
        subtrackSyncDeleteButtonsPending();
    }
    if (amountEditId != null) {
        requestAnimationFrame(function () {
            var item = document.getElementById('item-' + amountEditId);
            var inp =
                item && item.querySelector
                    ? item.querySelector('.sub-amount-inline-input')
                    : null;
            if (inp) {
                inp.focus();
                if (inp.select) inp.select();
            }
        });
    }
}

function pad2Cal(n) {
    return n < 10 ? '0' + n : String(n);
}

function getPaymentsByDateInMonth(y, m) {
    var map = {};
    subscriptions.forEach(function (s) {
        var dayIso = normalizeSubscriptionDateIso(s.date);
        if (!dayIso) return;
        if (!isDueDateWithinTerm(dayIso, s.termEnd)) return;
        var d = new Date(dayIso + 'T00:00:00');
        if (isNaN(d.getTime())) return;
        if (d.getFullYear() !== y || d.getMonth() !== m) return;
        var key = dayIso;
        if (!map[key]) map[key] = [];
        map[key].push(s);
    });
    return map;
}

function shiftCalendarMonth(delta) {
    var now = new Date();
    if (calendarView === null) {
        calendarView = { y: now.getFullYear(), m: now.getMonth() };
    }
    calendarView.m += delta;
    if (calendarView.m > 11) {
        calendarView.m = 0;
        calendarView.y++;
    }
    if (calendarView.m < 0) {
        calendarView.m = 11;
        calendarView.y--;
    }
    renderPaymentCalendar();
}

function initCalendarNav() {
    var prev = document.getElementById('cal-prev');
    var next = document.getElementById('cal-next');
    if (prev && prev.dataset.subtrackBound !== '1') {
        prev.dataset.subtrackBound = '1';
        prev.addEventListener('click', function () { shiftCalendarMonth(-1); });
    }
    if (next && next.dataset.subtrackBound !== '1') {
        next.dataset.subtrackBound = '1';
        next.addEventListener('click', function () { shiftCalendarMonth(1); });
    }
}

function initPayCalIncludePaidToggle() {
    var btn = document.getElementById('pay-cal-include-paid-switch');
    if (!btn || btn.dataset.subtrackBound === '1') return;
    btn.dataset.subtrackBound = '1';
    function syncUi() {
        var on =
            typeof subtrackCalendarIncludePaidMarks === 'function' &&
            subtrackCalendarIncludePaidMarks();
        btn.setAttribute('aria-checked', on ? 'true' : 'false');
        if (on) {
            btn.classList.add('is-on');
        } else {
            btn.classList.remove('is-on');
        }
    }
    syncUi();
    btn.addEventListener('click', function () {
        var nextOn = !subtrackCalendarIncludePaidMarks();
        if (typeof subtrackSetCalendarIncludePaidMarks === 'function') {
            subtrackSetCalendarIncludePaidMarks(nextOn);
        }
        syncUi();
        renderPaymentCalendar();
    });
}

function subDynamicAmountSwitchOn() {
    var btn = document.getElementById('sub-dynamic-amount-switch');
    return !!(btn && btn.classList.contains('is-on'));
}

function setSubDynamicAmountSwitch(on) {
    var btn = document.getElementById('sub-dynamic-amount-switch');
    if (!btn) return;
    if (on) {
        btn.classList.add('is-on');
    } else {
        btn.classList.remove('is-on');
    }
    btn.setAttribute('aria-checked', on ? 'true' : 'false');
}

function initSubDynamicAmountSwitch() {
    var btn = document.getElementById('sub-dynamic-amount-switch');
    if (!btn || btn.dataset.subtrackBound === '1') return;
    btn.dataset.subtrackBound = '1';
    btn.addEventListener('click', function () {
        if (isModalSaveBusy()) return;
        setSubDynamicAmountSwitch(!subDynamicAmountSwitchOn());
    });
}

function initSubAmountInlineEdit() {
    var list = document.getElementById('sub-list');
    if (!list || list.dataset.subtrackAmountEditBound === '1') return;
    list.dataset.subtrackAmountEditBound = '1';
    list.addEventListener('keydown', function (e) {
        var inp = e.target;
        if (!inp || !inp.classList || !inp.classList.contains('sub-amount-inline-input')) {
            return;
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            commitSubAmountInline(inp);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelSubAmountInline();
        }
    });
    list.addEventListener(
        'blur',
        function (e) {
            var inp = e.target;
            if (!inp || !inp.classList || !inp.classList.contains('sub-amount-inline-input')) {
                return;
            }
            commitSubAmountInline(inp);
        },
        true,
    );
}

function openChangeAmountInline(id) {
    if (subtrackIsMarkPaidPending(id)) return;
    amountEditId = String(id);
    renderList(id);
}

function cancelSubAmountInline() {
    if (amountEditId == null) return;
    amountEditId = null;
    renderList();
}

function commitSubAmountInline(inp) {
    if (!inp) return;
    var sid = inp.getAttribute('data-subscription-id');
    if (sid == null || sid === '') return;
    var idx = subscriptions.findIndex(function (x) {
        return String(x.id) === String(sid);
    });
    if (idx === -1) {
        cancelSubAmountInline();
        return;
    }
    var raw = inp.value.trim();
    var amount =
        typeof parseDecimalAmountInput === 'function'
            ? parseDecimalAmountInput(raw)
            : parseFloat(raw);
    if (raw !== '' && (isNaN(amount) || amount < 0)) {
        shakeInputEl(inp);
        return;
    }
    if (raw === '' || isNaN(amount)) {
        amount = 0;
    }
    var s = subscriptions[idx];
    var dueIso = normalizeSubscriptionDateIso(s.date);
    var devExtra =
        typeof sumDeviceAmounts === 'function' ? sumDeviceAmounts(s, dueIso) : 0;
    var baseOverride = amount - devExtra;
    if (baseOverride < 0) baseOverride = 0;
    var prev =
        typeof subscriptionMonthlyTotal === 'function'
            ? subscriptionMonthlyTotal(s, dueIso)
            : parseFloat(s.amount) || 0;
    if (!isNaN(prev) && Math.abs(prev - amount) < 0.0001) {
        cancelSubAmountInline();
        return;
    }

    amountEditId = null;

    if (typeof window !== 'undefined' && window.__SUBTRACK_DEMO_DASHBOARD__) {
        if (typeof setDuePeriodAmountOverride === 'function') {
            setDuePeriodAmountOverride(s, baseOverride, dueIso);
        }
        renderList(sid);
        showToast(FsT('fs.dashboard.toast_amount_updated'), 'success');
        showToast(FsT('fs.dashboard.toast_demo_only'), 'success');
        return;
    }

    fetch(apiSubscriptionUrl(sid), {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            dueAmountOverride: baseOverride,
            dueDate: dueIso,
        }),
    })
        .then(parseApiJson)
        .then(function (data) {
            if (data.subscription) mergeSubscriptionFromApi(data.subscription);
            renderList(sid);
            showToast(FsT('fs.dashboard.toast_amount_updated'), 'success');
        })
        .catch(function (err) {
            var rawMsg = err && err.message ? String(err.message) : '';
            showToast(rawMsg || FsT('fs.dashboard.toast_api_save_failed'), 'error');
            renderList(sid);
        });
}

function shakeInputEl(el) {
    if (!el) return;
    el.style.borderColor = 'var(--danger)';
    el.focus();
    setTimeout(function () {
        el.style.borderColor = '';
    }, 1500);
}

/** Nedēļas dienu galvenes: pirmdiena–svētdiena (kalendārs sākas ar pirmdienu). */
function calendarWeekdayHeaders(locale) {
    var lc = String(locale || '').trim().toLowerCase();
    if (lc === 'lv' || lc.indexOf('lv-') === 0 || lc.indexOf('lv_') === 0) {
        return ['P', 'O', 'T', 'C', 'Pk', 'S', 'Sv'];
    }
    if (lc === 'en' || lc.indexOf('en-') === 0 || lc.indexOf('en_') === 0) {
        return ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    }
    var wdFmt = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
    var out = [];
    for (var wiDay = 0; wiDay < 7; wiDay++) {
        var ref = new Date(1970, 0, 5 + wiDay);
        try {
            out.push(wdFmt.format(ref));
        } catch (we) {
            out.push(String(wiDay + 1));
        }
    }
    return out;
}

function renderPaymentCalendar() {
    var host = document.getElementById('pay-calendar');
    if (!host) return;
    var nowClock = new Date();
    if (calendarView === null) {
        calendarView = { y: nowClock.getFullYear(), m: nowClock.getMonth() };
    }
    var y = calendarView.y;
    var m = calendarView.m;
    var payMap = getPaymentsByDateInMonth(y, m);
    var includePaidMarks =
        subscriptions.length > 0 &&
        typeof subtrackCalendarIncludePaidMarks === 'function' &&
        subtrackCalendarIncludePaidMarks();
    var paidPastMap = {};
    if (
        includePaidMarks &&
        typeof subtrackPaidCalendarDayMapForMonth === 'function'
    ) {
        paidPastMap = subtrackPaidCalendarDayMapForMonth(y, m);
    }

    var titleEl = document.getElementById('pay-calendar-title');
    var locale = typeof fsIntlLocale === 'function' ? fsIntlLocale() : 'lv-LV';
    if (titleEl) {
        try {
            var mf = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
            titleEl.textContent = mf.format(new Date(y, m, 15));
        } catch (fmtErr) {
            titleEl.textContent = String(m + 1) + '.' + String(y);
        }
    }

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var first = new Date(y, m, 1);
    var startPad = (first.getDay() + 6) % 7;
    var daysInMonth = new Date(y, m + 1, 0).getDate();

    var wdays = calendarWeekdayHeaders(locale);
    var html = '<div class="pay-cal-weekdays">';
    for (var wi = 0; wi < wdays.length; wi++) {
        html += '<span class="pay-cal-wd">' + wdays[wi] + '</span>';
    }
    html += '</div><div class="pay-cal-grid">';

    for (var i = 0; i < startPad; i++) {
        html += '<div class="pay-cal-cell pay-cal-cell--empty" aria-hidden="true"></div>';
    }

    for (var day = 1; day <= daysInMonth; day++) {
        var iso = y + '-' + pad2Cal(m + 1) + '-' + pad2Cal(day);
        var cellDate = new Date(y, m, day);
        cellDate.setHours(0, 0, 0, 0);

        var classes = ['pay-cal-cell'];
        if (cellDate.getTime() === today.getTime()) {
            classes.push('pay-cal-cell--today');
        }

        var list = payMap[iso];
        var familyCalColor = null;
        if (list && list.length) {
            for (var fci = 0; fci < list.length; fci++) {
                var fsub = list[fci];
                if (subtrackSubscriptionIsShared(fsub) && fsub.familyShare) {
                    var calShare = subtrackResolveFamilyShareDisplay(fsub.familyShare);
                    if (calShare && calShare.tintColor) {
                        familyCalColor = calShare.tintColor;
                    }
                    break;
                }
            }
        }
        var paidMarkCount = paidPastMap[iso] ? paidPastMap[iso] : 0;
        var showPaidOnDue =
            includePaidMarks && paidMarkCount > 0 && list && list.length > 0;
        var showPaidPastOnly =
            includePaidMarks && paidMarkCount > 0 && (!list || !list.length);

        var attrs = '';
        if (list && list.length) {
            classes.push('pay-cal-cell--due');
            if (familyCalColor) {
                classes.push('pay-cal-cell--family-shared');
            }
            if (showPaidOnDue) {
                classes.push('pay-cal-cell--due-with-paid');
            }
            var anyOverdue = false;
            for (var li = 0; li < list.length; li++) {
                var diso = normalizeSubscriptionDateIso(list[li].date);
                if (!diso) continue;
                var ds = new Date(diso + 'T00:00:00');
                ds.setHours(0, 0, 0, 0);
                if (ds < today) {
                    anyOverdue = true;
                    break;
                }
            }
            if (anyOverdue) {
                classes.push('pay-cal-cell--overdue');
            }
            var tipParts = [];
            for (var tj = 0; tj < list.length; tj++) {
                var sj = list[tj];
                tipParts.push(sj.name + ' – €' + subscriptionMonthlyTotal(sj).toFixed(2));
            }
            if (showPaidOnDue) {
                var tipPaidDue =
                    typeof FsT === 'function' ? FsT('fs.dashboard.cal_tooltip_paid_day') : '';
                if (tipPaidDue) {
                    tipParts.push(
                        tipPaidDue + (paidMarkCount > 1 ? ' (' + paidMarkCount + ')' : ''),
                    );
                }
            }
            attrs = ' data-tooltip="' + escAttr(tipParts.join('; ')) + '" tabindex="0"';
            if (familyCalColor) {
                attrs +=
                    ' style="--pay-cal-family-color:' + escAttr(familyCalColor) + ';"';
            }
        } else if (showPaidPastOnly) {
            classes.push('pay-cal-cell--paid-past');
            var tipPaid =
                typeof FsT === 'function' ? FsT('fs.dashboard.cal_tooltip_paid_day') : '';
            var tipPaidN = tipPaid;
            if (tipPaid && paidMarkCount > 1) {
                tipPaidN = tipPaid + ' (' + paidMarkCount + ')';
            }
            if (tipPaidN) {
                attrs = ' data-tooltip="' + escAttr(tipPaidN) + '" tabindex="0"';
            }
        }

        var dayInner = '<span class="pay-cal-cell-num">' + day + '</span>';
        if (list && list.length > 1) {
            dayInner += '<span class="pay-cal-cell-more" aria-hidden="true">+' + list.length + '</span>';
        }
        if (showPaidOnDue) {
            if (paidMarkCount > 1) {
                dayInner +=
                    '<span class="pay-cal-cell-paid-done-count" aria-hidden="true">+' +
                    paidMarkCount +
                    '</span>';
            } else {
                dayInner +=
                    '<span class="pay-cal-cell-paid-done" aria-hidden="true">' +
                    '<i class="fa-solid fa-check"></i></span>';
            }
        } else if (showPaidPastOnly && paidMarkCount > 1) {
            dayInner += '<span class="pay-cal-cell-more" aria-hidden="true">+' + paidMarkCount + '</span>';
        } else if (showPaidPastOnly && paidMarkCount === 1) {
            dayInner +=
                '<span class="pay-cal-cell-paid-flag" aria-hidden="true">' +
                '<i class="fa-solid fa-check"></i></span>';
        }

        html += '<div class="' + classes.join(' ') + '"' + attrs + '>' + dayInner + '</div>';
    }

    html += '</div>';
    host.innerHTML = html;
}

/**
 * Pēc „apmaksāts” ritina cauri katrai kārtai (0 … mērķis), nevis vienu lēcienu.
 * @param {Array} sorted - tas pats sakārtojums kā sarakstā
 */
function smoothScrollToItemAfterRender(id, sorted) {
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            var elTarget = document.getElementById('item-' + id);
            if (!elTarget || !sorted || !sorted.length) return;

            var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (reduced) {
                elTarget.scrollIntoView({ block: 'end', inline: 'nearest' });
                flashScrollHighlight(elTarget);
                return;
            }

            var targetIdx = sorted.findIndex(function (s) { return s.id === id; });
            if (targetIdx === -1) return;

            var startIdx = getFirstVisibleSortedIndex(sorted);
            var step = targetIdx >= startIdx ? 1 : -1;

            var nSteps = Math.abs(targetIdx - startIdx) + 1;
            var pauseMs = nSteps > 14 ? 26 : 48;
            var interMin = nSteps > 14 ? 200 : 260;
            var interMax = nSteps > 14 ? 400 : 580;

            function runStep(idx) {
                var sid = sorted[idx].id;
                var el = document.getElementById('item-' + sid);
                if (!el) return;

                var isFinal = idx === targetIdx;
                var targetY = isFinal ? computeDnDStyleScrollTarget(el) : computeStepPeekScrollTarget(el);
                var opts = isFinal
                    ? { minDuration: 480, maxDuration: 1900 }
                    : { minDuration: interMin, maxDuration: interMax };

                animateWindowScrollTo(targetY, function () {
                    if (isFinal) {
                        flashScrollHighlight(el);
                    } else {
                        setTimeout(function () { runStep(idx + step); }, pauseMs);
                    }
                }, opts);
            }

            runStep(startIdx);
        });
    });
}

function flashScrollHighlight(el) {
    el.classList.add('sub-item--scroll-highlight');
    setTimeout(function () {
        el.classList.remove('sub-item--scroll-highlight');
    }, 1400);
}

/** Pirmā sakārtotā kārta, kas šobrīd ir skatā (zem topbar). */
function getFirstVisibleSortedIndex(sorted) {
    var topLim = 76;
    var vh = window.innerHeight;
    for (var i = 0; i < sorted.length; i++) {
        var el = document.getElementById('item-' + sorted[i].id);
        if (!el) continue;
        var r = el.getBoundingClientRect();
        if (r.bottom > topLim && r.top < vh) {
            return i;
        }
    }
    return 0;
}

/** Starpposma solis: kārtas augšējā mala zem augšējās joslas — „novelcas” cauri katram ierakstam. */
function computeStepPeekScrollTarget(el) {
    var docEl = document.documentElement;
    var maxScroll = Math.max(0, docEl.scrollHeight - window.innerHeight);
    var rect = el.getBoundingClientRect();
    var topbarRoom = 72;
    var target = window.pageYOffset + rect.top - topbarRoom;
    return Math.min(Math.max(0, target), maxScroll);
}

/** Ritināt tā, lai karte būtu skata apakšā (līdzīgi DnD autoscroll uz saraksta beigām). */
function computeDnDStyleScrollTarget(el) {
    var viewH = window.innerHeight;
    var docEl = document.documentElement;
    var maxScroll = Math.max(0, docEl.scrollHeight - viewH);
    var rect = el.getBoundingClientRect();
    var marginBottom = 28;
    var topbarRoom = 72;
    var alignBottom = window.pageYOffset + rect.bottom - (viewH - marginBottom);
    var alignTopMin = window.pageYOffset + rect.top - topbarRoom;
    var target = Math.max(alignBottom, alignTopMin);
    return Math.min(Math.max(0, target), maxScroll);
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * @param {function} onDone
 * @param {{ minDuration?: number, maxDuration?: number }} [options]
 */
function animateWindowScrollTo(targetY, onDone, options) {
    options = options || {};
    var startY = window.pageYOffset;
    var distance = targetY - startY;
    if (Math.abs(distance) < 3) {
        if (onDone) onDone();
        return;
    }
    var minD = options.minDuration != null ? options.minDuration : 480;
    var maxD = options.maxDuration != null ? options.maxDuration : 1700;
    var ms = Math.min(maxD, Math.max(minD, Math.pow(Math.abs(distance), 0.72) * 2.2));
    var t0 = performance.now();

    function tick(now) {
        var raw = Math.min(1, (now - t0) / ms);
        var eased = easeInOutCubic(raw);
        window.scrollTo(0, startY + distance * eased);
        if (raw < 1) {
            requestAnimationFrame(tick);
        } else if (onDone) {
            onDone();
        }
    }
    requestAnimationFrame(tick);
}

function computeTermProgressPct(startStr, endStr) {
    if (!startStr || !endStr) return null;
    var start = new Date(startStr + 'T00:00:00');
    var end = new Date(endStr + 'T00:00:00');
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return null;
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    var totalMs = end - start;
    var elapsedMs = now - start;
    var pct = Math.round((elapsedMs / totalMs) * 100);
    return Math.max(0, Math.min(100, pct));
}

function formatDateWithYear(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return '';
    var loc = typeof fsIntlLocale === 'function' ? fsIntlLocale() : 'lv-LV';
    try {
        return new Intl.DateTimeFormat(loc, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(d);
    } catch (err) {
        var day = d.getDate();
        var month = d.getMonth() + 1;
        var pad = function (n) {
            return n < 10 ? '0' + n : String(n);
        };
        return pad(day) + '.' + pad(month) + '.' + d.getFullYear();
    }
}

function wholeMonthsFromEndRemaining(endStr) {
    if (!endStr) return 0;
    var end = new Date(endStr + 'T00:00:00');
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    if (end <= now) return 0;
    var total = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
    if (end.getDate() < now.getDate()) total--;
    return Math.max(0, total);
}

function buildTermHtml(s) {
    if (!s.termStart || !s.termEnd) return '';
    var pct = computeTermProgressPct(s.termStart, s.termEnd);
    if (pct === null) return '';
    var c = s.color || '#0d9488';
    var rightCol;
    var dateLine = escHtml(formatDateWithYear(s.termStart)) + ' - ' + escHtml(formatDateWithYear(s.termEnd));
    if (pct >= 100) {
        rightCol = '<span class="sub-term-pct sub-term-pct-done">' + escHtml(FsT('fs.dashboard.term_done')) + '</span>';
    } else {
        var mo = wholeMonthsFromEndRemaining(s.termEnd);
        var remParen = mo > 0
            ? ' <span class="sub-term-atlikums">(' + escHtml(formatMonthsRemainingLong(mo)) + ')</span>'
            : '';
        dateLine = dateLine + remParen;
        rightCol =
            '<span class="sub-term-pct"><strong>' +
            pct +
            '%</strong> ' +
            escHtml(FsT('fs.dashboard.term_progress_suffix')) +
            '</span>';
    }
    return '<div class="sub-term-block">' +
        '<div class="sub-term-header">' +
        '<div class="sub-term-label"><i class="fa-solid fa-hourglass-half"></i> ' +
        escHtml(FsT('landing.mock.term_label')) +
        dateLine +
        '</div>' +
        rightCol +
        '</div>' +
        '<div class="sub-term-bar-track"><div class="sub-term-bar-fill" style="width:' + pct + '%;background:' + escAttr(c) + ';"></div></div>' +
        '</div>';
}

function deviceNameWithNoteHtml(dev) {
    if (!dev || !dev.name) return '';
    var note = dev.note != null ? String(dev.note).trim() : '';
    var nameHtml = escHtml(dev.name);
    if (note) {
        nameHtml += ' <span class="sub-device-list-note">(' + escHtml(note) + ')</span>';
    }
    return nameHtml;
}

/** Mēneša papildu summa iekārtai / papildu pozīcijai (rāda aiz nosaukuma). */
function deviceAmountInlineHtml(dev) {
    if (!dev) return '';
    var amt = parseFloat(dev.amount);
    if (isNaN(amt)) amt = 0;
    return ' <span class="sub-device-amount-inline">' + escHtml(amt.toFixed(2)) + ' €</span>';
}

function buildDeviceTermHtml(dev, parentColor) {
    if (!dev || !dev.name || !dev.termStart || !dev.termEnd) return '';
    var pct = computeTermProgressPct(dev.termStart, dev.termEnd);
    if (pct === null) return '';
    var c = parentColor || '#0d9488';
    var rightCol;
    var dateLine = escHtml(formatDateWithYear(dev.termStart)) + ' - ' + escHtml(formatDateWithYear(dev.termEnd));
    if (pct >= 100) {
        rightCol = '<span class="sub-term-pct sub-term-pct-done">' + escHtml(FsT('fs.dashboard.term_done')) + '</span>';
    } else {
        var moD = wholeMonthsFromEndRemaining(dev.termEnd);
        var remParenD = moD > 0
            ? ' <span class="sub-term-atlikums">(' + escHtml(formatMonthsRemainingLong(moD)) + ')</span>'
            : '';
        dateLine = dateLine + remParenD;
        rightCol =
            '<span class="sub-term-pct"><strong>' +
            pct +
            '%</strong> ' +
            escHtml(FsT('fs.dashboard.term_progress_suffix')) +
            '</span>';
    }
    return '<div class="sub-term-block sub-term-block--device">' +
        '<div class="sub-term-header">' +
        '<div class="sub-term-label"><i class="fa-solid fa-layer-group"></i> ' + deviceNameWithNoteHtml(dev) + deviceAmountInlineHtml(dev) + ' <span class="sub-device-term-sep" aria-hidden="true">·</span> ' +
        dateLine + '</div>' +
        rightCol +
        '</div>' +
        '<div class="sub-term-bar-track"><div class="sub-term-bar-fill" style="width:' + pct + '%;background:' + escAttr(c) + ';"></div></div>' +
        '</div>';
}

function buildItem(s) {
    var dateLabel = formatDate(s.date);
    var urgencyClass = getUrgencyClass(s.date);
    var overdueMeta = '';
    if (urgencyClass === 'overdue') {
        var od = getOverdueDays(s.date);
        overdueMeta = ' <span class="sub-date-overdue-meta">· ' + escHtml(formatOverdueLabel(od)) + '</span>';
    }
    var dateLineClass = 'sub-date ' + urgencyClass;
    var dateIcon = urgencyClass === 'overdue'
        ? '<i class="fa-solid fa-triangle-exclamation"></i> '
        : (urgencyClass === 'soon' ? '<i class="fa-solid fa-hourglass-half"></i> ' : '<i class="fa-regular fa-calendar"></i> ');
    var periodLabel = periodTextUi(s.period);
    var amountMonth = monthlyAmount(
        typeof effectiveBaseAmountForDue === 'function'
            ? effectiveBaseAmountForDue(s, s.date)
            : s.amount,
        s.period,
    );
    var devExtra = sumDeviceAmounts(s);
    var displayTotal = subscriptionMonthlyTotal(s);
    var billingActive =
        typeof isSubscriptionDueActive === 'function' && isSubscriptionDueActive(s);
    var iconClass = s.icon || 'fa-solid fa-box';
    var termHtml = buildTermHtml(s);
    var deviceBlocks = '';
    if (s.devices && s.devices.length) {
        s.devices.forEach(function (d) {
            deviceBlocks += buildDeviceTermHtml(d, s.color);
        });
    }
    var extraWord = FsT('fs.dashboard.device_extra_note');
    var amountNote =
        devExtra > 0
            ? '<div class="sub-amount-note">+' +
              devExtra.toFixed(2) +
              ' € ' +
              escHtml(extraWord || 'papildu') +
              '</div>'
            : '';

    var isAmountEditing = amountEditId != null && String(amountEditId) === String(s.id);
    var amountMainHtml;
    if (isAmountEditing) {
        var amtIn = !isNaN(displayTotal) ? displayTotal.toFixed(2) : '';
        amountMainHtml =
            '<div class="sub-amount sub-amount--editing">' +
            '<span class="sub-amount-currency" aria-hidden="true">€</span>' +
            '<input type="text" class="sub-amount-inline-input" inputmode="decimal" autocomplete="off" ' +
            'data-subscription-id="' +
            escAttr(String(s.id)) +
            '" value="' +
            escAttr(amtIn) +
            '" aria-label="' +
            escAttr(FsT('fs.dashboard.aria_change_amount')) +
            '" />' +
            '</div>';
    } else {
        amountMainHtml =
            '<div class="sub-amount">€' + displayTotal.toFixed(2) + '</div>';
    }

    var changeAmountBtn =
        s.dynamicAmount === true
            ? '<button type="button" class="icon-btn change-amount" data-subscription-id="' +
              escAttr(String(s.id)) +
              '" data-tooltip="' +
              escAttr(FsT('fs.dashboard.tooltip_change_amount')) +
              '" aria-label="' +
              escAttr(FsT('fs.dashboard.aria_change_amount')) +
              '" onclick=\'openChangeAmountInline(' +
              JSON.stringify(String(s.id)) +
              ')\'><i class="fa-solid fa-right-left" aria-hidden="true"></i></button>'
            : '';

    var dynamicAmountBadge =
        s.dynamicAmount === true
            ? '<span class="sub-dynamic-amount-badge" data-tooltip="' +
              escAttr(FsT('fs.dashboard.label_dynamic_amount')) +
              '" aria-label="' +
              escAttr(FsT('fs.dashboard.label_dynamic_amount')) +
              '"><i class="fa-solid fa-chart-line" aria-hidden="true"></i></span>'
            : '';

    var isShared = subtrackSubscriptionIsShared(s);
    var sharedBadge = '';
    var itemStyle = '';
    var itemExtraClass = '';
    if (isShared && s.familyShare) {
        var shareDisplay = subtrackResolveFamilyShareDisplay(s.familyShare);
        itemExtraClass = ' sub-item--family-shared';
        itemStyle =
            ' style="background:' +
            escAttr(subtrackFamilySharingTintCss(shareDisplay.tintColor)) +
            ';"';
        var sharedLbl = FsT('family_sharing.badge_shared') || 'Shared';
        var partnerName = escHtml(shareDisplay.partnerLabel || '');
        sharedBadge =
            '<span class="sub-family-share-badge" title="' +
            escAttr(partnerName) +
            '">' +
            escHtml(sharedLbl) +
            (partnerName ? ' · ' + partnerName : '') +
            '</span>';
    }

    var billingActions =
        !isShared && billingActive
            ? '<button type="button" class="icon-btn mark-paid" data-subscription-id="' +
              escAttr(String(s.id)) +
              '" data-tooltip="' +
              escAttr(FsT('fs.dashboard.tooltip_mark_paid')) +
              '" aria-label="' +
              escAttr(FsT('fs.dashboard.aria_mark_paid')) +
              '" onclick=\'markPaid(' +
              JSON.stringify(String(s.id)) +
              ')\'>' +
              subtrackMarkPaidButtonInnerHtml() +
              '</button>'
            : '';

    var editDeleteActions = isShared
        ? ''
        : changeAmountBtn +
          '<button type="button" class="icon-btn" data-tooltip="' +
          escAttr(FsT('fs.dashboard.tooltip_edit')) +
          '" aria-label="' +
          escAttr(FsT('fs.dashboard.aria_edit')) +
          '" onclick=\'openEditModal(' +
          JSON.stringify(String(s.id)) +
          ')\'><i class="fa-solid fa-pen"></i></button>' +
          '<button type="button" class="icon-btn delete" data-subscription-id="' +
          escAttr(String(s.id)) +
          '" data-tooltip="' +
          escAttr(FsT('fs.dashboard.tooltip_delete')) +
          '" aria-label="' +
          escAttr(FsT('fs.dashboard.aria_delete')) +
          '" onclick=\'openDeleteModal(' +
          JSON.stringify(String(s.id)) +
          ')\'>' +
          subtrackDeleteButtonInnerHtml() +
          '</button>';

    return '<div class="sub-item' + itemExtraClass + '" id="item-' + s.id + '"' + itemStyle + '>' +
        '<div class="sub-item-top">' +
            '<div class="sub-icon-col">' +
                '<span class="sub-icon-bg">' +
                '<i class="' + escAttr(iconClass) + '" style="color:' + escAttr(s.color) + ';"></i>' +
                '</span></div>' +
            '<div class="sub-main">' +
                    '<div class="sub-info">' +
                    '<div class="sub-name-row">' +
                    '<span class="sub-name">' +
                    escHtml((s.name && String(s.name).trim()) ? String(s.name).trim() : (FsT('fs.dashboard.list_untitled') || '-')) +
                    '</span>' +
                    sharedBadge +
                    dynamicAmountBadge +
                    (s.note ? '<span class="sub-note-inline">' + escHtml(s.note) + '</span>' : '') +
                    '<span class="sub-category-pill">' + escHtml(categoryLabel(s.category)) + '</span>' +
                    '</div>' +
                    '<div class="' +
                    dateLineClass +
                    '">' +
                    dateIcon +
                    '<span>' +
                    escHtml(FsT('landing.mock.pay_line')) +
                    escHtml(dateLabel) +
                    '</span>' +
                    overdueMeta +
                    '</div>' +
                '</div>' +
                '<div class="sub-right">' +
                    '<div class="sub-actions">' +
                    billingActions +
                    editDeleteActions +
                    '</div>' +
                    '<div class="sub-amount-wrap">' +
                        amountMainHtml +
                        amountNote +
                        '<div class="sub-period">' + escHtml(periodLabel) + '</div>' +
                        (s.period !== 'monthly'
                            ? '<div class="sub-period">≈ €' +
                              amountMonth.toFixed(2) +
                              escHtml(FsT('fs.analytics.per_month_abbr') || '/mēn.') +
                              '</div>'
                            : '') +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>' +
        termHtml +
        deviceBlocks +
    '</div>';
}

/* ---- Mark paid (sinhronizācija ar API) ---- */
function markPaid(id) {
    if (subtrackIsMarkPaidPending(id)) return;
    var idx = subscriptions.findIndex(function (x) {
        return String(x.id) === String(id);
    });
    if (idx === -1) return;
    var s = subscriptions[idx];
    if (subtrackSubscriptionIsShared(s)) return;
    if (typeof isSubscriptionDueActive === 'function' && !isSubscriptionDueActive(s)) {
        return;
    }
    var paidOnIso = normalizeSubscriptionDateIso(s.date);
    var period = s.period || 'monthly';
    var newDate = advanceNextDueAfterPayment(s.date, period, s.termEnd);

    subtrackSetMarkPaidPending(id, true);

    if (typeof window !== 'undefined' && window.__SUBTRACK_DEMO_DASHBOARD__) {
        s.date = normalizeSubscriptionDateIso(newDate) || newDate;
        if (typeof clearDuePeriodAmountOverride === 'function') {
            clearDuePeriodAmountOverride(s);
        }
        if (paidOnIso && typeof subtrackAddPaidCalendarDay === 'function') {
            subtrackAddPaidCalendarDay(paidOnIso);
        }
        var rawDemo = FsT('fs.dashboard.toast_marked_paid');
        showToast(
            rawDemo ? rawDemo.replace(/\{date\}/g, formatDate(s.date)) : 'Maksājums.',
            'success',
        );
        showToast(FsT('fs.dashboard.toast_demo_only'), 'success');
        subtrackSetMarkPaidPending(id, false);
        renderList(id);
        return;
    }

    var patchBody =
        typeof subtrackMarkPaidPatchBody === 'function'
            ? subtrackMarkPaidPatchBody(s, newDate, paidOnIso)
            : { date: newDate, markPaid: true, paidOn: paidOnIso };

    fetch(apiSubscriptionUrl(s.id), {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchBody),
    })
        .then(parseApiJson)
        .then(function (data) {
            var shownDate = newDate;
            if (data.subscription && data.subscription.date) {
                mergeSubscriptionFromApi(data.subscription);
                shownDate = normalizeSubscriptionDateIso(data.subscription.date) || newDate;
            } else {
                s.date = normalizeSubscriptionDateIso(newDate) || newDate;
            }
            if (data.paidCalendarDays && typeof subtrackSetPaidCalendarDays === 'function') {
                subtrackSetPaidCalendarDays(data.paidCalendarDays);
            } else if (paidOnIso && typeof subtrackAddPaidCalendarDay === 'function') {
                subtrackAddPaidCalendarDay(paidOnIso);
            }
            return subtrackSyncSubscriptionsFromApi().then(function () {
                return shownDate;
            });
        })
        .then(function (shownDate) {
            var raw = FsT('fs.dashboard.toast_marked_paid');
            showToast(raw ? raw.replace(/\{date\}/g, formatDate(shownDate)) : 'Maksājums.', 'success');
            renderList(id);
        })
        .catch(function () {
            showToast(FsT('fs.dashboard.toast_api_save_failed'), 'error');
        })
        .finally(function () {
            subtrackSetMarkPaidPending(id, false);
        });
}

/* ---- Stats ---- */
var DASHBOARD_CATEGORY_COLORS = [
    '#0d9488', '#f59e0b', '#3b82f6', '#64748b', '#e11d48', '#8b5cf6', '#059669', '#d97706'
];

function renderDashboardCategoryBar() {
    var host = document.getElementById('dashboard-category-bar');
    if (!host) return;

    var byCat = {};
    subtrackSubscriptionsForStatsList().forEach(function (s) {
        var k = normalizeCategoryKey(s.category);
        if (!byCat[k]) byCat[k] = 0;
        byCat[k] += subscriptionMonthlyTotal(s);
    });

    var catKeys = Object.keys(byCat)
        .filter(function (k) {
            return byCat[k] > 0;
        })
        .sort(function (a, b) {
            return byCat[b] - byCat[a];
        });

    var total = catKeys.reduce(function (sum, k) {
        return sum + byCat[k];
    }, 0);

    if (!catKeys.length || total <= 0) {
        host.classList.add('hidden');
        host.innerHTML = '';
        return;
    }

    host.classList.remove('hidden');

    var ariaLabel = FsT('fs.dashboard.category_bar_aria');
    if (!ariaLabel) ariaLabel = 'Kopējā summa sadalījumā pa kategorijām';

    var track =
        '<div class="dashboard-category-bar-track" role="img" aria-label="' +
        escAttr(ariaLabel) +
        '">';
    var legend = '<ul class="dashboard-category-bar-legend">';

    catKeys.forEach(function (k, i) {
        var amt = byCat[k];
        var pct = (amt / total) * 100;
        var color = DASHBOARD_CATEGORY_COLORS[i % DASHBOARD_CATEGORY_COLORS.length];
        var label = categoryLabel(k);
        var pctRounded = Math.round(pct);
        var segTip = label + ' · €' + amt.toFixed(2) + ' · ' + pctRounded + '%';
        track +=
            '<div class="dashboard-category-bar-seg" style="width:' +
            pct.toFixed(4) +
            '%;background:' +
            escAttr(color) +
            ';" data-tooltip="' +
            escAttr(segTip) +
            '" tabindex="0" role="img" aria-label="' +
            escAttr(label + ' €' + amt.toFixed(2) + ' ' + pctRounded + '%') +
            '"></div>';
        legend +=
            '<li class="dashboard-category-bar-legend-item">' +
            '<span class="dashboard-category-bar-swatch" style="background:' +
            escAttr(color) +
            ';" aria-hidden="true"></span>' +
            '<span class="dashboard-category-bar-name">' +
            escHtml(label) +
            '</span>' +
            '<span class="dashboard-category-bar-meta">€' +
            amt.toFixed(2) +
            ' · ' +
            pctRounded +
            '%</span>' +
            '</li>';
    });

    track += '</div>';
    legend += '</ul>';
    host.innerHTML = track + legend;
}

function dashboardStatsTodayRef() {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

function dashboardStatsIsoToday() {
    var today = dashboardStatsTodayRef();
    if (typeof toISODateLocal === 'function') return toISODateLocal(today);
    var y = today.getFullYear();
    var m = String(today.getMonth() + 1).padStart(2, '0');
    var d = String(today.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
}

function partitionSubscriptionsForNextPayStats() {
    var today = dashboardStatsTodayRef();
    var isoToday = dashboardStatsIsoToday();
    var overdue = [];
    var dueToday = [];
    var future = [];

    subtrackSubscriptionsOwnOnly().forEach(function (s) {
        if (typeof isSubscriptionDueActive === 'function' && !isSubscriptionDueActive(s, today)) {
            return;
        }
        var dIso = normalizeSubscriptionDateIso(s.date);
        if (!dIso) return;
        var d = new Date(dIso + 'T00:00:00');
        d.setHours(0, 0, 0, 0);
        if (d.getTime() < today.getTime()) overdue.push(s);
        else if (dIso === isoToday) dueToday.push(s);
        else future.push({ s: s, d: d });
    });

    overdue.sort(function (a, b) {
        return (
            new Date(normalizeSubscriptionDateIso(a.date) + 'T00:00:00') -
            new Date(normalizeSubscriptionDateIso(b.date) + 'T00:00:00')
        );
    });
    dueToday.sort(function (a, b) {
        return String(a.name || '').localeCompare(String(b.name || ''));
    });
    future.sort(function (a, b) {
        return a.d - b.d;
    });

    return { overdue: overdue, dueToday: dueToday, future: future };
}

function sumStatsPaymentsForList(list, refDate) {
    return list.reduce(function (sum, s) {
        return sum + subscriptionMonthlyTotal(s, refDate);
    }, 0);
}

function formatStatBillsCount(count) {
    var n = Number(count) || 0;
    if (n === 1) {
        var one = FsT('fs.dashboard.stat_bills_one');
        return one || '1 rēķins';
    }
    var tpl = FsT('fs.dashboard.stat_bills_other');
    return tpl ? tpl.replace(/\{count\}/g, String(n)) : n + ' rēķini';
}

function renderStatNextPayUrgencyCol(kind, labelKey, list) {
    var label = FsT(labelKey) || '';
    var count = list.length;
    var sum = sumStatsPaymentsForList(list, dashboardStatsTodayRef());
    var mod = kind === 'overdue' ? 'stat-next-pay-col--overdue' : 'stat-next-pay-col--today';
    return (
        '<div class="stat-next-pay-col ' +
        mod +
        '">' +
        '<div class="stat-label">' +
        escHtml(label) +
        '</div>' +
        '<div class="stat-next-body">' +
        '<div class="stat-next-text">' +
        '<div class="stat-value stat-value--next">€' +
        sum.toFixed(2) +
        '</div>' +
        '<div class="stat-next-name">' +
        escHtml(formatStatBillsCount(count)) +
        '</div>' +
        '</div>' +
        '</div></div>'
    );
}

function renderStatNextPayFutureCol(nextEntry, emptyMsg, compact) {
    var label = FsT('landing.mock.next_pay_label') || 'Nākamais maksājums';
    var value = '-';
    var name = emptyMsg || '';
    var sideAmount = '';

    if (nextEntry && nextEntry.s) {
        var pay = subscriptionMonthlyTotal(nextEntry.s, dashboardStatsTodayRef());
        name = nextEntry.s.name || '';
        if (compact) {
            value = '€' + pay.toFixed(2);
        } else {
            value = formatDate(nextEntry.s.date);
            sideAmount = '€' + pay.toFixed(2);
        }
    }

    var colClass = 'stat-next-pay-col stat-next-pay-col--next';
    if (compact) colClass += ' stat-next-pay-col--next-compact';

    var amountHtml = '';
    if (!compact && sideAmount) {
        amountHtml =
            '<div class="stat-next-amount">' + escHtml(sideAmount) + '</div>';
    }

    return (
        '<div class="' +
        colClass +
        '">' +
        '<div class="stat-label">' +
        escHtml(label) +
        '</div>' +
        '<div class="stat-next-body">' +
        '<div class="stat-next-text">' +
        '<div class="stat-value stat-value--next">' +
        escHtml(value) +
        '</div>' +
        '<div class="stat-next-name">' +
        escHtml(name) +
        '</div>' +
        '</div>' +
        amountHtml +
        '</div></div>'
    );
}

function renderNextPayStatsBlock() {
    var root = document.getElementById('stat-next-pay-root');
    if (!root) return;

    if (!subscriptions.length) {
        root.className = 'stat-next-pay-grid stat-next-pay-grid--cols-1';
        root.innerHTML = renderStatNextPayFutureCol(
            null,
            FsT('fs.dashboard.empty_no_subscriptions') || '',
        );
        return;
    }

    var parts = partitionSubscriptionsForNextPayStats();
    var cols = [];

    if (parts.overdue.length) {
        cols.push(renderStatNextPayUrgencyCol('overdue', 'fs.dashboard.stat_overdue_label', parts.overdue));
    }
    if (parts.dueToday.length) {
        cols.push(renderStatNextPayUrgencyCol('today', 'fs.dashboard.stat_today_due_label', parts.dueToday));
    }

    var compactNext = parts.overdue.length > 0 && parts.dueToday.length > 0;

    if (parts.future.length > 0) {
        cols.push(renderStatNextPayFutureCol(parts.future[0], '', compactNext));
    } else if (!parts.overdue.length && !parts.dueToday.length) {
        cols.push(
            renderStatNextPayFutureCol(null, FsT('fs.dashboard.empty_nothing_upcoming') || '', false),
        );
    } else if (parts.dueToday.length || parts.overdue.length) {
        cols.push(
            renderStatNextPayFutureCol(null, FsT('fs.dashboard.empty_nothing_upcoming') || '', compactNext),
        );
    }

    var n = cols.length;
    if (n < 1) n = 1;
    root.className = 'stat-next-pay-grid stat-next-pay-grid--cols-' + n;
    root.innerHTML = cols.join('');
}

function updateStats() {
    var statsList = subtrackSubscriptionsForStatsList();
    var ownList = subtrackSubscriptionsOwnOnly();
    var combineOn = subtrackFamilySharingCombineActive();

    var total = statsList.reduce(function (sum, s) {
        return sum + subscriptionMonthlyTotal(s);
    }, 0);
    var ownTotal = ownList.reduce(function (sum, s) {
        return sum + subscriptionMonthlyTotal(s);
    }, 0);

    var totalEl = document.getElementById('stat-total');
    if (totalEl) totalEl.textContent = '€' + total.toFixed(2);

    var markEl = document.getElementById('stat-total-combined-mark');
    if (markEl) {
        if (combineOn) markEl.classList.remove('hidden');
        else markEl.classList.add('hidden');
    }

    var ownEl = document.getElementById('stat-own-only');
    if (ownEl) {
        if (combineOn) {
            var ownTip = FsT('fs.dashboard.stat_own_only_label') || '';
            ownEl.textContent = '€' + ownTotal.toFixed(2);
            ownEl.setAttribute('data-tooltip', ownTip);
            ownEl.setAttribute('tabindex', '0');
            ownEl.setAttribute('aria-label', ownTip + ' €' + ownTotal.toFixed(2));
            ownEl.classList.remove('hidden');
        } else {
            ownEl.textContent = '';
            ownEl.removeAttribute('data-tooltip');
            ownEl.setAttribute('tabindex', '-1');
            ownEl.removeAttribute('aria-label');
            ownEl.classList.add('hidden');
        }
    }

    var countEl = document.getElementById('stat-count');
    if (countEl) countEl.textContent = String(subscriptions.length);

    renderNextPayStatsBlock();
    renderDashboardCategoryBar();
}

/* ---- Free tier: neļaut atvērt „Pievienot” modāli pie limita ---- */
function subtrackReadFreeTierGate() {
    var raw =
        typeof subtrackReadBootstrapJsonTextById === 'function'
            ? subtrackReadBootstrapJsonTextById('subtrack-free-tier-gate-json')
            : '';
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

function subtrackFreeTierBlockedMessage() {
    var g = subtrackReadFreeTierGate();
    var lim = g && typeof g.freeLimit === 'number' ? g.freeLimit : parseInt(String(g && g.freeLimit), 10);
    if (!isFinite(lim)) lim = 0;
    var price = g && typeof g.priceEur === 'number' ? g.priceEur : parseFloat(String(g && g.priceEur));
    if (!isFinite(price)) price = 0;
    var intl = fsIntlLocale();
    var priceFmt;
    try {
        priceFmt = new Intl.NumberFormat(intl, { style: 'currency', currency: 'EUR' }).format(price);
    } catch (e) {
        priceFmt = '€' + String(price);
    }
    var tpl = FsT('api.subscriptions.free_tier_limit');
    if (!tpl) tpl = 'Free tier limit reached ({count} entries). Paid plan: {price}/mo.';
    return tpl.replace(/\{count\}/g, String(lim)).replace(/\{price\}/g, priceFmt);
}

function subtrackIsFreeTierAddBlocked() {
    var g = subtrackReadFreeTierGate();
    if (!g || !g.enforcement) return false;
    if (g.isPaidUser === true) return false;
    var lim = typeof g.freeLimit === 'number' ? g.freeLimit : parseInt(String(g.freeLimit), 10);
    if (!isFinite(lim) || lim < 0) return false;
    var n = typeof subscriptions !== 'undefined' && subscriptions ? subscriptions.length : 0;
    return n >= lim;
}

function subtrackRefreshFreeTierAddButtons() {
    var blocked = subtrackIsFreeTierAddBlocked();
    var msg = blocked ? subtrackFreeTierBlockedMessage() : '';
    document.querySelectorAll('[data-subtrack-add-sub="1"]').forEach(function (btn) {
        if (!(btn instanceof HTMLButtonElement)) return;
        btn.disabled = blocked;
        if (blocked) {
            btn.setAttribute('aria-disabled', 'true');
            if (msg) btn.title = msg;
        } else {
            btn.removeAttribute('aria-disabled');
            btn.removeAttribute('title');
        }
    });
}

function syncBodyModalScrollLock() {
    var openOverlay = document.querySelector('.modal-overlay.open');
    var root = document.documentElement;
    if (!root) return;
    if (openOverlay) root.classList.add('subtrack-modal-open');
    else root.classList.remove('subtrack-modal-open');
}

/* ---- Add Modal ---- */
function openAddModal() {
    if (subtrackIsFreeTierAddBlocked()) {
        showToast(subtrackFreeTierBlockedMessage(), 'error');
        return;
    }
    collapseIconPicker();
    collapseModalAdvanced();
    clearDeviceEditor();
    editingId = null;
    document.getElementById('modal-title').textContent = FsT('fs.dashboard.modal_add_title');
    setModalSavePending(false);
    modalSaveSetLabel(FsT('fs.dashboard.modal_add_submit'));
    document.getElementById('sub-name').value = '';
    document.getElementById('sub-category').value = 'subscription';
    document.getElementById('sub-amount').value = '';
    document.getElementById('sub-period').value = 'monthly';
    document.getElementById('sub-note').value = '';
    document.getElementById('sub-term-start').value = '';
    document.getElementById('sub-term-end').value = '';
    setDefaultDate();
    setSubDynamicAmountSwitch(false);
    userPickedIcon = false;
    userPickedColor = false;
    applyAutoVisualForAdd('');
    document.getElementById('modal-overlay').classList.add('open');
    syncBodyModalScrollLock();
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            renderIconPickerHints();
        });
    });
    setTimeout(function() { document.getElementById('sub-name').focus(); }, 100);
}

function openEditModal(id) {
    var s = subscriptions.find(function (x) {
        return String(x.id) === String(id);
    });
    if (!s) return;
    editingId = String(id);
    collapseIconPicker();
    clearDeviceEditor();

    document.getElementById('modal-title').textContent = FsT('fs.dashboard.modal_edit_title');
    setModalSavePending(false);
    modalSaveSetLabel(FsT('fs.dashboard.modal_save'));
    document.getElementById('sub-name').value = s.name || '';
    document.getElementById('sub-category').value = normalizeCategoryKey(s.category);
    document.getElementById('sub-amount').value = s.amount != null ? s.amount : '';
    document.getElementById('sub-period').value = s.period || 'monthly';
    document.getElementById('sub-date').value = s.date || '';
    document.getElementById('sub-note').value = s.note || '';
    document.getElementById('sub-term-start').value = s.termStart || '';
    document.getElementById('sub-term-end').value = s.termEnd || '';
    if (s.devices && s.devices.length) {
        s.devices.forEach(function (d) { addDeviceRow(d); });
    }
    if (s.termStart || s.termEnd || (s.devices && s.devices.length)) {
        expandModalAdvanced();
    } else {
        collapseModalAdvanced();
    }
    selectIcon(s.icon || 'fa-solid fa-film');
    selectColor(s.color || '#0d9488');
    setSubDynamicAmountSwitch(s.dynamicAmount === true);
    document.getElementById('modal-overlay').classList.add('open');
    syncBodyModalScrollLock();
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            renderIconPickerHints();
        });
    });
    setTimeout(function() { document.getElementById('sub-name').focus(); }, 100);
}

function closeModal() {
    setModalSavePending(false);
    document.getElementById('modal-overlay').classList.remove('open');
    syncBodyModalScrollLock();
    collapseIconPicker();
    collapseModalAdvanced();
}

function handleOverlayClick(e) {
    if (typeof subtrackHandleModalOverlayClick === 'function') {
        subtrackHandleModalOverlayClick(e, document.getElementById('modal-overlay'), closeModal, {
            isBusy: isModalSaveBusy,
        });
        return;
    }
    if (e.target !== document.getElementById('modal-overlay')) return;
    if (isModalSaveBusy()) return;
    closeModal();
}

function isModalSaveBusy() {
    var saveBtn = document.getElementById('modal-save-btn');
    return !!(saveBtn && saveBtn.getAttribute('aria-busy') === 'true');
}

/** Saglabāšanas laikā: spinneris, neļaut dubultklikšķi un aizvērt modāli no Atcelt. */
function setModalSavePending(pending) {
    var saveBtn = document.getElementById('modal-save-btn');
    var cancelBtn = document.getElementById('modal-cancel-btn');
    var closeBtn = document.getElementById('modal-close-btn');
    var dynamicSwitch = document.getElementById('sub-dynamic-amount-switch');
    if (saveBtn) {
        var spinner = saveBtn.querySelector('.dash-save-spinner');
        saveBtn.disabled = !!pending;
        saveBtn.setAttribute('aria-busy', pending ? 'true' : 'false');
        if (spinner) spinner.classList.toggle('hidden', !pending);
    }
    if (cancelBtn) {
        cancelBtn.disabled = !!pending;
    }
    if (closeBtn) {
        closeBtn.disabled = !!pending;
    }
    if (dynamicSwitch) {
        dynamicSwitch.disabled = !!pending;
    }
}

function modalSaveSetLabel(text) {
    var saveBtn = document.getElementById('modal-save-btn');
    if (!saveBtn) return;
    var label = saveBtn.querySelector('.dash-save-label');
    if (label) {
        label.textContent = text;
    } else {
        saveBtn.textContent = text;
    }
}

function saveSubscription() {
    var name = document.getElementById('sub-name').value.trim();
    var amountRaw = document.getElementById('sub-amount').value.trim();
    var amount =
        typeof parseDecimalAmountInput === 'function'
            ? parseDecimalAmountInput(amountRaw)
            : parseFloat(amountRaw);
    var period = document.getElementById('sub-period').value;
    var date = document.getElementById('sub-date').value;
    var note = document.getElementById('sub-note').value.trim();
    var category = normalizeCategoryKey(document.getElementById('sub-category').value);
    var termStart = document.getElementById('sub-term-start').value.trim();
    var termEnd = document.getElementById('sub-term-end').value.trim();

    if (!date) {
        shakeInput('sub-date');
        return;
    }

    if (termStart && termEnd) {
        var ts = new Date(termStart + 'T00:00:00');
        var te = new Date(termEnd + 'T00:00:00');
        if (te <= ts) {
            showToast(FsT('fs.dashboard.toast_term_end_after_start'), 'error');
            shakeInput('sub-term-end');
            return;
        }
    }

    var devices = collectDevicesFromForm();
    if (devices === null) return;

    if (devices.length > 0 && !name) {
        shakeInput('sub-name');
        showToast(FsT('fs.dashboard.toast_name_required_when_addons'), 'error');
        return;
    }

    if (amountRaw !== '' && (isNaN(amount) || amount < 0)) {
        shakeInput('sub-amount');
        return;
    }
    if (amountRaw === '' || isNaN(amount)) {
        amount = 0;
    }

    var payload = {
        name: name,
        category: category,
        amount: amount,
        dynamicAmount: subDynamicAmountSwitchOn(),
        period: period,
        date: date,
        icon: selectedIcon,
        color: selectedColor,
        note: note,
        termStart: termStart || '',
        termEnd: termEnd || '',
        devices: devices,
    };

    setModalSavePending(true);

    if (typeof window !== 'undefined' && window.__SUBTRACK_DEMO_DASHBOARD__) {
        var idStr = editingId !== null ? String(editingId) : 'demo-fs-' + Date.now();
        mergeSubscriptionFromApi(Object.assign({ id: idStr }, payload));
        setModalSavePending(false);
        closeModal();
        renderList();
        showToast(
            editingId !== null ? FsT('fs.dashboard.toast_saved') : FsT('fs.dashboard.toast_added'),
            'success',
        );
        showToast(FsT('fs.dashboard.toast_demo_only'), 'success');
        return;
    }

    function finishSave() {
        setModalSavePending(false);
    }

    function onFail(err) {
        finishSave();
        var raw = err && err.message ? String(err.message) : '';
        var msg = raw || FsT('fs.dashboard.toast_api_save_failed');
        showToast(msg, 'error');
    }

    if (editingId !== null) {
        fetch(apiSubscriptionUrl(editingId), {
            method: 'PATCH',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then(parseApiJson)
            .then(function (data) {
                if (data.subscription) mergeSubscriptionFromApi(data.subscription);
                finishSave();
                showToast(FsT('fs.dashboard.toast_saved'), 'success');
                closeModal();
                renderList();
            })
            .catch(function (err) {
                onFail(err);
            });
        return;
    }

    fetch('/api/subscriptions', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
        .then(parseApiJson)
        .then(function (data) {
            if (data.subscription) mergeSubscriptionFromApi(data.subscription);
            finishSave();
            showToast(FsT('fs.dashboard.toast_added'), 'success');
            closeModal();
            renderList();
        })
        .catch(function (err) {
            onFail(err);
        });
}

/* ---- Delete ---- */
function isDeleteModalBusy() {
    var confirmBtn = document.getElementById('delete-confirm-btn');
    return !!(confirmBtn && confirmBtn.getAttribute('aria-busy') === 'true');
}

function setDeleteModalPending(pending) {
    var confirmBtn = document.getElementById('delete-confirm-btn');
    var cancelBtn = document.getElementById('delete-cancel-btn');
    if (confirmBtn) {
        var spinner = confirmBtn.querySelector('.dash-delete-spinner');
        confirmBtn.disabled = !!pending;
        confirmBtn.setAttribute('aria-busy', pending ? 'true' : 'false');
        if (spinner) spinner.classList.toggle('hidden', !pending);
    }
    if (cancelBtn) {
        cancelBtn.disabled = !!pending;
    }
}

function openDeleteModal(id) {
    if (subtrackIsDeletePending(id)) return;
    setDeleteModalPending(false);
    deletingId = String(id);
    var s = subscriptions.find(function(x) { return x.id === id; });
    document.getElementById('delete-confirm-name').textContent = FsT(
        'fs.dashboard.delete_body',
    ).replace(/\{name\}/g, s ? s.name : '');
    document.getElementById('delete-overlay').classList.add('open');
    syncBodyModalScrollLock();
}

function closeDeleteModal() {
    if (isDeleteModalBusy()) return;
    document.getElementById('delete-overlay').classList.remove('open');
    syncBodyModalScrollLock();
    deletingId = null;
}

function handleDeleteOverlayClick(e) {
    if (typeof subtrackHandleModalOverlayClick === 'function') {
        subtrackHandleModalOverlayClick(e, document.getElementById('delete-overlay'), closeDeleteModal, {
            isBusy: isDeleteModalBusy,
        });
        return;
    }
    if (isDeleteModalBusy()) return;
    if (e.target === document.getElementById('delete-overlay')) closeDeleteModal();
}

function confirmDelete() {
    var id = deletingId;
    if (id == null || isDeleteModalBusy()) return;

    setDeleteModalPending(true);
    subtrackSetDeletePending(id, true);

    function finishDeletePending() {
        setDeleteModalPending(false);
        subtrackSetDeletePending(id, false);
    }

    if (typeof window !== 'undefined' && window.__SUBTRACK_DEMO_DASHBOARD__) {
        subscriptions = subscriptions.filter(function (x) {
            return String(x.id) !== String(id);
        });
        finishDeletePending();
        closeDeleteModal();
        renderList();
        showToast(FsT('fs.dashboard.toast_deleted'), 'success');
        showToast(FsT('fs.dashboard.toast_demo_only'), 'success');
        return;
    }

    fetch(apiSubscriptionUrl(id), {
        method: 'DELETE',
        credentials: 'same-origin',
    })
        .then(parseApiJson)
        .then(function () {
            subscriptions = subscriptions.filter(function (x) {
                return String(x.id) !== String(id);
            });
            finishDeletePending();
            closeDeleteModal();
            renderList();
            showToast(FsT('fs.dashboard.toast_deleted'), 'success');
        })
        .catch(function () {
            finishDeletePending();
            showToast(FsT('fs.dashboard.toast_api_delete_failed'), 'error');
        });
}

/* ---- Ikonas/krāsa: nejauši + nosaukums (zīmoli, meklēšana) ---- */
function loadVisualSuggestBootstrap() {
    if (visualSuggestBootstrap !== null) return;
    visualSuggestBootstrap = { icons: [], colors: [], brandRules: [] };
    var raw =
        typeof subtrackReadBootstrapJsonTextById === 'function'
            ? subtrackReadBootstrapJsonTextById('subtrack-visual-suggest-bootstrap')
            : '';
    if (!raw) return;
    try {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.icons)) visualSuggestBootstrap.icons = parsed.icons;
        if (parsed && Array.isArray(parsed.colors)) visualSuggestBootstrap.colors = parsed.colors;
        if (parsed && Array.isArray(parsed.brandRules)) {
            visualSuggestBootstrap.brandRules = parsed.brandRules;
        }
    } catch (e) {
        console.error(e);
    }
}

function matchBrandVisualFromName(rawName) {
    loadVisualSuggestBootstrap();
    var norm = normalizeForSearchIco(rawName);
    if (!norm || !visualSuggestBootstrap.brandRules.length) return null;
    var rules = visualSuggestBootstrap.brandRules;
    var ri;
    var pi;
    for (ri = 0; ri < rules.length; ri++) {
        var rule = rules[ri];
        if (!rule || !rule.patterns || !rule.icon) continue;
        for (pi = 0; pi < rule.patterns.length; pi++) {
            var p = normalizeForSearchIco(rule.patterns[pi]);
            if (p && norm.indexOf(p) !== -1) {
                return { icon: rule.icon, color: rule.color || null };
            }
        }
    }
    return null;
}

function fsIconHintSlotCount() {
    var maxN = fsIconMaxSlotsForShellWidth(fsIconHintsShellInnerWidthPx());
    return maxN <= 0 ? 1 : maxN;
}

/** Pirmā hintu rinda (pēc platuma) – no tās nejaušā izvēle pievienošanas modālī. */
function fsIconVisibleHintPool(nameQueryNorm) {
    loadFsIconSearchBootstrap();
    var candidates = fsIconCandidateClassesForHints(nameQueryNorm || '');
    var maxN = fsIconHintSlotCount();
    var pool = [];
    var cap = Math.min(candidates.length, maxN);
    for (var pi = 0; pi < cap; pi++) pool.push(candidates[pi]);
    return pool;
}

function fsIconBuildHintRowClasses(candidates, maxN, pinnedCls) {
    var out = [];
    var seen = Object.create(null);
    if (pinnedCls) {
        out.push(pinnedCls);
        seen[pinnedCls] = true;
    }
    for (var i = 0; i < candidates.length && out.length < maxN; i++) {
        var c = candidates[i];
        if (seen[c]) continue;
        out.push(c);
        seen[c] = true;
    }
    return out;
}

function syncIconPickerMoreToggle(totalCandidates, shownCount) {
    var btn = document.getElementById('icon-picker-toggle');
    var libHint = document.getElementById('icon-picker-library-hint');
    var hasMore = totalCandidates > shownCount;
    if (btn) btn.classList.toggle('hidden', !hasMore);
    if (libHint) libHint.classList.toggle('hidden', !hasMore);
}

function pickRandomSubscriptionIcon() {
    loadFsIconSearchBootstrap();
    var nameEl = document.getElementById('sub-name');
    var q = normalizeForSearchIco(nameEl ? nameEl.value : '');
    var pool = fsIconVisibleHintPool(q);
    if (!pool.length) {
        loadVisualSuggestBootstrap();
        var icons = visualSuggestBootstrap.icons;
        if (!icons || !icons.length) icons = fsIconFullOrderClsFromBootstrap();
        if (!icons || !icons.length) return 'fa-solid fa-film';
        var capFb = Math.min(icons.length, fsIconHintSlotCount());
        pool = icons.slice(0, capFb);
    }
    if (!pool.length) return 'fa-solid fa-film';
    return pool[Math.floor(Math.random() * pool.length)];
}

function pickRandomSubscriptionColor() {
    loadVisualSuggestBootstrap();
    var colors = visualSuggestBootstrap.colors;
    if (!colors || !colors.length) colors = ['#0d9488', '#e50914', '#1db954', '#3b82f6', '#f59e0b'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function resolveIconForAddName(rawName) {
    var brand = matchBrandVisualFromName(rawName);
    if (brand && brand.icon) return brand.icon;
    var norm = normalizeForSearchIco(rawName);
    if (norm) {
        var candidates = fsIconCandidateClassesForHints(norm);
        if (candidates.length) return candidates[0];
    }
    return pickRandomSubscriptionIcon();
}

function resolveColorForAddName(rawName, iconCls) {
    var brand = matchBrandVisualFromName(rawName);
    if (brand && brand.color) return brand.color;
    return pickRandomSubscriptionColor();
}

/** Tikai pievienošanas modālī; respektē userPickedIcon / userPickedColor. */
function applyAutoVisualForAdd(rawName) {
    if (editingId != null) return;
    var name = typeof rawName === 'string' ? rawName : '';
    if (!userPickedIcon) {
        selectIcon(resolveIconForAddName(name), true);
    }
    if (!userPickedColor) {
        selectColor(resolveColorForAddName(name, selectedIcon), true);
    }
}

/* ---- Icon picker (hintu rinda + „Parādīt visas“ ar meklēšanu) ---- */
var fsIconSearchRows = null;

function normalizeForSearchIco(str) {
    return String(str || '')
        .normalize('NFD')
        .replace(/\p{M}+/gu, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

function fsIconHaystackMatches(hayNorm, queryNorm) {
    if (!queryNorm || !queryNorm.length) return true;
    var parts = queryNorm.split(/\s+/).filter(Boolean);
    for (var pi = 0; pi < parts.length; pi++) {
        if (hayNorm.indexOf(parts[pi]) === -1) return false;
    }
    return true;
}

function fsIconHintSortKey(row, queryNorm) {
    if (!queryNorm) return 1e10;
    var parts = queryNorm.split(/\s+/).filter(Boolean);
    if (!parts.length) return 1e10;
    var ix = row.h.indexOf(parts[0]);
    return ix === -1 ? 1e10 + (row.h.charCodeAt(0) || 0) : ix;
}

function loadFsIconSearchBootstrap() {
    if (fsIconSearchRows !== null) return;
    fsIconSearchRows = [];
    var raw =
        typeof subtrackReadBootstrapJsonTextById === 'function'
            ? subtrackReadBootstrapJsonTextById('subtrack-icon-search-bootstrap')
            : '';
    if (!raw) return;
    try {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.icons)) {
            fsIconSearchRows = parsed.icons;
        }
    } catch (e) {
        console.error(e);
    }
}

/** Maksimālais ikonu skaits vienā hintu rindā pēc `#icon-picker-hints-shell` platuma (~36 px + gap 6). */
function fsIconMaxSlotsForShellWidth(px) {
    var w = Number(px);
    if (!isFinite(w) || w <= 0) return 14;
    var btn = 36;
    var gap = 6;
    var fudge = 6;
    var n = Math.floor((w - fudge + gap) / (btn + gap));
    if (n < 1) return 1;
    if (n > 240) return 240;
    return n;
}

function fsIconHintsShellInnerWidthPx() {
    var shell = document.getElementById('icon-picker-hints-shell');
    if (shell && shell.clientWidth > 0) return shell.clientWidth;
    var block = document.getElementById('icon-picker');
    if (block && block.clientWidth > 0) return block.clientWidth;
    var modalMain = document.getElementById('modal-main');
    if (modalMain && modalMain.clientWidth > 0) {
        var mw = modalMain.clientWidth;
        var bodyPadGuess = Math.min(mw - 44, mw * 0.92);
        if (bodyPadGuess > 80) return bodyPadGuess;
    }
    return 400;
}

function fsIconFullOrderClsFromBootstrap() {
    var out = [];
    if (!fsIconSearchRows || !fsIconSearchRows.length) return out;
    for (var i = 0; i < fsIconSearchRows.length; i++) {
        out.push(fsIconSearchRows[i].cls);
    }
    return out;
}

/** Pasūtījums kā paplašinātā režģī: vai nu pilnais katalogs, vai filtrs (arī tukšiem filtram – saknes secība). */
function fsIconCandidateClassesForHints(nameQueryNorm) {
    var fullOrder = fsIconFullOrderClsFromBootstrap();

    if (!nameQueryNorm) return fullOrder;

    var matched = [];
    for (var r = 0; r < fsIconSearchRows.length; r++) {
        var rw = fsIconSearchRows[r];
        if (fsIconHaystackMatches(rw.h, nameQueryNorm)) matched.push(rw);
    }
    if (!matched.length) return fullOrder;

    matched.sort(function (a, b) {
        var ka = fsIconHintSortKey(a, nameQueryNorm);
        var kb = fsIconHintSortKey(b, nameQueryNorm);
        if (ka !== kb) return ka - kb;
        return a.cls.localeCompare(b.cls);
    });

    var list = [];
    for (var mj = 0; mj < matched.length; mj++) list.push(matched[mj].cls);
    return list;
}

var fsIconHintsRoBound = false;
function initHintsShellResizeObserve() {
    if (fsIconHintsRoBound || typeof ResizeObserver === 'undefined') return;
    var shell = document.getElementById('icon-picker-hints-shell');
    if (!shell) return;
    fsIconHintsRoBound = true;
    var deb = false;
    var ro = new ResizeObserver(function () {
        if (deb) return;
        deb = true;
        requestAnimationFrame(function () {
            deb = false;
            renderIconPickerHints();
        });
    });
    ro.observe(shell);
}

function fsIconBtnsHtml(classesList) {
    var sb = '';
    for (var ii = 0; ii < classesList.length; ii++) {
        var ic = classesList[ii];
        sb += '<button type="button" class="icon-opt" data-icon="' + escAttr(ic) + '"><i class="' + escAttr(ic) + '" aria-hidden="true"></i></button>';
    }
    return sb;
}

function syncIconPickerHintMessage(showMsg, msgText) {
    var msgHint = document.getElementById('icon-picker-no-match-msg');
    if (!msgHint) return;
    if (!showMsg || !msgText) {
        msgHint.textContent = '';
        msgHint.classList.add('hidden');
        return;
    }
    msgHint.textContent = msgText;
    msgHint.classList.remove('hidden');
}

function renderIconPickerHints() {
    loadFsIconSearchBootstrap();
    var host = document.getElementById('icon-picker-hints');
    if (!host || fsIconSearchRows === null) return;

    var nameEl = document.getElementById('sub-name');
    var raw = nameEl ? nameEl.value : '';
    var q = normalizeForSearchIco(raw);

    var candidates = fsIconCandidateClassesForHints(q);
    var maxN = fsIconHintSlotCount();
    var trimmed = fsIconBuildHintRowClasses(candidates, maxN, selectedIcon || '');

    if (editingId == null && !userPickedIcon && selectedIcon) {
        var visiblePool = fsIconVisibleHintPool(q);
        if (visiblePool.length && visiblePool.indexOf(selectedIcon) === -1) {
            selectIcon(visiblePool[Math.floor(Math.random() * visiblePool.length)], true);
            trimmed = fsIconBuildHintRowClasses(candidates, maxN, selectedIcon);
        }
    }

    host.innerHTML = fsIconBtnsHtml(trimmed);
    syncIconPickerHintMessage(false);
    syncIconPickerMoreToggle(candidates.length, trimmed.length);
    selectIcon(selectedIcon, true);
}

function renderIconPickerExpanded() {
    loadFsIconSearchBootstrap();
    var more = document.getElementById('icon-picker-more');
    if (!more || fsIconSearchRows === null) return;

    var qInput = document.getElementById('icon-picker-q');
    var qs = normalizeForSearchIco(qInput ? qInput.value : '');
    var rowsCls = [];

    var ri;
    if (!qs) {
        for (ri = 0; ri < fsIconSearchRows.length; ri++) rowsCls.push(fsIconSearchRows[ri].cls);
    } else {
        for (ri = 0; ri < fsIconSearchRows.length; ri++) {
            var rr = fsIconSearchRows[ri];
            if (fsIconHaystackMatches(rr.h, qs)) rowsCls.push(rr.cls);
        }
        if (!rowsCls.length) {
            for (ri = 0; ri < fsIconSearchRows.length; ri++) rowsCls.push(fsIconSearchRows[ri].cls);
        }
    }

    more.innerHTML = fsIconBtnsHtml(rowsCls);

    var expandedEmpty = document.getElementById('icon-picker-expanded-empty');
    if (expandedEmpty) {
        expandedEmpty.textContent = '';
        expandedEmpty.classList.add('hidden');
    }
    selectIcon(selectedIcon, true);
}

function bindIconPickerNameInputOnce() {
    var nameEl = document.getElementById('sub-name');
    if (!nameEl || nameEl.dataset.subtrackIconHint === '1') return;
    nameEl.dataset.subtrackIconHint = '1';
    nameEl.addEventListener('input', function () {
        applyAutoVisualForAdd(nameEl.value.trim());
        renderIconPickerHints();
    });
}

function bindIconPickerSearchInputOnce() {
    var iq = document.getElementById('icon-picker-q');
    if (!iq || iq.dataset.subtrackIconSearch === '1') return;
    iq.dataset.subtrackIconSearch = '1';
    iq.addEventListener('input', function () {
        if (isIconPickerExpanded()) renderIconPickerExpanded();
    });
}

function isIconPickerExpanded() {
    var ex = document.getElementById('icon-picker-expanded');
    return !!(ex && !ex.classList.contains('hidden'));
}

function initIconPickerSearchDelegate() {
    var host = document.getElementById('icon-picker');
    if (!host || host.dataset.subtrackIcoDl === '1') return;
    host.dataset.subtrackIcoDl = '1';
    host.addEventListener('click', function (ev) {
        var btn = ev.target.closest('.icon-opt');
        if (!btn || !host.contains(btn)) return;
        var ic = btn.getAttribute('data-icon');
        if (ic) selectIcon(ic);
    });
}

function initIconPicker() {
    loadFsIconSearchBootstrap();
    initIconPickerSearchDelegate();
    bindIconPickerNameInputOnce();
    bindIconPickerSearchInputOnce();
    initHintsShellResizeObserve();
    renderIconPickerHints();
}

function selectIcon(iconClass, programmatic) {
    selectedIcon = iconClass;
    if (programmatic !== true && editingId == null) userPickedIcon = true;
    document.querySelectorAll('#icon-picker .icon-opt').forEach(function (btn) {
        btn.classList.toggle('selected', btn.getAttribute('data-icon') === iconClass);
    });
}

function collapseIconPicker() {
    var expandWrap = document.getElementById('icon-picker-expanded');
    var iq = document.getElementById('icon-picker-q');
    var btn = document.getElementById('icon-picker-toggle');
    if (expandWrap) expandWrap.classList.add('hidden');
    if (iq) iq.value = '';
    var more = document.getElementById('icon-picker-more');
    if (more) more.innerHTML = '';
    if (btn) {
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = FsT('fs.dashboard.icon_show_all');
    }
    var emptyEx = document.getElementById('icon-picker-expanded-empty');
    if (emptyEx) emptyEx.classList.add('hidden');
    renderIconPickerHints();
}

function toggleIconPickerExpand() {
    var expandWrap = document.getElementById('icon-picker-expanded');
    var btn = document.getElementById('icon-picker-toggle');
    if (!expandWrap || !btn) return;

    var willExpand = expandWrap.classList.contains('hidden');

    if (willExpand) {
        expandWrap.classList.remove('hidden');
        btn.setAttribute('aria-expanded', 'true');
        btn.textContent = FsT('fs.dashboard.icon_show_less');
        renderIconPickerExpanded();
        var iq = document.getElementById('icon-picker-q');
        if (iq) {
            setTimeout(function () {
                iq.focus();
            }, 80);
        }
    } else {
        collapseIconPicker();
    }
}

/* ---- Papildu opcijas (kredīta termiņš, papildu pozīcijas) modālī ---- */
function prefersReducedMotionModal() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function scrollModalAfterAdvancedExpand() {
    var panel = document.getElementById('modal-advanced-panel');
    var body = document.querySelector('#modal-main .modal-body');
    if (!panel || !body || panel.classList.contains('hidden')) return;
    var reduced = prefersReducedMotionModal();
    var behaviour = reduced ? 'auto' : 'smooth';
    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            var rect = panel.getBoundingClientRect();
            var b = body.getBoundingClientRect();
            var pad = 12;
            if (rect.bottom > b.bottom - pad) {
                var delta = rect.bottom - (b.bottom - pad);
                body.scrollBy({ top: delta, left: 0, behavior: behaviour });
            }
        });
    });
}

function toggleModalAdvanced() {
    var wrap = document.getElementById('modal-advanced');
    var panel = document.getElementById('modal-advanced-panel');
    var btn = document.getElementById('modal-advanced-toggle');
    if (!panel || !btn) return;
    panel.classList.toggle('hidden');
    var expanded = !panel.classList.contains('hidden');
    if (wrap) wrap.classList.toggle('is-open', expanded);
    btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    if (expanded) scrollModalAfterAdvancedExpand();
}

function collapseModalAdvanced() {
    var wrap = document.getElementById('modal-advanced');
    var panel = document.getElementById('modal-advanced-panel');
    var btn = document.getElementById('modal-advanced-toggle');
    if (panel) panel.classList.add('hidden');
    if (wrap) wrap.classList.remove('is-open');
    if (btn) btn.setAttribute('aria-expanded', 'false');
}

function expandModalAdvanced() {
    var wrap = document.getElementById('modal-advanced');
    var panel = document.getElementById('modal-advanced-panel');
    var btn = document.getElementById('modal-advanced-toggle');
    if (panel) panel.classList.remove('hidden');
    if (wrap) wrap.classList.add('is-open');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    scrollModalAfterAdvancedExpand();
}

function clearDeviceEditor() {
    var c = document.getElementById('sub-devices-container');
    if (c) c.innerHTML = '';
}

function removeDeviceRow(btn) {
    var row = btn && btn.closest ? btn.closest('.sub-device-editor') : null;
    if (row) row.remove();
}

function addDeviceRow(data) {
    var c = document.getElementById('sub-devices-container');
    if (!c) return;
    var nameV = '';
    var noteV = '';
    var amountV = '';
    var tsV = '';
    var teV = '';
    if (data) {
        nameV = data.name != null ? String(data.name) : '';
        noteV = data.note != null ? String(data.note) : '';
        if (data.amount != null && !isNaN(data.amount)) amountV = String(data.amount);
        tsV = data.termStart != null ? String(data.termStart) : '';
        teV = data.termEnd != null ? String(data.termEnd) : '';
    }
    var div = document.createElement('div');
    div.className = 'sub-device-editor';
    div.innerHTML =
        '<div class="sub-device-editor-top">' +
            '<span class="sub-device-editor-title">' +
            escHtml(FsT('fs.dashboard.device_row_title')) +
            '</span>' +
            '<button type="button" class="sub-device-remove" aria-label="' +
            escAttr(FsT('fs.dashboard.aria_remove_device_row')) +
            '" onclick="removeDeviceRow(this)"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
        '</div>' +
        '<div class="form-group"><label>' +
        escHtml(FsT('fs.dashboard.device_label_name')) +
        '</label><input type="text" class="sub-device-name" placeholder="' +
        escAttr(FsT('fs.dashboard.device_placeholder_name')) +
        '" value="' +
        escAttr(nameV) +
        '"></div>' +
        '<div class="form-group"><label>' +
        escHtml(FsT('fs.dashboard.device_label_note_optional')) +
        '</label><input type="text" class="sub-device-note" placeholder="' +
        escAttr(FsT('fs.dashboard.device_placeholder_note')) +
        '" value="' +
        escAttr(noteV) +
        '"></div>' +
        '<div class="form-group"><label>' +
        escHtml(FsT('fs.dashboard.device_label_extra_amount')) +
        '</label><input type="text" class="sub-device-amount" inputmode="decimal" autocomplete="off" placeholder="0" value="' +
        escAttr(amountV) +
        '"></div>' +
            '<div class="form-row">' +
            '<div class="form-group"><label>' +
            escHtml(FsT('fs.dashboard.term_start')) +
            ' <span class="form-optional">' +
            escHtml(FsT('fs.dashboard.optional_paren')) +
            '</span></label><input type="date" class="sub-device-ts" value="' +
            escAttr(tsV) +
            '"></div>' +
            '<div class="form-group"><label>' +
            escHtml(FsT('fs.dashboard.term_end')) +
            ' <span class="form-optional">' +
            escHtml(FsT('fs.dashboard.optional_paren')) +
            '</span></label><input type="date" class="sub-device-te" value="' +
            escAttr(teV) +
            '"></div>' +
        '</div>';
    c.appendChild(div);
}

function collectDevicesFromForm() {
    var rows = document.querySelectorAll('#sub-devices-container .sub-device-editor');
    var out = [];
    var nid = 1;
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var name = row.querySelector('.sub-device-name').value.trim();
        var noteEl = row.querySelector('.sub-device-note');
        var note = noteEl ? noteEl.value.trim() : '';
        var amountRaw = row.querySelector('.sub-device-amount').value;
        var amount =
            typeof parseDecimalAmountInput === 'function'
                ? parseDecimalAmountInput(amountRaw)
                : parseFloat(amountRaw);
        var ts = row.querySelector('.sub-device-ts').value.trim();
        var te = row.querySelector('.sub-device-te').value.trim();
        var hasAny =
            name ||
            ts ||
            te ||
            (amountRaw !== '' && !isNaN(amount) && amount !== 0) ||
            note;
        if (!hasAny) continue;
        if (!name) {
            showToast(FsT('fs.dashboard.toast_device_name_when_term'), 'error');
            return null;
        }
        if (ts && te) {
            var dts = new Date(ts + 'T00:00:00');
            var dte = new Date(te + 'T00:00:00');
            if (dte <= dts) {
                showToast(FsT('fs.dashboard.toast_device_term_order'), 'error');
                return null;
            }
        }
        out.push({
            id: nid++,
            name: name,
            note: note,
            amount: (amountRaw === '' || isNaN(amount)) ? 0 : amount,
            termStart: ts,
            termEnd: te,
        });
    }
    return out;
}

/* ---- Color picker ---- */
function initColorPicker() {
    document.querySelectorAll('.color-dot').forEach(function(dot) {
        if (dot.dataset.subtrackBound === '1') return;
        dot.dataset.subtrackBound = '1';
        dot.addEventListener('click', function() {
            selectColor(dot.dataset.color);
        });
    });
}

function selectColor(color, programmatic) {
    selectedColor = color;
    if (programmatic !== true && editingId == null) userPickedColor = true;
    document.querySelectorAll('.color-dot').forEach(function(dot) {
        dot.classList.toggle('selected', dot.dataset.color === color);
    });
}

/* ---- Keyboard close ---- */
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (amountEditId != null) {
            cancelSubAmountInline();
            return;
        }
        if (!isModalSaveBusy()) closeModal();
        closeDeleteModal();
    }
});

/* ---- Helpers ---- */
function setDefaultDate() {
    var d = new Date();
    d.setMonth(d.getMonth() + 1);
    document.getElementById('sub-date').value = d.toISOString().split('T')[0];
}

function getUrgencyClass(dateStr) {
    if (!dateStr) return '';
    var today = new Date();
    today.setHours(0,0,0,0);
    var d = new Date(dateStr + 'T00:00:00');
    var diff = Math.round((d - today) / 86400000);
    if (diff < 0) return 'overdue';
    if (diff <= 5) return 'soon';
    return '';
}

function getOverdueDays(dateStr) {
    if (!dateStr) return 0;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var d = new Date(dateStr + 'T00:00:00');
    return Math.max(0, Math.round((today - d) / 86400000));
}

function escAttr(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/'/g, '&#39;');
}

function shakeInput(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.style.borderColor = 'var(--danger)';
    el.focus();
    setTimeout(function() { el.style.borderColor = ''; }, 1500);
}

