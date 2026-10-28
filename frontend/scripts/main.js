 /* =========================================================
   KagoBuild dashboard shell  (kb-main v5)
   -----------------------------------------------------------
   Shared by every dashboard page. Handles:
     1. Sidebar resize + collapse (mouse AND touch). The width
        now follows the screen size: icons-only on phones and
        small tablets, and on tight laptop widths unless the
        user chose otherwise. Rotating / resizing re-applies it.
     2. Notification dropdown in the header
     3. Profile menu in the header
     4. Showing the saved profile name/photo from Settings
     5. Loading the mobile layer (mobile.css + mobile.js)

   Include it right after the sidebar resizer so the saved
   sidebar width is applied before the page paints:

     <div class="sidebar-resizer" id="sidebarResizer"></div>
     <script src="../scripts/main.js"></script>
========================================================= */

(function () {
    "use strict";

    document.documentElement.dataset.kbMain = "v5";
    if (window.console) console.log("kb-main v5 loaded");

    /* ---------------------------------------------------------
       1. Sidebar resize + collapse
    --------------------------------------------------------- */
    const SIDEBAR = {
        minWidth: 70,
        maxWidth: 240,
        defaultWidth: 200,
        collapseBelow: 110,
        widthKey: "kb-sidebar-width",
        collapsedKey: "kb-sidebar-collapsed"
    };

    const sidebar = document.querySelector(".dashboard-navbar");
    const resizer = document.getElementById("sidebarResizer");

    /* True on phones and tablets, even when the browser is in
       "Desktop site" mode (which makes innerWidth look huge). */
    const isTouchDevice =
        (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ||
        "ontouchstart" in window ||
        (navigator.maxTouchPoints || 0) > 0 ||
        Math.min(window.screen.width, window.screen.height) <= 820;

    /* Width of the icons-only rail, by screen size (mirrors mobile.css) */
    function collapsedWidth() {
        const w = window.innerWidth;
        if (w <= 480) return 52;
        if (w <= 900) return 60;
        return 72;
    }

    /* Which size class we are in, so resize only re-applies on a change */
    function layoutKey() {
        const w = window.innerWidth;
        if (w <= 480) return "xs";
        if (w <= 900) return "sm";
        if (w <= 1100) return "md";
        return "lg";
    }

    /* Touch-friendly handle: wider, visible grip, no page scroll
       while dragging, no width animation lagging behind the finger. */
    (function injectResizerStyles() {
        const css =
            ".sidebar-resizer{position:relative;touch-action:none;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}" +
            ".sidebar-resizer::before{content:'';position:absolute;top:0;bottom:0;left:-14px;right:-14px}" +
            ".sidebar-resizer::after{content:'';position:absolute;top:50%;left:50%;width:2px;height:36px;margin:-18px 0 0 -1px;border-radius:2px;background:var(--color-text-muted,#A9A3A4)}" +
            "body.is-resizing .sidebar-resizer::after{background:#fff}" +
            ".touch-device .sidebar-resizer{width:16px}" +
            "body.is-resizing .dashboard-navbar{transition:none}" +
            "body.is-resizing{touch-action:none;user-select:none;-webkit-user-select:none}";
        const style = document.createElement("style");
        style.textContent = css;
        document.head.appendChild(style);
        if (isTouchDevice) document.documentElement.classList.add("touch-device");
    })();

    function readStorage(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }

    function writeStorage(key, value) {
        try { localStorage.setItem(key, value); } catch (e) { /* storage blocked: ignore */ }
    }

    function applySidebarWidth(width, persist) {
        if (!sidebar) return;
        const collapsed = width < SIDEBAR.collapseBelow;
        const finalWidth = collapsed ? collapsedWidth() : width;

        // !important so no stylesheet rule can override the width
        sidebar.style.setProperty("width", finalWidth + "px", "important");
        sidebar.style.setProperty("min-width", finalWidth + "px", "important");
        sidebar.style.setProperty("max-width", finalWidth + "px", "important");
        sidebar.classList.toggle("collapsed", collapsed);

        if (persist) {
            writeStorage(SIDEBAR.widthKey, String(finalWidth));
            writeStorage(SIDEBAR.collapsedKey, collapsed ? "1" : "0");
        }
    }

    /* What width the sidebar should have right now */
    function initialWidth() {
        const w = window.innerWidth;

        // Tablet portrait and phones: always the icon rail
        if (w <= 900) return collapsedWidth();

        // Touch tablets in landscape on a tight screen: icon rail too
        if (isTouchDevice && w <= 1100) return collapsedWidth();

        const savedCollapsed = readStorage(SIDEBAR.collapsedKey);
        const savedWidth = parseInt(readStorage(SIDEBAR.widthKey), 10);

        if (savedCollapsed === "1") return collapsedWidth();
        if (!isNaN(savedWidth)) return Math.min(SIDEBAR.maxWidth, Math.max(SIDEBAR.minWidth, savedWidth));

        // No saved choice: tight screens start icons-only
        if (w <= 1100) return collapsedWidth();
        return SIDEBAR.defaultWidth;
    }

    if (sidebar) {
        applySidebarWidth(initialWidth(), false);

        // Rotating the device / resizing the window across a breakpoint
        let lastKey = layoutKey();
        window.addEventListener("resize", () => {
            const key = layoutKey();
            if (key === lastKey) return;
            lastKey = key;
            applySidebarWidth(initialWidth(), false);
        });
    }

    if (sidebar && resizer) {
        let dragging = false;
        let activePointer = null;
        let startX = 0;
        let moved = false;

        function toggleCollapsed() {
            const isCollapsed = sidebar.classList.contains("collapsed");
            applySidebarWidth(isCollapsed ? SIDEBAR.defaultWidth : collapsedWidth(), !isTouchDevice);
        }

        resizer.addEventListener("pointerdown", (e) => {
            if (e.pointerType === "mouse" && e.button !== 0) return;
            e.preventDefault();
            dragging = true;
            moved = false;
            startX = e.clientX;
            activePointer = e.pointerId;
            try { resizer.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
            document.body.classList.add("is-resizing");
        });

        resizer.addEventListener("pointermove", (e) => {
            if (!dragging || e.pointerId !== activePointer) return;
            e.preventDefault();
            if (Math.abs(e.clientX - startX) > 6) moved = true;
            if (!moved) return;
            const width = Math.min(SIDEBAR.maxWidth, Math.max(SIDEBAR.minWidth, e.clientX));
            applySidebarWidth(width, false);
        });

        function endDrag(e) {
            if (!dragging || (e && e.pointerId !== activePointer)) return;
            dragging = false;
            activePointer = null;
            try { if (e) resizer.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
            document.body.classList.remove("is-resizing");

            if (moved) {
                // Dragged: keep the new width (saved on desktop only)
                applySidebarWidth(parseInt(sidebar.style.width, 10), !isTouchDevice);
            } else if (e && e.pointerType !== "mouse" && e.type === "pointerup") {
                // Plain tap on touch screens: toggle icons-only / full width
                toggleCollapsed();
            }
        }

        resizer.addEventListener("pointerup", endDrag);
        resizer.addEventListener("pointercancel", endDrag);

        // Double-click with a mouse toggles collapsed / expanded.
        resizer.addEventListener("dblclick", toggleCollapsed);
    }

    /* ---------------------------------------------------------
       2-4. Header: notifications, profile menu, saved profile
       (runs once the rest of the page has been parsed)
    --------------------------------------------------------- */
    function initHeader() {
        const bellBtn = document.getElementById("bellBtn");
        const notifMenu = document.getElementById("notifDropdown");
        const profileBtn = document.getElementById("profileBtn");
        const profileMenu = document.getElementById("profileDropdown");

        const menus = [
            [bellBtn, notifMenu],
            [profileBtn, profileMenu]
        ].filter(([btn, menu]) => btn && menu);

        function closeAll(except) {
            menus.forEach(([btn, menu]) => {
                if (menu === except) return;
                menu.classList.remove("open");
                btn.setAttribute("aria-expanded", "false");
            });
        }

        menus.forEach(([btn, menu]) => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const willOpen = !menu.classList.contains("open");
                closeAll(menu);
                menu.classList.toggle("open", willOpen);
                btn.setAttribute("aria-expanded", willOpen ? "true" : "false");
            });
        });

        document.addEventListener("click", (e) => {
            if (!e.target.closest(".notif-menu, .profile-menu")) closeAll();
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeAll();
        });

        // Mark all as read
        const markAllRead = document.getElementById("markAllRead");
        const bellCount = document.getElementById("bellCount");
        if (markAllRead) {
            markAllRead.addEventListener("click", () => {
                document.querySelectorAll("#notifDropdown .notif-dd-item").forEach((item) => item.classList.add("read"));
                if (bellCount) {
                    bellCount.textContent = "0";
                    bellCount.hidden = true;
                }
            });
        }

        // Saved profile from the Settings page (localStorage "kb-settings")
        let saved = {};
        try { saved = JSON.parse(readStorage("kb-settings") || "{}") || {}; } catch (e) { saved = {}; }

        const nameEl = document.getElementById("hdrName");
        const initialsEl = document.getElementById("hdrInitials");
        const avatarImg = document.getElementById("hdrAvatar");

        if (saved["profile.name"] && nameEl) nameEl.textContent = saved["profile.name"];
        if (initialsEl && nameEl) {
            const parts = nameEl.textContent.trim().split(/\s+/);
            initialsEl.textContent = (((parts[0] || "")[0] || "") + ((parts[1] || "")[0] || "")).toUpperCase();
        }
        if (saved["profile.photo"] && avatarImg) avatarImg.src = saved["profile.photo"];
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initHeader);
    else initHeader();
})();

/* ---------------------------------------------------------
   5. Mobile layer
   Loads styles/mobile.css and scripts/mobile.js next to this
   file, so no page needs extra <link> or <script> tags.
   The stylesheet is added to the end of <head>, so it comes
   after dash.css and the page's own stylesheet.
--------------------------------------------------------- */
(function () {
    "use strict";

    var me = document.currentScript;
    if (!me || !me.src) return;

    // CSS: skip if the page already links it
    if (!document.querySelector('link[href*="mobile.css"]')) {
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = me.src.replace(/scripts\/main\.js.*$/, "styles/mobile.css");
        document.head.appendChild(link);
    }

    // JS: needs the sidebar and header to exist, so wait for the page
    function loadMobileScript() {
        var s = document.createElement("script");
        s.src = me.src.replace(/main\.js.*$/, "mobile.js");
        document.body.appendChild(s);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadMobileScript);
    else loadMobileScript();
})();