/* ── Ortak açılır menü (ana uygulama, Çocuk Akademisi uygulaması, siteler) ───────────
   Yerel <select> olduğu gibi kalır (değer, form, React onChange ve testler aynen çalışır);
   yalnızca açılış anı yakalanır: telefonun eski tip seçim listesi yerine kurumsal liste açılır.
   Telefonda alttan açılan pencere, geniş ekranda alanın altında liste; uzun listede arama.
   Seçim yerel select'e yazılır ve "change" + "input" olayları tetiklenir.
   Kapsam: <html data-secim> ya da <html class="aat-in"> / <body class="z-in"> altındaki select'ler.
   Hariç: [multiple], [size>1], [data-langdd] (dil seçicinin kendi menüsü var), [data-native]. */
(function () {
  if (window.__secim) return; window.__secim = true;
  var css = "" +
    ".sc-bd{position:fixed;inset:0;z-index:2147482990;background:rgba(16,42,49,.32);opacity:0;transition:opacity .15s}" +
    ".sc-bd.sc-in{opacity:1}" +
    ".sc-pop{position:fixed;z-index:2147483000;background:#fff;border:1px solid #E1E6E7;border-radius:16px;box-shadow:0 18px 44px rgba(15,47,56,.18),0 2px 6px rgba(15,47,56,.08);" +
      "display:flex;flex-direction:column;overflow:hidden;font-family:'Plus Jakarta Sans',Inter,-apple-system,'Segoe UI',sans-serif;color:#102A31;opacity:0;transform:translateY(-4px);transition:opacity .14s,transform .14s}" +
    ".sc-pop.sc-in{opacity:1;transform:none}" +
    ".sc-pop.sc-sheet{left:0;right:0;bottom:0;top:auto;border-radius:22px 22px 0 0;max-height:78vh;transform:translateY(16px);padding-bottom:env(safe-area-inset-bottom,0px)}" +
    ".sc-pop.sc-sheet.sc-in{transform:none}" +
    ".sc-grab{width:40px;height:4px;border-radius:2px;background:#D2DADC;margin:10px auto 2px;flex-shrink:0}" +
    ".sc-hd{padding:10px 18px 8px;font-size:15px;font-weight:700;flex-shrink:0}" +
    ".sc-q{margin:4px 12px 8px;flex-shrink:0;position:relative}" +
    ".sc-q input{width:100%;box-sizing:border-box;height:44px;border:1px solid #D2DADC;border-radius:12px;padding:0 12px 0 38px;font:inherit;font-size:15px;color:#102A31;background:#fff;outline:none}" +
    ".sc-q input:focus{border-color:#0f2f38;box-shadow:0 0 0 3px rgba(15,47,56,.12)}" +
    ".sc-q svg{position:absolute;left:12px;top:13px;width:18px;height:18px;stroke:#56676C;fill:none;stroke-width:2;stroke-linecap:round}" +
    ".sc-ls{list-style:none;margin:0;padding:4px 6px 8px;overflow-y:auto;-webkit-overflow-scrolling:touch}" +
    ".sc-gt{padding:12px 12px 6px;font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#56676C}" +
    ".sc-it{display:flex;align-items:center;gap:10px;min-height:46px;padding:8px 12px;border-radius:12px;cursor:pointer;font-size:15px;line-height:1.3}" +
    ".sc-it:hover,.sc-it.sc-act{background:#F2F4F4}" +
    ".sc-it.sc-on{font-weight:700;color:#0f2f38}" +
    ".sc-it .sc-tx{flex:1;min-width:0;overflow-wrap:anywhere}" +
    ".sc-it .sc-ck{width:18px;height:18px;flex-shrink:0;stroke:#0f2f38;fill:none;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;visibility:hidden}" +
    ".sc-it.sc-on .sc-ck{visibility:visible}" +
    ".sc-it.sc-dis{opacity:.45;cursor:default}" +
    ".sc-none{padding:16px 12px;color:#56676C;font-size:14px;text-align:center}";
  var st = document.createElement("style"); st.textContent = css; (document.head || document.documentElement).appendChild(st);

  var NS = "http://www.w3.org/2000/svg";
  function ico(d, cls) { var s = document.createElementNS(NS, "svg"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); if (cls) s.setAttribute("class", cls);
    var p = document.createElementNS(NS, "path"); p.setAttribute("d", d); s.appendChild(p); return s; }
  function inScope(sel) {
    if (!sel || sel.multiple || sel.size > 1 || sel.disabled || sel.hasAttribute("data-langdd") || sel.hasAttribute("data-native")) return false;
    var h = document.documentElement;
    return h.hasAttribute("data-secim") || h.classList.contains("aat-in") || (document.body && document.body.classList.contains("z-in"));
  }
  function label(sel) {
    var l = sel.getAttribute("aria-label");
    if (!l && sel.id) { try { var lb = document.querySelector('label[for="' + sel.id + '"]'); if (lb) l = lb.textContent; } catch (_) {} }
    if (!l) { var w = sel.closest("label"); if (w) l = Array.prototype.filter.call(w.childNodes, function (n) { return n.nodeType === 3; }).map(function (n) { return n.textContent; }).join(" "); }
    if (!l) { var fw = sel.parentElement && sel.parentElement.querySelector(".fw-lbl,.c-lbl,label.lb"); if (fw) l = fw.textContent; }
    l = (l || "").trim(); return l.length > 60 ? "" : l;
  }
  var cur = null;
  function close() {
    if (!cur) return; var c = cur; cur = null;
    c.pop.classList.remove("sc-in"); if (c.bd) c.bd.classList.remove("sc-in");
    setTimeout(function () { c.pop.remove(); if (c.bd) c.bd.remove(); }, 160);
    document.removeEventListener("keydown", c.key, true); window.removeEventListener("resize", c.onRz); window.removeEventListener("scroll", c.onSc, true);
    try { c.sel.focus({ preventScroll: true }); } catch (_) {}
  }
  function pick(sel, i) {
    if (sel.selectedIndex !== i) {
      sel.selectedIndex = i;
      sel.dispatchEvent(new Event("input", { bubbles: true }));
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    }
    close();
  }
  function open(sel) {
    close();
    var sheet = window.matchMedia && window.matchMedia("(max-width:599.98px)").matches;
    var pop = document.createElement("div"); pop.className = "sc-pop" + (sheet ? " sc-sheet" : ""); pop.setAttribute("role", "dialog");
    var bd = null;
    if (sheet) { bd = document.createElement("div"); bd.className = "sc-bd"; bd.addEventListener("click", close); document.body.appendChild(bd); pop.appendChild(Object.assign(document.createElement("div"), { className: "sc-grab" })); }
    var ttl = label(sel);
    if (sheet && ttl) { var hd = document.createElement("div"); hd.className = "sc-hd"; hd.textContent = ttl; pop.appendChild(hd); }
    var opts = Array.prototype.slice.call(sel.options);
    var q = null;
    if (opts.length > 10) {
      var qw = document.createElement("div"); qw.className = "sc-q"; qw.appendChild(ico("M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3"));
      q = document.createElement("input"); q.type = "search"; q.setAttribute("aria-label", "Bigere · Ara · Search"); q.placeholder = (document.documentElement.lang === "tr" ? "Ara…" : document.documentElement.lang === "en" ? "Search…" : "Bigere…");
      qw.appendChild(q); pop.appendChild(qw);
    }
    var ls = document.createElement("ul"); ls.className = "sc-ls"; ls.setAttribute("role", "listbox"); if (ttl) ls.setAttribute("aria-label", ttl);
    pop.appendChild(ls);
    var items = [];
    function build(f) {
      ls.textContent = ""; items = []; var lastG = null, any = false;
      var needle = (f || "").toLocaleLowerCase().trim();
      opts.forEach(function (o, i) {
        if (o.hidden) return;
        var tx = (o.textContent || "").trim();
        if (needle && tx.toLocaleLowerCase().indexOf(needle) < 0) return;
        var g = o.parentElement && o.parentElement.tagName === "OPTGROUP" ? o.parentElement : null;
        if (g && g !== lastG) { var gt = document.createElement("li"); gt.className = "sc-gt"; gt.setAttribute("role", "presentation"); gt.textContent = g.label; ls.appendChild(gt); }
        lastG = g;
        var li = document.createElement("li"); li.className = "sc-it" + (i === sel.selectedIndex ? " sc-on" : "") + (o.disabled ? " sc-dis" : "");
        li.setAttribute("role", "option"); li.setAttribute("aria-selected", i === sel.selectedIndex ? "true" : "false");
        var sp = document.createElement("span"); sp.className = "sc-tx"; sp.textContent = tx || " "; li.appendChild(sp);
        li.appendChild(ico("M20 6 9 17l-5-5", "sc-ck"));
        if (!o.disabled) li.addEventListener("click", function () { pick(sel, i); });
        li._i = i; ls.appendChild(li); items.push(li); any = true;
      });
      if (!any) { var no = document.createElement("li"); no.className = "sc-none"; no.textContent = "—"; ls.appendChild(no); }
    }
    build("");
    if (q) q.addEventListener("input", function () { build(q.value); act = -1; });
    document.body.appendChild(pop);
    function place() {
      if (sheet) return;
      var r = sel.getBoundingClientRect(), vw = document.documentElement.clientWidth, vh = window.innerHeight;
      var w = Math.max(r.width, 220); w = Math.min(w, vw - 16);
      var below = vh - r.bottom - 12, above = r.top - 12, up = below < 240 && above > below;
      var mh = Math.max(160, Math.min(360, up ? above : below));
      pop.style.width = w + "px"; pop.style.maxHeight = mh + "px";
      pop.style.left = Math.min(Math.max(8, r.left), vw - w - 8) + "px";
      if (up) { pop.style.top = ""; pop.style.bottom = (vh - r.top + 6) + "px"; } else { pop.style.bottom = ""; pop.style.top = (r.bottom + 6) + "px"; }
    }
    place();
    var act = -1;
    function setAct(n) { if (!items.length) return; act = (n + items.length) % items.length; items.forEach(function (x, k) { x.classList.toggle("sc-act", k === act); }); items[act].scrollIntoView({ block: "nearest" }); }
    var key = function (e) {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setAct(act + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setAct(act - 1); }
      else if (e.key === "Enter" && act >= 0 && items[act]) { e.preventDefault(); items[act].click(); }
      else if (e.key === "Tab") close();
    };
    document.addEventListener("keydown", key, true);
    var onRz = function () { place(); }, onSc = function (e) { if (!pop.contains(e.target)) close(); };
    window.addEventListener("resize", onRz); window.addEventListener("scroll", onSc, true);
    cur = { sel: sel, pop: pop, bd: bd, key: key, onRz: onRz, onSc: onSc };
    requestAnimationFrame(function () { pop.classList.add("sc-in"); if (bd) bd.classList.add("sc-in");
      var on = ls.querySelector(".sc-on"); if (on) on.scrollIntoView({ block: "center" });
      if (q && !sheet) try { q.focus(); } catch (_) {} });
  }
  // Açılış anını yakala (yerel liste açılmasın)
  function grab(e) {
    var sel = e.target && e.target.closest ? e.target.closest("select") : null;
    if (!sel || !inScope(sel)) return;
    if (e.type === "mousedown" && e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    if (cur && cur.sel === sel) { close(); return; }
    open(sel);
  }
  document.addEventListener("mousedown", grab, true);
  document.addEventListener("touchend", function (e) { var sel = e.target && e.target.closest ? e.target.closest("select") : null; if (sel && inScope(sel)) grab(e); }, { capture: true, passive: false });
  document.addEventListener("keydown", function (e) {
    var sel = e.target; if (!sel || sel.tagName !== "SELECT" || !inScope(sel) || cur) return;
    if (e.key === " " || e.key === "Enter" || (e.altKey && e.key === "ArrowDown")) { e.preventDefault(); open(sel); }
  }, true);
  // Dış tıklama → kapat
  document.addEventListener("mousedown", function (e) { if (cur && !cur.pop.contains(e.target) && e.target !== cur.sel) close(); }, false);
  window.aatSecim = { open: open, close: close };
})();
