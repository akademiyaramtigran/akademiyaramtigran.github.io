// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Anket Stüdyosu (şablon → yayın → öğrenci yanıtı), veli anketi (Zarok uygulaması), Çocuk Akademisi raporu
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
  const YR = String(new Date().getFullYear());
  await put('idx_staff/98202601', { no: '98202601', lvl: 'registrar' });
  await put('teachers/TR', { no: '98202601', name: 'Karûbar', isRegistrar: true, area: 'genel' });
  await signUp('98202601@ogretmen.aat', 'Reg12345');
  await put('idx_students/20202601', { no: '20202601' });
  await put('students/S1', { no: '20202601', name: 'Rojîn Aram', area: 'muzik', classLevel: 1, fireId: 'S1', id: 101 });
  await signUp('20202601@ogrenci.aat', 'Stu12345');
  const G = '9' + YR + '501';
  await put('idx_guardians/' + G, { no: G });
  await put('guardians/' + G, { no: G, name: 'Nûrê Aram', phone: '0555 1' });
  await put('kids/K1', { no: '8' + YR + '501', name: 'Dilan Aram', area: 'drama', classLevel: 1, guardianNos: [G] });
  await put('kidClasses/KC1', { kind: 'general', name: '1. Sînif', area: 'genel', studentNos: ['8' + YR + '501'], teacherNos: [], teacherNames: [] });
  await signUp(G + '@veli.aat', 'Veli12345');
  const KT = '7' + YR + '501';
  await put('idx_kidstaff/' + KT, { no: KT }); await put('kidTeachers/' + KT, { no: KT, name: 'Mamoste Berfîn', area: 'drama' });
  await signUp(KT + '@zmamoste.aat', 'Kid12345');
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const mk = async (w) => { const c = await b.newContext({ viewport: { width: w || 1100, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); localStorage.setItem('zarok-lang', 'ku'); } catch (_) {} }); return c; };
  const login = async (ctx, no, pw, role) => {
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
    await p.getByText(role || 'Mamoste', { exact: true }).first().click();
    await p.locator('input.inp').first().fill(no); await p.locator('input[type=password]').first().fill(pw);
    await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(7000); return p;
  };
  const topTab = (p, t) => p.evaluate(t => { const b = [...document.querySelectorAll('button')].filter(x => x.textContent.trim().endsWith(t) && x.textContent.trim().length < t.length + 4).find(x => { const r = x.getBoundingClientRect(); return r.top > 60 && r.top < 240; }); b.scrollIntoView(); b.click(); }, t);
  const btn = (p, t, exact) => p.evaluate(([t, exact]) => { const b = [...document.querySelectorAll('button')].filter(x => x.offsetParent && (exact ? x.textContent.trim() === t : x.textContent.includes(t))).pop(); if (!b) throw new Error('düğme yok: ' + t); b.scrollIntoView({ block: 'center' }); b.click(); }, [t, !!exact]);
  const txt = p => p.evaluate(() => document.body.innerText);
  const shot = (pg, n) => process.env.SHOT_DIR ? pg.screenshot({ path: process.env.SHOT_DIR + '/' + n, fullPage: true }).catch(() => {}) : null;

  // 1) Öğrenci işleri: Anket Stüdyosu → şablon → yayınla
  const rc = await mk(); const p = await login(rc, '98202601', 'Reg12345');
  await topTab(p, 'Ankêt'); await p.waitForTimeout(1200);
  await btn(p, 'Ankêta nû'); await p.waitForTimeout(600);
  const s1 = await txt(p);
  ok('Anket Stüdyosu açılır (şablon, hedef, soru türleri)', /bi şablonê dest pê bike/i.test(s1) && /kî dê bersiv bide/i.test(s1) && s1.includes('Çend bijare'));
  await btn(p, 'Razîbûna dersê'); await p.waitForTimeout(400);
  const qn = await p.locator('input[placeholder="Pirsê binivîse"]').count();
  ok('Şablon 5 soruyu doldurur', qn === 5, qn + ' soru');
  await shot(p, 'studyo.png');
  // Bir çoklu seçim sorusu ekle
  await btn(p, '☑️ Çend bijare'); await p.waitForTimeout(200);
  await p.locator('input[placeholder="Pirsê binivîse"]').last().fill('Kîjan amûr?');
  await p.locator('input[placeholder="Bijare 1"]').last().fill('Tembûr'); await p.locator('input[placeholder="Bijare 2"]').last().fill('Def');
  await btn(p, '👁 Pêşdîtin'); await p.waitForTimeout(300);
  ok('Önizleme açılır', (await txt(p)).includes('PÊŞDÎTIN') && (await txt(p)).includes('Kîjan amûr?'));
  await btn(p, 'Vegere sererastkirinê'); await p.waitForTimeout(300);
  await btn(p, '🚀 Biweşîne'); await p.waitForTimeout(2000);
  const svs = await list('studentSurveys');
  const sv = svs.find(d => d.fields.title && d.fields.title.stringValue === 'Razîbûna dersê');
  ok('Anket yayınlandı (6 soru, likert + çoklu)', sv && sv.fields.active.booleanValue === true && sv.fields.questions.arrayValue.values.length === 6 && JSON.stringify(sv.fields.questions).includes('"multi"'));

  // 2) Öğrenci yanıtlar (zorunlu kontrolü + yeni türler)
  const sc = await mk(430); const sp = await login(sc, '20202601', 'Stu12345', 'Xwendekar');
  await sp.evaluate(() => { const b = [...document.querySelectorAll('button')].filter(x => x.textContent.includes('Ankêt') && x.offsetParent).pop(); b.click(); }); await sp.waitForTimeout(1500);
  await sp.getByText('Razîbûna dersê').first().click(); await sp.waitForTimeout(600);
  await btn(sp, 'Ankêtê Bişîne'); await sp.waitForTimeout(500);
  const t0 = await sp.locator('[role=status], .toast, [aria-live]').allInnerTexts().catch(() => []);
  ok('Boş gönderim engellenir', !(await list('studentSurveyResponses')).length);
  await sp.evaluate(() => { [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === '4Razî me').forEach(b => b.click()); });
  await sp.waitForTimeout(200);
  await sp.evaluate(() => { const b = [...document.querySelectorAll('button')].filter(x => x.textContent.trim() === '8'); b[b.length - 1].click(); });
  await sp.waitForTimeout(200);
  for (const o of ['Tembûr', 'Def']) { await sp.evaluate(o => [...document.querySelectorAll('button')].find(b => b.textContent.trim().endsWith(o)).click(), o); await sp.waitForTimeout(150); }
  await sp.waitForTimeout(200);
  await btn(sp, 'Ankêtê Bişîne'); await sp.waitForTimeout(2000);
  const rs = await list('studentSurveyResponses');
  const r0 = rs[0] && JSON.stringify(rs[0].fields.answers);
  ok('Öğrenci yanıtı kaydedildi (likert 4, puan 8, çoklu 2 seçim)', rs.length === 1 && /"integerValue":"4"/.test(r0) && /"integerValue":"8"/.test(r0) && r0.includes('Tembûr') && r0.includes('Def'), rs.length + ' yanıt');

  // 3) Sonuçlar: istatistik + katılım
  await p.bringToFront(); await p.waitForTimeout(1500);
  await topTab(p, 'Rapor'); await p.waitForTimeout(500); await topTab(p, 'Ankêt'); await p.waitForTimeout(1200);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button')].filter(x => x.textContent.includes('📊') && x.textContent.length < 20 && x.offsetParent && !x.closest('.sm')); b[0].click(); }); await p.waitForTimeout(1200);
  const r3 = await txt(p);
  await shot(p, 'sonuc.png');
  ok('Sonuçlar: ortalama, dağılım ve katılım', r3.includes('Beşdarî') && r3.includes('100%') && r3.includes('Tembûr'));

  // 4) Çocuk Akademisi veli anketi
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300);
  await p.evaluate(() => [...document.querySelectorAll('button')].filter(x => x.textContent.trim() === '🎼 Akademiya Zarokan' && x.offsetParent).pop().click()); await p.waitForTimeout(800);
  await btn(p, 'Ankêta nû (dêûbav'); await p.waitForTimeout(500);
  const k1 = await txt(p);
  ok('Çocuk anketi: hedef veliler/öğretmenler + alan (sınıf yok)', k1.includes('Hemû dêûbav') && k1.includes('Hemû mamoste') && k1.includes('Drama') && !/\b1\. Sînif\b/.test(k1));
  await btn(p, 'Razîbûna dêûbavan'); await p.waitForTimeout(300);
  await btn(p, 'Drama', true); await p.waitForTimeout(200);
  await btn(p, '🚀 Biweşîne'); await p.waitForTimeout(800);
  await p.waitForTimeout(1500);
  const ks = await list('kidSurveys');
  ok('Veli anketi yayınlandı (Drama alanı)', ks.length === 1 && ks[0].fields.active.booleanValue === true && ks[0].fields.targetType.stringValue === 'guardians' && JSON.stringify(ks[0].fields.targetAreas).includes('drama'));
  const kid = ks[0].name.split('/').pop();
  // Öğretmen anketi
  await btn(p, 'Ankêta nû (dêûbav'); await p.waitForTimeout(500);
  await btn(p, 'Nêrîna mamosteyên zarokan'); await p.waitForTimeout(300);
  await btn(p, '🚀 Biweşîne'); await p.waitForTimeout(2000);
  const ks2 = await list('kidSurveys');
  const tsv = ks2.find(d => d.fields.targetType.stringValue === 'kidteachers');
  ok('Çocuk öğretmenleri anketi yayınlandı', !!tsv);

  // 5) Veli uygulaması: bekleyen anket → yanıtla
  const vc = await mk(390); const vp = await vc.newPage(); vp.on('pageerror', e => errs.push('veli: ' + e.message));
  await vp.goto('http://localhost:8765/zarok/app/?emu=1'); await vp.waitForSelector('#l-no', { timeout: 20000 });
  await vp.click('.roles button:nth-child(1)'); await vp.fill('#l-no', G); await vp.fill('#l-pw', 'Veli12345'); await vp.click('.login .btn');
  await vp.waitForSelector('.status', { timeout: 20000 }); await vp.waitForTimeout(1500);
  ok('Veli: Bugün ekranında bekleyen anket', (await txt(vp)).includes('Ankêtek li benda bersiva we ye'));
  await vp.evaluate(() => [...document.querySelectorAll('.card')].find(c => c.textContent.includes('Ankêtek li benda')).click()); await vp.waitForTimeout(600);
  await vp.evaluate(() => [...document.querySelectorAll('.chipb')].filter(b => b.textContent.trim().endsWith('5 · Gelek razî me')).forEach(b => b.click()));
  await vp.waitForTimeout(200);
  await vp.evaluate(() => [...document.querySelectorAll('.chipb')].find(b => b.textContent.includes('👍')).click()); await vp.waitForTimeout(200);
  await shot(vp, 'veli-anket.png');
  await vp.evaluate(() => [...document.querySelectorAll('button.btn')].find(b => b.textContent.includes('Bişîne')).click()); await vp.waitForTimeout(2000);
  const kr = await list('kidSurveyResponses');
  ok('Veli yanıtı kaydedildi (aile adına, alan bilgisiyle)', kr.length === 1 && kr[0].name.endsWith('/' + kid + '_' + G) && kr[0].fields.role.stringValue === 'guardian' && JSON.stringify(kr[0].fields.areas).includes('drama') && JSON.stringify(kr[0].fields.answers).includes('"yes"'));
  ok('Veli öğretmen anketini görmez', !(await txt(vp)).includes('Nêrîna mamosteyên zarokan'));
  // Çocuk öğretmeni yanıtlar
  const tc = await mk(390); const tp = await tc.newPage(); tp.on('pageerror', e => errs.push('kidteacher: ' + e.message));
  await tp.goto('http://localhost:8765/zarok/app/?emu=1'); await tp.waitForSelector('#l-no', { timeout: 20000 });
  await tp.click('.roles button:nth-child(2)'); await tp.fill('#l-no', KT); await tp.fill('#l-pw', 'Kid12345'); await tp.click('.login .btn');
  await tp.waitForSelector('.nav', { timeout: 20000 }); await tp.waitForTimeout(1500);
  await tp.evaluate(e => [...document.querySelectorAll('.nav button')].find(b => b.textContent.includes(e)).click(), '📝'); await tp.waitForTimeout(600);
  const t5 = await txt(tp);
  ok('Çocuk öğretmeni kendi anketini görür, veli anketini görmez', t5.includes('Nêrîna mamosteyên zarokan') && !t5.includes('Razîbûna dêûbavan'));
  await tp.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Bersiv bide').click()); await tp.waitForTimeout(500);
  for (let i = 0; i < 3; i++) { await tp.evaluate(i => { const bs = [...document.querySelectorAll('.chipb')].filter(b => b.textContent.trim().endsWith('4 · Razî me')); bs[i].click(); }, i); await tp.waitForTimeout(150); }
  await tp.evaluate(() => [...document.querySelectorAll('button.btn')].find(b => b.textContent.includes('Bişîne')).click()); await tp.waitForTimeout(2000);
  const kr2 = (await list('kidSurveyResponses')).find(d => d.fields.role && d.fields.role.stringValue === 'teacher');
  ok('Çocuk öğretmeni yanıtı kaydedildi', !!kr2 && kr2.name.endsWith('_' + KT));
  ok('Yanıttan sonra anket "yanıtlandı" görünür', (await txt(vp)).includes('Bersiv hat dayîn'));

  // 6) Öğrenci işleri: veli anketi sonuçları + Çocuk Akademisi raporu
  await p.bringToFront(); await p.waitForTimeout(1500);
  ok('Veli anketi listesinde 1/1 aile', (await txt(p)).includes('1 / 1 malbat'));
  await topTab(p, 'Rapor'); await p.waitForTimeout(1200);
  await btn(p, 'Akademiya Zarokan', true); await p.waitForTimeout(1500);
  const r6 = await txt(p);
  await shot(p, 'zarok-rapor.png');
  ok('Rapor merkezi: Çocuk Akademisi raporu (çocuk, aile, sınıf)', r6.includes('Malbat') && r6.includes('Dilan Aram') && r6.includes('1. Sînif'));
  await btn(p, 'Ankêt', true); await p.waitForTimeout(1200);
  ok('Rapor merkezi anket listesinde veli anketi', (await txt(p)).includes('Razîbûna dêûbavan'));

  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  const bad = out.filter(l => l.startsWith('❌')).length;
  console.log('\n' + (bad ? '❌ ' + bad + ' adım başarısız' : '✅ Hepsi geçti (' + out.length + ' adım)'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('HATA', e); process.exit(1); });
