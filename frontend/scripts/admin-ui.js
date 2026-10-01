/* Shared helpers: KPI cards, CRUD tables, charts, modals and toasts. */
window.AdminUI = (function () {
    var esc = function (v) {
        return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    };

    function el(html) {
        var t = document.createElement('template');
        t.innerHTML = html.trim();
        return t.content.firstElementChild;
    }

    function toast(msg) {
        var box = document.getElementById('toasts');
        if (!box) {
            box = document.createElement('div');
            box.id = 'toasts';
            box.className = 'toasts';
            document.body.appendChild(box);
        }
        var t = el('<div class="toast">' + esc(msg) + '</div>');
        box.appendChild(t);
        setTimeout(function () { t.remove(); }, 3200);
    }

    function openModal(title, bodyHTML, buttons) {
        var m = el('<div class="modal-back"><div class="modal" role="dialog" aria-modal="true">' +
            '<div class="modal-head"><h5>' + esc(title) + '</h5><button class="modal-x" aria-label="Close">×</button></div>' +
            '<div class="modal-body">' + bodyHTML + '</div><div class="modal-foot"></div></div></div>');
        var close = function () { m.remove(); };
        m.querySelector('.modal-x').onclick = close;
        m.addEventListener('mousedown', function (e) { if (e.target === m) close(); });
        var foot = m.querySelector('.modal-foot');
        buttons.forEach(function (b) {
            var x = el('<button class="btn ' + (b.cls || '') + '">' + esc(b.label) + '</button>');
            x.onclick = function () { b.run ? b.run(close, m) : close(); };
            foot.appendChild(x);
        });
        document.body.appendChild(m);
        var f = m.querySelector('input,select,textarea');
        if (f) f.focus();
        return { close: close, root: m };
    }

    function info(title, html) {
        openModal(title, html, [{ label: 'Close', cls: 'primary' }]);
    }

    function form(o) {
        var vals = o.values || {};
        var body = '<div class="form-grid">' + o.fields.map(function (f) {
            var v = vals[f.key] == null ? '' : vals[f.key];
            var inp;
            if (f.type === 'select') {
                inp = '<select class="admin-select" name="' + f.key + '">' + f.options.map(function (op) {
                    return '<option' + (op === v ? ' selected' : '') + '>' + esc(op) + '</option>';
                }).join('') + '</select>';
            } else if (f.type === 'textarea') {
                inp = '<textarea class="admin-input" name="' + f.key + '" rows="4">' + esc(v) + '</textarea>';
            } else {
                inp = '<input class="admin-input" name="' + f.key + '" type="text" value="' + esc(v) + '">';
            }
            return '<label class="field' + (f.type === 'textarea' ? ' full' : '') + '"><span>' + esc(f.label) + '</span>' + inp + '</label>';
        }).join('') + '</div>';

        openModal(o.title, body, [
            { label: 'Cancel' },
            { label: o.saveLabel || 'Save', cls: 'primary', run: function (close, m) {
                var out = {};
                m.querySelectorAll('[name]').forEach(function (i) { out[i.name] = i.value.trim(); });
                if (!out[o.fields[0].key]) { toast(o.fields[0].label + ' is required'); return; }
                o.onSave(out);
                close();
            }}
        ]);
    }

    function kpis(list) {
        return '<section class="admin-kpis">' + list.map(function (k) {
            return '<article class="kpi-card"><div class="kpi-icon ' + (k.color || 'red') + '">' + k.icon + '</div><div>' +
                '<h4>' + esc(k.label) + '</h4><h2>' + esc(k.value) + '</h2>' +
                '<p class="' + (k.up ? 'up' : '') + '">' + esc(k.sub || '') + '</p></div></article>';
        }).join('') + '</section>';
    }

    function download(name, text) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    /* ----- CRUD table card -----
       cfg: title, columns[{key,label,type,options,filter,noForm}], rows, addLabel,
            readOnly, export, note, actions[{label,run,show}], toolbar[{label,run}] */
    function crud(target, cfg) {
        var rows = cfg.rows.map(function (r) { return Object.assign({}, r); });
        var cols = cfg.columns;
        var st = { q: '', f: {} };

        var labels = function (c) {
            if (c.type === 'status') return c.options.map(function (o) { return o[0]; });
            if (c.options) return c.options;
            var seen = [];
            rows.forEach(function (r) { if (seen.indexOf(r[c.key]) < 0) seen.push(r[c.key]); });
            return seen;
        };
        var pillCls = function (c, v) {
            var o = c.options.filter(function (x) { return x[0] === v; })[0];
            return o ? o[1] : 'neutral';
        };

        var filterCols = cols.filter(function (c) { return c.filter; });
        var extras = cfg.toolbar || [];
        var acts = cfg.actions || [];

        var root = el('<section class="admin-card"></section>');
        root.innerHTML =
            '<div class="admin-card-head"><h5>' + esc(cfg.title) + '</h5><span class="muted" data-count></span></div>' +
            (cfg.note ? '<div class="notice">' + esc(cfg.note) + '</div>' : '') +
            '<div class="admin-toolbar">' +
                '<input class="admin-search" type="search" placeholder="Search..." data-q>' +
                filterCols.map(function (c) {
                    return '<select class="admin-select" data-f="' + c.key + '"><option value="">All ' + esc(c.label.toLowerCase()) + '</option>' +
                        labels(c).map(function (l) { return '<option>' + esc(l) + '</option>'; }).join('') + '</select>';
                }).join('') +
                '<span class="spacer"></span>' +
                extras.map(function (x, i) { return '<button class="btn" data-x="' + i + '">' + esc(x.label) + '</button>'; }).join('') +
                (cfg.export ? '<button class="btn" data-export>Export CSV</button>' : '') +
                (cfg.readOnly ? '' : '<button class="btn primary" data-add>+ ' + esc(cfg.addLabel || 'Add') + '</button>') +
            '</div>' +
            '<div class="table-wrap"><table class="admin-table"><thead><tr>' +
                cols.map(function (c) { return '<th' + (c.type === 'num' ? ' class="r"' : '') + '>' + esc(c.label) + '</th>'; }).join('') +
                ((cfg.readOnly && !acts.length) ? '' : '<th></th>') +
            '</tr></thead><tbody></tbody></table></div>';
        target.appendChild(root);

        var tbody = root.querySelector('tbody');
        var hasActions = !(cfg.readOnly && !acts.length);

        function draw() {
            var q = st.q.toLowerCase();
            var list = [];
            rows.forEach(function (r, i) {
                var okF = Object.keys(st.f).every(function (k) { return !st.f[k] || r[k] === st.f[k]; });
                var okQ = !q || cols.some(function (c) { return String(r[c.key]).toLowerCase().indexOf(q) >= 0; });
                if (okF && okQ) list.push(i);
            });
            tbody.innerHTML = list.length ? list.map(function (i) {
                var r = rows[i];
                var tds = cols.map(function (c) {
                    var v = r[c.key];
                    if (c.type === 'status') return '<td><span class="pill ' + pillCls(c, v) + '">' + esc(v) + '</span></td>';
                    return '<td' + (c.type === 'num' ? ' class="r"' : '') + '>' + esc(v) + '</td>';
                }).join('');
                var btns = '';
                acts.forEach(function (a, ai) {
                    if (a.show && !a.show(r)) return;
                    var lab = typeof a.label === 'function' ? a.label(r) : a.label;
                    btns += '<button class="btn sm" data-a="' + ai + '" data-i="' + i + '">' + esc(lab) + '</button>';
                });
                if (!cfg.readOnly) {
                    btns += '<button class="btn sm" data-a="edit" data-i="' + i + '">Edit</button>' +
                            '<button class="btn sm danger" data-a="del" data-i="' + i + '">Delete</button>';
                }
                return '<tr>' + tds + (hasActions ? '<td class="actions">' + btns + '</td>' : '') + '</tr>';
            }).join('') : '<tr><td class="empty" colspan="' + (cols.length + 1) + '">No results found</td></tr>';
            root.querySelector('[data-count]').textContent = list.length + ' of ' + rows.length;
        }

        var fields = cols.filter(function (c) { return !c.noForm; }).map(function (c) {
            var isSel = c.type === 'status' || c.type === 'select';
            return { key: c.key, label: c.label, type: isSel ? 'select' : (c.type === 'textarea' ? 'textarea' : 'text'), options: isSel ? labels(c) : null };
        });

        var api = {
            rows: rows,
            draw: draw,
            toast: toast,
            add: function (r) { rows.unshift(r); draw(); }
        };

        root.querySelector('[data-q]').oninput = function (e) { st.q = e.target.value; draw(); };
        root.querySelectorAll('[data-f]').forEach(function (s) {
            s.onchange = function () { st.f[s.getAttribute('data-f')] = s.value; draw(); };
        });
        root.querySelectorAll('[data-x]').forEach(function (b) {
            b.onclick = function () { extras[+b.getAttribute('data-x')].run(api); };
        });

        var exp = root.querySelector('[data-export]');
        if (exp) exp.onclick = function () {
            var q = function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; };
            var csv = [cols.map(function (c) { return q(c.label); }).join(',')]
                .concat(rows.map(function (r) { return cols.map(function (c) { return q(r[c.key]); }).join(','); })).join('\n');
            download(cfg.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.csv', csv);
            toast('Exported ' + rows.length + ' rows');
        };

        var add = root.querySelector('[data-add]');
        if (add) add.onclick = function () {
            var defaults = {};
            fields.forEach(function (f) { defaults[f.key] = f.options ? f.options[0] : ''; });
            form({ title: cfg.addLabel || 'Add', fields: fields, values: defaults, saveLabel: 'Add', onSave: function (out) {
                rows.unshift(Object.assign({}, defaults, out));
                draw();
                toast('Added');
            }});
        };

        tbody.onclick = function (e) {
            var b = e.target.closest('button[data-a]');
            if (!b) return;
            var i = +b.getAttribute('data-i');
            var a = b.getAttribute('data-a');
            if (a === 'edit') {
                form({ title: 'Edit', fields: fields, values: rows[i], onSave: function (out) {
                    Object.assign(rows[i], out);
                    draw();
                    toast('Saved');
                }});
            } else if (a === 'del') {
                if (confirm('Delete this item? This cannot be undone.')) {
                    rows.splice(i, 1);
                    draw();
                    toast('Deleted');
                }
            } else {
                acts[+a].run(rows[i], api);
                draw();
            }
        };

        draw();
        return api;
    }

    /* ----- Bar chart card with range tabs. series: {Week:{labels,values}, Month:{...}} ----- */
    function chart(target, cfg) {
        var keys = Object.keys(cfg.series);
        var root = el('<section class="admin-card"><div class="admin-card-head"><h5>' + esc(cfg.title) + '</h5>' +
            '<div class="range-tabs">' + keys.map(function (k, i) {
                return '<button class="range-tab' + (i ? '' : ' active') + '" data-k="' + esc(k) + '">' + esc(k) + '</button>';
            }).join('') + '</div></div>' +
            '<div class="bar-chart" data-c></div>' +
            '<div class="chart-foot"><span>Total<strong data-t>0</strong></span><span>Average<strong data-a>0</strong></span><span>Peak<strong data-p>0</strong></span></div></section>');
        target.appendChild(root);

        function render(k) {
            var s = cfg.series[k];
            var max = Math.max.apply(null, s.values);
            var total = s.values.reduce(function (a, b) { return a + b; }, 0);
            root.querySelector('[data-c]').innerHTML = s.values.map(function (v, i) {
                return '<div class="bar-col"><span class="bar-val">' + v + '</span>' +
                    '<div class="bar" style="height:' + Math.round(v / max * 80) + '%"></div>' +
                    '<span class="bar-lbl">' + esc(s.labels[i]) + '</span></div>';
            }).join('');
            root.querySelector('[data-t]').textContent = total.toLocaleString('en-US');
            root.querySelector('[data-a]').textContent = Math.round(total / s.values.length).toLocaleString('en-US');
            root.querySelector('[data-p]').textContent = max.toLocaleString('en-US');
        }

        root.querySelector('.range-tabs').onclick = function (e) {
            var b = e.target.closest('.range-tab');
            if (!b) return;
            root.querySelectorAll('.range-tab').forEach(function (t) { t.classList.remove('active'); });
            b.classList.add('active');
            render(b.getAttribute('data-k'));
        };
        render(keys[0]);
        return root;
    }

    return { esc: esc, el: el, toast: toast, info: info, form: form, kpis: kpis, crud: crud, chart: chart, openModal: openModal };
})();