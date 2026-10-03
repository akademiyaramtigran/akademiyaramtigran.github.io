// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Kardeşler (aynı veliye bağlama) + sınıf sistemi (çocuk + ana akademi, sınıf öğretmeni)
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
const clickText = (p, text, top) => p.evaluate(([t, top]) => {
  const ok = x => { const r = x.getBoundingClientRect(); return r.width > 0 && (!top || (r.top > 60 && r.top < 260)); };
  // Önce ekrandaki, yoksa yatay şeritte kaymış olanı al (kapalı yan menüdeki kopyalar -left ile elenir)
  const b = [...document.querySelectorAll('button')].filter(x => x.textContent.includes(t) && x.offsetParent !== null && ok(x))
    .sort((a, c) => (a.getBoundingClientRect().left < -200) - (c.getBoundingClientRect().left < -200))[0];
  if (!b) throw new Error('düğme yok: ' + t); b.scrollIntoView({ inline: 'center', block: 'nearest' }); b.click();
}, [text, top]);

(async () => {
  const YR = String(new Date().getFullYear());
  // Kişiler: öğrenci işleri, akademi öğretmeni + öğrenci, çocuk akademisi öğretmeni
  await put('idx_staff/98202601', { no: '98202601', lvl: 'registrar' });
  await put('teachers/TR', { no: '98202601', name: 'Karûbar', isRegistrar: true, area: 'genel' });
  await signUp('98202601@ogretmen.aat', 'Reg12345');
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' });
  await put('teachers/T50', { no: '50202601', name: 'Mamoste Dilovan', area: 'muzik' });
  await signUp('50202601@ogretmen.aat', 'Tea12345');
  await put('idx_students/20202601', { no: '20202601' });
  await put('students/S1', { no: '20202601', name: 'Rojîn Aram', area: 'muzik', classLevel: 1, fireId: 'S1' });
  await put('idx_students/20202602', { no: '20202602' });
  await put('students/S2', { no: '20202602', name: 'Baran Şêx', area: 'muzik', classLevel: 2, fireId: 'S2' });
  await signUp('20202601@ogrenci.aat', 'Stu12345');
  const KT = '7' + YR + '901';
  await put('idx_kidstaff/' + KT, { no: KT });
  await put('kidTeachers/' + KT, { no: KT, name: 'Mamoste Berfîn' });
  await signUp(KT + '@zmamoste.aat', 'Kid12345');
  await put('config/zarok', { open: true });
  await put('kidApplications/KA9', { kidName: 'Zîlan Aram', kidDob: '2019-01-05', area: 'drama', guardianName: 'Nûrê Aram', relation: 'dayik', phone: '+90 555 444 55 66', consentKvkk: true, consentPhoto: false, consentShare: false, status: 'new', dateStr: '2026-10-01', createdAt: new Date() });

  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const mk = async (w) => { const c = await b.newContext({ viewport: { width: w || 1280, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); localStorage.setItem('zarok-lang', 'ku'); } catch (_) {} }); return c; };
  const login = async (ctx, no, pw, role) => {
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
    await p.getByText(role || 'Mamoste', { exact: true }).first().click();
    await p.locator('input.inp').first().fill(no); await p.locator('input[type=password]').first().fill(pw);
    await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(7000); return p;
  };
  const topTab = (p, txt) => p.evaluate(t => { const b = [...document.querySelectorAll('button')].filter(x => x.textContent.includes(t)).find(x => { const r = x.getBoundingClientRect(); return r.top > 60 && r.top < 240; }); b.scrollIntoView(); b.click(); }, txt);
  const txt = p => p.evaluate(() => document.body.innerText);
  const getDocF = path => fetch(`${FS}/${path}`, { headers: H }).then(r => r.json());
  const kidsOf = async g => (await list('kids')).filter(d => JSON.stringify(d.fields.guardianNos || {}).includes(g));

  // ── 1) Öğrenci İşleri: çocuk + yeni veli (1. sınıf) ──
  const rc = await mk(); const p = await login(rc, '98202601', 'Reg12345');
  await topTab(p, 'Akademiya Zarokan'); await p.waitForTimeout(2000);
  await clickText(p, '🎓 Zarok'); await p.waitForTimeout(400);
  await clickText(p, 'Zarokê Tescîl Bike'); await p.waitForTimeout(300);
  await p.locator('label:has-text("Nav û paşnavê zarokê") + input').fill('Dilan Aram');
  await p.selectOption('label:has-text("Sinif (li akademiyê)") + select', '1');
  await p.locator('label:has-text("Navê dêûbav") + input').fill('Nûrê Aram');
  await p.locator('label:has-text("Têlefon *") + input').fill('0555 444 55 66');
  await clickText(p, '💾 Tomar bike');
  await p.waitForSelector('text=Zarok hate tomarkirin', { timeout: 20000 });
  const c1 = await txt(p);
  const gno = (c1.match(/Jimara têketinê:\s*(\d+)/) || [])[1], gpass = (c1.match(/Şîfre:\s*(\S+)/) || [])[1];
  ok('Çocuk + yeni veli hesabı (1. sınıf)', !!gno && !!gpass, 'veli ' + gno);
  await clickText(p, 'Baş e'); await p.waitForTimeout(300);

  // ── 2) Veliler → "➕ Xwişk/bira": kardeş aynı hesaba ──
  await clickText(p, '👨‍👩‍👧 Dêûbav'); await p.waitForTimeout(500);
  ok('Veliler sekmesinde kardeş ekleme düğmesi', (await txt(p)).includes('Xwişk/bira'));
  await clickText(p, '➕ Xwişk/bira'); await p.waitForTimeout(500);
  const f2 = await txt(p);
  ok('Kardeş formu mevcut veliyle açılır (yeni hesap yok uyarısı)', f2.includes('Zarokên vê dêûbavê') && f2.includes('Dilan Aram'));
  await p.locator('label:has-text("Nav û paşnavê zarokê") + input').fill('Serhat Aram');
  await p.selectOption('label:has-text("Sinif (li akademiyê)") + select', '2');
  await clickText(p, '💾 Tomar bike');
  await p.waitForSelector('text=Zarok hate tomarkirin', { timeout: 20000 });
  const c2 = await txt(p);
  ok('Kardeş kaydında yeni şifre üretilmez', !/Şîfre:/.test(c2) && c2.includes('Dêûbav berê hesab heye'));
  await clickText(p, 'Baş e'); await p.waitForTimeout(300);
  let ks = await kidsOf(gno);
  ok('İki çocuk aynı veli numarasına bağlı', ks.length === 2, ks.length + ' çocuk');
  ok('Yeni veli hesabı açılmadı', (await list('guardians')).length === 1);

  // ── 3) Başvuru: aynı telefon → kardeş olarak önerilir, kabulde aynı veliye bağlanır ──
  await clickText(p, '📋 Serlêdan'); await p.waitForTimeout(500);
  await p.getByText('Zîlan Aram').first().click(); await p.waitForTimeout(400);
  const a3 = await txt(p);
  ok('Başvuruda kayıtlı veli eşleşir (kardeş önerisi)', a3.includes('Wek xwişk/bira tê girêdan') && a3.includes('Dilan Aram'));
  await clickText(p, '✅ Qebûl û Tescîl');
  await p.waitForSelector('text=Zarok hate tomarkirin', { timeout: 20000 });
  ks = await kidsOf(gno);
  ok('Başvurudan gelen kardeş aynı veliye bağlandı', ks.length === 3 && (await list('guardians')).length === 1, ks.length + ' çocuk');
  await clickText(p, 'Baş e'); await p.waitForTimeout(300);
  await clickText(p, '🎓 Zarok'); await p.waitForTimeout(500);
  ok('Çocuk listesinde kardeşler ve sınıf görünür', /Xwişk û bira: .*Serhat Aram/.test(await txt(p)) && (await txt(p)).includes('1. Sînif'));

  // ── 4) Çocuk sınıfları: atanmamış çocuğa sınıf + sınıf öğretmeni ──
  await clickText(p, '🏫 Sînif'); await p.waitForTimeout(600);
  const s4 = await txt(p);
  ok('Sınıf sekmesi: atanmamış çocuk listelenir', s4.includes('Sinif nehatiye diyarkirin') && s4.includes('Zîlan Aram'));
  await p.evaluate(() => { const row = [...document.querySelectorAll('div')].filter(d => d.children.length === 2 && d.textContent.includes('Zîlan Aram') && d.querySelector('select')).pop();
    const s = row.querySelector('select'); const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set; set.call(s, '1'); s.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(1500);
  const zil = (await list('kids')).find(d => d.fields.name.stringValue === 'Zîlan Aram');
  ok('Çocuğun sınıfı listeden değiştirilir', zil && zil.fields.classLevel && zil.fields.classLevel.integerValue === '1');
  await p.evaluate(() => { const b = [...document.querySelectorAll('button')].filter(x => x.textContent.includes('Mamosteyê sinifê') && x.offsetParent)[0]; b.click(); });
  await p.waitForTimeout(400);
  await p.locator('label', { hasText: 'Mamoste Berfîn' }).locator('input[type=checkbox]').check();
  await clickText(p, '💾 Tomar bike'); await p.waitForTimeout(1500);
  const L1 = await getDocF('kidClasses/L1');
  ok('Çocuk 1. sınıfına sınıf öğretmeni atanır', L1.fields && JSON.stringify(L1.fields.teacherNos).includes(KT) && JSON.stringify(L1.fields.teacherNames).includes('Mamoste Berfîn'));
  ok('Sınıf kartında öğretmen ve 2 çocuk', /1\. Sînif \(2 zarok\)/.test(await txt(p)) && (await txt(p)).includes('👩‍🏫 Mamoste Berfîn'));

  // ── 5) Ana akademi: Sınıf bölümü — alan + sınıf grupları, sınıf öğretmeni ──
  await p.evaluate(() => { const b = [...document.querySelectorAll('button')].filter(x => x.textContent.trim().endsWith('Sînif') && x.textContent.trim().length < 12).find(x => { const r = x.getBoundingClientRect(); return r.top > 60 && r.top < 240; }); b.scrollIntoView(); b.click(); }); await p.waitForTimeout(1500);
  const s5 = await txt(p);
  ok('Ana akademi sınıfları alan + sınıfa göre gruplanır', /1\. Sînif \(1 xwendekar\)/.test(s5) && /2\. Sînif \(1 xwendekar\)/.test(s5));
  await p.evaluate(() => { const card = [...document.querySelectorAll('div')].filter(d => /1\. Sînif \(1 xwendekar\)/.test(d.textContent) && d.querySelector('button')).pop();
    [...card.querySelectorAll('button')].find(x => x.textContent.includes('Mamosteyê sinifê')).click(); });
  await p.waitForTimeout(400);
  await p.locator('label', { hasText: 'Mamoste Dilovan' }).locator('input[type=checkbox]').check();
  await clickText(p, '💾 Tomar bike'); await p.waitForTimeout(1500);
  const M1 = await getDocF('classes/muzik_1');
  ok('Ana akademi: Müzik 1. sınıfa sınıf öğretmeni atanır', M1.fields && JSON.stringify(M1.fields.teacherNos).includes('50202601'));

  // ── 6) Veli uygulaması: 3 çocuk, sınıf + sınıf öğretmeni ──
  const vc = await mk(390); const vp = await vc.newPage(); vp.on('pageerror', e => errs.push('veli: ' + e.message));
  await vp.goto('http://localhost:8765/zarok/app/?emu=1'); await vp.waitForSelector('#l-no', { timeout: 20000 });
  await vp.click('.roles button:nth-child(1)'); await vp.fill('#l-no', gno); await vp.fill('#l-pw', gpass); await vp.click('.login .btn');
  await vp.waitForSelector('.status', { timeout: 20000 }); await vp.waitForTimeout(1500);
  ok('Veli tek hesapla 3 kardeşi görür', (await vp.locator('.kidchip').count()) === 3);
  const v6 = await txt(vp);
  ok('Velide çocuğun sınıfı ve sınıf öğretmeni', v6.includes('1. Sînif') && v6.includes('Mamoste Berfîn'), v6.split('\n').find(l => l.includes('Sînif')));

  // ── 7) Çocuk öğretmeni: "Sinifa min" filtresi ──
  const tc = await mk(390); const tp = await tc.newPage(); tp.on('pageerror', e => errs.push('kidteacher: ' + e.message));
  await tp.goto('http://localhost:8765/zarok/app/?emu=1'); await tp.waitForSelector('#l-no', { timeout: 20000 });
  await tp.click('.roles button:nth-child(2)'); await tp.fill('#l-no', KT); await tp.fill('#l-pw', 'Kid12345'); await tp.click('.login .btn');
  await tp.waitForSelector('.chips', { timeout: 20000 }); await tp.waitForTimeout(1500);
  await tp.evaluate(() => [...document.querySelectorAll('.chipb')].find(x => x.textContent.includes('Sinifa min')).click()); await tp.waitForTimeout(500);
  const t7 = await txt(tp);
  ok('Öğretmen "Sinifa min" → yalnızca kendi sınıfının çocukları', t7.includes('Dilan Aram') && t7.includes('Zîlan Aram') && !t7.includes('Serhat Aram'));

  // ── 8) Ana akademi öğretmeni: "Sinifên Min" ──
  const ac = await mk(430); const ap = await login(ac, '50202601', 'Tea12345');
  await ap.evaluate(() => { const b = [...document.querySelectorAll('button')].filter(x => x.textContent.includes('Xwendekar') && x.offsetParent).pop(); b.click(); });
  await ap.waitForTimeout(1500);
  await ap.getByText('Sinifên Min').first().waitFor({ timeout: 10000 }).catch(() => {});
  await ap.evaluate(() => { const s = [...document.querySelectorAll('span')].find(x => /1\. Sînif/.test(x.textContent) && x.textContent.includes('▸')); s && s.click(); });
  await ap.waitForTimeout(500);
  const t8 = await txt(ap);
  ok('Akademi öğretmeni "Sinifên Min" kartında sınıfını ve öğrencisini görür', t8.includes('Sinifên Min') && t8.includes('Rojîn Aram'));

  // ── 9) Öğrenci: sınıf öğretmeni adı profilde ──
  const sc = await mk(430); const sp = await login(sc, '20202601', 'Stu12345', 'Xwendekar');
  await sp.waitForTimeout(1500);
  ok('Öğrenci kendi sınıf öğretmenini görür', (await txt(sp)).includes('Mamoste Dilovan'));

  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  const bad = out.filter(l => l.startsWith('❌')).length;
  console.log('\n' + (bad ? '❌ ' + bad + ' adım başarısız' : '✅ Hepsi geçti (' + out.length + ' adım)'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('HATA', e); process.exit(1); });
