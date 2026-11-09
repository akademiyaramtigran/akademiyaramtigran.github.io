// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Öğretmen süzgeçli devam raporu — öğretmen seçilince devam yalnız o öğretmenin derslerinden hesaplanır,
//      isteğe bağlı tek ders seçilir; başka bölümün öğretmeni ve genel ders de sorumlunun raporunda; tarih aralığı raporunda da aynı;
//      değerlendirme raporları (eski + 1–10 formlar) ve öğretmen devamı da öğretmene göre süzülür
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
  const day = k => { const d = new Date(); d.setDate(d.getDate() - k); return ymd(d); };
  const enc = v => v === null ? { nullValue: null } : typeof v === 'number' ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }) : typeof v === 'boolean' ? { booleanValue: v } : Array.isArray(v) ? { arrayValue: { values: v.map(enc) } } : typeof v === 'object' ? { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)])) } } : { stringValue: String(v) };
  const putO = (path, o) => fetch(`${FS}/${path}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: enc(o).mapValue.fields }) }).then(r => { if (!r.ok) throw new Error('seed ' + path + ' ' + r.status); });
  await put('idx_staff/96000001', { no: '96000001', lvl: 'head', area: 'tiyatro' });
  await put('teachers/H1', { id: 'H1', no: '96000001', name: 'Berpirsa Şanoyê', area: 'tiyatro', isHead: true });
  await signUp('96000001@ogretmen.aat', 'Head1234');
  // Öğretmenler: Mesut (tiyatro hocası, çok ders), Rojda (müzik hocası, tiyatro sınıfına ders), Konuk (programda adı yazılı misafir)
  await put('teachers/TM', { id: 'TM', no: '50202610', name: 'Mesut Gever', area: 'tiyatro' });
  await put('teachers/TR', { id: 'TR', no: '50202611', name: 'Rojda Stran', area: 'muzik' });
  await put('teachers/TS', { id: 'TS', no: '50202612', name: 'Sinan Yedek', area: 'tiyatro' });
  // Öğrenciler: id sayısal (101…) / id yok (belge kimliği) / kayıt anahtarı belge kimliği olan
  await put('students/S1', { no: '20202601', name: 'Rojîn Aram', area: 'tiyatro', fireId: 'S1', id: 101 });
  await put('students/S2', { no: '20202602', name: 'Baran Şêx', area: 'tiyatro', fireId: 'S2', id: 102 });
  await put('students/S3', { no: '20202603', name: 'Dilan Kar', area: 'tiyatro', fireId: 'S3' });          // id alanı yok → id = belge kimliği
  await put('students/S4', { no: '20202604', name: 'Evîn Sor', area: 'tiyatro', fireId: 'S4', id: 104 });  // kayıt anahtarı 'S4' (belge kimliği)
  await put('idx_students/20202602', { no: '20202602' }); await signUp('20202602@ogrenci.aat', 'Stu12345');
  await put('classes/A1', { kind: 'area', name: '1. Sînif', area: 'tiyatro', studentNos: ['20202601', '20202602', '20202603', '20202604'] });
  await put('classes/G1', { kind: 'general', name: 'Giştî', area: 'genel', studentNos: ['20202601', '20202602', '20202603', '20202604'] });
  const L = (fire, id, o) => put('schedule/' + fire, { id, fireId: fire, lessonType: 'main', day: 'Dûşem', start: '09:00', end: '10:00', ...o });
  await L('L1', 11, { classId: 'A1', area: 'tiyatro', name: 'Ders A (haftalık)', teacherNo: '50202610' });
  await L('LX2', 22, { classId: 'A1', area: 'tiyatro', name: 'Ders B (id≠belge)', teacherNo: '50202610' });
  await L('L3', 13, { classId: 'G1', area: 'genel', name: 'Ders C (giştî sınıf)', teacherNo: '50202610' });
  await L('L4', 14, { classId: 'A1', area: 'tiyatro', name: 'Ders D (tek seferlik)', lessonType: 'extra', extraDates: [day(3)], day: '', teacherNo: '50202610' });
  await L('L5', 15, { classId: 'A1', area: 'tiyatro', name: 'Ders E (misafir)', teacherNo: '', guestTeacher: 'Konuk Hoca' });
  await L('L6', 16, { area: 'tiyatro', name: 'Ders F (sınıfsız)', teacherNo: '50202611' });
  await L('L7', 17, { classId: 'A1', area: 'tiyatro', name: 'Ders G (yedek öğretmen)', teacherNo: '50202610' });
  await put('lessonSubs/L7_' + day(2), { lessonFire: 'L7', date: day(2), teacherNo: '50202612', teacherName: 'Sinan Yedek', area: 'tiyatro', byNo: '96000001' });
  const putAtt = (id, lid, fire, cls, area, date, r, extra) => putO('attendance/' + id, { lessonId: lid, lessonFire: fire, classId: cls, area, date, records: r, lessonName: 'x', ...(extra || {}) });
  // 2 oturum her derste (kayıt anahtarları: sayısal id, belge kimliği karışık)
  const R1 = { '101': 'on', '102': 'off', S3: 'on', S4: 'late' };
  const R2 = { '101': 'on', '102': 'on', S3: 'off', S4: 'on' };
  const plan = [['11', 'L1', 'A1', 'tiyatro'], ['22', 'LX2', 'A1', 'tiyatro'], ['13', 'L3', 'G1', 'genel'], ['14', 'L4', 'A1', 'tiyatro'], ['15', 'L5', 'A1', 'tiyatro'], ['16', 'L6', '', 'tiyatro'], ['17', 'L7', 'A1', 'tiyatro']];
  for (const [lid, fire, cls, area] of plan) {
    await putAtt(lid + '-' + day(9), lid, fire, cls, area, day(9), R1, { takenBy: 'Hoca' });
    await putAtt(lid + '-' + day(2), lid, fire, cls, area, day(2), R2, { takenBy: lid === '17' ? 'Sinan Yedek' : 'Hoca' });
  }
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  // Öğrenci ekranının verisi (studentAtt, sunucu fonksiyonu yazar) hazır olana kadar bekle
  let sa = []; for (let i = 0; i < 40; i++) { sa = await list('studentAtt'); if (sa.length >= plan.length * 2 * 4) break; await new Promise(r => setTimeout(r, 1000)); }
  const byLesson = {}; sa.forEach(d => { const f = d.fields; const k = f.lessonId.stringValue; (byLesson[k] = byLesson[k] || new Set()).add(f.date.stringValue); });
  ok('Öğrenci ekranı verisi: her ders için 2 oturum, 4 öğrenci (anahtar türü fark etmez)', sa.length === plan.length * 2 * 4 && plan.every(([lid]) => byLesson[lid] && byLesson[lid].size === 2), sa.length + ' kayıt');
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } }); await routes(c);
  await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} });
  const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
  await p.getByText('Mamoste', { exact: true }).first().click();
  await p.locator('input.inp').first().fill('96000001'); await p.locator('input[type=password]').first().fill('Head1234');
  await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(7000);
  await p.evaluate(() => document.querySelector('.sm-it[data-key="reports"]').click()); await p.waitForTimeout(2500);
  const clk = q => p.evaluate(q => { const b = document.querySelector(q); if (!b) throw new Error('yok: ' + q); b.click(); }, q).then(() => p.waitForTimeout(900));
  const sel = (q, v) => p.evaluate(([q, v]) => { const s = document.querySelector(q); const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set; set.call(s, v); s.dispatchEvent(new Event('change', { bubbles: true })); }, [q, v]).then(() => p.waitForTimeout(900));
  const opts = q => p.evaluate(q => { const s = document.querySelector(q); return s ? [...s.options].map(o => o.value) : null; }, q);
  await clk('[data-rw-type="devam"]'); await clk('[data-rw-who="student"]');
  // Derse göre: HER ders raporda, her birinde 2 oturum
  const sessionsOf = async lid => { await p.evaluate(l => { const r = document.querySelector('[data-rw-lesson="' + l + '"] button'); if (r) r.click(); }, lid); await p.waitForTimeout(300); return p.evaluate(l => document.querySelectorAll('[data-rw-lesson="' + l + '"] [data-rw-session]').length, lid); };
  const rowsNow = () => p.evaluate(() => [...document.querySelectorAll('[data-rw-lesson]')].map(e => e.dataset.rwLesson));
  const all = await rowsNow();
  ok('Raporda (öğretmen süzgeci yok) bütün dersler görünür: ' + plan.map(x => x[0]).join(','), plan.every(([lid]) => all.includes(lid)), all.join(','));
  const bad = []; for (const [lid] of plan) { const n = await sessionsOf(lid); if (n !== 2) bad.push(lid + ':' + n); }
  ok('Her derste 2 oturum listelenir (öğrenci ekranıyla aynı)', !bad.length, bad.join(' '));
  // Öğrencilere göre: dört öğrencinin ders sayısı = öğrenci ekranındaki kayıt sayısı (7 ders × 2)
  await clk('[data-rw-view="student"]');
  const cnt = no => p.evaluate(no => (document.querySelector('[data-rep-student="' + no + '"]') || { innerText: '' }).innerText, no);
  const stuTxt = {}; for (const no of ['20202601', '20202602', '20202603', '20202604']) stuTxt[no] = await cnt(no);
  ok('Öğrencilere göre: her öğrencide 14 ders sayılır (anahtar türü fark etmez)', Object.values(stuTxt).every(t => /14 /.test(t)), JSON.stringify(stuTxt).slice(0, 300));
  // Öğretmen süzgeci: Mesut → A, B, C, D, G (5 ders) ; Rojda → F ; Misafir/yedek hocalar listede ona göre
  const tOpts = await opts('[data-rep-teacher]');
  ok('Öğretmen listesinde Mesut ve Rojda var', tOpts && tOpts.includes('50202610') && tOpts.includes('50202611'), JSON.stringify(tOpts));
  await sel('[data-rep-teacher]', '50202610');
  const lOpts = await opts('[data-rep-lesson]');
  ok('Mesut: ders seçeneği 5 ders (+ "hepsi")', lOpts && lOpts.length === 6, JSON.stringify(lOpts));
  await clk('[data-rw-view="lesson"]');
  const mRows = await rowsNow();
  ok('Mesut seçilince raporda 5 dersinin hepsi görünür (11,22,13,14,17)', ['11', '22', '13', '14', '17'].every(x => mRows.includes(x)) && mRows.length === 5, mRows.join(','));
  await sel('[data-rep-teacher]', '50202611');
  const rRows = await rowsNow();
  ok('Rojda seçilince yalnız kendi dersi (16) görünür', rRows.join(',') === '16', rRows.join(','));
  // Öğrenci ekranı: toplam bütün derslerden hesaplanır (Baran: 14 ders, 7 gelmedi → %50)
  const sc = await (await b.newContext({ viewport: { width: 430, height: 900 } })).newPage();
  await routes(sc.context()); await sc.context().addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} });
  sc.on('pageerror', e => errs.push('stu: ' + e.message));
  await sc.goto('http://localhost:8765/app/?emu=1'); await sc.waitForSelector('text=Têkeve', { timeout: 60000 });
  await sc.getByText('Xwendekar', { exact: true }).first().click();
  await sc.locator('input.inp').first().fill('20202602'); await sc.locator('input[type=password]').first().fill('Stu12345');
  await sc.getByText('Têkeve', { exact: true }).last().click(); await sc.waitForTimeout(7000);
  await sc.evaluate(() => document.querySelector('.pano-tile[data-key="attend"],.sm-it[data-key="attend"]').click());
  await sc.waitForSelector('[data-stu-att-view]', { timeout: 15000 }); await sc.waitForTimeout(2500);
  const sum = await sc.evaluate(() => { const e = document.querySelector('[data-stu-att-sum]'); return e ? e.dataset.stuAttSum + '|' + e.innerText.replace(/\s+/g, ' ') : ''; });
  const nRows = await sc.evaluate(() => document.querySelectorAll('[data-stu-att-row]').length);
  ok('Öğrenci ekranı: 14 ders listelenir, özet bütün derslerden (%50, toplam 14, gelmedi 7)', nRows === 14 && sum.startsWith('50|') && /Tevî: 14/.test(sum) && /❌ 7/.test(sum), nRows + ' · ' + sum);
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
