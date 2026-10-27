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

function evalWeek(d) { const x = d ? new Date(d) : new Date(); const y = new Date(x.getFullYear(), x.getMonth(), x.getDate()); y.setDate(y.getDate() - ((y.getDay() + 6) % 7));
  return y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0'); }
(async () => {
  await put('idx_staff/1000', { no: '1000', lvl: 'admin' });
  await put('teachers/TA', { no: '1000', name: 'Rêveber', isAdmin: true, area: 'genel' });
  await signUp('1000@ogretmen.aat', 'Admin123');
  await put('idx_staff/96202611', { no: '96202611', lvl: 'head', area: 'tiyatro' });
  await put('teachers/TH', { id: 'TH', no: '96202611', name: 'Berpirsa Şanoyê', isHead: true, area: 'tiyatro' });
  await signUp('96202611@ogretmen.aat', 'Head1234');
  await put('idx_staff/98202601', { no: '98202601', lvl: 'registrar' });
  await put('teachers/TR', { id: 'TR', no: '98202601', name: 'Karûbar', isRegistrar: true, area: 'genel' });
  await signUp('98202601@ogretmen.aat', 'Reg12345');
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' });
  await put('teachers/T50', { id: 'T50', no: '50202601', name: 'Mamoste Şano', area: 'tiyatro' });
  await signUp('50202601@ogretmen.aat', 'Tea12345');
  await put('idx_staff/50202602', { no: '50202602', lvl: 'teacher' });
  await put('teachers/T51', { id: 'T51', no: '50202602', name: 'Mamoste Din', area: 'tiyatro' });
  for (const [k, no, nm, id] of [['S1', '20202601', 'Rojîn Aram', 101], ['S2', '20202602', 'Azad Can', 102], ['S3', '20202603', 'Dilan Roj', 103]]) {
    await put('idx_students/' + no, { no }); await put('students/' + k, { no, name: nm, area: 'tiyatro', fireId: k, id }); await signUp(no + '@ogrenci.aat', 'Stu12345');
  }
  await put('classes/C1', { kind: 'area', area: 'tiyatro', name: '1. Sınıf', studentNos: ['20202601', '20202602'], teacherNos: ['50202601'], teacherNames: ['Mamoste Şano'] });
  await put('classes/C2', { kind: 'area', area: 'tiyatro', name: '2. Sınıf', studentNos: ['20202603'], teacherNos: ['50202602'], teacherNames: ['Mamoste Din'] });
  await put('schedule/L1', { id: 'L1', fireId: 'L1', area: 'tiyatro', classId: 'C1', name: 'Şano Bingeh', day: 'Dûşem', start: '10:00', end: '11:00', teacherNo: '50202601', teacherName: 'Mamoste Şano', lessonType: 'main' });
  const TODAY = new Date().toISOString().slice(0, 10);
  await put('schedule/L2', { id: 'L2', fireId: 'L2', area: 'tiyatro', classId: 'C1', name: 'Şano Yekroj', lessonType: 'extra', extraDates: [TODAY], start: '12:00', end: '13:00', teacherNo: '50202601', teacherName: 'Mamoste Şano' });
  await put('schedule/L3', { id: 'L3', fireId: 'L3', area: 'tiyatro', classId: 'C1', name: 'Atolyeya Dengan', lessonType: 'extra', category: 'extra', extraDates: [TODAY], start: '14:00', end: '15:00', teacherNo: '50202601', teacherName: 'Mamoste Şano' });
  await put('schedule/L4', { id: 'L4', fireId: 'L4', area: 'tiyatro', classId: 'C1', name: 'Atolyeya Mêvan', lessonType: 'extra', category: 'workshop', extraDates: [TODAY], start: '09:00', end: '23:00', guestTeacher: 'Hunermend Rêzan' });
  // Yoklama kaydı (gerçek haftalık grafik için) — map alanı elle
  await fetch(`${FS}/attendance/L1-2026-10-19`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: { lessonId: { stringValue: 'L1' }, lessonName: { stringValue: 'Şano Bingeh' }, date: { stringValue: '2026-10-19' },
    records: { mapValue: { fields: { '101': { stringValue: 'on' }, '102': { stringValue: 'off' } } } } } }) });

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
  const keysOf = pg => pg.evaluate(() => [...new Set([...document.querySelectorAll('.sm-it[data-key],.pano-tile[data-key]')].map(e => e.dataset.key))].join(','));
  const btn = (p, t) => p.evaluate(t => { const e = [...document.querySelectorAll('button')].filter(x => x.offsetParent && x.textContent.includes(t)).pop(); if (!e) throw new Error('düğme yok: ' + t); e.click(); }, t);
  const get = path => fetch(`${FS}/${path}`, { headers: H }).then(r => r.json());
  const WK = evalWeek();

  // 1) Öğretmen: kartlar
  const tp = await login(await mk(), '50202601', 'Tea12345');
  const tk = await keysOf(tp);
  ok('Öğretmen kartları: Duyuru, Sınıfım, Öğrenci Değerlendirmesi, Anket ayrı', ['announce', 'myclass', 'seval', 'surveys'].every(k => tk.split(',').includes(k)) && !tk.split(',').includes('messages') && !tk.split(',').includes('evaluation'), tk);
  ok('Ana ekranda haftalık değerlendirme hatırlatması (2 öğrenci)', (await tp.locator('[data-ev-reminder]').count()) === 1 && (await tp.locator('[data-ev-reminder]').innerText()).includes('2 / 2'), await tp.locator('[data-ev-reminder]').innerText().catch(() => ''));
  ok('Öğretmen ana ekranında devam yüzdesi / risk yok', !/Di Xeterê de|Navgîna Amadebûnê/.test(await txt(tp)));
  // 2) Öğrenci değerlendirmesi
  await goA(tp, 'seval'); await tp.waitForTimeout(1200);
  await tp.click('[data-ev-student="20202601"] button'); await tp.waitForTimeout(400);
  for (const k of ['p4', 'g3', 'h5', 'b4']) await tp.click('[data-ev-score="' + k + '"]');
  await tp.locator('[data-ev-student="20202601"] textarea').fill('Pir xebatkar');
  await tp.click('[data-ev-save]'); await tp.waitForTimeout(2500);
  const ev = await get('studentEvals/' + WK + '_50202601_20202601');
  const evf = ev.fields || {};
  ok('Değerlendirme kaydedildi (4 ölçüt + not)', !!evf.c && evf.c.mapValue.fields.p.integerValue === '4' && evf.note.stringValue === 'Pir xebatkar', JSON.stringify(evf).slice(0, 160));
  ok('İlerleme 1 / 2', (await tp.locator('[data-ev-progress]').innerText()).includes('1 / 2'));
  // 3) Duyuru: yalnız kendi sınıfına, dosyasız
  await goA(tp, 'announce'); await tp.waitForTimeout(800);
  await tp.locator('[role=tab]', { hasText: 'Bişîne' }).first().click(); await tp.waitForTimeout(400);
  ok('Duyuruda dosya ekleme yok', (await tp.locator('input[type=file]').count()) === 0);
  await tp.click('[data-ann-class="C1"]');
  await tp.locator('input[maxlength="140"]').fill('Prova Înê'); await tp.locator('textarea[maxlength="3000"]').fill('Saet 14:00 li salonê');
  await btn(tp, 'Bişîne'); await tp.waitForTimeout(2500);
  const cps = (await list('classPosts')).filter(d => d.fields.title && d.fields.title.stringValue === 'Prova Înê');
  ok('Sınıf duyurusu classPosts (duyuru, C1) olarak yazıldı', cps.length === 1 && cps[0].fields.type.stringValue === 'duyuru' && cps[0].fields.classId.stringValue === 'C1');
  ok('Öğretmen alan geneline duyuru yazmadı', (await list('announcements')).length === 0);
  ok('Gönderilenlerde görünür', (await tp.locator('[data-sent-ann]').count()) === 1);
  // 4) Sınıfım: Ödev & Belge + Mesajlar (mesajda dosya yok)
  await goA(tp, 'myclass'); await tp.waitForTimeout(1000);
  ok('Sınıfım: iki sekme (Ödev & Belge · Mesaj)', (await tp.locator('[data-hub-tab]').count()) === 2);
  ok('Sınıfım gönderiminde "duyuru" türü yok', !(await tp.evaluate(() => [...document.querySelectorAll('button')].some(b => b.offsetParent && /📢/.test(b.textContent) && /Ragihandin/.test(b.textContent)))));
  await tp.click('[data-hub-tab="messages"]'); await tp.waitForTimeout(800);
  await btn(tp, 'Peyamek Nû').catch(() => {}); await tp.waitForTimeout(600);
  ok('Mesaj yazarken dosya ekleme yok', (await tp.locator('input[type=file]').count()) === 0 && (await txt(tp)).includes('Erk û Belge'));

  // 5) Öğrenci: sınıf duyurusu Duyurular'da; öğretmen değerlendirmesi
  const sp = await login(await mk(430), '20202601', 'Stu12345', 'Xwendekar');
  ok('Öğrenci ana ekranında öğretmen değerlendirme hatırlatması', (await sp.locator('[data-ev-reminder]').count()) === 1);
  await goA(sp, 'announce'); await sp.waitForTimeout(1500);
  ok('Öğrenci: sınıf duyurusu Duyurular kartında', (await txt(sp)).includes('Prova Înê'));
  await goA(sp, 'myclass'); await sp.waitForTimeout(1200);
  ok('Öğrenci: Sınıfım kartında duyuru tekrar etmiyor', !(await txt(sp)).includes('Prova Înê'));
  await goA(sp, 'teval'); await sp.waitForTimeout(1200);
  ok('Öğrenci: öğretmeni listede', (await sp.locator('[data-tev-teacher="50202601"]').count()) === 1);
  await sp.click('[data-tev-teacher="50202601"] button'); await sp.waitForTimeout(300);
  for (const k of ['e5', 'h4', 'r5', 'f4']) await sp.click('[data-ev-score="' + k + '"]');
  await sp.locator('[data-tev-teacher="50202601"] textarea').fill('Ders xweş e');
  await sp.click('[data-tev-save]'); await sp.waitForTimeout(2500);
  const te = (await get('teacherEvals/' + WK + '_20202601_50202601')).fields || {};
  ok('Öğretmen değerlendirmesi kaydedildi (isimsiz)', !!te.c && te.c.mapValue.fields.e.integerValue === '5' && !te.studentName, JSON.stringify(te).slice(0, 140));
  ok('Öğrenci ekranında değerlendirme/rapor sonucu yok', !/%|Navgîn/.test(await sp.evaluate(() => document.querySelector('.scroll-area') ? document.querySelector('.scroll-area').innerText : '')));
  const sp3 = await login(await mk(430), '20202603', 'Stu12345', 'Xwendekar');
  await goA(sp3, 'announce'); await sp3.waitForTimeout(1500);
  ok('Başka sınıfın öğrencisi duyuruyu görmez', !(await txt(sp3)).includes('Prova Înê'));
  // 5b) Ders programı: tek günlük ANA ders "ek ders" değildir; ek ders rozeti yalnız gerçek ek derste
  await goA(sp, 'schedule'); await sp.waitForTimeout(1000);
  const sch = await txt(sp);
  ok('Program: bu haftanın günleri tarihli, bugünkü dersler listede (boş ekran yok)', (await sp.locator('[data-sched-day]').count()) >= 1 && (await sp.locator('[data-sched-lesson]').count()) >= 3);
  ok('Tek günlük ana ders programda, "ek ders" / "atölye" rozeti yalnız gerçekten öyle olan derste', sch.includes('Şano Yekroj') && sch.includes('Atolyeya Dengan') && (await sp.locator('[data-extra-badge]').count()) === 2 && sch.includes('Atolye') && !sch.includes('🎨'));
  // 5c) Öğrenci öğretmenine doğrudan mesaj yazar → öğretmen gelen kutusunda, yanıtlayabilir
  await goA(sp, 'messages'); await sp.waitForTimeout(800);
  await sp.click('[data-new-tmsg]'); await sp.selectOption('[data-tmsg-to]', '50202601');
  await sp.locator('input[maxlength="300"]').fill('Pirsa li ser rola min'); await sp.locator('textarea[maxlength="5000"]').fill('Ez dikarim rola Zîn bilîzim?');
  await sp.click('[data-tmsg-send]'); await sp.waitForTimeout(2000);
  const sm = (await list('messages')).filter(d => d.fields.toTeacherNo && d.fields.toTeacherNo.stringValue === '50202601');
  ok('Öğrenci → öğretmen mesajı kaydedildi', sm.length === 1 && sm[0].fields.fromNo.stringValue === '20202601' && sm[0].fields.toRole.stringValue === 'teacher');
  ok('Öğrenci gönderdiğini görür', (await txt(sp)).includes('Pirsa li ser rola min'));
  await goA(tp, 'myclass'); await tp.waitForTimeout(800); await tp.click('[data-hub-tab="messages"]'); await tp.waitForTimeout(800);
  await tp.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.offsetParent && x.textContent.includes('← Vegere')); b && b.click(); }); await tp.waitForTimeout(1000);
  ok('Öğretmen gelen kutusunda öğrencinin mesajı', (await txt(tp)).includes('Pirsa li ser rola min'));
  await tp.evaluate(() => { const e = [...document.querySelectorAll('div')].filter(d => d.children.length < 6 && d.textContent.includes('Pirsa li ser rola min')).pop(); (e.closest('[style*="cursor"]') || e).click(); }); await tp.waitForTimeout(800);
  ok('Öğretmen öğrenciye yanıt verebilir', (await tp.locator('[data-reply-student]').count()) === 1);

  // 6) Sorumlu: raporlar — öğrenci + öğretmen değerlendirmesi, anket
  const hp = await login(await mk(), '96202611', 'Head1234');
  await goA(hp, 'reports'); await hp.waitForTimeout(1200);
  await btn(hp, 'Nirxandina xwendekaran'); await hp.waitForTimeout(1500);
  ok('Sorumlu: öğrenci değerlendirme raporunda öğrenci satırı', (await hp.locator('[data-eval-row="20202601"]').count()) === 1);
  await btn(hp, 'Nirxandina mamosteyan'); await hp.waitForTimeout(1500);
  const tr = await hp.locator('[data-eval-row="50202601"]').count();
  await hp.click('[data-eval-row="50202601"] button').catch(() => {}); await hp.waitForTimeout(500);
  const trT = await hp.evaluate(() => (document.querySelector('[data-eval-report="teacher"]') || {}).innerText || '');
  ok('Sorumlu: öğretmen değerlendirmesi (isimsiz: öğrenci adı yok)', tr === 1 && trT.includes('Ders xweş e') && !trT.includes('Rojîn'), trT.slice(0, 200).replace(/\n/g, ' / '));
  await btn(hp, 'Ankêt'); await hp.waitForTimeout(800);
  ok('Sorumlu: anket raporu sekmesi', (await txt(hp)).includes('Ankêtên mamosteyan'));

  // 6b) Sorumlu: misafir öğretmenli dersin yoklamasını alır
  await goA(hp, 'gatt'); await hp.waitForTimeout(1200);
  await hp.click('[data-guest-lesson="L4"]'); await hp.waitForTimeout(800);
  ok('Sorumlu: misafir dersi + kartla (QR) alma düğmesi', (await hp.locator('[data-guest-row]').count()) === 2 && (await hp.locator('[data-guest-scan]').count()) === 1);
  await hp.click('[data-guest-row="20202601"] [data-gv="on"]'); await hp.click('[data-guest-save]'); await hp.waitForTimeout(2000);
  const ga = (await get('attendance/L4-' + TODAY)).fields || {};
  const gr = ga.records ? ga.records.mapValue.fields : {};
  ok('Misafir ders yoklaması kaydedildi (gelen on, işaretlenmeyen off)', gr['101'] && gr['101'].stringValue === 'on' && gr['102'] && gr['102'].stringValue === 'off' && ga.takenByNo.stringValue === '96202611', JSON.stringify(gr));

  // 7) Yönetici: öğrenci ayrıntısında GERÇEK haftalık grafik
  const ap = await login(await mk(), '1000', 'Admin123');
  await goA(ap, 'reports'); await ap.waitForTimeout(1500);
  const r1 = await ap.locator('[data-rep-student="20202601"]').innerText(), r2 = await ap.locator('[data-rep-student="20202602"]').innerText();
  ok('Devam raporu doğrudan yoklamalardan (misafir dersi dahil, anında)', r1.includes('100%') && r2.includes('0%'), r1.replace(/\n/g, ' ') + ' | ' + r2.replace(/\n/g, ' '));
  await ap.click('[data-rep-student="20202601"]'); await ap.waitForTimeout(2500);
  const ch = await ap.evaluate(() => { const c = document.querySelector('[data-week-chart]'); return c ? c.innerText : ''; });
  const det = await ap.evaluate(() => (document.querySelector('[data-student-report]') || {}).innerText || '');
  ok('Öğrenci ayrıntısı: haftalık grafik gerçek yoklamadan (%100 bir hafta)', ch.includes('100%') && det.includes('Şano Bingeh') && det.includes('Pir xebatkar'), ch.replace(/\n/g, ' '));

  // 8) Öğrenci İşleri: rapor yok
  const rp = await login(await mk(), '98202601', 'Reg12345');
  ok('Öğrenci İşleri menüsünde rapor yok', !(await keysOf(rp)).split(',').includes('rapor'), await keysOf(rp));

  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('HATA', e); process.exit(1); });
