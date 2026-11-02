/* =========================================================
   KagoBuild photo framer
   -----------------------------------------------------------
   Opens a dialog where the user frames their profile photo in
   a circle before it is saved:
     - drag (mouse or finger) to move, slider / wheel / pinch
       to zoom, arrow keys to nudge
     - the face is centred automatically when the browser has
       the FaceDetector API (Chrome / Edge with shape detection);
       otherwise it starts on the upper middle of the photo,
       where faces usually are
   Returns a 256 x 256 JPEG data URL (small enough for
   localStorage).

   Usage:
     KBPhotoCrop.open(file, function (dataUrl) { ... });
========================================================= */
(function () {
    "use strict";

    var OUT = 256;          // saved image size (px)
    var RING = 240;         // circle diameter in the dialog (px)
    var PAD = 24;           // dimmed area around the circle (px)
    var STAGE = RING + PAD * 2;
    var MAX_ZOOM = 4;

    var css =
        '.kbpc-back{position:fixed;inset:0;z-index:5000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.55)}' +
        '.kbpc{width:100%;max-width:360px;background:var(--color-card,#fff);color:var(--color-text-primary,#171615);border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,.35);font-family:var(--font-sans,Arial,sans-serif);overflow:hidden}' +
        '.kbpc-head{padding:16px 18px 6px}.kbpc-head h3{margin:0;font-size:16px;font-weight:700}' +
        '.kbpc-head p{margin:4px 0 0;font-size:12px;color:var(--color-text-secondary,#5a5555)}' +
        '.kbpc-stage{position:relative;width:' + STAGE + 'px;height:' + STAGE + 'px;max-width:100%;margin:12px auto 6px;overflow:hidden;border-radius:12px;background:#111;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none}' +
        '.kbpc-stage.dragging{cursor:grabbing}' +
        '.kbpc-stage img{position:absolute;left:0;top:0;max-width:none;transform-origin:0 0;pointer-events:none;-webkit-user-drag:none}' +
        '.kbpc-ring{position:absolute;left:' + PAD + 'px;top:' + PAD + 'px;width:' + RING + 'px;height:' + RING + 'px;border-radius:50%;box-shadow:0 0 0 999px rgba(0,0,0,.55);outline:2px solid rgba(255,255,255,.9);pointer-events:none}' +
        '.kbpc-stage:focus-visible{outline:2px solid var(--color-primary,#F12823);outline-offset:3px}' +
        '.kbpc-status{min-height:16px;margin:0 18px;font-size:11.5px;text-align:center;color:var(--color-text-tertiary,#8a8485)}' +
        '.kbpc-zoom{display:flex;align-items:center;gap:10px;padding:8px 18px 4px;font-size:12px;color:var(--color-text-secondary,#5a5555)}' +
        '.kbpc-zoom input{flex:1;accent-color:var(--color-primary,#F12823)}' +
        '.kbpc-foot{display:flex;gap:8px;justify-content:space-between;align-items:center;padding:12px 18px 16px}' +
        '.kbpc-foot .kbpc-right{display:flex;gap:8px}' +
        '.kbpc-btn{height:36px;padding:0 14px;border-radius:9px;border:1px solid var(--color-border,#e4e1e1);background:var(--color-card,#fff);color:var(--color-text-primary,#171615);font:600 12.5px var(--font-sans,Arial,sans-serif);cursor:pointer}' +
        '.kbpc-btn:hover{background:var(--color-bg,#f4f3f4)}' +
        '.kbpc-btn.primary{background:var(--color-primary,#F12823);border-color:var(--color-primary,#F12823);color:var(--color-on-primary,#fff)}' +
        '.kbpc-btn.primary:hover{filter:brightness(.95)}' +
        '.kbpc-btn.link{border:none;background:none;padding:0 4px;color:var(--color-primary,#F12823)}' +
        '.kbpc-btn:focus-visible{outline:2px solid var(--color-primary,#F12823);outline-offset:2px}';

    function injectCss() {
        if (document.getElementById('kbpc-css')) return;
        var s = document.createElement('style');
        s.id = 'kbpc-css';
        s.textContent = css;
        document.head.appendChild(s);
    }

    function open(file, onDone) {
        if (!file || String(file.type).indexOf('image/') !== 0) return false;
        injectCss();
        var reader = new FileReader();
        reader.onload = function () {
            var img = new Image();
            img.onload = function () { build(img, onDone); };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
        return true;
    }

    function build(img, onDone) {
        var prevFocus = document.activeElement;
        var back = document.createElement('div');
        back.className = 'kbpc-back';
        back.innerHTML =
            '<div class="kbpc" role="dialog" aria-modal="true" aria-labelledby="kbpcTitle">' +
                '<div class="kbpc-head"><h3 id="kbpcTitle">Frame your photo</h3>' +
                    '<p>Drag to move your face into the circle. Use the slider to zoom.</p></div>' +
                '<div class="kbpc-stage" tabindex="0" aria-label="Photo position. Use arrow keys to move, plus and minus to zoom."><div class="kbpc-ring"></div></div>' +
                '<p class="kbpc-status" aria-live="polite"></p>' +
                '<label class="kbpc-zoom"><span>Zoom</span><input type="range" min="1" max="' + MAX_ZOOM + '" step="0.01" value="1" aria-label="Zoom"></label>' +
                '<div class="kbpc-foot">' +
                    '<button type="button" class="kbpc-btn link" data-k="face">Centre on face</button>' +
                    '<span class="kbpc-right"><button type="button" class="kbpc-btn" data-k="cancel">Cancel</button>' +
                    '<button type="button" class="kbpc-btn primary" data-k="save">Save photo</button></span>' +
                '</div>' +
            '</div>';

        var stage = back.querySelector('.kbpc-stage');
        var slider = back.querySelector('input[type=range]');
        var status = back.querySelector('.kbpc-status');
        var faceBtn = back.querySelector('[data-k=face]');
        stage.insertBefore(img, stage.firstChild);
        document.body.appendChild(back);

        var W = img.naturalWidth, H = img.naturalHeight;
        // Pin the image to its real size so page styles (e.g. img{max-width:100%})
        // can't resize it; zoom and position are done with a transform.
        ['width', 'height', 'max-width', 'max-height', 'min-width', 'min-height'].forEach(function (p) {
            img.style.setProperty(p, (p.indexOf('max') === 0 ? 'none' : (p.indexOf('min') === 0 ? '0' : (p === 'width' ? W : H) + 'px')), 'important');
        });
        var base = Math.max(RING / W, RING / H);   // smallest scale that fills the circle
        var zoom = 1, x = 0, y = 0;                 // image top-left, in stage px

        function scale() { return base * zoom; }

        function clamp() {
            var s = scale();
            var minX = PAD + RING - W * s, maxX = PAD;
            var minY = PAD + RING - H * s, maxY = PAD;
            x = Math.min(maxX, Math.max(minX, x));
            y = Math.min(maxY, Math.max(minY, y));
        }

        function paint() {
            clamp();
            img.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + scale() + ')';
            slider.value = zoom;
        }

        /* Put image point (px, py) at the centre of the circle */
        function centreOn(px, py) {
            var s = scale();
            x = PAD + RING / 2 - px * s;
            y = PAD + RING / 2 - py * s;
            paint();
        }

        /* Zoom while keeping the circle centre on the same spot */
        function setZoom(z) {
            z = Math.min(MAX_ZOOM, Math.max(1, z));
            var s = scale();
            var cx = (PAD + RING / 2 - x) / s, cy = (PAD + RING / 2 - y) / s;
            zoom = z;
            centreOn(cx, cy);
        }

        /* Default framing: middle, upper part of the photo */
        centreOn(W / 2, H * (H > W ? 0.35 : 0.42));

        /* ---- Face detection (when the browser supports it) ---- */
        function findFace(manual) {
            if (!('FaceDetector' in window)) {
                if (manual) status.textContent = 'Face finding isn’t available in this browser. Drag to frame your face.';
                return;
            }
            status.textContent = 'Looking for a face…';
            var fd;
            try { fd = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 5 }); }
            catch (e) { status.textContent = 'Drag to frame your face.'; return; }
            fd.detect(img).then(function (faces) {
                if (!faces || !faces.length) { status.textContent = 'No face found. Drag to frame it yourself.'; return; }
                var f = faces.reduce(function (a, b) {
                    return (b.boundingBox.width * b.boundingBox.height) > (a.boundingBox.width * a.boundingBox.height) ? b : a;
                });
                var bb = f.boundingBox;
                // Face takes about half the circle, with a little room for hair and chin
                zoom = Math.min(MAX_ZOOM, Math.max(1, (RING * 0.5) / (bb.width * base)));
                centreOn(bb.x + bb.width / 2, bb.y + bb.height * 0.45);
                status.textContent = faces.length > 1 ? 'Centred on the largest face. Drag to pick another.' : 'Face centred. Drag to adjust.';
            }).catch(function () { status.textContent = 'Drag to frame your face.'; });
        }
        if (!('FaceDetector' in window)) faceBtn.hidden = true;
        findFace(false);

        /* ---- Drag + pinch ---- */
        var pointers = {}, startDist = 0, startZoom = 1, last = null;

        stage.addEventListener('pointerdown', function (e) {
            stage.setPointerCapture(e.pointerId);
            pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
            var ids = Object.keys(pointers);
            if (ids.length === 2) {
                var a = pointers[ids[0]], b = pointers[ids[1]];
                startDist = Math.hypot(a.x - b.x, a.y - b.y);
                startZoom = zoom;
            }
            last = { x: e.clientX, y: e.clientY };
            stage.classList.add('dragging');
        });

        stage.addEventListener('pointermove', function (e) {
            if (!pointers[e.pointerId]) return;
            pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
            var ids = Object.keys(pointers);
            if (ids.length === 2 && startDist) {
                var a = pointers[ids[0]], b = pointers[ids[1]];
                setZoom(startZoom * Math.hypot(a.x - b.x, a.y - b.y) / startDist);
                return;
            }
            // stage may be shrunk on small screens: convert screen px to stage px
            var k = STAGE / stage.getBoundingClientRect().width;
            x += (e.clientX - last.x) * k;
            y += (e.clientY - last.y) * k;
            last = { x: e.clientX, y: e.clientY };
            paint();
        });

        function endPointer(e) {
            delete pointers[e.pointerId];
            if (Object.keys(pointers).length < 2) startDist = 0;
            var rest = Object.keys(pointers);
            if (rest.length) last = pointers[rest[0]];
            else stage.classList.remove('dragging');
        }
        stage.addEventListener('pointerup', endPointer);
        stage.addEventListener('pointercancel', endPointer);

        stage.addEventListener('wheel', function (e) {
            e.preventDefault();
            setZoom(zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08));
        }, { passive: false });

        stage.addEventListener('keydown', function (e) {
            var step = e.shiftKey ? 20 : 6;
            if (e.key === 'ArrowLeft') x += step;
            else if (e.key === 'ArrowRight') x -= step;
            else if (e.key === 'ArrowUp') y += step;
            else if (e.key === 'ArrowDown') y -= step;
            else if (e.key === '+' || e.key === '=') { setZoom(zoom * 1.1); e.preventDefault(); return; }
            else if (e.key === '-') { setZoom(zoom / 1.1); e.preventDefault(); return; }
            else return;
            e.preventDefault();
            paint();
        });

        slider.addEventListener('input', function () { setZoom(parseFloat(slider.value)); });

        /* ---- Close / save ---- */
        function close() {
            document.removeEventListener('keydown', onKey, true);
            back.remove();
            if (prevFocus && prevFocus.focus) prevFocus.focus();
        }

        function save() {
            var s = scale();
            var c = document.createElement('canvas');
            c.width = c.height = OUT;
            var ctx = c.getContext('2d');
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, OUT, OUT);
            ctx.drawImage(img, (PAD - x) / s, (PAD - y) / s, RING / s, RING / s, 0, 0, OUT, OUT);
            var url = c.toDataURL('image/jpeg', 0.88);
            close();
            if (onDone) onDone(url);
        }

        function onKey(e) {
            if (e.key === 'Escape') { e.stopPropagation(); close(); }
            if (e.key === 'Tab') {   // keep focus inside the dialog
                var f = back.querySelectorAll('button:not([hidden]), input, [tabindex="0"]');
                var first = f[0], lastEl = f[f.length - 1];
                if (e.shiftKey && document.activeElement === first) { lastEl.focus(); e.preventDefault(); }
                else if (!e.shiftKey && document.activeElement === lastEl) { first.focus(); e.preventDefault(); }
            }
        }
        document.addEventListener('keydown', onKey, true);

        back.addEventListener('click', function (e) {
            if (e.target === back) close();
            var k = e.target.closest('[data-k]');
            if (!k) return;
            var what = k.getAttribute('data-k');
            if (what === 'cancel') close();
            else if (what === 'save') save();
            else if (what === 'face') findFace(true);
        });

        stage.focus();
    }

    window.KBPhotoCrop = { open: open };
})();
