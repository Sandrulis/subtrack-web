/* =============================================
   SubTrack - datuma formatēšana pēc lietotāja prefs
   (atbilst lib/user-display-preferences.ts formatDateForDisplayPreferences)
   ============================================= */

var SUBTRACK_PREFS_STORAGE_KEY = 'subtrack_fs_user_prefs';

var SUBTRACK_PREFS_DEFAULTS = {
    interface_language_code: 'lv',
    currency: 'EUR',
    date_order: 'dmy',
    date_sep: '.',
    time_format: '24',
    time_sep: ':',
    timezone: 'Europe/Riga',
    week_start: 'monday'
};

function subtrackPrefsRead() {
    try {
        var raw = localStorage.getItem(SUBTRACK_PREFS_STORAGE_KEY);
        if (!raw) return Object.assign({}, SUBTRACK_PREFS_DEFAULTS);
        var o = JSON.parse(raw);
        if (!o || typeof o !== 'object') return Object.assign({}, SUBTRACK_PREFS_DEFAULTS);
        var out = Object.assign({}, SUBTRACK_PREFS_DEFAULTS);
        Object.keys(SUBTRACK_PREFS_DEFAULTS).forEach(function (k) {
            if (Object.prototype.hasOwnProperty.call(o, k)) out[k] = o[k];
        });
        return out;
    } catch (e) {
        return Object.assign({}, SUBTRACK_PREFS_DEFAULTS);
    }
}

function subtrackPad2(n) {
    return n < 10 ? '0' + n : String(n);
}

function subtrackFsIntlLocale() {
    if (typeof fsIntlLocale === 'function') return fsIntlLocale();
    var meta = typeof window !== 'undefined' && window.__SUBTRACK_FS_META ? window.__SUBTRACK_FS_META : null;
    if (meta && meta.intlLocale) return String(meta.intlLocale);
    return 'lv-LV';
}

/**
 * YYYY-MM-DD -> lietotāja date_order / date_sep / timezone.
 * @param {string} isoStr
 * @param {{ includeYear?: boolean, longMonth?: boolean }} [options]
 */
function formatIsoDateForUserPrefs(isoStr, options) {
    options = options || {};
    if (!isoStr) return options.longMonth ? '-' : '';
    var iso = typeof normalizeSubscriptionDateIso === 'function'
        ? normalizeSubscriptionDateIso(isoStr)
        : String(isoStr).trim().slice(0, 10);
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return options.longMonth ? '-' : '';

    var prefs = subtrackPrefsRead();
    var intlLocale = subtrackFsIntlLocale();
    var d = new Date(iso + 'T12:00:00');

    if (options.longMonth && !options.includeYear) {
        try {
            return new Intl.DateTimeFormat(intlLocale, {
                timeZone: prefs.timezone,
                day: 'numeric',
                month: 'long'
            }).format(d);
        } catch (e) {
            return d.getDate() + '.' + (d.getMonth() + 1) + '.';
        }
    }

    try {
        var parts = new Intl.DateTimeFormat(intlLocale, {
            timeZone: prefs.timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).formatToParts(d);
        var y = '';
        var m = '';
        var day = '';
        for (var i = 0; i < parts.length; i++) {
            if (parts[i].type === 'year') y = parts[i].value;
            if (parts[i].type === 'month') m = parts[i].value;
            if (parts[i].type === 'day') day = parts[i].value;
        }
        var sep = prefs.date_sep || '.';
        if (prefs.date_order === 'ymd') return y + sep + m + sep + day;
        if (prefs.date_order === 'mdy') return m + sep + day + sep + y;
        return day + sep + m + sep + y;
    } catch (err) {
        var dp = iso.split('-');
        var sep2 = prefs.date_sep || '.';
        if (prefs.date_order === 'ymd') return dp[0] + sep2 + dp[1] + sep2 + dp[2];
        if (prefs.date_order === 'mdy') return dp[1] + sep2 + dp[2] + sep2 + dp[0];
        return dp[2] + sep2 + dp[1] + sep2 + dp[0];
    }
}
