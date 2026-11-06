// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Ana akademi sınıfları — alan sınıfı + ders programı, genel sınıf (tüm alanlardan),
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
const clickText = (p, text, top) => p.evaluate(([t, top]) => {
  if (top) { const mv = [...document.querySelectorAll('.sm-it,.pano-tile')].filter(x => x.getClientRects().length); const m = mv.find(x => x.textContent.trim() === t) || mv.find(x => x.textContent.includes(t)); if (m) { m.click(); return; } }
  const ok = x => { const r = x.getBoundingClientRect(); return r.width > 0 && (!top || (r.top > 60 && r.top < 260)); };
  // Önce ekrandaki, yoksa yatay şeritte kaymış olanı al (kapalı yan menüdeki kopyalar -left ile elenir)
  const b = [...document.querySelectorAll('button')].filter(x => x.textContent.includes(t) && x.offsetParent !== null && ok(x))
    .sort((a, c) => (a.getBoundingClientRect().left < -200) - (c.getBoundingClientRect().left < -200))[0];
  if (!b) throw new Error('düğme yok: ' + t); b.scrollIntoView({ inline: 'center', block: 'nearest' }); b.click();
}, [text, top]);

const goA = (pg, k) => pg.evaluate(k => document.querySelector('.pano-tile[data-key="' + k + '"],.sm-it[data-key="' + k + '"]').click(), k);
(async () => {
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' }); await put('teachers/TA', { id: 'TA', no: '50202601', name: 'Mamoste Şano', area: 'tiyatro' }); await signUp('50202601@ogretmen.aat', 'Tea12345');
  await put('idx_staff/50202602', { no: '50202602', lvl: 'teacher' }); await put('teachers/TB', { id: 'TB', no: '50202602', name: 'Mamoste Drama', area: 'tiyatro' }); await signUp('50202602@ogretmen.aat', 'Tea12345');
  await put('idx_staff/96000002', { no: '96000002', lvl: 'head', area: 'genel' }); await put('teachers/HG', { id: 'HG', no: '96000002', name: 'Berpirsê Giştî', area: 'genel', isHead: true }); await signUp('96000002@ogretmen.aat', 'Head1234');
  await put('idx_students/20202601', { no: '20202601' }); await put('students/S1', { no: '20202601', name: 'Rojîn Aram', area: 'tiyatro', fireId: 'S1' });
  await put('idx_students/20202602', { no: '20202602' }); await put('students/S2', { no: '20202602', name: 'Baran Şêx', area: 'tiyatro', fireId: 'S2' });
  await put('classes/C1', { kind: 'area', name: '1. Sînif', area: 'tiyatro', studentNos: ['20202601', '20202602'], teacherNos: ['50202601'], teacherNames: ['Mamoste Şano'] });
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const mk = async (w) => { const c = await b.newContext({ viewport: { width: w || 1280, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} }); return c; };
  const login = async (no, pw, w) => {
    const p = await (await mk(w)).newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
    await p.getByText('Mamoste', { exact: true }).first().click();
    await p.locator('input.inp').first().fill(no); await p.locator('input[type=password]').first().fill(pw);
    await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(7000); return p;
  };
  const goA = (pg, k) => pg.evaluate(k => document.querySelector('.pano-tile[data-key="' + k + '"],.sm-it[data-key="' + k + '"]').click(), k);
  const msgs = async () => ((await fetch(`${FS}/messages?pageSize=50`, { headers: H }).then(r => r.json())).documents || []);
  const ta = await login('50202601', 'Tea12345', 430);
  // 1) Ödev: tek sınıflı öğretmende "Hemû sinif / Xwendekarên taybet" seçimi hemen görünür; öğrenciye özel gönderim
  await goA(ta, 'myclass'); await ta.waitForTimeout(1500);
  ok('Tek sınıflı öğretmende "kime" seçimi (tüm sınıf / seçilen öğrenciler) hemen görünür', (await ta.locator('[data-post-to]').count()) === 1);
  await ta.click('[data-to="pick"]'); await ta.waitForTimeout(400);
  await ta.locator('[data-pick-st="20202601"] input').check();
  await ta.locator('input[placeholder="Sernav"]').fill('Ödeva taybet'); await ta.locator('textarea').first().fill('Tenê ji Rojînê re');
  await ta.evaluate(() => [...document.querySelectorAll('button')].filter(x => x.textContent.includes('Bişîne') && x.offsetParent).pop().click()); await ta.waitForTimeout(2000);
  const cp = ((await fetch(`${FS}/classPosts?pageSize=20`, { headers: H }).then(r => r.json())).documents || []).find(d => d.fields.title && d.fields.title.stringValue === 'Ödeva taybet');
  ok('Öğrenciye özel ödev kaydedildi (yalnız Rojîn)', !!cp && JSON.stringify(cp.fields.studentNos || {}).includes('20202601') && !JSON.stringify(cp.fields.studentNos || {}).includes('20202602'));
  // 2) Mesaj: bölüm öğretmeni + genel sorumlu
  await ta.click('[data-hub-tab="messages"]'); await ta.waitForTimeout(800);
  await ta.evaluate(() => [...document.querySelectorAll('button')].find(x => x.textContent.includes('Peyamek Nû')).click()); await ta.waitForTimeout(500);
  const opts = await ta.evaluate(() => { const s = [...document.querySelectorAll('select')].find(x => [...x.options].some(o => o.value === 'admin')); return s ? [...s.options].map(o => o.value + '|' + o.textContent) : []; });
  ok('Alıcılar: yönetici, bölüm sorumlusu, genel sorumlu, bölüm öğretmeni', opts.some(o => o.startsWith('admin|')) && opts.some(o => o.startsWith('head|')) && opts.some(o => o.startsWith('genhead|')) && opts.some(o => /^c_.*Mamoste Drama/.test(o)), opts.join(' ; '));
  const sendTo = async (val, subj) => {
    await ta.evaluate(v => { const s = [...document.querySelectorAll('select')].find(x => [...x.options].some(o => o.value === 'admin')); const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set; set.call(s, v); s.dispatchEvent(new Event('change', { bubbles: true })); }, val);
    await ta.locator('input[placeholder="Sernav..."]').fill(subj); await ta.locator('textarea').first().fill('Silav');
    await ta.evaluate(() => [...document.querySelectorAll('button')].filter(x => x.textContent.includes('Bişîne') && x.offsetParent).pop().click()); await ta.waitForTimeout(2200);
  };
  const colVal = opts.find(o => /^c_.*Mamoste Drama/.test(o)).split('|')[0];
  await sendTo(colVal, 'Ji bo hevalê beşê');
  await ta.evaluate(() => [...document.querySelectorAll('button')].find(x => x.textContent.includes('Peyamek Nû')).click()); await ta.waitForTimeout(500);
  await sendTo('genhead', 'Ji bo berpirsê giştî');
  const ms = await msgs();
  const m1 = ms.find(d => d.fields.subject && d.fields.subject.stringValue === 'Ji bo hevalê beşê'), m2 = ms.find(d => d.fields.subject && d.fields.subject.stringValue === 'Ji bo berpirsê giştî');
  ok('Bölüm öğretmenine mesaj kaydedildi (toTeacherNo)', !!m1 && m1.fields.toTeacherNo.stringValue === '50202602' && m1.fields.toRole.stringValue === 'teacher');
  ok('Genel sorumluya mesaj kaydedildi (toRole head, toArea genel)', !!m2 && m2.fields.toRole.stringValue === 'head' && m2.fields.toArea.stringValue === 'genel');
  // 3) Alıcı tarafında görünür
  const tb = await login('50202602', 'Tea12345', 430);
  await goA(tb, 'myclass').catch(() => {}); await tb.waitForTimeout(500);
  await tb.evaluate(() => { const b = document.querySelector('[data-hub-tab="messages"]'); b && b.click(); }); await tb.waitForTimeout(1200);
  ok('Bölüm öğretmeni mesajı gelen kutusunda görür', (await tb.evaluate(() => document.body.innerText)).includes('Ji bo hevalê beşê'));
  const hg = await login('96000002', 'Head1234');
  await goA(hg, 'messages'); await hg.waitForTimeout(1500);
  ok('Genel sorumlu mesajı gelen kutusunda görür', (await hg.evaluate(() => document.body.innerText)).includes('Ji bo berpirsê giştî'));
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
