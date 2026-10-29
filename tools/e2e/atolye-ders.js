// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Atölye sınıfına haftalık ders — Öğrenci İşleri'nin açtığı atölye (bölümler arası grup) ders programındaki
//      sınıf listesinde çıkar (kapalı atölye çıkmaz), bölüm sorumlusu ona haftalık ders kaydeder; atölyenin günlük dersi yerinde kalır;
//      raporda ders türü filtresi: bölüm dersleri ile atölye yoklaması ayrı
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
  await put('idx_staff/96000001', { no: '96000001', lvl: 'head', area: 'tiyatro' });
  await put('teachers/H1', { id: 'H1', no: '96000001', name: 'Berpirsa Şanoyê', area: 'tiyatro', isHead: true });
  await signUp('96000001@ogretmen.aat', 'Head1234');
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' });
  await put('teachers/T50', { id: 'T50', no: '50202601', name: 'Mamoste Şano', area: 'tiyatro' });
  await put('teachers/T51', { id: 'T51', no: '50202602', name: 'Mamoste Muzîk', area: 'muzik' });
  await put('idx_students/20202601', { no: '20202601' });
  await put('students/S1', { no: '20202601', name: 'Rojîn Aram', area: 'tiyatro', fireId: 'S1', id: 101 });
  await put('students/S2', { no: '20202602', name: 'Baran Şêx', area: 'tiyatro', fireId: 'S2', id: 102 });
  await put('classes/W1', { kind: 'workshop', name: 'Atolyeya Şanoyê', area: 'genel', studentNos: ['20202601'], teacherNos: ['50202601'], teacherNames: ['Mamoste Şano'], status: 'open', date: '2026-11-01', start: '10:00', end: '12:00', lessonId: 1 });
  await put('schedule/ws_W1', { id: 1, fireId: 'ws_W1', classId: 'W1', area: 'genel', name: 'Atolyeya Şanoyê', lessonType: 'extra', extraDates: ['2026-11-01'], start: '10:00', end: '12:00', teacherNo: '50202601' });
  await put('classes/A1', { kind: 'area', name: '1. Sînif', area: 'tiyatro', studentNos: ['20202601', '20202602'] });
  await put('schedule/L1', { id: 7, fireId: 'L1', classId: 'A1', area: 'tiyatro', name: 'Şano 1', lessonType: 'main', day: 'Dûşem', start: '09:00', end: '10:00' });
  // Yoklamalar: Rojîn bölüm dersine gelmedi, atölyeye geldi
  const rec = o => ({ mapValue: { fields: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { stringValue: v }])) } });
  const putRaw = (path, f) => fetch(`${FS}/${path}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: f }) }).then(r => { if (!r.ok) throw new Error('seed ' + path + ' ' + r.status); });
  await putRaw('attendance/7-2026-10-26', { lessonId: { stringValue: '7' }, classId: { stringValue: 'A1' }, area: { stringValue: 'tiyatro' }, date: { stringValue: '2026-10-26' }, records: rec({ '101': 'off', '102': 'on' }) });
  await putRaw('attendance/1-2026-11-01', { lessonId: { stringValue: '1' }, classId: { stringValue: 'W1' }, area: { stringValue: 'genel' }, date: { stringValue: '2026-11-01' }, records: rec({ '101': 'on' }) });
  await put('classes/C1', { kind: 'workshop', name: 'Atolyeya Girtî', area: 'genel', studentNos: ['20202609'], status: 'closed' });

  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } }); await routes(c);
  await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} });
  const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
  await p.getByText('Mamoste', { exact: true }).first().click();
  await p.locator('input.inp').first().fill('96000001'); await p.locator('input[type=password]').first().fill('Head1234');
  await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(7000);
  await p.evaluate(() => document.querySelector('.sm-it[data-key="schedule"]').click()); await p.waitForTimeout(1000);
  await p.evaluate(() => document.querySelector('[data-add-lesson]').click()); await p.waitForTimeout(1200);
  const opts = await p.evaluate(() => { const s = [...document.querySelectorAll('select')].find(x => [...x.options].some(o => o.textContent.includes('Sinifekê hilbijêre'))); return s ? [...s.options].map(o => o.value + '|' + o.textContent) : []; });
  ok('Sınıf listesinde açık atölye var', opts.some(o => o.startsWith('W1|') && o.includes('Atolyeya Şanoyê')), opts.join(' ; '));
  const tgrp = await p.evaluate(() => { const g = [...document.querySelectorAll('optgroup')].find(x => x.label.includes('Mamosteyên beşên din')); return g ? [...g.querySelectorAll('option')].map(o => o.value) : null; });
  ok('Öğretmen listesinde "Mamosteyên beşên din" (müzik hocası tiyatro dersine atanabilir)', !!tgrp && tgrp.includes('50202602') && !tgrp.includes('50202601'), JSON.stringify(tgrp));
  ok('Kapalı atölye listede yok', !opts.some(o => o.startsWith('C1|')));
  await p.evaluate(() => { const s = [...document.querySelectorAll('select')].find(x => [...x.options].some(o => o.value === 'W1')); const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set; set.call(s, 'W1'); s.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.locator('input[placeholder="Armoni – Gr. A"]').fill('Şano – Hefteya dawî');
  await p.evaluate(() => { const i = document.querySelector('[data-weekly] input'); if (!i.checked) i.click(); });
  await p.waitForTimeout(300);
  await p.evaluate(() => { const e = [...document.querySelectorAll('button')].filter(x => x.offsetParent && /Bernam|programê|Zêde bike|lê zêde/i.test(x.textContent)).pop(); e.click(); });
  await p.waitForTimeout(4000);
  const docs = await list('schedule');
  const wk = docs.find(d => d.fields.name && d.fields.name.stringValue === 'Şano – Hefteya dawî');
  ok('Haftalık ders kaydedildi (atölye sınıfına bağlı, alan = tiyatro)', !!wk && wk.fields.classId.stringValue === 'W1' && wk.fields.area.stringValue === 'tiyatro' && wk.fields.lessonType.stringValue === 'main', wk ? JSON.stringify(Object.keys(wk.fields)) : (await p.evaluate(() => document.body.innerText)).slice(-300));
  const ws = docs.find(d => d.name.endsWith('/ws_W1'));
  ok('Atölyenin kendi günlük dersi yerinde', !!ws && ws.fields.lessonType.stringValue === 'extra');
  // Rapor: ders türü filtresi (Hemû ders / Dersên beşê / Atolye)
  await p.evaluate(() => document.querySelector('.sm-it[data-key="reports"]').click()); await p.waitForTimeout(2500);
  const pct = () => p.evaluate(() => { const r = document.querySelector('[data-rep-student="20202601"] .c-pct'); return r ? r.textContent.trim() : ''; });
  const shown = no => p.evaluate(no => !!document.querySelector('[data-rep-student="' + no + '"]'), no);
  const scope = lb => p.evaluate(lb => { const e = [...document.querySelectorAll('[data-att-scope] button')].find(x => x.textContent.includes(lb)); e.click(); }, lb);
  ok('Raporda "Dersên di raporê de" filtresi var', (await p.locator('[data-att-scope]').count()) === 1);
  const pAll = await pct();
  await scope('Atolye'); await p.waitForTimeout(600);
  const pWs = await pct(), s2ws = await shown('20202602');
  await scope('Dersên beşê'); await p.waitForTimeout(600);
  const pDept = await pct(), s2d = await shown('20202602');
  ok('Hemû ders: bölüm + atölye birlikte (%50)', pAll.startsWith('50'), pAll);
  ok('Atolye: yalnız atölye yoklaması (%100), atölyede olmayan öğrenci listede yok', pWs.startsWith('100') && !s2ws, pWs);
  ok('Dersên beşê: atölye hariç (%0), tüm bölüm öğrencileri listede', pDept.startsWith('0') && s2d, pDept);
  ok('Etkin filtre etiketi görünür', (await p.evaluate(() => [...document.querySelectorAll('.c-ftag')].some(x => x.textContent.includes('Dersên beşê')))));
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
