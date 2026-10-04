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
  const ok = x => { const r = x.getBoundingClientRect(); return r.width > 0 && (!top || (r.top > 60 && r.top < 260)); };
  // Önce ekrandaki, yoksa yatay şeritte kaymış olanı al (kapalı yan menüdeki kopyalar -left ile elenir)
  const b = [...document.querySelectorAll('button')].filter(x => x.textContent.includes(t) && x.offsetParent !== null && ok(x))
    .sort((a, c) => (a.getBoundingClientRect().left < -200) - (c.getBoundingClientRect().left < -200))[0];
  if (!b) throw new Error('düğme yok: ' + t); b.scrollIntoView({ inline: 'center', block: 'nearest' }); b.click();
}, [text, top]);

(async () => {
  const TODAY = new Date().toISOString().slice(0, 10);
  await put('idx_staff/98202601', { no: '98202601', lvl: 'registrar' });
  await put('teachers/TR', { no: '98202601', name: 'Karûbar', isRegistrar: true, area: 'genel' });
  await signUp('98202601@ogretmen.aat', 'Reg12345');
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' });
  await put('teachers/T50', { no: '50202601', name: 'Mamoste Dilovan', area: 'muzik' });
  await signUp('50202601@ogretmen.aat', 'Tea12345');
  await put('idx_students/20202601', { no: '20202601' });
  await put('students/S1', { no: '20202601', name: 'Rojîn Aram', area: 'muzik', fireId: 'S1' });
  await signUp('20202601@ogrenci.aat', 'Stu12345');
  await put('idx_students/20202602', { no: '20202602' });
  await put('students/S2', { no: '20202602', name: 'Baran Şêx', area: 'muzik', fireId: 'S2' });
  await signUp('20202602@ogrenci.aat', 'Stu12345');
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
  const topTab = (p, t) => p.evaluate(t => { const b = [...document.querySelectorAll('button')].filter(x => x.textContent.includes(t)).find(x => { const r = x.getBoundingClientRect(); return r.top > 60 && r.top < 240; }); b.scrollIntoView(); b.click(); }, t);
  const txt = p => p.evaluate(() => document.body.innerText);
  const getDocF = path => fetch(`${FS}/${path}`, { headers: H }).then(r => r.json());
  const cls = async n => (await list('classes')).find(d => d.fields.name && d.fields.name.stringValue === n);
  const idOf = d => d ? d.name.split('/').pop() : '';
  const check = (p, name) => p.locator('label', { hasText: name }).locator('input[type=checkbox]').check();
  const cardBtn = (p, cardText, btnText) => p.evaluate(([c, t]) => { const card = [...document.querySelectorAll('div')].filter(d => d.textContent.includes(c) && [...d.querySelectorAll('button')].some(x => x.textContent.includes(t))).pop();
    [...card.querySelectorAll('button')].find(x => x.textContent.includes(t)).click(); }, [cardText, btnText]);

  // ── 1) Alan sınıfı: Müzik · 1. Sınıf ──
  const rc = await mk(); const p = await login(rc, '98202601', 'Reg12345');
  await topTab(p, 'Sinif û Atolye'); await p.waitForTimeout(1500);
  await p.selectOption('select[aria-label="Qad"]', 'muzik'); await p.waitForTimeout(300);
  ok('Alan seçilince sınıfsız öğrenciler', /Bê sinif \(2\)/.test(await txt(p)));
  await clickText(p, '➕ Sinifa nû'); await p.waitForTimeout(300);
  await p.locator('input[aria-label="Navê sinifê"]').fill('1. Sînif');
  ok('Alan sınıfı formunda yalnızca o alanın öğrencileri', !(await txt(p)).includes('Jîyan Roj') && (await txt(p)).includes('Baran Şêx'));
  await check(p, 'Mamoste Dilovan'); await check(p, 'Rojîn Aram');
  await clickText(p, '💾 Tomar bike'); await p.waitForTimeout(1500);
  const A = await cls('1. Sînif'); const Aid = idOf(A);
  ok('Alan sınıfı kaydedildi', A && A.fields.kind.stringValue === 'area' && JSON.stringify(A.fields.studentNos).includes('20202601') && JSON.stringify(A.fields.teacherNos).includes('50202601'));

  // ── 2) Sınıfa ders programı ──
  await clickText(p, '➕ Ders zêde bike'); await p.waitForTimeout(800);
  await p.locator('input[placeholder="Armoni – Gr. A"]').fill('Solfej');
  await clickText(p, 'Bernameyê Zêde Bike'); await p.waitForTimeout(2000);
  const L = (await list('schedule')).find(d => d.fields.name.stringValue === 'Solfej');
  ok('Ders sınıfa bağlı kaydedildi (sınıf öğretmeni ön seçili)', L && L.fields.classId && L.fields.classId.stringValue === Aid && L.fields.teacherNo && L.fields.teacherNo.stringValue === '50202601');
  ok('Sınıf kartında ders programı görünür', /Solfej/.test(await txt(p)) && /1 ders di bernameyê de/.test(await txt(p)));

  // ── 3) Genel sınıf: tüm alanlardan öğrenci ──
  await clickText(p, '🌐 Sinifên giştî'); await p.waitForTimeout(400);
  await clickText(p, '➕ Sinifa giştî ya nû'); await p.waitForTimeout(300);
  await p.locator('input[aria-label="Navê sinifê"]').fill('Koro');
  await check(p, 'Mamoste Dilovan'); await check(p, 'Rojîn Aram'); await check(p, 'Jîyan Roj');
  await clickText(p, '💾 Tomar bike'); await p.waitForTimeout(1500);
  const G = await cls('Koro');
  ok('Genel sınıf iki alandan öğrenciyle kaydedildi', G && G.fields.kind.stringValue === 'general' && G.fields.area.stringValue === 'genel' && G.fields.studentNos.arrayValue.values.length === 2);

  // Aynı öğretmen ikinci bir ortak sınıfa (ör. başka dönemin öğrencileri) bağlanabilir
  await clickText(p, '➕ Sinifa giştî ya nû'); await p.waitForTimeout(300);
  await p.locator('input[aria-label="Navê sinifê"]').fill('Koro B');
  await check(p, 'Mamoste Dilovan'); await check(p, 'Jîyan Roj');
  await clickText(p, '💾 Tomar bike'); await p.waitForTimeout(1500);
  const G2 = await cls('Koro B');
  ok('Aynı öğretmen iki ortak sınıfa bağlı', G2 && JSON.stringify(G2.fields.teacherNos).includes('50202601') && JSON.stringify(G.fields.teacherNos).includes('50202601'));

  // ── 4) Atölye aç ──
  await clickText(p, '🛠 Atolye'); await p.waitForTimeout(400);
  await clickText(p, '➕ Atolye veke'); await p.waitForTimeout(300);
  await p.locator('input[aria-label="Navê sinifê"]').fill('Atolyeya Deng');
  await p.locator('label:has-text("Perwerdekarê ji derve") input').fill('Hunermendê Mêvan');
  await check(p, 'Mamoste Dilovan'); await check(p, 'Baran Şêx'); await check(p, 'Jîyan Roj');
  await clickText(p, '💾 Tomar bike'); await p.waitForTimeout(2000);
  const W = await cls('Atolyeya Deng'); const Wid = idOf(W);
  const WL = await getDocF('schedule/ws_' + Wid);
  ok('Atölye açıldı (açık + o günün ek dersi)', W && W.fields.status.stringValue === 'open' && W.fields.date.stringValue === TODAY
    && WL.fields && WL.fields.classId.stringValue === Wid && JSON.stringify(WL.fields.extraDates).includes(TODAY) && WL.fields.guestTeacher.stringValue === 'Hunermendê Mêvan');

  // ── 5) Yoklama gir + atölyeyi kapat ──
  await cardBtn(p, 'Atolyeya Deng', '📋 Amadebûn'); await p.waitForTimeout(1200);
  await p.locator('button[aria-label="on Baran Şêx"]').click();
  await p.locator('button[aria-label="off Jîyan Roj"]').click();
  await clickText(p, '🔒 Tomar bike û atolyeyê bigire'); await p.waitForTimeout(2500);
  const lid = W.fields.lessonId.integerValue || W.fields.lessonId.stringValue;
  const AT = await getDocF('attendance/' + lid + '-' + TODAY);
  ok('Atölye yoklaması kaydedildi', AT.fields && AT.fields.records.mapValue.fields.S2.stringValue === 'on' && AT.fields.records.mapValue.fields.S3.stringValue === 'off' && AT.fields.classId.stringValue === Wid);
  const W2 = await cls('Atolyeya Deng');
  const WL2 = await fetch(`${FS}/schedule/ws_${Wid}`, { headers: H });
  ok('Atölye kapandı, programdan kalktı', W2.fields.status.stringValue === 'closed' && W2.fields.attSummary && WL2.status === 404);
  ok('Kapanan atölye arşivde', /Atolyeyên girtî \(1\)/.test(await txt(p)));

  // ── 6) Rapor: sınıf filtresi ──
  await p.evaluate(() => { const b = [...document.querySelectorAll('button')].filter(x => x.textContent.trim().endsWith('Rapor') && x.textContent.trim().length < 12).find(x => { const r = x.getBoundingClientRect(); return r.top > 60 && r.top < 240; }); b.scrollIntoView(); b.click(); });
  await p.waitForTimeout(1500);
  await clickText(p, 'Lîste').catch(() => {}); await p.waitForTimeout(600);
  await p.selectOption('select[aria-label="Sînif"]', Aid); await p.waitForTimeout(600);
  const r6 = (await txt(p)).split('Kurte')[1] || '';
  ok('Rapor: sınıf filtresi yalnızca sınıfın öğrencileri', r6.includes('Rojîn Aram') && !r6.includes('Baran Şêx') && !r6.includes('Jîyan Roj'));

  // ── 7) Öğrenci görünürlüğü ──
  const s1 = await login(await mk(430), '20202601', 'Stu12345', 'Xwendekar');
  const h1 = await txt(s1);
  ok('Öğrenci: sınıfları ve sınıf öğretmeni üst bilgide', h1.includes('1. Sînif') && h1.includes('Koro') && h1.includes('Mamoste Dilovan'));
  await clickText(s1, 'Bername'); await s1.waitForTimeout(1000);
  ok('Sınıftaki öğrenci sınıf dersini görür', (await txt(s1)).includes('Solfej'));
  const s2 = await login(await mk(430), '20202602', 'Stu12345', 'Xwendekar');
  await clickText(s2, 'Bername'); await s2.waitForTimeout(1000);
  const t2 = await txt(s2);
  ok('Sınıfta olmayan aynı alan öğrencisi dersi görmez', !t2.includes('Solfej') && !t2.includes('Atolyeya Deng'));

  // ── 8) Öğretmen: öğrencilerim = sınıflarının öğrencileri ──
  const tp = await login(await mk(430), '50202601', 'Tea12345');
  await tp.evaluate(() => { const b = [...document.querySelectorAll('button')].filter(x => /^\W*Xwendekar\W*$/.test(x.textContent.trim()) && x.offsetParent); b[b.length - 1].click(); });
  await tp.waitForTimeout(1500);
  await tp.getByText('Sinifên Min').first().waitFor({ timeout: 10000 }).catch(() => {});
  const t8 = await txt(tp);
  ok('Öğretmen: Sinifên Min (alan + genel, kapanan atölye yok)', t8.includes('Sinifên Min') && t8.includes('Muzîk · 1. Sînif') && t8.includes('🌐 Koro') && !t8.includes('Atolyeya Deng'), t8.split('\n').filter(l => /Sinif|Koro|Atolye|Sînif/.test(l)).join(' / '));
  ok('Öğretmenin öğrenci listesi sınıflarından (başka alandan Jîyan var, sınıfsız Baran yok)', t8.includes('Jîyan Roj') && t8.includes('Rojîn Aram') && !t8.includes('Baran Şêx'));

  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  const bad = out.filter(l => l.startsWith('❌')).length;
  console.log('\n' + (bad ? '❌ ' + bad + ' adım başarısız' : '✅ Hepsi geçti (' + out.length + ' adım)'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('HATA', e); process.exit(1); });
