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

// E2E: Sekme çubuğu (Seg) dar telefonda (360 px): 3+ sekme simge üstte/metin altta, taşma ve üst üste binme yok; rozet metinle çakışmaz
(async () => {
  const goA = (pg, k) => pg.evaluate(k => document.querySelector('.pano-tile[data-key="' + k + '"],.sm-it[data-key="' + k + '"]').click(), k);
  await put('idx_staff/96000001', { no: '96000001', lvl: 'head', area: 'tiyatro' }); await put('teachers/TH', { id: 'TH', no: '96000001', name: 'Berpirsa Şanoyê', isHead: true, area: 'tiyatro' }); await signUp('96000001@ogretmen.aat', 'Head12345');
  await put('messages/M1', { toRole: 'head', toArea: 'tiyatro', fromRole: 'student', from: 'Rojîn', text: 'Silav', subject: 'Test', read: false, date: new Date().toISOString() });
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined }); const errs = [];
  const c = await b.newContext({ viewport: { width: 360, height: 780 } }); await routes(c);
  await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} });
  const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
  await p.getByText('Mamoste', { exact: true }).first().click();
  await p.locator('input.inp').first().fill('96000001'); await p.locator('input[type=password]').first().fill('Head12345');
  await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(8000);
  await goA(p, 'messages'); await p.waitForTimeout(2500);
  const m = await p.evaluate(() => [...document.querySelectorAll('.c-seg')].filter(e => e.getClientRects().length).map(seg => { const bs = [...seg.querySelectorAll('.c-seg-b')].map(b => { const r = b.getBoundingClientRect(); return { l: r.left, r: r.right, w: r.width, h: r.height, over: b.scrollWidth - b.clientWidth, txt: b.innerText.replace(/\s+/g, ' ') }; }); return { many: seg.classList.contains('many'), n: bs.length, bs }; }));
  const seg4 = m.find(x => x.n >= 4);
  ok('4 sekmeli çubuk bulundu ve "many" düzeninde (simge üstte)', !!seg4 && seg4.many, JSON.stringify(m.map(x => [x.n, x.many])));
  ok('Hiçbir sekmede içerik taşmıyor', !!seg4 && seg4.bs.every(x => x.over <= 1), JSON.stringify(seg4 && seg4.bs.map(x => x.over)));
  ok('Sekmeler yan yana, birbirinin üstüne binmiyor', !!seg4 && seg4.bs.every((x, i, a) => i === 0 || x.l >= a[i - 1].r - 1));
  ok('Sekme yükseklikleri dengeli (hepsi 90 px altında, eşit)', !!seg4 && seg4.bs.every(x => x.h < 90) && Math.max(...seg4.bs.map(x => x.h)) - Math.min(...seg4.bs.map(x => x.h)) < 2, JSON.stringify(seg4 && seg4.bs.map(x => Math.round(x.h))));
  await p.screenshot({ path: process.env.SEG_SHOT || '/tmp/sekme.png' });
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
