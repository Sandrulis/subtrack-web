(function (window, document) {
    'use strict';

    var ID_ORDER = ['features', 'demo', 'faq'];

    document.addEventListener('DOMContentLoaded', function () {
        var sections = [];
        var i;

        for (i = 0; i < ID_ORDER.length; i++) {
            var el = document.getElementById(ID_ORDER[i]);
            if (el) {
                sections.push(el);
            }
        }

        var links = document.querySelectorAll('a[data-landing-anchor]');
        if (!sections.length || !links.length) {
            return;
        }

        function setLandingActive(id) {
            for (var j = 0; j < links.length; j++) {
                var link = links[j];
                var key = link.getAttribute('data-landing-anchor');
                if (key === id) {
                    link.classList.add('is-active');
                    link.setAttribute('aria-current', 'page');
                } else {
                    link.classList.remove('is-active');
                    link.removeAttribute('aria-current');
                }
            }
        }

        function topDocument(node) {
            return node.getBoundingClientRect().top + window.scrollY;
        }

        function syncLandingNav() {
            var offset = 96;
            var pos = window.scrollY + offset;
            var picked = sections[0].id;
            var k;

            for (k = 0; k < sections.length; k++) {
                var t = topDocument(sections[k]);
                if (t <= pos) {
                    picked = sections[k].id;
                }
            }

            setLandingActive(picked);
        }

        var ticking = false;

        window.addEventListener(
            'scroll',
            function () {
                if (ticking) {
                    return;
                }
                ticking = true;
                window.requestAnimationFrame(function () {
                    syncLandingNav();
                    ticking = false;
                });
            },
            { passive: true }
        );

        window.addEventListener('hashchange', syncLandingNav);

        syncLandingNav();
    });
})(window, document);
