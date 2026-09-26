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
  await put('idx_staff/1000', { no: '1000', lvl: 'admin' });
  await put('teachers/TA', { no: '1000', name: 'Rêveber', isAdmin: true, area: 'genel' });
  await signUp('1000@ogretmen.aat', 'Admin123');
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log(l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const ctx = await b.newContext({ viewport: { width: 430, height: 900 } });
  await routes(ctx);
  await ctx.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); localStorage.setItem('zarok-lang', 'ku'); } catch (_) {} });
  const p = await ctx.newPage(); global.__P = p; const errs = []; p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', d => d.accept());
  await p.goto('http://localhost:8765/app/?emu=1');
  await p.waitForSelector('text=Têkeve', { timeout: 60000 });
  await p.getByText('Mamoste', { exact: true }).first().click();
  await p.locator('input.inp').first().fill('1000');
  await p.locator('input[type=password]').first().fill('Admin123');
  await p.getByText('Têkeve', { exact: true }).last().click();
  await p.waitForTimeout(8000);
  await clickText(p, 'Akademiya Zarokan', true); await p.waitForTimeout(1500);
  ok('Yönetici panelinde Zarok sekmesi', (await p.evaluate(() => document.body.innerText)).includes('Serlêdana zarokan'));

  // 1) Öğretmen ekle
  await clickText(p, '👩‍🏫 Mamoste'); await p.waitForTimeout(400);
  await clickText(p, 'Mamoste Tescîl Bike'); await p.waitForTimeout(300);
  await p.locator('label:has-text("Nav û paşnav") + input').fill('Mamoste Hêvî');
  await clickText(p, '💾 Tomar bike');
  await p.waitForSelector('text=Mamoste hate tescîlkirin', { timeout: 20000 });
  let t = await p.evaluate(() => document.body.innerText);
  const tno = (t.match(/Jimara têketinê:\s*(\d+)/) || [])[1], tpass = (t.match(/Şîfre:\s*(\S+)/) || [])[1];
  ok('Çocuk öğretmeni eklenir (numara + şifre)', !!tno && !!tpass, 'no ' + tno);
  ok('kidTeachers + idx_kidstaff yazıldı', (await list('kidTeachers')).some(d => d.name.endsWith('/' + tno)) && (await list('idx_kidstaff')).some(d => d.name.endsWith('/' + tno)));
  await clickText(p, 'Baş e');

  // 2) Çocuğu elle kaydet (yeni veli)
  await clickText(p, '👧 Zarok'); await p.waitForTimeout(400);
  await clickText(p, 'Zarokê Tescîl Bike'); await p.waitForTimeout(300);
  await p.locator('label:has-text("Nav û paşnavê zarokê") + input').fill('Rojîn Aydın');
  await p.locator('label:has-text("Navê dêûbav") + input').fill('Sara Aydın');
  await p.locator('label:has-text("Têlefon *") + input').fill('0555 444 55 66');
  await p.selectOption('label:has-text("Mamoste") + select', { label: 'Mamoste Hêvî' });
  await clickText(p, '💾 Tomar bike');
  await p.waitForSelector('text=Zarok hate tomarkirin', { timeout: 20000 });
  t = await p.evaluate(() => document.body.innerText);
  const gno = (t.match(/Jimara têketinê:\s*(\d+)/) || [])[1], gpass = (t.match(/Şîfre:\s*(\S+)/) || [])[1];
  ok('Çocuk + yeni veli hesabı elle kaydedilir', !!gno && !!gpass, 'veli ' + gno);
  const kid = (await list('kids')).find(d => d.fields.name.stringValue === 'Rojîn Aydın');
  ok('Çocuk öğretmene atanır', kid && kid.fields.teacherNo.stringValue === tno);
  await clickText(p, 'Baş e');

  // 3) Site haberi yayınla
  await clickText(p, 'Nûçeyên Malperê'); await p.waitForTimeout(400);
  await clickText(p, 'Nûçeya nû'); await p.waitForTimeout(300);
  await p.locator('label:has-text("Sernav") + input').fill('Konsera zarokan');
  await p.locator('label:has-text("Nivîs") + textarea').fill('Roja Şemiyê konsera me heye.');
  await clickText(p, 'Türkçe'); await p.locator('label:has-text("Sernav") + input').fill('Çocuk konseri');
  await clickText(p, '📤 Biweşîne'); await p.waitForTimeout(2500);
  const news = await list('kidNews');
  ok('Site haberi (KU + TR çeviri) yayınlanır', news.some(d => d.fields.title.stringValue === 'Konsera zarokan' && JSON.stringify(d.fields.i18n).includes('Çocuk konseri')));

  // 4) Öğretmen Zarok uygulamasına girer, yoklama alır
  const tp = await ctx.newPage(); tp.on('pageerror', e => errs.push('öğretmen: ' + e.message));
  await tp.setViewportSize({ width: 390, height: 844 });
  await tp.goto('http://localhost:8765/zarok/app/?emu=1'); await tp.waitForSelector('#l-no', { timeout: 20000 });
  await tp.click('.roles button:nth-child(2)'); await tp.fill('#l-no', tno); await tp.fill('#l-pw', tpass); await tp.click('.login .btn');
  await tp.waitForSelector('.attrow', { timeout: 20000 });
  ok('Çocuk öğretmeni Zarok uygulamasına girer', (await tp.evaluate(() => document.body.innerText)).includes('Mamoste Hêvî'));
  const vctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await routes(vctx);
  await vctx.addInitScript(() => { try { localStorage.setItem('zarok-lang', 'ku'); } catch (_) {} });
  const vp = await vctx.newPage(); vp.on('pageerror', e => errs.push('veli: ' + e.message));
  await vp.setViewportSize({ width: 390, height: 844 });
  await vp.goto('http://localhost:8765/zarok/app/?emu=1'); await vp.waitForSelector('#l-no', { timeout: 20000 });
  await vp.click('.roles button:nth-child(1)'); await vp.fill('#l-no', gno); await vp.fill('#l-pw', gpass); await vp.click('.login .btn');
  await vp.waitForSelector('.status', { timeout: 20000 });
  await tp.evaluate(() => { const r = [...document.querySelectorAll('.attrow')].find(x => x.textContent.includes('Rojîn')); r.querySelector('.attbtn').click(); });
  await vp.waitForTimeout(2500);
  const toast = await vp.locator('.toast').textContent().catch(() => '');
  ok('Öğretmen "Hat" → veliye anında bildirim', /Rojîn/.test(toast), toast);
  await tp.evaluate(() => { const b = [...document.querySelectorAll('.nav button')][2]; b.click(); });
  await tp.waitForTimeout(500);

  // 5) Çocuk sitesinde haber
  const sp = await ctx.newPage(); sp.on('pageerror', e => errs.push('site: ' + e.message));
  await sp.goto('http://localhost:8765/zarok/?emu=1');
  ok('Haber çocuk sitesinde görünür', await sp.waitForFunction(() => document.body.innerText.includes('Konsera zarokan'), null, { timeout: 20000 }).then(() => true, () => false));
  // 6) Şifre yenileme (Cloud Functions kapalıyken kidSecrets ile)
  await p.bringToFront(); await clickText(p, '👩‍🏫 Mamoste'); await p.waitForTimeout(400);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '🔑' && x.offsetParent); b.click(); });
  await p.waitForSelector('text=Şîfreya nû', { timeout: 20000 }); await p.waitForTimeout(500);
  t = await p.evaluate(() => document.body.innerText);
  const npass = (t.match(/Şîfre:\s*(\S+)/) || [])[1];
  const lctx = await b.newContext(); await routes(lctx); const lp = await lctx.newPage();
  const tryLogin = async pw => { await lp.goto('http://localhost:8765/zarok/app/?emu=1'); await lp.waitForSelector('#l-no', { timeout: 20000 }); await lp.click('.roles button:nth-child(2)'); await lp.fill('#l-no', tno); await lp.fill('#l-pw', pw); await lp.click('.login .btn'); return lp.waitForSelector('.attrow', { timeout: 8000 }).then(() => true, () => false); };
  ok('Şifre yenilenir, öğretmen YENİ şifreyle girer', npass && npass !== tpass && await tryLogin(npass));
  await lctx.close(); const l2 = await b.newContext(); await routes(l2); const lp2 = await l2.newPage();
  await lp2.goto('http://localhost:8765/zarok/app/?emu=1'); await lp2.waitForSelector('#l-no', { timeout: 20000 }); await lp2.click('.roles button:nth-child(2)'); await lp2.fill('#l-no', tno); await lp2.fill('#l-pw', tpass); await lp2.click('.login .btn');
  ok('Eski şifre artık çalışmaz', await lp2.waitForSelector('.attrow', { timeout: 6000 }).then(() => false, () => true));
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close(); process.exit(0);
})().catch(async e => { console.error('E2E HATA', e.message.split('\n')[0]); try { await global.__P.screenshot({ path: require('os').tmpdir() + '/e2e-fail.png' }); } catch (_) {} process.exit(1); });
