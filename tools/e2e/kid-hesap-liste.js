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

// E2E: Çocuk Akademisi — hesap listeleri: çocuk kartından veli şifresini KENDİ yazdığın şifreyle değiştir; "Dêûbav" sekmesinde listeler (CSV/PDF düğmeleri) ve toplu şifre yenileme + indirme
const login = (email, password) => fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=x', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) }).then(r => r.json());
(async () => {
  await put('idx_staff/98202601', { no: '98202601', lvl: 'registrar' }); await put('teachers/TR', { id: 'TR', no: '98202601', name: 'Öğrenci İşleri', isRegistrar: true, area: 'genel' }); await signUp('98202601@ogretmen.aat', 'Reg12345');
  await put('kidTeachers/72026001', { no: '72026001', name: 'Hesen Soyad', academy: true }); await put('idx_kidstaff/72026001', { no: '72026001' });
  const KIDS = [['82026001', 'Ada Bir'], ['82026002', 'Bera Iki'], ['82026003', 'Ceren Uc']];
  for (const [no, name] of KIDS) { await signUp(no + '@veli.aat', 'Eski12345'); await put('guardians/' + no, { no, name }); await put('idx_guardians/' + no, { no }); await put('kids/K' + no, { no, name, area: 'zarok', guardianNos: [no] }); }
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } }); await routes(c);
  await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} });
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', d => d.type() === 'prompt' ? d.accept(globalThis.__PW || '') : d.accept());
  await p.goto('http://localhost:8765/app/?emu=1&dvcut=2000-01-01'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
  await p.getByText('Mamoste', { exact: true }).first().click();
  await p.locator('input.inp').first().fill('98202601'); await p.locator('input[type=password]').first().fill('Reg12345');
  await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(8000);
  await p.evaluate(() => [...document.querySelectorAll('.sm-it[data-key="zarok"],.pano-tile[data-key="zarok"]')].find(x => x.getClientRects().length).click()); await p.waitForTimeout(2500);
  const tab = re => p.evaluate(s => { const r = new RegExp(s); [...document.querySelectorAll('button')].find(b => r.test(b.textContent.trim()) && b.offsetParent).click(); }, re.source);
  const waitFor = async (f, ms) => { const t0 = Date.now(); for (;;) { const r = await f(); if (r) return r; if (Date.now() - t0 > (ms || 40000)) return null; await new Promise(r => setTimeout(r, 1000)); } };
  // 1) Çocuk kartında 🔑 — kendi şifreni yaz
  await tab(/Zarok$/); await p.waitForTimeout(1500);
  const nKeys = await p.evaluate(() => document.querySelectorAll('[data-kid-pw]').length);
  ok('Her çocuk kartında veli şifresi (🔑) düğmesi var', nKeys === 3, String(nKeys));
  globalThis.__PW = 'Benim12345';
  await p.evaluate(() => document.querySelector('[data-kid-pw="82026001"]').click());
  const l1 = await waitFor(async () => (await login('82026001@veli.aat', 'Benim12345')).idToken, 30000);
  ok('Yazdığın şifreyle veli girer (Ada Bir)', !!l1);
  ok('Eski şifre artık çalışmaz', !!(await login('82026001@veli.aat', 'Eski12345')).error);
  // kısa şifre reddedilir
  globalThis.__PW = 'kisa';
  await p.waitForTimeout(1500); await p.evaluate(() => document.querySelector('[data-kid-pw="82026002"]').click()); await p.waitForTimeout(1500);
  ok('Kısa şifre kabul edilmez (hesap değişmez)', !!(await login('82026002@veli.aat', 'Eski12345')).idToken);
  // 2) Dêûbav sekmesi: listeler + toplu yenileme
  globalThis.__PW = '';
  await tab(/Dêûbav$/); await p.waitForTimeout(1200);
  await p.evaluate(() => { document.querySelector('[data-kid-acc-lists]').open = true; }); await p.waitForTimeout(300);
  const has = await p.evaluate(() => !!document.querySelector('[data-acc-list-csv]') && !!document.querySelector('[data-acc-list-pdf]') && !!document.querySelector('[data-acc-reset-all]'));
  ok('Liste düğmeleri (Excel + PDF) ve toplu şifre yenileme düğmesi var', has);
  await p.evaluate(() => document.querySelector('[data-acc-reset-all]').click());
  const done = await waitFor(() => p.evaluate(() => { const e = document.querySelector('[data-acc-done]'); return e ? e.dataset.accDone : null; }), 60000);
  ok('Toplu yenileme: 3 veli hesabı için liste çıktı', done === '3', String(done));
  ok('Toplu yenilemeden sonra eski şifre (Ceren) çalışmaz', !!(await login('82026003@veli.aat', 'Eski12345')).error);
  ok('İndirme düğmeleri (CSV + PDF) görünür', await p.evaluate(() => !!document.querySelector('[data-acc-csv]') && !!document.querySelector('[data-acc-pdf]')));
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
