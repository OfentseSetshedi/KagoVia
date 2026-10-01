/* =========================================================
   KagoBuild dashboard shell
   -----------------------------------------------------------
   Shared by every dashboard page. Handles:
     1. Sidebar resize + collapse (state saved in localStorage)
     2. Notification dropdown in the header
     3. Profile menu in the header
     4. Showing the saved profile name/photo from Settings

   Include it right after the sidebar resizer so the saved
   sidebar width is applied before the page paints:

     <div class="sidebar-resizer" id="sidebarResizer"></div>
     <script src="../scripts/main.js"></script>
========================================================= */

(function () {
    "use strict";

    /* ---------------------------------------------------------
       1. Sidebar resize + collapse
    --------------------------------------------------------- */
    const SIDEBAR = {
        minWidth: 70,
        maxWidth: 240,
        defaultWidth: 200,
        collapsedWidth: 72,
        collapseBelow: 110,
        widthKey: "kb-sidebar-width",
        collapsedKey: "kb-sidebar-collapsed"
    };

    const sidebar = document.querySelector(".dashboard-navbar");
    const resizer = document.getElementById("sidebarResizer");

    function readStorage(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }

    function writeStorage(key, value) {
        try { localStorage.setItem(key, value); } catch (e) { /* storage blocked: ignore */ }
    }

    function applySidebarWidth(width, persist) {
        if (!sidebar) return;
        const collapsed = width < SIDEBAR.collapseBelow;
        const finalWidth = collapsed ? SIDEBAR.collapsedWidth : width;

        sidebar.style.width = finalWidth + "px";
        sidebar.classList.toggle("collapsed", collapsed);

        if (persist) {
            writeStorage(SIDEBAR.widthKey, String(finalWidth));
            writeStorage(SIDEBAR.collapsedKey, collapsed ? "1" : "0");
        }
    }

    if (sidebar) {
        const savedCollapsed = readStorage(SIDEBAR.collapsedKey) === "1";
        const savedWidth = parseInt(readStorage(SIDEBAR.widthKey), 10);

        if (savedCollapsed) applySidebarWidth(SIDEBAR.collapsedWidth, false);
        else if (!isNaN(savedWidth)) applySidebarWidth(Math.min(SIDEBAR.maxWidth, Math.max(SIDEBAR.minWidth, savedWidth)), false);
        else applySidebarWidth(SIDEBAR.defaultWidth, false);
    }

    if (sidebar && resizer) {
        let dragging = false;

        resizer.addEventListener("mousedown", (e) => {
            e.preventDefault();
            dragging = true;
            document.body.classList.add("is-resizing");
        });

        document.addEventListener("mousemove", (e) => {
            if (!dragging) return;
            const width = Math.min(SIDEBAR.maxWidth, Math.max(SIDEBAR.minWidth, e.clientX));
            applySidebarWidth(width, false);
        });

        document.addEventListener("mouseup", () => {
            if (!dragging) return;
            dragging = false;
            document.body.classList.remove("is-resizing");
            applySidebarWidth(parseInt(sidebar.style.width, 10), true);
        });

        // Double-click the resizer to toggle collapsed / expanded.
        resizer.addEventListener("dblclick", () => {
            const isCollapsed = sidebar.classList.contains("collapsed");
            applySidebarWidth(isCollapsed ? SIDEBAR.defaultWidth : SIDEBAR.collapsedWidth, true);
        });
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
