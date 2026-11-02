// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Geçmiş güne yoklama — öğretmen tarih seçip geçen haftanın dersinin yoklamasını sonradan girer; o gün izinli öğrenci
//      listede yok (izinli kaydedilir), kayıt seçilen güne yazılır (bugüne değil); o gün dersi olmayan tarih için uyarı
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
  const now = new Date(), past = new Date(now); past.setDate(now.getDate() - 7);   // geçen hafta aynı gün
  const TODAY = ymd(now), PAST = ymd(past), DAY = KU[now.getDay()];
  const other = new Date(now); other.setDate(now.getDate() - 1); const OTHER = ymd(other);  // dersin olmadığı gün (dün)
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' });
  await put('teachers/T50', { id: 'T50', no: '50202601', name: 'Mamoste Şano', area: 'tiyatro' });
  await signUp('50202601@ogretmen.aat', 'Tea12345');
  await put('students/S1', { no: '20202601', name: 'Rojîn Aram', area: 'tiyatro', fireId: 'S1', id: 101 });
  await put('students/S2', { no: '20202602', name: 'Baran Şêx', area: 'tiyatro', fireId: 'S2', id: 102 });
  await put('classes/A1', { kind: 'area', name: '1. Sînif', area: 'tiyatro', studentNos: ['20202601', '20202602'], teacherNos: ['50202601'] });
  const from = new Date(now); from.setDate(now.getDate() - 14);
  await put('schedule/L1', { id: 'L1', fireId: 'L1', classId: 'A1', area: 'tiyatro', name: 'Şano 1', lessonType: 'main', day: DAY, from: ymd(from), start: '09:00', end: '10:00', teacherNo: '50202601', teacherName: 'Mamoste Şano' });
  // Baran yalnız geçen haftaki o gün izinli
  await put('studentLeaves/LV1', { studentNo: '20202602', studentName: 'Baran Şêx', area: 'tiyatro', from: PAST, to: PAST, reason: 'Nexweşî', by: 'Berpirs', byNo: '1', kid: false });

  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const c = await b.newContext({ viewport: { width: 430, height: 900 } }); await routes(c);
  await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} });
  const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
  await p.getByText('Mamoste', { exact: true }).first().click();
  await p.locator('input.inp').first().fill('50202601'); await p.locator('input[type=password]').first().fill('Tea12345');
  await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(7000);
  await p.evaluate(() => [...document.querySelectorAll('.pano-tile[data-key="attendance"],.sm-it[data-key="attendance"],[data-key="attendance"]')].filter(x => x.getClientRects().length)[0].click()); await p.waitForTimeout(1500);
  const txt = () => p.evaluate(() => document.body.innerText);
  ok('Yoklama ekranında tarih seçimi var', (await p.locator('[data-att-date] [data-date-input]').count()) === 1);
  const pick = async ds => {
    const cur = (await p.getAttribute('[data-att-date] [data-date-input]', 'data-value')) || TODAY;   // takvim bu ayda açılır
    await p.click('[data-att-date] [data-date-input]'); await p.waitForTimeout(300);
    if (ds.slice(0, 7) < cur.slice(0, 7)) { await p.click('[data-cal] button[aria-label="‹"]'); await p.waitForTimeout(200); }
    if (ds.slice(0, 7) > cur.slice(0, 7)) { await p.click('[data-cal] button[aria-label="›"]'); await p.waitForTimeout(200); }
    await p.click('[data-cal] [data-day="' + ds + '"]'); await p.waitForTimeout(1200);
  };
  // Bugün: Baran listede (bugün izinli değil)
  ok('Bugün: Baran listede', (await txt()).includes('Baran Şêx') && !(await p.locator('[data-on-leave]').count()));
  // Geçen hafta: Baran izinli → listede yok
  await pick(PAST);
  const t1 = await txt();
  ok('Geçmiş gün notu görünür', (await p.locator('[data-att-past]').count()) === 1);
  ok('Geçmiş günde izinli Baran listede değil, "Bi destûr" notunda', (await p.locator('[data-on-leave]').count()) === 1 && (await p.evaluate(() => document.querySelector('[data-on-leave]').textContent)).includes('Baran Şêx'));
  ok('Geçmiş günde "Dersê Dest Pê Bike" (QR) yok', !t1.includes('Dersê Dest Pê Bike'));
  // Rojîn'i "hat" işaretle ve kaydet
  await p.evaluate(() => { const row = [...document.querySelectorAll('div')].filter(d => d.textContent.includes('Rojîn Aram') && d.querySelectorAll('.att-btn').length === 3).pop(); row.querySelectorAll('.att-btn')[0].click(); });
  await p.waitForTimeout(300);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /^(Tomar bike|Kaydet|Tomar)$/.test(x.textContent.trim()) || x.textContent.includes('Amadebûnê tomar')); b.click(); });
  await p.waitForTimeout(2500);
  const A = await fetch(`${FS}/attendance/L1-${PAST}`, { headers: H }).then(r => r.json());
  const T = await fetch(`${FS}/attendance/L1-${TODAY}`, { headers: H });
  const rec = A.fields && A.fields.records.mapValue.fields;
  ok('Kayıt geçmiş güne yazıldı: Rojîn geldi, Baran izinli', !!rec && rec['101'] && rec['101'].stringValue === 'on' && rec['102'] && rec['102'].stringValue === 'leave', JSON.stringify(rec));
  ok('Bugüne yoklama yazılmadı', T.status === 404);
  // Dersin olmadığı gün
  await pick(OTHER);
  ok('Dersin olmadığı gün için uyarı', (await txt()).includes('Di vê rojê de dersa te tune bû'));
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
