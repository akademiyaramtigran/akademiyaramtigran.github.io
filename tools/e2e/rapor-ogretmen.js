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
  await put('idx_staff/96000001', { no: '96000001', lvl: 'head', area: 'tiyatro' });
  await put('teachers/H1', { id: 'H1', no: '96000001', name: 'Berpirsa Şanoyê', area: 'tiyatro', isHead: true });
  await signUp('96000001@ogretmen.aat', 'Head1234');
  await put('teachers/T50', { id: 'T50', no: '50202601', name: 'Mamoste Şano', area: 'tiyatro' });
  await put('teachers/T60', { id: 'T60', no: '50202602', name: 'Mamoste Stran', area: 'muzik' });
  await put('teachers/T70', { id: 'T70', no: '50202603', name: 'Mamoste Piyano', area: 'muzik' });
  await put('students/S1', { no: '20202601', name: 'Rojîn Aram', area: 'tiyatro', fireId: 'S1', id: 101 });
  await put('students/S2', { no: '20202602', name: 'Baran Şêx', area: 'tiyatro', fireId: 'S2', id: 102 });
  await put('students/S3', { no: '20202603', name: 'Jîyan Roj', area: 'muzik', fireId: 'S3', id: 103 });
  await put('classes/A1', { kind: 'area', name: '1. Sînif', area: 'tiyatro', studentNos: ['20202601', '20202602'] });
  await put('classes/G1', { kind: 'general', name: 'Giştî', area: 'genel', studentNos: ['20202601', '20202603'] });
  // Şano (T50): Şano 1 (bölüm) + Dîroka Hunerê (genel); Stran (müzik hocası) tiyatro sınıfına Şan dersi veriyor
  await put('schedule/L1', { id: 11, fireId: 'L1', classId: 'A1', area: 'tiyatro', name: 'Şano 1', lessonType: 'main', day: 'Dûşem', start: '09:00', end: '10:00', teacherNo: '50202601' });
  await put('schedule/L2', { id: 12, fireId: 'L2', classId: 'A1', area: 'tiyatro', name: 'Şan', lessonType: 'main', day: 'Sêşem', start: '09:00', end: '10:00', teacherNo: '50202602' });
  await put('schedule/L3', { id: 13, fireId: 'L3', classId: 'G1', area: 'genel', name: 'Dîroka Hunerê', lessonType: 'main', day: 'Çarşem', start: '09:00', end: '10:00', teacherNo: '50202601' });
  await put('schedule/L4', { id: 14, fireId: 'L4', area: 'muzik', name: 'Piyano', lessonType: 'main', day: 'Pêncşem', start: '09:00', end: '10:00', teacherNo: '50202603' });
  const rec = o => ({ mapValue: { fields: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { stringValue: v }])) } });
  const putAtt = (id, lid, cls, area, date, r) => fetch(`${FS}/attendance/${id}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: { lessonId: { stringValue: lid }, classId: { stringValue: cls }, area: { stringValue: area }, date: { stringValue: date }, records: rec(r) } }) });
  // Rojîn: Şano 1 → 2 kez gelmedi; Şan → 2 kez geldi; Dîroka Hunerê → 1 kez geldi
  await putAtt('11-a', '11', 'A1', 'tiyatro', day(14), { '101': 'off', '102': 'on' });
  await putAtt('11-b', '11', 'A1', 'tiyatro', day(7), { '101': 'off', '102': 'on' });
  await putAtt('12-a', '12', 'A1', 'tiyatro', day(13), { '101': 'on', '102': 'off' });
  await putAtt('12-b', '12', 'A1', 'tiyatro', day(6), { '101': 'on', '102': 'off' });
  await putAtt('13-a', '13', 'G1', 'genel', day(12), { '101': 'on', '103': 'off' });
  await putAtt('14-a', '14', '', 'muzik', day(11), { '103': 'on' });
  // Genel değer kodlayıcı (iç içe nesne/dizi)
  const enc = v => v === null ? { nullValue: null } : typeof v === 'number' ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }) : typeof v === 'boolean' ? { booleanValue: v } : Array.isArray(v) ? { arrayValue: { values: v.map(enc) } } : typeof v === 'object' ? { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)])) } } : { stringValue: String(v) };
  const putO = (path, o) => fetch(`${FS}/${path}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: enc(o).mapValue.fields }) }).then(r => { if (!r.ok) throw new Error('seed ' + path + ' ' + r.status); });
  // Sorumlunun formu (öğretmen → öğrenci): iki öğretmen Rojîn'i değerlendirdi (10 ve 2)
  await putO('evalForms/FT', { title: 'Nirxandina Xwendekaran', academy: 'aat', direction: 't2s', area: 'tiyatro', period: 'once', questions: [{ id: 'q1', type: 'score', text: 'Beşdarî' }], active: true, ownerNo: '96000001', ownerName: 'Berpirsa Şanoyê', createdAtIso: new Date().toISOString() });
  await putO('evalResponses/E1', { formId: 'FT', period: day(10), raterNo: '50202601', raterRole: 'teacher', targetNo: '20202601', targetName: 'Rojîn Aram', area: 'tiyatro', academy: 'aat', direction: 't2s', answers: { q1: 10 }, score10: 10 });
  await putO('evalResponses/E2', { formId: 'FT', period: day(10), raterNo: '50202602', raterRole: 'teacher', targetNo: '20202601', targetName: 'Rojîn Aram', area: 'tiyatro', academy: 'aat', direction: 't2s', answers: { q1: 2 }, score10: 2 });
  // 1–10 form (öğrenci → öğretmen): Şano 9, Stran 3
  await putO('evalForms/F1', { title: 'Nirxandina Mamosteyan', academy: 'aat', direction: 's2t', area: 'tiyatro', period: 'once', questions: [{ id: 'q1', type: 'score', text: 'Ders' }], active: true, ownerNo: '96000001', ownerName: 'Berpirsa Şanoyê', createdAtIso: new Date().toISOString() });
  await putO('evalResponses/R1', { formId: 'F1', period: 'once', raterNo: '20202601', raterRole: 'student', targetNo: '50202601', targetName: 'Mamoste Şano', area: 'tiyatro', academy: 'aat', direction: 's2t', answers: { q1: 9 }, score10: 9 });
  await putO('evalResponses/R2', { formId: 'F1', period: 'once', raterNo: '20202601', raterRole: 'student', targetNo: '50202602', targetName: 'Mamoste Stran', area: 'tiyatro', academy: 'aat', direction: 's2t', answers: { q1: 3 }, score10: 3 });

  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
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
  const pct = no => p.evaluate(no => { const r = document.querySelector('[data-rep-student="' + no + '"] .c-pct'); return r ? r.textContent.trim() : ''; }, no);
  const shown = no => p.evaluate(no => !!document.querySelector('[data-rep-student="' + no + '"]'), no);
  const sel = (q, v) => p.evaluate(([q, v]) => { const s = document.querySelector(q); const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set; set.call(s, v); s.dispatchEvent(new Event('change', { bubbles: true })); }, [q, v]).then(() => p.waitForTimeout(700));
  const opts = q => p.evaluate(q => { const s = document.querySelector(q); return s ? [...s.options].map(o => o.value) : null; }, q);
  const clk = (q) => p.evaluate(q => { const b = document.querySelector(q); if (!b) throw new Error('yok: ' + q); b.click(); }, q).then(() => p.waitForTimeout(900));
  const txt = q => p.evaluate(q => (document.querySelector(q) || {}).innerText || '', q);

  // Adım adım rapor: sorumluda alan sabit; tür → kimin → dönem
  ok('Rapor oluştur: sorumluda akademi adımı yok, alan sabit (Şano)', (await p.locator('[data-rw-acad]').count()) === 0 && (await txt('[data-rw-area-fixed]')).includes('Şano'), await txt('[data-rw-area-fixed]'));
  ok('Rapor türleri: Devam · Değerlendirme · Genel analiz · Listeler', (await p.evaluate(() => [...document.querySelectorAll('[data-rw-type]')].map(e => e.dataset.rwType).join(','))) === 'devam,eval,analiz,list,tlist');
  ok('Kimin adımı tür seçilmeden görünmez', (await p.locator('[data-rw-who]').count()) === 0);
  await clk('[data-rw-type="devam"]'); await clk('[data-rw-who="student"]');
  ok('Dönem adımı: Bu yıl seçili', (await p.locator('[data-rw-period="year"].on').count()) === 1);
  // Derse göre (varsayılan): en çok katılan üstte
  const lessonPct = () => p.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-rw-lesson]')].map(e => [e.dataset.rwLesson, e.querySelector('.c-pct').textContent.trim()])));
  const lessonOrder = () => p.evaluate(() => [...document.querySelectorAll('[data-rw-lesson]')].map(e => e.dataset.rwLesson).join(','));
  const gL = await lessonPct();
  ok('Derse göre: Şano 1 %50 (Rojîn 0/2 + Baran 2/2), Şan %50, Dîroka Hunerê %100 (yalnız bölüm öğrencisi), müzik dersi yok', gL['11'] === '50%' && gL['12'] === '50%' && gL['13'] === '100%' && !gL['14'], JSON.stringify(gL));
  ok('Derse göre: en çok katılan ders en üstte', (await lessonOrder()).startsWith('13'), await lessonOrder());
  await clk('[data-rw-lesson="11"] button');
  const ses = await p.evaluate(() => [...document.querySelectorAll('[data-rw-lesson="11"] [data-rw-session]')].map(e => e.innerText.replace(/\n/g, ' ')));
  ok('Ders açılınca tarihli oturumlar: kim geldi / kim gelmedi', ses.length === 2 && ses.every(x => x.includes('✗ Rojîn Aram') && x.includes('✓ Baran Şêx')), JSON.stringify(ses));
  // Öğrencilere göre
  await clk('[data-rw-view="student"]');
  ok('Tüm dersler: Rojîn 3/5 = %60', (await pct('20202601')).startsWith('60'), await pct('20202601'));
  const tOpts = await opts('[data-rep-teacher]');
  ok('Öğretmen listesinde başka bölümün öğretmeni (tiyatroya ders veren müzik hocası) var, ilgisiz olan yok', tOpts && tOpts.includes('50202602') && tOpts.includes('50202601') && !tOpts.includes('50202603'), JSON.stringify(tOpts));
  ok('Öğretmen seçilmeden ders seçimi görünmez', (await p.locator('[data-rep-lesson]').count()) === 0);
  await sel('[data-rep-teacher]', '50202602');
  ok('Stran seçildi → Rojîn yalnız Şan dersinden %100', (await pct('20202601')).startsWith('100'), await pct('20202601'));
  ok('Stran seçildi → Baran Şan dersinden %0', (await pct('20202602')).startsWith('0'), await pct('20202602'));
  await sel('[data-rep-teacher]', '50202601');
  const lOpts = await opts('[data-rep-lesson]');
  ok('Şano seçildi → ders listesi: Şano 1 + genel ders (Dîroka Hunerê)', lOpts && lOpts.includes('11') && lOpts.includes('13') && !lOpts.includes('12'), JSON.stringify(lOpts));
  ok('Şano seçildi → Rojîn 1/3 = %33 (Şan dersi sayılmaz)', (await pct('20202601')).startsWith('33'), await pct('20202601'));
  ok('Başka bölüm öğrencisi sorumlunun raporunda yok', !(await shown('20202603')));
  await sel('[data-rep-lesson]', '11');
  ok('Ders: Şano 1 → Rojîn %0', (await pct('20202601')).startsWith('0'), await pct('20202601'));
  ok('Süzgeç açıklamasında öğretmen ve ders adı görünür', (await txt('[data-stu-att]')).includes('Şano 1'));
  await sel('[data-rep-lesson]', '13');
  ok('Ders: Dîroka Hunerê (genel) → Rojîn %100, sınıfta olmayan Baran listede yok', (await pct('20202601')).startsWith('100') && !(await shown('20202602')), await pct('20202601'));
  await sel('[data-rep-teacher]', 'all');
  // Sınıf: bölüm sınıfları + ortak (Giştî) ayrı grupta; ortak sınıfta yalnız kendi öğrencisi
  const groups = await p.evaluate(() => [...document.querySelectorAll('[data-rw-class] optgroup')].map(g => g.label + ':' + [...g.querySelectorAll('option')].map(o => o.value).join('|')));
  ok('Sınıf listesi gruplu: bölüm sınıfı (A1) + ortak sınıf (G1)', groups.length === 2 && groups[0].endsWith('A1') && groups[1].endsWith('G1'), JSON.stringify(groups));
  await sel('[data-rw-class]', 'G1');
  ok('Ortak sınıf seçildi: yalnız kendi öğrencisi (Rojîn), müzik öğrencisi yok', (await shown('20202601')) && !(await shown('20202603')) && !(await shown('20202602')));
  await sel('[data-rw-class]', 'all');
  // Dönem: bu ay / geçen ay
  const ym = d => d.slice(0, 7), nowD = new Date(), lastM = ymd(new Date(nowD.getFullYear(), nowD.getMonth() - 1, 1)).slice(0, 7), thisM = ymd(nowD).slice(0, 7);
  const R5 = [[14, 'off'], [7, 'off'], [13, 'on'], [6, 'on'], [12, 'on']];
  const expOf = m => { const r = R5.filter(([k]) => ym(day(k)) === m); return r.length ? Math.round(r.filter(x => x[1] === 'on').length / r.length * 100) + '%' : '—'; };
  const per = async k => { await clk('[data-rw-period="' + k + '"]'); await clk('[data-rw-view="student"]'); return pct('20202601'); };
  const pThis = await per('month'), pLast = await per('last');
  const eThis = expOf(thisM), eLast = expOf(lastM);
  ok('Dönem: "Ev meh" / "Meha borî" yalnız o ayın derslerini sayar', pThis === eThis && pLast === eLast, 'bu ay ' + pThis + ' (beklenen ' + eThis + ') · geçen ay ' + pLast + ' (beklenen ' + eLast + ')');
  ok('Dönem: "Ev sal" → yine %60', (await per('year')) === '60%', await pct('20202601'));
  ok('İzin kayıtları devam raporunun altında', (await p.locator('[data-rep-leaves]').count()) === 1);
  ok('İndirme: PDF + Excel', (await p.locator('[data-rw-pdf]').count()) === 1 && (await p.locator('[data-rw-csv]').count()) === 1);

  // Devam raporunda öğretmenin kendi devamı (ders durumu) yok: yalnız öğrenci devamı + öğretmen süzgeci
  ok('Devam raporunda "Mamoste" (ders durumu) seçeneği yok', (await p.locator('[data-rw-who="teacher"]').count()) === 0);
  ok('Öğretmen süzgeci devam raporunda duruyor', (await p.locator('[data-rep-teacher]').count()) === 1);

  // Değerlendirme (form yanıtları)
  await clk('[data-rw-type="eval"]'); await clk('[data-rw-who="student"]');
  const evOpts = await opts('[data-ev-teacher]');
  ok('Değerlendirme: başka bölümün öğretmeni (Stran) listede', evOpts && evOpts.includes('50202602'), JSON.stringify(evOpts));
  const evAll = await txt('[data-eval-row="20202601"]');
  await sel('[data-ev-teacher]', '50202602');
  const evSt = await txt('[data-eval-row="20202601"]');
  ok('Değerlendirme 1–10: tümü 6.0 (10 ve 2) → Stran seçili 2.0 (1 kayıt)', evAll.includes('6.0') && evSt.includes('2.0') && evSt.includes('1 '), evAll.replace(/\n/g, ' ') + ' / ' + evSt.replace(/\n/g, ' '));
  await clk('[data-rw-who="teacher"]'); await p.waitForTimeout(500);
  const tv = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-eval-row]')].map(e => [e.dataset.evalRow, e.innerText.replace(/\n/g, ' ')])));
  ok('Değerlendirme → Öğretmenler: form puanları (Şano 9.0, Stran 3.0)', (tv['50202601'] || '').includes('9.0') && (tv['50202602'] || '').includes('3.0'), JSON.stringify(tv));
  // 1–10 form sonuçları (Değerlendirme formları menüsü)
  await p.evaluate(() => document.querySelector('.sm-it[data-key="evalforms"]').click()); await p.waitForTimeout(1500);
  await p.click('[data-ef-results="F1"]'); await p.waitForTimeout(1500);
  const efAll = await p.evaluate(() => [...document.querySelectorAll('[data-ef-target]')].map(e => e.dataset.efTarget).sort());
  await sel('[data-ef-teacher]', '50202602');
  const efSt = await p.evaluate(() => [...document.querySelectorAll('[data-ef-target]')].map(e => e.dataset.efTarget));
  const efQ = await txt('[data-ef-qavg="q1"]');
  ok('Form sonuçları: Stran seçili → yalnız onun puanı (3.0)', efAll.length === 2 && efSt.join() === '50202602' && efQ.includes('3.0'), JSON.stringify(efAll) + ' ' + JSON.stringify(efSt) + ' ' + efQ);
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
