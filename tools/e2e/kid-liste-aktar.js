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

// E2E: Çocuk Akademisi — çocuk + sınıf + sınıf sorumlusu listesini dosyadan içe aktar (her çocuğa numara + şifre; veli çocuğun numarasıyla girer)
(async () => {
  const fs2 = require('fs'), os = require('os');
  await put('idx_staff/98202601', { no: '98202601', lvl: 'registrar' }); await put('teachers/TR', { id: 'TR', no: '98202601', name: 'Öğrenci İşleri', isRegistrar: true, area: 'genel' }); await signUp('98202601@ogretmen.aat', 'Reg12345');
  for (const [no, nm] of [['72026010', 'Eda Soyad'], ['72026011', 'Aram Soyad']]) { await put('idx_kidstaff/' + no, { no }); await put('kidTeachers/' + no, { no, name: nm, academy: true }); }
  await put('kidClasses/KX1', { kind: 'area', area: 'zarok', name: 'A-1', studentNos: [], teacherNos: [], headNos: [] });   // var olan sınıf yeniden kullanılır
  const file = os.tmpdir() + '/roster-test.csv';
  const names1 = ['Test Çocuk Bir', 'Test Çocuk İki', 'Test Çocuk Üç'], names2 = ['Deneme Kız Bir', 'Deneme Kız İki'];
  fs2.writeFileSync(file, '# sinif;ad soyad;sinif sorumlusu\n' + names1.map(n => 'A-1;' + n + ';Eda').join('\n') + '\n' + names2.map(n => 'B-1;' + n + ';Aram').join('\n') + '\n');
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const waitFor = async (f, ms) => { const t0 = Date.now(); for (;;) { const r = await f(); if (r) return r; if (Date.now() - t0 > (ms || 90000)) return null; await new Promise(r => setTimeout(r, 1000)); } };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } }); await routes(c);
  await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} });
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('http://localhost:8765/app/?emu=1&dvcut=2000-01-01'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
  await p.getByText('Mamoste', { exact: true }).first().click();
  await p.locator('input.inp').first().fill('98202601'); await p.locator('input[type=password]').first().fill('Reg12345');
  await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(8000);
  await p.evaluate(() => [...document.querySelectorAll('.sm-it[data-key="zarok"],.pano-tile[data-key="zarok"]')].find(x => x.getClientRects().length).click()); await p.waitForTimeout(2500);
  await p.evaluate(() => [...document.querySelectorAll('button')].filter(b => /Sinif$/.test(b.textContent.trim()) && b.offsetParent).pop().click()); await p.waitForTimeout(1500);
  await p.evaluate(() => { document.querySelector('[data-kid-roster-import]').open = true; }); await p.waitForTimeout(300);
  await p.setInputFiles('[data-roster-file]', file); await p.waitForTimeout(1000);
  const pv = await p.evaluate(() => ({ cnt: document.querySelector('[data-roster-count]').dataset.rosterCount, nw: document.querySelector('[data-roster-new]').dataset.rosterNew, txt: document.querySelector('[data-roster-preview]').textContent.replace(/\s+/g, ' ').slice(0, 200) }));
  ok('Dosya yüklenir: önizleme 5 çocuk, 5 yeni hesap, sorumlular eşleşti (✓)', pv.cnt === '5' && pv.nw === '5' && /A-1.*Eda ✓/.test(pv.txt) && /B-1.*Aram ✓/.test(pv.txt), pv.txt);
  await p.evaluate(() => document.querySelector('[data-roster-run]').click());
  await waitFor(() => p.evaluate(() => !!document.querySelector('[data-roster-done]')));
  const kids = await list('kids'), cls = await list('kidClasses'), gs = await list('guardians'), ix = await list('idx_guardians');
  ok('5 çocuk kaydedildi; her biri kendi numarasıyla veli hesabı (guardians + idx_guardians)', kids.length === 5 && gs.length === 5 && ix.length === 5 && kids.every(k => gs.some(g => g.name.endsWith('/' + k.fields.no.stringValue))), kids.length + '/' + gs.length + '/' + ix.length);
  const a1 = cls.find(d => d.fields.name.stringValue === 'A-1'), b1 = cls.find(d => d.fields.name.stringValue === 'B-1');
  ok('Var olan A-1 kullanıldı (tekrar sınıf yok), B-1 yeni açıldı', cls.filter(d => d.fields.name.stringValue === 'A-1').length === 1 && !!b1 && cls.length === 2);
  ok('Sınıfa çocuklar yerleşti (A-1: 3, B-1: 2)', a1.fields.studentNos.arrayValue.values.length === 3 && b1.fields.studentNos.arrayValue.values.length === 2);
  ok('Sınıf sorumlusu atandı (headNos) ve sınıfa bağlandı (teacherNos)', a1.fields.headNos.arrayValue.values[0].stringValue === '72026010' && b1.fields.headNos.arrayValue.values[0].stringValue === '72026011' && a1.fields.teacherNos.arrayValue.values.length === 1);
  const creds = await p.evaluate(() => document.querySelector('[data-roster-done]').textContent);
  ok('Sonuç ekranı: numara/şifre listesi indirilebilir (CSV + PDF)', /5/.test(creds) && (await p.locator('[data-roster-csv]').count()) === 1 && (await p.locator('[data-roster-pdf]').count()) === 1);
  // Veli girişi: çocuğun numarası + şifre → Auth (şifre CSV'den)
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }), p.evaluate(() => document.querySelector('[data-roster-csv]').click())]);
  const rowsCsv = fs2.readFileSync(await dl.path(), 'utf8').split(/\r?\n/).filter(Boolean).slice(1).map(l => l.replace(/^\uFEFF/, '').split(/[;,]/));
  const [, , kno, kpass] = rowsCsv[0].map(x => x.replace(/"/g, ''));
  const lg = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=x', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: kno + '@veli.aat', password: kpass, returnSecureToken: true }) }).then(r => r.json());
  ok('Veli, çocuğun numarası + şifresiyle giriş yapar', rowsCsv.length === 5 && !!lg.idToken, kno);
  // Aynı listeyi tekrar: yeni hesap yok
  await p.setInputFiles('[data-roster-file]', file); await p.waitForTimeout(1000);
  const nw2 = await p.evaluate(() => document.querySelector('[data-roster-new]').dataset.rosterNew);
  ok('Aynı listeyi yeniden yüklemek yeni hesap üretmez', nw2 === '0', nw2);
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
