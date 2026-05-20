/**
 * Apstiprina aizvēršanu pēc klikšķa uz modāļa fona, izmantojot globālo React modāli
 * (subtrack:backdrop-close-confirm-request / -result).
 */
(function (global) {
    var DEFAULT_KEY = 'ui.modal.confirm_close_backdrop';
    var REQUEST_EVT = 'subtrack:backdrop-close-confirm-request';
    var RESULT_EVT = 'subtrack:backdrop-close-confirm-result';

    function resolveBackdropCloseMessage(messageKey) {
        var key = messageKey || DEFAULT_KEY;
        if (typeof global.FsT === 'function') {
            var fromFs = global.FsT(key);
            if (fromFs && fromFs !== key) return fromFs;
        }
        var bag = global.__SUBTRACK_FS_I18N;
        if (bag && typeof bag[key] === 'string' && bag[key]) return bag[key];
        if (key === DEFAULT_KEY) {
            return 'Nesaglabātie dati var tikt zaudēti.';
        }
        return '';
    }

    function requestBackdropCloseConfirm(message) {
        return new Promise(function (resolve) {
            var requestId = 'bc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
            function onResult(e) {
                var d = e.detail;
                if (!d || d.requestId !== requestId) return;
                global.removeEventListener(RESULT_EVT, onResult);
                resolve(!!d.confirmed);
            }
            global.addEventListener(RESULT_EVT, onResult);
            global.dispatchEvent(
                new CustomEvent(REQUEST_EVT, {
                    detail: { requestId: requestId, message: message },
                })
            );
        });
    }

    function subtrackConfirmBackdropClose(messageKey, callback) {
        var msg = resolveBackdropCloseMessage(messageKey);
        var p = requestBackdropCloseConfirm(msg);
        if (typeof callback === 'function') {
            p.then(function (ok) {
                callback(ok);
            });
            return;
        }
        return p;
    }

    /**
     * @param {MouseEvent} e
     * @param {HTMLElement|null|undefined} overlayEl
     * @param {() => void} onClose
     * @param {{ isBusy?: () => boolean, messageKey?: string }} [opts]
     */
    function subtrackHandleModalOverlayClick(e, overlayEl, onClose, opts) {
        if (!overlayEl || e.target !== overlayEl) return;
        var busy = opts && opts.isBusy;
        if (typeof busy === 'function' && busy()) return;
        subtrackConfirmBackdropClose(opts && opts.messageKey, function (ok) {
            if (ok) onClose();
        });
    }

    global.subtrackConfirmBackdropClose = subtrackConfirmBackdropClose;
    global.subtrackHandleModalOverlayClick = subtrackHandleModalOverlayClick;
    global.subtrackRequestBackdropCloseConfirm = requestBackdropCloseConfirm;
})(typeof window !== 'undefined' ? window : globalThis);
