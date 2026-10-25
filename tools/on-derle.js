// Ön derleme — yalnızca yayın sırasında (GitHub Actions) çalışır, depodaki dosyayı değiştirmez.
//  app/index.html içindeki JSX kaynağını (script#aat-src) Babel ile BİR KEZ derler ve
//  app/app.<özet>.js olarak yazar; sayfadaki kaynak bloğu ve tarayıcıda derleme yükleyicisi
//  bu dosyayı yükleyen tek bir <script> ile değiştirilir.
//  Böylece telefon açılışta 2,9 MB'lık Babel'i indirmez ve derleme yapmaz (açılış: saniyeler).
//  Kullanım: node tools/on-derle.js            (depo kökünde; yerinde değiştirir — yalnızca CI kopyasında)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'app', 'index.html');
let html = fs.readFileSync(file, 'utf8');

const OPEN = '<script type="text/x-aat-jsx" id="aat-src">';
const a = html.indexOf(OPEN);
if (a < 0) { console.error('aat-src bulunamadı'); process.exit(1); }
const b = html.indexOf('</script>', a);
const src = html.slice(a + OPEN.length, b);

// Tarayıcıdaki yükleyiciyle aynı Babel sürümü ve ayarı (app/vendor/babel.min.js)
const Babel = require(path.join(root, 'app', 'vendor', 'babel.min.js'));
const js = Babel.transform(src, { presets: ['react'] }).code;
// Kaynakta </script> geçmesin (satır içi değil ama tedbir)
const hash = crypto.createHash('sha256').update(js).digest('hex').slice(0, 12);
const name = 'app.' + hash + '.js';
fs.writeFileSync(path.join(root, 'app', name), js);

// Kaynak bloğunu kaldır
html = html.slice(0, a) + html.slice(b + '</script>'.length);
// Tarayıcıda derleme yükleyicisini (DERLEME ÖNBELLEĞİ) ön derlenmiş dosyayla değiştir
const L = html.indexOf('/* ── DERLEME ÖNBELLEĞİ');
if (L < 0) { console.error('yükleyici bulunamadı'); process.exit(1); }
const ls = html.lastIndexOf('<script>', L), le = html.indexOf('</script>', L) + '</script>'.length;
html = html.slice(0, ls) + '<script src="' + name + '"></script>' + html.slice(le);
fs.writeFileSync(file, html);

// Service worker önbellek sürümüne özeti ekle: yeni sürüm mutlaka yeni dosyayı alsın
const sw = path.join(root, 'app', 'sw.js');
const swSrc = fs.readFileSync(sw, 'utf8').replace(/const CACHE = '([^']+)';/, (m, c) => "const CACHE = '" + c + "-" + hash + "';");
fs.writeFileSync(sw, swSrc);

console.log('✓ ön derleme:', name, (js.length / 1024).toFixed(0) + ' KB', '· index.html', (html.length / 1024).toFixed(0) + ' KB');
