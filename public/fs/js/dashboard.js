/* =============================================
   SubTrack - Dashboard JS
   ============================================= */

var selectedIcon = 'fa-solid fa-film';
var selectedColor = '#0d9488';
var editingId = null;
var deletingId = null;
var calendarView = null;

/* ---- Init ---- */
document.addEventListener('DOMContentLoaded', function () {
    setDefaultDate();
    renderList();
    initCalendarNav();
    initIconPicker();
    initColorPicker();
});

/* ---- Render ---- */
function renderList(scrollToItemId) {
    var list = document.getElementById('sub-list');
    var empty = document.getElementById('empty-state');

    updateStats();
    renderPaymentCalendar();

    if (subscriptions.length === 0) {
        list.innerHTML = '';
        empty.classList.remove('hidden');
        if (typeof refreshDashNotifications === 'function') {
            refreshDashNotifications();
        }
        return;
    }

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
}

function pad2Cal(n) {
    return n < 10 ? '0' + n : String(n);
}

function getPaymentsByDateInMonth(y, m) {
    var map = {};
    subscriptions.forEach(function (s) {
        if (!s.date) return;
        var d = new Date(s.date + 'T00:00:00');
        if (isNaN(d.getTime())) return;
        if (d.getFullYear() !== y || d.getMonth() !== m) return;
        var key = s.date;
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
    if (prev) {
        prev.addEventListener('click', function () { shiftCalendarMonth(-1); });
    }
    if (next) {
        next.addEventListener('click', function () { shiftCalendarMonth(1); });
    }
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

    var monthNames = ['janvāris', 'februāris', 'marts', 'aprīlis', 'maijs', 'jūnijs', 'jūlijs', 'augusts', 'septembris', 'oktobris', 'novembris', 'decembris'];
    var titleEl = document.getElementById('pay-calendar-title');
    if (titleEl) {
        var mn = monthNames[m];
        titleEl.textContent = mn.charAt(0).toUpperCase() + mn.slice(1) + ' ' + y;
    }

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var first = new Date(y, m, 1);
    var startPad = (first.getDay() + 6) % 7;
    var daysInMonth = new Date(y, m + 1, 0).getDate();

    var wdays = ['Pr', 'Ot', 'Tr', 'Ce', 'Pk', 'Se', 'Sv'];
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
        var attrs = '';
        if (list && list.length) {
            classes.push('pay-cal-cell--due');
            var anyOverdue = false;
            for (var li = 0; li < list.length; li++) {
                var ds = new Date(list[li].date + 'T00:00:00');
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
            attrs = ' data-tooltip="' + escAttr(tipParts.join('; ')) + '" tabindex="0"';
        }

        html += '<div class="' + classes.join(' ') + '"' + attrs + '>' + day + '</div>';
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
    var day = d.getDate();
    var month = d.getMonth() + 1;
    var pad = function (n) { return n < 10 ? '0' + n : String(n); };
    return pad(day) + '.' + pad(month) + '.' + d.getFullYear();
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

function formatAtlikusiMenesi(n) {
    if (n <= 0) return '';
    if (n === 1) return 'atlikuši 1 mēnesis';
    return 'atlikuši ' + n + ' mēneši';
}

function buildTermHtml(s) {
    if (!s.termStart || !s.termEnd) return '';
    var pct = computeTermProgressPct(s.termStart, s.termEnd);
    if (pct === null) return '';
    var c = s.color || '#0d9488';
    var rightCol;
    var dateLine = escHtml(formatDateWithYear(s.termStart)) + ' - ' + escHtml(formatDateWithYear(s.termEnd));
    if (pct >= 100) {
        rightCol = '<span class="sub-term-pct sub-term-pct-done">Termiņš ir noslēgts</span>';
    } else {
        var mo = wholeMonthsFromEndRemaining(s.termEnd);
        var remParen = mo > 0
            ? ' <span class="sub-term-atlikums">(' + escHtml(formatAtlikusiMenesi(mo)) + ')</span>'
            : '';
        dateLine = dateLine + remParen;
        rightCol = '<span class="sub-term-pct"><strong>' + pct + '%</strong> no termiņa</span>';
    }
    return '<div class="sub-term-block">' +
        '<div class="sub-term-header">' +
        '<div class="sub-term-label"><i class="fa-solid fa-hourglass-half"></i> Atmaksas termiņš: ' +
        dateLine + '</div>' +
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
        rightCol = '<span class="sub-term-pct sub-term-pct-done">Termiņš ir noslēgts</span>';
    } else {
        var mo = wholeMonthsFromEndRemaining(dev.termEnd);
        var remParen = mo > 0
            ? ' <span class="sub-term-atlikums">(' + escHtml(formatAtlikusiMenesi(mo)) + ')</span>'
            : '';
        dateLine = dateLine + remParen;
        rightCol = '<span class="sub-term-pct"><strong>' + pct + '%</strong> no termiņa</span>';
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
    var periodLabel = periodText(s.period);
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
    var amountNote = devExtra > 0
        ? '<div class="sub-amount-note">+' + devExtra.toFixed(2) + ' € papildu</div>'
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
                    '<span class="sub-name">' + escHtml(s.name) + '</span>' +
                    (s.note ? '<span class="sub-note-inline">' + escHtml(s.note) + '</span>' : '') +
                    '<span class="sub-category-pill">' + escHtml(categoryLabel(s.category)) + '</span>' +
                    '</div>' +
                    '<div class="' + dateLineClass + '">' + dateIcon + '<span>Nākamais maksājums: ' + escHtml(dateLabel) + '</span>' + overdueMeta + '</div>' +
                '</div>' +
                '<div class="sub-right">' +
                    '<div class="sub-actions">' +
                        '<button type="button" class="icon-btn mark-paid" data-tooltip="Atzīmēt kā samaksātu" aria-label="Atzīmēt kā samaksātu" onclick="markPaid(' + s.id + ')"><i class="fa-solid fa-check"></i></button>' +
                        '<button type="button" class="icon-btn" data-tooltip="Labot" aria-label="Labot" onclick="openEditModal(' + s.id + ')"><i class="fa-solid fa-pen"></i></button>' +
                        '<button type="button" class="icon-btn delete" data-tooltip="Dzēst" aria-label="Dzēst" onclick="openDeleteModal(' + s.id + ')"><i class="fa-solid fa-trash"></i></button>' +
                    '</div>' +
                    '<div class="sub-amount-wrap">' +
                        '<div class="sub-amount">€' + displayTotal.toFixed(2) + '</div>' +
                        amountNote +
                        '<div class="sub-period">' + escHtml(periodLabel) + '</div>' +
                        (s.period !== 'monthly' ? '<div class="sub-period">≈ €' + amountMonth.toFixed(2) + '/mēn.</div>' : '') +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>' +
        termHtml +
        deviceBlocks +
    '</div>';
}

/* ---- Mark paid (frontend demo: nākamais datums pēc perioda, saraksts sakārtots pēc termiņa) ---- */
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

function advanceNextDueAfterPayment(dateStr, period) {
    var next = addOneBillingPeriod(new Date(dateStr + 'T00:00:00'), period);
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var guard = 0;
    while (next < today && guard < 240) {
        next = addOneBillingPeriod(next, period);
        guard++;
    }
    return toISODateLocal(next);
}

function markPaid(id) {
    var idx = subscriptions.findIndex(function (x) { return x.id === id; });
    if (idx === -1) return;
    var s = subscriptions[idx];
    var period = s.period || 'monthly';
    s.date = advanceNextDueAfterPayment(s.date, period);
    showToast('Maksājums atzīmēts. Nākamais termiņš: ' + formatDate(s.date) + '.', 'success');
    renderList(id);
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
        document.getElementById('stat-next-name').textContent = 'nav abonementa';
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
        document.getElementById('stat-next-name').textContent = 'nav gaidāmo';
    }
}

/* ---- Add Modal ---- */
function openAddModal() {
    collapseIconPicker();
    collapseModalAdvanced();
    clearDeviceEditor();
    editingId = null;
    document.getElementById('modal-title').textContent = 'Pievienot abonementu';
    document.getElementById('modal-save-btn').textContent = 'Pievienot';
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
    setTimeout(function() { document.getElementById('sub-name').focus(); }, 100);
}

function openEditModal(id) {
    var s = subscriptions.find(function(x) { return x.id === id; });
    if (!s) return;
    editingId = id;
    collapseIconPicker();
    clearDeviceEditor();

    document.getElementById('modal-title').textContent = 'Labot abonementu';
    document.getElementById('modal-save-btn').textContent = 'Saglabāt';
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
    setTimeout(function() { document.getElementById('sub-name').focus(); }, 100);
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
    collapseIconPicker();
    collapseModalAdvanced();
}

function handleOverlayClick(e) {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
}

function saveSubscription() {
    var name = document.getElementById('sub-name').value.trim();
    var amount = parseFloat(document.getElementById('sub-amount').value);
    var period = document.getElementById('sub-period').value;
    var date = document.getElementById('sub-date').value;
    var note = document.getElementById('sub-note').value.trim();
    var category = normalizeCategoryKey(document.getElementById('sub-category').value);
    var termStart = document.getElementById('sub-term-start').value.trim();
    var termEnd = document.getElementById('sub-term-end').value.trim();

    if (!name) { shakeInput('sub-name'); return; }
    if (isNaN(amount) || amount <= 0) { shakeInput('sub-amount'); return; }
    if (!date) { shakeInput('sub-date'); return; }

    if ((termStart && !termEnd) || (!termStart && termEnd)) {
        showToast('Lai rādītu progress joslu, aizpildiet abus datumus vai atstatiet tukšus.', 'error');
        if (!termStart) shakeInput('sub-term-start');
        else shakeInput('sub-term-end');
        return;
    }
    if (termStart && termEnd) {
        var ts = new Date(termStart + 'T00:00:00');
        var te = new Date(termEnd + 'T00:00:00');
        if (te <= ts) {
            showToast('„Termiņš līdz” ir jābūt pēc „termiņš no”.', 'error');
            shakeInput('sub-term-end');
            return;
        }
    }

    var devices = collectDevicesFromForm();
    if (devices === null) return;

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

    if (editingId !== null) {
        var idx = subscriptions.findIndex(function(x) { return x.id === editingId; });
        if (idx !== -1) {
            subscriptions[idx] = Object.assign({ id: editingId }, payload);
        }
        showToast('Abonements saglabāts!', 'success');
    } else {
        subscriptions.push(Object.assign({ id: nextId++ }, payload));
        showToast('Abonements pievienots!', 'success');
    }

    closeModal();
    renderList();
}

/* ---- Delete ---- */
function openDeleteModal(id) {
    deletingId = id;
    var s = subscriptions.find(function(x) { return x.id === id; });
    document.getElementById('delete-confirm-name').textContent = 'Vai tiešām vēlaties dzēst "' + (s ? s.name : '') + '"? Šo darbību nevar atcelt.';
    document.getElementById('delete-overlay').classList.add('open');
}

function closeDeleteModal() {
    document.getElementById('delete-overlay').classList.remove('open');
    deletingId = null;
}

function handleDeleteOverlayClick(e) {
    if (e.target === document.getElementById('delete-overlay')) closeDeleteModal();
}

function confirmDelete() {
    subscriptions = subscriptions.filter(function(x) { return x.id !== deletingId; });
    closeDeleteModal();
    renderList();
    showToast('Abonements dzēsts.', 'success');
}

/* ---- Icon picker ---- */
function initIconPicker() {
    document.querySelectorAll('.icon-opt').forEach(function(btn) {
        btn.addEventListener('click', function() {
            selectIcon(btn.dataset.icon);
        });
    });
}

function selectIcon(iconClass) {
    selectedIcon = iconClass;
    document.querySelectorAll('.icon-opt').forEach(function(btn) {
        btn.classList.toggle('selected', btn.dataset.icon === iconClass);
    });
}

function collapseIconPicker() {
    var more = document.getElementById('icon-picker-more');
    var btn = document.getElementById('icon-picker-toggle');
    if (more) {
        more.classList.add('hidden');
    }
    if (btn) {
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = 'Parādīt visas';
    }
}

function toggleIconPickerExpand() {
    var more = document.getElementById('icon-picker-more');
    var btn = document.getElementById('icon-picker-toggle');
    if (!more || !btn) return;
    more.classList.toggle('hidden');
    var expanded = !more.classList.contains('hidden');
    btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    btn.textContent = expanded ? 'Rādīt mazāk' : 'Parādīt visas';
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
            '<span class="sub-device-editor-title">Papildu pozīcija</span>' +
            '<button type="button" class="sub-device-remove" aria-label="Noņemt" onclick="removeDeviceRow(this)"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
        '</div>' +
        '<div class="form-group"><label>Nosaukums</label><input type="text" class="sub-device-name" placeholder="piem. Apdrošināšana, modēms" value="' + escAttr(nameV) + '"></div>' +
        '<div class="form-group"><label>Piezīme (neobligāti)</label><input type="text" class="sub-device-note" placeholder="piem. Mans, Sievas" value="' + escAttr(noteV) + '"></div>' +
        '<div class="form-group"><label>Papildu summa (€ / mēn.)</label><input type="number" class="sub-device-amount" placeholder="0" step="0.01" min="0" value="' + escAttr(amountV) + '"></div>' +
        '<div class="form-row">' +
            '<div class="form-group"><label>Termiņš no</label><input type="date" class="sub-device-ts" value="' + escAttr(tsV) + '"></div>' +
            '<div class="form-group"><label>Termiņš līdz</label><input type="date" class="sub-device-te" value="' + escAttr(teV) + '"></div>' +
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
        var hasAny = name || ts || te || (amountRaw !== '' && !isNaN(amount) && amount !== 0);
        if (!hasAny) continue;
        if ((ts && !te) || (!ts && te)) {
            showToast('Katras papildu pozīcijas termiņam aizpildiet abus datumus vai atstatiet tukšus.', 'error');
            return null;
        }
        if (ts && te && !name) {
            showToast('Norādiet pozīcijas nosaukumu, ja norādīts termiņš.', 'error');
            return null;
        }
        if (ts && te) {
            var dts = new Date(ts + 'T00:00:00');
            var dte = new Date(te + 'T00:00:00');
            if (dte <= dts) {
                showToast('„Termiņš līdz” pozīcijai ir jābūt pēc „no”.', 'error');
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
        closeModal();
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

function formatOverdueLabel(days) {
    if (days === 1) return '1 diena kavējumā';
    var mod10 = days % 10;
    var mod100 = days % 100;
    if (mod10 === 1 && mod100 !== 11) return days + ' diena kavējumā';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 > 20)) return days + ' dienas kavējumā';
    return days + ' dienu kavējumā';
}

function periodText(period) {
    if (period === 'monthly') return 'mēnesī';
    if (period === 'yearly') return 'gadā';
    if (period === 'weekly') return 'nedēļā';
    return period;
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
    el.style.borderColor = 'var(--danger)';
    el.focus();
    setTimeout(function() { el.style.borderColor = ''; }, 1500);
}

