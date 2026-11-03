// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Rapor kapsamı — anketler kaldırıldı (hiçbir panelde anket yok); genel sorumlu yalnız genel dersleri ve
//      bu derslerin öğrencilerini görür (başka bölümden atanan öğretmen dahil); Öğrenci İşleri tüm bölümlerin
//      devam raporlarını alır ama değerlendirme sonuçlarını görmez
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
  const YR = String(new Date().getFullYear());
  const pad = n => String(n).padStart(2, '0'), ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const day = k => { const d = new Date(); d.setDate(d.getDate() - k); return ymd(d); };
  await put('idx_staff/96000001', { no: '96000001', lvl: 'head', area: 'tiyatro' });
  await put('teachers/H1', { id: 'H1', no: '96000001', name: 'Berpirsa Şanoyê', area: 'tiyatro', isHead: true });
  await signUp('96000001@ogretmen.aat', 'Head1234');
  await put('idx_staff/96000002', { no: '96000002', lvl: 'head', area: 'genel' });
  await put('teachers/H2', { id: 'H2', no: '96000002', name: 'Berpirsê Giştî', area: 'genel', isHead: true });
  await signUp('96000002@ogretmen.aat', 'Head1234');
  await put('idx_staff/98202601', { no: '98202601', lvl: 'registrar' });
  await put('teachers/TR', { no: '98202601', name: 'Karûbar', isRegistrar: true, area: 'genel' });
  await signUp('98202601@ogretmen.aat', 'Reg12345');
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' });
  await put('teachers/T50', { id: 'T50', no: '50202601', name: 'Mamoste Şano', area: 'tiyatro' });
  await signUp('50202601@ogretmen.aat', 'Tea12345');
  await put('teachers/T70', { id: 'T70', no: '50202603', name: 'Mamoste Piyano', area: 'muzik' });
  await put('idx_students/20202601', { no: '20202601' });
  await put('students/S1', { no: '20202601', name: 'Rojîn Aram', area: 'tiyatro', fireId: 'S1', id: 101 });
  await signUp('20202601@ogrenci.aat', 'Stu12345');
  await put('students/S2', { no: '20202602', name: 'Baran Şêx', area: 'tiyatro', fireId: 'S2', id: 102 });
  await put('students/S3', { no: '20202603', name: 'Jîyan Roj', area: 'muzik', fireId: 'S3', id: 103 });
  await put('classes/A1', { kind: 'area', name: '1. Sînif', area: 'tiyatro', studentNos: ['20202601', '20202602'] });
  await put('classes/G1', { kind: 'general', name: 'Giştî', area: 'genel', studentNos: ['20202601', '20202603'] });
  await put('classes/M1', { kind: 'area', name: '1. Sînif', area: 'muzik', studentNos: ['20202603'] });
  // Ortak (genel) derste verilen değerlendirmeler: Rojîn (tiyatro) ve Jîyan (müzik)
  const putEv = (id, o) => { const v = Object.values(o.c || {}); const sc = v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length * 2 * 10) / 10 : null;
    // Eski haftalık değerlendirme kaldırıldı: aynı puan sorumlunun formu (öğretmen → öğrenci) yanıtı olarak yazılır
    const f = { formId: { stringValue: 'FT2S' }, period: { stringValue: o.wk }, raterNo: { stringValue: o.teacherNo }, raterRole: { stringValue: 'teacher' }, targetNo: { stringValue: o.studentNo }, targetName: { stringValue: o.studentName || '' },
      area: { stringValue: o.area || '' }, classId: { stringValue: o.classId || '' }, academy: { stringValue: 'aat' }, direction: { stringValue: 't2s' }, answers: { mapValue: { fields: { q1: { doubleValue: sc } } } },
      notes: { mapValue: { fields: o.note ? { q1: { stringValue: o.note } } : {} } }, score10: { doubleValue: sc } };
    return fetch(`${FS}/evalResponses/${id}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: f }) }); };
  await putEv('EG1', { wk: day(9), teacherNo: '50202601', teacherName: 'Mamoste Şano', studentNo: '20202601', studentName: 'Rojîn Aram', area: 'genel', classId: 'G1', note: '', c: { p: 4, g: 4, h: 4, b: 4 } });
  await putEv('EG2', { wk: day(9), teacherNo: '50202601', teacherName: 'Mamoste Şano', studentNo: '20202603', studentName: 'Jîyan Roj', area: 'genel', classId: 'G1', note: '', c: { p: 2, g: 2, h: 2, b: 2 } });
  // Şano (tiyatro hocası) genel derse de giriyor
  await put('schedule/L1', { id: 11, fireId: 'L1', classId: 'A1', area: 'tiyatro', name: 'Şano 1', lessonType: 'main', day: 'Dûşem', start: '09:00', end: '10:00', teacherNo: '50202601' });
  await put('schedule/L3', { id: 13, fireId: 'L3', classId: 'G1', area: 'genel', name: 'Dîroka Hunerê', lessonType: 'main', day: 'Çarşem', start: '09:00', end: '10:00', teacherNo: '50202601' });
  await put('schedule/L4', { id: 14, fireId: 'L4', area: 'muzik', name: 'Piyano', lessonType: 'main', day: 'Pêncşem', start: '09:00', end: '10:00', teacherNo: '50202603' });
  const rec = o => ({ mapValue: { fields: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { stringValue: v }])) } });
  const putAtt = (id, lid, cls, area, date, r) => fetch(`${FS}/attendance/${id}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: { lessonId: { stringValue: lid }, classId: { stringValue: cls }, area: { stringValue: area }, date: { stringValue: date }, records: rec(r) } }) });
  // Rojîn: Şano 1'de 3 kez yok; Dîroka Hunerê'de hep var. Jîyan: Dîroka Hunerê'de 3 kez yok
  for (const k of [21, 14, 7]) await putAtt('11-' + k, '11', 'A1', 'tiyatro', day(k), { '101': 'off', '102': 'on' });
  for (const k of [20, 13, 6]) await putAtt('13-' + k, '13', 'G1', 'genel', day(k), { '101': 'on', '103': 'off' });
  await putAtt('14-a', '14', '', 'muzik', day(5), { '103': 'on' });
  // Çocuk akademisi girişleri (anket sekmesi olmamalı)
  const G = '9' + YR + '501', KT = '7' + YR + '501';
  await put('idx_guardians/' + G, { no: G }); await put('guardians/' + G, { no: G, name: 'Nûrê Aram', phone: '0555 1' });
  await put('kids/K1', { no: '8' + YR + '501', name: 'Dilan Aram', area: 'drama', classLevel: 1, guardianNos: [G] });
  await signUp(G + '@veli.aat', 'Veli12345');
  await put('idx_kidstaff/' + KT, { no: KT }); await put('kidTeachers/' + KT, { no: KT, name: 'Mamoste Berfîn', area: 'drama' });
  await signUp(KT + '@zmamoste.aat', 'Kid12345');

  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const mk = async w => { const c = await b.newContext({ viewport: { width: w || 1280, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); localStorage.setItem('zarok-lang', 'ku'); } catch (_) {} }); return c; };
  const login = async (no, pw, role) => { const p = await (await mk()).newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
    await p.getByText(role || 'Mamoste', { exact: true }).first().click();
    await p.locator('input.inp').first().fill(no); await p.locator('input[type=password]').first().fill(pw);
    await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(7000); return p; };
  const keysOf = pg => pg.evaluate(() => [...new Set([...document.querySelectorAll('.sm-it[data-key],.pano-tile[data-key]')].map(e => e.dataset.key))]);
  const go = (pg, k) => pg.evaluate(k => [...document.querySelectorAll('.sm-it[data-key="' + k + '"],.pano-tile[data-key="' + k + '"]')].find(x => x.getClientRects().length).click(), k).then(() => pg.waitForTimeout(2000));
  const rtabs = pg => pg.evaluate(() => [...document.querySelectorAll('[data-rw-type]')].map(e => e.dataset.rwType));
  const rwc = async (pg, ...qs) => { for (const q of qs) { await pg.evaluate(q => { const b = document.querySelector(q); if (!b) throw new Error('rapor adımı yok: ' + q); b.click(); }, q); await pg.waitForTimeout(800); } };
  const devStu = pg => rwc(pg, '[data-rw-type="devam"]', '[data-rw-who="student"]', '[data-rw-view="student"]');
  const pct = (pg, no) => pg.evaluate(no => { const r = document.querySelector('[data-rep-student="' + no + '"] .c-pct'); return r ? r.textContent.trim() : null; }, no);
  const alerts = pg => pg.evaluate(() => [...document.querySelectorAll('[data-alert]')].map(e => e.dataset.alert).sort());

  // 1) Bölüm sorumlusu (tiyatro): anket yok
  const hp = await login('96000001', 'Head1234');
  const hk = await keysOf(hp);
  ok('Sorumlu menüsünde anket yok', !hk.includes('surveys') && hk.includes('reports') && hk.includes('evalforms'), hk.join(','));
  await go(hp, 'reports');
  const ht = await rtabs(hp);
  ok('Sorumlu rapor türleri: Devam + Değerlendirme + Genel analiz (anket yok)', ht.join(',') === 'devam,eval,analiz', ht.join(','));
  await devStu(hp);
  ok('Tiyatro sorumlusu: Rojîn genel ders dahil %50 (3/6), müzik öğrencisi yok', (await pct(hp, '20202601')) === '50%' && (await pct(hp, '20202603')) === null, await pct(hp, '20202601'));
  // Ortak "Giştî" sınıfı seçilince yalnız sorumlunun kendi öğrencileri
  const clsOpts = await hp.evaluate(() => { const s = document.querySelector('[data-rw-class]'); return s ? [...s.options].map(o => o.value) : []; });
  ok('Sorumlunun sınıf listesi: kendi sınıfı + Giştî; başka bölümün sınıfı yok', clsOpts.includes('A1') && clsOpts.includes('G1') && !clsOpts.includes('M1'), JSON.stringify(clsOpts));
  await hp.evaluate(() => { const s = [...document.querySelectorAll('select')].find(x => [...x.options].some(o => o.value === 'G1')); const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set; set.call(s, 'G1'); s.dispatchEvent(new Event('change', { bubbles: true })); });
  await hp.waitForTimeout(800);
  ok('Giştî seçili: yalnız kendi öğrencisi (Rojîn); müzik öğrencisi ve sınıfta olmayan Baran yok', (await pct(hp, '20202601')) !== null && (await pct(hp, '20202603')) === null && (await pct(hp, '20202602')) === null);
  ok('Giştî seçili: öğrenci sayısı 1 (kendi öğrencisi)', (await hp.locator('[data-rep-student]').count()) === 1);
  await rwc(hp, '[data-rw-type="eval"]', '[data-rw-who="student"]'); await hp.waitForTimeout(800);
  const evRows = await hp.evaluate(() => [...document.querySelectorAll('[data-eval-row]')].map(e => e.dataset.evalRow));
  ok('Değerlendirme: ortak derste verilen puanlardan yalnız kendi öğrencisi (Rojîn), müzik öğrencisi (Jîyan) yok', evRows.includes('20202601') && !evRows.includes('20202603'), JSON.stringify(evRows));
  await go(hp, 'alerts');
  const ha = await alerts(hp);
  ok('Tiyatro sorumlusu uyarısı: Rojîn Şano 1; genel dersteki Jîyan yok', ha.includes('abs_20202601_11') && !ha.some(k => k.includes('20202603')), ha.join(','));
  await hp.context().close();

  // 2) Genel sorumlu: yalnız genel dersler
  const gp = await login('96000002', 'Head1234');
  await go(gp, 'reports');
  await devStu(gp);
  ok('Genel sorumlu: genel sınıfın öğrencileri (Rojîn, Jîyan) var, Baran yok', (await pct(gp, '20202601')) !== null && (await pct(gp, '20202603')) !== null && (await pct(gp, '20202602')) === null);
  ok('Genel sorumlu: devam yalnız genel dersten (Rojîn %100, Jîyan %0; bölüm dersi sayılmaz)', (await pct(gp, '20202601')) === '100%' && (await pct(gp, '20202603')) === '0%', (await pct(gp, '20202601')) + ' / ' + (await pct(gp, '20202603')));
  const gOpts = await gp.evaluate(() => [...document.querySelector('[data-rep-teacher]').options].map(o => o.value));
  ok('Genel sorumlu: genel derse giren başka bölüm öğretmeni (Şano) listede, müzik hocası yok', gOpts.includes('50202601') && !gOpts.includes('50202603'), JSON.stringify(gOpts));
  await rwc(gp, '[data-rw-type="eval"]', '[data-rw-who="student"]'); await gp.waitForTimeout(800);
  const gEv = await gp.evaluate(() => [...document.querySelectorAll('[data-eval-row]')].map(e => e.dataset.evalRow).sort());
  ok('Genel sorumlu: genel dersin değerlendirmelerinde tüm genel sınıf öğrencileri (Rojîn + Jîyan)', gEv.includes('20202601') && gEv.includes('20202603'), JSON.stringify(gEv));
  await go(gp, 'alerts');
  const ga = await alerts(gp);
  ok('Genel sorumlu uyarısı: yalnız genel ders (Jîyan · Dîroka Hunerê); bölüm dersi uyarısı yok', ga.includes('abs_20202603_13') && !ga.includes('abs_20202601_11'), ga.join(','));
  await gp.context().close();

  // 3) Öğrenci İşleri: rapor menüsü, tüm bölümler, değerlendirme yok
  const rp = await login('98202601', 'Reg12345');
  const rk = await keysOf(rp);
  ok('Öğrenci İşleri menüsünde Rapor var', rk.includes('reports'), rk.join(','));
  await go(rp, 'reports');
  ok('Öğrenci İşleri: akademi seçimi (Konservatuar / Çocuk Akademisi), arşiv yok', (await rp.locator('[data-rw-acad]').count()) === 2 && (await rp.locator('[data-rw-archive]').count()) === 0);
  await rwc(rp, '[data-rw-acad="aat"]');
  const rt = await rtabs(rp);
  ok('Öğrenci İşleri rapor türleri: Devam + Genel analiz; değerlendirme yok', rt.join(',') === 'devam,analiz', rt.join(','));
  ok('Öğrenci İşleri alan seçebilir (tüm alanlar)', (await rp.locator('[data-rw-area]').count()) === 1);
  await devStu(rp);
  ok('Öğrenci İşleri tüm bölümleri görür (tiyatro + müzik öğrencisi)', (await pct(rp, '20202601')) !== null && (await pct(rp, '20202603')) !== null);
  ok('Öğrenci İşleri devam ekranında değerlendirme özeti yok', !(await rp.evaluate(() => document.body.innerText)).includes('Mamoste → xwendekar'));
  await rp.context().close();

  // 4) Öğretmen ve öğrenci: anket menüsü yok
  const tp = await login('50202601', 'Tea12345');
  const tk = await keysOf(tp);
  ok('Öğretmen menüsünde anket yok', !tk.includes('surveys') && tk.includes('seval'), tk.join(','));
  await tp.context().close();
  const sp = await login('20202601', 'Stu12345', 'Xwendekar');
  const sk = await keysOf(sp);
  ok('Öğrenci menüsünde anket yok', !sk.includes('surveys') && sk.includes('teval'), sk.join(','));
  await sp.context().close();

  // 5) Çocuk akademisi: veli ve öğretmen
  const zk = async (no, pw, nth) => { const c = await mk(390); const p = await c.newPage(); p.on('pageerror', e => errs.push('zarok ' + no + ': ' + e.message));
    await p.goto('http://localhost:8765/zarok/app/?emu=1'); await p.waitForSelector('#l-no', { timeout: 20000 });
    await p.click('.roles button:nth-child(' + nth + ')'); await p.fill('#l-no', no); await p.fill('#l-pw', pw); await p.click('.login .btn');
    await p.waitForSelector('.top', { timeout: 20000 }); await p.waitForTimeout(2000);
    const k = await p.evaluate(() => [...new Set([...document.querySelectorAll('[data-tab]')].map(e => e.dataset.tab))]); await c.close(); return k; };
  const vk = await zk(G, 'Veli12345', 1);
  ok('Veli uygulamasında anket sekmesi yok', !vk.includes('surv') && vk.includes('teval'), vk.join(','));
  const kk = await zk(KT, 'Kid12345', 2);
  ok('Çocuk öğretmeni uygulamasında anket sekmesi yok', !kk.includes('eval') && kk.includes('seval'), kk.join(','));
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
