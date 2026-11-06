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
  const pad = n => String(n).padStart(2, '0'), ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const TODAY = ymd(new Date()), DOW = new Date().getDay();
  await put('idx_staff/96000003', { no: '96000003', lvl: 'head', area: 'drama' }); await put('teachers/HK', { id: 'HK', no: '96000003', name: 'Berpirsa Dramayê', area: 'drama', isHead: true }); await signUp('96000003@ogretmen.aat', 'Head1234');
  await put('idx_kidstaff/72026001', { no: '72026001' }); await put('kidTeachers/72026001', { no: '72026001', name: 'Mamoste Hêvî' });
  await put('idx_kidstaff/72026002', { no: '72026002' }); await put('kidTeachers/72026002', { no: '72026002', name: 'Mamoste Berfîn' });
  await put('kidSchedule/KD1', { title: 'Drama 1', area: 'drama', day: DOW, start: '00:05', end: '23:55', teacherNo: '72026001', teacher: 'Mamoste Hêvî', classId: '' });
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const mk = async (w) => { const c = await b.newContext({ viewport: { width: w || 1280, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} }); return c; };
  const hc = await mk(); const hp = await hc.newPage(); hp.on('pageerror', e => errs.push(e.message)); hp.on('dialog', d => d.accept());
  await hp.goto('http://localhost:8765/app/?emu=1'); await hp.waitForSelector('text=Têkeve', { timeout: 60000 });
  await hp.getByText('Mamoste', { exact: true }).first().click();
  await hp.locator('input.inp').first().fill('96000003'); await hp.locator('input[type=password]').first().fill('Head1234');
  await hp.getByText('Têkeve', { exact: true }).last().click(); await hp.waitForTimeout(7000);
  await hp.evaluate(() => document.querySelector('.pano-tile[data-key="schedule"],.sm-it[data-key="schedule"]').click()); await hp.waitForTimeout(1500);
  ok('Çocuk sorumlusu ders satırında günlük görevlendirme düğmesi var', (await hp.locator('[data-ksub-lesson="KD1"]').count()) === 1);
  await hp.click('[data-ksub-lesson="KD1"]'); await hp.waitForTimeout(800);
  await hp.selectOption('[data-ksub-teacher]', '72026002'); await hp.click('[data-ksub-save]'); await hp.waitForTimeout(1500);
  const sd = (await fetch(`${FS}/kidSubs?pageSize=20`, { headers: H }).then(r => r.json())).documents || [];
  const sub = sd.find(d => d.name.includes('/KD1_'));
  ok('Çocuk görevlendirmesi kaydedildi (ders_tarih, görevli = Berfîn, bugün)', !!sub && sub.fields.teacherNo.stringValue === '72026002' && sub.fields.date.stringValue === TODAY, sub ? sub.name.split('/').pop() : 'yok');
  ok('Dersin asıl öğretmeni değişmedi', (await fetch(`${FS}/kidSchedule/KD1`, { headers: H }).then(r => r.json())).fields.teacherNo.stringValue === '72026001');
  ok('Görev listede görünür', (await hp.locator('[data-ksub-row]').count()) === 1);
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
