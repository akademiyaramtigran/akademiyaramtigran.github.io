// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Derse özel izin — sorumlu öğrenciye yalnız bir ders için izin işler; öğrenci o dersin yoklamasında
//      izinli görünür (listede yok), günün diğer dersinde listede kalır; tüm gün izni eskisi gibi.
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

function evalWeek(d) { const x = d ? new Date(d) : new Date(); const y = new Date(x.getFullYear(), x.getMonth(), x.getDate()); y.setDate(y.getDate() - ((y.getDay() + 6) % 7));
  return y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0'); }
(async () => {
  await put('idx_staff/1000', { no: '1000', lvl: 'admin' });
  await put('teachers/TA', { no: '1000', name: 'Rêveber', isAdmin: true, area: 'genel' });
  await signUp('1000@ogretmen.aat', 'Admin123');
  await put('idx_staff/96202611', { no: '96202611', lvl: 'head', area: 'tiyatro' });
  await put('teachers/TH', { id: 'TH', no: '96202611', name: 'Berpirsa Şanoyê', isHead: true, area: 'tiyatro' });
  await signUp('96202611@ogretmen.aat', 'Head1234');
  await put('idx_staff/98202601', { no: '98202601', lvl: 'registrar' });
  await put('teachers/TR', { id: 'TR', no: '98202601', name: 'Karûbar', isRegistrar: true, area: 'genel' });
  await signUp('98202601@ogretmen.aat', 'Reg12345');
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' });
  await put('teachers/T50', { id: 'T50', no: '50202601', name: 'Mamoste Şano', area: 'tiyatro' });
  await signUp('50202601@ogretmen.aat', 'Tea12345');
  await put('idx_staff/50202602', { no: '50202602', lvl: 'teacher' });
  await put('teachers/T51', { id: 'T51', no: '50202602', name: 'Mamoste Din', area: 'tiyatro' });
  for (const [k, no, nm, id] of [['S1', '20202601', 'Rojîn Aram', 101], ['S2', '20202602', 'Azad Can', 102], ['S3', '20202603', 'Dilan Roj', 103]]) {
    await put('idx_students/' + no, { no }); await put('students/' + k, { no, name: nm, area: 'tiyatro', fireId: k, id }); await signUp(no + '@ogrenci.aat', 'Stu12345');
  }
  await put('classes/C1', { kind: 'area', area: 'tiyatro', name: '1. Sınıf', studentNos: ['20202601', '20202602'], teacherNos: ['50202601'], teacherNames: ['Mamoste Şano'] });
  await put('classes/C2', { kind: 'area', area: 'tiyatro', name: '2. Sınıf', studentNos: ['20202603'], teacherNos: ['50202602'], teacherNames: ['Mamoste Din'] });
  await put('schedule/L1', { id: 'L1', fireId: 'L1', area: 'tiyatro', classId: 'C1', name: 'Şano Bingeh', day: 'Dûşem', start: '10:00', end: '11:00', teacherNo: '50202601', teacherName: 'Mamoste Şano', lessonType: 'main' });
  const TODAY = new Date().toISOString().slice(0, 10);
  await put('schedule/L2', { id: 'L2', fireId: 'L2', area: 'tiyatro', classId: 'C1', name: 'Şano Yekroj', lessonType: 'extra', extraDates: [TODAY], start: '12:00', end: '13:00', teacherNo: '50202601', teacherName: 'Mamoste Şano' });
  await put('schedule/L3', { id: 'L3', fireId: 'L3', area: 'tiyatro', classId: 'C1', name: 'Atolyeya Dengan', lessonType: 'extra', category: 'extra', extraDates: [TODAY], start: '14:00', end: '15:00', teacherNo: '50202601', teacherName: 'Mamoste Şano' });
  await put('schedule/L4', { id: 'L4', fireId: 'L4', area: 'tiyatro', classId: 'C1', name: 'Atolyeya Mêvan', lessonType: 'extra', category: 'workshop', extraDates: [TODAY], start: '09:00', end: '23:00', guestTeacher: 'Hunermend Rêzan' });
  // Yoklama kaydı (gerçek haftalık grafik için) — map alanı elle
  await fetch(`${FS}/attendance/L1-2026-10-19`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: { lessonId: { stringValue: 'L1' }, lessonName: { stringValue: 'Şano Bingeh' }, date: { stringValue: '2026-10-19' },
    records: { mapValue: { fields: { '101': { stringValue: 'on' }, '102': { stringValue: 'off' } } } } } }) });

  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const mk = async (w) => { const c = await b.newContext({ viewport: { width: w || 1280, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} }); return c; };
  const login = async (ctx, no, pw, role) => {
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
    await p.getByText(role || 'Mamoste', { exact: true }).first().click();
    await p.locator('input.inp').first().fill(no); await p.locator('input[type=password]').first().fill(pw);
    await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(7000); return p;
  };
  const txt = p => p.evaluate(() => document.body.innerText);
  const goA = (pg, k) => pg.evaluate(k => document.querySelector('.pano-tile[data-key="' + k + '"],.sm-it[data-key="' + k + '"]').click(), k);
  const keysOf = pg => pg.evaluate(() => [...new Set([...document.querySelectorAll('.sm-it[data-key],.pano-tile[data-key]')].map(e => e.dataset.key))].join(','));
  const btn = (p, t) => p.evaluate(t => { const e = [...document.querySelectorAll('button')].filter(x => x.offsetParent && x.textContent.includes(t)).pop(); if (!e) throw new Error('düğme yok: ' + t); e.click(); }, t);
  const get = path => fetch(`${FS}/${path}`, { headers: H }).then(r => r.json());
  const WK = evalWeek();
  const hp = await login(await mk(), '96202611', 'Head1234');
  await goA(hp, 'leaves'); await hp.waitForTimeout(1200);
  await hp.selectOption('#lv-student', '20202602');
  await hp.locator('[role=tab]', { hasText: 'Dersên taybet' }).click(); await hp.waitForTimeout(500);
  ok('Öğrencinin bugünkü dersleri seçenek olarak çıkar', (await hp.locator('[data-leave-lesson="L2"]').count()) === 1 && (await hp.locator('[data-leave-lesson="L3"]').count()) === 1);
  await hp.click('[data-leave-lesson="L2"]'); await hp.fill('#lv-reason', 'Randevûya doktor');
  await btn(hp, 'Destûrê tomar bike'); await hp.waitForTimeout(2000);
  const lv = (await list('studentLeaves')).map(d => d.fields);
  ok('Derse özel izin kaydedildi (yalnız L2)', lv.length === 1 && JSON.stringify(lv[0].lessonIds) === JSON.stringify({ arrayValue: { values: [{ stringValue: 'L2' }] } }), JSON.stringify(lv[0] && lv[0].lessonIds));
  ok('İzin listesinde ders adı görünür', (await hp.locator('[data-leave-lesson-tag]').count()) === 1);
  const tp = await login(await mk(), '50202601', 'Tea12345');
  await goA(tp, 'attendance'); await tp.waitForTimeout(1500);
  await tp.click('[data-att-lesson="L2"]'); await tp.waitForTimeout(1500);
  const names = () => tp.evaluate(() => document.body.innerText);
  ok('İzinli derste: öğrenci izinli notunda, listede değil', (await tp.locator('[data-on-leave]').count()) === 1 && (await tp.locator('.att-btn').count()) === 3, (await tp.locator('[data-on-leave]').count()) + ' / ' + (await tp.locator('.att-btn').count()) + ' / ' + (await tp.evaluate(() => (document.querySelector('[data-on-leave]') || {}).textContent || '')));
  await tp.click('[data-att-lesson="L3"]'); await tp.waitForTimeout(1500);
  ok('Günün diğer dersinde öğrenci listede', (await tp.locator('[data-on-leave]').count()) === 0 && (await tp.locator('.att-btn').count()) === 6 && (await names()).includes('Azad Can'));
  console.log(out.join('\n')); console.log('ERRS', JSON.stringify(errs)); await b.close();
  process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e.message); process.exit(1); });
