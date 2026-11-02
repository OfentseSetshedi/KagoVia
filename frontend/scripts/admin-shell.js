/* =========================================================
   KagoBuild admin shell
   -----------------------------------------------------------
   Wraps <main id="app"> on every admin page in the SAME shell
   the user dashboard uses (dash.css + main.js):

     section.dashboard
       aside.dashboard-navbar      sidebar (logo, nav, footer)
       div.sidebar-resizer         drag / double-click to collapse
       main.dashboard-overview
         header.dashboard-header   title, search, alerts, profile
         div.main-card             page content (#app)

   main.js is loaded after the shell is built, so resizing,
   collapsing, the header menus and the mobile drawer behave
   exactly like the user pages.

   Page options (on <body>):
     data-title="Users"                 header title
     data-subtitle="Short description"  optional line under it
     data-search="Search users..."      optional search placeholder
========================================================= */
(function () {
    "use strict";

    var ROLE = 'Super Admin';
    var DEFAULT_NAME = 'Moses';

    /* ---- Icons (same 24px line set as the user sidebar) ---- */
    var P = {
        dashboard: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
        users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>',
        house: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
        projects: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/><path d="M8 10v4"/><path d="M12 10v2"/><path d="M16 10v6"/>',
        ai: '<path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/>',
        jobs: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/>',
        materials: '<path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z"/><path d="m7 16.5-4.74-2.85"/><path d="m7 16.5 5-3"/><path d="M7 16.5v5.17"/><path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z"/><path d="m17 16.5-5-3"/><path d="m17 16.5 4.74-2.85"/><path d="M17 16.5v5.17"/><path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z"/><path d="M12 8 7.26 5.15"/><path d="m12 8 4.74-2.85"/><path d="M12 13.5V8"/>',
        suppliers: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
        pricing: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
        locations: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
        rules: '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/>',
        finance: '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
        analytics: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
        bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
        content: '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
        roles: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
        audit: '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
        settings: '<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/>',
        account: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        back: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
        eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
        logout: '<path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>',
        search: '<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>',
        chevron: '<path d="m6 9 6 6 6-6"/>'
    };

    function icon(name, size, cls) {
        size = size || 18;
        return '<svg class="' + (cls || 'ico') + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[name] + '</svg>';
    }

    /* ---- Navigation ---- */
    var NAV = [
        { group: 'Overview', items: [
            ['dashboard.html', 'Dashboard', 'dashboard']
        ]},
        { group: 'Platform', items: [
            ['users.html', 'Users', 'users'],
            ['house-plans.html', 'House plans', 'house'],
            ['projects.html', 'Projects & estimates', 'projects'],
            ['ai.html', 'AI management', 'ai'],
            ['ai-jobs.html', 'AI jobs', 'jobs']
        ]},
        { group: 'Catalogue', items: [
            ['materials.html', 'Materials', 'materials'],
            ['suppliers.html', 'Suppliers', 'suppliers'],
            ['pricing.html', 'Pricing', 'pricing'],
            ['locations.html', 'Locations & regions', 'locations'],
            ['building-rules.html', 'Building rules', 'rules']
        ]},
        { group: 'Business', items: [
            ['finance.html', 'Finance', 'finance'],
            ['analytics.html', 'Analytics', 'analytics'],
            ['notifications.html', 'Notifications', 'bell'],
            ['content.html', 'Content', 'content']
        ]},
        { group: 'Security & system', items: [
            ['roles.html', 'Roles & permissions', 'roles'],
            ['audit-logs.html', 'Audit logs', 'audit'],
            ['system.html', 'System settings', 'settings'],
            ['settings.html', 'My settings', 'account']
        ]}
    ];

    /* Header alerts. Replace with data from the backend. */
    var ALERTS = [
        ['suppliers.html', 'Cashbuild price sync failed', '3 retries exhausted, 12m ago'],
        ['ai-jobs.html', 'AI queue above 40 jobs', 'Average wait 2m 10s, 25m ago'],
        ['users.html', '2 accounts flagged for review', 'Unusual plan generation volume, 1h ago']
    ];

    /* ---- storage helpers (never throw) ---- */
    function read(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
    function write(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }
    function esc(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    var savedTheme = read('kb-theme');
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

    var me = document.currentScript;
    var page = location.pathname.split('/').pop() || 'dashboard.html';
    var app = document.getElementById('app');
    var body = document.body;
    var title = body.getAttribute('data-title') || document.title.split('|')[0].trim();
    var subtitle = body.getAttribute('data-subtitle');
    var searchHint = body.getAttribute('data-search') || 'Search users, projects, suppliers...';

    /* ---- Sidebar ---- */
    var nav = NAV.map(function (g) {
        return '<div class="nav-section" role="presentation"><span>' + g.group + '</span></div>' +
            g.items.map(function (i) {
                var active = i[0] === page;
                return '<a href="' + i[0] + '" class="nav-link' + (active ? ' active' : '') + '" title="' + esc(i[1]) + '"' +
                    (active ? ' aria-current="page"' : '') + '>' +
                    icon(i[2]) + '<span class="nav-label">' + esc(i[1]) + '</span></a>';
            }).join('');
    }).join('');

    var sidebarHtml =
        '<aside class="dashboard-navbar" aria-label="Admin navigation">' +
            '<div class="upper-sidebar">' +
                '<a href="dashboard.html" id="logo" aria-label="KagoBuild admin dashboard">' +
                    '<span class="logo-mark"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 20V10l4-3 4 3v10M12 20V6l4-3 4 3v14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
                    '<span class="logo-text">KagoBuild <em class="admin-tag">Admin</em></span>' +
                '</a>' +
                '<nav class="nav-list">' + nav + '</nav>' +
            '</div>' +
            '<div class="lower-sidebar">' +
                '<a href="../dashboard.html" class="nav-link nav-link--soft" data-viewas title="See the app the way users see it">' + icon('eye') + '<span class="nav-label">View as user</span></a>' +
                '<a href="../index.html" class="nav-link nav-link--soft" title="Log out">' + icon('logout') + '<span class="nav-label">Log out</span></a>' +
            '</div>' +
        '</aside>';

    /* ---- Header (same structure as the user dashboard) ---- */
    var alertsHtml = ALERTS.map(function (a) {
        return '<a class="notif-dd-item" href="' + a[0] + '"><span class="notif-dd-dot" aria-hidden="true"></span>' +
            '<span class="notif-dd-text"><strong>' + esc(a[1]) + '</strong><small>' + esc(a[2]) + '</small></span></a>';
    }).join('');

    var headerHtml =
        '<header class="dashboard-header">' +
            '<div class="header-left"><div class="header-titles">' +
                '<h2>' + esc(title) + '</h2>' +
                (subtitle ? '<p class="header-subtitle">' + esc(subtitle) + '</p>' : '') +
            '</div></div>' +
            '<div class="header-right">' +
                '<div class="search-container"><span class="search-icon">' + icon('search', 16) + '</span>' +
                    '<input aria-label="' + esc(searchHint) + '" type="search" placeholder="' + esc(searchHint) + '"></div>' +
                '<div class="notif-menu">' +
                    '<button type="button" class="notification-btn" id="bellBtn" aria-label="Alerts" aria-haspopup="true" aria-expanded="false" aria-controls="notifDropdown">' +
                        icon('bell') + '<span class="notification-count" id="bellCount">' + ALERTS.length + '</span>' +
                    '</button>' +
                    '<div class="notif-dropdown" id="notifDropdown">' +
                        '<div class="notif-dropdown-header"><span>Alerts</span><button type="button" class="link-btn" id="markAllRead">Mark all as read</button></div>' +
                        alertsHtml +
                        '<a class="notif-dropdown-footer" href="audit-logs.html">View all activity</a>' +
                    '</div>' +
                '</div>' +
                '<span class="header-divider" aria-hidden="true"></span>' +
                '<div class="profile-menu">' +
                    '<button type="button" class="profile-section" id="profileBtn" aria-haspopup="true" aria-expanded="false" aria-controls="profileDropdown">' +
                        '<span class="profile-avatar"><span class="profile-initials" id="hdrInitials"></span><img id="hdrAvatar" alt=""></span>' +
                        '<span class="user-details"><span class="user-name" id="hdrName"></span><span class="user-role">' + ROLE + '</span></span>' +
                        icon('chevron', 14, 'ico dropdown-arrow') +
                    '</button>' +
                    '<div class="dropdown" id="profileDropdown">' +
                        '<a href="settings.html#profile">' + icon('account', 16) + 'My profile</a>' +
                        '<a href="settings.html">' + icon('settings', 16) + 'Admin settings</a>' +
                        '<a href="../dashboard.html" data-viewas>' + icon('eye', 16) + 'View as user</a>' +
                        '<a href="../index.html" class="dropdown-logout">' + icon('logout', 16) + 'Log out</a>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</header>';

    var shell = document.createElement('section');
    shell.className = 'dashboard';
    shell.innerHTML =
        sidebarHtml +
        '<div class="sidebar-resizer" id="sidebarResizer" title="Drag to resize, double-click to collapse"></div>' +
        '<main class="dashboard-overview">' + headerHtml + '<div class="main-card"></div></main>';

    /* #app becomes the content area. It is a <main> on most pages;
       turn it into a <div> so there is only one <main> landmark. */
    var content = document.createElement('div');
    if (app) {
        Array.prototype.forEach.call(app.attributes, function (a) { content.setAttribute(a.name, a.value); });
        while (app.firstChild) content.appendChild(app.firstChild);
        app.parentNode.removeChild(app);
    }
    content.id = 'app';
    if (!content.classList.contains('admin-page')) content.classList.add('admin-page');
    shell.querySelector('.main-card').appendChild(content);
    body.insertBefore(shell, body.firstChild);

    /* ---- Profile name / photo from Admin settings ---- */
    function getSettings() {
        try { return JSON.parse(read('kb-settings') || '{}') || {}; } catch (e) { return {}; }
    }

    function refreshProfile() {
        var saved = getSettings();
        var name = saved['profile.name'] || DEFAULT_NAME;
        var parts = name.trim().split(/\s+/);
        document.getElementById('hdrName').textContent = name;
        document.getElementById('hdrInitials').textContent =
            (((parts[0] || '')[0] || '') + ((parts[1] || '')[0] || '')).toUpperCase();
        var img = document.getElementById('hdrAvatar');
        if (saved['profile.photo']) img.src = saved['profile.photo'];
        else img.removeAttribute('src');
    }

    refreshProfile();

    /* ---- View as user ----------------------------------------
       Opens the user app in "preview" mode: a banner says whose
       view this is, the header shows that user, and "Exit preview"
       returns here. No user account is needed for the admin.
       The context travels in the URL hash (works on file:// too)
       and is kept in sessionStorage, so it ends with the tab.
       With a backend, also send the chosen user id so the user
       pages load that user's projects (read-only). */
    function viewAs(user) {
        var ctx = user ? {
            name: user.name || 'User',
            role: user.role || 'User',
            email: user.email || '',
            plan: user.plan || ''
        } : { name: 'Sample user', role: 'Free plan', generic: true };
        ctx.returnTo = location.href.split('#')[0];
        try { sessionStorage.setItem('kb-view-as', JSON.stringify(ctx)); } catch (e) {}
        location.href = '../dashboard.html#viewas=' + encodeURIComponent(JSON.stringify(ctx));
    }

    shell.addEventListener('click', function (e) {
        var link = e.target.closest('[data-viewas]');
        if (!link) return;
        e.preventDefault();
        viewAs(null);
    });

    window.AdminShell = {
        viewAs: viewAs,
        refreshProfile: refreshProfile,
        getSettings: getSettings,
        saveSettings: function (patch) {
            var s = getSettings();
            Object.keys(patch).forEach(function (k) {
                if (patch[k] === null) delete s[k]; else s[k] = patch[k];
            });
            write('kb-settings', JSON.stringify(s));
            refreshProfile();
        },
        role: ROLE
    };

    /* ---- Shared behaviour: sidebar resize/collapse, header menus,
           mobile drawer. Same script the user pages use. ---- */
    if (me && me.src && !window.__kbMainLoaded) {
        window.__kbMainLoaded = true;
        var s = document.createElement('script');
        s.src = me.src.replace(/admin-shell\.js.*$/, 'main.js');
        document.body.appendChild(s);
    }
})();
