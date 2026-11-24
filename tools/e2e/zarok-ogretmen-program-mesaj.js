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

// E2E: Çocuk uygulaması (öğretmen) — herkes yalnız KENDİ programını günlük görür; öğretmenler birbirine ÖZEL mesaj gönderir (grup yok)
const goZ = (pg, k) => pg.evaluate(k => { const vis = e => e && e.getClientRects().length; const f = () => [...document.querySelectorAll('[data-tab="' + k + '"]')].find(vis);
  let el = f(); if (!el) { const pb = document.querySelector('.pano-btn'); if (pb) pb.click(); el = f(); } el.click(); }, k);
(async () => {
  const dow = new Date().getDay(), other = (dow + 2) % 7;
  const T = [['72026011', 'Mamoste Ayşe', 'Ayse12345'], ['72026012', 'Mamoste Berfin', 'Berf12345'], ['72026013', 'Mamoste Cano', 'Cano12345']];
  for (const [no, name, pw] of T) { await signUp(no + '@zmamoste.aat', pw); await put('idx_kidstaff/' + no, { no }); await put('kidTeachers/' + no, { no, name, area: 'zarok' }); }
  await put('kids/K1', { no: '82026001', name: 'Kid Bir', area: 'zarok', guardianNos: ['92026001'] });
  await put('kidClasses/KC1', { kind: 'area', area: 'zarok', name: 'A-1', studentNos: ['82026001'], teacherNos: ['72026011', '72026012'], headNos: [] });
  await put('kidSchedule/S1', { classId: 'KC1', area: 'zarok', title: 'Ders Ayse Bugun', day: dow, start: '10:00', end: '10:40', teacherNo: '72026011', teacher: 'Mamoste Ayşe' });
  await put('kidSchedule/S2', { classId: 'KC1', area: 'zarok', title: 'Ders Ayse Sonra', day: other, start: '11:00', end: '11:40', teacherNo: '72026011', teacher: 'Mamoste Ayşe' });
  await put('kidSchedule/S3', { classId: 'KC1', area: 'zarok', title: 'Ders Berfin Bugun', day: dow, start: '12:00', end: '12:40', teacherNo: '72026012', teacher: 'Mamoste Berfin' });
  await put('kidSchedule/S4', { classId: 'KC1', area: 'zarok', title: 'Ders Kimsesiz', day: dow, start: '13:00', end: '13:40', teacherNo: '', teacher: '' });
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined }); const errs = [];
  const open = async (no, pw) => { const c = await b.newContext({ viewport: { width: 390, height: 844 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('zarok-lang', 'ku'); } catch (_) {} });
    const p = await c.newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/zarok/app/?emu=1'); await p.waitForSelector('#l-no', { timeout: 20000 });
    await p.click('.roles button:nth-child(2)'); await p.fill('#l-no', no); await p.fill('#l-pw', pw); await p.click('.login .btn');
    await p.waitForSelector('.top', { timeout: 20000 }); await p.waitForTimeout(2500); await goZ(p, 'home'); await p.waitForTimeout(1200); return p; };
  const waitFor = async (f, ms) => { const t0 = Date.now(); for (;;) { const r = await f(); if (r) return r; if (Date.now() - t0 > (ms || 25000)) return null; await new Promise(r => setTimeout(r, 700)); } };
  const A = await open('72026011', 'Ayse12345');
  // 1) Program: yalnız kendi dersi, günlük
  let tx = await A.evaluate(() => document.querySelector('[data-tday-list]').innerText);
  ok('Program (bugün): yalnız KENDİ dersi görünür', tx.includes('Ders Ayse Bugun'), tx.replace(/\s+/g, ' ').slice(0, 80));
  ok('Başka öğretmenin dersi görünmez', !tx.includes('Ders Berfin Bugun'));
  ok('Öğretmeni olmayan ders kimsenin programında görünmez', !tx.includes('Ders Kimsesiz'));
  const whole = await A.evaluate(() => document.body.innerText);
  ok('Sayfada başka öğretmenin dersi hiçbir yerde yok (ana sayfa dahil)', !whole.includes('Ders Berfin Bugun') && !whole.includes('Ders Kimsesiz'));
  await A.evaluate(o => document.querySelector('[data-tday="' + o + '"]').click(), other); await A.waitForTimeout(500);
  tx = await A.evaluate(() => document.querySelector('[data-tday-list]').innerText);
  ok('Gün seçici: başka gün kendi dersini gösterir, bugünkü dersi göstermez', tx.includes('Ders Ayse Sonra') && !tx.includes('Ders Ayse Bugun'));
  const B = await open('72026012', 'Berf12345');
  await B.waitForSelector('[data-tday-list]', { timeout: 20000 });
  tx = await B.evaluate(() => document.querySelector('[data-tday-list]').innerText);
  ok('İkinci öğretmen yalnız kendi dersini görür', tx.includes('Ders Berfin Bugun') && !tx.includes('Ders Ayse Bugun'));
  // 2) Özel mesaj: "Sınıfım → Mesaj" bölümünde sınıf/öğrencilerin yanında öğretmen de seçilir (grup yok)
  const toMsg = async p => { await goZ(p, 'myclass'); await p.waitForSelector('[data-hub="msg"]', { timeout: 15000 }); await p.evaluate(() => document.querySelector('[data-hub="msg"]').click()); await p.waitForSelector('#t-nm-to', { timeout: 15000 }); };
  await toMsg(A);
  const opts = await A.evaluate(() => [...document.querySelectorAll('#t-nm-to option')].map(o => o.textContent));
  ok('Mesaj alıcı listesinde sınıf + öğrenci + diğer öğretmenler var; kendisi ve "herkes" yok', opts.some(x => x.includes('A-1')) && opts.some(x => x.includes('Kid Bir')) && opts.some(x => x.includes('Berfin')) && opts.some(x => x.includes('Cano')) && !opts.some(x => x.includes('Ayşe')) && !opts.some(x => /Hemû mamoste|Tüm öğretmen|All teachers/.test(x)), opts.join(' | '));
  await A.selectOption('#t-nm-to', 't:72026012'); await A.fill('#t-nm', 'Silav Berfin, sibe ders heye?'); await A.click('#t-nm-send');
  await waitFor(async () => (await list('kidStaffMsgs')).length === 1);
  ok('Mesaj yalnız gönderen+alıcı üyeleriyle kaydolur', await (async () => { const d = (await list('kidStaffMsgs'))[0]; return !!d && JSON.stringify(d.fields.members).includes('72026011') && JSON.stringify(d.fields.members).includes('72026012') && !JSON.stringify(d.fields.members).includes('all'); })());
  await toMsg(B); await B.waitForSelector('[data-room-conv]', { timeout: 20000 });
  const bt = await B.evaluate(() => document.body.innerText);
  ok('Alıcı öğretmen yazışmayı mesaj listesinde görür', bt.includes('Mamoste Ayşe') && bt.includes('Silav Berfin'));
  await B.fill('#t-room-reply', 'Erê, sibe 10:00'); await B.click('#t-room-reply-send');
  await waitFor(async () => (await list('kidStaffMsgs')).length === 2);
  ok('Alıcı yanıtlar (iki mesaj, aynı özel yazışma)', (await list('kidStaffMsgs')).length === 2);
  const C = await open('72026013', 'Cano12345'); await toMsg(C); await C.waitForTimeout(1500);
  const ct = await C.evaluate(() => document.body.innerText);
  ok('Üçüncü öğretmen bu özel yazışmayı GÖRMEZ', !ct.includes('Silav Berfin') && !ct.includes('Erê, sibe') && (await C.locator('[data-room-conv]').count()) === 0);
  // gönderen kendi mesajını siler
  await A.waitForTimeout(1500); await toMsg(A); await A.waitForSelector('[data-room-conv]', { timeout: 15000 }); await A.evaluate(() => document.querySelector('[data-room-conv]').click()); await A.waitForSelector('[data-room-del]', { timeout: 15000 });
  await A.evaluate(() => document.querySelector('[data-room-del]').click());
  await waitFor(async () => (await list('kidStaffMsgs')).length === 1);
  ok('Gönderen kendi mesajını siler', (await list('kidStaffMsgs')).length === 1);
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
