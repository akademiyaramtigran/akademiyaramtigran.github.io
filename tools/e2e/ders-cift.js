// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Çift ders — öğretmenin ders düğmelerinde tek seferlik (tarih) / haftalık (🔁) ayrımı; aynı sınıfa aynı gün ve saatte
//      ders eklenirken uyarı (iptal edilince eklenmez); ders silinirken yoklama kayıtları da silinebilir
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
  const KU = ['Yekşem', 'Dûşem', 'Sêşem', 'Çarşem', 'Pêncşem', 'Înî', 'Şemî'];
  const now = new Date(), past = new Date(now); past.setDate(now.getDate() - 7);
  const TODAY = ymd(now), PAST = ymd(past), DAY = KU[now.getDay()];
  const from = new Date(now); from.setDate(now.getDate() - 14);
  await put('idx_staff/98202601', { no: '98202601', lvl: 'registrar' });
  await put('teachers/TR', { no: '98202601', name: 'Karûbar', isRegistrar: true, area: 'genel' });
  await signUp('98202601@ogretmen.aat', 'Reg12345');
  await put('idx_staff/71202602', { no: '71202602', lvl: 'teacher' });
  await put('teachers/T71', { id: 'T71', no: '71202602', name: 'Ömer', area: 'genel' });
  await signUp('71202602@ogretmen.aat', 'Tea12345');
  await put('students/S1', { no: '20202601', name: 'Rojîn Aram', area: 'tiyatro', fireId: 'S1', id: 101 });
  await put('students/S2', { no: '20202602', name: 'Baran Şêx', area: 'muzik', fireId: 'S2', id: 102 });
  await put('classes/G1', { kind: 'general', name: 'Giştî', area: 'genel', studentNos: ['20202601', '20202602'] });
  // Haftalık ders + aynı güne yanlışlıkla açılmış tek seferlik ders (yoklaması tek seferlikte)
  await put('schedule/LW', { id: 'LW', fireId: 'LW', classId: 'G1', area: 'genel', name: 'Ziman', lessonType: 'main', day: DAY, from: ymd(from), start: '09:30', end: '12:00', teacherNo: '71202602', teacherName: 'Ömer' });
  await put('schedule/LO', { id: 'LO', fireId: 'LO', classId: 'G1', area: 'genel', name: 'Ziman', lessonType: 'extra', extraDates: [PAST], start: '09:30', end: '12:00', teacherNo: '71202602', teacherName: 'Ömer' });
  const rec = o => ({ mapValue: { fields: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { stringValue: v }])) } });
  await fetch(`${FS}/attendance/LO-${PAST}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: { lessonId: { stringValue: 'LO' }, classId: { stringValue: 'G1' }, area: { stringValue: 'genel' }, date: { stringValue: PAST }, records: rec({ '101': 'on', '102': 'on' }) } }) });

  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = []; let dialogs = []; let answer = true;
  const mk = async (w) => { const c = await b.newContext({ viewport: { width: w || 1280, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} }); return c; };
  const login = async (ctx, no, pw) => {
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => { dialogs.push(d.message()); answer ? d.accept() : d.dismiss(); });
    await p.goto('http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
    await p.getByText('Mamoste', { exact: true }).first().click();
    await p.locator('input.inp').first().fill(no); await p.locator('input[type=password]').first().fill(pw);
    await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(7000); return p;
  };
  const txt = p => p.evaluate(() => document.body.innerText);
  const list = col => fetch(`${FS}/${col}?pageSize=100`, { headers: H }).then(r => r.json()).then(j => j.documents || []);

  // 1) Öğretmen: geçmiş günde iki düğme ayırt edilir
  const tp = await login(await mk(430), '71202602', 'Tea12345');
  await tp.evaluate(() => [...document.querySelectorAll('.pano-tile[data-key="attendance"],.sm-it[data-key="attendance"],[data-key="attendance"]')].filter(x => x.getClientRects().length)[0].click()); await tp.waitForTimeout(1500);
  const cur = (await tp.getAttribute('[data-att-date] [data-date-input]', 'data-value')) || TODAY;
  await tp.click('[data-att-date] [data-date-input]'); await tp.waitForTimeout(300);
  if (PAST.slice(0, 7) < cur.slice(0, 7)) { await tp.click('[data-cal] button[aria-label="‹"]'); await tp.waitForTimeout(200); }
  await tp.click('[data-cal] [data-day="' + PAST + '"]'); await tp.waitForTimeout(1200);
  const kinds = await tp.evaluate(() => [...document.querySelectorAll('[data-att-lesson] [data-att-kind]')].map(e => e.dataset.attKind + ':' + e.textContent.trim()));
  ok('Geçmiş günde iki ders düğmesi ayırt edilir (tek seferlik tarihli, haftalık 🔁)', kinds.length === 2 && kinds.some(k => k.startsWith('once:') && k.includes(PAST.slice(8, 10) + '.' + PAST.slice(5, 7))) && kinds.some(k => k.startsWith('weekly:')), JSON.stringify(kinds));
  // Bugün: yalnız bugünün dersi (haftalık), tek seferlik geçmiş ders listede yok
  await tp.evaluate(() => [...document.querySelectorAll('button')].find(x => x.offsetParent && x.textContent.trim() === 'Îro').click()); await tp.waitForTimeout(800);
  const todayBtns = await tp.evaluate(() => [...document.querySelectorAll('[data-att-lesson]')].map(e => e.dataset.attLesson));
  ok('Bugün yalnız bugünün dersi listelenir', JSON.stringify(todayBtns) === '["LW"]', JSON.stringify(todayBtns));
  await tp.context().close();

  // 2) Öğrenci İşleri: aynı sınıfa aynı gün ve saatte ders eklenirken uyarı (iptal → eklenmez)
  const rp = await login(await mk(), '98202601', 'Reg12345');
  await rp.evaluate(() => { const mv = [...document.querySelectorAll('.sm-it,.pano-tile')].filter(x => x.getClientRects().length); mv.find(x => x.textContent.includes('Sinif û Atolye')).click(); }); await rp.waitForTimeout(1500);
  await rp.evaluate(() => [...document.querySelectorAll('button')].find(x => x.offsetParent && x.textContent.includes('Sinifên giştî')).click()); await rp.waitForTimeout(800);
  await rp.evaluate(() => [...document.querySelectorAll('div')].filter(d => d.textContent.includes('Giştî') && d.style.cursor === 'pointer').pop().click()); await rp.waitForTimeout(800);
  await rp.evaluate(() => [...document.querySelectorAll('button')].find(x => x.offsetParent && x.textContent.includes('Ders zêde bike')).click()); await rp.waitForTimeout(1000);
  await rp.locator('input[placeholder="Armoni – Gr. A"]').fill('Ziman Dubare');
  await rp.evaluate(() => { const i = document.querySelector('[data-weekly] input'); if (!i.checked) i.click(); }); await rp.waitForTimeout(200);
  dialogs = []; answer = false;
  await rp.evaluate(() => [...document.querySelectorAll('button')].filter(x => x.offsetParent && x.textContent.includes('Bernameyê Zêde Bike')).pop().click()); await rp.waitForTimeout(2000);
  answer = true;
  ok('Çakışma uyarısı çıktı', dialogs.some(m => m.includes('Di vê demê de dersa vê sinifê heye') && m.includes('Ziman')), JSON.stringify(dialogs));
  ok('İptal edilince ders eklenmedi', !(await list('schedule')).some(d => d.fields.name.stringValue === 'Ziman Dubare'));
  await rp.evaluate(() => { const x = document.querySelector('button[aria-label="✕"]'); x && x.click(); }); await rp.waitForTimeout(800);

  // 3) Tek seferlik dersi yoklamasıyla birlikte sil
  dialogs = []; answer = true;
  // Sınıf kartındaki ders satırı: "Ziman / <tarih> · 09:30–12:00" — son düğme sil
  const delOk = await rp.evaluate(PAST => { const rows = [...document.querySelectorAll('div')].filter(d => d.textContent.includes(PAST + ' · 09:30') && d.querySelectorAll('button').length >= 1 && d.querySelectorAll('button').length <= 2);
    const r = rows.pop(); if (!r) return false; const bs = r.querySelectorAll('button'); bs[bs.length - 1].click(); return true; }, PAST);
  await rp.waitForTimeout(3000);
  const sch = await list('schedule'); const att = await fetch(`${FS}/attendance/LO-${PAST}`, { headers: H });
  ok('Silerken yoklama kayıtları da soruldu', delOk && dialogs.some(m => m.includes('tomarên amadebûnê hene')), JSON.stringify(dialogs));
  ok('Tek seferlik ders ve yoklaması silindi, haftalık ders duruyor', !sch.some(d => d.name.endsWith('/LO')) && sch.some(d => d.name.endsWith('/LW')) && att.status === 404, 'att=' + att.status);
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
