// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Öğrenci devam ekranı — yoklama kaydedilince sunucu her öğrenciye KENDİ kaydını yazar; öğrenci yalnız kendini görür,
//      "gelmedi" satırına itiraz eder (öğretmen + sorumlu + yönetim mesaj alır); düzeltme öğrenci ekranına yansır
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
  const day = new Date(Date.now() - 86400000); const DATE = day.getFullYear() + '-' + String(day.getMonth() + 1).padStart(2, '0') + '-' + String(day.getDate()).padStart(2, '0');
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' }); await put('teachers/T1', { id: 'T1', no: '50202601', name: 'Mamoste Şano', area: 'tiyatro' });
  await put('idx_staff/96000001', { no: '96000001', lvl: 'head', area: 'tiyatro' });
  for (const [no, k, nm, id] of [['20202601', 'S1', 'Rojîn Aram', 101], ['20202602', 'S2', 'Baran Şêx', 102]]) {
    await put('idx_students/' + no, { no }); await put('students/' + k, { no, name: nm, area: 'tiyatro', fireId: k, id }); await signUp(no + '@ogrenci.aat', 'Stu12345');
  }
  await put('schedule/L1', { id: 11, fireId: 'L1', name: 'Şano 1', area: 'tiyatro', lessonType: 'main', day: 'Çarşem', start: '09:00', end: '10:00', teacherNo: '50202601' });
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const sv = d => Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, v.stringValue !== undefined ? v.stringValue : v.booleanValue !== undefined ? v.booleanValue : v.integerValue])); 
  const rows = async () => (await list('studentAtt')).map(d => ({ id: d.name.split('/').pop(), ...sv(d) }));
  const waitFor = async (f, ms) => { const t0 = Date.now(); for (;;) { const r = await f(); if (r) return r; if (Date.now() - t0 > (ms || 40000)) return null; await new Promise(r => setTimeout(r, 1000)); } };
  // Öğretmen yoklamayı kaydeder (ders belgesi: Rojîn yok, Baran var)
  // records bir harita: put() düz alanlar için; haritayı elle yaz
  await fetch(`${FS}/attendance/11-${DATE}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: { lessonId: { stringValue: '11' }, lessonFire: { stringValue: 'L1' }, lessonName: { stringValue: 'Şano 1' }, area: { stringValue: 'tiyatro' }, date: { stringValue: DATE }, takenBy: { stringValue: 'Mamoste Şano' },
    records: { mapValue: { fields: { 101: { stringValue: 'off' }, 102: { stringValue: 'on' } } } } } }) });
  const r1 = await waitFor(async () => { const r = await rows(); return r.length >= 2 ? r : null; });
  const id1 = '11-' + DATE + '-20202601', id2 = '11-' + DATE + '-20202602';
  ok('Sunucu her öğrenciye KENDİ devam kaydını yazdı (Rojîn yok, Baran var)', !!r1 && r1.find(r => r.id === id1)?.status === 'off' && r1.find(r => r.id === id2)?.status === 'on', JSON.stringify(r1));
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const mk = async (w) => { const c = await b.newContext({ viewport: { width: w || 430, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} }); return c; };
  const login = async (ctx, no, pw) => {
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
    await p.getByText('Xwendekar', { exact: true }).first().click();
    await p.locator('input.inp').first().fill(no); await p.locator('input[type=password]').first().fill(pw);
    await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(7000); return p;
  };
  const goA = (pg, k) => pg.evaluate(k => document.querySelector('.pano-tile[data-key="' + k + '"],.sm-it[data-key="' + k + '"]').click(), k);
  const sp = await login(await mk(430), '20202601', 'Stu12345');
  await goA(sp, 'attend'); await sp.waitForSelector('[data-stu-att-view]', { timeout: 15000 }); await sp.waitForTimeout(2500);
  const ids = await sp.evaluate(() => [...document.querySelectorAll('[data-stu-att-row]')].map(e => e.dataset.stuAttRow + ':' + e.dataset.st));
  ok('Öğrenci devam ekranı: yalnız KENDİ kaydı (yok), Baran\'ın kaydı görünmüyor', ids.join() === id1 + ':off', ids.join());
  ok('Devam ekranı: düzenleme düğmesi yok, yalnız "itiraz" var', (await sp.locator('[data-att-obj]').count()) === 1 && (await sp.locator('select,input[type=checkbox]').count()) === 0);
  await sp.evaluate(() => document.querySelector('[data-att-obj]').click()); await sp.waitForTimeout(400);
  await sp.locator('[data-att-note]').fill('Ez di dersê de bûm');
  await sp.evaluate(() => document.querySelector('[data-att-send]').click());
  const objShown = await sp.waitForSelector('[data-att-objected]', { timeout: 10000 }).then(() => true, () => false);
  ok('İtiraz gönderildi: satırda "îtîraz hate şandin" + not', objShown);
  const objs = await list('attObjections');
  ok('İtiraz kaydı oluştu (Rojîn, yok, not)', objs.length === 1 && sv(objs[0]).studentNo === '20202601' && sv(objs[0]).note === 'Ez di dersê de bûm', JSON.stringify(objs.map(sv)));
  const msgs = await waitFor(async () => { const m = (await list('messages')).map(sv).filter(x => x.objection === true); return m.length >= 3 ? m : null; });
  const roles = (msgs || []).map(m => m.toRole).sort().join();
  ok('İtiraz üç yere mesaj düşürdü: öğretmen + bölüm sorumlusu + yönetim', roles === 'admin,head,teacher', roles);
  ok('Öğretmen mesajı doğru öğretmene (50202601), sorumlu mesajı tiyatro bölümüne', (msgs || []).some(m => m.toRole === 'teacher' && m.toTeacherNo === '50202601') && (msgs || []).some(m => m.toRole === 'head' && m.toArea === 'tiyatro'));
  // Öğretmen düzeltir (yoklama belgesi güncellenir) → öğrenci ekranı güncellenir
  await fetch(`${FS}/attendance/11-${DATE}?updateMask.fieldPaths=records`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: { records: { mapValue: { fields: { 101: { stringValue: 'on' }, 102: { stringValue: 'on' } } } } } }) });
  const fixed = await waitFor(async () => (await rows()).find(r => r.id === id1)?.status === 'on');
  ok('Düzeltme sunucuda öğrenci kaydına işlendi (yok → katıldı)', !!fixed);
  const upd = await sp.waitForFunction(id => { const e = document.querySelector('[data-stu-att-row="' + id + '"]'); return e && e.dataset.st === 'on'; }, id1, { timeout: 15000 }).then(() => true, () => false);
  ok('Öğrenci ekranı düzeltmeyi canlı gösterdi (artık itiraz düğmesi yok)', upd && (await sp.locator('[data-att-obj]').count()) === 0);
  await sp.context().close();
  const sp2 = await login(await mk(430), '20202602', 'Stu12345');
  await goA(sp2, 'attend'); await sp2.waitForSelector('[data-stu-att-view]', { timeout: 15000 }); await sp2.waitForTimeout(2500);
  const ids2 = await sp2.evaluate(() => [...document.querySelectorAll('[data-stu-att-row]')].map(e => e.dataset.stuAttRow));
  ok('Baran yalnız kendi kaydını görür', ids2.join() === id2, ids2.join());
  await sp2.context().close();
  // "Ders yapılmadı" günü öğrenci kaydını kaldırır
  await fetch(`${FS}/attendance/11-${DATE}?updateMask.fieldPaths=teacherAbsent`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: { teacherAbsent: { booleanValue: true } } }) });
  const gone = await waitFor(async () => (await rows()).filter(r => r.lessonId === '11' && r.date === DATE).length === 0);
  ok('"Ders yapılmadı" işaretlenince öğrenci kayıtları kalkar', !!gone);
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
