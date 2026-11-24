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

// E2E: Öğrenci İşleri → Çocuk Akademisi → Öğretmenler: ana akademi öğretmenini listeden seçip bağlama
// E2E: Yoklama akışı — "dersi başlat / bitir" YOK; kaydedilen her yoklama geçerli; işaretleme + Kaydet doğrudan çalışır
(async () => {
  const goA = (pg, k) => pg.evaluate(k => document.querySelector('.pano-tile[data-key="' + k + '"],.sm-it[data-key="' + k + '"]').click(), k);
  const TD = new Date().toISOString().slice(0, 10); const todayKu = ['Yekşem', 'Dûşem', 'Sêşem', 'Çarşem', 'Pêncşem', 'Înî', 'Şemî'][new Date().getDay()];
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' }); await put('teachers/T50', { id: 'T50', no: '50202601', name: 'Mamoste Şano', area: 'tiyatro' }); await signUp('50202601@ogretmen.aat', 'Tea12345');
  for (const [k, no, nm, id] of [['S1', '20202601', 'Rojîn Aram', 101], ['S2', '20202602', 'Azad Can', 102]]) { await put('idx_students/' + no, { no, area: 'tiyatro' }); await put('students/' + k, { no, name: nm, area: 'tiyatro', fireId: k, id }); await signUp(no + '@ogrenci.aat', 'Stu12345'); }
  await put('classes/C1', { kind: 'area', area: 'tiyatro', name: '1. Sınıf', studentNos: ['20202601', '20202602'], teacherNos: ['50202601'] });
  await put('schedule/LA', { id: 'LA', fireId: 'LA', area: 'tiyatro', classId: 'C1', name: 'Şano Yeni', day: todayKu, start: '00:05', end: '23:55', teacherNo: '50202601', teacherName: 'Mamoste Şano', lessonType: 'main' });
  await put('schedule/LO', { id: 'LO', fireId: 'LO', area: 'tiyatro', classId: 'C1', name: 'Şano Açık', day: todayKu, start: '00:01', end: '00:02', teacherNo: '50202601', teacherName: 'Mamoste Şano', lessonType: 'main' });
  await put('attendance/LO-' + TD, { lessonId: 'LO', lessonFire: 'LO', lessonName: 'Şano Açık', area: 'tiyatro', date: TD, startedAt: Date.now() - 3600000, records: { 101: 'on', 102: 'off' } });
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const getDoc = id => fetch(`${FS}/attendance/${id}`, { headers: H }).then(r => r.json());
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const c = await b.newContext({ viewport: { width: 430, height: 900 } }); await routes(c);
  await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} });
  const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('http://localhost:8765/app/?emu=1&dvcut=2000-01-01'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
  await p.getByText('Mamoste', { exact: true }).first().click();
  await p.locator('input.inp').first().fill('50202601'); await p.locator('input[type=password]').first().fill('Tea12345');
  await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(9000);
  // Kaydedilen her yoklama geçerli: "dersi bitirin" uyarısı / kapatılmamış ders kavramı YOK
  ok('Kaydedilmiş ama "bitirilmemiş" ders için uyarı kartı çıkmaz (kapatılmamış ders yok)', (await p.locator('[data-noclose-card]').count()) === 0 && (await p.locator('[data-noclose-end]').count()) === 0);
  // Yoklama ekranı: dersi başlat / bitir düğmeleri YOK; işaretleme ve kaydetme doğrudan çalışır
  await goA(p, 'attendance'); await p.waitForTimeout(1500);
  await p.evaluate(() => document.querySelector('[data-att-lesson="LA"]').click()); await p.waitForTimeout(1200);
  ok('"Dersi başlat" düğmesi yok', (await p.locator('[data-start-lesson]').count()) === 0 && !(await p.evaluate(() => document.body.innerText)).includes('Dersê Dest Pê Bike'));
  ok('"Dersi bitir" düğmesi yok', (await p.locator('[data-end-lesson]').count()) === 0);
  ok('Bugünün dersi için durum paneli + QR düğmeleri var (liste ders saatinde hazır)', (await p.locator('[data-att-today]').count()) === 1 && (await p.locator('[data-att-open-qr]').count()) === 1 && (await p.locator('[data-att-scan]').count()) === 1);
  await p.evaluate(() => document.querySelector('[data-att-mark="on"]').click()); await p.waitForTimeout(600);
  const t1 = await p.evaluate(() => document.body.innerText);
  ok('Başlatmadan işaretlenir: "önce dersi başlat" uyarısı çıkmaz', !t1.includes('Pêşî dersê dest pê bike'));
  const a0 = await getDoc('LA-' + TD);
  ok('Kaydet\'e basılmadan kayıt yazılmaz', !(a0.fields && a0.fields.records));
  await p.evaluate(() => [...document.querySelectorAll('button')].filter(x => x.offsetParent && /tomar/i.test(x.textContent)).pop().click()); await p.waitForTimeout(2500);
  const a1 = await getDoc('LA-' + TD);
  const rj = JSON.stringify(a1.fields && a1.fields.records || {});
  ok('Yoklamayı kaydet deyince kayıt işlenir (başlat/bitir gerekmez); işaretlenen "geldi", işaretlenmeyen "yok" yazılır', (rj.match(/"on"/g) || []).length === 1 && (rj.match(/"off"/g) || []).length === 1, rj);
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
