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
    }
    if (btn) {
        btn.setAttribute('aria-expanded', 'false');
    }
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
        } else {
            panel.classList.add('hidden');
            toggle.setAttribute('aria-expanded', 'false');
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

    refreshDashNotifications();
}

document.addEventListener('DOMContentLoaded', function () {
    initDashNotifications();
});
