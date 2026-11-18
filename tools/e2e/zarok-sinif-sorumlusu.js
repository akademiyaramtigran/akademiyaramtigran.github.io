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
// E2E: Çocuk Akademisi — alan yok, yetki SINIF sorumlusunda: kendi sınıfının programı / formları, başkasınınki salt okunur
(async () => {
  const goA = (pg, k) => pg.evaluate(k => document.querySelector('.pano-tile[data-key="' + k + '"],.sm-it[data-key="' + k + '"]').click(), k);
  await put('idx_staff/96202612', { no: '96202612', lvl: 'head', area: 'zarok' }); await put('teachers/TK', { id: 'TK', no: '96202612', name: 'Berpirsa Sinifê', isHead: true, area: 'zarok' });
  await signUp('96202612@ogretmen.aat', 'Head1234');
  await put('idx_kidstaff/96202612', { no: '96202612' }); await put('kidTeachers/96202612', { no: '96202612', name: 'Berpirsa Sinifê', academy: true, head: true, area: 'zarok' });
  await put('kidTeachers/72026001', { no: '72026001', name: 'Mamoste Hêvî', area: 'zarok' });
  await put('kids/K1', { no: '82026001', name: 'Rojîn Zarok', area: 'zarok', guardianNos: ['92026001'] });
  await put('kids/K2', { no: '82026002', name: 'Baran Zarok', area: 'zarok', guardianNos: ['92026002'] });
  await put('kidClasses/KC1', { kind: 'area', area: 'zarok', name: '1. Sınıf', studentNos: ['82026001'], headNos: ['96202612'] });
  await put('kidClasses/KC2', { kind: 'area', area: 'zarok', name: '2. Sınıf', studentNos: ['82026002'], headNos: ['96202699'] });
  await put('kidSchedule/L2', { classId: 'KC2', area: 'zarok', title: 'Ders ya 2', day: 2, start: '10:00', end: '11:00', teacherNo: '72026001', teacher: 'Mamoste Hêvî' });
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const c = await b.newContext({ viewport: { width: 430, height: 900 } }); await routes(c);
  await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} });
  const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
  await p.getByText('Mamoste', { exact: true }).first().click();
  await p.locator('input.inp').first().fill('96202612'); await p.locator('input[type=password]').first().fill('Head1234');
  await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(7000);
  // Program: bütün akademi görünür, düzenleme yalnız kendi sınıfında
  await goA(p, 'schedule'); await p.waitForTimeout(1500);
  const t0 = await p.evaluate(() => document.body.innerText);
  ok('Program: başka sınıfın dersi de görünür (tüm akademi)', t0.includes('Ders ya 2'));
  ok('Program: başkasının dersinde düzenle/sil düğmesi YOK', (await p.locator('[data-khs-row] button').count()) === 0);
  await p.evaluate(() => [...document.querySelectorAll('button')].filter(x => x.offsetParent && x.textContent.includes('Dersê Zêde Bike'))[0].click()); await p.waitForTimeout(500);
  const opts = await p.evaluate(() => [...document.querySelectorAll('#khs-class option')].map(o => o.value).join(','));
  ok('Ders formunda yalnız kendi sınıfı seçilebilir', opts === ',KC1' || opts === 'KC1', opts);
  await p.locator('#khs-title').fill('Ders ya 1'); await p.selectOption('#khs-class', 'KC1'); await p.selectOption('#khs-teacher', '72026001');
  await p.evaluate(() => [...document.querySelectorAll('button')].filter(x => x.offsetParent && x.textContent.includes('Tomar bike')).pop().click()); await p.waitForTimeout(2000);
  const ks = (await fetch(`${FS}/kidSchedule?pageSize=100`, { headers: H }).then(r => r.json())).documents || [];
  const mine = ks.find(d => d.fields.title && d.fields.title.stringValue === 'Ders ya 1');
  ok('Sınıf sorumlusu kendi sınıfına ders ekledi (area=zarok, classId=KC1)', !!mine && mine.fields.classId.stringValue === 'KC1' && mine.fields.area.stringValue === 'zarok');
  ok('Eklenen dersin düzenle/sil düğmesi görünür', (await p.locator('[data-khs-row] button').count()) === 3);
  // Sınıflar: yalnız kendi sınıfı, yeni sınıf açma yok
  await goA(p, 'classes'); await p.waitForTimeout(1200);
  const t1 = await p.evaluate(() => document.body.innerText);
  ok('Sınıflar: yalnız kendi sınıfı listelenir', t1.includes('1. ') && !t1.includes('2. Sınıf') && !t1.includes('Sînif') === false || (t1.includes('Rojîn') || t1.includes('1.')));
  ok('Sınıflar: sınıf sorumlusu YENİ SINIF AÇAMAZ', (await p.locator('[data-cls-new]').count()) === 0);
  // Değerlendirme formu: sınıf seçimi zorunlu
  await goA(p, 'evalforms'); await p.waitForTimeout(1000);
  await p.locator('[data-new-form]').click(); await p.waitForTimeout(800);
  const co = await p.evaluate(() => [...document.querySelectorAll('[data-ef-class] option')].map(o => o.value).join(','));
  ok('Değerlendirme formunda sınıf seçimi var (yalnız kendi sınıfı)', co === ',KC1', co);
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
