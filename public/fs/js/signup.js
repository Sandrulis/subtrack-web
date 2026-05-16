(function (document) {
    'use strict';

    var VISIBLE_CLASSES = 'fa-solid fa-eye-slash';
    var HIDDEN_CLASSES = 'fa-regular fa-eye';

    function togglePassword(btn) {
        var id = btn.getAttribute('data-password-for');
        var input = id ? document.getElementById(id) : null;
        if (!input) {
            return;
        }

        var showPlain = input.type === 'password';
        input.type = showPlain ? 'text' : 'password';

        btn.setAttribute('aria-pressed', showPlain ? 'true' : 'false');
        btn.setAttribute(
            'aria-label',
            showPlain ? 'Slēpt paroli' : 'Rādīt paroli'
        );

        var icon = btn.querySelector('i');
        if (icon) {
            icon.className = showPlain ? VISIBLE_CLASSES : HIDDEN_CLASSES;
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        var buttons = document.querySelectorAll('.js-password-toggle');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener('click', function () {
                togglePassword(this);
            });
        }
    });
})(document);
