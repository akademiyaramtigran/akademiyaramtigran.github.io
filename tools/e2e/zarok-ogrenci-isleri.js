// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Ana uygulama (Öğrenci İşleri → Akademiya Zarokan) + veli uygulaması, emülatörlere karşı
const { chromium } = require('playwright-core');
const fs = require('fs');
const FBV = require('firebase/package.json').version; // yerel SDK sürümü (CDN istekleri buna yönlendirilir)
const P = 'aram2026-a9fd7';
const NM = require('path').dirname(require.resolve('firebase/package.json')) + '/../';
const FS = `http://127.0.0.1:8080/v1/projects/${P}/databases/(default)/documents`;
const H = { 'Content-Type': 'application/json', 'Authorization': 'Bearer owner' };
const val = v => v instanceof Date ? { timestampValue: v.toISOString() } : Array.isArray(v) ? { arrayValue: { values: v.map(val) } } : typeof v === 'boolean' ? { booleanValue: v } : { stringValue: String(v) };
const put = (path, obj) => fetch(`${FS}/${path}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, val(v)])) }) }).then(r => { if (!r.ok) throw new Error('seed ' + path + ' ' + r.status); });
const list = col => fetch(`${FS}/${col}?pageSize=100`, { headers: H }).then(r => r.json()).then(j => j.documents || []);
const clickText = (p, text, top) => p.evaluate(([t, top]) => {
  const ok = x => { const r = x.getBoundingClientRect(); return r.width > 0 && (!top || (r.top > 60 && r.top < 260)); };
  // Önce ekrandaki, yoksa yatay şeritte kaymış olanı al (kapalı yan menüdeki kopyalar -left ile elenir)
  const b = [...document.querySelectorAll('button')].filter(x => x.textContent.includes(t) && x.offsetParent !== null && ok(x))
    .sort((a, c) => (a.getBoundingClientRect().left < -200) - (c.getBoundingClientRect().left < -200))[0];
  if (!b) throw new Error('düğme yok: ' + t); b.scrollIntoView({ inline: 'center', block: 'nearest' }); b.click();
}, [text, top]);
const signUp = (email, password) => fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=x', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) }).then(r => r.json());
const LOCAL = { 'react.production.min.js': 'react/umd/react.production.min.js', 'react-dom.production.min.js': 'react-dom/umd/react-dom.production.min.js', 'babel.min.js': '@babel/standalone/babel.min.js' };

async function routes(ctx) {
  await ctx.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, route => {
    const u = route.request().url();
    const fbm = u.match(/gstatic\.com\/firebasejs\/([\d.]+)\/(firebase-[a-z-]+\.js)$/);
    if (fbm) {
      if (fbm[1] !== FBV) return route.fulfill({ contentType: 'application/javascript', body: `export * from "https://www.gstatic.com/firebasejs/${FBV}/${fbm[2]}";` });
      return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + 'firebase/' + fbm[2]) });
    }
    const f = Object.keys(LOCAL).find(k => u.endsWith('/' + k));
    if (f) return route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + LOCAL[f]) });
    return route.abort();
  });
}

(async () => {
  await put('idx_staff/13202601', { no: '13202601', lvl: 'registrar' });
  await put('teachers/T13', { no: '13202601', name: 'Karûbarên Xwendekaran', isRegistrar: true, area: 'genel' });
  await signUp('13202601@ogretmen.aat', 'Reg12345');
  await put('config/zarok', { open: true });
  await put('kidApplications/KA1', { kidName: 'Hêvîn Demir', kidDob: '2018-04-02', area: 'dans', guardianName: 'Zelal Demir', relation: 'dayik', phone: '0555 111 22 33', consentKvkk: true, consentPhoto: true, consentShare: false, status: 'new', dateStr: '2026-09-26', createdAt: new Date() });
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };

  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const ctx = await b.newContext({ viewport: { width: 430, height: 900 } });
  await routes(ctx);
  await ctx.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} });
  const p = await ctx.newPage(); global.__P = p; const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/app/?emu=1');
  await p.waitForSelector('text=Têkeve', { timeout: 60000 });
  await p.getByText('Mamoste', { exact: true }).first().click();
  await p.locator('input.inp').first().fill('13202601');
  await p.locator('input[type=password]').first().fill('Reg12345');
  await p.getByText('Têkeve', { exact: true }).last().click();
  await p.waitForTimeout(8000);
  const t0 = await p.evaluate(() => document.body.innerText);
  ok('Öğrenci İşleri girişi', /Serlêdan|Applications/.test(t0), t0.slice(0, 80).replace(/\n/g, ' '));
  await p.evaluate(() => { const b = [...document.querySelectorAll('button')].filter(x => x.textContent.includes('Akademiya Zarokan')).find(x => { const r = x.getBoundingClientRect(); return r.top > 80 && r.top < 220; }); b.scrollIntoView(); b.click(); });
  await p.waitForTimeout(2500);
  const t1 = await p.evaluate(() => document.body.innerText);
  ok('Zarok sekmesi açılır, başvuru listelenir', t1.includes('Hêvîn Demir'));
  await p.getByText('Hêvîn Demir').first().click();
  await p.getByText('✅ Qebûl û Tescîl').first().click();
  await p.waitForSelector('text=Zarok hate tomarkirin', { timeout: 20000 });
  const credTxt = await p.evaluate(() => document.body.innerText);
  const gno = (credTxt.match(/Jimara têketinê:\s*(\d+)/) || [])[1];
  const pass = (credTxt.match(/Şîfre:\s*(\S+)/) || [])[1];
  ok('Kabul → veli hesabı + çocuk kaydı oluşur', !!gno && !!pass, 'veli ' + gno);
  const kids = await list('kids'), guards = await list('guardians'), idx = await list('idx_guardians');
  const kid = kids.find(d => d.fields.name.stringValue === 'Hêvîn Demir');
  ok('kids kaydı veli numarasına bağlı', kid && JSON.stringify(kid.fields.guardianNos).includes(gno));
  ok('guardians + idx_guardians yazıldı', guards.some(d => d.name.endsWith('/' + gno)) && idx.some(d => d.name.endsWith('/' + gno)));

  // Veli uygulaması: oluşturulan bilgilerle giriş
  const vp = await ctx.newPage(); vp.on('pageerror', e => errs.push('veli: ' + e.message));
  await vp.setViewportSize({ width: 390, height: 844 });
  await vp.goto('http://localhost:8765/zarok/app/?emu=1'); await vp.waitForSelector('#l-no', { timeout: 20000 });
  await vp.fill('#l-no', gno); await vp.fill('#l-pw', pass); await vp.click('.login .btn');
  await vp.waitForSelector('.status', { timeout: 20000 });
  ok('Veli yeni hesapla girer ve çocuğunu görür', (await vp.evaluate(() => document.body.innerText)).includes('Hêvîn'));

  // Öğrenci İşleri "Hat" işaretler → veliye bildirim
  await p.locator('button:visible', { hasText: 'Amadebûn' }).first().click(); await p.waitForTimeout(800);
  await p.evaluate(() => { const btns = [...document.querySelectorAll('button')].filter(b => b.textContent.includes('Hat') && b.textContent.includes('✅'));
    const mine = btns.find(b => (b.parentElement && b.parentElement.parentElement && b.parentElement.parentElement.textContent || '').includes('Hêvîn Demir')); mine.click(); });
  await vp.waitForTimeout(2500);
  const toast = await vp.locator('.toast').textContent().catch(() => '');
  ok('Yoklama "Hat" → veliye anında bildirim', /Hêvîn/.test(toast), toast);
  // Duyuru gönder → velide görünür
  await p.locator('button:visible', { hasText: 'Ragihandin' }).first().click(); await p.waitForTimeout(500);
  await p.fill('input[placeholder="Sernav"]', 'Roja vekirî'); await p.fill('textarea[placeholder^="Ji bo dêûbavan"]', 'Şemiyê em we vedixwînin.');
  await p.getByText('Ji Dêûbavan re Bişîne').click(); await p.waitForTimeout(2000);
  await vp.click('.nav button:nth-child(4)'); await vp.waitForTimeout(800);
  ok('Duyuru veliye ulaşır', (await vp.evaluate(() => document.body.innerText)).includes('Roja vekirî'));
  // Veli mesaj → Öğrenci İşleri görür ve yanıtlar
  await vp.click('.nav button:nth-child(5)'); await vp.fill('#m-text', 'Hêvîn îro nexweş e.'); await vp.click('main .btn'); await vp.waitForTimeout(1500);
  await p.locator('button:visible', { hasText: '💬' }).first().click();
  await p.waitForTimeout(1500);
  ok('Veli mesajı Öğrenci İşleri panelinde', (await p.evaluate(() => document.body.innerText)).includes('Hêvîn îro nexweş e'));
  await p.locator('b', { hasText: '👤 Zelal Demir' }).first().click(); await p.waitForTimeout(500);
  await p.fill('input[placeholder^="Bersiv"]', 'Şifa be!'); await p.locator('button:has-text("📤")').last().click(); await p.waitForTimeout(2000);
  ok('Yanıt veliye ulaşır', (await vp.evaluate(() => document.body.innerText)).includes('Şifa be!'));
  // Başvuru: akademiyle aynı mantık — Öğrenci İşleri istenen belgeyi tanımlar, veli her belgeyi yükler
  await p.bringToFront();
  await clickText(p, '📋 Serlêdan'); await p.waitForTimeout(400);
  await p.locator('input[placeholder^="Navê belgeyê"]').fill('Wêneya nasnameyê');
  await clickText(p, 'Belgeyê zêde bike'); await p.waitForTimeout(1500);
  ok('Öğrenci İşleri istenen belge tanımlar', (await list('kidApplicationTemplates')).some(d => d.fields.name.stringValue === 'Wêneya nasnameyê'));
  const sctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); await routes(sctx);
  await sctx.addInitScript(() => { try { localStorage.setItem('zarok-lang', 'ku'); } catch (_) {} });
  const sp = await sctx.newPage(); sp.on('pageerror', e => errs.push('site: ' + e.message));
  await sp.goto('http://localhost:8765/zarok/?emu=1'); await sp.waitForSelector('#f-kid', { timeout: 20000 });
  ok('Site formunda istenen belge görünür', (await sp.evaluate(() => document.body.innerText)).includes('Wêneya nasnameyê'));
  await sp.fill('#f-kid', 'Baran Kaya'); await sp.fill('#f-gname', 'Roza Kaya'); await sp.fill('#f-phone', '0555 999 88 77'); await sp.check('#c-kvkk');
  await sp.evaluate(() => document.querySelector('form.card button[type=submit]').click()); await sp.waitForTimeout(600);
  ok('Belge yüklenmeden başvuru GÖNDERİLEMEZ', (await sp.evaluate(() => document.querySelector('.msg').textContent)).includes('Wêneya nasnameyê'));
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAEklEQVR4nGP4z8CAB+GTG8HSALfKY52fTcuYAAAAAElFTkSuQmCC', 'base64');
  await sp.setInputFiles('form.card input[type=file]', { name: 'nasname.png', mimeType: 'image/png', buffer: png });
  await sp.evaluate(() => document.querySelector('form.card button[type=submit]').click());
  const sentOk = await sp.waitForFunction(() => document.body.innerText.includes('🎉') || /Hat şandin|wergirtin/.test(document.body.innerText), null, { timeout: 25000 }).then(() => true, () => false);
  const kapp = (await list('kidApplications')).find(d => d.fields.kidName.stringValue === 'Baran Kaya');
  ok('Belgeli başvuru gönderilir (belge adıyla)', sentOk && kapp && JSON.stringify(kapp.fields.docs).includes('Wêneya nasnameyê'));
  await sctx.close();
  // Öğrenci İşleri çocuk akademisi öğretmeni de ekler (yönetici paneliyle aynı ekleme mantığı)
  await p.bringToFront();
  await clickText(p, '👩‍🏫 Mamoste'); await p.waitForTimeout(400);
  await clickText(p, 'Mamoste Tescîl Bike'); await p.waitForTimeout(300);
  await p.locator('label:has-text("Nav û paşnav") + input').fill('Mamoste Azad');
  await clickText(p, '💾 Tomar bike');
  const okT = await p.waitForSelector('text=Mamoste hate tescîlkirin', { timeout: 20000 }).then(() => true, () => false);
  ok('Öğrenci İşleri çocuk öğretmeni ekler (numara + şifre)', okT && (await list('kidTeachers')).length > 0);
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  await p.screenshot({ path: require('os').tmpdir() + '/e2e-registrar.png' }); await vp.screenshot({ path: require('os').tmpdir() + '/e2e-parent.png' });
  console.log(out.join('\n'));
  await b.close(); process.exit(0);
})().catch(async e => { console.error('E2E HATA', e.message.split('\n')[0]); try { await global.__P.screenshot({ path: require('os').tmpdir() + '/e2e-fail.png' }); console.error((await global.__P.evaluate(() => document.body.innerText)).slice(0, 600)); } catch (_) {} process.exit(1); });
