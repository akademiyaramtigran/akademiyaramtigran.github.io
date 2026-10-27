// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Bölüm sorumlusu — yönetici hesabı açar (bölüm seçerek), sorumlu yalnızca Duyuru / Mesaj / Rapor görür,
//      kendi bölümüne belgeli duyuru gönderir, öğrenci duyuruyu görür ve sorumluya yazar, sorumlu yöneticiye/öğretmene mesaj atar
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
(async () => {
  await put('idx_staff/1000', { no: '1000', lvl: 'admin' });
  await put('teachers/TA', { no: '1000', name: 'Rêveber', isAdmin: true, area: 'genel' });
  await signUp('1000@ogretmen.aat', 'Admin123');
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' });
  await put('teachers/T50', { id: 'T50', no: '50202601', name: 'Mamoste Şano', area: 'tiyatro' });
  await signUp('50202601@ogretmen.aat', 'Tea12345');
  await put('idx_staff/50202602', { no: '50202602', lvl: 'teacher' });
  await put('teachers/T51', { id: 'T51', no: '50202602', name: 'Mamoste Muzîk', area: 'muzik' });
  await put('idx_students/20202601', { no: '20202601' });
  await put('students/S1', { no: '20202601', name: 'Rojîn Aram', area: 'tiyatro', fireId: 'S1', id: 101 });
  await signUp('20202601@ogrenci.aat', 'Stu12345');
  await put('idx_students/20202602', { no: '20202602' });
  await put('students/S2', { no: '20202602', name: 'Baran Şêx', area: 'muzik', fireId: 'S2', id: 102 });
  await signUp('20202602@ogrenci.aat', 'Stu12345');

  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const mk = async (w) => { const c = await b.newContext({ viewport: { width: w || 1280, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} }); return c; };
  const login = async (ctx, no, pw, role) => {
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
    await p.getByText(role || 'Mamoste', { exact: true }).first().click();
    await p.locator('input.inp').first().fill(no); await p.locator('input[type=password]').first().fill(pw);
    await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(7000); return p;
  };
  const txt = p => p.evaluate(() => document.body.innerText);
  const goA = (pg, k) => pg.evaluate(k => document.querySelector('.pano-tile[data-key="' + k + '"],.sm-it[data-key="' + k + '"]').click(), k);
  const btn = (p, t) => p.evaluate(t => { const e = [...document.querySelectorAll('button')].filter(x => x.offsetParent && x.textContent.includes(t)).pop(); if (!e) throw new Error('düğme yok: ' + t); e.click(); }, t);

  // 1) Yönetici: Kartên Taybet → Berpirsê Beşê → bölüm seç → kaydet
  const ap = await login(await mk(), '1000', 'Admin123');
  await goA(ap, 'press'); await ap.waitForTimeout(1000);
  await btn(ap, 'Berpirsê Beşê'); await ap.waitForTimeout(300);
  ok('Kart türlerinde "Berpirsê Beşê" var', (await txt(ap)).includes('Berpirsê Beşê'));
  await btn(ap, 'Kartê Tescîl Bike'); await ap.waitForTimeout(600);
  await ap.locator('input[placeholder="Nav û Nasname"]').last().fill('Berpirsa Şanoyê');
  await btn(ap, 'Kartê Tescîl Bike'); await ap.waitForTimeout(600);
  ok('Bölüm seçilmeden kayıt yapılmaz', (await ap.locator('[data-head-area]').count()) === 1);
  await ap.selectOption('[data-head-area]', 'tiyatro');
  await btn(ap, 'Kartê Tescîl Bike'); await ap.waitForTimeout(5000);
  const heads = (await list('teachers')).filter(d => d.fields.isHead && d.fields.isHead.booleanValue);
  const H1 = heads[0]; const hno = H1 && H1.fields.no.stringValue;
  ok('Kayıtta şifre özeti TUTULMAZ (passHash boş)', H1 && (!H1.fields.passHash || H1.fields.passHash.stringValue === ''));
  ok('Bölüm sorumlusu kaydı (isHead, alan = tiyatro, numara 96…)', heads.length === 1 && H1.fields.area.stringValue === 'tiyatro' && /^96/.test(hno), hno);
  const hpass = await ap.evaluate(() => { const m = document.body.innerText.match(/Şîfre \(otomatîk\)\s*\n\s*(\S+)/); return m ? m[1] : ''; });
  await ap.waitForTimeout(1500);
  const ix = await fetch(`${FS}/idx_staff/${hno}`, { headers: H }).then(r => r.json());
  ok('Dizinde seviye "head" ve bölüm', ix.fields && ix.fields.lvl.stringValue === 'head' && ix.fields.area.stringValue === 'tiyatro');
  const hc = await fetch(`${FS}/config/heads`, { headers: H }).then(r => r.json());
  ok('config/heads: tiyatro → sorumlu', JSON.stringify(hc.fields || {}).includes(hno));

  // 2) Sorumlu girer: yalnızca Duyuru / Mesaj / Rapor
  const hp = await login(await mk(), hno, hpass);
  const keys = await hp.evaluate(() => [...document.querySelectorAll('.sm-it[data-key]')].map(e => e.dataset.key).join(','));
  ok('Sorumlu paneli: duyuru, mesaj, ders programı, misafir ders yoklaması, izin, anket, rapor', keys.split(',').sort().join(',') === 'announce,gatt,leaves,messages,reports,schedule,surveys', keys);
  // Duyuru (kendi bölümüne kilitli) + belge
  const t0 = await txt(hp);
  ok('Duyuru hedefi kendi bölümüne kilitli', t0.includes('Kilkkirî') && t0.includes('Şano'));
  await hp.locator('input[placeholder*="Sernava"]').fill('Prova Şemiyê');
  await hp.locator('textarea').first().fill('Saet 15:00 li salonê');
  await hp.setInputFiles('input[type=file]', { name: 'bername.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') });
  await hp.waitForTimeout(400);
  await btn(hp, 'Bişîne'); await hp.waitForTimeout(2000);
  const anns = (await list('announcements')).filter(d => d.fields.title && d.fields.title.stringValue === 'Prova Şemiyê');
  ok('Duyuru kaydedildi: hedef yalnızca tiyatro, belge ekli', anns.length === 1 && JSON.stringify(anns[0].fields.targets).includes('tiyatro') && !JSON.stringify(anns[0].fields.targets).includes('"all"') && JSON.stringify(anns[0].fields.media || {}).includes('bername.pdf'));
  // Rapor: yalnızca bölüm sekmeleri
  await goA(hp, 'reports'); await hp.waitForTimeout(1200);
  const t1 = await txt(hp);
  ok('Rapor: bölüm sekmeleri (devam, değerlendirmeler, anket) var; çocuk akademisi / arşiv yok', t1.includes('Nirxandina xwendekaran') && t1.includes('Nirxandina mamosteyan') && !t1.includes('Akademiya Zarokan') && !/\bArşîv\b/.test(t1.split('Nirxandina xwendekaran')[1] || ''));

  // 3) Öğrenciler: tiyatro öğrencisi duyuruyu görür, müzik öğrencisi görmez; tiyatro öğrencisi sorumluya yazar
  const s1 = await login(await mk(430), '20202601', 'Stu12345', 'Xwendekar');
  await goA(s1, 'announce'); await s1.waitForTimeout(1500);
  ok('Tiyatro öğrencisi sorumlunun duyurusunu görür', (await txt(s1)).includes('Prova Şemiyê'));
  const s2 = await login(await mk(430), '20202602', 'Stu12345', 'Xwendekar');
  await goA(s2, 'announce'); await s2.waitForTimeout(1500);
  ok('Müzik öğrencisi tiyatro duyurusunu görmez', !(await txt(s2)).includes('Prova Şemiyê'));
  await goA(s2, 'feedback'); await s2.waitForTimeout(1200);
  ok('Sorumlusu olmayan bölümde "bölüm sorumlusu" seçeneği çıkmaz', (await s2.locator('[data-to-head]').count()) === 0);
  await goA(s1, 'feedback'); await s1.waitForTimeout(1500);
  ok('Öğrenci "bölüm sorumlusu" seçeneğini görür', (await s1.locator('[data-to-head="1"]').count()) === 1);
  await s1.click('[data-to-head="1"]');
  await s1.locator('input').filter({ hasNot: s1.locator('[type=checkbox]') }).last().fill('Kostûm');
  await s1.locator('textarea').last().fill('Ji bo provayê kostûm heye?');
  await btn(s1, 'Bişîne'); await s1.waitForTimeout(2000);
  const sm = (await list('messages')).filter(d => d.fields.body && d.fields.body.stringValue === 'Ji bo provayê kostûm heye?');
  ok('Öğrenci mesajı sorumluya gider (toRole head, toArea tiyatro)', sm.length === 1 && sm[0].fields.toRole.stringValue === 'head' && sm[0].fields.toArea.stringValue === 'tiyatro');

  // 4) Sorumlu: gelen kutusunda öğrenci mesajı; yöneticiye + öğretmene belgeli mesaj (öğrenci seçeneği YOK)
  await goA(hp, 'messages'); await hp.waitForTimeout(1500);
  ok('Sorumlunun gelen kutusunda öğrenci mesajı', (await txt(hp)).includes('Kostûm'));
  // Cevap: sorumlu öğrencinin mesajına cevap verir → öğrenci görür
  await hp.evaluate(() => { const c = [...document.querySelectorAll('div')].filter(d => d.textContent.includes('Kostûm') && d.style && d.style.cursor === 'pointer').pop(); c && c.click(); }); await hp.waitForTimeout(600);
  await hp.fill('#hm-reply', 'Erê, li odeya provayê ye'); await btn(hp, 'Bersiv bide'); await hp.waitForTimeout(2000);
  const rp = (await list('messages')).filter(d => d.fields.body && d.fields.body.stringValue === 'Erê, li odeya provayê ye');
  ok('Sorumlu öğrenciye cevap verir (replyTo + öğrenci numarası)', rp.length === 1 && rp[0].fields.recipientNo.stringValue === '20202601' && !!rp[0].fields.replyTo);
  await goA(s1, 'messages'); await s1.waitForTimeout(2000);
  ok('Öğrenci sorumlunun cevabını görür', (await txt(s1)).includes('Erê, li odeya provayê ye') || (await txt(s1)).includes('Re: Kostûm'));
  await btn(hp, 'Peyamek Nû'); await hp.waitForTimeout(400);
  const opts = await hp.locator('[data-head-to] option').allTextContents();
  ok('Mesaj alıcıları: yönetici + yalnızca bölüm öğretmenleri (öğrenci yok)', opts.length === 2 && opts.join('|').includes('Mamoste Şano') && !opts.join('|').includes('Mamoste Muzîk') && !opts.join('|').includes('Rojîn'), opts.join(' | '));
  await hp.selectOption('[data-head-to]', { label: 'Mamoste Şano' });
  await hp.fill('#hm-subject', 'Lîsteya kostûman'); await hp.fill('#hm-body', 'Pel li pêvekê ye');
  await hp.setInputFiles('input[type=file]', { name: 'kostum.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 x') });
  await hp.waitForTimeout(400); await btn(hp, 'Bişîne'); await hp.waitForTimeout(2000);
  const hm = (await list('messages')).filter(d => d.fields.subject && d.fields.subject.stringValue === 'Lîsteya kostûman');
  ok('Sorumlunun belgeli mesajı öğretmene kaydedildi', hm.length === 1 && hm[0].fields.recipientNo.stringValue === '50202601' && JSON.stringify(hm[0].fields.attachments).includes('kostum.pdf'));
  const tp = await login(await mk(), '50202601', 'Tea12345');
  await goA(tp, 'myclass'); await tp.waitForTimeout(800); await tp.click('[data-hub-tab="messages"]'); await tp.waitForTimeout(1500);
  ok('Öğretmen sorumlunun mesajını gelen kutusunda görür', (await txt(tp)).includes('Lîsteya kostûman'));

  // Yönetici → tüm bölüm sorumlularına toplu mesaj; yönetici gelen kutusunda "sorumlular" süzgeci
  await put('messages/MH1', { subject: 'Civîna berpirsan', body: 'Înî saet 10', from: 'Rêveber', fromType: 'admin', senderId: 'admin', recipientGroup: 'allHeads', type: 'bulk', read: false, createdAt: new Date() });
  await goA(hp, 'announce'); await hp.waitForTimeout(400); await goA(hp, 'messages'); await hp.waitForTimeout(2000);
  ok('Sorumlu "tüm sorumlular" toplu mesajını görür', (await txt(hp)).includes('Civîna berpirsan'));
  await put('messages/MH2', { subject: 'Rapora beşê', body: 'Amade ye', from: 'Berpirsa Şanoyê', fromType: 'head', senderNo: hno, recipientId: 'admin', area: 'tiyatro', read: false, createdAt: new Date() });
  await goA(ap, 'messages'); await ap.waitForTimeout(2000);
  await btn(ap, 'Berpirsên beşan'); await ap.waitForTimeout(600);
  const at = await txt(ap);
  ok('Yönetici: "Bölüm sorumluları" süzgeci sorumlu mesajını gösterir', at.includes('Rapora beşê') && !at.includes('Ji bo provayê kostûm heye?'));
  await btn(ap, 'Berpirsê giştî'); await ap.waitForTimeout(600);
  ok('Yönetici: "Genel sorumlu" süzgeci (bölüm sorumlusunun mesajı burada yok)', !(await txt(ap)).includes('Rapora beşê'));
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
