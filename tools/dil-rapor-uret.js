#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════════════
//  Dil raporu üretici — Akademîya Aram Tîgran
//  Koddan (app/index.html + index.html) TÜM çevrilebilir metinleri çıkarır ve
//  akademisyenlerin doldurduğu iki rapor sayfası üretir:
//    dil-raporu.html          → Kurmancî düzeltme raporu
//    dil-raporu-zazaki.html   → Zazakî çeviri raporu
//
//  Kullanım:  cd tools && npm install && node dil-rapor-uret.js
//  (Kod değiştikçe yeniden çalıştırın; rapordaki mevcut dolu değerler
//   app/lang-pack.js'ten okunur, böylece rapor her zaman güncel kalır.)
// ════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const parser = require('@babel/parser');

const ROOT = path.join(__dirname, '..');
const APP = path.join(ROOT, 'app', 'index.html');
const SITE = path.join(ROOT, 'index.html');
const PACK = path.join(ROOT, 'app', 'lang-pack.js');

// ── 1) Uygulama: K("…") / KF("…",[…]) çağrıları ─────────────────────────
function appStrings() {
  const html = fs.readFileSync(APP, 'utf8');
  const TAG = '<script type="text/x-aat-jsx" id="aat-src">';
  const s0 = html.indexOf(TAG) + TAG.length, s1 = html.indexOf('</script>', s0);
  const code = html.slice(s0, s1);
  const ast = parser.parse(code, { sourceType: 'script', plugins: ['jsx'] });
  const parent = new Map();
  const stack = [[ast.program, null]];
  const calls = [];
  while (stack.length) {
    const [n, p] = stack.pop();
    if (!n || typeof n.type !== 'string') continue;
    parent.set(n, p);
    if (n.type === 'CallExpression' && n.callee.type === 'Identifier' && (n.callee.name === 'K' || n.callee.name === 'KF' || n.callee.name === 'Z')
      && n.arguments[0] && n.arguments[0].type === 'StringLiteral') calls.push(n);
    for (const k of Object.keys(n)) {
      if (k === 'loc' || k === 'extra' || /Comments$/.test(k)) continue;
      const v = n[k];
      if (Array.isArray(v)) { for (let i = v.length - 1; i >= 0; i--) if (v[i] && typeof v[i].type === 'string') stack.push([v[i], n]); }
      else if (v && typeof v.type === 'string') stack.push([v, n]);
    }
  }
  const body = ast.program.body;
  const comp = pos => {
    for (const st of body) if (st.start <= pos && pos < st.end) {
      if ((st.type === 'FunctionDeclaration' || st.type === 'ClassDeclaration') && st.id) return st.id.name;
      if (st.type === 'VariableDeclaration' && st.declarations[0].id.name) return st.declarations[0].id.name;
    }
    return '(genel)';
  };
  const lit = n => {
    if (!n) return '';
    if (n.type === 'StringLiteral') return n.value;
    if (n.type === 'TemplateLiteral') { let t = ''; n.quasis.forEach((q, i) => { t += q.value.cooked; if (i < n.expressions.length) t += '{' + i + '}'; }); return t; }
    if (n.type === 'BinaryExpression' && n.operator === '+') {
      const parts = []; (function f(m) { if (m.type === 'BinaryExpression' && m.operator === '+') { f(m.left); f(m.right); } else parts.push(m); })(n);
      let t = '', i = 0; for (const x of parts) t += x.type === 'StringLiteral' ? x.value : '{' + (i++) + '}'; return t;
    }
    return '';
  };
  const keyOf = pr => pr && !pr.computed && pr.key ? (pr.key.name || pr.key.value) : null;
  const propIn = (o, k) => o && o.type === 'ObjectExpression' ? o.properties.find(p => keyOf(p) === k) : null;
  const byKu = new Map();
  for (const n of calls) {
    const ku = n.arguments[0].value;
    let en = '', tkey = '';
    const p = parent.get(n);
    if (n.callee.name === 'Z') en = lit(n.arguments[1]);   // Z("kurmancî","english")
    if (p && p.type === 'ConditionalExpression' && p.alternate === n) en = lit(p.consequent);
    const ret = p && p.type === 'ReturnStatement' ? p : null, blk = ret && parent.get(ret), meth = blk && parent.get(blk);
    if (meth && meth.type === 'ObjectMethod') {
      const obj = parent.get(meth), k = keyOf(meth);
      if (k === 'ku') { const e = propIn(obj, 'en'); en = e ? lit(e.value) : ''; }
      else {
        const kuP = parent.get(obj), outer = kuP && parent.get(kuP);
        const enO = outer && propIn(outer, 'en');
        const e = enO && propIn(enO.value, k); en = e ? lit(e.value) : '';
        if (outer && comp(n.start) === 'T') tkey = k;
      }
    }
    const x = byKu.get(ku) || { ku, en: '', keys: [], comps: [] };
    if (!x.en) x.en = en;
    if (tkey && !x.keys.includes(tkey)) x.keys.push(tkey);
    const c = comp(n.start); if (!x.comps.includes(c)) x.comps.push(c);
    byKu.set(ku, x);
  }
  return [...byKu.values()];
}

