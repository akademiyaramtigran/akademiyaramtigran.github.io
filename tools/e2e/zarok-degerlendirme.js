// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Çocuk Akademisi — öğretmen kartları (yalnız kendi sınıfına dosyasız duyuru, Sınıfım = ödev/belge + mesaj,
//      mesajlar yalnız kendi velileri), haftalık değerlendirme (öğretmen → çocuk, veli → öğretmen isimsiz) +
//      hatırlatma; çocuk akademisi sorumlusu raporlarda iki değerlendirmeyi görür.
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

const goZ = (pg, k) => pg.evaluate(k => { const vis = e => e && e.getClientRects().length; const f = () => [...document.querySelectorAll('[data-tab="' + k + '"]')].find(vis);
  let el = f(); if (!el) { const pb = document.querySelector('.pano-btn'); if (pb) pb.click(); el = f(); } el.click(); }, k);
function evalWeek() { const x = new Date(); const y = new Date(x.getFullYear(), x.getMonth(), x.getDate()); y.setDate(y.getDate() - ((y.getDay() + 6) % 7));
  return y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0'); }
(async () => {
  await put('idx_staff/1000', { no: '1000', lvl: 'admin' }); await put('teachers/TA', { no: '1000', name: 'Rêveber', isAdmin: true, area: 'genel' }); await signUp('1000@ogretmen.aat', 'Admin123');
  await put('idx_staff/96202612', { no: '96202612', lvl: 'head', area: 'drama' });
  await put('teachers/TK', { id: 'TK', no: '96202612', name: 'Berpirsa Dramayê', isHead: true, area: 'drama' }); await signUp('96202612@ogretmen.aat', 'Head1234');
  for (const [no, nm] of [['72026001', 'Mamoste Hêvî'], ['72026002', 'Mamoste Din']]) { await put('idx_kidstaff/' + no, { no }); await put('kidTeachers/' + no, { no, name: nm, area: 'drama' }); await signUp(no + '@zmamoste.aat', 'Kid12345'); }
  for (const [no, nm] of [['92026001', 'Veli Aram'], ['92026002', 'Veli Din']]) { await put('idx_guardians/' + no, { no }); await put('guardians/' + no, { no, name: nm, phone: '0532' }); await signUp(no + '@veli.aat', 'Vel12345'); }
  await put('kids/K1', { no: '82026001', name: 'Rojîn Zarok', area: 'drama', guardianNos: ['92026001'] });
  await put('kids/K2', { no: '82026002', name: 'Baran Zarok', area: 'drama', guardianNos: ['92026002'] });
  await put('kidClasses/KC1', { kind: 'area', area: 'drama', name: '1. Sınıf', studentNos: ['82026001'], teacherNos: ['72026001'], teacherNames: ['Mamoste Hêvî'] });
  await put('kidClasses/KC2', { kind: 'area', area: 'drama', name: '2. Sınıf', studentNos: ['82026002'], teacherNos: ['72026002'], teacherNames: ['Mamoste Din'] });
  await put('kidMessages/M1', { guardianNo: '92026001', guardianName: 'Veli Aram', kidId: 'K1', kidName: 'Rojîn Zarok', text: 'Peyama malbata min', from: 'guardian', read: false, createdAt: new Date() });
  await put('kidMessages/M3', { guardianNo: '92026001', guardianName: 'Veli Aram', kidId: 'K1', kidName: 'Rojîn Zarok', text: 'Ji mamosteyê din re', toTeacherNo: '72026002', toName: 'Mamoste Din', from: 'guardian', read: false, createdAt: new Date() });
  await put('kidSchedule/KL1', { id: 'KL1', title: 'Drama Lîstik', area: 'drama', classId: 'KC1', day: new Date().getDay(), start: '10:00', end: '11:00', teacherNo: '72026001' });
  await put('kidMessages/M2', { guardianNo: '92026002', guardianName: 'Veli Din', kidId: 'K2', kidName: 'Baran Zarok', text: 'Peyama malbata din', from: 'guardian', read: false, createdAt: new Date() });

  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const mk = async (w) => { const c = await b.newContext({ viewport: { width: w || 420, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); localStorage.setItem('zarok-lang', 'ku'); } catch (_) {} }); return c; };
  const zlogin = async (role, no, pw) => { const c = await mk(); const p = await c.newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/zarok/app/?emu=1'); await p.waitForSelector('#l-no', { timeout: 30000 });
    await p.click('.roles button:nth-child(' + (role === 't' ? 2 : 1) + ')'); await p.fill('#l-no', no); await p.fill('#l-pw', pw); await p.click('.login .btn');
    await p.waitForSelector('.top', { timeout: 30000 }); await p.waitForTimeout(2500); return p; };
  const txt = p => p.evaluate(() => document.body.innerText);
  const get = path => fetch(`${FS}/${path}`, { headers: H }).then(r => r.json());
  const WK = evalWeek();

  // 1) Çocuk öğretmeni: kartlar, hatırlatma, değerlendirme
  const tp = await zlogin('t', '72026001', 'Kid12345');
  const navT = await tp.evaluate(() => [...document.querySelectorAll('.pano-tile[data-tab]')].map(x => x.dataset.tab).join('|'));
  ok('Öğretmen kartları: Duyuru, Sınıfım (ödev+mesaj), Öğrenci değerlendirmesi, Anket', navT === 'home|att|ann|myclass|kids|card|seval|eval|profile', navT);
  await goZ(tp, 'home'); await tp.waitForTimeout(500);
  ok('Ana ekranda haftalık değerlendirme hatırlatması', (await tp.locator('[data-ev-reminder]').count()) === 1);
  await goZ(tp, 'seval'); await tp.waitForTimeout(600);
  ok('Yalnız kendi sınıfının çocuğu listede', (await tp.locator('[data-ev-kid="82026001"]').count()) === 1 && (await tp.locator('[data-ev-kid="82026002"]').count()) === 0);
  await tp.click('[data-ev-kid="82026001"] button'); await tp.waitForTimeout(300);
  for (const k of ['p4', 'g3', 'h5', 'b4']) await tp.click('[data-ev-score="' + k + '"]');
  await tp.locator('[data-ev-kid="82026001"] textarea').fill('Gelek jîr e');
  await tp.click('[data-ev-save]'); await tp.waitForTimeout(2000);
  const ke = (await get('kidEvals/' + WK + '_72026001_82026001')).fields || {};
  ok('Çocuk değerlendirmesi kaydedildi', !!ke.c && ke.c.mapValue.fields.p.integerValue === '4' && ke.note.stringValue === 'Gelek jîr e', JSON.stringify(ke).slice(0, 120));
  // 2) Duyuru: yalnız kendi sınıfına, dosyasız
  await goZ(tp, 'ann'); await tp.waitForTimeout(500);
  ok('Duyuruda dosya ekleme yok', (await tp.locator('main input[type=file]').count()) === 0);
  await tp.click('[data-ann-cls="KC1"]'); await tp.fill('#t-ann-t', 'Prova Şemiyê'); await tp.fill('#t-ann-b', 'Saet 11:00');
  await tp.evaluate(() => [...document.querySelectorAll('main .card button.btn')].find(b => b.textContent.includes('📤')).click()); await tp.waitForTimeout(2000);
  const kp = (await list('kidClassPosts')).filter(d => d.fields.title && d.fields.title.stringValue === 'Prova Şemiyê');
  ok('Sınıf duyurusu kidClassPosts (duyuru, KC1)', kp.length === 1 && kp[0].fields.type.stringValue === 'duyuru' && kp[0].fields.classId.stringValue === 'KC1');
  ok('Öğretmen genel duyuru yazmadı', (await list('kidAnnouncements')).length === 0);
  // 3) Sınıfım: ödev & belge + mesaj; mesajlar yalnız kendi velileri
  await goZ(tp, 'myclass'); await tp.waitForTimeout(500);
  ok('Sınıfım: iki sekme', (await tp.locator('[data-hub]').count()) === 2);
  ok('Sınıfım gönderiminde duyuru türü yok', !(await tp.evaluate(() => [...document.querySelectorAll('main .chipb')].some(b => b.textContent.includes('📢')))));
  await tp.click('[data-hub="msg"]'); await tp.waitForTimeout(500);
  const tm = await txt(tp);
  ok('Mesajlar yalnız kendi sınıfının velileri', tm.includes('Peyama malbata min') && !tm.includes('Peyama malbata din'));
  ok('Mesajda dosya yok (açıklama)', tm.includes('Pel û belge ji Sinifa min') && (await tp.locator('main input[type=file]').count()) === 0);

  // 4) Veli: sınıf duyurusu Duyurular'da, ödev kartında değil; öğretmeni isimsiz değerlendirir
  const vp = await zlogin('g', '92026001', 'Vel12345');
  const navG = await vp.evaluate(() => [...document.querySelectorAll('.pano-tile[data-tab]')].map(x => x.dataset.tab).join('|'));
  ok('Veli kartları: Duyuru, Ödev & Belge, Anket, Öğretmen değerlendirmesi', navG === 'today|sched|att|ann|cls|surv|teval|msg', navG);
  await goZ(vp, 'today'); await vp.waitForTimeout(500);
  ok('Veli ana ekranında değerlendirme hatırlatması', (await vp.locator('[data-ev-reminder]').count()) === 1);
  await goZ(vp, 'ann'); await vp.waitForTimeout(800);
  ok('Veli: sınıf duyurusu Duyurular kartında', (await txt(vp)).includes('Prova Şemiyê'));
  await goZ(vp, 'cls'); await vp.waitForTimeout(500);
  ok('Veli: Ödev & Belge kartında duyuru tekrar etmiyor', !(await txt(vp)).includes('Prova Şemiyê'));
  await goZ(vp, 'teval'); await vp.waitForTimeout(600);
  ok('Veli: çocuğunun öğretmeni listede (başka sınıfın öğretmeni yok)', (await vp.locator('[data-tev="72026001"]').count()) === 1 && (await vp.locator('[data-tev="72026002"]').count()) === 0);
  await vp.click('[data-tev="72026001"] button'); await vp.waitForTimeout(300);
  for (const k of ['e5', 'h4', 'r5', 'f4']) await vp.click('[data-ev-score="' + k + '"]');
  await vp.locator('[data-tev="72026001"] textarea').fill('Zarokê me kêfxweş e');
  await vp.click('[data-tev-save]'); await vp.waitForTimeout(2000);
  const ge = (await get('kidTeacherEvals/' + WK + '_92026001_72026001')).fields || {};
  ok('Öğretmen değerlendirmesi kaydedildi (veli adı yok)', !!ge.c && ge.c.mapValue.fields.e.integerValue === '5' && !ge.guardianName, JSON.stringify(ge).slice(0, 120));
  const vp2 = await zlogin('g', '92026002', 'Vel12345');
  await goZ(vp2, 'ann'); await vp2.waitForTimeout(800);
  ok('Başka sınıfın velisi duyuruyu görmez', !(await txt(vp2)).includes('Prova Şemiyê'));

  // 4b) Veli öğretmene doğrudan mesaj yazar; başka öğretmene yazılan mesaj bu öğretmende görünmez
  await goZ(vp, 'msg'); await vp.waitForTimeout(500);
  await vp.selectOption('#m-to', '72026001'); await vp.fill('#m-text', 'Silav mamoste, pirsek heye'); await vp.click('main .btn'); await vp.waitForTimeout(1500);
  const gm = (await list('kidMessages')).filter(d => d.fields.text && d.fields.text.stringValue === 'Silav mamoste, pirsek heye');
  ok('Veli → öğretmen mesajı (toTeacherNo)', gm.length === 1 && gm[0].fields.toTeacherNo.stringValue === '72026001');
  await goZ(tp, 'myclass'); await tp.waitForTimeout(400); await tp.click('[data-hub="msg"]'); await tp.waitForTimeout(800);
  const tm2 = await txt(tp);
  ok('Öğretmen kendisine yazılanı görür, başka öğretmene yazılanı görmez', tm2.includes('Silav mamoste, pirsek heye') && !tm2.includes('Ji mamosteyê din re'));
  // 4c) Elle yoklama + "Dersi bitir": gelmeyen çocuğun velisine "gelmedi"
  await goZ(tp, 'att'); await tp.waitForTimeout(600);
  await tp.click('[data-start-lesson="KL1"]'); await tp.waitForTimeout(400);
  ok('Yoklama ekranında kart okutma düğmesi yok (elle yoklama)', !(await txt(tp)).includes('📇'));
  await tp.click('[data-end-lesson="KL1"]'); await tp.waitForTimeout(2500);
  const ab = (await list('kidAttendance')).filter(d => d.fields.kidId && d.fields.kidId.stringValue === 'K1' && d.fields.type.stringValue === 'absent');
  ok('Dersi bitir: gelmeyen çocuk "absent" kaydı (veliye bildirim)', ab.length === 1 && (await tp.locator('[data-lesson-ended]').count()) === 1);
  await goZ(vp, 'today'); await vp.waitForTimeout(1500);
  ok('Veli: bugün "derse gelmedi" durumu', (await txt(vp)).includes('Îro nehat dersê'));
  ok('QR/kart sistemi duruyor (Kart sekmesi)', (await tp.locator('.pano-tile[data-tab="card"], [data-tab="card"]').count()) >= 1);

  // 5) Çocuk akademisi sorumlusu: raporlarda iki değerlendirme
  const hc = await mk(1280); const hp = await hc.newPage(); hp.on('pageerror', e => errs.push('head: ' + e.message)); hp.on('dialog', d => d.accept());
  await hp.goto('http://localhost:8765/app/?emu=1'); await hp.waitForSelector('text=Têkeve', { timeout: 60000 });
  await hp.getByText('Mamoste', { exact: true }).first().click(); await hp.locator('input.inp').first().fill('96202612'); await hp.locator('input[type=password]').first().fill('Head1234');
  await hp.getByText('Têkeve', { exact: true }).last().click(); await hp.waitForTimeout(7000);
  await hp.evaluate(() => document.querySelector('.sm-it[data-key="reports"],.pano-tile[data-key="reports"]').click()); await hp.waitForTimeout(1200);
  await hp.click('[data-khr="kseval"]'); await hp.waitForTimeout(1500);
  ok('Sorumlu: çocuk değerlendirme raporunda çocuk satırı', (await hp.locator('[data-eval-row="82026001"]').count()) === 1);
  await hp.click('[data-khr="kteval"]'); await hp.waitForTimeout(1500);
  await hp.click('[data-eval-row="72026001"] button').catch(() => {}); await hp.waitForTimeout(500);
  const rt = await hp.evaluate(() => (document.querySelector('[data-eval-report="kteacher"]') || {}).innerText || '');
  ok('Sorumlu: öğretmen değerlendirmesi (veli adı yok)', rt.includes('Zarokê me kêfxweş e') && !rt.includes('Veli Aram'), rt.slice(0, 160).replace(/\n/g, ' / '));
  await hp.click('[data-khr="anket"]'); await hp.waitForTimeout(800);
  ok('Sorumlu: anket sonuçları sekmesi', (await hp.locator('[data-khr="anket"]').count()) === 1);

  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('HATA', e); process.exit(1); });
