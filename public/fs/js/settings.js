/* =============================================
   SubTrack - iestatījumu lapa (prototips, localStorage)
   ============================================= */

var SUBTRACK_PREFS_STORAGE_KEY = 'subtrack_fs_user_prefs';

var SUBTRACK_PREFS_DEFAULTS = {
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

function subtrackPrefsWrite(prefs) {
    try {
        localStorage.setItem(SUBTRACK_PREFS_STORAGE_KEY, JSON.stringify(prefs));
        return true;
    } catch (e) {
        return false;
    }
}

function subtrackPad2(n) {
    return n < 10 ? '0' + n : String(n);
}

function subtrackFormatPrefsPreview(prefs) {
    /* Fiksēts piemēra datums laika zonas ietekmei šajā prototipā netiek rēķināts. */
    var y = 2026;
    var mo = 5;
    var d = 16;
    var h = 14;
    var mi = 30;
    var sep = prefs.date_sep;
    var dStr = subtrackPad2(d);
    var mStr = subtrackPad2(mo);
    var yStr = String(y);
    var datePart = '';
    if (prefs.date_order === 'ymd') {
        datePart = yStr + sep + mStr + sep + dStr;
    } else if (prefs.date_order === 'mdy') {
        datePart = mStr + sep + dStr + sep + yStr;
    } else {
        datePart = dStr + sep + mStr + sep + yStr;
    }

    var tSep = prefs.time_sep;
    var timePart = '';
    if (prefs.time_format === '12') {
        timePart = '2' + tSep + '30 pēcpusdiena';
    } else {
        timePart = subtrackPad2(h) + tSep + subtrackPad2(mi);
    }

    var curSymbols = {
        EUR: '€',
        USD: '$',
        GBP: '£',
        SEK: 'kr',
        PLN: 'zł',
        CHF: 'Fr'
    };
    var cs = curSymbols[prefs.currency] || prefs.currency;

    var weekLabel = prefs.week_start === 'sunday' ? 'Svētdiena' : 'Pirmdiena';

    return datePart + ' · ' + timePart + ' · ' + prefs.timezone.replace(/\//g, ' / ') + ' · Nedēļa: ' + weekLabel + ' · Valūtas simbols: ' + cs;
}

function subtrackPrefsCollectForm() {
    return {
        currency: document.getElementById('set-currency').value,
        date_order: document.getElementById('set-date-order').value,
        date_sep: document.getElementById('set-date-sep').value,
        time_format: document.getElementById('set-time-format').value,
        time_sep: document.getElementById('set-time-sep').value,
        timezone: document.getElementById('set-tz').value,
        week_start: document.getElementById('set-week-start').value
    };
}

function subtrackPrefsApplyForm(prefs) {
    document.getElementById('set-currency').value = prefs.currency;
    document.getElementById('set-date-order').value = prefs.date_order;
    document.getElementById('set-date-sep').value = prefs.date_sep;
    document.getElementById('set-time-format').value = prefs.time_format;
    document.getElementById('set-time-sep').value = prefs.time_sep;
    document.getElementById('set-tz').value = prefs.timezone;
    document.getElementById('set-week-start').value = prefs.week_start;
}

function subtrackPrefsRefreshPreview() {
    var p = subtrackPrefsCollectForm();
    var body = document.getElementById('settings-preview-body');
    if (!body) return;
    body.textContent = subtrackFormatPrefsPreview(p);
}

document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('settings-form');
    if (!form) return;

    subtrackPrefsApplyForm(subtrackPrefsRead());
    subtrackPrefsRefreshPreview();

    ['set-currency', 'set-date-order', 'set-date-sep', 'set-time-format', 'set-time-sep', 'set-tz', 'set-week-start'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', subtrackPrefsRefreshPreview);
        }
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var prefs = subtrackPrefsCollectForm();
        if (!subtrackPrefsWrite(prefs)) {
            showToast('Neizdevās saglabāt – pārbaudiet pārlūka glabātavu.', 'error');
            return;
        }
        showToast('Iestatījumi saglabāti pārlūkprogrammā.', 'success');
    });
});
