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

// E2E: Ders saatinde yoklama ekranı açılınca liste + dönen QR KENDİLİĞİNDEN açılır; yoklama zaten alınmışsa yeniden açılmaz; ders saati dışında açılmaz
(async () => {
  const goA = (pg, k) => pg.evaluate(k => document.querySelector('.pano-tile[data-key="' + k + '"],.sm-it[data-key="' + k + '"]').click(), k);
  const TD = new Date().toISOString().slice(0, 10); const todayKu = ['Yekşem', 'Dûşem', 'Sêşem', 'Çarşem', 'Pêncşem', 'Înî', 'Şemî'][new Date().getDay()];
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' }); await put('teachers/T50', { id: 'T50', no: '50202601', name: 'Mamoste Şano', area: 'tiyatro' }); await signUp('50202601@ogretmen.aat', 'Tea12345');
  for (const [k, no, nm, id] of [['S1', '20202601', 'Rojîn Aram', 101], ['S2', '20202602', 'Azad Can', 102]]) { await put('idx_students/' + no, { no, area: 'tiyatro' }); await put('students/' + k, { no, name: nm, area: 'tiyatro', fireId: k, id }); }
  await put('classes/C1', { kind: 'area', area: 'tiyatro', name: '1. Sınıf', studentNos: ['20202601', '20202602'], teacherNos: ['50202601'] });
  await put('schedule/LA', { id: 'LA', fireId: 'LA', area: 'tiyatro', classId: 'C1', name: 'Şano Şimdi', day: todayKu, start: '00:00', end: '23:59', teacherNo: '50202601', teacherName: 'Mamoste Şano', lessonType: 'main' });
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined }); const errs = [];
  const open = async () => { const c = await b.newContext({ viewport: { width: 430, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} });
    const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/app/?emu=1&autoqr=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
    await p.getByText('Mamoste', { exact: true }).first().click();
    await p.locator('input.inp').first().fill('50202601'); await p.locator('input[type=password]').first().fill('Tea12345');
    await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(8000); return p; };
  const sessions = async () => (await list('qrSessions')).filter(d => d.fields.active && d.fields.active.booleanValue).length;
  const p = await open();
  ok('Giriş yapınca henüz yoklama ekranı açılmadı: QR oturumu yok', (await sessions()) === 0);
  await goA(p, 'attendance'); await p.waitForTimeout(4500);
  ok('Ders saatinde yoklama ekranı açılınca dönen QR KENDİLİĞİNDEN açılır (oturum + QR penceresi)', (await sessions()) === 1 && (await p.evaluate(() => document.body.innerText)).includes('Şano Şimdi'));
  ok('Liste de hazır: öğrenciler yoklama listesinde (3 işaret düğmesi × 2 öğrenci)', (await p.locator('.att-btn').count()) === 6);
  await b.close();
  // Yoklama zaten alınmışsa yeniden açılmaz
  await put('attendance/LA-' + TD, { lessonId: 'LA', lessonFire: 'LA', lessonName: 'Şano Şimdi', area: 'tiyatro', date: TD });
  await fetch(`${FS}/attendance/LA-${TD}?updateMask.fieldPaths=records`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: { records: { mapValue: { fields: { 101: { stringValue: 'on' }, 102: { stringValue: 'off' } } } } } }) });
  const b2 = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const c2 = await b2.newContext({ viewport: { width: 430, height: 900 } }); await routes(c2);
  await c2.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} });
  const p2 = await c2.newPage(); p2.on('pageerror', e => errs.push(e.message)); p2.on('dialog', d => d.accept());
  const before = await sessions();
  await p2.goto('http://localhost:8765/app/?emu=1&autoqr=1'); await p2.waitForSelector('text=Têkeve', { timeout: 60000 });
  await p2.getByText('Mamoste', { exact: true }).first().click();
  await p2.locator('input.inp').first().fill('50202601'); await p2.locator('input[type=password]').first().fill('Tea12345');
  await p2.getByText('Têkeve', { exact: true }).last().click(); await p2.waitForTimeout(8000);
  await goA(p2, 'attendance'); await p2.waitForTimeout(4500);
  ok('Bu ders için yoklama zaten alınmışsa QR yeniden KENDİLİĞİNDEN açılmaz', (await sessions()) === before, before + ' → ' + (await sessions()));
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b2.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
