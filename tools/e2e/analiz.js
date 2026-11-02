// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Genel Analiz — ay/dönem karnesi: devam % + değerlendirme (1–10), önceki ayla eğilim (📈 ➖ 📉), risk işareti,
//      öğrenci / öğretmen / ders / sınıf görünümü, karne (6 aylık grafik, ders ayrıntısı, notlar), PDF; sorumlu yalnız kendi öğrencileri;
//      Öğrenci İşleri değerlendirme sütununu görmez
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
  const pad = n => String(n).padStart(2, '0'), ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const now = new Date(), cur1 = ymd(new Date(now.getFullYear(), now.getMonth(), 1)), today = ymd(now);
  const prev5 = ymd(new Date(now.getFullYear(), now.getMonth() - 1, 5)), prev12 = ymd(new Date(now.getFullYear(), now.getMonth() - 1, 12));
  await put('idx_staff/96000001', { no: '96000001', lvl: 'head', area: 'tiyatro' });
  await put('teachers/H1', { id: 'H1', no: '96000001', name: 'Berpirsa Şanoyê', area: 'tiyatro', isHead: true });
  await signUp('96000001@ogretmen.aat', 'Head1234');
  await put('idx_staff/98202601', { no: '98202601', lvl: 'registrar' });
  await put('teachers/TR', { no: '98202601', name: 'Karûbar', isRegistrar: true, area: 'genel' });
  await signUp('98202601@ogretmen.aat', 'Reg12345');
  await put('teachers/T50', { id: 'T50', no: '50202601', name: 'Mamoste Şano', area: 'tiyatro' });
  await put('students/S1', { no: '20202601', name: 'Rojîn Aram', area: 'tiyatro', fireId: 'S1', id: 101 });
  await put('students/S2', { no: '20202602', name: 'Baran Şêx', area: 'tiyatro', fireId: 'S2', id: 102 });
  await put('students/S3', { no: '20202603', name: 'Jîyan Roj', area: 'muzik', fireId: 'S3', id: 103 });
  await put('classes/A1', { kind: 'area', name: '1. Sînif', area: 'tiyatro', studentNos: ['20202601', '20202602'] });
  await put('schedule/L1', { id: 11, fireId: 'L1', classId: 'A1', area: 'tiyatro', name: 'Şano 1', lessonType: 'main', day: 'Dûşem', start: '09:00', end: '10:00', teacherNo: '50202601' });
  const rec = o => ({ mapValue: { fields: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { stringValue: v }])) } });
  const putAtt = (id, date, r) => fetch(`${FS}/attendance/${id}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: { lessonId: { stringValue: '11' }, classId: { stringValue: 'A1' }, area: { stringValue: 'tiyatro' }, date: { stringValue: date }, records: rec(r) } }) });
  // Geçen ay: Rojîn %100, Baran %50 · Bu ay: Rojîn %0 (📉, risk), Baran %100 (📈); müzik öğrencisi sayılmaz
  await putAtt('p1', prev5, { '101': 'on', '102': 'off' }); await putAtt('p2', prev12, { '101': 'on', '102': 'on' });
  await putAtt('c1', cur1, { '101': 'off', '102': 'on', '103': 'on' }); await putAtt('c2', today, { '101': 'off', '102': 'on', '103': 'on' });
  const putEv = (id, o) => fetch(`${FS}/studentEvals/${id}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'object' ? { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([a, b]) => [a, { integerValue: String(b) }])) } } : { stringValue: v }])) }) });
  await putEv('EP', { wk: prev5, teacherNo: '50202601', teacherName: 'Mamoste Şano', studentNo: '20202601', studentName: 'Rojîn Aram', area: 'tiyatro', note: '', c: { p: 4, g: 4, h: 4, b: 4 } });
  await putEv('EC', { wk: cur1, teacherNo: '50202601', teacherName: 'Mamoste Şano', studentNo: '20202601', studentName: 'Rojîn Aram', area: 'tiyatro', note: 'Ev meh pir kêm hat', c: { p: 2, g: 2, h: 2, b: 2 } });

  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const login = async (no, pw) => { const c = await b.newContext({ viewport: { width: 1280, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} });
    const p = await c.newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
    await p.getByText('Mamoste', { exact: true }).first().click();
    await p.locator('input.inp').first().fill(no); await p.locator('input[type=password]').first().fill(pw);
    await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(7000); return p; };
  const go = (pg, k) => pg.evaluate(k => [...document.querySelectorAll('.sm-it[data-key="' + k + '"],.pano-tile[data-key="' + k + '"]')].find(x => x.getClientRects().length).click(), k).then(() => pg.waitForTimeout(1500));
  const row = (pg, k) => pg.evaluate(k => { const r = document.querySelector('[data-an-row="' + k + '"]'); return r ? r.querySelector('button').innerText.replace(/\n/g, ' ') : null; }, k);
  const who = (pg, i) => pg.evaluate(i => [...document.querySelectorAll('[data-an-who] button')][i].click(), i).then(() => pg.waitForTimeout(800));

  const hp = await login('96000001', 'Head1234');
  await go(hp, 'reports');
  const tabs = await hp.evaluate(() => [...document.querySelectorAll('[data-rtab]')].map(e => e.dataset.rtab).join(','));
  ok('Sorumlu rapor sekmeleri: Devam · Değerlendirme · Genel analiz', tabs === 'devam,eval,analiz', tabs);
  await hp.evaluate(() => document.querySelector('[data-rtab="analiz"]').click()); await hp.waitForTimeout(2000);
  const r1 = await row(hp, '101'), r2 = await row(hp, '102');
  ok('Öğrenci: Rojîn bu ay %0 📉, değerlendirme 4.0 📉, risk ⚠', !!r1 && r1.includes('0%') && r1.includes('📉') && r1.includes('4.0') && r1.includes('⚠'), r1);
  ok('Öğrenci: Baran bu ay %100 📈', !!r2 && r2.includes('100%') && r2.includes('📈'), r2);
  ok('Müzik öğrencisi sorumlunun analizinde yok', (await row(hp, '103')) === null);
  ok('Riskli öğrenci listenin başında', (await hp.evaluate(() => document.querySelector('[data-an-row]').dataset.anRow)) === '101');
  // Karne
  await hp.click('[data-an-row="101"] button'); await hp.waitForTimeout(800);
  const card = await hp.evaluate(() => (document.querySelector('[data-an-card="101"]') || {}).innerText || '');
  ok('Karne: 6 aylık grafik, ders ayrıntısı (Şano 1) ve not', (await hp.locator('[data-an-card="101"] svg rect').count()) === 6 && card.includes('Şano 1') && card.includes('Ev meh pir kêm hat'), card.replace(/\n/g, ' / ').slice(0, 300));
  const [pop] = await Promise.all([hp.context().waitForEvent('page'), hp.click('[data-an-cardpdf]')]);
  await pop.waitForLoadState(); const pc = await pop.evaluate(() => document.body.innerText);
  ok('Karne PDF: ad, devam, eğilim ve not', pc.includes('Rojîn Aram') && pc.includes('0%') && pc.includes('📉') && pc.includes('Ev meh pir kêm hat') && (await pop.locator('svg rect').count()) === 6, pc.slice(0, 200).replace(/\n/g, ' / '));
  await pop.close();
  // Öğretmen / ders / sınıf
  await who(hp, 1); const t1 = await row(hp, '50202601');
  ok('Öğretmen: Şano derslerine katılım %50 (müzik öğrencisi sayılmaz)', !!t1 && t1.includes('50%'), t1);
  await who(hp, 2); const l1 = await row(hp, '11');
  ok('Ders: Şano 1 %50, 2 ders (önceki ay %75 → 📉)', !!l1 && l1.includes('50%') && l1.includes('2 ders') && l1.includes('📉'), l1);
  await who(hp, 3); const c1 = await row(hp, 'A1');
  ok('Sınıf: 1. Sînif %50', !!c1 && c1.includes('50%'), c1);
  const [pop2] = await Promise.all([hp.context().waitForEvent('page'), hp.click('[data-an-pdf]')]);
  await pop2.waitForLoadState(); const pl = await pop2.evaluate(() => document.body.innerText);
  ok('Liste PDF: sınıf satırı ve dönem', pl.includes('1. Sînif') && pl.includes('50%'), pl.slice(0, 200).replace(/\n/g, ' / '));
  await pop2.close();
  // Geçen ay seçilince
  await who(hp, 0);
  await hp.evaluate(() => { const s = document.querySelector('[data-an-month]'); const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set; set.call(s, s.options[1].value); s.dispatchEvent(new Event('change', { bubbles: true })); }); await hp.waitForTimeout(1000);
  const r1p = await row(hp, '101');
  ok('Geçen ay seçilince Rojîn %100, değerlendirme 8.0', !!r1p && r1p.includes('100%') && r1p.includes('8.0'), r1p);
  await hp.context().close();

  // Öğrenci İşleri: analiz var, değerlendirme sütunu yok
  const rp = await login('98202601', 'Reg12345');
  await go(rp, 'reports');
  await rp.evaluate(() => document.querySelector('[data-rtab="analiz"]').click()); await rp.waitForTimeout(2000);
  ok('Öğrenci İşleri: tüm bölümler (müzik öğrencisi de var), değerlendirme sütunu yok', (await row(rp, '103')) !== null && (await rp.locator('[data-an-ev]').count()) === 0);
  await rp.context().close();
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
