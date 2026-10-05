/* =========================================================
   Mobile menu for the dashboard pages
   -----------------------------------------------------------
   Adds a hamburger button to the header and a backdrop, and
   opens / closes the sidebar drawer styled in mobile.css.

   main.js loads this file automatically, so pages do not need
   their own <script> tag for it.
========================================================= */

(function () {
    "use strict";

    var sidebar = document.querySelector(".dashboard-navbar");
    var header = document.querySelector(".dashboard-header");
    if (!sidebar || !header) return;

    /* Run only once, even if the page also includes this file */
    if (window.__kbMobileReady) return;
    window.__kbMobileReady = true;

    var BREAKPOINT = 900;

    /* ---- Hamburger button, placed first in the header ---- */
    var host = header.querySelector(".header-left") || header;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mobile-menu-btn";
    btn.id = "mobileMenuBtn";
    btn.setAttribute("aria-label", "Open menu");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M4 6h16M4 12h16M4 18h16"/></svg>';
    host.insertBefore(btn, host.firstChild);

    /* ---- Backdrop ---- */
    var backdrop = document.createElement("div");
    backdrop.className = "mobile-backdrop";
    backdrop.setAttribute("aria-hidden", "true");
    document.body.appendChild(backdrop);

    function setOpen(open) {
        document.body.classList.toggle("nav-open", open);
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }

    btn.addEventListener("click", function (e) {
        e.stopPropagation();
        setOpen(!document.body.classList.contains("nav-open"));
    });

    backdrop.addEventListener("click", function () { setOpen(false); });

    /* Close after choosing a page */
    sidebar.addEventListener("click", function (e) {
        if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") setOpen(false);
    });

    /* Rotating the phone or widening the window back to desktop */
    window.addEventListener("resize", function () {
        if (window.innerWidth > BREAKPOINT) setOpen(false);
    });
})();