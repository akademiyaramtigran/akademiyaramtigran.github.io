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

// E2E: Öğrenci İşleri → Çocuk Akademisi → Öğretmenler: ana akademi öğretmenini listeden seçip bağlama
(async () => {
  await put('idx_staff/98202601', { no: '98202601', lvl: 'registrar' });
  await put('teachers/TR', { id: 'TR', no: '98202601', name: 'Karûbar', isRegistrar: true, area: 'genel' });
  await signUp('98202601@ogretmen.aat', 'Reg12345');
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' });
  await put('teachers/T50', { id: 'T50', no: '50202601', name: 'Mamoste Şano', email: 'sano@x.org', area: 'tiyatro' });
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } }); await routes(c);
  await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} });
  const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
  await p.getByText('Mamoste', { exact: true }).first().click();
  await p.locator('input.inp').first().fill('98202601'); await p.locator('input[type=password]').first().fill('Reg12345');
  await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(7000);
  const goA = k => p.evaluate(k => document.querySelector('.pano-tile[data-key="' + k + '"],.sm-it[data-key="' + k + '"]').click(), k);
  await goA('zarok'); await p.waitForTimeout(1500);
  await p.evaluate(() => [...document.querySelectorAll('button')].filter(x => x.offsetParent && /Mamoste|Teachers/.test(x.textContent)).find(x => x.getBoundingClientRect().top < 400 && x.textContent.trim().length < 20).click()); await p.waitForTimeout(800);
  await p.evaluate(() => [...document.querySelectorAll('button')].filter(x => x.offsetParent && x.textContent.includes('Mamoste Tescîl Bike'))[0].click()); await p.waitForTimeout(600);
  const sel = p.locator('select').filter({ has: p.locator('option', { hasText: 'Mamoste Şano · 50202601' }) });
  ok('Ana akademi öğretmeni açılır menüde listelenir', (await sel.count()) === 1);
  await sel.selectOption('50202601'); await p.waitForTimeout(400);
  ok('Seçince ad otomatik dolar', (await p.locator('input[value="Mamoste Şano"]').count()) >= 1);
  await p.evaluate(() => [...document.querySelectorAll('button')].filter(x => x.offsetParent && x.textContent.includes('Tomar bike')).pop().click()); await p.waitForTimeout(2500);
  const kt = await fetch(`${FS}/kidTeachers/50202601`, { headers: H }).then(r => r.json());
  ok('kidTeachers kaydı academy:true ile açıldı', kt.fields && kt.fields.academy && kt.fields.academy.booleanValue === true, JSON.stringify(kt.fields && Object.keys(kt.fields)));
  const ix = await fetch(`${FS}/idx_kidstaff/50202601`, { headers: H }).then(r => r.status);
  ok('idx_kidstaff kaydı açıldı', ix === 200);
  await p.evaluate(() => [...document.querySelectorAll('button')].filter(x => x.offsetParent && x.textContent.includes('Mamoste Tescîl Bike'))[0].click()); await p.waitForTimeout(600);
  ok('Bağlı öğretmen menüde tekrar çıkmaz', (await p.locator('option', { hasText: 'Mamoste Şano · 50202601' }).count()) === 0);
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
