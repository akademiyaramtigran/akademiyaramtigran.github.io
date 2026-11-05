// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Çocuk Akademisi sorumlusu AYNI ZAMANDA öğretmen — yönetici girişinde çocuk akademisine otomatik bağlanır (kidTeachers + idx_kidstaff);
//      Zarok'ta kendi numarası/şifresiyle öğretmen olarak girer, çocuk yoklaması yazar, kendine ders atanabilir
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
  await put('idx_staff/1000', { no: '1000', lvl: 'admin' }); await put('teachers/TA', { no: '1000', name: 'Rêveber', isAdmin: true, area: 'genel' }); await signUp('1000@ogretmen.aat', 'Admin123');
  // Çocuk akademisi bölüm sorumlusu (drama): henüz çocuk akademisine BAĞLI DEĞİL
  await put('idx_staff/96202612', { no: '96202612', lvl: 'head', area: 'drama' });
  await put('teachers/TK', { id: 'TK', no: '96202612', name: 'Berpirsa Dramayê', isHead: true, area: 'drama' }); await signUp('96202612@ogretmen.aat', 'Head1234');
  await put('idx_guardians/92026001', { no: '92026001' }); await put('guardians/92026001', { no: '92026001', name: 'Veli Aram', phone: '0532' });
  await put('kids/K1', { no: '82026001', name: 'Rojîn Zarok', area: 'drama', guardianNos: ['92026001'] });
  await put('kidClasses/KC1', { kind: 'area', area: 'drama', name: '1. Sınıf', studentNos: ['82026001'], teacherNos: ['96202612'], teacherNames: ['Berpirsa Dramayê'] });
  await put('kidSchedule/KL1', { id: 'KL1', title: 'Drama Lîstik', area: 'drama', classId: 'KC1', day: new Date().getDay(), start: '00:05', end: '23:55', teacherNo: '96202612' });
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const mk = async (w) => { const c = await b.newContext({ viewport: { width: w || 420, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); localStorage.setItem('zarok-lang', 'ku'); } catch (_) {} }); return c; };
  const get = path => fetch(`${FS}/${path}`, { headers: H }).then(r => r.json());
  const waitFor = async (f, ms) => { const t0 = Date.now(); for (;;) { const r = await f(); if (r) return r; if (Date.now() - t0 > (ms || 40000)) return null; await new Promise(r => setTimeout(r, 1000)); } };
  // 1) Bağlı değilken Zarok'ta öğretmen olarak giremez
  const zlogin = async (no, pw) => { const c = await mk(); const p = await c.newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/zarok/app/?emu=1'); await p.waitForSelector('#l-no', { timeout: 30000 });
    await p.click('.roles button:nth-child(2)'); await p.fill('#l-no', no); await p.fill('#l-pw', pw); await p.click('.login .btn');
    const inn = await p.waitForSelector('.top', { timeout: 20000 }).then(() => true, () => false); await p.waitForTimeout(2500); return { p, inn }; };
  const z0 = await zlogin('96202612', 'Head1234');
  ok('Bağlanmamış çocuk sorumlusu Zarok öğretmen ekranına giremez', !z0.inn);
  await z0.p.context().close();
  // 2) Yönetici ana uygulamaya girince sorumlular otomatik bağlanır
  const ap = await (await mk(1280)).newPage(); ap.on('pageerror', e => errs.push('A: ' + e.message)); ap.on('dialog', d => d.accept());
  await ap.goto('http://localhost:8765/app/?emu=1'); await ap.waitForSelector('text=Têkeve', { timeout: 60000 });
  await ap.getByText('Mamoste', { exact: true }).first().click();
  await ap.locator('input.inp').first().fill('1000'); await ap.locator('input[type=password]').first().fill('Admin123');
  await ap.getByText('Têkeve', { exact: true }).last().click(); await ap.waitForTimeout(12000);
  const linked = await waitFor(async () => { const k = await get('kidTeachers/96202612'); const i = await get('idx_kidstaff/96202612'); return k.fields && i.fields ? k : null; }, 30000);
  ok('Yönetici girişinde çocuk sorumlusu otomatik bağlandı (kidTeachers + idx_kidstaff)', !!linked && linked.fields.academy.booleanValue === true, JSON.stringify(linked && linked.fields && linked.fields.area));
  await ap.context().close();
  // 3) Zarok'ta öğretmen olarak girer
  const z1 = await zlogin('96202612', 'Head1234');
  ok('Bağlanınca Zarok öğretmen ekranına girer', z1.inn);
  const tp = z1.p;
  const navT = await tp.evaluate(() => [...document.querySelectorAll('.pano-tile[data-tab]')].map(x => x.dataset.tab).join('|'));
  ok('Öğretmen kartları açık (Yoklama, Sınıfım, Çocuklar…)', navT.includes('att') && navT.includes('myclass') && navT.includes('kids'), navT);
  await goZ(tp, 'att'); await tp.waitForTimeout(1500);
  ok('Kendisine atanan çocuk dersi (Drama Lîstik) görünür', (await tp.evaluate(() => document.body.innerText)).includes('Drama Lîstik'));
  // Çocuk yoklaması: "Geldi" yaz
  await tp.evaluate(() => { const b = document.querySelector('.attrow .attbtn'); b && b.click(); }); await tp.waitForTimeout(2000);
  const att = await waitFor(async () => { const l = await list('kidAttendance'); return l.length ? l : null; }, 15000);
  ok('Sorumlu Zarok\'ta çocuk yoklaması yazdı (kidAttendance)', !!att && att.length >= 1);
  await tp.context().close();
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
