// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// Yönetici → Zarok: öğretmen ekle, çocuğu elle kaydet (yeni veli), site haberi yayınla;
// öğretmen Zarok uygulamasına girer ve yoklama alır; veli bildirimi görür; haber çocuk sitesinde görünür.
const { chromium } = require('playwright-core');
const fs = require('fs');
const FBV = require('firebase/package.json').version;
const P = 'aram2026-a9fd7';
const NM = require('path').dirname(require.resolve('firebase/package.json')) + '/../';
const FS = `http://127.0.0.1:8080/v1/projects/${P}/databases/(default)/documents`;
const H = { 'Content-Type': 'application/json', 'Authorization': 'Bearer owner' };
const val = v => v instanceof Date ? { timestampValue: v.toISOString() } : Array.isArray(v) ? { arrayValue: { values: v.map(val) } } : typeof v === 'boolean' ? { booleanValue: v } : { stringValue: String(v) };
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
  const ok = x => { const r = x.getBoundingClientRect(); return r.width > 0 && (!top || (r.top > 60 && r.top < 260)); };
  // Önce ekrandaki, yoksa yatay şeritte kaymış olanı al (kapalı yan menüdeki kopyalar -left ile elenir)
  const b = [...document.querySelectorAll('button')].filter(x => x.textContent.includes(t) && x.offsetParent !== null && ok(x))
    .sort((a, c) => (a.getBoundingClientRect().left < -200) - (c.getBoundingClientRect().left < -200))[0];
  if (!b) throw new Error('düğme yok: ' + t); b.scrollIntoView({ inline: 'center', block: 'nearest' }); b.click();
}, [text, top]);

