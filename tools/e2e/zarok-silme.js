// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Çocuk Akademisi — öğretmen kartları (yalnız kendi sınıfına dosyasız duyuru, Sınıfım = ödev/belge + mesaj,
//      mesajlar yalnız kendi velileri); eski haftalık değerlendirme yok (Değerlendirme kartı sorumlunun formunu bekler);
//      çocuk akademisi sorumlusu raporlarda form yanıtlarını (öğretmen → çocuk, veli → öğretmen isimsiz) görür.
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
  const goZ = (pg, k) => pg.evaluate(k => document.querySelector('[data-tab="' + k + '"]').click(), k);
  for (const [no, nm] of [['92026001', 'Veli Aram'], ['92026002', 'Veli Din']]) { await put('idx_guardians/' + no, { no }); await put('guardians/' + no, { no, name: nm, phone: '0532' }); await signUp(no + '@veli.aat', 'Vel12345'); }
  await put('idx_kidstaff/72026001', { no: '72026001' }); await put('kidTeachers/72026001', { no: '72026001', name: 'Mamoste Hêvî', area: 'drama' }); await signUp('72026001@zmamoste.aat', 'Kid12345');
  await put('kids/K1', { no: '82026001', name: 'Rojîn Zarok', area: 'drama', guardianNos: ['92026001'] });
  await put('kids/K2', { no: '82026002', name: 'Baran Zarok', area: 'drama', guardianNos: ['92026002'] });
  await put('kidClasses/KC1', { kind: 'area', area: 'drama', name: '1. Sınıf', studentNos: ['82026001', '82026002'], teacherNos: ['72026001'], teacherNames: ['Mamoste Hêvî'] });
  await put('kidAnnouncements/KA1', { title: 'Duyuruya giştî', body: 'Civîn', createdAt: new Date() });
  await put('kidClassPosts/KP1', { classId: 'KC1', area: 'drama', className: '1. Sınıf', type: 'duyuru', title: 'Duyuruya sinif', body: 'Prova', teacherNo: '72026001', teacherName: 'Mamoste Hêvî', createdAt: new Date() });
  await put('kidMessages/KM1', { guardianNo: '92026001', guardianName: 'Veli Aram', kidId: 'K1', kidName: 'Rojîn Zarok', text: 'Peyama bo silinê', from: 'guardian', read: false, createdAt: new Date() });
  await put('kidMessages/KM2', { guardianNo: '92026001', guardianName: 'Veli Aram', text: 'Bersiva akademiyê', from: 'staff', by: 'Mamoste Hêvî', byNo: '72026001', read: false, createdAt: new Date() });
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
  const delAll = async (p, n) => { for (let i = 0; i < n; i++) { await p.evaluate(() => document.querySelector('[data-hide]').click()); await p.waitForTimeout(1500); } };

  // Veli: duyuru (genel + sınıf) ve mesajlar silinir
  const vp = await zlogin('g', '92026001', 'Vel12345');
  await goZ(vp, 'ann'); await vp.waitForTimeout(800);
  let t = await txt(vp);
  ok('Veli duyuruları görür (genel + sınıf) ve silme düğmesi var', t.includes('Duyuruya giştî') && t.includes('Duyuruya sinif') && (await vp.locator('[data-hide]').count()) === 2);
  await delAll(vp, 2); t = await txt(vp);
  ok('Veli iki duyuruyu da siler; listeden kalkar', !t.includes('Duyuruya giştî') && !t.includes('Duyuruya sinif'));
  await goZ(vp, 'msg'); await vp.waitForTimeout(800);
  ok('Veli mesajlarında (gönderdiği + aldığı) silme düğmesi var', (await vp.locator('[data-hide]').count()) === 2);
  await delAll(vp, 2); t = await txt(vp);
  ok('Veli gönderdiği ve aldığı mesajı siler', !t.includes('Peyama bo silinê') && !t.includes('Bersiva akademiyê'));
  ok('Belgeler herkes için silinmedi', (await list('kidMessages')).length === 2 && (await list('kidAnnouncements')).length === 1 && (await list('kidClassPosts')).length === 1);
  // Başka veli duyuruyu görmeye devam eder
  const vp2 = await zlogin('g', '92026002', 'Vel12345'); await goZ(vp2, 'ann'); await vp2.waitForTimeout(800);
  ok('Diğer veli duyuruları görmeye devam eder', (await txt(vp2)).includes('Duyuruya giştî'));
  // Öğretmen: gelen duyuru + mesaj siler
  const tp = await zlogin('t', '72026001', 'Kid12345'); await goZ(tp, 'ann'); await tp.waitForTimeout(800);
  ok('Çocuk öğretmeni gelen (yönetim) duyurusunda silme düğmesi görür', (await tp.locator('[data-hide]').count()) >= 1);
  await tp.evaluate(() => document.querySelector('[data-hide]').click()); await tp.waitForTimeout(1500);
  ok('Çocuk öğretmeni gelen duyuruyu siler', !(await txt(tp)).includes('Duyuruya giştî'));
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
