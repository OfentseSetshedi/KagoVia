/* Builds the sidebar + top bar around <main id="app"> on every admin page.
   - Collapsible sidebar (state saved in localStorage)
   - Profile menu in the top bar (name / photo from Admin settings)
   - Theme toggle */
(function () {
    var NAV = [
        { group: 'Overview', items: [
            ['dashboard.html', 'Dashboard', '▦']
        ]},
        { group: 'Platform', items: [
            ['users.html', 'Users', '👥'],
            ['house-plans.html', 'House plans', '🏠'],
            ['projects.html', 'Projects & estimates', '📁'],
            ['ai.html', 'AI management', '🤖'],
            ['ai-jobs.html', 'AI jobs', '⏳']
        ]},
        { group: 'Catalogue', items: [
            ['materials.html', 'Materials', '🧱'],
            ['suppliers.html', 'Suppliers', '🚚'],
            ['pricing.html', 'Pricing', '💲'],
            ['locations.html', 'Locations & regions', '📍'],
            ['building-rules.html', 'Building rules', '📐']
        ]},
        { group: 'Business', items: [
            ['finance.html', 'Finance', '💳'],
            ['analytics.html', 'Analytics', '📊'],
            ['notifications.html', 'Notifications', '🔔'],
            ['content.html', 'Content', '📝']
        ]},
        { group: 'Security & system', items: [
            ['roles.html', 'Roles & permissions', '🔐'],
            ['audit-logs.html', 'Audit logs', '🧾'],
            ['system.html', 'System settings', '⚙️'],
            ['settings.html', 'My settings', '👤']
        ]}
    ];

    var SIDEBAR_KEY = 'kb-admin-sidebar-collapsed';
    var DEFAULT_NAME = 'Moses';
    var ROLE = 'Super Admin';

    /* ---- storage helpers (never throw) ---- */
    function read(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
    function write(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }

    /* ---- load the shell stylesheet next to the other styles ---- */
    var me = document.currentScript;
    if (me && me.src) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = me.src.replace(/scripts\/admin-shell\.js.*$/, 'styles/admin-shell.css');
        document.head.appendChild(link);
    }

    var savedTheme = read('kb-theme');
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

    var page = location.pathname.split('/').pop() || 'dashboard.html';
    var app = document.getElementById('app');
    var title = document.body.getAttribute('data-title') || document.title;

    var nav = NAV.map(function (g) {
        return '<div class="nav-group"><div class="nav-title">' + g.group + '</div>' +
            g.items.map(function (i) {
                return '<a class="nav-link' + (i[0] === page ? ' active' : '') + '" href="' + i[0] + '" title="' + i[1] + '">' +
                    '<span class="nav-ico">' + i[2] + '</span><span class="nav-label">' + i[1] + '</span></a>';
            }).join('') + '</div>';
    }).join('');

    var shell = document.createElement('div');
    shell.className = 'shell';
    shell.innerHTML =
        '<aside class="sidebar" id="adminSidebar" aria-label="Admin navigation">' +
            '<div class="brand"><span class="brand-mark">K</span><span class="brand-text">KagoBuild <span class="admin-tag">Admin</span></span></div>' +
            nav +
            '<div class="sidebar-foot">' +
                '<a class="nav-link" href="../dashboard.html" title="Back to app"><span class="nav-ico">←</span><span class="nav-label">Back to app</span></a>' +
                '<a class="nav-link" href="../index.html" title="Sign out"><span class="nav-ico">⎋</span><span class="nav-label">Sign out</span></a>' +
            '</div>' +
        '</aside>' +
        '<div class="main-col">' +
            '<header class="topbar">' +
                '<button class="icon-btn menu-btn" id="menuBtn" aria-label="Open menu">☰</button>' +
                '<button class="icon-btn collapse-btn" id="collapseBtn" aria-label="Collapse sidebar" aria-expanded="true" title="Collapse / expand sidebar">«</button>' +
                '<h1>' + title + '</h1><span class="grow"></span>' +
                '<button class="icon-btn" id="themeBtn" aria-label="Toggle theme">☾</button>' +
                '<div class="profile-menu">' +
                    '<button type="button" class="profile-section" id="profileBtn" aria-haspopup="true" aria-expanded="false" aria-controls="profileDropdown">' +
                        '<span class="profile-avatar"><span class="profile-initials" id="hdrInitials"></span><img id="hdrAvatar" alt=""></span>' +
                        '<span class="user-details"><span class="user-name" id="hdrName"></span><span class="user-role">' + ROLE + '</span></span>' +
                        '<span class="dropdown-arrow" aria-hidden="true">▾</span>' +
                    '</button>' +
                    '<div class="dropdown" id="profileDropdown">' +
                        '<a href="settings.html#profile">👤 My profile</a>' +
                        '<a href="settings.html">⚙️ Admin settings</a>' +
                        '<a href="../dashboard.html">← Back to app</a>' +
                        '<a href="../index.html" class="dropdown-logout">⎋ Log out</a>' +
                    '</div>' +
                '</div>' +
            '</header>' +
            '<div class="content"></div>' +
        '</div>' +
        '<div class="backdrop" id="backdrop"></div>';

    shell.querySelector('.content').appendChild(app);
    document.body.appendChild(shell);

    /* ---------- Sidebar collapse / expand ---------- */
    var collapseBtn = document.getElementById('collapseBtn');

    function setCollapsed(collapsed, persist) {
        shell.classList.toggle('collapsed', collapsed);
        collapseBtn.textContent = collapsed ? '»' : '«';
        collapseBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        collapseBtn.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
        if (persist) write(SIDEBAR_KEY, collapsed ? '1' : '0');
    }

    setCollapsed(read(SIDEBAR_KEY) === '1', false);

    collapseBtn.onclick = function () {
        setCollapsed(!shell.classList.contains('collapsed'), true);
    };

    /* Mobile slide-out menu */
    document.getElementById('menuBtn').onclick = function () { document.body.classList.add('nav-open'); };
    document.getElementById('backdrop').onclick = function () { document.body.classList.remove('nav-open'); };

    /* ---------- Theme ---------- */
    document.getElementById('themeBtn').onclick = function () {
        var root = document.documentElement;
        var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        write('kb-theme', next);
    };

    /* ---------- Profile menu ---------- */
    var profileBtn = document.getElementById('profileBtn');
    var profileMenu = document.getElementById('profileDropdown');

    function closeProfile() {
        profileMenu.classList.remove('open');
        profileBtn.setAttribute('aria-expanded', 'false');
    }

    profileBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = !profileMenu.classList.contains('open');
        profileMenu.classList.toggle('open', open);
        profileBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.profile-menu')) closeProfile();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeProfile();
    });

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

    window.AdminShell = {
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
})();