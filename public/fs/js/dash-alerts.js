/* =============================================
   SubTrack - augšējās joslas paziņojumi (kavētie / gaidāmie)
   ============================================= */

function notifyOverdueDays(dateStr) {
    if (!dateStr) return 0;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var d = new Date(dateStr + 'T00:00:00');
    return Math.max(0, Math.round((today - d) / 86400000));
}

function buildNotifyItemRow(s, isOverdue) {
    var pay = subscriptionMonthlyTotal(s);
    var meta = escHtml(formatDate(s.date)) + ' · €' + pay.toFixed(2);
    var sub = '';
    if (isOverdue) {
        var od = notifyOverdueDays(s.date);
        sub = '<span class="dash-notify-item-late">' + escHtml(String(od)) + ' d. kavējumā</span>';
    }
    return '<div class="dash-notify-item' + (isOverdue ? ' dash-notify-item--overdue' : '') + '">' +
        '<div class="dash-notify-item-main">' +
        '<span class="dash-notify-item-name">' + escHtml(s.name) + '</span>' +
        '<span class="dash-notify-item-meta">' + meta + '</span>' +
        (sub ? sub : '') +
        '</div></div>';
}

function closeDashNotifyPanel() {
    var panel = document.getElementById('dash-notify-panel');
    var btn = document.getElementById('dash-notify-toggle');
    if (panel) {
        panel.classList.add('hidden');
        clearDashNotifyPanelMobPlacement(panel);
    }
    if (btn) {
        btn.setAttribute('aria-expanded', 'false');
    }
}

/** Noņem fixed izkārtojumu (desktop atgriežas pie absolute). */
function clearDashNotifyPanelMobPlacement(panel) {
    if (!panel) return;
    panel.classList.remove('dash-notify-panel--mob-fixed');
    panel.style.removeProperty('top');
    panel.style.removeProperty('right');
    panel.style.removeProperty('left');
    panel.style.removeProperty('width');
}

/**
 * Šauri ekrāniem: viewport fixed + platums zem clampa, lai panelis neiejauztos kreisajā pusē.
 * (Plats panelis + mazs wrap ap pogu izraisa nobīdi.)
 */
function syncDashNotifyPanelMobPlacement() {
    var panel = document.getElementById('dash-notify-panel');
    var toggle = document.getElementById('dash-notify-toggle');
    if (!panel || !toggle || panel.classList.contains('hidden')) {
        if (panel) clearDashNotifyPanelMobPlacement(panel);
        return;
    }

    var mq = window.matchMedia('(max-width: 768px)');
    if (!mq.matches) {
        clearDashNotifyPanelMobPlacement(panel);
        return;
    }

    var vw = Math.max(
        typeof window.innerWidth === 'number' ? window.innerWidth : 0,
        document.documentElement ? document.documentElement.clientWidth || 0 : 0
    );

    var margin = 14;
    var r = toggle.getBoundingClientRect();
    var boundedRight = Math.min(Math.max(r.right, margin), vw - margin);
    var insetR = vw - boundedRight;

    var pwAnchored = Math.min(360, boundedRight - margin);
    var pwWide = vw - 2 * margin;
    var useWide = pwAnchored < Math.min(280, vw - 2 * margin);
    var pw;

    if (useWide && pwWide > pwAnchored + 48) {
        pw = pwWide;
        insetR = margin;
    } else {
        pw = Math.max(120, Math.min(pwAnchored, vw - insetR - margin));
    }

    var topPx = Math.round(r.bottom + 8);

    panel.classList.add('dash-notify-panel--mob-fixed');
    panel.style.top = topPx + 'px';
    panel.style.right = Math.round(Math.max(insetR, margin)) + 'px';
    panel.style.left = 'auto';
    panel.style.width = Math.round(pw) + 'px';
}

function refreshDashNotifications() {
    var panel = document.getElementById('dash-notify-panel');
    if (!panel || typeof subscriptions === 'undefined') return;

    var badge = document.getElementById('dash-notify-badge');
    var icon = document.getElementById('dash-notify-icon');
    var secO = document.getElementById('dash-notify-overdue-section');
    var secU = document.getElementById('dash-notify-upcoming-section');
    var listO = document.getElementById('dash-notify-overdue-list');
    var listU = document.getElementById('dash-notify-upcoming-list');

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var overdue = subscriptions.filter(function (s) {
        if (!s.date) return false;
        return new Date(s.date + 'T00:00:00') < today;
    }).sort(function (a, b) {
        return new Date(a.date + 'T00:00:00') - new Date(b.date + 'T00:00:00');
    });

    var upcoming = subscriptions.filter(function (s) {
        if (!s.date) return false;
        return new Date(s.date + 'T00:00:00') >= today;
    }).sort(function (a, b) {
        return new Date(a.date + 'T00:00:00') - new Date(b.date + 'T00:00:00');
    });

    var count = overdue.length + upcoming.length;

    if (badge) {
        if (count > 0) {
            badge.textContent = String(count);
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    if (icon) {
        var solid = icon.querySelector('.dash-notify-bell--solid');
        var regular = icon.querySelector('.dash-notify-bell--regular');
        if (solid && regular) {
            if (count > 0) {
                solid.classList.remove('hidden');
                regular.classList.add('hidden');
            } else {
                solid.classList.add('hidden');
                regular.classList.remove('hidden');
            }
        }
    }

    if (listO && secO) {
        if (overdue.length === 0) {
            secO.classList.add('hidden');
            listO.innerHTML = '';
        } else {
            secO.classList.remove('hidden');
            listO.innerHTML = overdue.map(function (s) { return buildNotifyItemRow(s, true); }).join('');
        }
    }

    if (listU && secU) {
        if (upcoming.length === 0) {
            secU.classList.add('hidden');
            listU.innerHTML = '';
        } else {
            secU.classList.remove('hidden');
            listU.innerHTML = upcoming.map(function (s) { return buildNotifyItemRow(s, false); }).join('');
        }
    }

    syncDashNotifyPanelMobPlacement();
}

function initDashNotifications() {
    var toggle = document.getElementById('dash-notify-toggle');
    var panel = document.getElementById('dash-notify-panel');
    if (!toggle || !panel) return;

    toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        if (panel.classList.contains('hidden')) {
            panel.classList.remove('hidden');
            toggle.setAttribute('aria-expanded', 'true');
            requestAnimationFrame(function () {
                syncDashNotifyPanelMobPlacement();
                requestAnimationFrame(syncDashNotifyPanelMobPlacement);
            });
        } else {
            panel.classList.add('hidden');
            toggle.setAttribute('aria-expanded', 'false');
            clearDashNotifyPanelMobPlacement(panel);
        }
    });

    panel.addEventListener('click', function (e) {
        e.stopPropagation();
    });

    document.addEventListener('click', function () {
        closeDashNotifyPanel();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeDashNotifyPanel();
        }
    });

    var resizeT;
    function onReflow() {
        syncDashNotifyPanelMobPlacement();
    }
    window.addEventListener(
        'resize',
        function () {
            clearTimeout(resizeT);
            resizeT = setTimeout(onReflow, 100);
        },
        { passive: true }
    );

    window.addEventListener('orientationchange', onReflow);

    refreshDashNotifications();
}

function fsBootDashAlerts() {
    initDashNotifications();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fsBootDashAlerts);
} else {
    fsBootDashAlerts();
}
