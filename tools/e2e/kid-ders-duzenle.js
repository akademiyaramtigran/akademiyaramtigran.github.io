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

// E2E: Çocuk Akademisi — Öğrenci İşleri ders programındaki bir dersi düzenler (ad, bitiş saati, oda) ve siler; sınıf bağı korunur
(async () => {
  await put('idx_staff/98202601', { no: '98202601', lvl: 'registrar' }); await put('teachers/TR', { id: 'TR', no: '98202601', name: 'Öğrenci İşleri', isRegistrar: true, area: 'genel' }); await signUp('98202601@ogretmen.aat', 'Reg12345');
  await put('idx_kidstaff/72026011', { no: '72026011' }); await put('kidTeachers/72026011', { no: '72026011', name: 'Mamoste Ayşe', area: 'zarok' });
  await put('kidClasses/KC1', { kind: 'area', area: 'zarok', name: 'A-1', studentNos: [], teacherNos: ['72026011'], headNos: [] });
  await put('kidSchedule/S1', { classId: 'KC1', area: 'zarok', title: 'Solfej', day: 6, start: '09:00', end: '09:40', teacherNo: '72026011', teacher: 'Mamoste Ayşe', room: '' });
  await put('kidSchedule/S2', { classId: 'KC1', area: 'zarok', title: 'Teorî', day: 6, start: '10:00', end: '10:40', teacherNo: '72026011', teacher: 'Mamoste Ayşe', room: '' });
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
  await p.evaluate(() => [...document.querySelectorAll('button')].find(b => /Bername$/.test(b.textContent.trim()) && b.offsetParent).click()); await p.waitForTimeout(1500);
  const waitFor = async (f, ms) => { const t0 = Date.now(); for (;;) { const r = await f(); if (r) return r; if (Date.now() - t0 > (ms || 20000)) return null; await new Promise(r => setTimeout(r, 700)); } };
  ok('Ders programında "içe aktar" bölümü YOK (dosyadan toplu ekleme kaldırıldı)', (await p.locator('[data-kid-prog-import]').count()) === 0 && (await p.locator('[data-kid-roster-import]').count()) === 0);
  await p.waitForSelector('[data-sched-edit="S1"]', { timeout: 20000 });
  await p.evaluate(() => document.querySelector('[data-sched-edit="S1"]').click()); await p.waitForTimeout(900);
  await p.locator('input[aria-label="Navê dersê"]').fill('Ders Duzenlendi');
  await p.locator('input[aria-label="Ode"]').fill('Oda 5');
  await p.locator('input[aria-label="Dawî"]').fill('09:55');
  await p.locator('button:has-text("Tomar bike")').last().click();
  const ed = await waitFor(async () => { const r = await fetch(`${FS}/kidSchedule/S1`, { headers: H }).then(r => r.json()); return r.fields && r.fields.title.stringValue === 'Ders Duzenlendi' ? r : null; });
  ok('Ders düzenlenir (ad + oda + bitiş saati kaydolur; sınıf, gün ve öğretmen bağı korunur)', !!ed && ed.fields.room.stringValue === 'Oda 5' && ed.fields.end.stringValue === '09:55' && ed.fields.classId.stringValue === 'KC1' && ed.fields.day.integerValue === '6' && ed.fields.teacherNo.stringValue === '72026011');
  await p.waitForTimeout(500);
  await p.evaluate(() => document.querySelector('[data-sched-del="S2"]').click());
  await waitFor(async () => (await list('kidSchedule')).length === 1);
  ok('Ders silinir (1 kaldı)', (await list('kidSchedule')).length === 1);
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
