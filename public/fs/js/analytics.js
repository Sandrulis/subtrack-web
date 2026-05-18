/* =============================================
   SubTrack - Analītikas lapa (abonementi no API / bootstrap)
   ============================================= */

/** Krāsas „slices” - saskaņotas ar SubTrack, pietiekami atšķirīgas (tā pat kā demo donut). */
var ANALYTICS_PIE_COLORS = [
    '#0d9488', '#f59e0b', '#3b82f6', '#64748b', '#e11d48', '#8b5cf6', '#059669', '#d97706'
];

/**
 * Kategoriju sadalījums: CSS conic-gradient donut + leģenda (`demo-analytics-*`, kā `/demo/analytics`).
 */
function renderCategoryDonut(catKeys, byCat) {
    var wrap = document.getElementById('analytics-pie-wrap');
    var root = document.getElementById('analytics-category-donut-root');
    var emptyEl = document.getElementById('analytics-pie-empty');
    if (!root || !wrap) {
        return;
    }

    var total = catKeys.reduce(function (s, k) {
        return s + byCat[k];
    }, 0);

    if (!catKeys.length || total <= 0) {
        wrap.classList.add('hidden');
        root.innerHTML = '';
        if (emptyEl) {
            emptyEl.classList.remove('hidden');
            emptyEl.textContent = FsT('fs.analytics.pie_empty');
        }
        return;
    }

    wrap.classList.remove('hidden');
    if (emptyEl) {
        emptyEl.classList.add('hidden');
    }

    var colors = catKeys.map(function (k, i) {
        return ANALYTICS_PIE_COLORS[i % ANALYTICS_PIE_COLORS.length];
    });

    var angle = 0;
    var conicParts = catKeys.map(function (k, i) {
        var frac = byCat[k] / total;
        var deg = frac * 360;
        var from = angle;
        angle += deg;
        return colors[i] + ' ' + from + 'deg ' + angle + 'deg';
    });
    var conic =
        conicParts.length > 0
            ? 'conic-gradient(' + conicParts.join(', ') + ')'
            : '#e2e8f0';

    var legendHtml = catKeys
        .map(function (k, i) {
            return (
                '<li>' +
                '<span class="demo-analytics-dot" style="background:' +
                escAttr(colors[i]) +
                '" aria-hidden="true"></span>' +
                '<span class="demo-analytics-cat-name">' +
                escHtml(categoryLabel(k)) +
                '</span>' +
                '<span class="demo-analytics-cat-amt">€' +
                Number(byCat[k]).toFixed(2) +
                '</span>' +
                '</li>'
            );
        })
        .join('');

    var aria = FsT('fs.analytics.pie_chart_aria') || FsT('fs.analytics.section_category_split');
    root.innerHTML =
        '<div class="demo-analytics-donut-wrap" role="img" aria-label="' +
        escAttr(aria) +
        '">' +
        '<div class="demo-donut-ring-shell" aria-hidden="true">' +
        '<div class="demo-donut-ring" style="background:' +
        escAttr(conic) +
        '"></div>' +
        '<div class="demo-donut-hole"></div></div>' +
        '<ul class="demo-analytics-donut-legend">' +
        legendHtml +
        '</ul></div>';
}

function addDays(d, n) {
    var x = new Date(d.getTime());
    x.setDate(x.getDate() + n);
    x.setHours(0, 0, 0, 0);
    return x;
}

