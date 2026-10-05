// Dil seçici — yerel <select> yerine kurumsal açılır menü (ana site, çocuk sitesi, çocuk uygulaması).
// Kullanım: <select data-langdd> … </select>. Yerel select gizli olarak kalır; seçim onda yapılıp
// "change" olayı tetiklenir, böylece sayfaların mevcut dil kodu aynen çalışır. Betik yüklenmezse
// yerel select görünür kalır (yedek).
(function () {
  if (window.__langdd) return; window.__langdd = true;
  var SUB = { ku: "Kurdî", zza: "Kurdî", tr: "", en: "" };
  var CODE = { ku: "KU", zza: "ZZ", tr: "TR", en: "EN" };
  var css = "" +
    ".ldd-host{position:relative;display:inline-flex}" +
    ".ldd-host>select[data-langdd]{position:absolute!important;opacity:0!important;pointer-events:none!important;width:1px!important;height:1px!important;overflow:hidden}" +
    ".ldd-host.ldd-on{border:none!important;background:none!important;padding:0!important;min-height:0!important;box-shadow:none!important}" +
    ".ldd-host.ldd-on::before,.ldd-host.ldd-on::after{display:none!important}" +
    ".ldd-host.ldd-on>span,.ldd-host.ldd-on>.ldd-old{display:none!important}" +
    ".ldd-btn{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;gap:9px;min-height:40px;padding:6px 12px 6px 7px;border-radius:999px;cursor:pointer;" +
      "background:var(--ldd-bg,#FBF8F1);border:1px solid var(--ldd-line,rgba(156,125,51,.32));color:var(--ldd-ink,#1d2b33);font-family:inherit;font-size:14px;font-weight:600;line-height:1.1;" +
      "box-shadow:0 1px 2px rgba(15,47,56,.06);transition:border-color .18s,box-shadow .18s,background .18s;-webkit-tap-highlight-color:transparent;white-space:nowrap}" +
    ".ldd-btn:hover{border-color:var(--ldd-gold,#b8923f);box-shadow:0 2px 8px rgba(156,125,51,.16)}" +
    ".ldd-btn:focus-visible{outline:2px solid var(--ldd-gold,#b8923f);outline-offset:2px}" +
    ".ldd-btn[aria-expanded=true]{border-color:var(--ldd-gold,#b8923f);box-shadow:0 0 0 3px rgba(184,146,63,.16)}" +
    ".ldd-code{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:var(--ldd-cur,#0f2f38);color:var(--ldd-cur-ink,#F1E3BF);font-family:inherit;font-size:10.5px;font-weight:700;line-height:1;letter-spacing:.06em;flex-shrink:0}" +
    ".ldd-chev{width:12px;height:12px;opacity:.6;transition:transform .2s;flex-shrink:0}" +
    ".ldd-btn[aria-expanded=true] .ldd-chev{transform:rotate(180deg)}" +
    ".ldd-wide .ldd-btn{width:100%;border-radius:14px;min-height:52px;padding:8px 14px 8px 10px;font-size:16px}" +
    ".ldd-wide .ldd-cur{flex:1}" +
    ".ldd-menu{position:fixed;z-index:2147483000;min-width:230px;margin:0;padding:6px;list-style:none;border-radius:16px;background:var(--ldd-pop,#FFFDF8);" +
      "border:1px solid var(--ldd-line,rgba(156,125,51,.28));box-shadow:0 18px 44px rgba(15,47,56,.18),0 2px 6px rgba(15,47,56,.08);" +
      "opacity:0;transform:translateY(-4px) scale(.98);transform-origin:top right;transition:opacity .14s,transform .14s;font-family:inherit}" +
    ".ldd-menu.ldd-open{opacity:1;transform:none}" +
    ".ldd-hd{padding:8px 12px 6px;font-family:inherit;font-size:10.5px;font-weight:700;line-height:1;letter-spacing:.14em;text-transform:uppercase;color:var(--ldd-gold-ink,#9c7d33)}" +
    ".ldd-opt{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:11px;cursor:pointer;color:var(--ldd-ink,#1d2b33);outline:none}" +
    ".ldd-opt:hover,.ldd-opt.ldd-act{background:var(--ldd-hover,rgba(15,47,56,.05))}" +
    ".ldd-opt[aria-selected=true]{background:var(--ldd-sel,rgba(184,146,63,.13))}" +
    ".ldd-opt .ldd-code{width:30px;height:30px;font-size:10.5px;background:var(--ldd-chip,#EFE6D2);color:var(--ldd-chip-ink,#5f4b1d)}" +
    ".ldd-opt[aria-selected=true] .ldd-code{background:var(--ldd-cur,#0f2f38);color:var(--ldd-cur-ink,#F1E3BF)}" +
    ".ldd-t{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}" +
    ".ldd-t b{font-weight:700;font-size:15px}" +
    ".ldd-t small{font-size:12px;opacity:.6}" +
    ".ldd-ok{width:16px;height:16px;color:var(--ldd-gold,#b8923f);visibility:hidden}" +
    ".ldd-opt[aria-selected=true] .ldd-ok{visibility:visible}" +
    "@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--ldd-bg:#16313a;--ldd-pop:#132a32;--ldd-line:rgba(231,199,123,.28);--ldd-ink:#eef2f1;--ldd-hover:rgba(255,255,255,.06);--ldd-sel:rgba(231,199,123,.14);--ldd-chip:#22414b;--ldd-chip-ink:#e7c77b;--ldd-gold-ink:#e7c77b;--ldd-cur:#e7c77b;--ldd-cur-ink:#0f2f38}}" +
    ":root[data-theme=dark]{--ldd-bg:#16313a;--ldd-pop:#132a32;--ldd-line:rgba(231,199,123,.28);--ldd-ink:#eef2f1;--ldd-hover:rgba(255,255,255,.06);--ldd-sel:rgba(231,199,123,.14);--ldd-chip:#22414b;--ldd-chip-ink:#e7c77b;--ldd-gold-ink:#e7c77b;--ldd-cur:#e7c77b;--ldd-cur-ink:#0f2f38}" +
    "@media (prefers-reduced-motion:reduce){.ldd-menu,.ldd-chev{transition:none}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  var CHEV = '<svg class="ldd-chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4.5l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var OK = '<svg class="ldd-ok" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var open = null;

  function label(sel) { var o = sel.options[sel.selectedIndex]; return o ? o.textContent : ""; }
  function close() {
    if (!open) return; var o = open; open = null;
    o.btn.setAttribute("aria-expanded", "false"); o.menu.classList.remove("ldd-open");
    setTimeout(function () { if (o.menu.parentNode) o.menu.parentNode.removeChild(o.menu); }, 150);
  }
  function choose(sel, v) {
    if (sel.value !== v) { sel.value = v; sel.dispatchEvent(new Event("change", { bubbles: true })); }
    close(); refreshAll(); try { sel.__ldd.btn.focus(); } catch (_) {}
  }
  function openMenu(sel) {
    var b = sel.__ldd.btn; close();
    var menu = document.createElement("ul"); menu.className = "ldd-menu"; menu.setAttribute("role", "listbox");
    menu.setAttribute("aria-label", sel.getAttribute("aria-label") || "Language");
    var hd = document.createElement("li"); hd.className = "ldd-hd"; hd.setAttribute("role", "presentation");
    hd.textContent = "Ziman · Dil · Language"; menu.appendChild(hd);
    Array.prototype.forEach.call(sel.options, function (o) {
      var li = document.createElement("li"); li.className = "ldd-opt"; li.setAttribute("role", "option"); li.tabIndex = -1;
      li.setAttribute("aria-selected", o.value === sel.value ? "true" : "false"); li.dataset.v = o.value;
      li.innerHTML = '<span class="ldd-code">' + (CODE[o.value] || o.value.toUpperCase()) + '</span><span class="ldd-t"><b></b>' + (SUB[o.value] ? "<small></small>" : "") + "</span>" + OK;
      li.querySelector("b").textContent = o.textContent; if (SUB[o.value]) li.querySelector("small").textContent = SUB[o.value];
      li.addEventListener("click", function () { choose(sel, o.value); });
      menu.appendChild(li);
    });
    document.body.appendChild(menu);
    var r = b.getBoundingClientRect(), w = Math.max(menu.offsetWidth, r.width), vw = document.documentElement.clientWidth;
    var left = Math.min(Math.max(8, r.right - w), vw - w - 8), top = r.bottom + 8;
    if (top + menu.offsetHeight > innerHeight - 8 && r.top - menu.offsetHeight - 8 > 8) { top = r.top - menu.offsetHeight - 8; menu.style.transformOrigin = "bottom right"; }
    menu.style.left = left + "px"; menu.style.top = top + "px"; menu.style.minWidth = w + "px";
    b.setAttribute("aria-expanded", "true"); open = { btn: b, menu: menu, sel: sel };
    requestAnimationFrame(function () { menu.classList.add("ldd-open"); });
    var cur = menu.querySelector('[aria-selected="true"]') || menu.querySelector(".ldd-opt"); if (cur) { cur.classList.add("ldd-act"); cur.focus(); }
  }
  function keyNav(e) {
    if (!open) return;
    var opts = Array.prototype.slice.call(open.menu.querySelectorAll(".ldd-opt")), i = opts.indexOf(document.activeElement);
    if (e.key === "Escape") { e.preventDefault(); var b = open.btn; close(); b.focus(); }
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); var n = opts[(i + (e.key === "ArrowDown" ? 1 : opts.length - 1)) % opts.length];
      opts.forEach(function (x) { x.classList.remove("ldd-act"); }); n.classList.add("ldd-act"); n.focus(); }
    else if ((e.key === "Enter" || e.key === " ") && i >= 0) { e.preventDefault(); choose(open.sel, opts[i].dataset.v); }
    else if (e.key === "Tab") close();
  }
  function enhance(sel) {
    if (sel.__ldd) return;
    var host = sel.parentElement; if (!host) return;
    host.classList.add("ldd-host", "ldd-on");
    if (sel.hasAttribute("data-langdd-wide")) { host.classList.add("ldd-wide"); host.style.display = "flex"; }
    Array.prototype.forEach.call(host.children, function (c) { if (c !== sel && c.tagName === "SPAN") c.classList.add("ldd-old"); });
    var b = document.createElement("button"); b.type = "button"; b.className = "ldd-btn";
    b.setAttribute("aria-haspopup", "listbox"); b.setAttribute("aria-expanded", "false");
    b.setAttribute("aria-label", sel.getAttribute("aria-label") || "Language");
    b.innerHTML = '<span class="ldd-code"></span><span class="ldd-cur"></span>' + CHEV;
    b.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); if (open && open.sel === sel) close(); else openMenu(sel); });
    b.addEventListener("keydown", function (e) { if (e.key === "ArrowDown" && !open) { e.preventDefault(); openMenu(sel); } });
    host.appendChild(b); sel.tabIndex = -1; sel.setAttribute("aria-hidden", "true");
    sel.__ldd = { btn: b }; sel.addEventListener("change", refreshAll); paint(sel);
  }
  function paint(sel) {
    var b = sel.__ldd && sel.__ldd.btn; if (!b) return;
    var t = label(sel), c = CODE[sel.value] || String(sel.value || "").toUpperCase();
    var ce = b.querySelector(".ldd-code"), te = b.querySelector(".ldd-cur");
    if (ce.textContent !== c) ce.textContent = c; if (te.textContent !== t) te.textContent = t;
  }
  function refreshAll() { Array.prototype.forEach.call(document.querySelectorAll("select[data-langdd]"), function (s) { if (!s.__ldd) enhance(s); else paint(s); }); }
  document.addEventListener("click", function (e) { if (open && !open.menu.contains(e.target) && !open.btn.contains(e.target)) close(); }, true);
  document.addEventListener("keydown", keyNav, true);
  addEventListener("resize", close); addEventListener("scroll", function (e) { if (open && !open.menu.contains(e.target)) close(); }, true);
  // Sayfalar dili kod ile değiştirebilir (sel.value = …) ya da yeniden çizebilir: hafif eşitleme
  new MutationObserver(function () { refreshAll(); }).observe(document.documentElement, { childList: true, subtree: true });
  setInterval(refreshAll, 800);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", refreshAll); else refreshAll();
})();
