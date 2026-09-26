#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════════════
//  Dil entegrasyonu — akademisyen raporlarını sisteme işler
//  Kullanım:  node tools/dil-entegre.js dil-zazaki-2026-10-01.json [başka.json …]
//
//  • Zazakî raporu   → app/lang-pack.js içinde AAT_TX.zza / AAT_SITE.zza / AAT_SITE_AREA.zza
//  • Kurmancî raporu → AAT_TX.ku / AAT_SITE.ku / AAT_SITE_AREA.ku (düzeltmeler)
//  • Akademiya Zarokan → AAT_ZAROK (veli uygulaması) / AAT_ZAROK_SITE (tanıtım sayfası)
//  Kaynak kod değişmez; uygulama ve site dil paketini açılışta okur.
//  Ardından: tools/dil-rapor-uret.js ile raporları yenileyin, commit + push.
// ════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PACK = path.join(__dirname, '..', 'app', 'lang-pack.js');
const LANGS = ['ku', 'zza', 'tr'];

function load() {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(PACK, 'utf8'), ctx);
  const w = ctx.window;
  // eski 'zz' anahtarı varsa 'zza'ya taşınır
  const norm = o => { const r = {}; for (const l of LANGS) r[l] = Object.assign({}, l === 'zza' ? (o || {}).zz || {} : {}, (o || {})[l] || {}); return r; };
  return { TX: norm(w.AAT_TX), SITE: norm(w.AAT_SITE), AREA: norm(w.AAT_SITE_AREA), ZAROK: norm(w.AAT_ZAROK), ZSITE: norm(w.AAT_ZAROK_SITE) };
}

function write(p) {
  const dump = o => JSON.stringify(o, null, 0).replace(/","/g, '",\n"');
  const head = fs.readFileSync(PACK, 'utf8').split('window.AAT_TX=')[0];
  fs.writeFileSync(PACK, head + 'window.AAT_TX=' + dump(p.TX) + ';\n' +
    'window.AAT_SITE=' + dump(p.SITE) + ';\n' +
    'window.AAT_SITE_AREA=' + dump(p.AREA) + ';\n' +
    'window.AAT_ZAROK=' + dump(p.ZAROK) + ';\n' +
    'window.AAT_ZAROK_SITE=' + dump(p.ZSITE) + ';\n');
}

// Yer tutucular ({0},{1}…) çeviride korunmuş mu?
const ph = s => (String(s).match(/\{\d+\}/g) || []).sort().join(',');
// Güvenlik: metin HTML/JS enjeksiyonu taşımasın (React metni kaçışlar ama site innerHTML kullanabilir)
const unsafe = s => /<\s*\/?\s*(script|iframe|img|svg|a|style|object|embed)\b|javascript:|on\w+\s*=/i.test(s);

const files = process.argv.slice(2);
if (!files.length) { console.error('Kullanım: node tools/dil-entegre.js <rapor.json> [...]'); process.exit(1); }
const pack = load();
let total = 0;
for (const f of files) {
  const o = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (o.lang === 'zz') o.lang = 'zza'; // eski rapor dosyaları
  if (o.format !== 'aat-dil-v3' || !LANGS.includes(o.lang)) { console.error('✗ Tanınmayan rapor:', f); process.exitCode = 1; continue; }
  const L = o.lang;
  let n = 0, skipped = [];
  const put = (dst, k, v, src) => {
    if (typeof v !== 'string' || !v.trim() || v.length > 5000) return;
    v = v.replace(/\r\n/g, '\n').trim();
    if (unsafe(v)) { skipped.push(k + ' (güvensiz içerik)'); return; }
    if (src != null && ph(src) !== ph(v)) { skipped.push(k.slice(0, 50) + ' (yer tutucu {n} uyuşmuyor)'); return; }
    if (L === 'ku' && src != null && v === src) return; // değişmemiş
    dst[L][k] = v; n++;
  };
  for (const [k, v] of Object.entries(o.app || {})) put(pack.TX, k, v, k);
  for (const [k, v] of Object.entries(o.site || {})) put(pack.SITE, k, v, null);
  for (const [k, v] of Object.entries(o.area || {})) put(pack.AREA, k, v, null);
  for (const [k, v] of Object.entries(o.zarok || {})) put(pack.ZAROK, k, v, null);
  for (const [k, v] of Object.entries(o.zarokSite || {})) put(pack.ZSITE, k, v, null);
  total += n;
  console.log(`✓ ${path.basename(f)} — ${L} — ${o.by || '?'} — ${n} satır işlendi` + (skipped.length ? `, ${skipped.length} atlandı:\n   - ` + skipped.join('\n   - ') : ''));
}
write(pack);
console.log(`Toplam ${total} satır → app/lang-pack.js`);
