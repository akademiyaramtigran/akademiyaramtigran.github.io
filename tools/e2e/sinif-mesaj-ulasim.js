// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Sınıfa giden mesaj HER öğrencinin gelen kutusuna düşer (sorumlu + sınıf öğretmeni)
// (eski açıklama) Ana akademi sınıfları — alan sınıfı + ders programı, genel sınıf (tüm alanlardan),
//      atölye (aç → öğrenci/öğretmen ata → yoklama → kapat), öğrenci/öğretmen görünürlüğü, rapor filtresi
const { chromium } = require('playwright-core');
const fs = require('fs');
const FBV = require('firebase/package.json').version;
const P = 'aram2026-a9fd7';
const NM = require('path').dirname(require.resolve('firebase/package.json')) + '/../';
const FS = `http://127.0.0.1:8080/v1/projects/${P}/databases/(default)/documents`;
const H = { 'Content-Type': 'application/json', 'Authorization': 'Bearer owner' };
const val = v => v instanceof Date ? { timestampValue: v.toISOString() } : typeof v === 'number' ? { integerValue: String(v) } : Array.isArray(v) ? { arrayValue: { values: v.map(val) } } : typeof v === 'boolean' ? { booleanValue: v } : { stringValue: String(v) };
const put = (path, obj) => fetch(`${FS}/${path}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, val(v)])) }) }).then(r => { if (!r.ok) throw new Error('seed ' + path + ' ' + r.status); });
const enc = v => v === null ? { nullValue: null } : typeof v === 'number' ? { integerValue: String(v) } : typeof v === 'boolean' ? { booleanValue: v } : v instanceof Date ? { timestampValue: v.toISOString() } : { stringValue: String(v) };
const putO = (path, o) => fetch(`${FS}/${path}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, enc(v)])) }) }).then(r => { if (!r.ok) throw new Error('seed ' + path + ' ' + r.status); });
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
const goA = (pg, k) => pg.evaluate(k => document.querySelector('.pano-tile[data-key="' + k + '"],.sm-it[data-key="' + k + '"]').click(), k);
(async () => {
  const N = 6; const nos = Array.from({ length: N }, (_, i) => '2020260' + (i + 1));
  await put('idx_staff/96000001', { no: '96000001', lvl: 'head', area: 'tiyatro' }); await put('teachers/H1', { id: 'H1', no: '96000001', name: 'Berpirsa Şanoyê', area: 'tiyatro', isHead: true }); await signUp('96000001@ogretmen.aat', 'Head1234');
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' }); await put('teachers/T1', { id: 'T1', no: '50202601', name: 'Mamoste Şano', area: 'tiyatro' }); await signUp('50202601@ogretmen.aat', 'Tea12345');
  const names = ['Halit Aslan', 'Ömer Akkan', 'Rojîn Aram', 'Baran Şêx', 'Dilan Kar', 'Azad Can'];
  for (let i = 0; i < N; i++) { await put('idx_students/' + nos[i], { no: nos[i], area: 'tiyatro' }); await put('students/S' + (i + 1), { no: nos[i], name: names[i], area: 'tiyatro', fireId: 'S' + (i + 1), id: 100 + i }); await signUp(nos[i] + '@ogrenci.aat', 'Stu12345'); }
  await put('classes/C1', { kind: 'area', name: '1. Sînif', area: 'tiyatro', studentNos: nos, teacherNos: ['50202601'] });
  await put('schedule/L1', { id: 'L1', fireId: 'L1', area: 'tiyatro', classId: 'C1', name: 'Şano', day: 'Înî', start: '10:00', end: '11:00', teacherNo: '50202601', teacherName: 'Mamoste Şano', lessonType: 'main' });
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined }); const errs = [];
  const mk = async () => { const c = await b.newContext({ viewport: { width: 430, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} }); return c; };
  const login = async (role, no, pw) => {
    const p = await (await mk()).newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/app/?emu=1&dvcut=2000-01-01'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
    await p.getByText(role, { exact: true }).first().click();
    await p.locator('input.inp').first().fill(no); await p.locator('input[type=password]').first().fill(pw);
    await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(7000); return p; };
  const msgs = async () => ((await fetch(`${FS}/messages?pageSize=200`, { headers: H }).then(r => r.json())).documents || []);
  const sv = d => Object.fromEntries(Object.entries(d.fields).map(([k, v]) => [k, v.stringValue !== undefined ? v.stringValue : v.integerValue !== undefined ? v.integerValue : v.booleanValue]));
  const rcpPick = async (pg, root, match) => { const types = await pg.evaluate(r => [...document.querySelectorAll(r + ' [data-rcp-type]')].map(x => x.dataset.rcpType), root);
    for (const ty of types) { await pg.evaluate(([r, t]) => document.querySelector(r + ' [data-rcp-type="' + t + '"]').click(), [root, ty]); await pg.waitForTimeout(150);
      const k = await pg.evaluate(([r, m]) => { const e = [...document.querySelectorAll(r + ' [data-rcp-item]')].find(x => x.dataset.rcpItem === m || x.textContent.includes(m)); if (e) { e.click(); return true; } return false; }, [root, match]); if (k) return true; } return false; };
  // 1) Sorumlu bütün sınıfa mesaj yazar
  const hp = await login('Mamoste', '96000001', 'Head1234');
  await goA(hp, 'messages'); await hp.waitForTimeout(1200);
  await hp.evaluate(() => [...document.querySelectorAll('button')].find(x => x.textContent.includes('Peyamek Nû')).click()); await hp.waitForTimeout(500);
  await rcpPick(hp, '[data-head-to]', 'cls_C1'); await hp.waitForTimeout(300);
  await hp.locator('#hm-subject').fill('Sorumlu sinif mesaji'); await hp.locator('#hm-body').fill('Silav');
  await hp.evaluate(() => [...document.querySelectorAll('button')].filter(x => x.textContent.includes('Bişîne') && x.offsetParent).pop().click()); await hp.waitForTimeout(6000);
  let m = (await msgs()).map(sv).filter(x => x.subject === 'Sorumlu sinif mesaji');
  ok('Sorumlu: sınıftaki ' + N + ' öğrencinin hepsine ayrı kayıt yazıldı', m.length === N && new Set(m.map(x => x.recipientNo)).size === N, m.length + ' kayıt');
  // 2) Her öğrenci kendi hesabıyla girince mesajı gelen kutusunda görür
  const missing = [];
  for (let i = 0; i < N; i++) {
    const sp = await login('Xwendekar', nos[i], 'Stu12345');
    await goA(sp, 'messages'); await sp.waitForTimeout(2500);
    const has = (await sp.evaluate(() => document.body.innerText)).includes('Sorumlu sinif mesaji');
    if (!has) missing.push(names[i]);
    await sp.context().close();
  }
  ok('Sınıftaki her öğrenci mesajı gelen kutusunda görür', missing.length === 0, 'görmeyen: ' + (missing.join(', ') || '—'));
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
