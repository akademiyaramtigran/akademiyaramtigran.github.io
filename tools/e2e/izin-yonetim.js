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

// E2E: Öğrenci İşleri → Çocuk Akademisi → Öğretmenler: ana akademi öğretmenini listeden seçip bağlama
// E2E: Yoklama kapısı — ders BAŞLATILMADAN işaretlenmez/kaydedilmez; başlatınca kaydedilir (kesin değil); kapatılmayan ders için öğretmene "dersi bitirin" uyarısı
// E2E: İzin yönetimi — öğretmen derse özel izin girer/düzenler, sorumlu düzenler/siler; sonradan girilen izin kesinleşmiş yoklamayı izinli yapar; arama kutusu
(async () => {
  const goA = (pg, k) => pg.evaluate(k => document.querySelector('.pano-tile[data-key="' + k + '"],.sm-it[data-key="' + k + '"]').click(), k);
  const TD = new Date().toISOString().slice(0, 10); const todayKu = ['Yekşem', 'Dûşem', 'Sêşem', 'Çarşem', 'Pêncşem', 'Înî', 'Şemî'][new Date().getDay()];
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' }); await put('teachers/T50', { id: 'T50', no: '50202601', name: 'Mamoste Şano', area: 'tiyatro' }); await signUp('50202601@ogretmen.aat', 'Tea12345');
  await put('idx_staff/96202601', { no: '96202601', lvl: 'head', area: 'tiyatro' }); await put('teachers/TH', { id: 'TH', no: '96202601', name: 'Berpirsa Şanoyê', isHead: true, area: 'tiyatro' }); await signUp('96202601@ogretmen.aat', 'Head1234');
  for (const [k, no, nm, id] of [['S1', '20202601', 'Rojîn Aram', 101], ['S2', '20202602', 'Azad Can', 102]]) { await put('idx_students/' + no, { no, area: 'tiyatro' }); await put('students/' + k, { no, name: nm, area: 'tiyatro', fireId: k, id }); await signUp(no + '@ogrenci.aat', 'Stu12345'); }
  await put('classes/C1', { kind: 'area', area: 'tiyatro', name: '1. Sınıf', studentNos: ['20202601', '20202602'], teacherNos: ['50202601'] });
  await put('schedule/LA', { id: 'LA', fireId: 'LA', area: 'tiyatro', classId: 'C1', name: 'Şano Yeni', day: todayKu, start: '00:05', end: '23:55', teacherNo: '50202601', teacherName: 'Mamoste Şano', lessonType: 'main' });
  // Kesinleşmiş yoklama: Azad "yok" (izin sonradan girilecek)
  await fetch(`${FS}/attendance/LA-${TD}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: { endedAt: { integerValue: '1' }, lessonId: { stringValue: 'LA' }, lessonFire: { stringValue: 'LA' }, lessonName: { stringValue: 'Şano Yeni' }, area: { stringValue: 'tiyatro' }, date: { stringValue: TD }, records: { mapValue: { fields: { 101: { stringValue: 'on' }, 102: { stringValue: 'off' } } } } } }) });
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const leaves = async () => ((await fetch(`${FS}/studentLeaves?pageSize=50`, { headers: H }).then(r => r.json())).documents || []).map(d => ({ id: d.name.split('/').pop(), ...Object.fromEntries(Object.entries(d.fields).map(([k, v]) => [k, v.stringValue !== undefined ? v.stringValue : v.booleanValue])) }));
  const stAtt = async () => Object.fromEntries(((await fetch(`${FS}/studentAtt?pageSize=50`, { headers: H }).then(r => r.json())).documents || []).map(d => [d.name.split('-').pop(), d.fields.status.stringValue]));
  const waitFor = async (f, ms) => { const t0 = Date.now(); for (;;) { const r = await f(); if (r) return r; if (Date.now() - t0 > (ms || 40000)) return null; await new Promise(r => setTimeout(r, 1000)); } };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const login = async (no, pw) => { const c = await b.newContext({ viewport: { width: 430, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} });
    const p = await c.newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/app/?emu=1&dvcut=2000-01-01'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
    await p.getByText('Mamoste', { exact: true }).first().click();
    await p.locator('input.inp').first().fill(no); await p.locator('input[type=password]').first().fill(pw);
    await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(8000); return p; };
  const saveBtn = p => p.evaluate(() => [...document.querySelectorAll('button')].filter(x => x.offsetParent && /tomar bike/i.test(x.textContent)).pop().click());
  const first = await waitFor(async () => (await stAtt())['20202602'] ? await stAtt() : null);
  ok('Başlangıç: kesinleşmiş yoklamada Azad "yok" (studentAtt)', !!first && first['20202602'] === 'off', JSON.stringify(first));
  // Öğretmen: derse özel izin işler
  const tp = await login('50202601', 'Tea12345');
  await goA(tp, 'leaves'); await tp.waitForTimeout(1200);
  ok('Öğretmen izin ekranında "tüm gün" seçeneği yok (yalnız kendi dersleri)', (await tp.locator('[data-leave-lessons]').count()) === 1);
  await tp.fill('#lv-student', 'azad'); await tp.waitForTimeout(300);
  ok('Arama: ad yazınca öğrenci bulunur, diğeri listelenmez', (await tp.locator('[data-ss-item="20202602"]').count()) === 1 && (await tp.locator('[data-ss-item="20202601"]').count()) === 0);
  await tp.click('[data-ss-item="20202602"]'); await tp.waitForTimeout(400);
  await tp.evaluate(d => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; }, 0);
  await tp.waitForSelector('[data-leave-lesson="LA"]', { timeout: 10000 }); await tp.click('[data-leave-lesson="LA"]');
  await tp.fill('#lv-reason', 'Nexweşî'); await saveBtn(tp); await tp.waitForTimeout(2500);
  let L = await leaves(); const l1 = L.find(x => x.studentNo === '20202602');
  ok('Öğretmen derse özel izin kaydetti (byNo=öğretmen)', !!l1 && l1.byNo === '50202601' && l1.reason === 'Nexweşî');
  const after = await waitFor(async () => (await stAtt())['20202602'] === 'leave');
  ok('Sonradan girilen izin: kesinleşmiş "yok" → "izinli" (sunucu eşitledi)', !!after, JSON.stringify(await stAtt()));
  // Öğretmen kendi iznini düzenler
  await tp.evaluate(() => document.querySelector('[data-leave-edit]').click()); await tp.waitForTimeout(800);
  await tp.fill('#lv-reason', 'Rapor aldı'); await saveBtn(tp); await tp.waitForTimeout(2500);
  L = await leaves(); const l2 = L.find(x => x.studentNo === '20202602');
  ok('Öğretmen kendi iznini düzeltti (neden + editedByNo)', !!l2 && l2.reason === 'Rapor aldı' && l2.editedByNo === '50202601' && l2.byNo === '50202601');
  await tp.context().close();
  // Sorumlu: öğretmenin izni kendi bölümünde görünür; düzenler ve siler
  const hp = await login('96202601', 'Head1234');
  await goA(hp, 'leaves'); await hp.waitForTimeout(1500);
  ok('Sorumlu: öğretmenin işlediği izni listede görür', (await hp.locator('[data-leave-row]').count()) === 1);
  await hp.evaluate(() => document.querySelector('[data-leave-edit]').click()); await hp.waitForTimeout(800);
  await hp.fill('#lv-reason', 'Sorumlu düzeltti'); await saveBtn(hp); await hp.waitForTimeout(2500);
  L = await leaves(); const l3 = L.find(x => x.studentNo === '20202602');
  ok('Sorumlu öğretmenin iznini düzenledi (yazan kişi değişmedi)', !!l3 && l3.reason === 'Sorumlu düzeltti' && l3.byNo === '50202601' && l3.editedByNo === '96202601');
  await hp.evaluate(() => document.querySelector('[data-leave-del]').click()); await hp.waitForTimeout(2500);
  L = await leaves();
  ok('Sorumlu öğretmenin iznini sildi', L.length === 0);
  const back = await waitFor(async () => (await stAtt())['20202602'] === 'off');
  ok('İzin silinince öğrenci kaydı yeniden "yok" olur (sunucu eşitledi)', !!back, JSON.stringify(await stAtt()));
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