// ── 2) Site metinleri (index.html → SITE_T / AREA_I18N) ─────────────────
function siteStrings() {
  const html = fs.readFileSync(SITE, 'utf8');
  const m = html.match(/<script>\s*\/\/ ── Çok dilli site metinleri[\s\S]*?<\/script>/);
  const src = m[0].replace(/^<script>/, '').replace(/<\/script>$/, '');
  const ctx = { window: {}, document: { addEventListener() {}, querySelectorAll() { return []; }, documentElement: {} },
    localStorage: { getItem() { return null; }, setItem() {} }, setTimeout() {}, CustomEvent: function () {} };
  vm.runInNewContext(src.split('window.applySiteLang')[0], ctx);
  const T = ctx.window.SITE_T, A = ctx.window.AREA_I18N;
  const rows = [];
  for (const k of Object.keys(T.ku)) rows.push({ key: 'site.' + k, ku: T.ku[k], tr: (T.tr || {})[k] || '', en: (T.en || {})[k] || '' });
  for (const k of Object.keys(A.ku)) rows.push({ key: 'area.' + k, ku: A.ku[k], tr: (A.tr || {})[k] || '', en: (A.en || {})[k] || '' });
  return rows;
}

// ── 2b) Akademiya Zarokan: veli uygulaması (#zt) + tanıtım sayfası (#zs) sözlükleri ──
function zarokStrings() {
  const rows = [];
  for (const [file, id, prefix] of [['zarok/app/index.html', 'zt', 'zarok.'], ['zarok/index.html', 'zs', 'zaroksite.']]) {
    const f = path.join(ROOT, file);
    if (!fs.existsSync(f)) continue;
    const m = fs.readFileSync(f, 'utf8').match(new RegExp('<script id="' + id + '" type="application/json">([\\s\\S]*?)</script>'));
    if (!m) continue;
    const D = JSON.parse(m[1]);
    for (const k of Object.keys(D.ku)) rows.push({ key: prefix + k, ku: D.ku[k], tr: (D.tr || {})[k] || '', en: (D.en || {})[k] || '' });
  }
  return rows;
}

function loadPack() {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(PACK, 'utf8'), ctx);
  return { TX: ctx.window.AAT_TX || {}, SITE: ctx.window.AAT_SITE || {}, AREA: ctx.window.AAT_SITE_AREA || {},
    ZAROK: ctx.window.AAT_ZAROK || {}, ZSITE: ctx.window.AAT_ZAROK_SITE || {} };
}

