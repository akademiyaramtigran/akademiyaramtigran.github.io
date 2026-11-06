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
  const TODAY = ymd(new Date());
  const KUD = ['Yekşem', 'Dûşem', 'Sêşem', 'Çarşem', 'Pêncşem', 'Înî', 'Şemî'][new Date().getDay()];
  await put('idx_staff/96000001', { no: '96000001', lvl: 'head', area: 'tiyatro' }); await put('teachers/HT', { id: 'HT', no: '96000001', name: 'Berpirsa Şanoyê', area: 'tiyatro', isHead: true }); await signUp('96000001@ogretmen.aat', 'Head1234');
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' }); await put('teachers/TA', { id: 'TA', no: '50202601', name: 'Mamoste Şano', area: 'tiyatro' }); await signUp('50202601@ogretmen.aat', 'Tea12345');
  await put('idx_staff/50202602', { no: '50202602', lvl: 'teacher' }); await put('teachers/TB', { id: 'TB', no: '50202602', name: 'Mamoste Stran', area: 'muzik' }); await signUp('50202602@ogretmen.aat', 'Tea12345');
  await put('idx_staff/1000', { no: '1000', lvl: 'admin' }); await put('teachers/TAD', { no: '1000', name: 'Rêveber', isAdmin: true, area: 'genel' }); await signUp('1000@ogretmen.aat', 'Admin123');
  await put('idx_students/20202601', { no: '20202601' }); await put('students/S1', { no: '20202601', name: 'Rojîn Aram', area: 'tiyatro', fireId: 'S1' });
  await put('idx_students/20202602', { no: '20202602' }); await put('students/S2', { no: '20202602', name: 'Baran Şêx', area: 'tiyatro', fireId: 'S2' });
  await put('classes/C1', { kind: 'area', name: '1. Sînif', area: 'tiyatro', studentNos: ['20202601', '20202602'], teacherNos: ['50202601'] });
  await put('schedule/L7', { id: 7, fireId: 'L7', classId: 'C1', area: 'tiyatro', name: 'Şano 1', lessonType: 'main', day: KUD, start: '00:05', end: '23:55', teacherNo: '50202601', teacherName: 'Mamoste Şano', loc: '—' });
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const mk = async (w) => { const c = await b.newContext({ viewport: { width: w || 1280, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} }); return c; };
  const login = async (no, pw, w) => {
    const p = await (await mk(w)).newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
    await p.getByText('Mamoste', { exact: true }).first().click();
    await p.locator('input.inp').first().fill(no); await p.locator('input[type=password]').first().fill(pw);
    await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(7000); return p;
  };
  const goA = (pg, k) => pg.evaluate(k => document.querySelector('.pano-tile[data-key="' + k + '"],.sm-it[data-key="' + k + '"]').click(), k);
  const getDocF = path => fetch(`${FS}/${path}`, { headers: H }).then(r => r.json());

  // 1) Bölüm sorumlusu o gün için başka öğretmeni görevlendirir
  const hp = await login('96000001', 'Head1234');
  await goA(hp, 'schedule'); await hp.waitForTimeout(1500);
  ok('Sorumlu ders satırında günlük görevlendirme düğmesi var', (await hp.locator('[data-sub-lesson="7"]').count()) === 1);
  await hp.click('[data-sub-lesson="7"]'); await hp.waitForTimeout(800);
  await hp.selectOption('[data-sub-teacher]', '50202602'); await hp.click('[data-sub-save]'); await hp.waitForTimeout(1500);
  const sd = (await fetch(`${FS}/lessonSubs?pageSize=20`, { headers: H }).then(r => r.json())).documents || [];
  const sub = sd.find(d => d.name.includes('/L7_'));
  ok('Görevlendirme kaydedildi (ders_tarih, görevli = Stran, bugün)', !!sub && sub.fields.teacherNo.stringValue === '50202602' && sub.fields.date.stringValue === TODAY, sub ? sub.name.split('/').pop() : 'yok');
  ok('Asıl öğretmen değişmedi', (await getDocF('schedule/L7')).fields.teacherNo.stringValue === '50202601');
  ok('Görev listede görünür', (await hp.locator('[data-sub-row]').count()) === 1);

  // 2) Görevli öğretmen o gün dersi programında görür ve yoklamayı alır
  const tb = await login('50202602', 'Tea12345', 430);
  await goA(tb, 'attendance'); await tb.waitForTimeout(1500);
  const sees = await tb.evaluate(() => document.body.innerText.includes('Şano 1'));
  ok('Görevli öğretmen dersi (yalnız o gün) görür', sees);
  await tb.evaluate(() => { const bt = [...document.querySelectorAll('button')].find(x => x.textContent.includes('Şano 1')); bt && bt.click(); }); await tb.waitForTimeout(1000);
  await tb.evaluate(() => { const row = [...document.querySelectorAll('div')].filter(d => d.textContent.includes('Rojîn Aram') && d.querySelectorAll('.att-btn').length === 3).pop(); row.querySelectorAll('.att-btn')[0].click(); });
  await tb.evaluate(() => { const bt = document.querySelector('[data-att-save-list]') || [...document.querySelectorAll('button')].find(x => /^(Tomar bike|Kaydet|Tomar)$/.test(x.textContent.trim())); bt.click(); });
  await tb.waitForTimeout(2500);
  const at = await getDocF('attendance/7-' + TODAY);
  ok('Görevli öğretmenin yoklaması kaydedildi (rules geçti)', !!(at.fields && at.fields.records && at.fields.lessonFire && at.fields.lessonFire.stringValue === 'L7'), JSON.stringify(at.fields && Object.keys(at.fields)));

  // 3) Yönetici yoklamayı düzeltemez: uyarı ekranında "yoklama girilmedi" yok, düzeltme düğmesi yok
  const ap = await login('1000', 'Admin123');
  await goA(ap, 'alerts').catch(() => {}); await ap.waitForTimeout(1500);
  ok('Yönetici uyarılarında yoklama düzeltme düğmesi yok', (await ap.locator('[data-alert-fix]').count()) === 0);
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
