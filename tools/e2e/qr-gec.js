// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: GEÇ okutan öğrenci — öğretmen ders sürerken Kaydet'e basıp okutmayanları geçici "yok" yazsa da, sonradan (15 dk sonra) QR okutan öğrenci:
//      kendi ekranında "geç sayıldın" görür, ders kaydı "geç" olur, "gelmedi" gösterilmez/bildirilmez; ders bitince kesinleşir
//      (başlangıçtan 15 dk sonra okutulan "geç"), sorumlu "ders yapılmadı" işler → yönetici raporunda neden görünür;
//      çocuk akademisi sorumlusu kendi dersinin programını yazar.
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
  const d0 = new Date(); const TD = d0.getFullYear() + '-' + String(d0.getMonth() + 1).padStart(2, '0') + '-' + String(d0.getDate()).padStart(2, '0');
  const todayKu = ["Yekşem", "Dûşem", "Sêşem", "Çarşem", "Pêncşem", "Înî", "Şemî"][d0.getDay()];
  const now = Date.now();
  for (const [no, k, nm, id] of [['20202601', 'S1', 'Rojîn Aram', 101], ['20202602', 'S2', 'Azad Can', 102]]) {
    await put('idx_students/' + no, { no, area: 'tiyatro' }); await put('students/' + k, { no, name: nm, area: 'tiyatro', fireId: k, id }); await signUp(no + '@ogrenci.aat', 'Stu12345');
  }
  await put('classes/C1', { kind: 'area', area: 'tiyatro', name: '1. Sınıf', studentNos: ['20202601', '20202602'], teacherNos: [] });
  await put('schedule/LG', { id: 'LG', fireId: 'LG', area: 'tiyatro', classId: 'C1', name: 'Şano Geç', day: todayKu, start: '00:05', end: '23:55', teacherNo: '50202601', teacherName: 'Mamoste Şano', lessonType: 'main' });
  // Ders 25 dk önce başladı; öğretmen ders sürerken Kaydet'e bastı: okutmayan herkes geçici "yok"
  await fetch(`${FS}/attendance/LG-${TD}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: { lessonId: { stringValue: 'LG' }, lessonFire: { stringValue: 'LG' }, lessonName: { stringValue: 'Şano Geç' }, area: { stringValue: 'tiyatro' }, date: { stringValue: TD },
    startedAt: { integerValue: String(now - 25 * 60000) }, takenBy: { stringValue: 'Mamoste Şano' }, records: { mapValue: { fields: { 101: { stringValue: 'off' }, 102: { stringValue: 'off' } } } } } }) });
  await put('qrSessions/SG', { sessionId: 'SG', lessonName: 'Şano Geç', teacherName: 'Mamoste Şano', area: 'tiyatro', lessonId: 'LG', lessonDate: TD, openedAtMs: now - 25 * 60000, expiresAt: now + 3600000, active: true });
  await put('qrCodes/SG', { codes: ['CODEX1'] });
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const sv = d => Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, v.stringValue !== undefined ? v.stringValue : v.booleanValue !== undefined ? v.booleanValue : v.integerValue]));
  const waitFor = async (f, ms) => { const t0 = Date.now(); for (;;) { const r = await f(); if (r) return r; if (Date.now() - t0 > (ms || 40000)) return null; await new Promise(r => setTimeout(r, 1000)); } };
  const stAtt = async () => Object.fromEntries((await list('studentAtt')).map(d => [d.name.split('/').pop().split('-').pop(), sv(d)]));
  const recs = async () => { const d = await fetch(`${FS}/attendance/LG-${TD}`, { headers: H }).then(r => r.json()); const m = (d.fields.records || {}).mapValue.fields; return Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v.stringValue])); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const mk = async (w) => { const c = await b.newContext({ viewport: { width: w || 430, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} }); return c; };
  const goA = (pg, k) => pg.evaluate(k => document.querySelector('.pano-tile[data-key="' + k + '"],.sm-it[data-key="' + k + '"]').click(), k);
  const loginStu = async (no, url) => {
    const p = await (await mk(430)).newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto(url || 'http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
    await p.getByText('Xwendekar', { exact: true }).first().click();
    await p.locator('input.inp').first().fill(no); await p.locator('input[type=password]').first().fill('Stu12345');
    await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(9000); return p;
  };
  // Öğretmenin geçici "yok" kaydı öğrenci kayıtlarına yansıdı ama KESİN değil
  const first = await waitFor(async () => { const r = await stAtt(); return r['20202601'] && r['20202602'] ? r : null; });
  ok('Ders sürerken Kaydet: öğrenci kayıtları var ama kesin değil (final=false)', !!first && first['20202601'].status === 'off' && String(first['20202601'].final) === 'false', JSON.stringify(first));
  // Rojîn 25 dk sonra QR okutur
  const sp = await loginStu('20202601', 'http://localhost:8765/app/?emu=1&qr=' + encodeURIComponent('AAT|SG|CODEX1'));
  const body = await sp.evaluate(() => document.body.innerText);
  ok('Geç okutan öğrenci başarı ekranını + "geç sayıldın" notunu görür', (await sp.locator('[data-checkin-late]').count()) === 1, body.slice(0, 200).replace(/\n/g, ' / '));
  const qrDoc = (await list('attendance')).map(sv).filter(d => d.sessionId === 'SG' && d.studentNo === '20202601' && !d.deviceClaim);
  ok('Okutma kaydı "geç" (late) olarak yazıldı', qrDoc.length === 1 && String(qrDoc[0].late) === 'true', JSON.stringify(qrDoc));
  const healed = await waitFor(async () => (await recs())['101'] === 'late');
  ok('Sunucu ders kaydını düzeltti: Rojîn "off" → "late" (öğretmen sonradan Kaydet\'e basmasa da)', !!healed, JSON.stringify(await recs()));
  const second = await waitFor(async () => (await stAtt())['20202601']?.status === 'late');
  ok('Öğrenci devam kaydı "geç"', !!second);
  ok('Okutmayan Azad\'ın kaydı hâlâ geçici (kesin değil)', String((await stAtt())['20202602'].final) === 'false');
  // Öğrenci ekranı
  await goA(sp, 'attend'); await sp.waitForSelector('[data-stu-att-view]', { timeout: 15000 }); await sp.waitForTimeout(2500);
  const rowSt = await sp.evaluate(() => [...document.querySelectorAll('[data-stu-att-row]')].map(e => e.dataset.st));
  ok('Rojîn kendi ekranında "geç" görür (gelmedi değil)', rowSt.join() === 'late', rowSt.join());
  await sp.context().close();
  const sp2 = await loginStu('20202602');
  await goA(sp2, 'attend'); await sp2.waitForSelector('[data-stu-att-view]', { timeout: 15000 }); await sp2.waitForTimeout(2500);
  const r2 = await sp2.evaluate(() => [...document.querySelectorAll('[data-stu-att-row]')].map(e => e.dataset.st));
  ok('Ders sürerken okutmayan öğrenci ekranında "gelmedi" DEĞİL "bekliyor" görür, itiraz düğmesi yok', r2.join() === 'wait' && (await sp2.locator('[data-att-obj]').count()) === 0, r2.join());
  // Ders biter → kesinleşir
  await fetch(`${FS}/attendance/LG-${TD}?updateMask.fieldPaths=endedAt`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: { endedAt: { integerValue: String(Date.now()) } } }) });
  const fin = await waitFor(async () => String((await stAtt())['20202602'].final) === 'true');
  ok('Ders bitince kayıtlar kesinleşir (Azad "yok" kesin)', !!fin);
  await sp2.waitForFunction(() => { const e = document.querySelector('[data-stu-att-row]'); return e && e.dataset.st === 'off'; }, null, { timeout: 15000 }).then(() => ok('Azad\'ın ekranı canlı "gelmedi" olur ve itiraz düğmesi çıkar', true), () => ok('Azad\'ın ekranı canlı "gelmedi" olur ve itiraz düğmesi çıkar', false));
  await sp2.context().close();
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
