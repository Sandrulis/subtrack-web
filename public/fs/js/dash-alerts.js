/* =============================================
   SubTrack - augšējās joslas paziņojumi (kavētie / gaidāmie)
   ============================================= */

/** Launcher / PWA ikonas skaitlis – gaida `window.subtrackSyncAppBadge` no React bundle. */
function subtrackSyncLauncherBadge(count) {
    if (typeof window.subtrackSyncAppBadge === 'function') {
        window.subtrackSyncAppBadge(count);
        return;
    }
    var attempts = 0;
    var timer = setInterval(function () {
        attempts += 1;
        if (typeof window.subtrackSyncAppBadge === 'function') {
            window.subtrackSyncAppBadge(count);
            clearInterval(timer);
        } else if (attempts >= 48) {
            clearInterval(timer);
        }
    }, 250);
}

function notifyOverdueDays(dateStr) {
    var dIso = normalizeSubscriptionDateIso(dateStr);
    if (!dIso) return 0;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var d = new Date(dIso + 'T00:00:00');
    return Math.max(0, Math.round((today - d) / 86400000));
}

function todayISOLocal() {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return toISODateLocal(today);
}

/**
 * Atzīmēt kā samaksātu no paziņojumiem (šodien vai kavēts – termiņš ≤ šodienai).
 * Tas pats API kā panelī.
 */
function markNotifyItemPaid(rawId) {
    if (typeof subscriptions === 'undefined') return;
    if (typeof advanceNextDueAfterPayment !== 'function') return;
    if (subtrackIsMarkPaidPending(rawId)) return;

    var s = subscriptions.find(function (x) {
        return String(x.id) === String(rawId);
    });
    if (!s) return;
    if (typeof subtrackSubscriptionIsShared === 'function' && subtrackSubscriptionIsShared(s)) {
        return;
    }
    var paidOnIso = normalizeSubscriptionDateIso(s.date);
    if (!paidOnIso) return;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var due = new Date(paidOnIso + 'T00:00:00');
    due.setHours(0, 0, 0, 0);
    if (due > today) return;

    var period = s.period || 'monthly';
    var billingDay =
        typeof subscriptionPreferredBillingDay === 'function'
            ? subscriptionPreferredBillingDay(s)
            : null;
    var newDate = advanceNextDueAfterPayment(s.date, period, s.termEnd, billingDay);

    subtrackSetMarkPaidPending(rawId, true);

    var isDemoPublic =
        typeof window !== 'undefined' &&
        (window.__SUBTRACK_DEMO_DASHBOARD__ || window.__SUBTRACK_DEMO_ANALYTICS__);
    if (isDemoPublic) {
        s.date = normalizeSubscriptionDateIso(newDate) || newDate;
        if (paidOnIso && typeof subtrackAddPaidCalendarDay === 'function') {
            subtrackAddPaidCalendarDay(paidOnIso);
        }
        var rawDemo = FsT('fs.dashboard.toast_marked_paid');
        if (typeof showToast === 'function') {
            showToast(
                rawDemo ? rawDemo.replace(/\{date\}/g, formatDate(s.date)) : '',
                'success',
            );
            showToast(FsT('fs.dashboard.toast_demo_only'), 'success');
        }
        if (typeof renderList === 'function') {
            renderList();
        }
        if (typeof renderAnalytics === 'function') {
            renderAnalytics();
        }
        subtrackSetMarkPaidPending(rawId, false);
        refreshDashNotifications();
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
            if (data.subscription && data.subscription.date) {
                mergeSubscriptionFromApi(data.subscription);
            } else {
                s.date = normalizeSubscriptionDateIso(newDate) || newDate;
            }
            if (data.paidCalendarDays && typeof subtrackSetPaidCalendarDays === 'function') {
                subtrackSetPaidCalendarDays(data.paidCalendarDays);
            } else if (paidOnIso && typeof subtrackAddPaidCalendarDay === 'function') {
                subtrackAddPaidCalendarDay(paidOnIso);
            }
            return subtrackSyncSubscriptionsFromApi();
        })
        .then(function () {
            var after = subscriptions.find(function (x) {
                return String(x.id) === String(rawId);
            });
            var shownDate = after && after.date ? after.date : newDate;
            var raw = FsT('fs.dashboard.toast_marked_paid');
            if (typeof showToast === 'function') {
                showToast(
                    raw ? raw.replace(/\{date\}/g, formatDate(shownDate)) : '',
                    'success',
                );
            }
            if (typeof renderList === 'function') {
                renderList();
            }
            if (typeof renderAnalytics === 'function') {
                renderAnalytics();
            }
            refreshDashNotifications();
        })
        .catch(function () {
            if (typeof showToast === 'function') {
                showToast(FsT('fs.dashboard.toast_api_save_failed'), 'error');
            }
        })
        .finally(function () {
            subtrackSetMarkPaidPending(rawId, false);
        });
}

