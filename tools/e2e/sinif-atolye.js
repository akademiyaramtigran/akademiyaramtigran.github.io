// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Ana akademi sınıfları — alan sınıfı + ders programı, genel sınıf (tüm alanlardan),
//      atölye (aç → öğrenci/öğretmen ata → yoklama → kapat), öğrenci/öğretmen görünürlüğü, rapor filtresi
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
const clickText = (p, text, top) => p.evaluate(([t, top]) => {
  if (top) { const mv = [...document.querySelectorAll('.sm-it,.pano-tile')].filter(x => x.getClientRects().length); const m = mv.find(x => x.textContent.trim() === t) || mv.find(x => x.textContent.includes(t)); if (m) { m.click(); return; } }
  const ok = x => { const r = x.getBoundingClientRect(); return r.width > 0 && (!top || (r.top > 60 && r.top < 260)); };
  // Önce ekrandaki, yoksa yatay şeritte kaymış olanı al (kapalı yan menüdeki kopyalar -left ile elenir)
  const b = [...document.querySelectorAll('button')].filter(x => x.textContent.includes(t) && x.offsetParent !== null && ok(x))
    .sort((a, c) => (a.getBoundingClientRect().left < -200) - (c.getBoundingClientRect().left < -200))[0];
  if (!b) throw new Error('düğme yok: ' + t); b.scrollIntoView({ inline: 'center', block: 'nearest' }); b.click();
}, [text, top]);

