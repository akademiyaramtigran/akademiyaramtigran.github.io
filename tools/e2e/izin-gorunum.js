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

// E2E: İzinler — öğretmen yalnız KENDİ oluşturduğu izinleri listede görür (başkasının ya da sorumlunun yazdığı görünmez); sorumlu kapsamındaki hepsini görür.
//      Öğretmenin yoklama listesi ise (izinli öğrenci görünmesin diye) o öğrencinin izinlerini yine bilir.
(async () => {
  const goA = (pg, k) => pg.evaluate(k => document.querySelector('.pano-tile[data-key="' + k + '"],.sm-it[data-key="' + k + '"]').click(), k);
  const TD = new Date().toISOString().slice(0, 10); const todayKu = ['Yekşem', 'Dûşem', 'Sêşem', 'Çarşem', 'Pêncşem', 'Înî', 'Şemî'][new Date().getDay()];
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' }); await put('teachers/T50', { id: 'T50', no: '50202601', name: 'Mamoste Şano', area: 'tiyatro' }); await signUp('50202601@ogretmen.aat', 'Tea12345');
  await put('idx_staff/96000001', { no: '96000001', lvl: 'head', area: 'tiyatro' }); await put('teachers/TH', { id: 'TH', no: '96000001', name: 'Berpirsa Şanoyê', isHead: true, area: 'tiyatro' }); await signUp('96000001@ogretmen.aat', 'Head12345');
  for (const [k, no, nm, id] of [['S1', '20202601', 'Rojîn Aram', 101], ['S2', '20202602', 'Azad Can', 102], ['S3', '20202603', 'Dilan Roj', 103]]) { await put('idx_students/' + no, { no, area: 'tiyatro' }); await put('students/' + k, { no, name: nm, area: 'tiyatro', fireId: k, id }); }
  await put('classes/C1', { kind: 'area', area: 'tiyatro', name: '1. Sınıf', studentNos: ['20202601', '20202602', '20202603'], teacherNos: ['50202601'], teacherNames: ['Mamoste Şano'] });
  await put('schedule/L1', { id: 'L1', fireId: 'L1', area: 'tiyatro', classId: 'C1', name: 'Şano Bingeh', day: todayKu, start: '00:00', end: '23:59', teacherNo: '50202601', teacherName: 'Mamoste Şano', lessonType: 'main' });
  // İzin 1: öğretmenin KENDİ yazdığı (ders bazlı) · İzin 2: sorumlunun yazdığı (tüm gün, bölüm)
  await put('studentLeaves/LV1', { studentNo: '20202601', studentName: 'Rojîn Aram', area: 'tiyatro', from: TD, to: TD, reason: 'Teacher izni', by: 'Mamoste Şano', byNo: '50202601', kid: false, lessonIds: ['L1'], lessonNames: ['Şano Bingeh'] });
  await put('studentLeaves/LV2', { studentNo: '20202602', studentName: 'Azad Can', area: 'tiyatro', from: TD, to: TD, reason: 'Sorumlu izni', by: 'Berpirsa Şanoyê', byNo: '96000001', kid: false });
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined }); const errs = [];
  const open = async (no, pw) => { const c = await b.newContext({ viewport: { width: 430, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} });
    const p = await c.newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
    await p.getByText('Mamoste', { exact: true }).first().click();
    await p.locator('input.inp').first().fill(no); await p.locator('input[type=password]').first().fill(pw);
    await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(8000); return p; };
  const T = await open('50202601', 'Tea12345');
  await goA(T, 'leaves'); await T.waitForTimeout(2500);
  const tt = await T.evaluate(() => document.body.innerText);
  ok('Öğretmen izin listesinde yalnız KENDİ yazdığını görür (1 kayıt)', (await T.locator('[data-leave-row]').count()) === 1 && tt.includes('Teacher izni'), String(await T.locator('[data-leave-row]').count()));
  ok('Sorumlunun yazdığı izin öğretmenin listesinde GÖRÜNMEZ', !tt.includes('Sorumlu izni'));
  await goA(T, 'attendance'); await T.waitForTimeout(2500);
  const roster = await T.evaluate(() => document.body.innerText);
  ok('Yoklama listesinde her iki izinli öğrenci yine listede yok (izin kapsamı korunur)', (await T.locator('.att-btn').count()) === 3, String(await T.locator('.att-btn').count()));
  const H1 = await open('96000001', 'Head12345');
  await goA(H1, 'leaves'); await H1.waitForTimeout(2500);
  const ht = await H1.evaluate(() => document.body.innerText);
  ok('Bölüm sorumlusu kapsamındaki izinlerin hepsini görür (2 kayıt)', (await H1.locator('[data-leave-row]').count()) === 2 && ht.includes('Teacher izni') && ht.includes('Sorumlu izni'), String(await H1.locator('[data-leave-row]').count()));
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