function markNotifyTodayItemPaid(rawId) {
    markNotifyItemPaid(rawId);
}

function buildNotifyItemRow(s, isOverdue) {
    var pay = subscriptionMonthlyTotal(s);
    var meta = escHtml(formatDate(s.date)) + ' · €' + pay.toFixed(2);
    var sub = '';
    if (isOverdue) {
        var od = notifyOverdueDays(s.date);
        var overdueLabel =
            typeof formatOverdueLabel === 'function' ? formatOverdueLabel(od) : String(od) + ' dienas kavējumā';
        sub = '<span class="dash-notify-item-late">' + escHtml(overdueLabel) + '</span>';
        var ariaOk = FsT('fs.dashboard.aria_mark_paid');
        return (
            '<div class="dash-notify-item dash-notify-item--overdue">' +
            '<div class="dash-notify-item-overdue-inner">' +
            '<div class="dash-notify-item-main">' +
            '<span class="dash-notify-item-name">' +
            escHtml(s.name) +
            '</span>' +
            '<span class="dash-notify-item-meta">' +
            meta +
            '</span>' +
            sub +
            '</div>' +
            '<button type="button" class="dash-notify-today-ok dash-notify-mark-paid-ok" data-subscription-id="' +
            escAttr(String(s.id)) +
            '" aria-label="' +
            escAttr(ariaOk) +
            '">' +
            subtrackMarkPaidButtonInnerHtml() +
            '</button>' +
            '</div></div>'
        );
    }
    return (
        '<div class="dash-notify-item">' +
        '<div class="dash-notify-item-main">' +
        '<span class="dash-notify-item-name">' +
        escHtml(s.name) +
        '</span>' +
        '<span class="dash-notify-item-meta">' +
        meta +
        '</span>' +
        (sub ? sub : '') +
        '</div></div>'
    );
}

function buildNotifyTodayItemRow(s) {
    var pay = subscriptionMonthlyTotal(s);
    var meta = escHtml(formatDate(s.date)) + ' · €' + pay.toFixed(2);
    var aria = FsT('fs.dashboard.aria_mark_paid');
    return '<div class="dash-notify-item">' +
        '<div class="dash-notify-item-today-inner">' +
        '<div class="dash-notify-item-main">' +
        '<span class="dash-notify-item-name">' + escHtml(s.name) + '</span>' +
        '<span class="dash-notify-item-meta">' + meta + '</span>' +
        '</div>' +
        '<button type="button" class="dash-notify-today-ok dash-notify-mark-paid-ok" data-subscription-id="' +
        escAttr(String(s.id)) +
        '" aria-label="' +
        escAttr(aria) +
        '">' +
        subtrackMarkPaidButtonInnerHtml() +
        '</button>' +
        '</div></div>';
}

/* ---- Ģimenes dalīšana: saņemtie uzaicinājumi paziņojumu panelī ---- */
var subtrackFamilyNotifyBusyId = null;

function subtrackInitialsFromLabel(label) {
    var parts = String(label || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length) {
        return parts[0].slice(0, 2).toUpperCase();
    }
    return '?';
}

function subtrackParseFamilySharingNotifyCache() {
    if (window.__subtrackFamilySharingNotifyCache) {
        return window.__subtrackFamilySharingNotifyCache;
    }
    var raw =
        typeof subtrackReadBootstrapJsonTextById === 'function'
            ? subtrackReadBootstrapJsonTextById('subtrack-family-sharing-bootstrap-json')
            : '';
    if (!raw) return null;
    try {
        var parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        window.__subtrackFamilySharingNotifyCache = {
            enabled: parsed.enabled === true,
            viewerUserId:
                typeof parsed.viewerUserId === 'string' ? parsed.viewerUserId : '',
            links: Array.isArray(parsed.links) ? parsed.links : [],
        };
        return window.__subtrackFamilySharingNotifyCache;
    } catch (e) {
        return null;
    }
}

