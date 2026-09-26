#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════════════
//  Akademiya Zarokan'ı kendi alan adına (ör. zarok.aramtigran.org) taşımak için
//  yayına hazır klasör üretir. Kaynak her zaman bu depodaki zarok/ klasörüdür.
//
//  Kullanım:  node tools/zarok-paketle.js zarok.aramtigran.org [https://akademiyaramtigran.github.io]
//  Çıktı:     dist-zarok/  → ayrı bir GitHub deposuna (ör. akademiyaramtigran/zarok) yükleyin.
//             (GitHub Pages: Settings → Pages → Custom domain; CNAME dosyası hazırdır.)
//
//  Yapılan dönüşümler:
//   • Ana akademi bağlantıları (../../app/, ../, ../kvkk.html) → ana sitenin tam adresi
//   • Dil paketi (app/lang-pack.js) klasörün içine kopyalanır (Zazakî çeviriler çalışsın)
//   • KVKK sayfası kopyalanır
// ════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');

const domain = process.argv[2];
const main = (process.argv[3] || 'https://akademiyaramtigran.github.io').replace(/\/$/, '');
if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) { console.error('Kullanım: node tools/zarok-paketle.js zarok.aramtigran.org [anaSiteAdresi]'); process.exit(1); }

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'zarok');
const OUT = path.join(ROOT, 'dist-zarok');
fs.rmSync(OUT, { recursive: true, force: true });
(function copy(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const f of fs.readdirSync(src)) {
    const s = path.join(src, f), d = path.join(dst, f);
    fs.statSync(s).isDirectory() ? copy(s, d) : fs.copyFileSync(s, d);
  }
})(SRC, OUT);
fs.copyFileSync(path.join(ROOT, 'app', 'lang-pack.js'), path.join(OUT, 'lang-pack.js'));
fs.copyFileSync(path.join(ROOT, 'kvkk.html'), path.join(OUT, 'kvkk.html'));
fs.writeFileSync(path.join(OUT, 'CNAME'), domain + '\n');

const edit = (file, pairs) => {
  const p = path.join(OUT, file); let s = fs.readFileSync(p, 'utf8');
  for (const [a, b] of pairs) { if (!s.includes(a)) { console.error('✗ bulunamadı (' + file + '): ' + a); process.exit(1); } s = s.split(a).join(b); }
  fs.writeFileSync(p, s);
};
edit('index.html', [
  ['<script src="../app/lang-pack.js"></script>', '<script src="lang-pack.js"></script>'],
  ['href="../kvkk.html"', 'href="kvkk.html"'],
  ['href="../"', 'href="' + main + '/"'],
]);
edit('app/index.html', [
  ['<script src="../../app/lang-pack.js"></script>', '<script src="../lang-pack.js"></script>'],
  ['const MAIN_APP = "../../app/";', 'const MAIN_APP = "' + main + '/app/";'],
  ['const KVKK = "../../kvkk.html";', 'const KVKK = "../kvkk.html";'],
]);
edit('kvkk.html', [['<a class="back" href="./">', '<a class="back" href="' + main + '/">']]);

console.log('✓ dist-zarok/ hazır → https://' + domain + '/  (veli uygulaması: https://' + domain + '/app/)');
console.log('Sonraki adımlar (ZAROK.md):');
console.log('  1) DNS: ' + domain + '  CNAME  akademiyaramtigran.github.io');
console.log('  2) dist-zarok/ içeriğini ayrı depoya yükle, Pages → Custom domain = ' + domain + ' → Enforce HTTPS');
console.log('  3) Firebase Console → Authentication → Settings → Authorized domains → ' + domain + ' ekle');
console.log('  4) Ana uygulamada ZAROK_APP_URL ve sitedeki /zarok/ bağlantılarını https://' + domain + '/ yap');
