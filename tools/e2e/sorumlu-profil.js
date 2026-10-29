// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Sorumlu profili — bölüm sorumlusu, genel sorumlu ve çocuk akademisi sorumlusu "Profîl" ekranını görür,
//      profil bilgisini düzenler ve şifresini değiştirir; yeni şifreyle giriş yapılır, eski şifre reddedilir
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
(async () => {
  const HEADS = [['96000001', 'tiyatro', 'Berpirsa Şanoyê', 'Berpirsê Beşê'], ['96000002', 'genel', 'Berpirsê Giştî', 'Berpirsê Giştî'], ['96000003', 'solfej', 'Berpirsa Zarokan', 'Akademiya Zarokan']];
  for (const [no, area, name] of HEADS) {
    await put('idx_staff/' + no, { no, lvl: 'head', area });
    await put('teachers/H' + no, { id: 'H' + no, no, name, area, isHead: true });
    await signUp(no + '@ogretmen.aat', 'Head1234');
  }
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const mk = async (w) => { const c = await b.newContext({ viewport: { width: w || 1280, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} }); return c; };
  const login = async (ctx, no, pw) => {
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
    await p.getByText('Mamoste', { exact: true }).first().click();
    await p.locator('input.inp').first().fill(no); await p.locator('input[type=password]').first().fill(pw);
    await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(7000); return p;
  };
  const txt = p => p.evaluate(() => document.body.innerText);
  const goA = (pg, k) => pg.evaluate(k => document.querySelector('.pano-tile[data-key="' + k + '"],.sm-it[data-key="' + k + '"]').click(), k);
  const btn = (p, t) => p.evaluate(t => { const e = [...document.querySelectorAll('button')].filter(x => x.offsetParent && x.textContent.includes(t)).pop(); if (!e) throw new Error('düğme yok: ' + t); e.click(); }, t);

  for (const [no, area, name, role] of HEADS) {
    const w = area === 'genel' ? 430 : 1280;
    const p = await login(await mk(w), no, 'Head1234');
    const has = await p.evaluate(() => !!document.querySelector('.sm-it[data-key="profile"],.pano-tile[data-key="profile"]'));
    ok(name + ': menüde "Profîl" var', has);
    await goA(p, 'profile'); await p.waitForTimeout(800);
    const t1 = await txt(p);
    ok(name + ': profil ekranı (ad, numara, rol)', (await p.locator('[data-staff-profile]').count()) === 1 && t1.includes(name) && t1.includes(no) && t1.includes(role));
    // Profil düzenle: telefon
    await p.click('[data-staff-edit]'); await p.waitForTimeout(500);
    const tel = p.locator('input[type=tel]').last();
    if (await tel.count()) { await tel.fill('0555 111 22 ' + no.slice(-2)); await btn(p, 'Tomar'); await p.waitForTimeout(2500); }
    const doc = await fetch(`${FS}/teachers/H${no}`, { headers: H }).then(r => r.json());
    ok(name + ': telefon kaydedildi, rol alanları aynı', doc.fields && doc.fields.phone && doc.fields.phone.stringValue.endsWith(no.slice(-2)) && doc.fields.isHead.booleanValue === true && doc.fields.area.stringValue === area);
    // Şifre değiştir
    await p.click('[data-staff-pass]'); await p.waitForTimeout(500);
    const pw = p.locator('input[type=password]');
    await pw.nth(0).fill('Head1234'); await pw.nth(1).fill('Yeni5678'); await pw.nth(2).fill('Yeni5678');
    await btn(p, 'Şîfre Tomar Bike');
    const done = await p.waitForFunction(() => document.body.innerText.includes('Şîfre hate guhertin'), null, { timeout: 8000 }).then(() => true, () => false);
    ok(name + ': "Şîfre hate guhertin"', done); await p.waitForTimeout(2000);
    const r = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=x', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: no + '@ogretmen.aat', password: 'Yeni5678', returnSecureToken: true }) }).then(r => r.json());
    const r0 = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=x', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: no + '@ogretmen.aat', password: 'Head1234', returnSecureToken: true }) }).then(r => r.json());
    ok(name + ': yeni şifre geçerli, eski şifre reddedilir', !!r.idToken && !r0.idToken);
    await p.context().close();
  }
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