function subtrackIncomingFamilyInvites() {
    var data = subtrackParseFamilySharingNotifyCache();
    if (!data || !data.enabled || !data.links || !data.links.length) return [];
    return data.links.filter(function (l) {
        return l && l.isIncoming === true && l.status === 'pending';
    });
}

function subtrackRefreshFamilySharingNotifyFromApi() {
    if (typeof fetch === 'undefined') return;
    if (window.__subtrackFamilySharingNotifyFetchInFlight) return;
    window.__subtrackFamilySharingNotifyFetchInFlight = true;
    fetch('/api/family-sharing', { credentials: 'same-origin' })
        .then(function (res) {
            if (!res.ok) return null;
            return res.json();
        })
        .then(function (data) {
            if (data && typeof data === 'object') {
                window.__subtrackFamilySharingNotifyCache = {
                    enabled: data.enabled === true,
                    viewerUserId:
                        typeof data.viewerUserId === 'string' ? data.viewerUserId : '',
                    links: Array.isArray(data.links) ? data.links : [],
                };
                if (typeof subtrackApplyFamilySharingBootstrap === 'function') {
                    subtrackApplyFamilySharingBootstrap(data);
                }
            }
            refreshDashNotifications();
        })
        .catch(function () {
            /* ignore */
        })
        .finally(function () {
            window.__subtrackFamilySharingNotifyFetchInFlight = false;
        });
}

function subtrackEnsureFamilySharingNotifyData() {
    if (subtrackParseFamilySharingNotifyCache()) return;
    if (document.getElementById('subtrack-family-sharing-bootstrap-json')) return;
    subtrackRefreshFamilySharingNotifyFromApi();
}

function buildNotifyFamilyInviteRow(link) {
    var name = escHtml(link.partnerLabel || '');
    var emailRaw = link.counterpartyEmail || link.inviteEmail || '';
    var email = escHtml(emailRaw);
    var showEmail =
        email.length > 0 &&
        String(link.partnerLabel || '')
            .trim()
            .toLowerCase() !== String(emailRaw).trim().toLowerCase();
    var initials = escHtml(subtrackInitialsFromLabel(link.partnerLabel));
    var acceptLbl = escAttr(FsT('family_sharing.aria_accept') || 'Pieņemt uzaicinājumu');
    var declineLbl = escAttr(FsT('family_sharing.aria_decline') || 'Noraidīt uzaicinājumu');
    var cardBusy = subtrackFamilyNotifyBusyId === link.id;
    var anyBusy = !!subtrackFamilyNotifyBusyId;
    var dis = anyBusy ? ' disabled' : '';
    var loadCls = cardBusy ? ' is-loading' : '';
    var iconHide = cardBusy ? ' hidden' : '';
    var spinHide = cardBusy ? '' : ' hidden';
    var busyAttr = cardBusy ? 'true' : 'false';
    return (
        '<div class="dash-notify-item dash-notify-item--family-invite">' +
        '<div class="dash-notify-family-invite-inner">' +
        '<span class="user-avatar dash-notify-family-avatar" aria-hidden="true">' +
        initials +
        '</span>' +
        '<div class="dash-notify-item-main">' +
        '<span class="dash-notify-item-name">' +
        name +
        '</span>' +
        (showEmail ? '<span class="dash-notify-item-meta">' + email + '</span>' : '') +
        '</div>' +
        '<div class="dash-notify-family-actions">' +
        '<button type="button" class="icon-btn mark-paid dash-notify-family-accept' +
        loadCls +
        '"' +
        ' data-family-link-id="' +
        escAttr(String(link.id)) +
        '" aria-label="' +
        acceptLbl +
        '" aria-busy="' +
        busyAttr +
        '"' +
        dis +
        '>' +
        '<i class="fa-solid fa-check family-sharing-action-icon' +
        iconHide +
        '" aria-hidden="true"></i>' +
        '<span class="mark-paid-spinner btn-spinner family-sharing-action-spinner' +
        spinHide +
        '" aria-hidden="true"></span></button>' +
        '<button type="button" class="icon-btn delete dash-notify-family-decline' +
        loadCls +
        '"' +
        ' data-family-link-id="' +
        escAttr(String(link.id)) +
        '" aria-label="' +
        declineLbl +
        '" aria-busy="' +
        busyAttr +
        '"' +
        dis +
        '>' +
        '<i class="fa-solid fa-times family-sharing-action-icon' +
        iconHide +
        '" aria-hidden="true"></i>' +
        '<span class="mark-paid-spinner btn-spinner family-sharing-action-spinner' +
        spinHide +
        '" aria-hidden="true"></span></button>' +
        '</div></div></div>'
    );
}

