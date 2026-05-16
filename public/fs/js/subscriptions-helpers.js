/* =============================================
   SubTrack - kopīgas palīgfunkcijas (panelis, analītika, paziņojumi)
   ============================================= */

var SUB_CATEGORY_LABELS = {
    subscription: 'Abonements',
    bill: 'Rēķins',
    credit: 'Kredīts',
    leasing: 'Līzings',
    insurance: 'Apdrošināšana',
    other: 'Citi maksājumi',
};

function normalizeCategoryKey(key) {
    if (key && SUB_CATEGORY_LABELS[key]) return key;
    return 'subscription';
}

function categoryLabel(key) {
    return SUB_CATEGORY_LABELS[normalizeCategoryKey(key)];
}

function monthlyAmount(amount, period) {
    if (period === 'yearly') return amount / 12;
    if (period === 'weekly') return amount * 4.33;
    return amount;
}

function sumDeviceAmounts(s) {
    if (!s.devices || !s.devices.length) return 0;
    return s.devices.reduce(function (a, d) { return a + (parseFloat(d.amount) || 0); }, 0);
}

function subscriptionMonthlyTotal(s) {
    return monthlyAmount(s.amount, s.period) + sumDeviceAmounts(s);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    var d = new Date(dateStr + 'T00:00:00');
    var months = ['janvārī', 'februārī', 'martā', 'aprīlī', 'maijā', 'jūnijā', 'jūlijā', 'augustā', 'septembrī', 'oktobrī', 'novembrī', 'decembrī'];
    return d.getDate() + '. ' + months[d.getMonth()];
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
        setTimeout(function () { toast.remove(); }, 320);
    }, 2800);
}
