/* =============================================
   SubTrack - abonementu masīvs (aizpilda no #subtrack-subs-bootstrap-json
   vai paliek tukšs līdz API ielādei).
   ============================================= */

var subscriptions = [];

/** Atkārtoti nolasa `#subtrack-subs-bootstrap-json` (klienta navigācija starp /dashboard un /analytics). */
function subtrackReloadSubscriptionsFromBootstrap() {
    var el = document.getElementById('subtrack-subs-bootstrap-json');
    if (!el || !el.textContent) return;
    try {
        var parsed = JSON.parse(el.textContent.trim());
        if (Array.isArray(parsed)) subscriptions = parsed;
    } catch (ignore) {}
}

(function hydrateSubscriptionsBootstrap() {
    subtrackReloadSubscriptionsFromBootstrap();
})();
