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
  await put('idx_staff/1000', { no: '1000', lvl: 'admin' }); await put('teachers/TA', { no: '1000', name: 'Rêveber', isAdmin: true, area: 'genel' }); await signUp('1000@ogretmen.aat', 'Admin123');
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
  await put('students/S9', { no: '20202609', name: 'Hefte Sonu', area: 'sinema', fireId: 'S9', id: 109 });
  await put('classes/WS1', { kind: 'workshop', name: 'Atolye Hefte Sonu', area: 'genel', studentNos: ['20202609'] });
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
  const putAtt = (id, lid, cls, area, date, r) => fetch(`${FS}/attendance/${id}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: { endedAt: { integerValue: '1' }, lessonId: { stringValue: lid }, classId: { stringValue: cls }, area: { stringValue: area }, date: { stringValue: date }, records: rec(r) } }) });
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
    await p.goto('http://localhost:8765/app/?emu=1&dvcut=2000-01-01'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
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
  // Ayrıntı raporu: Rojîn'in 14 gün önceki Şano 1 dersi izinli (neden yazılı) + değerlendirme formu (soru + cevap)
  await put('studentLeaves/LV1', { studentNo: '20202601', studentId: '101', studentName: 'Rojîn Aram', area: 'tiyatro', from: day(14), to: day(14), reason: 'Nexweşî ya giran', by: 'Berpirsa Şanoyê', byNo: '96000001', kid: false });
  { const sv = x => ({ stringValue: x }); await fetch(`${FS}/evalForms/FT2S`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: { title: sv('Mamosteyê → Xwendekar'), academy: sv('aat'), direction: sv('t2s'), area: sv('tiyatro'), period: sv('weekly'), active: { booleanValue: true }, ownerNo: sv('96000001'),
    questions: { arrayValue: { values: [{ mapValue: { fields: { id: sv('q1'), text: sv('Beşdarî'), type: sv('score') } } }] } } } }) }); }
  const ap = await login('1000', 'Admin123');
  await go(ap, 'reports');
  await rwc(ap, '[data-rw-acad="aat"]');
  await devStu(ap);
  await ap.evaluate(() => document.querySelector('[data-rep-detail-toggle="20202601"]').click()); await ap.waitForTimeout(600);
  const dets = await ap.evaluate(() => [...document.querySelectorAll('[data-rep-detail="20202601"] [data-att-detail-row]')].map(e => e.dataset.attDetailRow + ':' + e.textContent.replace(/\s+/g, ' ').slice(0, 90)));
  ok('Devam raporu: öğrencinin her dersi tarih + durumla listelenir (Şano 1 yok/izinli, Dîroka Hunerê var)', dets.length >= 5 && dets.some(x => x.startsWith('off:') && x.includes('Şano 1')) && dets.some(x => x.startsWith('on:') && x.includes('Dîroka Hunerê')), dets.length + ' · ' + dets.slice(0, 3).join(' | '));
  ok('İzinli dersin izin nedeni yazar', dets.some(x => x.startsWith('leave:') && x.includes('Nexweşî ya giran')), dets.filter(x => x.startsWith('leave:')).join(' | '));
  await ap.evaluate(() => document.querySelector('[data-rep-student="20202601"]').click()); await ap.waitForTimeout(1800);
  const md = await ap.evaluate(() => { const m = document.querySelector('[data-student-report]'); return m ? [...m.querySelectorAll('[data-att-detail-row]')].length + '|' + (m.querySelector('[data-att-summary]') ? 'sum' : '') + '|' + ((m.querySelector('[data-leave-reason]') || {}).textContent || '') + '|' + ((m.querySelector('[data-eval-answers]') || {}).textContent || '').slice(0, 200) : ''; });
  ok('Öğrenci ayrıntı penceresi: tüm dersler + özet + izin nedeni + değerlendirme cevapları', /^\d+\|sum\|.*Nexweşî ya giran\|.*Beşdarî/.test(md) && parseInt(md) >= 5, md);
  await ap.evaluate(() => { const b = document.querySelector('[data-student-report] button[aria-label="✕"]'); b && b.click(); });
  await rwc(ap, '[data-rw-new]', '[data-rw-acad="aat"]', '[data-rw-type="eval"]', '[data-rw-who="student"]'); await ap.waitForTimeout(1500);
  await ap.evaluate(() => { const r = document.querySelector('[data-eval-row="20202601"] button'); r && r.click(); }); await ap.waitForTimeout(600);
  const ea = await ap.evaluate(() => { const d = document.querySelector('[data-eval-detail="20202601"]'); return d ? [...d.querySelectorAll('[data-eval-answer]')].map(e => e.textContent.replace(/\s+/g, ' ')).join(' || ') : ''; });
  ok('Değerlendirme raporu: her değerlendirmenin soru + puan cevapları görünür', /Beşdarî/.test(ea) && /\/10/.test(ea), ea.slice(0, 120));
  await rwc(ap, '[data-rw-new]', '[data-rw-acad="aat"]', '[data-rw-type="analiz"]', '[data-rw-who="student"]'); await ap.waitForTimeout(1500);
  await ap.evaluate(() => { const r = [...document.querySelectorAll('button')].find(x => x.textContent.includes('Rojîn Aram')); r && r.click(); }); await ap.waitForTimeout(800);
  const gaK = await ap.evaluate(() => ({ s: (document.querySelector('[data-an-sessions]') || {}).textContent || '', e: (document.querySelector('[data-an-evs]') || {}).textContent || '' }));
  ok('Genel analiz karnesi: dersler tek tek + değerlendirme cevapları', /Şano 1|Dîroka/.test(gaK.s) && /Beşdarî/.test(gaK.e) && /Nexweşî ya giran/.test(gaK.s), (gaK.s + ' || ' + gaK.e).slice(0, 140));
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
