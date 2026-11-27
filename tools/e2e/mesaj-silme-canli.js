// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Mesaj alma/silme — öğrenci kendi mesajını siler (anında, kalıcı); gönderen sunucudan silince öğrencinin açık listesinden canlı kalkar;
//      öğretmen ve sorumlunun gelen kutusu başkalarının çok sayıdaki mesajından (son 200 sınırı) etkilenmez
// (eski açıklama) Ana akademi sınıfları — alan sınıfı + ders programı, genel sınıf (tüm alanlardan),
//      atölye (aç → öğrenci/öğretmen ata → yoklama → kapat), öğrenci/öğretmen görünürlüğü, rapor filtresi
const { chromium } = require('playwright-core');
const fs = require('fs');
const FBV = require('firebase/package.json').version;
const P = 'aram2026-a9fd7';
const NM = require('path').dirname(require.resolve('firebase/package.json')) + '/../';
const FS = `http://127.0.0.1:8080/v1/projects/${P}/databases/(default)/documents`;
const H = { 'Content-Type': 'application/json', 'Authorization': 'Bearer owner' };
const val = v => v instanceof Date ? { timestampValue: v.toISOString() } : typeof v === 'number' ? { integerValue: String(v) } : Array.isArray(v) ? { arrayValue: { values: v.map(val) } } : typeof v === 'boolean' ? { booleanValue: v } : { stringValue: String(v) };
const put = (path, obj) => fetch(`${FS}/${path}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, val(v)])) }) }).then(r => { if (!r.ok) throw new Error('seed ' + path + ' ' + r.status); });
const enc = v => v === null ? { nullValue: null } : typeof v === 'number' ? { integerValue: String(v) } : typeof v === 'boolean' ? { booleanValue: v } : v instanceof Date ? { timestampValue: v.toISOString() } : { stringValue: String(v) };
const putO = (path, o) => fetch(`${FS}/${path}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, enc(v)])) }) }).then(r => { if (!r.ok) throw new Error('seed ' + path + ' ' + r.status); });
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
const goA = (pg, k) => pg.evaluate(k => document.querySelector('.pano-tile[data-key="' + k + '"],.sm-it[data-key="' + k + '"]').click(), k);
(async () => {
  const D = (n) => new Date(Date.now() - n * 60000);
  await put('idx_staff/96000001', { no: '96000001', lvl: 'head', area: 'tiyatro' }); await put('teachers/H1', { id: 'H1', no: '96000001', name: 'Berpirsa Şanoyê', area: 'tiyatro', isHead: true }); await signUp('96000001@ogretmen.aat', 'Head1234');
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' }); await put('teachers/T1', { id: 'T1', no: '50202601', name: 'Mamoste Şano', area: 'tiyatro' }); await signUp('50202601@ogretmen.aat', 'Tea12345');
  await put('idx_students/20202601', { no: '20202601', area: 'tiyatro' }); await put('students/S1', { no: '20202601', name: 'Rojîn Aram', area: 'tiyatro', fireId: 'S1', id: 101 }); await signUp('20202601@ogrenci.aat', 'Stu12345');
  await put('idx_students/20202602', { no: '20202602', area: 'tiyatro' }); await put('students/S2', { no: '20202602', name: 'Baran Şêx', area: 'tiyatro', fireId: 'S2', id: 102 });
  await put('classes/C1', { kind: 'area', name: '1. Sînif', area: 'tiyatro', studentNos: ['20202601', '20202602'], teacherNos: ['50202601'] });
  // Öğrenciye: iki özel mesaj + bir toplu mesaj
  await put('messages/M1', { subject: 'Mesaj Bir', body: 'ilk', from: 'Mamoste Şano', fromType: 'teacher', recipientNo: '20202601', recipientId: 's_101', time: '2026-01-01 10:00', createdAt: D(30) });
  await put('messages/M2', { subject: 'Mesaj Iki', body: 'ikinci', from: 'Mamoste Şano', fromType: 'teacher', recipientNo: '20202601', recipientId: 's_101', time: '2026-01-01 10:01', createdAt: D(29) });
  // Öğretmen ve sorumluya: ESKİ iki mesaj (üstüne 230 başkasına giden daha yeni mesaj)
  await put('messages/MT', { subject: 'Ogretmene eski mesaj', body: 'x', from: 'Rojîn Aram', fromType: 'student', fromNo: '20202601', toRole: 'teacher', toTeacherNo: '50202601', recipientId: 't_T1', time: '2026-01-01 09:00', createdAt: D(5000) });
  await put('messages/MH', { subject: 'Sorumluya eski mesaj', body: 'x', from: 'Rojîn Aram', fromType: 'student', fromNo: '20202601', toRole: 'head', toArea: 'tiyatro', time: '2026-01-01 09:00', createdAt: D(5001) });
  for (let i = 0; i < 230; i++) await put('messages/Z' + i, { subject: 'Baska ' + i, body: 'x', from: 'Baska', fromType: 'student', fromNo: '20202602', toRole: 'teacher', toTeacherNo: '99999999', recipientId: 't_OTHER', time: '2026-01-02 10:00', createdAt: D(100 + i) });
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined }); const errs = [];
  const mk = async () => { const c = await b.newContext({ viewport: { width: 430, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} }); return c; };
  const login = async (role, no, pw) => {
    const p = await (await mk()).newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/app/?emu=1&dvcut=2000-01-01'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
    await p.getByText(role, { exact: true }).first().click();
    await p.locator('input.inp').first().fill(no); await p.locator('input[type=password]').first().fill(pw);
    await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(7000); return p; };
  const txt = p => p.evaluate(() => document.body.innerText);
  // 1) Öğrenci: iki mesaj görünür, birini siler → anında kalkar, kalıcıdır
  const sp = await login('Xwendekar', '20202601', 'Stu12345');
  await goA(sp, 'messages'); await sp.waitForTimeout(2500);
  let t = await txt(sp);
  ok('Öğrenci iki mesajı da görür', t.includes('Mesaj Bir') && t.includes('Mesaj Iki'));
  await sp.evaluate(() => { const r = [...document.querySelectorAll('div')].filter(d => (d.getAttribute('style') || '').includes('cursor') && d.textContent.includes('Mesaj Bir') && !d.textContent.includes('Mesaj Iki'))[0]; r.click(); }); await sp.waitForTimeout(500);
  ok('Açılan mesajda "Sil" düğmesi var', (await sp.locator('[data-msg-del="M1"]').count()) === 1);
  const t0 = Date.now(); await sp.evaluate(() => document.querySelector('[data-msg-del="M1"]').click()); await sp.waitForTimeout(250);
  t = await txt(sp);
  ok('Silinen mesaj 0,25 sn içinde listeden kalktı (anında)', !t.includes('Mesaj Bir') && t.includes('Mesaj Iki'), (Date.now() - t0) + ' ms | ' + t.slice(0, 400).replace(/\n/g, ' / '));
  await sp.waitForTimeout(2000);
  const uh = await fetch(`${FS}/userHidden?pageSize=20`, { headers: H }).then(r => r.json());
  ok('Silme kalıcı: userHidden kaydında', JSON.stringify(uh).includes('M1'), JSON.stringify(uh).slice(160, 600));
  // 2) Gönderen mesajı sunucudan silince, öğrencinin AÇIK listesinden canlı kalkar
  await fetch(`${FS}/messages/M2`, { method: 'DELETE', headers: H }); await sp.waitForTimeout(2500);
  t = await txt(sp);
  ok('Gönderen silince öğrencinin açık listesinden canlı kalkar (yenileme yok)', !t.includes('Mesaj Iki'));
  // 3) Öğretmen: eski mesajı (200 sınırının dışında) yine görür
  const tp = await login('Mamoste', '50202601', 'Tea12345');
  await goA(tp, 'myclass'); await tp.waitForTimeout(800);
  await tp.evaluate(() => document.querySelector('[data-hub-tab="messages"]').click()); await tp.waitForTimeout(2500);
  t = await txt(tp);
  ok('Öğretmen: 230 başka mesaja rağmen eski mesajını görür (son 200 sınırı yok)', t.includes('Ogretmene eski mesaj'));
  // 4) Sorumlu: aynı
  const hp = await login('Mamoste', '96000001', 'Head1234');
  await goA(hp, 'messages'); await hp.waitForTimeout(2500);
  t = await txt(hp);
  ok('Sorumlu: 230 başka mesaja rağmen eski mesajını görür', t.includes('Sorumluya eski mesaj'));
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
