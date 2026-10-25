// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Ders programı + "Dersi başlat" — bölüm sorumlusu kendi bölümüne ders ekler ve öğretmen atar (alan kilitli),
//      Öğrenci İşleri programı yalnız görür; öğretmen dersi saatten bağımsız başlatır, kartla (QR) yoklama alır
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
  await put('idx_staff/1000', { no: '1000', lvl: 'admin' });
  await put('teachers/TA', { no: '1000', name: 'Rêveber', isAdmin: true, area: 'genel' });
  await signUp('1000@ogretmen.aat', 'Admin123');
  await put('idx_staff/96202611', { no: '96202611', lvl: 'head', area: 'tiyatro' });
  await put('teachers/TH', { id: 'TH', no: '96202611', name: 'Berpirsa Şanoyê', isHead: true, area: 'tiyatro' });
  await signUp('96202611@ogretmen.aat', 'Head1234');
  await put('idx_staff/96202612', { no: '96202612', lvl: 'head', area: 'drama' });
  await put('teachers/TK', { id: 'TK', no: '96202612', name: 'Berpirsa Dramayê', isHead: true, area: 'drama' });
  await signUp('96202612@ogretmen.aat', 'Head1234');
  await put('idx_staff/98202601', { no: '98202601', lvl: 'registrar' });
  await put('teachers/TR', { id: 'TR', no: '98202601', name: 'Karûbar', isRegistrar: true, area: 'genel' });
  await signUp('98202601@ogretmen.aat', 'Reg12345');
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' });
  await put('teachers/T50', { id: 'T50', no: '50202601', name: 'Mamoste Şano', area: 'tiyatro' });
  await signUp('50202601@ogretmen.aat', 'Tea12345');
  await put('idx_students/20202601', { no: '20202601' });
  await put('students/S1', { no: '20202601', name: 'Rojîn Aram', area: 'tiyatro', fireId: 'S1', id: 101 });
  await put('idx_students/20202602', { no: '20202602' });
  await put('students/S2', { no: '20202602', name: 'Azad Can', area: 'tiyatro', fireId: 'S2', id: 102 });
  const TOK1 = 'a'.repeat(32), TOK2 = 'b'.repeat(32);
  await put('cards/' + TOK1, { kind: 'student', no: '20202601', name: 'Rojîn Aram', active: true });
  await put('cards/' + TOK2, { kind: 'student', no: '20202602', name: 'Azad Can', active: true });
  await put('classes/C1', { kind: 'area', area: 'tiyatro', name: '1. Sınıf', studentNos: ['20202601', '20202602'], teacherNos: [] });
  await put('kidTeachers/72026001', { no: '72026001', name: 'Mamoste Drama', area: 'drama' });

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
  const btn = (p, t) => p.evaluate(t => { const e = [...document.querySelectorAll('button')].filter(x => x.offsetParent && x.textContent.includes(t)).pop(); if (!e) throw new Error('düğme yok: ' + t); e.click(); }, t);
  const get = path => fetch(`${FS}/${path}`, { headers: H }).then(r => r.json());

  // 1) Bölüm sorumlusu: Ders programı → ders ekle (bugün), öğretmen ata; alan kilitli
  const hp = await login(await mk(), '96202611', 'Head1234');
  const keys = await hp.evaluate(() => [...document.querySelectorAll('.sm-it[data-key]')].map(e => e.dataset.key).join(','));
  ok('Sorumlu menüsünde "Ders programı" var', keys.split(',').includes('schedule'), keys);
  await goA(hp, 'schedule'); await hp.waitForTimeout(1200);
  ok('Sorumlu programında dönem yönetimi yok', !(await txt(hp)).includes('Demsalê Zêde Bike'));
  await hp.click('[data-add-lesson]'); await hp.waitForTimeout(700);
  ok('Ders eklerken bölüm kilitli', await hp.evaluate(() => [...document.querySelectorAll('select')].some(s => s.disabled && s.value === 'tiyatro')));
  const todayKu = await hp.evaluate(() => ["Yekşem","Dûşem","Sêşem","Çarşem","Pêncşem","Înî","Şemî"][new Date().getDay()]);
  await hp.locator('select:has(option[value="C1"])').selectOption('C1');
  await hp.locator('input[placeholder="Armoni – Gr. A"]').fill('Şano Pratîk');
  // Takvim uygulama dilinde (Kurmancî ay adları)
  await hp.click('#ls-date'); await hp.waitForTimeout(400);
  const ct = await hp.evaluate(() => (document.querySelector('[data-cal]') || {}).innerText || '');
  ok('Takvim Kurmancî açılır (ay adları)', /Çile|Sibat|Adar|Nîsan|Gulan|Hezîran|Tîrmeh|Tebax|Îlon|Çiriya|Berfanbar/.test(ct) && !/October|January|Ekim/.test(ct), ct.slice(0, 40));
  await hp.click('[data-cal] [data-day="' + new Date().toISOString().slice(0, 10) + '"]'); await hp.waitForTimeout(300);
  await hp.locator('select:has(option[value="50202601"])').selectOption('50202601');
  await btn(hp, '💾'); await hp.waitForTimeout(2500);
  const sch = (await list('schedule')).filter(d => d.fields.name && d.fields.name.stringValue === 'Şano Pratîk');
  ok('Tek günlük ders kaydedildi (takvimden bugün): bölüm tiyatro, öğretmen atanmış', sch.length === 1 && sch[0].fields.area.stringValue === 'tiyatro' && sch[0].fields.teacherNo.stringValue === '50202601' && JSON.stringify(sch[0].fields.extraDates || {}).includes(new Date().toISOString().slice(0, 10)));
  const LID = sch[0] && (sch[0].fields.id.integerValue || sch[0].fields.id.doubleValue || sch[0].fields.id.stringValue);
  // Takvimden gün + "her hafta tekrarlansın"
  await hp.click('[data-add-lesson]'); await hp.waitForTimeout(700);
  await hp.locator('select:has(option[value="C1"])').selectOption('C1');
  await hp.locator('input[placeholder="Armoni – Gr. A"]').fill('Şano Hefteyî');
  await hp.click('[data-weekly] input'); await btn(hp, '💾'); await hp.waitForTimeout(2500);
  const rx = (await list('schedule')).filter(d => d.fields.name && d.fields.name.stringValue === 'Şano Hefteyî');
  ok('Her hafta tekrarlanan ders: gün takvimden, başlangıç tarihi kayıtlı', rx.length === 1 && rx[0].fields.lessonType.stringValue === 'main' && rx[0].fields.day.stringValue === todayKu && !!rx[0].fields.from);
  // İkinci ders: 20 dk önce başlamış (geç sayımı için)
  await put('schedule/LB', { id: 'LB', fireId: 'LB', area: 'tiyatro', classId: 'C1', name: 'Şano Dereng', day: todayKu, start: '08:00', end: '09:00', teacherNo: '50202601', teacherName: 'Mamoste Şano', lessonType: 'main' });
  const today = new Date().toISOString().slice(0, 10);
  await put('attendance/LB-' + today, { lessonId: 'LB', area: 'tiyatro', date: today, startedAt: Date.now() - 20 * 60000 });

  // 2) Öğrenci İşleri: programı görür, ekleyemez
  const rp = await login(await mk(), '98202601', 'Reg12345');
  await goA(rp, 'qad'); await rp.waitForTimeout(1500);
  await rp.evaluate(() => { const e = [...document.querySelectorAll('.area-card')].filter(x => x.textContent.includes('Şano')).pop(); e && e.click(); }); await rp.waitForTimeout(1500);
  await rp.evaluate(() => { const e = document.querySelector('[data-area-tab="schedule"]'); e && e.click(); }); await rp.waitForTimeout(1000);
  ok('Öğrenci İşleri: ders ekleme düğmesi yok, bilgi notu var', (await rp.locator('[data-add-lesson]').count()) === 0 && (await txt(rp)).includes('berpirsên beşan'));

  // İzin: sorumlu Azad'a bugün izin işler → öğretmen listesinde görünmez
  await goA(hp, 'leaves'); await hp.waitForTimeout(1000);
  await hp.selectOption('#lv-student', '20202602'); await hp.fill('#lv-reason', 'Nexweşî');
  await btn(hp, 'Destûrê tomar bike'); await hp.waitForTimeout(2000);
  const lvs = await list('studentLeaves');
  ok('İzin kaydedildi (öğrenci, tarih, neden)', lvs.length === 1 && lvs[0].fields.studentNo.stringValue === '20202602' && lvs[0].fields.reason.stringValue === 'Nexweşî');
  // 3) Öğretmen: saatten bağımsız "Dersi başlat" → kartla yoklama
  const tp = await login(await mk(), '50202601', 'Tea12345');
  await goA(tp, 'attendance'); await tp.waitForTimeout(1500);
  await tp.click('[data-att-lesson="' + LID + '"]'); await tp.waitForTimeout(1200);
  ok('Başlamamış derste "Dersê Dest Pê Bike" düğmesi', (await txt(tp)).includes('Dersê Dest Pê Bike'));
  await btn(tp, 'Dersê Dest Pê Bike'); await tp.waitForTimeout(2000);
  ok('Ders başladı göstergesi', (await tp.locator('[data-lesson-started]').count()) === 1);
  const a1 = await get('attendance/' + LID + '-' + today);
  ok('Başlangıç anı kaydedildi (startedAt)', a1.fields && !!a1.fields.startedAt);
  await tp.click('[data-att-scan]'); await tp.waitForTimeout(800);
  await tp.fill('input[aria-label=card-code]', 'AAT1:' + TOK1); await btn(tp, 'Kontrol'); await tp.waitForTimeout(2500);
  const a2 = await get('attendance/' + LID + '-' + today);
  ok('Kartla okutulan öğrenci "on" (zamanında) kaydedildi', JSON.stringify(a2.fields && a2.fields.records || {}).includes('"on"'));
  // Geç: 20 dk önce başlamış ders
  await tp.click('[data-att-lesson="LB"]'); await tp.waitForTimeout(2000);
  ok('Önceden başlamış ders "başladı" görünür', (await tp.locator('[data-lesson-started]').count()) === 1);
  ok('İzinli öğrenci listede yok, izinli notu var', (await tp.locator('[data-on-leave]').count()) === 1 && (await tp.locator('.att-btn').count()) === 3);
  await tp.click('[data-att-scan]'); await tp.waitForTimeout(800);
  await tp.fill('input[aria-label=card-code]', 'AAT1:' + TOK1); await btn(tp, 'Kontrol'); await tp.waitForTimeout(2500);
  const a3 = await get('attendance/LB-' + today);
  ok('15 dk sonra okutulan öğrenci "geç" (late)', JSON.stringify(a3.fields && a3.fields.records || {}).includes('"late"'));
  ok('Ekranda "dereng" bildirimi', (await txt(tp)).includes('dereng'));

  // 4) Sorumlu: "ders yapılmadı" işaretler (neden + açıklama) → yönetici raporu
  await goA(hp, 'announce'); await hp.waitForTimeout(500); await goA(hp, 'schedule'); await hp.waitForTimeout(1500);
  await hp.evaluate(() => { const c = [...document.querySelectorAll('button')].filter(x => x.offsetParent && x.textContent.trim() === '🚫'); c[0] && c[0].click(); }); await hp.waitForTimeout(1200);
  await hp.locator('textarea').last().fill('Mamoste nexweş bû');
  await btn(hp, 'Tomar bike'); await hp.waitForTimeout(800);
  await hp.waitForTimeout(1500);
  const ab = (await list('attendance')).filter(d => d.fields.teacherAbsent && d.fields.teacherAbsent.booleanValue);
  ok('"Ders yapılmadı" kaydı: neden + açıklama + işaretleyen', ab.length === 1 && ab[0].fields.absenceNote.stringValue === 'Mamoste nexweş bû' && ab[0].fields.absenceBy.stringValue === 'Berpirsa Şanoyê');

  // 6) Çocuk akademisi sorumlusu: kendi dersinin programını yazar
  const kp = await login(await mk(), '96202612', 'Head1234');
  await goA(kp, 'schedule'); await kp.waitForTimeout(1500);
  await btn(kp, 'Dersê Zêde Bike'); await kp.waitForTimeout(600);
  await kp.fill('#khs-title', 'Drama Lîstik'); await kp.selectOption('#khs-teacher', '72026001');
  await btn(kp, 'Tomar bike'); await kp.waitForTimeout(2500);
  const ks = (await list('kidSchedule')).filter(d => d.fields.title && d.fields.title.stringValue === 'Drama Lîstik');
  ok('Çocuk dersi kaydedildi: alan drama, öğretmen atanmış', ks.length === 1 && ks[0].fields.area.stringValue === 'drama' && ks[0].fields.teacherNo.stringValue === '72026001');
  ok('Çocuk programında ders görünür', (await kp.locator('[data-khs-row]').count()) === 1);

  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
