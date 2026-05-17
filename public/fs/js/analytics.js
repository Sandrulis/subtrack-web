/* =============================================
   SubTrack - Analītikas lapa (abonementi no API / bootstrap)
   ============================================= */

var analyticsPieChart = null;
var analyticsPieDataLabelsRegistered = false;

/** Krāsas „slices” - saskaņotas ar SubTrack, pietiekami atšķirīgas */
var ANALYTICS_PIE_COLORS = [
    '#0d9488', '#f59e0b', '#3b82f6', '#64748b', '#e11d48', '#8b5cf6', '#059669', '#d97706'
];

function destroyCategoryPieChart() {
    if (analyticsPieChart) {
        analyticsPieChart.destroy();
        analyticsPieChart = null;
    }
}

function registerChartDataLabelsOnce() {
    if (analyticsPieDataLabelsRegistered || typeof Chart === 'undefined') return;
    var P = typeof ChartDataLabels !== 'undefined' ? ChartDataLabels : null;
    if (P && Chart.register) {
        try {
            Chart.register(P);
            analyticsPieDataLabelsRegistered = true;
        } catch (e) {
            analyticsPieDataLabelsRegistered = false;
        }
    }
}

function renderCategoryPie(catKeys, byCat) {
    var canvas = document.getElementById('analytics-category-pie');
    var wrap = document.getElementById('analytics-pie-wrap');
    var emptyEl = document.getElementById('analytics-pie-empty');
    if (!canvas || typeof Chart === 'undefined') {
        return;
    }

    destroyCategoryPieChart();

    var total = catKeys.reduce(function (s, k) { return s + byCat[k]; }, 0);

    if (!catKeys.length || total <= 0) {
        if (wrap) wrap.classList.add('hidden');
        if (emptyEl) {
            emptyEl.classList.remove('hidden');
            emptyEl.textContent = FsT('fs.analytics.pie_empty');
        }
        return;
    }

    if (wrap) wrap.classList.remove('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');

    registerChartDataLabelsOnce();

    var labels = catKeys.map(function (k) { return categoryLabel(k); });
    var values = catKeys.map(function (k) { return byCat[k]; });
    var colors = catKeys.map(function (k, i) { return ANALYTICS_PIE_COLORS[i % ANALYTICS_PIE_COLORS.length]; });

    var ctx = canvas.getContext('2d');

    var pluginsCfg = {
        legend: {
            position: 'right',
            align: 'center',
            labels: {
                boxWidth: 12,
                boxHeight: 12,
                padding: 12,
                usePointStyle: true,
                pointStyle: 'rect',
                font: { size: 12, family: 'Inter, system-ui, sans-serif', weight: '500' },
                color: '#475569'
            }
        },
        tooltip: {
            callbacks: {
                label: function (context) {
                    var label = context.label || '';
                    var v = context.raw;
                    var sum = context.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                    var pct = sum > 0 ? Math.round((v / sum) * 100) : 0;
                    return label + ': €' + Number(v).toFixed(2) + ' (' + pct + '%)';
                }
            }
        }
    };

    if (analyticsPieDataLabelsRegistered && typeof ChartDataLabels !== 'undefined') {
        pluginsCfg.datalabels = {
            color: '#ffffff',
            font: { weight: '700', size: 11, family: 'Inter, system-ui, sans-serif' },
            formatter: function (value, ctx) {
                var arr = ctx.dataset.data;
                var sum = arr.reduce(function (a, b) { return a + b; }, 0);
                if (sum <= 0) return '';
                return Math.round((value / sum) * 100) + '%';
            },
            backgroundColor: 'rgba(30, 30, 46, 0.88)',
            borderRadius: 4,
            padding: { top: 4, right: 6, bottom: 4, left: 6 }
        };
    }

    analyticsPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.05,
            layout: {
                padding: { top: 6, right: 4, bottom: 6, left: 4 }
            },
            plugins: pluginsCfg
        }
    });
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
    var maxCat = catKeys.length ? Math.max.apply(null, catKeys.map(function (k) { return byCat[k]; })) : 0;

    var catHost = document.getElementById('analytics-by-category');
    if (catHost) {
        if (!catKeys.length) {
            catHost.innerHTML =
                '<p class="analytics-empty">' + escHtml(FsT('fs.analytics.cat_empty')) + '</p>';
        } else {
            catHost.innerHTML = catKeys.map(function (key) {
                var amt = byCat[key];
                var pct = maxCat > 0 ? Math.round((amt / maxCat) * 100) : 0;
                return '<div class="analytics-cat-row">' +
                    '<div class="analytics-cat-label"><span class="analytics-cat-name">' + escHtml(categoryLabel(key)) + '</span>' +
                    '<span class="analytics-cat-amount">€' +
                    amt.toFixed(2) +
                    escHtml(FsT('fs.analytics.per_month_abbr')) +
                    '</span></div>' +
                    '<div class="analytics-cat-bar"><div class="analytics-cat-bar-fill" style="width:' + pct + '%"></div></div>' +
                    '</div>';
            }).join('');
        }
    }

    renderCategoryPie(catKeys, byCat);

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
        .filter(function (s) { return s.date && new Date(s.date + 'T00:00:00') >= today; })
        .sort(function (a, b) { return new Date(a.date) - new Date(b.date); });

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
