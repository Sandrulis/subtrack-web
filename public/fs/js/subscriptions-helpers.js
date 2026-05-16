/* =============================================
   SubTrack - kopīgas palīgfunkcijas (panelis, analītika, paziņojumi)
   ============================================= */

var CATEGORY_PHRASE_KEY = {
    subscription: 'landing.mock.pill_subscription',
    bill: 'landing.mock.pill_bill',
    credit: 'landing.mock.pill_credit',
    leasing: 'landing.mock.pill_leasing',
    insurance: 'landing.mock.pill_insurance',
    other: 'landing.mock.pill_other'
};

/** Atkāpe bez React bootstrap */
var SUB_CATEGORY_LABELS_LV = {
    subscription: 'Abonements',
    bill: 'Rēķins',
    credit: 'Kredīts',
    leasing: 'Līzings',
    insurance: 'Apdrošināšana',
    other: 'Citi maksājumi'
};

function fsIntlLocale() {
    var meta = typeof window !== 'undefined' && window.__SUBTRACK_FS_META ? window.__SUBTRACK_FS_META : null;
    if (meta && meta.intlLocale) return String(meta.intlLocale);
    return 'lv-LV';
}

/** @returns { string } tulkošana vai tukša ja nav bootstrap */
function FsT(key) {
    var m = typeof window !== 'undefined' ? window.__SUBTRACK_FS_I18N : null;
    if (!m || typeof key !== 'string') return '';
    var s = m[key];
    return typeof s === 'string' && s.length ? s : '';
}

function normalizeCategoryKey(key) {
    if (key && CATEGORY_PHRASE_KEY[key]) return key;
    return 'subscription';
}

function categoryLabel(key) {
    var nk = normalizeCategoryKey(key);
    var phraseKey = CATEGORY_PHRASE_KEY[nk];
    var txt = FsT(phraseKey);
    if (txt) return txt;
    return SUB_CATEGORY_LABELS_LV[nk] || nk;
}

function monthlyAmount(amount, period) {
    if (period === 'yearly') return amount / 12;
    if (period === 'weekly') return amount * 4.33;
    return amount;
}

function sumDeviceAmounts(s) {
    if (!s.devices || !s.devices.length) return 0;
    return s.devices.reduce(function (a, d) {
        return a + (parseFloat(d.amount) || 0);
    }, 0);
}

function subscriptionMonthlyTotal(s) {
    return monthlyAmount(s.amount, s.period) + sumDeviceAmounts(s);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    var d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return '-';
    try {
        return new Intl.DateTimeFormat(fsIntlLocale(), { day: 'numeric', month: 'long' }).format(d);
    } catch (e) {
        return d.getDate() + '.' + (d.getMonth() + 1) + '.';
    }
}

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

/** Nākamais termiņš pēc „samaksāts“ (neejam uz pagātni salīdzinājumā ar šodienu). */
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

/** Kredīta / līzingu – mēneši līdz „līdz” datumam */
function formatMonthsRemainingLong(n) {
    if (n <= 0) return '';
    var lc = fsIntlLocale().toLowerCase();
    if (lc === 'lv' || lc.startsWith('lv-')) {
        if (n === 1) return 'atlikuši 1 mēnesis';
        return 'atlikuši ' + n + ' mēneši';
    }
    var tpl = FsT('fs.dashboard.months_remaining');
    if (!tpl) {
        var en = '{n} months left'.replace('{n}', String(n));
        return en;
    }
    return tpl.replace(/\{n\}/g, String(n));
}

function formatOverdueLabel(days) {
    var lc = fsIntlLocale().toLowerCase();
    if (lc === 'lv' || lc.startsWith('lv-')) {
        if (days === 1) return '1 diena kavējumā';
        var mod10 = days % 10;
        var mod100 = days % 100;
        if (mod10 === 1 && mod100 !== 11) return days + ' diena kavējumā';
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 > 20))
            return days + ' dienas kavējumā';
        return days + ' dienu kavējumā';
    }
    var oneTpl = FsT('fs.dashboard.overdue_one');
    var othTpl = FsT('fs.dashboard.overdue_other');
    if (days === 1) {
        if (oneTpl) return oneTpl.replace(/\{days\}/g, '1');
        return '1 day overdue';
    }
    if (othTpl) return othTpl.replace(/\{days\}/g, String(days));
    return days + ' days overdue';
}

function periodTextUi(period) {
    var k =
        period === 'yearly'
            ? 'fs.dashboard.period_yearly'
            : period === 'weekly'
              ? 'fs.dashboard.period_weekly'
              : period === 'monthly'
                ? 'fs.dashboard.period_monthly'
                : '';
    if (!k) return period;
    var t = FsT(k);
    if (t) return t;
    if (period === 'monthly') return 'mēnesī';
    if (period === 'yearly') return 'gadā';
    if (period === 'weekly') return 'nedēļā';
    return period;
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** Toast ziņojumi (lapā nepieciešams elements #toast-container). */
function showToast(msg, type) {
    var container = document.getElementById('toast-container');
    if (!container) return;
    var toast = document.createElement('div');
    toast.className = 'toast ' + (type || '');
    var prefix = '';
    if (type === 'success') prefix = '<i class="fa-solid fa-check"></i> ';
    else if (type === 'error') prefix = '<i class="fa-solid fa-circle-exclamation"></i> ';
    toast.innerHTML = prefix + escHtml(msg);
    container.appendChild(toast);
    setTimeout(function () {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity .3s';
        setTimeout(function () {
            toast.remove();
        }, 320);
    }, 2800);
}
