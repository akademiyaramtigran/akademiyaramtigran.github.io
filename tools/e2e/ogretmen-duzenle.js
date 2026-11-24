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

// E2E: Öğrenci İşleri — akademi öğretmeninin bilgilerini ve şifresini düzenler (düz öğretmen + alan sorumlusu olan öğretmen)
(async () => {
  const goA = (pg, k) => pg.evaluate(k => [...document.querySelectorAll('.sm-it[data-key="' + k + '"],.pano-tile[data-key="' + k + '"]')].find(x => x.getClientRects().length).click(), k).then(() => pg.waitForTimeout(1800));
  await put('idx_staff/98202601', { no: '98202601', lvl: 'registrar' }); await put('teachers/TR', { id: 'TR', no: '98202601', name: 'Öğrenci İşleri', isRegistrar: true, area: 'genel' }); await signUp('98202601@ogretmen.aat', 'Reg12345');
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' }); await signUp('50202601@ogretmen.aat', 'Tea12345'); await put('teachers/T50', { id: 'T50', fireId: 'T50', no: '50202601', name: 'Mamoste Şano', area: 'tiyatro' });
  await put('idx_staff/96202601', { no: '96202601', lvl: 'head', area: 'tiyatro' }); await signUp('96202601@ogretmen.aat', 'Head1234'); await put('teachers/T96', { id: 'T96', fireId: 'T96', no: '96202601', name: 'Berpirsa Şanoyê', area: 'tiyatro', isHead: true });
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const getD = p => fetch(`${FS}/${p}`, { headers: H }).then(r => r.json());
  const loginOk = (no, pw) => fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=x', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: no + '@ogretmen.aat', password: pw, returnSecureToken: true }) }).then(r => r.json()).then(r => !!r.idToken);
  const waitFor = async (f, ms) => { const t0 = Date.now(); for (;;) { const r = await f(); if (r) return r; if (Date.now() - t0 > (ms || 15000)) return null; await new Promise(r => setTimeout(r, 700)); } };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } }); await routes(c);
  await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} });
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('http://localhost:8765/app/?emu=1&dvcut=2000-01-01'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
  await p.getByText('Mamoste', { exact: true }).first().click();
  await p.locator('input.inp').first().fill('98202601'); await p.locator('input[type=password]').first().fill('Reg12345');
  await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(8000);
  await goA(p, 'qad');
  await p.evaluate(() => [...document.querySelectorAll('.area-card')].filter(x => x.textContent.includes('Şano')).pop().click()); await p.waitForTimeout(1200);
  await p.evaluate(() => document.querySelector('[data-area-tab="teachers"]').click()); await p.waitForTimeout(800);
  const edit = async (name, phone, pw) => {
    await p.evaluate(n => { const row = [...document.querySelectorAll('div')].filter(d => d.textContent.includes(n) && d.querySelectorAll('button').length >= 2 && d.querySelector('.ico-edit')).pop(); row.querySelector('.ico-edit').closest('button').click(); }, name); await p.waitForTimeout(900);
    await p.evaluate(([ph, pw]) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; const ins = [...document.querySelectorAll('input')].filter(i => i.offsetParent);
      const tel = ins.find(i => i.type === 'tel'); set.call(tel, ph); tel.dispatchEvent(new Event('input', { bubbles: true }));
      const pwi = ins.find(i => /Şîfreya nû/.test(i.placeholder)); set.call(pwi, pw); pwi.dispatchEvent(new Event('input', { bubbles: true })); }, [phone, pw]);
    await p.evaluate(() => { const bs = [...document.querySelectorAll('button')].filter(x => x.offsetParent && x.textContent.includes('💾')); bs.pop().click(); }); await p.waitForTimeout(3500); };
  await edit('Mamoste Şano', '05551112233', 'NewPass123');
  const d1 = await getD('teachers/T50');
  ok('Düz öğretmen: bilgiler kaydedildi (telefon)', d1.fields.phone && d1.fields.phone.stringValue === '05551112233');
  ok('Düz öğretmen: yeni şifreyle giriş yapılır', await waitFor(() => loginOk('50202601', 'NewPass123')) === true);
  await edit('Berpirsa Şanoyê', '05554445566', 'HeadNew123');
  const d2 = await getD('teachers/T96');
  ok('Alan sorumlusu olan öğretmen: bilgiler kaydedildi (telefon)', d2.fields.phone && d2.fields.phone.stringValue === '05554445566' && d2.fields.isHead && d2.fields.isHead.booleanValue === true, JSON.stringify(Object.keys(d2.fields)));
  ok('Alan sorumlusu olan öğretmen: yeni şifreyle giriş yapılır', await waitFor(() => loginOk('96202601', 'HeadNew123')) === true);
  const ix = await getD('idx_staff/96202601');
  ok('Düzenleme sorumluluk kaydını bozmaz (idx_staff head + alan)', ix.fields.lvl.stringValue === 'head' && ix.fields.area.stringValue === 'tiyatro');
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
