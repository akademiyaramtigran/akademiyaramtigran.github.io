// Uçtan uca dil taraması — çalıştırma: tools/README.md → "E2E"
// Her rol (yönetici, Öğrenci İşleri, bölüm sorumlusu, öğretmen, öğrenci; Çocuk Akademisi: veli, çocuk öğretmeni) Türkçe ve
// Kürtçe modda açılır, tüm menüler dolaşılır (rapor adımları dahil). Türkçe ekranda Kürtçe harfli (ê î û), Kürtçe ekranda
// Türkçeye özgü harfli (ı ğ ö ü İ) satır kalmamalı. Tohum adları ASCII; marka/dil adları hariç tutulur.
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


const ALLOW = ['/zarok/app/', '/zarok/', 'TÎGRAN', 'Tîgran', 'Akademîya', 'Akademiya Zarokan', 'Kurdî', 'Kurmancî', 'Kirmanckî', 'Zazakî', 'Türkçe', 'Ziman', 'Kurmanji', 'Zazaki', 'English', 'Konservatuvarı'];
const clean = t => ALLOW.reduce((s, w) => s.split(w).join(''), t);
(async () => {
  await put('idx_staff/1000', { no: '1000', lvl: 'admin' }); await put('teachers/TA', { no: '1000', name: 'Admin Ana', isAdmin: true, area: 'genel' }); await signUp('1000@ogretmen.aat', 'Admin123');
  await put('idx_staff/96202611', { no: '96202611', lvl: 'head', area: 'tiyatro' }); await put('teachers/TH', { id: 'TH', no: '96202611', name: 'Head Tiyatro', isHead: true, area: 'tiyatro' }); await signUp('96202611@ogretmen.aat', 'Head1234');
  await put('idx_staff/96202612', { no: '96202612', lvl: 'head', area: 'drama' }); await put('teachers/TK', { id: 'TK', no: '96202612', name: 'Head Drama', isHead: true, area: 'drama' }); await signUp('96202612@ogretmen.aat', 'Head1234');
  await put('idx_staff/98202601', { no: '98202601', lvl: 'registrar' }); await put('teachers/TR', { id: 'TR', no: '98202601', name: 'Kayit Birim', isRegistrar: true, area: 'genel' }); await signUp('98202601@ogretmen.aat', 'Reg12345');
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' }); await put('teachers/T50', { id: 'T50', no: '50202601', name: 'Teacher One', area: 'tiyatro' }); await signUp('50202601@ogretmen.aat', 'Tea12345');
  for (const [k, no, nm, id] of [['S1', '20202601', 'Student One', 101], ['S2', '20202602', 'Student Two', 102]]) { await put('idx_students/' + no, { no }); await put('students/' + k, { no, name: nm, area: 'tiyatro', fireId: k, id }); await signUp(no + '@ogrenci.aat', 'Stu12345'); }
  await put('classes/C1', { kind: 'area', area: 'tiyatro', name: 'Class A', studentNos: ['20202601', '20202602'], teacherNos: ['50202601'], teacherNames: ['Teacher One'] });
  const TODAY = new Date().toISOString().slice(0, 10);
  await put('schedule/L1', { id: 'L1', fireId: 'L1', area: 'tiyatro', classId: 'C1', name: 'Lesson One', day: 'Dûşem', start: '10:00', end: '11:00', teacherNo: '50202601', teacherName: 'Teacher One', lessonType: 'main' });
  await put('schedule/L2', { id: 'L2', fireId: 'L2', area: 'tiyatro', classId: 'C1', name: 'Lesson Two', lessonType: 'extra', extraDates: [TODAY], start: '12:00', end: '13:00', teacherNo: '50202601', teacherName: 'Teacher One' });
  await fetch(`${FS}/attendance/L1-2026-10-19`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: { lessonId: { stringValue: 'L1' }, lessonName: { stringValue: 'Lesson One' }, date: { stringValue: '2026-10-19' }, area: { stringValue: 'tiyatro' },
    records: { mapValue: { fields: { '101': { stringValue: 'on' }, '102': { stringValue: 'off' } } } } } }) });
  // Çocuk Akademisi
  await put('idx_kidstaff/72026001', { no: '72026001' }); await put('kidTeachers/72026001', { no: '72026001', name: 'Kid Teacher', area: 'drama' }); await signUp('72026001@zmamoste.aat', 'Kid12345');
  await put('idx_guardians/92026001', { no: '92026001' }); await put('guardians/92026001', { no: '92026001', name: 'Parent One', phone: '0532' }); await signUp('92026001@veli.aat', 'Vel12345');
  await put('kids/K1', { no: '82026001', name: 'Kid One', area: 'drama', guardianNos: ['92026001'] });
  await put('kidClasses/KC1', { kind: 'area', area: 'drama', name: 'Kid Class', studentNos: ['82026001'], teacherNos: ['72026001'], teacherNames: ['Kid Teacher'] });
  await put('kidSchedule/KL1', { id: 'KL1', title: 'Drama Game', area: 'drama', classId: 'KC1', day: new Date().getDay(), start: '10:00', end: '11:00', teacherNo: '72026001' });

  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [], found = [];
  const mk = async (lang) => { const c = await b.newContext({ viewport: { width: 1280, height: 900 } }); await routes(c);
    await c.addInitScript(l => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', l); localStorage.setItem('zarok-lang', l); } catch (_) {} }, lang); return c; };
  // Dile özgü harfler + özel harf taşımayan sık kelimeler (sözcük sınırlı)
  const KU_W = /(^|[^\p{L}])(ji|bi|di|tune|heye|hemû|bike|bibe|mamoste|xwendekar|peyam|ragihandin|berpirs\p{L}*|nehat|hat kirin|tomar|amadebûn|nirxandin|zarok|dêûbav)(?=$|[^\p{L}])/iu;
  const TR_W = /(^|[^\p{L}])(için|ile|yok|var|bir|tamam|kaydet|giriş|kayıt|tarih|sonra|önce|kapat|ekle|sil|gönder|mesaj|duyuru|yoklama|izinli|hafta|toplam|tüm|hepsi|seç|genel|öğrenci|öğretmen|veli|çocuk)(?=$|[^\p{L}])/iu;
  const bad = (lang, t) => { const c = clean(t); return lang === 'tr' ? (/[êîûÊÎÛ]/.test(c) || KU_W.test(c)) : (/[ıığöüİĞÖÜ]/.test(c) || TR_W.test(c)); };
  const scan = async (p, lang, where) => { const t = await p.evaluate(() => document.body.innerText);
    t.split('\n').map(x => x.trim()).filter(Boolean).forEach(x => { if (bad(lang, x)) found.push(lang + ' · ' + where + ' · ' + x.slice(0, 140)); }); };
  const L = { tr: { tk: 'Giriş Yap', m: 'Öğretmen', s: 'Öğrenci' }, ku: { tk: 'Têkeve', m: 'Mamoste', s: 'Xwendekar' } };
  const login = async (lang, no, pw, role) => { const ctx = await mk(lang); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => d.dismiss());
    await p.goto('http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=' + L[lang].tk, { timeout: 60000 });
    await scan(p, lang, 'giriş');
    await p.getByText(L[lang][role], { exact: true }).first().click();
    await p.locator('input.inp').first().fill(no); await p.locator('input[type=password]').first().fill(pw);
    await p.getByText(L[lang].tk, { exact: true }).last().click(); await p.waitForTimeout(7000); return p; };
  const click = (p, q) => p.evaluate(q => { const e = document.querySelector(q); if (e) { e.click(); return true; } return false; }, q).then(r => p.waitForTimeout(900).then(() => r));
  const crawl = async (p, lang, who) => {
    await scan(p, lang, who + ' · ana');
    const keys = await p.evaluate(() => [...new Set([...document.querySelectorAll('.sm-it[data-key],.pano-tile[data-key],[data-tab]')].map(e => e.dataset.key || e.dataset.tab))]);
    for (const k of keys) {
      const ok = await click(p, '.sm-it[data-key="' + k + '"],.pano-tile[data-key="' + k + '"],[data-tab="' + k + '"]'); if (!ok) continue;
      await p.waitForTimeout(700); await scan(p, lang, who + ' · ' + k);
      if (k === 'reports') {
        for (const seq of [['[data-rw-acad="aat"]', '[data-rw-type="devam"]', '[data-rw-who="student"]'], ['[data-rw-view="student"]'], ['[data-rw-who="teacher"]'],
          ['[data-rw-type="eval"]', '[data-rw-who="student"]'], ['[data-rw-type="analiz"]', '[data-rw-who="student"]'], ['[data-rw-new]', '[data-rw-acad="kid"]', '[data-rw-type="devam"]'],
          ['[data-rw-type="analiz"]'], ['[data-rw-archive]']]) { for (const q of seq) await click(p, q); await scan(p, lang, who + ' · rapor ' + seq.join(' ')); }
      }
    }
  };
  for (const lang of ['tr', 'ku']) {
    for (const [no, pw, role, who] of [['1000', 'Admin123', 'm', 'yönetici'], ['98202601', 'Reg12345', 'm', 'öğrenci işleri'], ['96202611', 'Head1234', 'm', 'sorumlu'],
      ['96202612', 'Head1234', 'm', 'çocuk sorumlusu'], ['50202601', 'Tea12345', 'm', 'öğretmen'], ['20202601', 'Stu12345', 's', 'öğrenci']]) {
      const p = await login(lang, no, pw, role); await crawl(p, lang, who); await p.context().close(); }
    for (const [r, no, pw, who] of [['g', '92026001', 'Vel12345', 'veli'], ['t', '72026001', 'Kid12345', 'çocuk öğretmeni']]) {
      const ctx = await mk(lang); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => d.dismiss());
      await p.goto('http://localhost:8765/zarok/app/?emu=1'); await p.waitForSelector('#l-no', { timeout: 30000 }); await scan(p, lang, 'zarok giriş');
      await p.click('.roles button:nth-child(' + (r === 't' ? 2 : 1) + ')'); await p.fill('#l-no', no); await p.fill('#l-pw', pw); await p.click('.login .btn');
      await p.waitForSelector('.top', { timeout: 30000 }); await p.waitForTimeout(2500);
      await crawl(p, lang, 'zarok ' + who); await ctx.close(); }
  }
  const uniq = [...new Set(found)];
  console.log(uniq.join('\n'));
  console.log((uniq.length ? '❌ ' : '✅ ') + 'Dil taraması: ' + uniq.length + ' karışık satır' + (errs.length ? ' · sayfa hatası: ' + errs.slice(0, 3).join(' | ') : ''));
  await b.close(); process.exit(uniq.length || errs.length ? 1 : 0);
})().catch(e => { console.error('HATA', e); process.exit(1); });