// ── 3) Bölümler ─────────────────────────────────────────────────────────
const SECTIONS = [
  ['giris', 'Giriş, Şifre ve Oturum', /^(LoginScreen|ForgotScreen|App|BiometricModal|StudentChangePassSheet|deleteOwnAccount|ErrorBoundary)$/],
  ['sozluk', 'Temel Sözlük (tüm ekranlarda ortak)', /^T$/],
  ['yonetici', 'Yönetici Paneli — Öğrenci/Öğretmen/Program', /^(AdminPanel|AdminProfileSheet|Add\w*Sheet|Edit\w*Sheet|DeviceResetBtn|AdminScheduleTab|AdminAlertsPanel|StatsDetailModal|StudentStatModal|AreaDetailModal)$/],
  ['rapor', 'Raporlar ve Rapor Merkezi', /^(Admin\w*Report\w*|AdminReportCenter|ReportArchiveTab|makeSurveyResultsPdf|pctLabel)$/],
  ['anket', 'Anketler ve Değerlendirme', /Survey/],
  ['mesaj', 'Mesajlar, Duyurular, Öneri/Şikâyet', /(Message|Announce|Feedback)/],
  ['ogretmen', 'Öğretmen Paneli ve QR Yoklama', /^(Teacher\w*|openQRPrintPage)$/],
  ['ogrenci', 'Öğrenci Paneli, Kimlik Kartı, QR Giriş', /^(Student\w*|_idCardMsg|BirthdayModal)$/],
  ['basin', 'Basın Paneli, Site Haberleri, Arşiv, Özel Kartlar', /^(AdminNewsPanel|AdminArchivePanel|AdminPressPanel|PressPanel|SpecialPanelHeader|SPECIAL_TYPES)$/],
  ['ogrisleri', 'Öğrenci İşleri — Başvuru, Kayıt, Dönem', /^RegistrarPanel$/],
  ['ayar', 'Ayarlar, Uygulama Kurulumu (PWA), Yasal Metinler', /^(SettingsSheet|PWAInstallBanner|LegalModal|GDPRBanner|ThemeToggle)$/],
  ['alan', 'Sanat Alanları', /^AREAS$/],
  ['zarokadmin', 'Akademiya Zarokan — Öğrenci İşleri yönetimi', /^(ZarokAdminPanel|zarokNextNo)$/],
];
function sectionOf(comps) {
  for (const c of comps) for (const [id, , re] of SECTIONS) if (re.test(c)) return id;
  return 'diger';
}