(async () => {
  // Kişiler: öğrenci işleri, kapı güvenliği, yetişkin öğrenci, çocuk + çocuk öğretmeni
  await put('idx_staff/98202601', { no: '98202601', lvl: 'registrar' });
  await put('teachers/TR', { no: '98202601', name: 'Karûbar', isRegistrar: true, area: 'genel' });
  await signUp('98202601@ogretmen.aat', 'Reg12345');
  await put('idx_staff/97202601', { no: '97202601', lvl: 'gate' });
  await put('teachers/TG', { no: '97202601', name: 'Nobedar Azad', isGate: true, area: 'genel' });
  await signUp('97202601@ogretmen.aat', 'Gate1234');
  await put('idx_students/20202601', { no: '20202601' });
  await put('students/S1', { no: '20202601', name: 'Dilan Aram', area: 'muzik', fireId: 'S1' });
  await put('idx_kidstaff/72026001', { no: '72026001' });
  await put('kidTeachers/72026001', { no: '72026001', name: 'Mamoste Hêvî' });
  await signUp('72026001@zmamoste.aat', 'Kid12345');
  await put('idx_guardians/92026001', { no: '92026001' });
  await put('guardians/92026001', { no: '92026001', name: 'Leyla Aram' });
  await put('kids/K1', { no: '82026001', name: 'Rojda Aram', area: 'muzik', guardianNos: ['92026001'], teacherNo: '72026001' });
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log(l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const login = async (ctx, no, pw) => {
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
    await p.getByText('Mamoste', { exact: true }).first().click();
    await p.locator('input.inp').first().fill(no); await p.locator('input[type=password]').first().fill(pw);
    await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(7000); return p;
  };
  const mk = async () => { const c = await b.newContext({ viewport: { width: 1280, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); localStorage.setItem('zarok-lang', 'ku'); } catch (_) {} }); return c; };
  const topTab = (p, txt) => p.evaluate(t => { const b = [...document.querySelectorAll('button')].filter(x => x.textContent.includes(t)).find(x => { const r = x.getBoundingClientRect(); return r.top > 60 && r.top < 240; }); b.scrollIntoView(); b.click(); }, txt);
  // Baskı penceresinin görüntüsü (açılır pencere yerine aynı HTML'i normal sayfada çiz)
  const shot = async (pp, name) => { try { const html = await pp.content(); const sp = await (await b.newContext({ viewport: { width: 820, height: 400 }, deviceScaleFactor: 2 })).newPage();
    await sp.goto('http://localhost:8765/app/'); await sp.setContent(html.replace('<head>', '<head><base href="http://localhost:8765/app/">'), { waitUntil: 'load', timeout: 15000 }).catch(() => {});
    await sp.waitForTimeout(800); await sp.screenshot({ path: (process.env.SHOT_DIR || require('os').tmpdir()) + '/' + name, fullPage: true, timeout: 15000 }); } catch (e) { console.log('ekran görüntüsü alınamadı', e.message.split('\n')[0]); } };
  const getDocF = path => fetch(`${FS}/${path}`, { headers: H }).then(r => r.json());

  // 1) Öğrenci işleri kartı çıkarır + basar
  const rc = await mk(); const rp = await login(rc, '98202601', 'Reg12345');
  await topTab(rp, 'Tescîl'); await rp.waitForTimeout(1500);
  const [pop] = await Promise.all([rc.waitForEvent('page'), rp.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '🪪' && x.offsetParent); b.click(); })]);
  await pop.waitForFunction(() => document.querySelector('.card.back img'), null, { timeout: 20000 }).catch(() => {});
  await pop.waitForTimeout(1200);
  const ptxt = await pop.evaluate(() => document.body.innerText);
  ok('Kart baskı sayfası: ön + arka yüz, QR, isim', ptxt.includes('Dilan Aram') && ptxt.includes('20202601') && await pop.evaluate(() => !!document.querySelector('.qr img[src^="data:image/png"]')));
  await shot(pop, 'kart-yetiskin.png');
  const st = await getDocF('students/S1'); const tok1 = st.fields.cardToken && st.fields.cardToken.stringValue;
  ok('Öğrenciye 128 bit kart anahtarı yazıldı', /^[0-9a-f]{32}$/.test(tok1 || ''));
  const c1 = await getDocF('cards/' + tok1);
  ok('cards/{anahtar} belgesi aktif', c1.fields && c1.fields.active.booleanValue === true && c1.fields.no.stringValue === '20202601');
  // QR içeriği gerçekten anahtarı taşıyor mu? (jsQR ile baskı sayfasındaki QR'ı çöz)
  const jsqr = fs.readFileSync(require('path').join(__dirname, '..', '..', 'app', 'vendor', 'jsQR.js'), 'utf8');
  await pop.addScriptTag({ content: jsqr });
  const decoded = await pop.evaluate(() => { const im = document.querySelector('.qr img'); const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const r = jsQR(x.getImageData(0, 0, c.width, c.height).data, c.width, c.height); return r && r.data; });
  ok('Karttaki QR = "AAT1:" + anahtar (numara değil)', decoded === 'AAT1:' + tok1, decoded);
  await pop.close();

  // 2) Kapı güvenliği: geçerli kart
  const gc = await mk(); const gp = await login(gc, '97202601', 'Gate1234');
  ok('Kapı görevlisi girer → yalnızca kontrol paneli', /kontrola dergeh/i.test(await gp.evaluate(() => document.body.innerText)));
  const gcheck = async code => { await gp.fill('input[aria-label=card-code]', code); await gp.getByText('Kontrol', { exact: true }).click(); await gp.waitForTimeout(2500); return gp.evaluate(() => document.body.innerText); };
  let gt = await gcheck('AAT1:' + tok1);
  await gp.setViewportSize({ width: 430, height: 900 }); await gp.waitForTimeout(400); await gp.screenshot({ path: (process.env.SHOT_DIR || require('os').tmpdir()) + '/kapi.png' }).catch(() => {});
  ok('Geçerli kart → ✅ GEÇEBİLİR + isim', gt.includes('DERBAS BIBE') && !gt.includes('DERBAS NEBE') && gt.includes('Dilan Aram'));
  // 3) Sahte kart (öğrenci numarasıyla QR veya rastgele anahtar)
  gt = await gcheck('20202601');
  ok('Numaralı sahte QR → ⛔', gt.includes('DERBAS NEBE'));
  gt = await gcheck('AAT1:' + '0123456789abcdef0123456789abcdef');
  ok('Rastgele anahtar → ⛔ tanınmıyor', gt.includes('DERBAS NEBE') && gt.includes('nayê naskirin'));
  // 4) Kayıp kart yenilenir → eski kart çalışmaz
  await rp.bringToFront();
  const [pop2] = await Promise.all([rc.waitForEvent('page'), rp.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '♻️' && x.offsetParent); b.click(); })]);
  await pop2.waitForTimeout(2500); await pop2.close();
  const tok2 = (await getDocF('students/S1')).fields.cardToken.stringValue;
  ok('Yeni kart anahtarı üretildi', tok2 && tok2 !== tok1);
  await gp.bringToFront();
  gt = await gcheck('AAT1:' + tok1);
  ok('Eski (kayıp) kart → ⛔ iptal', gt.includes('DERBAS NEBE') && gt.includes('betalkirin'));
  gt = await gcheck('AAT1:' + tok2);
  ok('Yeni kart → ✅', gt.includes('DERBAS BIBE') && gt.split('DERBAS BIBE').length > 1);
  const logs = await list('gateLog');
  ok('Kapı giriş kayıtları tutuldu (görevli numarasıyla)', logs.length >= 4 && logs.every(d => d.fields.by.stringValue === '97202601'));

  // 5) Çocuk kartı → çocuk öğretmeni okutur → yoklama + veli bildirimi
  await rp.bringToFront(); await topTab(rp, 'Akademiya Zarokan'); await rp.waitForTimeout(1500);
  await rp.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('👧 Zarok') && x.offsetParent); b.click(); }); await rp.waitForTimeout(800);
  const [pop3] = await Promise.all([rc.waitForEvent('page'), rp.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '🪪' && x.offsetParent); b.click(); })]);
  await pop3.waitForTimeout(2500); await shot(pop3, 'kart-zarok.png');
  ok('Çocuk kartı basılır', (await pop3.evaluate(() => document.body.innerText)).includes('AKADEMIYA ZAROKAN'));
  await pop3.close();
  const ktok = (await getDocF('kids/K1')).fields.cardToken.stringValue;
  const vc = await mk(); const vp = await vc.newPage(); vp.on('pageerror', e => errs.push('veli: ' + e.message));
  await vp.goto('http://localhost:8765/zarok/app/?emu=1'); await vp.waitForSelector('#l-no', { timeout: 20000 });
  await signUp('92026001@veli.aat', 'Veli1234');
  await vp.click('.roles button:nth-child(1)'); await vp.fill('#l-no', '92026001'); await vp.fill('#l-pw', 'Veli1234'); await vp.click('.login .btn');
  await vp.waitForSelector('.status', { timeout: 20000 });
  const tc = await mk(); const tp = await tc.newPage(); tp.on('pageerror', e => errs.push('öğretmen: ' + e.message));
  await tp.goto('http://localhost:8765/zarok/app/?emu=1'); await tp.waitForSelector('#l-no', { timeout: 20000 });
  await tp.click('.roles button:nth-child(2)'); await tp.fill('#l-no', '72026001'); await tp.fill('#l-pw', 'Kid12345'); await tp.click('.login .btn');
  await tp.waitForSelector('.attrow', { timeout: 20000 });
  await tp.getByText('Kartê bixwîne').first().click(); await tp.waitForTimeout(500);
  await tp.fill('.scanov input[aria-label=card-code]', 'AAT1:' + ktok); await tp.click('.scanov .btn.sm'); await tp.waitForTimeout(2500);
  ok('Öğretmen çocuk kartını okutur → "ket dersê"', (await tp.evaluate(() => document.querySelector('.scanres').textContent)).includes('Rojda'));
  await vp.waitForTimeout(2000);
  const vt = await vp.locator('.toast').textContent().catch(() => '');
  ok('Veliye anında bildirim (derse girdi)', /Rojda/.test(vt), vt);
  await tp.fill('.scanov input[aria-label=card-code]', 'AAT1:' + tok2); await tp.click('.scanov .btn.sm'); await tp.waitForTimeout(2000);
  ok('Çocuk öğretmeni yetişkin kartını kullanamaz', !(await tp.evaluate(() => document.querySelector('.scanres').textContent)).includes('ket dersê'));
  const katt = await list('kidAttendance');
  ok('Yoklama kaydı yazıldı', katt.some(d => d.fields.kidName && d.fields.kidName.stringValue === 'Rojda Aram' && d.fields.type.stringValue === 'in'));
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(async e => { console.error('E2E HATA', e.message.split('\n')[0]); process.exit(1); });
