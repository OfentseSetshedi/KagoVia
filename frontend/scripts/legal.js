/* KagoBuild legal & accessibility layer (v2) - replaces the old legal.js whole.
   Cookie consent (equal-weight buttons, nothing pre-ticked), footer links + business
   details, newsletter and sign-up consent, skip link, focus styles, contrast fixes. */
(function () {
  "use strict";
  if (window.__kbLegal) return;
  if (/\/admin\//.test(location.pathname)) return;
  if (/(terms|privacy|disclaimer|cookies|refund|data-deletion)\.html$/.test(location.pathname)) return;
  window.__kbLegal = true;

  /* ===== EDIT THESE ===== */
  var BIZ = {
    name: "[COMPANY LEGAL NAME]", reg: "[Registration no.]", vat: "[VAT no. if registered]",
    address: "[Street, City, Postcode, South Africa]", email: "support@kagobuild.com", phone: "[Phone]"
  };
  /* ====================== */

  var KEY = "kb-consent";
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function el(t, c, h) { var n = document.createElement(t); if (c) n.className = c; if (h) n.innerHTML = h; return n; }
  function saved() { try { return JSON.parse(get(KEY)); } catch (e) { return null; } }

  /* Other scripts can ask: kbConsent.allowed("functional") */
  window.kbConsent = { allowed: function (c) { var s = saved(); return !!(s && s[c]); }, open: function () { banner(true); } };

  var css =
    ".kbl-banner{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:3500;width:min(600px,calc(100% - 24px));box-sizing:border-box;padding:16px;background:#171615;color:#fff;border-radius:12px;font:13px/1.5 Arial,sans-serif;box-shadow:0 12px 30px rgba(0,0,0,.35)}" +
    ".kbl-banner h2{margin:0 0 6px;font:700 15px Arial,sans-serif}.kbl-banner p{margin:0 0 12px}.kbl-banner a{color:#F6C8C6}" +
    ".kbl-btns{display:flex;gap:8px;flex-wrap:wrap}" +
    ".kbl-btns button{flex:1 1 130px;border:2px solid #fff;border-radius:8px;background:#fff;color:#171615;font:700 13px Arial,sans-serif;padding:10px 14px;cursor:pointer}" +
    ".kbl-opt{display:flex;gap:8px;align-items:flex-start;margin:0 0 10px}.kbl-opt input{margin-top:3px}" +
    ".kbl-pill{position:fixed;right:10px;bottom:4px;z-index:50;font:12px Arial,sans-serif;color:#171615;background:rgba(255,255,255,.95);padding:3px 10px;border-radius:999px}" +
    ".kbl-pill a{color:#171615;margin-left:8px}@media(max-width:700px){.kbl-pill .kbl-long{display:none}}" +
    ".kbl-note{font:12px/1.6 Arial,sans-serif;color:#4a4546;text-align:center;max-width:760px;margin:0 auto;padding:0 18px}.kbl-note a{color:inherit;text-decoration:underline}" +
    ".kbl-biz{font-style:normal;font:12px/1.6 Arial,sans-serif;color:#4a4546;text-align:center;padding:14px 18px 0}" +
    ".kbl-agree{display:flex;gap:8px;align-items:flex-start;font-size:12px;line-height:1.5;color:#3d3d44;margin:2px 0 6px}.kbl-agree input{margin-top:2px;accent-color:#d9642c}.kbl-agree a{color:#b4501f;font-weight:600}" +
    ".kbl-err{min-height:16px;margin:0 0 6px;font-size:12px;color:#B42318}" +
    ".kbl-skip{position:fixed;left:8px;top:-60px;z-index:4000;background:#171615;color:#fff;padding:10px 16px;border-radius:8px;font:700 14px Arial,sans-serif;text-decoration:none}.kbl-skip:focus{top:8px}" +
    "a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,summary:focus-visible,[tabindex]:focus-visible{outline:3px solid #F12823!important;outline-offset:3px!important}" +
    ".cols a,.stat span,.plan .p small,.fcap span,.t cite span,.post p{color:#4a4546!important}";
  var st = el("style"); st.textContent = css; document.head.appendChild(st);

  /* ---------- Cookie / storage consent ---------- */
  function banner(force) {
    if (!force && saved()) return;
    var old = document.querySelector(".kbl-banner"); if (old) old.remove();
    var b = el("div", "kbl-banner",
      "<h2 id='kbl-h'>Your privacy choices</h2>" +
      "<p>We always use storage that the site needs to work (like remembering this choice). With your permission we also save preferences. Fonts and images load from third parties (Google Fonts, image hosts), which can see your IP address. See our <a href='cookies.html'>Cookie Policy</a> and <a href='privacy.html'>Privacy Policy</a>.</p>" +
      "<label class='kbl-opt'><input type='checkbox' id='kbl-fn'><span>Functional: remember my settings and preferences</span></label>" +
      "<div class='kbl-btns'><button type='button' data-a='reject'>Reject non-essential</button><button type='button' data-a='save'>Save my choice</button><button type='button' data-a='all'>Accept all</button></div>");
    b.setAttribute("role", "dialog"); b.setAttribute("aria-labelledby", "kbl-h");
    var cur = saved(); if (cur && cur.functional) b.querySelector("#kbl-fn").checked = true;
    b.addEventListener("click", function (e) {
      var a = e.target.getAttribute && e.target.getAttribute("data-a"); if (!a) return;
      var fn = a === "all" ? true : a === "reject" ? false : b.querySelector("#kbl-fn").checked;
      set(KEY, JSON.stringify({ essential: true, functional: fn, date: new Date().toISOString() }));
      b.remove();
    });
    b.addEventListener("keydown", function (e) { if (e.key === "Escape" && saved()) b.remove(); });
    document.body.appendChild(b);
    b.querySelector("button").focus();
  }

  function appPill() {
    if (!document.querySelector(".dashboard-overview")) return;
    var p = el("div", "kbl-pill",
      "<span class='kbl-long'>Estimates are indicative, not professional advice</span>" +
      "<a href='disclaimer.html'>Disclaimer</a><a href='terms.html'>Terms</a><a href='privacy.html'>Privacy</a><a href='#' data-cs>Cookies</a>");
    document.body.appendChild(p);
  }

  /* ---------- Landing page ---------- */
  function landing() {
    var cols = document.querySelector("footer .cols"); if (!cols) return;
    cols.querySelectorAll("a").forEach(function (a) {
      var t = a.textContent.trim();
      if (t === "Privacy") a.href = "privacy.html";
      else if (t === "Terms") a.href = "terms.html";
      else if (t === "Licensing") { a.href = "disclaimer.html"; a.textContent = "Disclaimer"; }
    });
    var legal = Array.prototype.filter.call(cols.children, function (d) { var h = d.querySelector("h5"); return h && h.textContent.trim() === "Legal"; })[0];
    if (legal) legal.insertAdjacentHTML("beforeend",
      "<a href='cookies.html'>Cookie Policy</a><a href='refund.html'>Refund Policy</a><a href='data-deletion.html'>Delete my data</a><a href='#' data-cs>Cookie settings</a>");

    var word = document.querySelector("footer .word");
    if (word) {
      var biz = el("address", "kbl-biz",
        "<strong>" + BIZ.name + "</strong> · Reg. " + BIZ.reg + " · VAT " + BIZ.vat + "<br>" + BIZ.address +
        "<br><a href='mailto:" + BIZ.email + "'>" + BIZ.email + "</a> · " + BIZ.phone);
      biz.querySelectorAll("a").forEach(function (a) { a.style.color = "inherit"; });
      word.parentNode.insertBefore(biz, word);
      word.parentNode.insertBefore(el("p", "kbl-note",
        "&copy; " + new Date().getFullYear() + " " + BIZ.name + ". KagoBuild provides AI-generated estimates and concept plans, not architectural, engineering or legal advice. Prices are indicative and exclude VAT, delivery and any fees unless stated. Supplier names are trademarks of their owners and imply no endorsement. <a href='disclaimer.html'>Disclaimer</a>"), word);
    }
    var stats = document.querySelector("section.stats");
    if (stats) stats.parentNode.insertBefore(el("p", "kbl-note",
      "Figures are illustrative examples and vary by project. <a href='disclaimer.html'>See disclaimer</a>."), stats.nextSibling);

    /* Newsletter: unticked consent box, required before subscribing */
    var news = document.getElementById("news");
    if (news) {
      var lab = el("label", "kbl-agree",
        "<input type='checkbox' id='kbl-news'><span>I agree to receive marketing emails from " + BIZ.name + ". Every email has an unsubscribe link. <a href='privacy.html'>Privacy Policy</a></span>");
      news.appendChild(lab);
      var msg = el("p", "kbl-err"); msg.setAttribute("role", "alert"); news.appendChild(msg);
      news.addEventListener("submit", function (e) {
        if (!document.getElementById("kbl-news").checked) {
          e.stopImmediatePropagation(); e.preventDefault();
          msg.textContent = "Please tick the box to subscribe.";
        } else msg.textContent = "";
      }, true);
    }

    /* Keyboard + accessibility */
    var team = document.getElementById("team-track"); if (team) { team.setAttribute("tabindex", "0"); team.setAttribute("aria-label", "Founders"); }
    var track = document.getElementById("track"); if (track) track.setAttribute("aria-hidden", "true");
    var target = document.getElementById("about") || document.querySelector("section");
    if (target) { target.setAttribute("tabindex", "-1"); var sk = el("a", "kbl-skip", "Skip to main content"); sk.href = "#" + (target.id || (target.id = "kbl-main")); document.body.insertBefore(sk, document.body.firstChild); }
  }

  /* ---------- Sign-up / log-in ---------- */
  function auth() {
    var stage = document.getElementById("card-stage"); if (!stage) return;
    var su = stage.querySelector('[data-card="signup"]'), li = stage.querySelector('[data-card="login"]');
    if (su) {
      var btn = su.querySelector(".primary-btn");
      var lab = el("label", "kbl-agree",
        "<input type='checkbox' id='kbl-agree'><span>I am 18 or older and agree to the <a href='terms.html' target='_blank' rel='noopener'>Terms of Use</a> and <a href='privacy.html' target='_blank' rel='noopener'>Privacy Policy</a>. KagoBuild is not for children under 18.</span>");
      var err = el("p", "kbl-err"); err.setAttribute("role", "alert");
      btn.parentNode.insertBefore(lab, btn); btn.parentNode.insertBefore(err, btn);
      var cb = lab.querySelector("input");
      cb.addEventListener("change", function () { err.textContent = ""; });
      stage.addEventListener("click", function (e) {
        if (e.target.closest(".primary-btn") === btn && !cb.checked) {
          e.stopPropagation(); e.preventDefault();
          err.textContent = "Please accept the Terms and Privacy Policy to continue.";
        }
      }, true);
    }
    if (li) {
      var lb = li.querySelector(".primary-btn");
      lb.parentNode.insertBefore(el("p", "kbl-note", "By logging in you agree to our <a href='terms.html'>Terms</a> and <a href='privacy.html'>Privacy Policy</a>."), lb.nextSibling);
    }
  }

  function a11y() {
    document.querySelectorAll("img:not([alt])").forEach(function (i) { i.setAttribute("alt", ""); });
    document.querySelectorAll("video").forEach(function (v) { v.setAttribute("aria-hidden", "true"); });
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-cs]")) { e.preventDefault(); banner(true); }
  });

  function init() { banner(); appPill(); landing(); auth(); a11y(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
