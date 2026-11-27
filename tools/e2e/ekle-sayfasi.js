// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Haftalık değerlendirme + öğretmen kartları — öğretmen öğrencilerini değerlendirir (hatırlatma), yalnız kendi
//      sınıfına dosyasız duyuru gönderir, Sınıfım = ödev/belge + mesaj; öğrenci öğretmenini isimsiz değerlendirir;
//      sorumlu raporlarda iki değerlendirmeyi ve anketi görür; yöneticide öğrenci ayrıntısında gerçek haftalık grafik;
//      öğrenci işlerinde rapor yok.
const { chromium } = require('playwright-core');
const fs = require('fs');
const FBV = require('firebase/package.json').version;
const P = 'aram2026-a9fd7';
const NM = require('path').dirname(require.resolve('firebase/package.json')) + '/../';
const FS = `http://127.0.0.1:8080/v1/projects/${P}/databases/(default)/documents`;
const H = { 'Content-Type': 'application/json', 'Authorization': 'Bearer owner' };
const val = v => v instanceof Date ? { timestampValue: v.toISOString() } : typeof v === 'number' ? { integerValue: String(v) } : Array.isArray(v) ? { arrayValue: { values: v.map(val) } } : typeof v === 'boolean' ? { booleanValue: v } : { stringValue: String(v) };
const put = (path, obj) => fetch(`${FS}/${path}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, val(v)])) }) }).then(r => { if (!r.ok) throw new Error('seed ' + path + ' ' + r.status); });
const list = col => fetch(`${FS}/${col}?pageSize=100`, { headers: H }).then(r => r.json()).then(j => j.documents || []);
const signUp = (email, password) => fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=x', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) }).then(r => r.json());
const LOCAL = { 'react.production.min.js': 'react/umd/react.production.min.js', 'react-dom.production.min.js': 'react-dom/umd/react-dom.production.min.js', 'babel.min.js': '@babel/standalone/babel.min.js' };
async function routes(ctx) {
  await ctx.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, route => {
    const u = route.request().url();
    const m = u.match(/gstatic\.com\/firebasejs\/([\d.]+)\/(firebase-[a-z-]+\.js)$/);
    if (m) {
      if (m[1] !== FBV) return route.fulfill({ contentType: 'application/javascript', body: `export * from "https://www.gstatic.com/firebasejs/${FBV}/${m[2]}";` });
      return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + 'firebase/' + m[2]) });
    }
    const f = Object.keys(LOCAL).find(k => u.endsWith('/' + k));
    if (f) return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + LOCAL[f]) });
    return route.abort();
  });
}

// E2E: "Ana ekrana ekle" sayfası (zarok/app/ekle.html): cihazı tanır — iPhone: 3 adım; uygulama içi tarayıcı: Safari uyarısı; Android: tek dokunuşluk düğme; bilgisayar: telefon için QR; dil seçimi
(async () => {
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined }); const errs = [];
  const URL_ = 'http://localhost:8765/zarok/app/ekle.html';
  const page = async (ua, extra) => { const c = await b.newContext(Object.assign({ userAgent: ua, viewport: { width: 390, height: 800 } }, extra || {})); await routes(c);
    const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto(URL_); await p.waitForSelector('#view *', { timeout: 15000 }); return p; };
  const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
  const FB = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/430.0]';
  const AND = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
  const DESK = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  let p = await page(IOS);
  ok('iPhone Safari: 3 adımlı anlatım (Paylaş → Ana Ekrana Ekle → Ekle)', (await p.locator('[data-state="ios"] .steps li').count()) === 3 && (await p.locator('[data-state="ios-inapp"]').count()) === 0);
  ok('iPhone: bağlantıyı kopyala düğmesi var', (await p.locator('#copy').count()) === 1);
  await p.click('[data-l="tr"]'); await p.waitForTimeout(300);
  const trTxt = await p.evaluate(() => document.body.innerText);
  ok('Dil seçimi: Türkçe adımlar ("Ana Ekrana Ekle")', trTxt.includes('Ana Ekrana Ekle') && trTxt.includes('Paylaş'));
  await p.click('[data-l="en"]'); await p.waitForTimeout(300);
  ok('Dil seçimi: İngilizce', (await p.evaluate(() => document.body.innerText)).includes('Add to Home Screen'));
  await p.context().close();
  p = await page(FB);
  ok('iPhone uygulama içi tarayıcı (Facebook/Instagram…): "Safari\'de aç" uyarısı + kopyala', (await p.locator('[data-state="ios-inapp"]').count()) === 1 && (await p.locator('#copy').count()) === 1);
  await p.context().close();
  p = await page(AND);
  ok('Android: yükleme olayı gelmeden adım yolu görünür (Chrome menüsü)', (await p.locator('[data-state="android"]').count()) === 1 && (await p.locator('#inst').count()) === 0);
  await p.evaluate(() => { const e = new Event('beforeinstallprompt'); e.prompt = () => { window.__prompted = 1; }; e.userChoice = Promise.resolve({ outcome: 'accepted' }); window.dispatchEvent(e); });
  await p.waitForSelector('#inst', { timeout: 5000 });
  ok('Android: yükleme hazır olunca tek dokunuşluk "Ana ekrana ekle" düğmesi çıkar', (await p.locator('[data-state="android-prompt"]').count()) === 1);
  await p.click('#inst'); await p.waitForTimeout(500);
  ok('Android: düğme sistemin yükleme penceresini açar (prompt çağrıldı)', (await p.evaluate(() => window.__prompted)) === 1);
  await p.context().close();
  p = await page(DESK, { viewport: { width: 1200, height: 800 } });
  ok('Bilgisayar: telefon için QR gösterir', (await p.locator('[data-state="desktop"] #qr canvas, [data-state="desktop"] #qr img').count()) >= 1);
  await p.context().close();
  const m = await (await fetch(URL_.replace('ekle.html', 'manifest.webmanifest'))).json();
  ok('Manifest yeni ikonları gösterir ve yükleme sayfasıyla aynı kapsamda', m.icons.every(i => /-v2-/.test(i.src)) && m.scope === './' && m.start_url.startsWith('./'));
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