function renderAnalytics() {
    if (typeof subscriptions === 'undefined') return;

    var totalMonthly = subscriptions.reduce(function (sum, s) {
        return sum + subscriptionMonthlyTotal(s);
    }, 0);

    var yearlyEst = totalMonthly * 12;

    var elMonth = document.getElementById('analytics-monthly-total');
    var elYear = document.getElementById('analytics-yearly-total');
    if (elMonth) elMonth.textContent = '€' + totalMonthly.toFixed(2);
    if (elYear) elYear.textContent = '€' + yearlyEst.toFixed(2);

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var horizon = addDays(today, 30);

    var byCat = {};
    subscriptions.forEach(function (s) {
        var k = normalizeCategoryKey(s.category);
        if (!byCat[k]) byCat[k] = 0;
        byCat[k] += subscriptionMonthlyTotal(s);
    });

    var catKeys = Object.keys(byCat).sort(function (a, b) {
        return byCat[b] - byCat[a];
    });
    var catTotal = catKeys.reduce(function (s, k) {
        return s + byCat[k];
    }, 0);

    var catHost = document.getElementById('analytics-by-category');
    if (catHost) {
        if (!catKeys.length) {
            catHost.innerHTML =
                '<p class="analytics-empty">' + escHtml(FsT('fs.analytics.cat_empty')) + '</p>';
        } else {
            catHost.innerHTML = catKeys
                .map(function (key, i) {
                    var amt = byCat[key];
                    var pct = catTotal > 0 ? Math.round((amt / catTotal) * 100) : 0;
                    var color = ANALYTICS_PIE_COLORS[i % ANALYTICS_PIE_COLORS.length];
                    return (
                        '<div class="analytics-cat-row">' +
                        '<div class="analytics-cat-label"><span class="analytics-cat-name">' +
                        escHtml(categoryLabel(key)) +
                        '</span>' +
                        '<span class="analytics-cat-amount">€' +
                        amt.toFixed(2) +
                        '</span></div>' +
                        '<div class="analytics-cat-bar"><div class="analytics-cat-bar-fill" style="width:' +
                        pct +
                        '%;background:' +
                        escAttr(color) +
                        '"></div></div>' +
                        '</div>'
                    );
                })
                .join('');
        }
    }

    renderCategoryDonut(catKeys, byCat);

    var upcomingHorizon = subscriptions
        .filter(function (s) {
            if (!s.date) return false;
            var ds = new Date(s.date + 'T00:00:00');
            return ds >= today && ds <= horizon;
        })
        .sort(function (a, b) {
            return new Date(a.date) - new Date(b.date);
        });

    var upcomingTotal = upcomingHorizon.reduce(function (sum, s) {
        return sum + subscriptionMonthlyTotal(s);
    }, 0);

    var elUpcoming = document.getElementById('analytics-upcoming-total');
    if (elUpcoming) elUpcoming.textContent = '€' + upcomingTotal.toFixed(2);

    var upcomingNote = document.getElementById('analytics-upcoming-note');
    if (upcomingNote) {
        var ut = FsT('fs.analytics.upcoming_note');
        upcomingNote.textContent = ut
            ? ut.replace(/\{count\}/g, String(upcomingHorizon.length))
            : '';
    }

    var futureAll = subscriptions
        .filter(function (s) {
            return s.date && new Date(s.date + 'T00:00:00') >= today;
        })
        .sort(function (a, b) {
            return new Date(a.date) - new Date(b.date);
        });

    var elNextDate = document.getElementById('analytics-next-date');
    var elNextName = document.getElementById('analytics-next-name');
    var elNextAmount = document.getElementById('analytics-next-amount');
    if (futureAll.length === 0) {
        if (elNextDate) elNextDate.textContent = '-';
        if (elNextName) elNextName.textContent = FsT('fs.analytics.next_none');
        if (elNextAmount) elNextAmount.textContent = '';
    } else {
        var nx = futureAll[0];
        var pay = subscriptionMonthlyTotal(nx);
        if (elNextDate) elNextDate.textContent = formatDate(nx.date);
        if (elNextName) elNextName.textContent = nx.name;
        if (elNextAmount) elNextAmount.textContent = '€' + pay.toFixed(2);
    }

    if (typeof refreshDashNotifications === 'function') {
        refreshDashNotifications();
    }
}

function fsBootAnalytics() {
    var skip =
        typeof window !== 'undefined' &&
        window.__subtrackSubsApiSyncedOnce;
    if (!skip && typeof subtrackReloadSubscriptionsFromBootstrap === 'function') {
        subtrackReloadSubscriptionsFromBootstrap();
    }
    subtrackSyncSubscriptionsFromApi().then(function () {
        renderAnalytics();
    });
}

window.fsBootAnalytics = fsBootAnalytics;
