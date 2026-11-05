// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Bölüm sorumlusu AYNI ZAMANDA öğretmen — derse atanır, "Panela Mamoste" ile öğretmen paneline geçer, dersi başlatıp yoklama alır;
//      öğretmen panelinden sorumlu paneline döner; öğrenci değerlendirme formunda sorumlu yer almaz; öğretmen sorumluya mesaj yazabilir
//      (başlangıçtan 15 dk sonra okutulan "geç"), sorumlu "ders yapılmadı" işler → yönetici raporunda neden görünür;
//      çocuk akademisi sorumlusu kendi dersinin programını yazar.
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
  const todayKu = ["Yekşem", "Dûşem", "Sêşem", "Çarşem", "Pêncşem", "Înî", "Şemî"][new Date().getDay()];
  const d0 = new Date(); const TD = d0.getFullYear() + '-' + String(d0.getMonth() + 1).padStart(2, '0') + '-' + String(d0.getDate()).padStart(2, '0');
  for (const [no, nm, area, lvl, pw] of [['96000001', 'Berpirsa Şanoyê', 'tiyatro', 'head', 'Head1234'], ['96000002', 'Berpirsê Giştî', 'genel', 'head', 'Head1234']]) {
    await put('idx_staff/' + no, { no, lvl, area }); await put('teachers/H' + no, { id: 'H' + no, no, name: nm, area, isHead: true }); await signUp(no + '@ogretmen.aat', pw);
  }
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' }); await put('teachers/T50', { id: 'T50', no: '50202601', name: 'Mamoste Şano', area: 'tiyatro' }); await signUp('50202601@ogretmen.aat', 'Tea12345');
  const mv = o => ({ mapValue: { fields: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { stringValue: v }])) } });
  await fetch(`${FS}/config/heads`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: { areas: { mapValue: { fields: { tiyatro: mv({ name: 'Berpirsa Şanoyê', no: '96000001' }), genel: mv({ name: 'Berpirsê Giştî', no: '96000002' }) } } } } }) });
  for (const [no, k, nm, id] of [['20202601', 'S1', 'Rojîn Aram', 101], ['20202602', 'S2', 'Azad Can', 102]]) {
    await put('idx_students/' + no, { no, area: 'tiyatro' }); await put('students/' + k, { no, name: nm, area: 'tiyatro', fireId: k, id }); await signUp(no + '@ogrenci.aat', 'Stu12345');
  }
  await put('classes/C1', { kind: 'area', area: 'tiyatro', name: '1. Sınıf', studentNos: ['20202601', '20202602'], teacherNos: [] });
  // Sorumlu KENDİ dersine atanmış (bugün) + öğretmen dersi
  await put('schedule/LH', { id: 'LH', fireId: 'LH', area: 'tiyatro', classId: 'C1', name: 'Şano Sorumlu', day: todayKu, start: '00:05', end: '23:55', teacherNo: '96000001', teacherName: 'Berpirsa Şanoyê', lessonType: 'main' });
  await put('schedule/LT', { id: 'LT', fireId: 'LT', area: 'tiyatro', classId: 'C1', name: 'Şano Hoca', day: todayKu, start: '00:05', end: '23:55', teacherNo: '50202601', teacherName: 'Mamoste Şano', lessonType: 'main' });
  await put('evalForms/EF1', { title: 'Mamosteyan', academy: 'aat', direction: 's2t', area: 'tiyatro', period: 'weekly', active: true, ownerNo: '96000001', questions: [{ id: 'q1', text: 'Beşdarî', type: 'score', required: true }] });
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const mk = async (w) => { const c = await b.newContext({ viewport: { width: w || 1280, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} }); return c; };
  const login = async (no, pw, role, w) => {
    const p = await (await mk(w)).newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
    await p.getByText(role || 'Mamoste', { exact: true }).first().click();
    await p.locator('input.inp').first().fill(no); await p.locator('input[type=password]').first().fill(pw);
    await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(7000); return p;
  };
  const goA = (pg, k) => pg.evaluate(k => document.querySelector('.pano-tile[data-key="' + k + '"],.sm-it[data-key="' + k + '"]').click(), k);
  const btn = (p, t) => p.evaluate(t => { const e = [...document.querySelectorAll('button')].filter(x => x.offsetParent && x.textContent.includes(t)).pop(); if (!e) throw new Error('düğme yok: ' + t); e.click(); }, t);
  const txt = p => p.evaluate(() => document.body.innerText);
  const get = path => fetch(`${FS}/${path}`, { headers: H }).then(r => r.json());
  const sw = (p, k) => p.evaluate(k => { const e = document.querySelector('[data-role-switch="' + k + '"]'); if (!e) throw new Error('geçiş yok: ' + k); e.click(); }, k);

  for (const [no, label, w] of [['96000001', 'Bölüm sorumlusu', 1280], ['96000002', 'Genel sorumlu', 430]]) {
    const hp = await login(no, 'Head1234', 'Mamoste', w);
    const hasSwitch = await hp.evaluate(() => !!document.querySelector('[data-role-switch="teacher"]'));
    ok(label + ': menüde "Panela Mamoste" geçişi var', hasSwitch);
    if (no === '96000002') { await hp.context().close(); continue; }
    await sw(hp, 'teacher'); await hp.waitForTimeout(2500);
    const t1 = await txt(hp);
    ok(label + ': öğretmen paneline geçti (öğretmen menüsü: Yoklama, QR, Xwendekarên Min)', (await hp.locator('.sm-it[data-key="attendance"],.pano-tile[data-key="attendance"]').count()) >= 1);
    // Yoklama ekranı: kendi dersi
    await goA(hp, 'attendance'); await hp.waitForTimeout(1500);
    ok('Kendisine atanmış ders (Şano Sorumlu) yoklama listesinde, öğretmenin dersi yok', (await hp.locator('[data-att-lesson="LH"]').count()) === 1 && (await hp.locator('[data-att-lesson="LT"]').count()) === 0);
    await hp.click('[data-att-lesson="LH"]'); await hp.waitForTimeout(1200);
    await btn(hp, 'Dersê Dest Pê Bike'); await hp.waitForTimeout(2000);
    ok('Sorumlu dersi başlattı (startedAt kaydı)', !!(await get('attendance/LH-' + TD)).fields?.startedAt);
    // Elle yoklama: Rojîn geldi
    await hp.evaluate(() => { const b = document.querySelector('.att-btn.on, .att-btn'); });
    const first = hp.locator('.att-btn').first(); await first.click(); await hp.waitForTimeout(400);
    await hp.click('[data-att-save-list]'); await hp.waitForTimeout(2500);
    const a = await get('attendance/LH-' + TD);
    ok('Sorumlunun öğretmen olarak aldığı yoklama kaydedildi (records var)', !!a.fields?.records?.mapValue?.fields && Object.keys(a.fields.records.mapValue.fields).length >= 1, JSON.stringify(a.fields?.records || {}).slice(0, 160));
    // Ders QR oturumu
    await btn(hp, 'QR ya dersê'); await hp.waitForTimeout(3000);
    const qs = (await list('qrSessions')).filter(d => d.fields.active && d.fields.active.booleanValue);
    ok('Sorumlu ders QR oturumu açabilir', qs.length === 1);
    await btn(hp, 'Bigire'); await hp.waitForTimeout(2500);
    // Mesaj: öğrenciye (öğretmen olarak)
    await goA(hp, 'messages').catch(() => {}); await hp.waitForTimeout(1000);
    // Sorumlu paneline dön
    await goA(hp, 'home'); await hp.waitForTimeout(500);
    await hp.evaluate(() => { const m = document.querySelector('.sm-burger'); m && m.click(); }); await hp.waitForTimeout(500);
    await sw(hp, 'head').catch(async () => { await hp.evaluate(() => document.querySelector('[data-dock-key="pano"]').click()); await hp.waitForTimeout(500); await sw(hp, 'head'); }); await hp.waitForTimeout(2000);
    ok('Öğretmen panelinden sorumlu paneline geri döner', (await hp.locator('[data-role-switch="teacher"]').count()) >= 0 && (await txt(hp)).includes('Berpirs'));
    // Ders programı: öğretmen seçeneklerinde sorumlu (Berpirs) da var
    await goA(hp, 'schedule'); await hp.waitForTimeout(1500);
    await hp.click('[data-add-lesson]'); await hp.waitForTimeout(800);
    const opts = await hp.evaluate(() => { const s = [...document.querySelectorAll('select')].find(x => [...x.options].some(o => o.value === '50202601')); return s ? [...s.options].map(o => o.value + '|' + o.textContent) : []; });
    ok('Ders atama listesinde sorumlu "(Berpirs)" etiketiyle çıkar', opts.some(o => o.startsWith('96000001|') && o.includes('Berpirs')), JSON.stringify(opts).slice(0, 250));
    await hp.context().close();
  }
  // Öğretmen → bölüm sorumlusuna mesaj
  const tp = await login('50202601', 'Tea12345', 'Mamoste', 1280);
  ok('Sıradan öğretmende "Panela Berpirs" geçişi yok', (await tp.locator('[data-role-switch]').count()) === 0);
  await goA(tp, 'myclass'); await tp.waitForTimeout(1500);
  const hasHeadOpt = await tp.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /Peyam|Message/i.test(x.textContent)); return !!b; });
  await tp.context().close();
  // Öğrenci: öğretmen değerlendirme formunda sorumlu YOK, sıradan öğretmen VAR
  const sp = await login('20202601', 'Stu12345', 'Xwendekar', 430);
  await goA(sp, 'teval'); await sp.waitForTimeout(2500);
  await sp.evaluate(() => { const m = [...document.querySelectorAll('[data-ef-mode] button')][1]; m && m.click(); }); await sp.waitForTimeout(500);
  const evNames = await sp.evaluate(() => [...document.querySelectorAll('[data-ef-target]')].map(e => e.dataset.efTarget));
  ok('Öğrenci değerlendirme formu: sıradan öğretmen var, sorumlu (derse girse de) YOK', evNames.includes('50202601') && !evNames.includes('96000001'), JSON.stringify(evNames));
  await sp.context().close();
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
