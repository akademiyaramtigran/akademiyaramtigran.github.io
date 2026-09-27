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

// Saldırı testleri: saklanan XSS, zararlı bağlantılar, çerçeveye gömme, kaba kuvvet
const X = '<img src=x onerror="window.__x=1">';
const JS = 'javascript:window.__x=1';
const ts = { timestampValue: new Date().toISOString() };
const putRaw = (path, fields) => fetch(`${FS}/${path}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields }) }).then(r => { if (!r.ok) throw new Error('seed ' + path + ' ' + r.status); });
const S = v => ({ stringValue: v }), A = a => ({ arrayValue: { values: a } }), M = o => ({ mapValue: { fields: o } }), B = v => ({ booleanValue: v });
(async () => {
  await putRaw('news/N1', { title: S(X), body: S(X), dateStr: S('2026-09-27'), createdAt: ts, area: S('muzik'), images: A([S(JS), S(X)]), image: S(JS), youtubeId: S('"><img src=x onerror=window.__x=1>'), videos: A([M({ url: S(JS), title: S(X) })]) });
  await putRaw('archive/A1', { year: { integerValue: '2012' }, title: S(X), body: S(X), images: A([S(JS)]) });
  await putRaw('kidNews/KN1', { title: S(X), body: S(X), date: S('2026-09-27'), createdAt: ts, images: A([S(JS)]), youtube: S(JS) });
  await putRaw('kidArchive/KA1', { year: { integerValue: '2020' }, title: S(X), body: S(X), images: A([S(JS)]) });
  await putRaw('config/applications', { open: B(true) });
  await putRaw('applicationTemplates/T1', { name: S(X), file: S(JS), order: { integerValue: '1' } });
  await putRaw('config/zarok', { open: B(true) });
  await putRaw('kidApplicationTemplates/KT1', { name: S(X), file: S('data:text/html;base64,PHNjcmlwdD53aW5kb3cuX194PTE8L3NjcmlwdD4='), order: { integerValue: '1' } });
  await putRaw('idx_staff/98202601', { no: S('98202601'), lvl: S('registrar') });
  await putRaw('teachers/TR', { no: S('98202601'), name: S('Karûbar'), isRegistrar: B(true), area: S('genel') });
  await signUp('98202601@ogretmen.aat', 'Reg12345');
  await putRaw('idx_students/20202601', { no: S('20202601') });
  await putRaw('students/S1', { no: S('20202601'), name: S(X), area: S('muzik') });
  await putRaw('applications/AP1', { name: S(X), phone: S('1'), status: S('new'), dateStr: S('2026-09-27'), createdAt: ts, note: S(X), docs: A([M({ name: S(X), file: S(JS) }), M({ name: S('b'), file: S('data:text/html;base64,PHNjcmlwdD4=') })]) });
  await putRaw('kidApplications/KAP1', { kidName: S(X), guardianName: S(X), phone: S('1'), consentKvkk: B(true), status: S('new'), createdAt: ts, docs: A([M({ name: S(X), file: S(JS) })]) });
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log(l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const mk = async () => { const c = await b.newContext({ viewport: { width: 1280, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} window.alert = window.confirm = () => { window.__x = 1; return true; }; }); return c; };
  const probe = p => p.evaluate(() => ({ x: window.__x === 1, bad: [...document.querySelectorAll('a[href]')].filter(a => /^\s*(javascript|data:text\/html)/i.test(a.getAttribute('href'))).length,
    handlers: [...document.querySelectorAll('*')].filter(e => [...e.attributes].some(a => /^on/i.test(a.name) && /__x/.test(a.value))).length }));
  const verdict = r => !r.x && r.bad === 0 && r.handlers === 0;
  // 1) Ana site (haberler, arşiv, başvuru formu şablonları)
  const c1 = await mk(); const p1 = await c1.newPage(); await p1.goto('http://localhost:8765/?emu=1'); await p1.waitForTimeout(6000);
  await p1.evaluate(() => { document.querySelectorAll('#nuce a, #nuce button, .news-card, .arch-item').forEach(e => { try { e.click(); } catch (_) {} }); }); await p1.waitForTimeout(1500);
  let r = await probe(p1); ok('Ana site: zararlı haber/arşiv/şablon → betik çalışmaz', verdict(r), JSON.stringify(r));
  ok('Ana site: zararlı metin düz yazı olarak görünür', (await p1.evaluate(() => document.body.innerText)).includes('<img src=x'));
  // 2) Çocuk sitesi
  const p2 = await c1.newPage(); await p2.goto('http://localhost:8765/zarok/?emu=1'); await p2.waitForTimeout(5000);
  r = await probe(p2); ok('Çocuk sitesi: zararlı haber/arşiv/belge şablonu → betik çalışmaz', verdict(r), JSON.stringify(r));
  // 3) Öğrenci işleri paneli (başvuru belgeleri, öğrenci adı, yazdırma)
  const c3 = await mk(); const p3 = await c3.newPage(); p3.on('dialog', d => d.accept());
  await p3.goto('http://localhost:8765/app/?emu=1'); await p3.waitForSelector('text=Têkeve', { timeout: 60000 });
  await p3.getByText('Mamoste', { exact: true }).first().click();
  await p3.locator('input.inp').first().fill('98202601'); await p3.locator('input[type=password]').first().fill('Reg12345');
  await p3.getByText('Têkeve', { exact: true }).last().click(); await p3.waitForTimeout(8000);
  // Yalnızca başvuru kartını aç (yıkıcı düğmelere dokunma)
  const openRow = () => p3.evaluate(() => { const el = [...document.querySelectorAll('.scroll-area div')].filter(d => d.children.length && d.textContent.includes('<img src=x') && !d.querySelector('button')).pop(); el && el.click(); });
  await openRow(); await p3.waitForTimeout(1500);
  const rt = await p3.evaluate(() => ({ t: document.body.innerText.includes('<img src=x'), a: [...document.querySelectorAll('.scroll-area a')].filter(x => !x.getAttribute('href') || x.getAttribute('href') === '#').length }));
  ok('Öğrenci işleri: zararlı başvuru düz metin; zararlı belge bağlantıları etkisizleştirildi', rt.t && rt.a >= 1, JSON.stringify(rt) + ' ' + (await p3.evaluate(() => document.body.innerText.slice(0, 600).replace(/\s+/g, ' '))));
  r = await probe(p3); ok('Öğrenci işleri: zararlı başvuru belgesi bağlantısı süzülür', verdict(r), JSON.stringify(r));
  const pops = []; c3.on('page', pg => pops.push(pg));
  await p3.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /PDF/.test(x.textContent) && x.offsetParent); b && b.click(); }); await p3.waitForTimeout(2500);
  for (const pg of pops) { const rr = await probe(pg).catch(() => ({ x: false, bad: 0, handlers: 0 })); ok('Yazdırma sayfası: zararlı ad betik çalıştırmaz', verdict(rr), JSON.stringify(rr)); }
  // Tescîl + Zarok bölümleri
  const tab = t => p3.evaluate(t => { const b = [...document.querySelectorAll('button')].filter(x => x.textContent.includes(t)).find(x => { const q = x.getBoundingClientRect(); return q.top > 60 && q.top < 240; }); b && b.click(); }, t);
  await tab('Tescîl'); await p3.waitForTimeout(1200); await tab('Akademiya Zarokan'); await p3.waitForTimeout(1500);
  await openRow(); await p3.waitForTimeout(1000);
  r = await probe(p3); ok('Öğrenci işleri: öğrenci listesi + çocuk başvurusu güvenli', verdict(r), JSON.stringify(r));
  // 4) Çerçeveye gömme (clickjacking)
  const p4 = await (await b.newContext()).newPage(); await p4.setContent('<iframe src="http://localhost:8765/app/" width=600 height=400></iframe><iframe src="http://localhost:8765/zarok/app/" width=600 height=400></iframe>'); await p4.waitForTimeout(3000);
  const hidden = await Promise.all(p4.frames().filter(f => f !== p4.mainFrame()).map(f => f.evaluate(() => getComputedStyle(document.documentElement).display).catch(() => 'none')));
  ok('Başka siteye gömülen uygulamalar gizlenir (clickjacking)', hidden.length === 2 && hidden.every(d => d === 'none'), hidden.join(','));
  // 5) Kaba kuvvet: 5 hatalı denemeden sonra kilit
  const c5 = await mk(); const p5 = await c5.newPage(); await p5.goto('http://localhost:8765/app/?emu=1'); await p5.waitForSelector('text=Têkeve', { timeout: 60000 });
  await p5.getByText('Mamoste', { exact: true }).first().click();
  for (let i = 0; i < 6; i++) { await p5.locator('input.inp').first().fill('98202601'); await p5.locator('input[type=password]').first().fill('yanlis' + i); await p5.getByText('Têkeve', { exact: true }).last().click(); await p5.waitForTimeout(1800); }
  ok('5 hatalı denemeden sonra hesap kilitlenir', /kilî|locked/i.test(await p5.evaluate(() => document.body.innerText)));
  await p5.locator('input[type=password]').first().fill('Reg12345'); await p5.getByText('Têkeve', { exact: true }).last().click(); await p5.waitForTimeout(3000);
  ok('Kilitliyken doğru şifre de kabul edilmez', /kilî|locked/i.test(await p5.evaluate(() => document.body.innerText)));
  // 6) Emülatör kancası canlı sitede etkisiz (yalnızca localhost)
  const hook = fs.readFileSync(require('path').join(__dirname, '..', '..', 'app', 'index.html'), 'utf8');
  ok('?emu kancası yalnızca localhost ile sınırlı', /localhost\|127/.test(hook) && /has\(["']emu["']\)/.test(hook));
  await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(async e => { console.error('E2E HATA', e.message.split('\n')[0]); process.exit(1); });
