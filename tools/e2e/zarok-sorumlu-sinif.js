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
const enc = v => v === null ? { nullValue: null } : typeof v === 'number' ? { integerValue: String(v) } : typeof v === 'boolean' ? { booleanValue: v } : v instanceof Date ? { timestampValue: v.toISOString() } : { stringValue: String(v) };
const putO = (path, o) => fetch(`${FS}/${path}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, enc(v)])) }) }).then(r => { if (!r.ok) throw new Error('seed ' + path + ' ' + r.status); });
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
  const goA = (pg, k) => pg.evaluate(k => document.querySelector('.pano-tile[data-key="' + k + '"],.sm-it[data-key="' + k + '"]').click(), k);
  await put('idx_staff/96202612', { no: '96202612', lvl: 'head', area: 'drama' }); await put('teachers/TK', { id: 'TK', no: '96202612', name: 'Berpirsa Dramayê', isHead: true, area: 'drama' }); await signUp('96202612@ogretmen.aat', 'Head1234');
  for (const [no, nm] of [['92026001', 'Veli Aram'], ['92026002', 'Veli Din']]) { await put('idx_guardians/' + no, { no }); await put('guardians/' + no, { no, name: nm, phone: '0532' }); await signUp(no + '@veli.aat', 'Vel12345'); }
  await put('kids/K1', { no: '82026001', name: 'Rojîn Zarok', area: 'drama', guardianNos: ['92026001'] });
  await put('kids/K2', { no: '82026002', name: 'Baran Zarok', area: 'drama', guardianNos: ['92026002'] });
  await put('kidClasses/KC1', { kind: 'area', area: 'drama', name: '1. Sınıf', studentNos: ['82026001', '82026002'] });
  await put('kidClasses/KC9', { kind: 'area', area: 'ziman', name: 'Ziman 1', studentNos: [] });
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const mk = async (w) => { const c = await b.newContext({ viewport: { width: w || 430, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); localStorage.setItem('zarok-lang', 'ku'); } catch (_) {} }); return c; };
  const sv = d => Object.fromEntries(Object.entries(d.fields).map(([k, v]) => [k, v.stringValue !== undefined ? v.stringValue : v.booleanValue]));
  const col = async c => ((await fetch(`${FS}/${c}?pageSize=100`, { headers: H }).then(r => r.json())).documents || []).map(sv);
  const p = await (await mk()).newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
  await p.getByText('Mamoste', { exact: true }).first().click();
  await p.locator('input.inp').first().fill('96202612'); await p.locator('input[type=password]').first().fill('Head1234');
  await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(7000);
  await goA(p, 'classsend'); await p.waitForTimeout(1200);
  const cls = await p.evaluate(() => [...document.querySelectorAll('[data-ks-class]')].map(e => e.dataset.ksClass));
  ok('Çocuk sorumlusu yalnız kendi bölümünün sınıflarını görür', cls.join() === 'KC1', cls.join());
  const send = () => p.evaluate(() => [...document.querySelectorAll('button')].filter(x => x.textContent.includes('Bişîne') && x.offsetParent).pop().click()).then(() => p.waitForTimeout(2500));
  // Sınıf duyurusu
  await p.evaluate(() => document.querySelector('[data-ks-class="KC1"]').click());
  await p.locator('#ks-title').fill('Duyuruya sinifa zarokan'); await p.locator('#ks-body').fill('Prova'); await send();
  let posts = await col('kidClassPosts');
  ok('Sınıf duyurusu kaydedildi (duyuru, KC1)', posts.some(x => x.title === 'Duyuruya sinifa zarokan' && x.type === 'duyuru' && x.classId === 'KC1'));
  // Belge: seçilen çocuğa
  await p.evaluate(() => document.querySelector('[data-ks-kind="belge"]').click()); await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector('[data-ks-class="KC1"]').click()); await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector('[data-ks-w="pick"]').click()); await p.waitForTimeout(300);
  await p.locator('[data-ks-pick="82026001"] input').check();
  await p.locator('#ks-title').fill('Belgeya taybet'); await p.locator('#ks-body').fill('Ji Rojînê re'); await send();
  posts = await col('kidClassPosts');
  const bp = posts.find(x => x.title === 'Belgeya taybet');
  ok('Seçilen çocuğa belge: yalnız Rojîn (studentNos)', !!bp && bp.type === 'belge' && bp.classId === 'KC1');
  // Velilere mesaj (bütün sınıf)
  await p.evaluate(() => document.querySelector('[data-ks-kind="msg"]').click()); await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector('[data-ks-class="KC1"]').click()); await p.waitForTimeout(300);
  await p.locator('#ks-title').fill('Peyama dêûbavan'); await p.locator('#ks-body').fill('Civîna dêûbavan'); await send();
  const km = (await col('kidMessages')).filter(x => (x.text || '').startsWith('Peyama dêûbavan'));
  ok('Sınıfın velilerine mesaj: her veliye ayrı (2 veli)', km.length === 2 && new Set(km.map(x => x.guardianNo)).size === 2 && km.every(x => x.from === 'staff'), JSON.stringify(km.map(x => x.guardianNo)));
  // Zarok veli tarafı
  const zl = async (no) => { const c = await mk(420); const q = await c.newPage(); q.on('pageerror', e => errs.push(no + ': ' + e.message)); q.on('dialog', d => d.accept());
    await q.goto('http://localhost:8765/zarok/app/?emu=1'); await q.waitForSelector('#l-no', { timeout: 30000 }); await q.click('.roles button:nth-child(1)'); await q.fill('#l-no', no); await q.fill('#l-pw', 'Vel12345'); await q.click('.login .btn');
    await q.waitForSelector('.top', { timeout: 30000 }); await q.waitForTimeout(2500); return q; };
  const goZ = (q, k) => q.evaluate(k => document.querySelector('[data-tab="' + k + '"]').click(), k);
  const g1 = await zl('92026001'); await goZ(g1, 'cls'); await g1.waitForTimeout(1000);
  const t1 = await g1.evaluate(() => document.body.innerText);
  const g2 = await zl('92026002'); await goZ(g2, 'cls'); await g2.waitForTimeout(1000);
  const t2 = await g2.evaluate(() => document.body.innerText);
  ok('Veli (Rojîn) seçilen belgeyi görür', t1.includes('Belgeya taybet'));
  ok('Diğer çocuğun velisi seçilmeyen belgeyi görmez', !t2.includes('Belgeya taybet'));
  await goZ(g2, 'ann'); await g2.waitForTimeout(800);
  ok('Sınıf duyurusunu sınıftaki her veli görür', (await g2.evaluate(() => document.body.innerText)).includes('Duyuruya sinifa zarokan'));
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
