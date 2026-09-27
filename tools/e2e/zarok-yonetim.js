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
  // Çocuk akademisi yönetimi Öğrenci İşleri'nde (yönetici panelinde Zarok sekmesi yok)
  await put('idx_staff/14202601', { no: '14202601', lvl: 'registrar' });
  await put('teachers/T14', { no: '14202601', name: 'Karûbar', isRegistrar: true, area: 'genel' });
  await signUp('14202601@ogretmen.aat', 'Reg12345');
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
  await p.locator('input.inp').first().fill('14202601');
  await p.locator('input[type=password]').first().fill('Reg12345');
  await p.getByText('Têkeve', { exact: true }).last().click();
  await p.waitForTimeout(8000);
  const openZarok = () => p.evaluate(() => { const b = [...document.querySelectorAll('button')].filter(x => x.textContent.includes('Akademiya Zarokan')).find(x => { const r = x.getBoundingClientRect(); return r.top > 80 && r.top < 220; }); b.scrollIntoView(); b.click(); });
  await openZarok(); await p.waitForTimeout(1500);
  ok('Öğrenci İşleri panelinde Zarok yönetimi', (await p.evaluate(() => document.body.innerText)).includes('Serlêdana zarokan'));

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
  await clickText(p, '🎓 Zarok'); await p.waitForTimeout(400);
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

  // 3) Yönetici TÜRKÇE arayüzde Basın kartı açar (önceden "K is not a function" ile çöküyordu);
  //    çocuk sitesi haberini artık BASIN kullanıcısı yayınlar (ana akademideki görev ayrımı)
  const trc = await b.newContext({ viewport: { width: 1280, height: 900 } }); await routes(trc);
  await trc.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'tr'); } catch (_) {} });
  const ap = await trc.newPage(); ap.on('pageerror', e => errs.push('tr-yönetici: ' + e.message)); ap.on('dialog', d => d.accept());
  await ap.goto('http://localhost:8765/app/?emu=1'); await ap.waitForSelector('input[type=password]', { timeout: 60000 });
  await ap.getByText('Öğretmen', { exact: true }).first().click();
  await ap.locator('input.inp').first().fill('1000'); await ap.locator('input[type=password]').first().fill('Admin123');
  await ap.getByText('Giriş Yap', { exact: true }).last().click(); await ap.waitForTimeout(8000);
  ok('Yönetici panelinde Çocuk Akademisi sekmesi YOK', !(await ap.evaluate(() => [...document.querySelectorAll('.tab-bar button')].some(b => (b.textContent.includes('Çocuk Akademisi') || b.textContent.includes('Akademiya Zarokan'))))));
  await clickText(ap, 'Basın', true); await ap.waitForTimeout(800);
  await clickText(ap, '➕ Kartı Kaydet'); await ap.waitForTimeout(600);
  const crashed = () => ap.evaluate(() => document.body.innerText.includes('An Error Occurred'));
  ok('TR: Basın kartı formu açılır (çökme yok)', !(await crashed()) && (await ap.evaluate(() => document.body.innerText)).includes('Basın Kartı Kaydet'));
  await ap.locator('input[placeholder="Ad ve Soyad"]').last().fill('Basın Sorumlusu');
  await ap.evaluate(() => { const bs = [...document.querySelectorAll('button')].filter(x => x.offsetParent && x.textContent.includes('Kartı Kaydet')); bs[bs.length - 1].click(); });
  await ap.waitForFunction(() => document.body.innerText.includes('Kartı Kaydedildi'), null, { timeout: 20000 }).catch(() => {});
  const [pno, ppass] = await ap.evaluate(() => [...document.querySelectorAll('div')].filter(d => d.offsetParent && d.style.fontFamily === 'monospace' && d.children.length === 0).map(d => d.textContent.trim()).slice(-2));
  ok('TR: Basın kartı kaydedilir (numara + şifre)', /^99\d+$/.test(pno || '') && (ppass || '').length >= 6 && !(await crashed()), 'no ' + pno);
  // Kayıt arka planda sürer (Firestore + Auth hesabı): dizine düşmesini bekle
  for (let i = 0; i < 30 && !(await list('idx_staff')).some(d => d.name.endsWith('/' + pno)); i++) await ap.waitForTimeout(500);
  await ap.waitForTimeout(2000);
  ok('Basın kartı dizine "press" seviyesiyle yazıldı', (await list('idx_staff')).some(d => d.name.endsWith('/' + pno) && d.fields.lvl.stringValue === 'press'));
  await trc.close();

  const pc = await b.newContext({ viewport: { width: 1280, height: 900 } }); await routes(pc);
  await pc.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} });
  const pp = await pc.newPage(); pp.on('pageerror', e => errs.push('basın: ' + e.message)); pp.on('dialog', d => d.accept());
  await pp.goto('http://localhost:8765/app/?emu=1'); await pp.waitForSelector('text=Têkeve', { timeout: 60000 });
  await pp.getByText('Mamoste', { exact: true }).first().click();
  await pp.locator('input.inp').first().fill(pno); await pp.locator('input[type=password]').first().fill(ppass);
  await pp.getByText('Têkeve', { exact: true }).last().click(); await pp.waitForTimeout(7000);
  const pbody = await pp.evaluate(() => document.body.innerText);
  ok('Basın kullanıcısı girer, Basın paneli açılır', /ÇAPEMENÎ|Çapemenî/.test(pbody), pbody.slice(0, 120).replace(/\s+/g, ' '));
  await clickText(pp, 'Akademiya Zarokan', true); await pp.waitForTimeout(1200);
  const ptxt = await pp.evaluate(() => document.body.innerText);
  ok('Basın Zarok sekmesinde yalnızca haber + arşiv görür', ptxt.includes('Nûçeya nû') && !ptxt.includes('Zarokê Tescîl Bike') && !ptxt.includes('Serlêdana zarokan'));
  await clickText(pp, 'Nûçeya nû'); await pp.waitForTimeout(300);
  await pp.locator('label:has-text("Sernav") + input').fill('Konsera zarokan');
  await pp.locator('label:has-text("Nivîs") + textarea').fill('Roja Şemiyê konsera me heye.');
  await clickText(pp, 'Türkçe'); await pp.locator('label:has-text("Sernav") + input').fill('Çocuk konseri');
  await clickText(pp, '📤 Biweşîne'); await pp.waitForTimeout(2500);
  const news = await list('kidNews');
  ok('Basın Zarok site haberini (KU + TR çeviri) yayınlar', news.some(d => d.fields.title.stringValue === 'Konsera zarokan' && JSON.stringify(d.fields.i18n).includes('Çocuk konseri')));
  await openZarok(); await p.waitForTimeout(800);
  const atxt = await p.evaluate(() => document.body.innerText);
  ok('Öğrenci İşleri Zarok bölümünde haber sekmesi yok (basının işi)', !atxt.includes('Nûçeya nû'));

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
  // Doğru satırdaki 🔑 (başka testler de çocuk öğretmeni eklemiş olabilir)
  await p.evaluate(() => { const b = [...document.querySelectorAll('button')].filter(x => x.textContent.trim() === '🔑' && x.offsetParent)
    .find(x => { let r = x; const keys = e => [...e.querySelectorAll('button')].filter(y => y.textContent.trim() === '🔑').length;
      while (r.parentElement && keys(r.parentElement) === 1) r = r.parentElement; return r.textContent.includes('Mamoste Hêvî'); }); b.click(); });
  await p.waitForSelector('text=Şîfreya nû', { timeout: 20000 }); await p.waitForTimeout(500);
  t = await p.evaluate(() => document.body.innerText);
  const npass = (t.match(/Şîfre:\s*(\S+)/) || [])[1];
  const lctx = await b.newContext(); await routes(lctx); const lp = await lctx.newPage();
  const tryLogin = async pw => { await lp.goto('http://localhost:8765/zarok/app/?emu=1'); await lp.waitForSelector('#l-no', { timeout: 20000 }); await lp.click('.roles button:nth-child(2)'); await lp.fill('#l-no', tno); await lp.fill('#l-pw', pw); await lp.click('.login .btn'); return lp.waitForSelector('.attrow', { timeout: 8000 }).then(() => true, () => false); };
  ok('Şifre yenilenir, öğretmen YENİ şifreyle girer', npass && npass !== tpass && await tryLogin(npass), 'tno ' + tno + ' eski ' + tpass + ' yeni ' + npass);
  await lctx.close(); const l2 = await b.newContext(); await routes(l2); const lp2 = await l2.newPage();
  await lp2.goto('http://localhost:8765/zarok/app/?emu=1'); await lp2.waitForSelector('#l-no', { timeout: 20000 }); await lp2.click('.roles button:nth-child(2)'); await lp2.fill('#l-no', tno); await lp2.fill('#l-pw', tpass); await lp2.click('.login .btn');
  ok('Eski şifre artık çalışmaz', await lp2.waitForSelector('.attrow', { timeout: 6000 }).then(() => false, () => true));
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close(); process.exit(0);
})().catch(async e => { console.error('E2E HATA', e.message.split('\n')[0]); try { await global.__P.screenshot({ path: require('os').tmpdir() + '/e2e-fail.png' }); } catch (_) {} process.exit(1); });
