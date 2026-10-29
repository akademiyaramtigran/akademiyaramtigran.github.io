// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Sınıf hedefli anket — bölüm sorumlusu anketi bölüm sınıfına ya da atölyeye açar (bölüm sınıfları ve atölyeler ayrı listede,
//      yalnız kendi bölümü); yalnız o sınıfın öğrencisi görür. Çocuk akademisi: veli anketi sınıfa/atölyeye, yalnız o çocukların velileri görür
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
(async () => {
  const YR = String(new Date().getFullYear());
  // Ana akademi: Tiyatro sorumlusu
  await put('idx_staff/96000001', { no: '96000001', lvl: 'head', area: 'tiyatro' });
  await put('teachers/H1', { id: 'H1', no: '96000001', name: 'Berpirsa Şanoyê', isHead: true, area: 'tiyatro' });
  await signUp('96000001@ogretmen.aat', 'Head1234');
  for (const [i, no, name, area] of [[1, '20202601', 'Rojîn Aram', 'tiyatro'], [2, '20202602', 'Baran Şêx', 'tiyatro'], [3, '20202603', 'Jîyan Roj', 'muzik']]) {
    await put('idx_students/' + no, { no }); await put('students/S' + i, { no, name, area, fireId: 'S' + i, id: 100 + i }); await signUp(no + '@ogrenci.aat', 'Stu12345');
  }
  await put('classes/A1', { kind: 'area', name: '1. Sînif', area: 'tiyatro', studentNos: ['20202601', '20202602'] });
  await put('classes/AM', { kind: 'area', name: 'Sinifa Muzîkê', area: 'muzik', studentNos: ['20202603'] });
  await put('classes/W1', { kind: 'workshop', name: 'Atolyeya Şanoyê', area: 'genel', status: 'open', studentNos: ['20202601'] });
  await put('classes/WM', { kind: 'workshop', name: 'Atolyeya Deng', area: 'genel', status: 'open', studentNos: ['20202603'] });
  // Çocuk akademisi: Drama sorumlusu, iki aile
  await put('idx_staff/96202602', { no: '96202602', lvl: 'head', area: 'drama' });
  await put('teachers/TH2', { id: 'TH2', no: '96202602', name: 'Berpirsa Dramayê', isHead: true, area: 'drama' });
  await signUp('96202602@ogretmen.aat', 'Head1234');
  const G1 = '9' + YR + '501', G2 = '9' + YR + '502', K1 = '8' + YR + '501', K2 = '8' + YR + '502';
  for (const [g, k, kn, gn] of [[G1, K1, 'Dilan Aram', 'Nûrê Aram'], [G2, K2, 'Azad Şêx', 'Gulê Şêx']]) {
    await put('idx_guardians/' + g, { no: g }); await put('guardians/' + g, { no: g, name: gn, phone: '0555' });
    await put('kids/' + k, { no: k, name: kn, area: 'drama', guardianNos: [g] }); await signUp(g + '@veli.aat', 'Veli12345');
  }
  await put('kidClasses/KA', { kind: 'area', name: '1. Sînif', area: 'drama', studentNos: [K1, K2] });
  await put('kidClasses/KW', { kind: 'workshop', name: 'Atolyeya Maskê', area: 'genel', status: 'open', studentNos: [K1] });

  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const mk = async (w) => { const c = await b.newContext({ viewport: { width: w || 1280, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); localStorage.setItem('zarok-lang', 'ku'); } catch (_) {} }); return c; };
  const login = async (ctx, no, pw, role) => {
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
    await p.getByText(role || 'Mamoste', { exact: true }).first().click();
    await p.locator('input.inp').first().fill(no); await p.locator('input[type=password]').first().fill(pw);
    await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(7000); return p;
  };
  const txt = p => p.evaluate(() => document.body.innerText);
  const btn = (p, t) => p.evaluate(t => { const e = [...document.querySelectorAll('button')].filter(x => x.offsetParent && x.textContent.includes(t)).pop(); if (!e) throw new Error('düğme yok: ' + t); e.click(); }, t);
  const clsIds = p => p.evaluate(() => [...document.querySelectorAll('[data-sv-cls]')].map(e => e.dataset.svCls).sort().join(','));

  // 1) Tiyatro sorumlusu: anketi yalnız atölyeye aç
  const hp = await login(await mk(), '96000001', 'Head1234');
  await hp.evaluate(() => document.querySelector('.sm-it[data-key="surveys"]').click()); await hp.waitForTimeout(1200);
  await btn(hp, 'Ankêta nû'); await hp.waitForTimeout(800);
  const t1 = await txt(hp);
  ok('Stüdyoda bölüm sınıfları ve atölyeler ayrı listede', t1.includes('Sinifên beşan') && t1.includes('Atolye'));
  ok('Yalnız kendi bölümünün sınıfları ve öğrencisi olan atölyeler (Müzik sınıfı / atölyesi yok)', (await clsIds(hp)) === 'A1,W1', await clsIds(hp));
  await btn(hp, 'Razîbûna dersê'); await hp.waitForTimeout(300);
  await hp.click('[data-sv-cls="W1"]'); await hp.waitForTimeout(200);
  ok('Açıklama: yalnız seçilen sınıfların öğrencileri', (await txt(hp)).includes('Tenê xwendekarên sinifên bijartî bersiv didin'));
  await btn(hp, '🚀 Biweşîne'); await hp.waitForTimeout(2500);
  const sv = (await list('studentSurveys')).find(d => d.fields.title && d.fields.title.stringValue === 'Razîbûna dersê');
  ok('Anket kaydedildi: hedef sınıf W1, bölüm Tiyatro', !!sv && JSON.stringify(sv.fields.targetClassIds).includes('"W1"') && !JSON.stringify(sv.fields.targetClassIds).includes('A1') && JSON.stringify(sv.fields.targetAreas).includes('tiyatro'));
  ok('Listede "🏫 1 sinif" ve beklenen 1 öğrenci', /🏫 1 sinif/.test(await txt(hp)) && /📝 0 \/ 1/.test(await txt(hp)), (await txt(hp)).split('\n').find(l => l.includes('📝')) || '');

  // 2) Öğrenciler
  const seesSv = async no => { const sp = await login(await mk(430), no, 'Stu12345', 'Xwendekar');
    await sp.evaluate(() => { const b = [...document.querySelectorAll('button')].filter(x => x.textContent.includes('Ankêt') && x.offsetParent).pop(); b && b.click(); }); await sp.waitForTimeout(1800);
    const r = (await txt(sp)).includes('Razîbûna dersê'); await sp.context().close(); return r; };
  ok('Atölyedeki Rojîn anketi görür', await seesSv('20202601'));
  ok('Atölyede olmayan aynı bölüm öğrencisi Baran görmez', !(await seesSv('20202602')));

  // 3) Çocuk akademisi: Drama sorumlusu veli anketini atölyeye açar
  const kp = await login(await mk(), '96202602', 'Head1234');
  await kp.evaluate(() => document.querySelector('.sm-it[data-key="surveys"]').click()); await kp.waitForTimeout(1200);
  await btn(kp, 'Ankêta nû (dêûbav'); await kp.waitForTimeout(800);
  ok('Çocuk anketi: bölüm sınıfı ve atölye ayrı (KA, KW)', (await clsIds(kp)) === 'KA,KW' && (await txt(kp)).includes('Sinifên beşan'), await clsIds(kp));
  await btn(kp, 'Razîbûna dêûbavan'); await kp.waitForTimeout(300);
  await kp.click('[data-sv-cls="KW"]'); await kp.waitForTimeout(200);
  await btn(kp, '🚀 Biweşîne'); await kp.waitForTimeout(2500);
  const ks = (await list('kidSurveys')).find(d => d.fields.title && d.fields.title.stringValue === 'Razîbûna dêûbavan');
  ok('Veli anketi kaydedildi: hedef KW, tür guardians', !!ks && ks.fields.targetType.stringValue === 'guardians' && JSON.stringify(ks.fields.targetClassIds).includes('"KW"'));
  ok('Listede beklenen 1 aile', (await txt(kp)).includes('0 / 1 malbat'), (await txt(kp)).split('\n').find(l => l.includes('malbat')) || '');
  const vSees = async g => { const vc = await mk(390); const vp = await vc.newPage(); vp.on('pageerror', e => errs.push('veli: ' + e.message));
    await vp.goto('http://localhost:8765/zarok/app/?emu=1'); await vp.waitForSelector('#l-no', { timeout: 20000 });
    await vp.click('.roles button:nth-child(1)'); await vp.fill('#l-no', g); await vp.fill('#l-pw', 'Veli12345'); await vp.click('.login .btn');
    await vp.waitForSelector('.top', { timeout: 20000 }); await goZ(vp, 'today'); await vp.waitForSelector('.status', { timeout: 20000 }); await vp.waitForTimeout(2000);
    const r = (await txt(vp)).includes('Ankêtek li benda bersiva we ye'); await vc.close(); return r; };
  ok('Çocuğu atölyede olan veli anketi görür', await vSees(G1));
  ok('Çocuğu atölyede olmayan veli görmez', !(await vSees(G2)));
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