function subtrackPatchFamilyInviteFromNotify(linkId, body) {
    if (!linkId || subtrackFamilyNotifyBusyId) return;
    subtrackFamilyNotifyBusyId = linkId;
    refreshDashNotifications();
    fetch('/api/family-sharing/' + encodeURIComponent(String(linkId)), {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
        .then(function (res) {
            return res.json().then(function (data) {
                if (!res.ok || (data && data.success === false)) {
                    var msg =
                        data && data.message
                            ? String(data.message)
                            : 'HTTP ' + res.status;
                    throw new Error(msg);
                }
                return data;
            });
        })
        .then(function () {
            if (body.action === 'accept') {
                var raw = FsT('family_sharing.toast_accepted');
                if (typeof showToast === 'function') {
                    showToast(raw || 'Dalīšana pieņemta', 'success');
                }
            } else if (body.action === 'decline') {
                var rawD = FsT('family_sharing.toast_declined');
                if (typeof showToast === 'function') {
                    showToast(rawD || 'Uzaicinājums noraidīts', 'info');
                }
            }
            return fetch('/api/family-sharing', { credentials: 'same-origin' }).then(function (res) {
                if (!res.ok) return null;
                return res.json();
            });
        })
        .then(function (data) {
            if (data && typeof data === 'object') {
                window.__subtrackFamilySharingNotifyCache = {
                    enabled: data.enabled === true,
                    viewerUserId:
                        typeof data.viewerUserId === 'string' ? data.viewerUserId : '',
                    links: Array.isArray(data.links) ? data.links : [],
                };
                if (typeof subtrackApplyFamilySharingBootstrap === 'function') {
                    subtrackApplyFamilySharingBootstrap(data);
                }
            }
            if (typeof subtrackSyncSubscriptionsFromApi === 'function') {
                return subtrackSyncSubscriptionsFromApi();
            }
        })
        .then(function () {
            if (typeof renderList === 'function') renderList();
            if (typeof renderAnalytics === 'function') renderAnalytics();
            refreshDashNotifications();
        })
        .catch(function (err) {
            var fail = FsT('fs.dashboard.toast_api_save_failed');
            if (typeof showToast === 'function') {
                showToast(
                    err && err.message ? String(err.message) : fail || 'Kļūda',
                    'error',
                );
            }
            refreshDashNotifications();
        })
        .finally(function () {
            subtrackFamilyNotifyBusyId = null;
            refreshDashNotifications();
        });
}

/** Cita augšējās joslas izvēlne (piem. lietotājs): lai nav divu „modāļu“ un tumša fona aiz paziņojumiem. */
var SUBTRACK_NOTIFY_OPENED = 'subtrack:notify-opened';
var SUBTRACK_USER_MENU_OPENED = 'subtrack:user-menu-opened';

var SUBTRACK_LANG_MENU_OPENED = 'subtrack:lang-menu-opened';

function closeDashNotifyPanel() {
    var panel = document.getElementById('dash-notify-panel');
    var btn = document.getElementById('dash-notify-toggle');
    var wrap = document.querySelector('.dash-notify-wrap');
    var backdrop = document.getElementById('dash-notify-backdrop');
    if (panel) {
        panel.classList.add('hidden');
        clearDashNotifyPanelMobPlacement(panel);
    }
    if (btn) {
        btn.setAttribute('aria-expanded', 'false');
    }
    if (wrap) {
        wrap.classList.remove('dash-notify-menu-is-open');
    }
    if (backdrop) {
        backdrop.classList.add('hidden');
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
    if (!panel) return;

    var badge = document.getElementById('dash-notify-badge');
    var icon = document.getElementById('dash-notify-icon');
    var secT = document.getElementById('dash-notify-today-section');
    var listT = document.getElementById('dash-notify-today-list');
    var secO = document.getElementById('dash-notify-overdue-section');
    var secU = document.getElementById('dash-notify-upcoming-section');
    var listO = document.getElementById('dash-notify-overdue-list');
    var listU = document.getElementById('dash-notify-upcoming-list');
    var secF = document.getElementById('dash-notify-family-section');
    var listF = document.getElementById('dash-notify-family-list');
    var emptyEl = document.getElementById('dash-notify-empty');

    function setBellSolid(active) {
        if (!icon) return;
        var solid = icon.querySelector('.dash-notify-bell--solid');
        var regular = icon.querySelector('.dash-notify-bell--regular');
        if (!solid || !regular) return;
        if (active) {
            solid.classList.remove('hidden');
            regular.classList.add('hidden');
        } else {
            solid.classList.add('hidden');
            regular.classList.remove('hidden');
        }
    }

    if (typeof subscriptions === 'undefined') {
        if (badge) {
            badge.classList.add('hidden');
        }
        subtrackSyncLauncherBadge(0);
        setBellSolid(false);
        if (secT) {
            secT.classList.add('hidden');
            if (listT) listT.innerHTML = '';
        }
        if (secO) {
            secO.classList.add('hidden');
            if (listO) listO.innerHTML = '';
        }
        if (secU) {
            secU.classList.add('hidden');
            if (listU) listU.innerHTML = '';
        }
        if (secF) {
            secF.classList.add('hidden');
            if (listF) listF.innerHTML = '';
        }
        if (emptyEl) {
            emptyEl.classList.remove('hidden');
        }
        syncDashNotifyPanelMobPlacement();
        return;
    }

    subtrackEnsureFamilySharingNotifyData();
    var familyInvites = subtrackIncomingFamilyInvites();

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var isoToday = todayISOLocal();

    /** Gaidāmie maksājumi: tikai nākamās 7 dienas, izņemot šodienu (šodiena tikai sadaļā „Šodien…“). */
    var upcomingHorizonEnd = new Date(today);
    upcomingHorizonEnd.setDate(upcomingHorizonEnd.getDate() + 7);

    var notifySubs =
        typeof subtrackSubscriptionsForNotifyList === 'function'
            ? subtrackSubscriptionsForNotifyList()
            : subscriptions;

    var overdue = notifySubs.filter(function (s) {
        var dIso = normalizeSubscriptionDateIso(s.date);
        if (!dIso) return false;
        if (typeof isSubscriptionDueActive === 'function' && !isSubscriptionDueActive(s, today)) {
            return false;
        }
        return new Date(dIso + 'T00:00:00') < today;
    }).sort(function (a, b) {
        return (
            new Date(normalizeSubscriptionDateIso(a.date) + 'T00:00:00') -
            new Date(normalizeSubscriptionDateIso(b.date) + 'T00:00:00')
        );
    });

    var dueToday = notifySubs.filter(function (s) {
        if (typeof isSubscriptionDueActive === 'function' && !isSubscriptionDueActive(s, today)) {
            return false;
        }
        return normalizeSubscriptionDateIso(s.date) === isoToday;
    }).sort(function (a, b) {
        return (
            new Date(normalizeSubscriptionDateIso(a.date) + 'T00:00:00') -
            new Date(normalizeSubscriptionDateIso(b.date) + 'T00:00:00')
        );
    });

    var upcoming = notifySubs.filter(function (s) {
        var dIso = normalizeSubscriptionDateIso(s.date);
        if (!dIso) return false;
        if (typeof isSubscriptionDueActive === 'function' && !isSubscriptionDueActive(s, today)) {
            return false;
        }
        var d = new Date(dIso + 'T00:00:00');
        return d > today && d < upcomingHorizonEnd;
    }).sort(function (a, b) {
        return (
            new Date(normalizeSubscriptionDateIso(a.date) + 'T00:00:00') -
            new Date(normalizeSubscriptionDateIso(b.date) + 'T00:00:00')
        );
    });

    var count = overdue.length + dueToday.length + upcoming.length + familyInvites.length;

    if (badge) {
        if (count > 0) {
            badge.textContent = String(count);
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    subtrackSyncLauncherBadge(count);

    setBellSolid(count > 0);

    if (listF && secF) {
        if (familyInvites.length === 0) {
            secF.classList.add('hidden');
            listF.innerHTML = '';
        } else {
            secF.classList.remove('hidden');
            listF.innerHTML = familyInvites
                .map(function (l) {
                    return buildNotifyFamilyInviteRow(l);
                })
                .join('');
        }
    }

    if (listT && secT) {
        if (dueToday.length === 0) {
            secT.classList.add('hidden');
            listT.innerHTML = '';
        } else {
            secT.classList.remove('hidden');
            listT.innerHTML = dueToday.map(function (s) { return buildNotifyTodayItemRow(s); }).join('');
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

    var showEmpty =
        overdue.length === 0 &&
        dueToday.length === 0 &&
        upcoming.length === 0 &&
        familyInvites.length === 0;
    if (emptyEl) {
        if (showEmpty) {
            emptyEl.classList.remove('hidden');
        } else {
            emptyEl.classList.add('hidden');
        }
    }

    syncDashNotifyPanelMobPlacement();
    if (typeof subtrackSyncMarkPaidButtonsPending === 'function') {
        subtrackSyncMarkPaidButtonsPending();
    }
}

/**
 * Viena globāla inicializācija ar delegēšanu uz document:
 * - Next.js / React var uzzīmēt zvanu vēlāk par skripta ielādi; vecā pieeja (addEventListener uz pogas) tad nekad nesaistījās.
 * - Klienta navigācijā poga tiek pārmontēta; delegēšana darbojas ar jaunajiem elementiem ar tiem pašiem id.
 */
function initDashNotifications() {
    if (window.__subtrackDashNotifyInited) {
        refreshDashNotifications();
        return;
    }
    window.__subtrackDashNotifyInited = true;

    /**
     * Capture fāze: darbojas pirms/React un citiem bubble klausītājiem; aptur plūsmu,
     * kad apstrādājam zvanu / šodienas pogu, lai tas pats klikšķis neiegūst „pretējā“ loģika.
     * Text nodes: dažos pārlūkos target var būt teksta mezgls – closest nav pieejams.
     */
    document.addEventListener(
        'click',
        function (e) {
            var t = e.target;
            if (t && t.nodeType === 3 && t.parentElement) {
                t = t.parentElement;
            }
            if (!t || typeof t.closest !== 'function') return;

            if (t.closest('#dash-notify-toggle')) {
                var panel = document.getElementById('dash-notify-panel');
                var toggle = document.getElementById('dash-notify-toggle');
                if (!panel || !toggle) return;

                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                if (panel.classList.contains('hidden')) {
                    try {
                        window.dispatchEvent(new CustomEvent(SUBTRACK_NOTIFY_OPENED));
                    } catch (ignore) {}
                    var wrap = document.querySelector('.dash-notify-wrap');
                    var backdrop = document.getElementById('dash-notify-backdrop');
                    if (wrap) {
                        wrap.classList.add('dash-notify-menu-is-open');
                    }
                    if (backdrop) {
                        backdrop.classList.remove('hidden');
                    }
                    panel.classList.remove('hidden');
                    toggle.setAttribute('aria-expanded', 'true');
                    try {
                        toggle.focus({ preventScroll: true });
                    } catch (ignore) {}
                    requestAnimationFrame(function () {
                        syncDashNotifyPanelMobPlacement();
                        requestAnimationFrame(syncDashNotifyPanelMobPlacement);
                    });
                } else {
                    closeDashNotifyPanel();
                }
                return;
            }

            var familyAccept = t.closest('.dash-notify-family-accept');
            if (familyAccept && familyAccept.getAttribute('data-family-link-id')) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                subtrackPatchFamilyInviteFromNotify(
                    familyAccept.getAttribute('data-family-link-id'),
                    { action: 'accept' },
                );
                return;
            }

            var familyDecline = t.closest('.dash-notify-family-decline');
            if (familyDecline && familyDecline.getAttribute('data-family-link-id')) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                subtrackPatchFamilyInviteFromNotify(
                    familyDecline.getAttribute('data-family-link-id'),
                    { action: 'decline' },
                );
                return;
            }

            var paidItem = t.closest('.dash-notify-mark-paid-ok');
            if (paidItem && paidItem.getAttribute('data-subscription-id')) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                var paidSubId = paidItem.getAttribute('data-subscription-id');
                if (subtrackIsMarkPaidPending(paidSubId)) return;
                markNotifyItemPaid(paidSubId);
                return;
            }

            if (t.closest('#dash-notify-panel')) {
                e.stopPropagation();
                return;
            }

            if (t.closest('#dash-notify-backdrop')) {
                closeDashNotifyPanel();
                return;
            }

            closeDashNotifyPanel();
        },
        true
    );

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeDashNotifyPanel();
        }
    });

    window.addEventListener(SUBTRACK_USER_MENU_OPENED, closeDashNotifyPanel);
    window.addEventListener(SUBTRACK_LANG_MENU_OPENED, closeDashNotifyPanel);

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

if (typeof window !== 'undefined') {
    window.fsBootDashAlerts = fsBootDashAlerts;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fsBootDashAlerts);
} else {
    fsBootDashAlerts();
}