const goA = (pg, k) => pg.evaluate(k => document.querySelector('.pano-tile[data-key="' + k + '"],.sm-it[data-key="' + k + '"]').click(), k);
(async () => {
  const TODAY = new Date().toISOString().slice(0, 10);
  await put('idx_staff/98202601', { no: '98202601', lvl: 'registrar' });
  await put('teachers/TR', { no: '98202601', name: 'Karûbar', isRegistrar: true, area: 'genel' });
  await signUp('98202601@ogretmen.aat', 'Reg12345');
  await put('idx_staff/1000', { no: '1000', lvl: 'admin' }); await put('teachers/TA', { no: '1000', name: 'Rêveber', isAdmin: true, area: 'genel' }); await signUp('1000@ogretmen.aat', 'Admin123');
  await put('idx_staff/96000001', { no: '96000001', lvl: 'head', area: 'muzik' }); await put('teachers/HM', { id: 'HM', no: '96000001', name: 'Berpirsa Muzîkê', area: 'muzik', isHead: true }); await signUp('96000001@ogretmen.aat', 'Head1234');
  await put('idx_staff/96000002', { no: '96000002', lvl: 'head', area: 'genel' }); await put('teachers/HG', { id: 'HG', no: '96000002', name: 'Berpirsê Giştî', area: 'genel', isHead: true }); await signUp('96000002@ogretmen.aat', 'Head1234');
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' });
  await put('teachers/T50', { no: '50202601', name: 'Mamoste Dilovan', area: 'muzik' });
  await signUp('50202601@ogretmen.aat', 'Tea12345');
  await put('idx_students/20202601', { no: '20202601' });
  await put('students/S1', { no: '20202601', name: 'Rojîn Aram', area: 'muzik', fireId: 'S1' });
  await signUp('20202601@ogrenci.aat', 'Stu12345');
  await put('idx_students/20202602', { no: '20202602' });
  await put('students/S2', { no: '20202602', name: 'Baran Şêx', area: 'muzik', fireId: 'S2' });
  await signUp('20202602@ogrenci.aat', 'Stu12345');
  await put('idx_students/20202699', { no: '20202699' });
  await put('students/S4', { no: '20202699', name: 'Elîf Dem', area: 'muzik', fireId: 'S4' });
  await put('idx_students/10202601', { no: '10202601' });
  await put('students/S3', { no: '10202601', name: 'Jîyan Roj', area: 'sinema', fireId: 'S3' });

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
  const topTab = (p, t) => p.evaluate(t => { const mv = [...document.querySelectorAll('.sm-it,.pano-tile')].filter(x => x.getClientRects().length); const m = mv.find(x => x.textContent.trim() === t) || mv.find(x => x.textContent.includes(t)); if (m) { m.click(); return; } const b = [...document.querySelectorAll('button')].filter(x => x.textContent.includes(t)).find(x => { if (x.matches('.sm-it,.pano-tile')) return true; const r = x.getBoundingClientRect(); return r.top > 60 && r.top < 240; }); b.scrollIntoView(); b.click(); }, t);
  const txt = p => p.evaluate(() => document.body.innerText);
  const getDocF = path => fetch(`${FS}/${path}`, { headers: H }).then(r => r.json());
  const cls = async n => (await list('classes')).find(d => d.fields.name && d.fields.name.stringValue === n);
  const idOf = d => d ? d.name.split('/').pop() : '';
  const check = (p, name) => p.locator('label', { hasText: name }).locator('input[type=checkbox]').check();
  const cardBtn = (p, cardText, btnText) => p.evaluate(([c, t]) => { const card = [...document.querySelectorAll('div')].filter(d => d.textContent.includes(c) && [...d.querySelectorAll('button')].some(x => x.textContent.includes(t))).pop();
    [...card.querySelectorAll('button')].find(x => x.textContent.includes(t)).click(); }, [cardText, btnText]);

  // ── 1) Alan sınıfı: Müzik · 1. Sınıf ──
  let p = await login(await mk(), '96000001', 'Head1234');
  await topTab(p, 'Sinif'); await p.waitForTimeout(1500);
  ok('Alan sorumlusu: sınıfsız öğrenciler (yalnız kendi alanı)', /Bê sinif \(3\)/.test(await txt(p)));
  await clickText(p, '➕ Sinifa nû'); await p.waitForTimeout(300);
  await p.locator('input[aria-label="Navê sinifê"]').fill('1. Sînif');
  ok('Alan sınıfı formunda yalnızca o alanın öğrencileri', !(await txt(p)).includes('Jîyan Roj') && (await txt(p)).includes('Baran Şêx'));
  await check(p, 'Mamoste Dilovan'); await check(p, 'Rojîn Aram');
  await clickText(p, '💾 Tomar bike'); await p.waitForTimeout(1500);
  const A = await cls('1. Sînif'); const Aid = idOf(A);
  ok('Alan sınıfı kaydedildi', A && A.fields.kind.stringValue === 'area' && JSON.stringify(A.fields.studentNos).includes('20202601') && JSON.stringify(A.fields.teacherNos).includes('50202601'));

  // ── 2) Sınıfa ders programı ──
  // Ders programını bölüm sorumluları hazırlar: Öğrenci İşleri sınıf kartında ders ekleyemez
  ok('Alan sorumlusu sınıf kartından ders ekleyebilir', (await txt(p)).includes('Ders zêde bike'));
  await put('schedule/LS1', { id: 'LS1', fireId: 'LS1', area: A.fields.area.stringValue, name: 'Solfej', classId: Aid, teacherNo: '50202601', teacherName: 'Mamoste Dilovan',
    lessonType: 'main', day: 'Dûşem', start: '09:00', end: '10:30', loc: '—' });
  await p.waitForTimeout(1500);
  const L = (await list('schedule')).find(d => d.fields.name.stringValue === 'Solfej');
  ok('Ders sınıfa bağlı (sorumlunun programı)', L && L.fields.classId && L.fields.classId.stringValue === Aid);
  ok('Sınıf kartında ders programı görünür', /Solfej/.test(await txt(p)) && /1 ders di bernameyê de/.test(await txt(p)));

  // ── 3) Genel sınıf: tüm alanlardan öğrenci ──
  const pg = await login(await mk(), '96000002', 'Head1234');
  await topTab(pg, 'Sinifa Giştî'); await pg.waitForTimeout(1500);
  await clickText(pg, '➕ Sinifa giştî ya nû'); await pg.waitForTimeout(300);
  await pg.locator('input[aria-label="Navê sinifê"]').fill('Koro');
  await check(pg, 'Mamoste Dilovan'); await check(pg, 'Rojîn Aram'); await check(pg, 'Jîyan Roj');
  await clickText(pg, '💾 Tomar bike'); await pg.waitForTimeout(1500);
  const G = await cls('Koro');
  ok('Genel sınıf iki alandan öğrenciyle kaydedildi', G && G.fields.kind.stringValue === 'general' && G.fields.area.stringValue === 'genel' && G.fields.studentNos.arrayValue.values.length === 2);

  // Aynı öğretmen ikinci bir ortak sınıfa (ör. başka dönemin öğrencileri) bağlanabilir
  await clickText(pg, '➕ Sinifa giştî ya nû'); await pg.waitForTimeout(300);
  await pg.locator('input[aria-label="Navê sinifê"]').fill('Koro B');
  await check(pg, 'Mamoste Dilovan'); await check(pg, 'Jîyan Roj');
  await clickText(pg, '💾 Tomar bike'); await pg.waitForTimeout(1500);
  const G2 = await cls('Koro B');
  ok('Aynı öğretmen iki ortak sınıfa bağlı', G2 && JSON.stringify(G2.fields.teacherNos).includes('50202601') && JSON.stringify(G.fields.teacherNos).includes('50202601'));

  // ── 4) Atölye sınıfı: bölüm sorumlusu normal sınıf açar ve "Atölye" işaretler → öğrencileri otomatik atölye öğrencisi olur ──
  await clickText(p, '➕ Sinifa nû'); await p.waitForTimeout(300);
  await p.locator('input[aria-label="Navê sinifê"]').fill('Hafta Sonu');
  await p.locator('input[data-class-ws]').check();
  await check(p, 'Mamoste Dilovan'); await check(p, 'Elîf Dem');
  ok('Atölye formunda yalnız sınıfsız öğrenciler (1. Sînif\'teki Rojîn yok)', (await p.locator('label', { hasText: 'Rojîn Aram' }).count()) === 0 && (await p.locator('label', { hasText: 'Elîf Dem' }).count()) === 1);
  await clickText(p, '💾 Tomar bike'); await p.waitForTimeout(2000);
  const W = await cls('Hafta Sonu'); const Wid = idOf(W);
  ok('Atölye sınıfı kaydedildi (bölüm sınıfı + atölye işareti)', W && W.fields.kind.stringValue === 'area' && W.fields.area.stringValue === 'muzik' && W.fields.workshop.booleanValue === true && JSON.stringify(W.fields.studentNos).includes('20202699'));
  ok('Sınıf kartında Atölye etiketi', (await p.locator('[data-ws-badge]').count()) === 1);
  // Haftalık tekrar eden ders (normal akademi mantığı)
  await put('schedule/WS1', { id: 'WS1', fireId: 'WS1', area: 'muzik', name: 'Hafta Sonu Atölyesi', classId: Wid, teacherNo: '50202601', teacherName: 'Mamoste Dilovan', lessonType: 'main', day: 'Şemî', start: '10:00', end: '12:00', loc: '—' });
  const putAtt = (id, o, recs) => fetch(`${FS}/attendance/${id}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: { ...Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { stringValue: v }])), records: { mapValue: { fields: Object.fromEntries(Object.entries(recs).map(([k, v]) => [k, { stringValue: v }])) } } } }) });
  await putAtt('WS1-' + TODAY, { lessonId: 'WS1', lessonName: 'Hafta Sonu Atölyesi', area: 'muzik', classId: Wid, date: TODAY }, { S4: 'on' });
  await putAtt('LS1-' + TODAY, { lessonId: 'LS1', lessonName: 'Solfej', area: 'muzik', classId: Aid, date: TODAY }, { S1: 'off', S2: 'late' });
  await p.waitForTimeout(1500);
  
  await clickText(p, '➕ Sinifa nû'); await p.waitForTimeout(300);
  ok('Akademi sınıfı formunda atölye öğrencisi görünmez', (await p.locator('label', { hasText: 'Elîf Dem' }).count()) === 0);
  await clickText(p, 'Betal').catch(() => {}); await p.reload(); await p.waitForTimeout(6000);

  // ── 5a) Sorumlunun program ekranı: atölye dersleri de görünür; bu hafta + gelecek hafta, biten ders arşiv/hafta seçimiyle ──
  const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  await put('schedule/WX1', { id: 'WX1', fireId: 'WX1', area: 'muzik', name: 'Atolyeya Îro', classId: Wid, category: 'workshop', lessonType: 'extra', extraDates: [TODAY], day: null, start: '14:00', end: '15:00', teacherNo: '50202601', teacherName: 'Mamoste Dilovan', loc: 'Salon' });
  await put('schedule/WX2', { id: 'WX2', fireId: 'WX2', area: 'muzik', name: 'Atolyeya Hefteya Bê', classId: Wid, category: 'workshop', lessonType: 'extra', extraDates: [addDays(8)], day: null, start: '14:00', end: '15:00', teacherNo: '50202601', teacherName: 'Mamoste Dilovan', loc: 'Salon' });
  await put('schedule/WX3', { id: 'WX3', fireId: 'WX3', area: 'muzik', name: 'Atolyeya Borî', classId: Wid, category: 'workshop', lessonType: 'extra', extraDates: [addDays(-3)], day: null, start: '14:00', end: '15:00', teacherNo: '50202601', teacherName: 'Mamoste Dilovan', loc: 'Salon' });
  const pw = await login(await mk(), '96000001', 'Head1234');
  await goA(pw, 'schedule'); await pw.waitForTimeout(1500);
  ok('Program ekranında atölye (haftalık) dersi görünür, 🛠 etiketli', (await pw.locator('[data-ws-lesson]').count()) >= 1 && (await txt(pw)).includes('Hafta Sonu Atölyesi'));
  await pw.click('[data-sched-tab="extra"]'); await pw.waitForTimeout(800);
  const ex1 = await txt(pw);
  ok('Ek ders/atölye: bu hafta + gelecek hafta görünür, biten ders görünmez', ex1.includes('Atolyeya Îro') && ex1.includes('Atolyeya Hefteya Bê') && !ex1.includes('Atolyeya Borî'), ex1.replace(/\n/g, ' / ').slice(430, 1100));
  await pw.click('[data-wk-mode="pick"]'); await pw.waitForTimeout(500);
  ok('"Hefteyek hilbijêre": hafta seçici açılır', (await pw.evaluate(() => document.querySelector('[data-wk-bar]').children.length)) >= 4);
  await pw.click('[data-wk-mode="all"]'); await pw.waitForTimeout(500);
  await pw.evaluate(() => { const b = document.querySelector('[data-sched-archive]'); b && b.click(); }); await pw.waitForTimeout(500);
  ok('"Hemû": biten ders arşivde görünür', (await txt(pw)).includes('Atolyeya Borî'));

  // ── 5b) Bölüm sorumlusu raporu: Kapsam = Atölye (devam + değerlendirme), akademi raporunda atölye öğrencisi yok ──
  await goA(p, 'reports'); await p.waitForTimeout(1200);
  const rcl = async q => { await p.evaluate(q => { const b = document.querySelector(q); if (!b) throw new Error('rapor adımı yok: ' + q); b.click(); }, q); await p.waitForTimeout(700); };
  await rcl('[data-rw-type="devam"]'); await p.waitForTimeout(1500);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-rw-csv]')]);
  const csvTxt = require('fs').readFileSync(await dl.path(), 'utf8');
  const solfejRow = csvTxt.split('\n').find(l => l.startsWith('Solfej')) || '';
  const cells = solfejRow.split(';');
  ok('Excel/PDF ders satırı: gelmeyen ve geç gelen öğrencilerin ADLARI (tarihle)', /Rojîn Aram \(/.test(cells[4] || '') && /Baran Şêx \(/.test(cells[5] || '') && !/✓|⏱|✗/.test(solfejRow), solfejRow);
  await rcl('[data-rw-view="student"]');
  const aatRows = await p.evaluate(() => [...document.querySelectorAll('[data-rep-student]')].map(e => e.dataset.repStudent));
  ok('Akademi devam raporunda atölye öğrencisi yok', !aatRows.includes('20202699') && aatRows.includes('20202601'), JSON.stringify(aatRows));
  await rcl('[data-rw-scope="ws"]'); await rcl('[data-rw-type="devam"]'); await rcl('[data-rw-view="student"]'); await p.waitForTimeout(800);
  const wsRows = await p.evaluate(() => [...document.querySelectorAll('[data-rep-student]')].map(e => e.dataset.repStudent));
  ok('Atölye kapsamı devam raporu: yalnız atölye öğrencisi', wsRows.includes('20202699') && !wsRows.includes('20202601'), JSON.stringify(wsRows));
  ok('Atölye kapsamında Genel analiz / listeler yok, Devam + Değerlendirme var', (await p.locator('[data-rw-type="analiz"]').count()) === 0 && (await p.locator('[data-rw-type="eval"]').count()) === 1);
  ok('Devam raporunda "Mamoste (ders durumu)" seçeneği yok', (await p.locator('[data-rw-who="teacher"]').count()) === 0);

  // ── 6) Rapor: sınıf filtresi ──
  ok('Öğrenci İşleri panelinde rapor yok', !(await p.evaluate(() => [...document.querySelectorAll('.sm-it[data-key],.pano-tile[data-key]')].some(e => e.dataset.key === 'rapor'))));
  const rpA = await login(await mk(), '1000', 'Admin123');
  await rpA.evaluate(() => document.querySelector('.sm-it[data-key="reports"],.pano-tile[data-key="reports"]').click()); await rpA.waitForTimeout(1500);
  for (const q of ['[data-rw-acad="aat"]', '[data-rw-type="devam"]', '[data-rw-who="student"]', '[data-rw-view="student"]']) { await rpA.evaluate(q => document.querySelector(q).click(), q); await rpA.waitForTimeout(800); }
  await rpA.selectOption('[data-rw-class]', Aid); await rpA.waitForTimeout(800);
  const r6 = await rpA.evaluate(() => [...document.querySelectorAll('[data-rep-student]')].map(e => e.innerText.split('\n').find(x => /[a-zî]{3}/i.test(x)) || ''));
  ok('Rapor: sınıf filtresi yalnızca sınıfın öğrencileri', r6.includes('Rojîn Aram') && !r6.includes('Baran Şêx') && !r6.includes('Jîyan Roj'), JSON.stringify(r6));

  // ── 7) Öğrenci görünürlüğü ──
  const s1 = await login(await mk(430), '20202601', 'Stu12345', 'Xwendekar');
  const h1 = await txt(s1);
  const hero = await s1.evaluate(() => (document.querySelector('.student-hero') || {}).innerText || '');
  ok('Öğrenci üst panelinde sınıflar var, öğretmen adları yok', hero.includes('1. Sînif') && hero.includes('Koro') && !hero.includes('Mamoste Dilovan'), hero.replace(/\n/g, ' / '));
  await clickText(s1, 'Bername'); await s1.waitForTimeout(1000);
  ok('Sınıftaki öğrenci sınıf dersini görür', (await txt(s1)).includes('Solfej'));
  const s2 = await login(await mk(430), '20202602', 'Stu12345', 'Xwendekar');
  await clickText(s2, 'Bername'); await s2.waitForTimeout(1000);
  const t2 = await txt(s2);
  ok('Sınıfta olmayan aynı alan öğrencisi dersi görmez', !t2.includes('Solfej') && !t2.includes('Atolyeya Deng'));

  // ── 8) Öğretmen: öğrencilerim = sınıflarının öğrencileri ──
  const tp = await login(await mk(430), '50202601', 'Tea12345');
  await tp.evaluate(() => [...document.querySelectorAll('.pano-tile[data-key="students"],.sm-it[data-key="students"]')].filter(x => x.getClientRects().length).pop().click());
  await tp.waitForTimeout(1500);
  await tp.getByText('Sinifên Min').first().waitFor({ timeout: 10000 }).catch(() => {});
  const t8 = await txt(tp);
  ok('Öğretmen: Sinifên Min (alan + genel, kapanan atölye yok)', t8.includes('Sinifên Min') && t8.includes('Muzîk · 1. Sînif') && t8.includes('🌐 Koro') && !t8.includes('Atolyeya Deng'), t8.split('\n').filter(l => /Sinif|Koro|Atolye|Sînif/.test(l)).join(' / '));
  ok('Öğretmenin öğrenci listesi sınıflarından (başka alandan Jîyan var, sınıfsız Baran yok)', t8.includes('Jîyan Roj') && t8.includes('Rojîn Aram') && !t8.includes('Baran Şêx'));

  // ── 8b) Toplu mesaj yalnızca seçilen sınıfın öğrencilerine (alanın tamamına değil) ──
  await goA(tp, 'myclass'); await tp.waitForTimeout(800); await tp.click('[data-hub-tab="messages"]');
  await tp.waitForTimeout(800);
  await tp.evaluate(() => [...document.querySelectorAll('button')].find(x => x.textContent.includes('Peyamek Nû')).click()); await tp.waitForTimeout(400);
  await tp.evaluate(() => [...document.querySelectorAll('button')].find(x => x.textContent.trim().endsWith('Hemûyan')).click()); await tp.waitForTimeout(300);
  const koroOpt = await tp.evaluate(() => [...document.querySelectorAll('select[aria-label=bulk-to] option')].find(o => o.textContent.includes('Koro (')).value);
  await tp.selectOption('select[aria-label=bulk-to]', koroOpt);
  await tp.locator('input[placeholder="Sernav..."]').fill('Prova'); await tp.locator('textarea').first().fill('Sibê prova heye');
  await tp.evaluate(() => [...document.querySelectorAll('button')].filter(x => x.textContent.includes('Bişîne')).pop().click()); await tp.waitForTimeout(2500);
  const bm = (await list('messages')).filter(d => d.fields.subject && d.fields.subject.stringValue === 'Prova').map(d => d.fields.recipientNo.stringValue).sort();
  ok('Toplu mesaj yalnızca sınıfın öğrencilerine (alan grubu yok)', JSON.stringify(bm) === JSON.stringify(['10202601', '20202601']), JSON.stringify(bm));

  // ── 9) Öğretmen elle yoklama (QR sorununda yedek) ──
  // Bugünün dersi: sınıfı 1. Sînif (yalnız Rojîn). Elle "geç" işaretle → kaydet → yeniden açınca
  // işaret yüklü → QR aç/kapat: okutmayan ama elle işaretlenen öğrenci "yok"a düşmez.
  const KUD = ['Yekşem', 'Dûşem', 'Sêşem', 'Çarşem', 'Pêncşem', 'Înî', 'Şemî'][new Date().getDay()];
  await put('schedule/MAN1', { id: 'MAN1', name: 'Teorî', day: KUD, start: '00:00', end: '23:59', area: 'muzik', lessonType: 'main',
    classId: Aid, teacherNo: '50202601', teacher: 'Mamoste Dilovan' });
  const tm = await login(await mk(430), '50202601', 'Tea12345');
  const goAtt = async () => { await goA(tm, 'attendance'); await tm.evaluate(() => { }); await tm.waitForTimeout(1500); };
  const pickLs = () => tm.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('Teorî') && x.textContent.includes('📅')); b && b.click(); });
  await goAtt(); await pickLs(); await tm.waitForTimeout(800);
  const rowBtn = (cls) => tm.evaluate(c => { const row = [...document.querySelectorAll('div')].filter(d => d.textContent.includes('Rojîn Aram') && d.querySelectorAll('.att-btn').length === 3).pop();
    const bs = [...row.querySelectorAll('.att-btn')]; if (c) { bs[1].click(); return true; } return bs[1].classList.contains('late'); }, cls);
  await rowBtn(true); await tm.waitForTimeout(300);
  await tm.evaluate(() => { const b = document.querySelector('[data-att-save-list]') || [...document.querySelectorAll('button')].find(x => /^(Tomar bike|Kaydet|Tomar)$/.test(x.textContent.trim())); b.click(); });
  await tm.waitForTimeout(2000);
  let MA = await getDocF('attendance/MAN1-' + TODAY);
  ok('Öğretmen elle yoklama kaydetti (geç)', MA.fields && MA.fields.records.mapValue.fields.S1.stringValue === 'late', JSON.stringify(MA.fields && MA.fields.records));
  await tm.reload(); await tm.waitForTimeout(7000); await goAtt(); await pickLs(); await tm.waitForTimeout(1500);
  ok('Yeniden açınca kaydedilen elle yoklama yüklü', await rowBtn(false));
  // QR'ı bu ders için aç ve kimse okutmadan kapat: elle "geç" işaretli öğrenci korunur
  // Dersi başlat → "Ders QR'ı" (saatten bağımsız)
  await tm.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('Dersê Dest Pê Bike') && x.offsetParent); b && b.click(); });
  await tm.waitForTimeout(1200);
  await tm.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('📡') && x.textContent.includes('QR ya dersê') && x.offsetParent); b.click(); });
  await tm.waitForTimeout(2000);
  const qrOpen = (await txt(tm)).includes('QR ya Nû');
  await tm.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '✕ Bigire'); b.click(); });
  await tm.waitForTimeout(2500);
  MA = await getDocF('attendance/MAN1-' + TODAY);
  ok('QR kapanınca elle işaretlenen öğrenci "yok"a düşmez', qrOpen && MA.fields.records.mapValue.fields.S1.stringValue === 'late', 'qr=' + qrOpen + ' ' + JSON.stringify(MA.fields.records));
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  const bad = out.filter(l => l.startsWith('❌')).length;
  console.log('\n' + (bad ? '❌ ' + bad + ' adım başarısız' : '✅ Hepsi geçti (' + out.length + ' adım)'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('HATA', e); process.exit(1); });
