/* =============================================
   SubTrack - Dashboard JS
   ============================================= */

var selectedIcon = 'fa-solid fa-film';
var selectedColor = '#0d9488';
var editingId = null;
var deletingId = null;
var calendarView = null;

/* ---- Init ----
 * Paneļa skripti tiek ielādēti pēc React mount (FsScripts); DOMContentLoaded
 * šajā brīdī jau ir noticis – inicializāciju jāpalaiž arī tad.
 */
function continueDashboardBoot() {
    setDefaultDate();
    renderList();
    initCalendarNav();
    initPayCalIncludePaidToggle();
    initIconPicker();
    initColorPicker();
}

function fsBootDashboard() {
    var skip =
        typeof window !== 'undefined' &&
        window.__subtrackSubsApiSyncedOnce;
    if (!skip && typeof subtrackReloadSubscriptionsFromBootstrap === 'function') {
        subtrackReloadSubscriptionsFromBootstrap();
    }
    subtrackSyncSubscriptionsFromApi().then(function () {
        continueDashboardBoot();
    });
}

window.fsBootDashboard = fsBootDashboard;

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
}

function pad2Cal(n) {
    return n < 10 ? '0' + n : String(n);
}

function getPaymentsByDateInMonth(y, m) {
    var map = {};
    subscriptions.forEach(function (s) {
        var dayIso = normalizeSubscriptionDateIso(s.date);
        if (!dayIso) return;
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
        var paidMarkCount = paidPastMap[iso] ? paidPastMap[iso] : 0;
        var showPaidOnDue =
            includePaidMarks && paidMarkCount > 0 && list && list.length > 0;
        var showPaidPastOnly =
            includePaidMarks && paidMarkCount > 0 && (!list || !list.length);

        var attrs = '';
        if (list && list.length) {
            classes.push('pay-cal-cell--due');
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
    var amountMonth = monthlyAmount(s.amount, s.period);
    var devExtra = sumDeviceAmounts(s);
    var displayTotal = amountMonth + devExtra;
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

    return '<div class="sub-item" id="item-' + s.id + '">' +
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
                        '<button type="button" class="icon-btn mark-paid" data-subscription-id="' +
                        escAttr(String(s.id)) +
                        '" data-tooltip="' +
                        escAttr(FsT('fs.dashboard.tooltip_mark_paid')) +
                        '" aria-label="' +
                        escAttr(FsT('fs.dashboard.aria_mark_paid')) +
                        '" onclick=\'markPaid(' +
                        JSON.stringify(String(s.id)) +
                        ')\'>' +
                        subtrackMarkPaidButtonInnerHtml() +
                        '</button>' +
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
                        '</button>' +
                    '</div>' +
                    '<div class="sub-amount-wrap">' +
                        '<div class="sub-amount">€' + displayTotal.toFixed(2) + '</div>' +
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
    var paidOnIso = normalizeSubscriptionDateIso(s.date);
    var period = s.period || 'monthly';
    var newDate = advanceNextDueAfterPayment(s.date, period);

    subtrackSetMarkPaidPending(id, true);

    if (typeof window !== 'undefined' && window.__SUBTRACK_DEMO_DASHBOARD__) {
        s.date = normalizeSubscriptionDateIso(newDate) || newDate;
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

    fetch(apiSubscriptionUrl(s.id), {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate }),
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
            if (paidOnIso && typeof subtrackAddPaidCalendarDay === 'function') {
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
function updateStats() {
    var total = subscriptions.reduce(function(sum, s) {
        return sum + subscriptionMonthlyTotal(s);
    }, 0);

    document.getElementById('stat-total').textContent = '€' + total.toFixed(2);
    document.getElementById('stat-count').textContent = subscriptions.length;

    if (subscriptions.length === 0) {
        document.getElementById('stat-next').textContent = '-';
        document.getElementById('stat-next-amount').textContent = '';
        document.getElementById('stat-next-name').textContent = FsT('fs.dashboard.empty_no_subscriptions') || '';
        return;
    }

    var today = new Date();
    today.setHours(0,0,0,0);

    var upcoming = subscriptions
        .map(function(s) { return { s: s, d: new Date(s.date) }; })
        .filter(function(x) { return x.d >= today; })
        .sort(function(a, b) { return a.d - b.d; });

    if (upcoming.length > 0) {
        var next = upcoming[0];
        var pay = subscriptionMonthlyTotal(next.s);
        document.getElementById('stat-next').textContent = formatDate(next.s.date);
        document.getElementById('stat-next-amount').textContent = '€' + pay.toFixed(2);
        document.getElementById('stat-next-name').textContent = next.s.name;
    } else {
        document.getElementById('stat-next').textContent = '-';
        document.getElementById('stat-next-amount').textContent = '';
        document.getElementById('stat-next-name').textContent =
            FsT('fs.dashboard.empty_nothing_upcoming') || '';
    }
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
    selectIcon('fa-solid fa-film');
    selectColor('#0d9488');
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
    var amount = parseFloat(amountRaw);
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
    var wPx = fsIconHintsShellInnerWidthPx();
    var maxN = fsIconMaxSlotsForShellWidth(wPx);
    if (maxN <= 0) maxN = 1;
    var trimmed = [];
    var hi;
    var cap = Math.min(candidates.length, maxN);
    for (hi = 0; hi < cap; hi++) trimmed.push(candidates[hi]);

    host.innerHTML = fsIconBtnsHtml(trimmed);
    syncIconPickerHintMessage(false);
    selectIcon(selectedIcon);
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
    selectIcon(selectedIcon);
}

function bindIconPickerNameInputOnce() {
    var nameEl = document.getElementById('sub-name');
    if (!nameEl || nameEl.dataset.subtrackIconHint === '1') return;
    nameEl.dataset.subtrackIconHint = '1';
    nameEl.addEventListener('input', function () {
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

function selectIcon(iconClass) {
    selectedIcon = iconClass;
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
        '</label><input type="number" class="sub-device-amount" placeholder="0" step="0.01" min="0" value="' +
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
        var amount = parseFloat(amountRaw);
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

function selectColor(color) {
    selectedColor = color;
    document.querySelectorAll('.color-dot').forEach(function(dot) {
        dot.classList.toggle('selected', dot.dataset.color === color);
    });
}

/* ---- Keyboard close ---- */
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
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

