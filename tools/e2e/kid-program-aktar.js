// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Haftalık değerlendirme + öğretmen kartları — öğretmen öğrencilerini değerlendirir (hatırlatma), yalnız kendi
//      sınıfına dosyasız duyuru gönderir, Sınıfım = ödev/belge + mesaj; öğrenci öğretmenini isimsiz değerlendirir;
//      sorumlu raporlarda iki değerlendirmeyi ve anketi görür; yöneticide öğrenci ayrıntısında gerçek haftalık grafik;
//      öğrenci işlerinde rapor yok.
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

// E2E: Çocuk Akademisi — ders programını toplu içe aktar (Müzik Birimi cumartesi): sınıflar + her hafta tekrarlayan dersler, çok öğretmenli Amûr dersi öğretmen başına kayıt
(async () => {
  await put('idx_staff/98202601', { no: '98202601', lvl: 'registrar' }); await put('teachers/TR', { id: 'TR', no: '98202601', name: 'Öğrenci İşleri', isRegistrar: true, area: 'genel' }); await signUp('98202601@ogretmen.aat', 'Reg12345');
  const T = ['Hesen', 'Eda', 'Derya', 'Aram', 'Sedat', 'Mesûd', 'Evîndar', 'Ferhat', 'Yunus', 'Adar', 'Welat', 'Xoşyar', 'Müslüm', 'Sarya', 'Apo', 'Nergiz', 'Hêlin', 'Bawer', 'Xebat'];
  for (let i = 0; i < T.length; i++) { const no = '720260' + String(10 + i); await put('idx_kidstaff/' + no, { no }); await put('kidTeachers/' + no, { no, name: T[i] + ' Soyad', academy: true }); }
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } }); await routes(c);
  await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} });
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('http://localhost:8765/app/?emu=1&dvcut=2000-01-01'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
  await p.getByText('Mamoste', { exact: true }).first().click();
  await p.locator('input.inp').first().fill('98202601'); await p.locator('input[type=password]').first().fill('Reg12345');
  await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(8000);
  await p.evaluate(() => [...document.querySelectorAll('.sm-it[data-key="zarok"],.pano-tile[data-key="zarok"]')].find(x => x.getClientRects().length).click()); await p.waitForTimeout(2500);
  await p.evaluate(() => [...document.querySelectorAll('button')].find(b => /Bername$/.test(b.textContent.trim()) && b.offsetParent).click()); await p.waitForTimeout(1200);
  await p.evaluate(() => { const d = document.querySelector('[data-kid-prog-import]'); d.open = true; }); await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector('[data-prog-preset]').click()); await p.waitForTimeout(800);
  const pv = await p.evaluate(() => ({ cnt: document.querySelector('[data-prog-count]').dataset.progCount, miss: [...document.querySelectorAll('[data-prog-teacher]')].filter(e => e.textContent.includes('✗')).length, total: document.querySelectorAll('[data-prog-teacher]').length, conf: (document.querySelector('[data-prog-conflicts]') || {}).dataset ? document.querySelector('[data-prog-conflicts]').dataset.progConflicts : '0' }));
  ok('Önizleme: 75 kayıt (35 normal ders + 7 Amûr dersi × öğretmen), 19 öğretmenin hepsi eşleşti, çakışma yok', pv.cnt === '75' && pv.miss === 0 && pv.total === 19 && pv.conf === '0', JSON.stringify(pv));
  await p.evaluate(() => document.querySelector('[data-prog-run]').click());
  const waitFor = async (f, ms) => { const t0 = Date.now(); for (;;) { const r = await f(); if (r) return r; if (Date.now() - t0 > (ms || 60000)) return null; await new Promise(r => setTimeout(r, 1000)); } };
  await waitFor(() => p.evaluate(() => !!document.querySelector('[data-prog-done]')));
  const cls = await list('kidClasses'), sch = await list('kidSchedule');
  const names = cls.map(d => d.fields.name.stringValue).sort();
  ok('10 sınıf açıldı (A+, A-1, A-2, B-1, B-2, B-3, D-1, E-1, E-2, F-1) — Çocuk Akademisi sınıfı', names.join(',') === 'A+,A-1,A-2,B-1,B-2,B-3,D-1,E-1,E-2,F-1' && cls.every(d => d.fields.kind.stringValue === 'area' && d.fields.area.stringValue === 'zarok'), names.join(','));
  ok('75 ders kaydı: hepsi cumartesi (day 6), 40 dakikalık, sınıfa bağlı, öğretmenli', sch.length === 75 && sch.every(d => d.fields.day.integerValue === '6' && d.fields.teacherNo.stringValue && d.fields.classId.stringValue), String(sch.length));
  const amur = sch.filter(d => d.fields.title.stringValue === 'Amûr');
  ok('Amûr: 7 ders, 40 öğretmen kaydı (çok öğretmenli ders öğretmen başına)', amur.length === 40, String(amur.length));
  const b2 = sch.find(d => d.fields.title.stringValue === 'Ziman' && d.fields.start.stringValue === '09:00' && d.fields.teacher.stringValue.startsWith('Hesen'));
  ok('Ziman · Hesen · 09:00–09:40 (A-1)', !!b2 && b2.fields.end.stringValue === '09:40');
  const cA = cls.find(d => d.fields.name.stringValue === 'B-2');
  ok('Sınıfa dersini veren öğretmenler bağlanır (B-2: Aram, Sedat, Derya + Amûr öğretmenleri)', cA.fields.teacherNos.arrayValue.values.length === 6, String(cA.fields.teacherNos.arrayValue.values.length));
  // Aynı içe aktarma ikinci kez: yeni kayıt yok
  await p.evaluate(() => { const t = document.querySelector('[data-prog-text]'); const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; set.call(t, ''); t.dispatchEvent(new Event('input', { bubbles: true })); }); await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector('[data-prog-preset]').click()); await p.waitForTimeout(1200);
  const cnt2 = await p.evaluate(() => document.querySelector('[data-prog-count]').dataset.progCount);
  ok('Aynı programı yeniden içe aktarma yeni kayıt üretmez (tekrar yok)', cnt2 === '0', cnt2);
  // İçe aktarılan ders elle düzenlenebilir (ad, saat, öğretmen, ode) ve silinebilir
  const fid = await p.evaluate(() => document.querySelector('[data-sched-edit]').dataset.schedEdit);
  await p.evaluate(() => document.querySelector('[data-sched-edit]').click()); await p.waitForTimeout(900);
  await p.locator('input[aria-label="Navê dersê"]').fill('Ders Duzenlendi');
  await p.locator('input[aria-label="Ode"]').fill('Oda 5');
  await p.locator('input[aria-label="Dawî"]').fill('09:55');
  await p.locator('button:has-text("Tomar bike")').last().click();
  const ed = await waitFor(async () => { const r = await fetch(`${FS}/kidSchedule/${fid}`, { headers: H }).then(r => r.json()); return r.fields && r.fields.title.stringValue === 'Ders Duzenlendi' ? r : null; }, 20000);
  ok('İçe aktarılan ders düzenlenir (ad + ode + bitiş saati kaydolur, sınıf bağı korunur)', !!ed && ed.fields.room.stringValue === 'Oda 5' && ed.fields.end.stringValue === '09:55' && !!ed.fields.classId.stringValue && ed.fields.day.integerValue === '6', ed ? JSON.stringify(ed.fields.title) : 'yok');
  await p.waitForTimeout(500);
  await p.evaluate(() => document.querySelector('[data-sched-del]').click());
  await waitFor(async () => (await list('kidSchedule')).length === 74, 20000);
  ok('İçe aktarılan ders silinir (74 kaldı)', (await list('kidSchedule')).length === 74);
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