// ── 4) HTML ─────────────────────────────────────────────────────────────
function page(lang, rows, sections) {
  const isZZ = lang === 'zz';
  const title = isZZ ? 'Zazakî (Kirmanckî) Çeviri Raporu' : 'Kurmancî Düzeltme Raporu';
  const colHead = isZZ ? 'Zazakî ✍️' : 'Yeni Kurmancî ✍️';
  const intro = isZZ
    ? 'Her satırdaki metnin <b>Zazakî</b> karşılığını sarı kutuya yazın. Kurmancî, Türkçe ve İngilizce sütunları anlamı göstermek içindir. Boş bırakılan satırlar uygulamada şimdilik <b>Kurmancî</b> görünür.'
    : 'Sistemde şu an görünen <b>Kurmancî</b> metinleri kontrol edin. Yanlış/eksik bulduğunuz satırın <b>doğru hâlini</b> sarı kutuya yazın. <b>Boş bırakılan satır “doğru, değişmesin”</b> demektir.';
  const data = JSON.stringify({ lang, rows, sections }).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta name="robots" content="noindex,nofollow"/>
<title>${title} — Akademîya Aram Tîgran</title>
<style>
:root{--navy:#0f2f38;--ink:#1e2936;--muted:#5b6b7c;--line:#dfe6ee;--soft:#f4f7fa;--gold:#c9a227;--ok:#16a34a;--bg:#fff;--fill:#fffdf2}
@media (prefers-color-scheme:dark){:root{--navy:#9fd3dc;--ink:#e6edf3;--muted:#9aa7b4;--line:#2a3642;--soft:#16202a;--bg:#0d151c;--fill:#1d1a0e}}
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color:var(--ink);background:var(--bg);line-height:1.5;-webkit-text-size-adjust:100%}
.page{max-width:1100px;margin:0 auto;padding:18px 16px 130px}
h1{font-size:21px;color:var(--navy);margin:6px 0 8px}
.nav{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 12px}
.nav a{font-size:12.5px;font-weight:700;padding:7px 13px;border-radius:999px;text-decoration:none;border:1px solid var(--line);color:var(--navy)}
.nav a.on{background:var(--navy);color:var(--bg);border-color:var(--navy)}
.intro{background:var(--soft);border-left:4px solid var(--gold);padding:10px 14px;border-radius:0 10px 10px 0;font-size:13.5px}
.intro ol{margin:6px 0 0 18px;padding:0}
.tools{position:sticky;top:0;z-index:20;background:var(--bg);padding:10px 0;display:flex;gap:8px;flex-wrap:wrap;align-items:center;border-bottom:1px solid var(--line)}
.tools input,.tools select{font:inherit;font-size:13px;padding:8px 10px;border:1px solid var(--line);border-radius:9px;background:var(--bg);color:var(--ink);min-width:0}
.tools input[type=search]{flex:1 1 200px}
.prog{flex:1 1 100%;height:6px;background:var(--soft);border-radius:4px;overflow:hidden}
.prog i{display:block;height:100%;width:0;background:var(--ok);transition:width .3s}
h2{font-size:15.5px;color:var(--navy);margin:26px 0 8px;padding:8px 12px;background:var(--soft);border-left:4px solid var(--gold);border-radius:0 8px 8px 0;display:flex;justify-content:space-between;gap:8px}
h2 small{font-weight:600;color:var(--muted);white-space:nowrap}
.row{display:grid;grid-template-columns:44px 1.1fr 1fr 1fr 1.3fr;gap:0;border:1px solid var(--line);border-top:none;font-size:13px}
.row.head{border-top:1px solid var(--line);background:var(--navy);color:var(--bg);font-size:11px;font-weight:700;letter-spacing:.03em;position:sticky;top:0}
.row>div{padding:7px 9px;min-width:0;overflow-wrap:anywhere;white-space:pre-wrap}
.row>div+div{border-left:1px solid var(--line)}
.row .n{color:var(--muted);font-size:11px}
.row .ku{font-weight:600}
.row .tr,.row .en{color:var(--muted)}
.row .f{background:var(--fill);padding:4px 6px}
.row textarea{width:100%;min-height:36px;resize:vertical;border:1px dashed #d9c877;border-radius:7px;padding:6px 8px;font:inherit;font-size:13px;background:transparent;color:inherit}
.row textarea:focus{outline:none;border:1.5px solid var(--gold);background:var(--bg)}
.row.done textarea{border:1.5px solid var(--ok)}
.warn{display:inline-block;margin-top:4px;font-size:10.5px;font-weight:700;color:#b45309;background:rgba(245,158,11,.14);border-radius:5px;padding:1px 6px}
.key{display:block;font-size:10px;color:var(--muted);font-family:ui-monospace,monospace;margin-top:2px}
.ph{background:rgba(201,162,39,.18);border-radius:4px;padding:0 3px;font-family:ui-monospace,monospace}
.lab{display:none;font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
@media (max-width:760px){
  .tools{position:static}
  .row{grid-template-columns:1fr}
  .row.head{display:none}
  .row>div+div{border-left:none;border-top:1px dashed var(--line)}
  .row .n{display:none}
  .lab{display:block}
  .row{margin-bottom:8px;border-top:1px solid var(--line);border-radius:10px;overflow:hidden}
}
.bar{position:fixed;left:0;right:0;bottom:0;background:#0f2f38;color:#fff;padding:10px 14px calc(10px + env(safe-area-inset-bottom,0px));display:flex;align-items:center;gap:8px;flex-wrap:wrap;box-shadow:0 -4px 18px rgba(0,0,0,.2);z-index:50}
.bar .cnt{font-size:12.5px;flex:1 1 140px}
.bar button,.bar label{border:none;border-radius:9px;padding:10px 13px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}
#b-send{background:var(--gold);color:#231a00}
#b-copy,#b-imp{background:rgba(255,255,255,.14);color:#fff}
.toast{position:fixed;bottom:84px;left:50%;transform:translateX(-50%);background:#111;color:#fff;padding:9px 16px;border-radius:10px;font-size:12.5px;opacity:0;transition:opacity .25s;pointer-events:none;z-index:60}
.toast.show{opacity:1}
.hide{display:none!important}
</style>
</head>
<body>
<div class="page">
  <div class="nav">
    <a href="dil-raporu.html" class="${isZZ ? '' : 'on'}">Kurmancî</a>
    <a href="dil-raporu-zazaki.html" class="${isZZ ? 'on' : ''}">Zazakî</a>
  </div>
  <h1>🗣 ${title}</h1>
  <div class="intro">
    ${intro}
    <ol>
      <li>Adınızı yazın, bölümleri sırayla doldurun (yazdıklarınız bu cihazda <b>otomatik saklanır</b>, sayfayı kapatabilirsiniz).</li>
      <li><span class="ph">{0}</span> gibi işaretler sayı/isim yer tutucusudur — çeviride <b>aynen koruyun</b>.</li>
      <li>Bitince <b>📤 Gönder</b>'e basın: rapor dosyası (.json) oluşur; WhatsApp/e-posta ile yöneticiye iletin. Sistem bu dosyayla <b>otomatik güncellenir</b>.</li>
      <li>Birden fazla kişi çalışıyorsa, birinin dosyasını <b>📥 Yükle</b> ile açıp kaldığı yerden devam edebilirsiniz.</li>
    </ol>
  </div>
  <div class="tools">
    <input id="who" placeholder="Hazırlayan (ad soyad)" style="flex:1 1 180px"/>
    <input id="q" type="search" placeholder="🔎 Metin ara…"/>
    <select id="sec"><option value="">Tüm bölümler</option></select>
    <select id="flt"><option value="">Hepsi</option><option value="empty">Yalnız boşlar</option><option value="done">Yalnız dolular</option>${isZZ ? '' : '<option value="warn">⚠ Türkçe kalmış olabilir</option>'}</select>
    <div class="prog"><i id="pb"></i></div>
  </div>
  <div id="list"></div>
</div>
<div class="bar">
  <div class="cnt"><b id="cnt">0</b> / <span id="tot">0</span> satır dolduruldu</div>
  <label id="b-imp">📥 Yükle<input id="impf" type="file" accept=".json,application/json" class="hide"/></label>
  <button id="b-copy">📋 Kopyala</button>
  <button id="b-send">📤 Gönder</button>
</div>
<div class="toast" id="toast"></div>
<script id="data" type="application/json">${data}</script>
<script>
(function(){
  var D=JSON.parse(document.getElementById('data').textContent);
  var KEY='aat-dil-'+D.lang+'-v3', WHO='aat-dil-who';
  var S={};try{S=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(e){}
  var who=document.getElementById('who');try{who.value=localStorage.getItem(WHO)||'';}catch(e){}
  who.addEventListener('input',function(){try{localStorage.setItem(WHO,who.value);}catch(e){}});
  function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
  function el(t,c,txt){var e=document.createElement(t);if(c)e.className=c;if(txt!=null)e.textContent=txt;return e;}
  function withPh(node,text){ // {0} yer tutucularını vurgula (textContent güvenli)
    String(text).split(/(\\{\\d+\\})/).forEach(function(p){ if(/^\\{\\d+\\}$/.test(p)){node.appendChild(el('span','ph',p));} else if(p){node.appendChild(document.createTextNode(p));} });
  }
  var list=document.getElementById('list'), secSel=document.getElementById('sec');
  var rowsEl=[], areas=[];
  D.sections.forEach(function(sec){
    var rows=D.rows.filter(function(r){return r.s===sec.id;}); if(!rows.length) return;
    var o=document.createElement('option');o.value=sec.id;o.textContent=sec.name+' ('+rows.length+')';secSel.appendChild(o);
    var box=el('div');box.dataset.sec=sec.id;
    var h=el('h2');h.appendChild(document.createTextNode(sec.name));var sm=el('small');h.appendChild(sm);box.appendChild(h);
    var hd=el('div','row head');['#','Kurmancî (şu an)','Türkçe anlamı','English','${colHead}'].forEach(function(t){hd.appendChild(el('div',null,t));});box.appendChild(hd);
    rows.forEach(function(r){
      var R=el('div','row');R._r=r;
      R.appendChild(el('div','n',String(r.i)));
      var c1=el('div','ku');c1.appendChild(el('span','lab','Kurmancî'));withPh(c1,r.k);if(r.key){c1.appendChild(el('span','key',r.key));}if(r.w&&D.lang==='ku'){c1.appendChild(document.createElement('br'));c1.appendChild(el('span','warn','⚠ Türkçe kalmış olabilir'));}R.appendChild(c1);
      var c2=el('div','tr');c2.appendChild(el('span','lab','Türkçe'));withPh(c2,r.t||'—');R.appendChild(c2);
      var c3=el('div','en');c3.appendChild(el('span','lab','English'));withPh(c3,r.e||'—');R.appendChild(c3);
      var c4=el('div','f');c4.appendChild(el('span','lab','${colHead}'));
      var ta=document.createElement('textarea');ta.rows=Math.min(8,Math.max(1,Math.ceil(r.k.length/42)+(r.k.split('\\n').length-1)));
      ta.placeholder=${isZZ ? "'Zazakî…'" : "'boş = doğru'"};
      ta.value=S[r.id]!=null?S[r.id]:(r.v||'');
      ta.addEventListener('input',function(){ if(ta.value.trim()) S[r.id]=ta.value; else delete S[r.id]; save(); mark(R,ta); count(); });
      c4.appendChild(ta);R.appendChild(c4);R._ta=ta;mark(R,ta);
      box.appendChild(R);rowsEl.push(R);
    });
    box._sm=sm;box._rows=rowsEl.slice(-rows.length);areas.push(box);list.appendChild(box);
  });
  function mark(R,ta){R.classList.toggle('done',!!ta.value.trim());}
  function count(){
    var n=0;rowsEl.forEach(function(R){if(R._ta.value.trim())n++;});
    document.getElementById('cnt').textContent=n;document.getElementById('tot').textContent=rowsEl.length;
    document.getElementById('pb').style.width=(rowsEl.length?100*n/rowsEl.length:0)+'%';
    areas.forEach(function(b){var d=0;b._rows.forEach(function(R){if(R._ta.value.trim())d++;});b._sm.textContent=d+' / '+b._rows.length;});
  }
  function filter(){
    var q=document.getElementById('q').value.trim().toLowerCase(), s=secSel.value, f=document.getElementById('flt').value;
    areas.forEach(function(b){
      var any=false;
      b._rows.forEach(function(R){var r=R._r;var v=R._ta.value.trim();
        var ok=(!s||r.s===s)&&(!q||(r.k+' '+r.t+' '+r.e+' '+v).toLowerCase().indexOf(q)>=0)&&(!f||(f==='empty'?!v:f==='warn'?!!r.w:!!v));
        R.classList.toggle('hide',!ok);if(ok)any=true;});
      b.classList.toggle('hide',!any);
    });
  }
  ['q','sec','flt'].forEach(function(id){document.getElementById(id).addEventListener('input',filter);});
  count();
  function toast(m){var t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(function(){t.classList.remove('show');},2600);}
  function build(){
    var out={format:'aat-dil-v3',lang:D.lang,by:who.value.trim(),date:new Date().toISOString(),app:{},site:{},area:{},zarok:{},zarokSite:{}},n=0;
    rowsEl.forEach(function(R){var v=R._ta.value.trim(),r=R._r;if(!v)return;
      if(D.lang!=='zz'&&v===r.k)return; // Kurmancî: değişmeyen satırı gönderme
      n++; var g=grp(r.key); if(g)out[g[0]][g[1]]=v; else out.app[r.k]=v;});
    out.count=n;return n?out:null;
  }
  // Satır anahtarı → dışa aktarma grubu (site./area./zarok./zaroksite.; diğerleri Kurmancî metinle "app")
  function grp(key){ var P=[['site.','site'],['area.','area'],['zarok.','zarok'],['zaroksite.','zarokSite']];
    for(var i=0;i<P.length;i++){ if(key&&key.indexOf(P[i][0])===0) return [P[i][1],key.slice(P[i][0].length)]; } return null; }
  function fname(){return 'dil-'+(D.lang==='zz'?'zazaki':'kurmanci')+'-'+new Date().toISOString().slice(0,10)+'.json';}
  document.getElementById('b-send').addEventListener('click',function(){
    if(!who.value.trim()){toast('Lütfen önce adınızı yazın');who.focus();return;}
    var o=build();if(!o){toast('Henüz giriş yapılmadı');return;}
    var txt=JSON.stringify(o,null,1);var blob=new Blob([txt],{type:'application/json'});
    var file=null;try{file=new File([blob],fname(),{type:'application/json'});}catch(e){}
    if(file&&navigator.canShare&&navigator.canShare({files:[file]})){navigator.share({files:[file],title:document.title}).catch(function(){});return;}
    var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fname();document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(a.href);},2000);toast('📄 '+fname()+' indirildi — yöneticiye iletin');
  });
  document.getElementById('b-copy').addEventListener('click',function(){
    var o=build();if(!o){toast('Henüz giriş yapılmadı');return;}var txt=JSON.stringify(o);
    (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(function(){toast('✅ Kopyalandı — mesajla gönderebilirsiniz');},function(){
      var ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast('✅ Kopyalandı');}catch(e){toast('Kopyalama desteklenmiyor');}ta.remove();});
  });
  document.getElementById('impf').addEventListener('change',function(e){
    var f=e.target.files[0];if(!f)return;var rd=new FileReader();
    rd.onload=function(){try{var o=JSON.parse(rd.result);if(!o||o.format!=='aat-dil-v3'||o.lang!==D.lang)throw 0;var n=0;
      rowsEl.forEach(function(R){var r=R._r,v;
        var g=grp(r.key); v=g?(o[g[0]]||{})[g[1]]:(o.app||{})[r.k];
        if(typeof v==='string'&&v.trim()){R._ta.value=v;S[r.id]=v;mark(R,R._ta);n++;}});
      save();count();toast('✅ '+n+' satır yüklendi');}catch(x){toast('⚠ Bu dosya bu rapora ait değil');}};
    rd.readAsText(f);e.target.value='';
  });
})();
</script>
</body>
</html>
`;
}

// Kurmancî metinde Türkçe kalmış olabilir mi? (Kurmancî alfabesinde ı ğ ö ü yoktur)
function suspectTr(k) {
  return /[ıİğĞöÖüÜ]/.test(k) || /(^|[^\wçêîûş])(için|bekleniyor|isteğe|yeni|sonra|sıfırla\w*|yüzdelik|puan|dönem\w*|ör\.|Parmak|Hedef)([^\wçêîûş]|$)/i.test(k);
}

function main() {
  const pack = loadPack();
  const app = appStrings();
  const site = siteStrings();
  const zarok = zarokStrings();
  const secNames = SECTIONS.map(([id, name]) => ({ id, name })).concat([{ id: 'diger', name: 'Diğer Ekranlar' }, { id: 'site', name: 'Ana Sayfa (Site) — akademiyaramtigran.github.io' },
    { id: 'zarok', name: 'Akademiya Zarokan — Veli uygulaması (PWA)' }, { id: 'zaroksite', name: 'Akademiya Zarokan — Tanıtım ve başvuru sayfası' }]);
  const order = Object.fromEntries(secNames.map((s, i) => [s.id, i]));
  const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); };
  function rowsFor(lang) {
    const TX = pack.TX, tr = TX.tr || {}, cur = TX[lang] || {};
    const rows = app.map(x => ({
      id: 'a' + hash(x.ku), s: sectionOf(x.comps), k: x.ku, t: tr[x.ku] || '', e: x.en, w: suspectTr(x.ku) ? 1 : 0,
      key: x.keys.length ? 'T.' + x.keys.join(', T.') : '', v: cur[x.ku] || ''
    }));
    for (const r of site) {
      const isArea = r.key.startsWith('area.'), k = r.key.slice(r.key.indexOf('.') + 1);
      const src = isArea ? pack.AREA : pack.SITE;
      rows.push({ id: 's' + hash(r.key), s: isArea ? 'alan' : 'site', k: r.ku, t: r.tr, e: r.en, key: r.key, v: (src[lang] || {})[k] || '' });
    }
    for (const r of zarok) {
      const isSite = r.key.startsWith('zaroksite.'), k = r.key.slice(r.key.indexOf('.') + 1);
      const src = isSite ? pack.ZSITE : pack.ZAROK;
      rows.push({ id: 'z' + hash(r.key), s: isSite ? 'zaroksite' : 'zarok', k: r.ku, t: r.tr, e: r.en, key: r.key, v: (src[lang] || {})[k] || '', w: suspectTr(r.ku) ? 1 : 0 });
    }
    rows.sort((a, b) => order[a.s] - order[b.s]);
    rows.forEach((r, i) => { r.i = i + 1; });
    return rows;
  }
  fs.writeFileSync(path.join(ROOT, 'dil-raporu.html'), page('ku', rowsFor('ku'), secNames));
  fs.writeFileSync(path.join(ROOT, 'dil-raporu-zazaki.html'), page('zz', rowsFor('zz'), secNames));
  const r = rowsFor('zz');
  const per = {}; r.forEach(x => per[x.s] = (per[x.s] || 0) + 1);
  console.log('Rapor satırı:', r.length, per);
}
main();
