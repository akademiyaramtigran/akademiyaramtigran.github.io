// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Değerlendirme formları — sorumlu form hazırlar (1–10 + yazılı, kim kimi, sıklık) ve yayınlar; öğretmen öğrenciyi, öğrenci öğretmeni
//      (isimsiz), veli çocuk akademisi öğretmenini form ile değerlendirir; sonuçlar soru/kişi bazında; 5/10 altı uyarıya düşer
const { chromium } = require('playwright-core');
const fs = require('fs');
const FBV = require('firebase/package.json').version;
const P = 'aram2026-a9fd7';
const NM = require('path').dirname(require.resolve('firebase/package.json')) + '/../';
const FS = `http://127.0.0.1:8080/v1/projects/${P}/databases/(default)/documents`;
const H = { 'Content-Type': 'application/json', 'Authorization': 'Bearer owner' };
const val = v => v instanceof Date ? { timestampValue: v.toISOString() } : typeof v === 'number' ? { integerValue: String(v) } : Array.isArray(v) ? { arrayValue: { values: v.map(val) } } : typeof v === 'boolean' ? { booleanValue: v } : { stringValue: String(v) };
const put = (path, obj) => fetch(`${FS}/${path}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, val(v)])) }) }).then(r => { if (!r.ok) throw new Error('seed ' + path + ' ' + r.status); });
const enc = v => v === null ? { nullValue: null } : typeof v === 'number' ? { integerValue: String(v) } : typeof v === 'boolean' ? { booleanValue: v } : Array.isArray(v) ? { arrayValue: { values: v.map(enc) } } : typeof v === 'object' ? { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)])) } } : { stringValue: String(v) };
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
const clickText = (p, text, top) => p.evaluate(([t, top]) => {
  if (top) { const mv = [...document.querySelectorAll('.sm-it,.pano-tile')].filter(x => x.getClientRects().length); const m = mv.find(x => x.textContent.trim() === t) || mv.find(x => x.textContent.includes(t)); if (m) { m.click(); return; } }
  const ok = x => { const r = x.getBoundingClientRect(); return r.width > 0 && (!top || (r.top > 60 && r.top < 260)); };
  // Önce ekrandaki, yoksa yatay şeritte kaymış olanı al (kapalı yan menüdeki kopyalar -left ile elenir)
  const b = [...document.querySelectorAll('button')].filter(x => x.textContent.includes(t) && x.offsetParent !== null && ok(x))
    .sort((a, c) => (a.getBoundingClientRect().left < -200) - (c.getBoundingClientRect().left < -200))[0];
  if (!b) throw new Error('düğme yok: ' + t); b.scrollIntoView({ inline: 'center', block: 'nearest' }); b.click();
}, [text, top]);

const goZ = (pg, k) => pg.evaluate(k => { const vis = e => e && e.getClientRects().length; const f = () => [...document.querySelectorAll('[data-tab="' + k + '"]')].find(vis);
  let el = f(); if (!el) { const pb = document.querySelector('.pano-btn'); if (pb) pb.click(); el = f(); } el.click(); }, k);
(async () => {
  const goA = (pg, k) => pg.evaluate(k => document.querySelector('.pano-tile[data-key="' + k + '"],.sm-it[data-key="' + k + '"]').click(), k);
  const goZ = (pg, k) => pg.evaluate(k => { const vis = e => e && e.getClientRects().length; const f = () => [...document.querySelectorAll('[data-tab="' + k + '"]')].find(vis);
    let el = f(); if (!el) { const pb = document.querySelector('.pano-btn'); if (pb) pb.click(); el = f(); } el.click(); }, k);
  await put('idx_staff/96202602', { no: '96202602', lvl: 'head', area: 'drama' }); await put('teachers/TH2', { id: 'TH2', no: '96202602', name: 'Berpirsa Dramayê', isHead: true, area: 'drama' }); await signUp('96202602@ogretmen.aat', 'Head1234');
  for (const [no, nm] of [['72026001', 'Mamoste Hêvî'], ['72026002', 'Mamoste Din']]) { await put('idx_kidstaff/' + no, { no }); await put('kidTeachers/' + no, { no, name: nm, area: 'drama' }); await signUp(no + '@zmamoste.aat', 'Kid12345'); }
  for (const [no, nm] of [['92026001', 'Veli Aram']]) { await put('idx_guardians/' + no, { no }); await put('guardians/' + no, { no, name: nm, phone: '0532' }); await signUp(no + '@veli.aat', 'Vel12345'); }
  await put('kids/K1', { no: '82026001', name: 'Rojîn Zarok', area: 'drama', guardianNos: ['92026001'] });
  await put('kids/K2', { no: '82026002', name: 'Baran Zarok', area: 'drama', guardianNos: ['92026001'] });
  await put('kidClasses/KC1', { kind: 'area', area: 'drama', name: '1. Sınıf', studentNos: ['82026001', '82026002'], teacherNos: ['72026001', '72026002'], teacherNames: ['Mamoste Hêvî', 'Mamoste Din'] });
  const mkForm = (id, o) => putO('evalForms/' + id, { academy: 'kid', area: 'drama', period: 'once', active: true, ownerNo: '96202602', ownerName: 'Berpirsa Dramayê', createdAtIso: new Date().toISOString(), questions: [{ id: 'q1', type: 'score', text: 'Beşdarî', required: false }], ...o });
  await mkForm('KF1', { title: 'Forma zarokan giştî', direction: 't2k' });
  await mkForm('KF2', { title: 'Forma Hêvî ya taybet', direction: 't2k', teacherNo: '72026001', teacherName: 'Mamoste Hêvî' });
  await mkForm('KF3', { title: 'Forma dêûbav bo Hêvî', direction: 'g2t', teacherNo: '72026001', teacherName: 'Mamoste Hêvî' });
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const mk = async (w) => { const c = await b.newContext({ viewport: { width: w || 420, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); localStorage.setItem('zarok-lang', 'ku'); } catch (_) {} }); return c; };
  const sv = d => Object.fromEntries(Object.entries(d.fields).map(([k, v]) => [k, v.stringValue !== undefined ? v.stringValue : v.booleanValue !== undefined ? v.booleanValue : v.integerValue !== undefined ? v.integerValue : v.doubleValue]));
  const col = async c => ((await fetch(`${FS}/${c}?pageSize=100`, { headers: H }).then(r => r.json())).documents || []).map(d => ({ id: d.name.split('/').pop(), ...sv(d) }));
  const txt = p => p.evaluate(() => document.body.innerText);
  const zl = async (role, no, pw) => { const q = await (await mk()).newPage(); q.on('pageerror', e => errs.push(no + ': ' + e.message)); q.on('dialog', d => d.accept());
    await q.goto('http://localhost:8765/zarok/app/?emu=1'); await q.waitForSelector('#l-no', { timeout: 30000 }); await q.click('.roles button:nth-child(' + (role === 't' ? 2 : 1) + ')'); await q.fill('#l-no', no); await q.fill('#l-pw', pw); await q.click('.login .btn');
    await q.waitForSelector('.top', { timeout: 30000 }); await q.waitForTimeout(2500); return q; };
  // 1) Çocuk sorumlusu: form düzenlemede öğretmen seçeneği
  const hp = await (await mk()).newPage(); hp.on('pageerror', e => errs.push('H: ' + e.message)); hp.on('dialog', d => d.accept());
  await hp.goto('http://localhost:8765/app/?emu=1'); await hp.waitForSelector('text=Têkeve', { timeout: 60000 }); await hp.getByText('Mamoste', { exact: true }).first().click();
  await hp.locator('input.inp').first().fill('96202602'); await hp.locator('input[type=password]').first().fill('Head1234'); await hp.getByText('Têkeve', { exact: true }).last().click(); await hp.waitForTimeout(7000);
  await goA(hp, 'evalforms'); await hp.waitForTimeout(1200); await hp.evaluate(() => document.querySelector('[data-new-form]').click()); await hp.waitForTimeout(800);
  const o = await hp.evaluate(() => { const s = document.querySelector('[data-ef-teacher]'); return s ? [...s.options].map(x => x.value) : null; });
  ok('Çocuk Akademisi form düzenlemede öğretmen seçeneği: hepsi + bölümün öğretmenleri', o && o[0] === '' && o.includes('72026001') && o.includes('72026002'), JSON.stringify(o));
  // 2) Öğretmen Hêvî: kendi formu + genel; Din: yalnız genel
  const t1 = await zl('t', '72026001', 'Kid12345'); await goZ(t1, 'seval'); await t1.waitForTimeout(1200);
  let t = await txt(t1);
  ok('Atanan çocuk öğretmeni kendi formunu ve genel formu görür', t.includes('Forma Hêvî ya taybet') && t.includes('Forma zarokan giştî'));
  const t2 = await zl('t', '72026002', 'Kid12345'); await goZ(t2, 'seval'); await t2.waitForTimeout(1200);
  t = await txt(t2);
  ok('Başka çocuk öğretmeni yalnız genel formu görür', t.includes('Forma zarokan giştî') && !t.includes('Forma Hêvî ya taybet'));
  // 3) Boş bırak + özet + düzenleme (Hêvî, genel form)
  await t1.evaluate(() => { const b = [...document.querySelectorAll('[data-ef-pick]')].find(x => x.textContent.includes('Forma zarokan giştî')); b && b.click(); }); await t1.waitForTimeout(600);
  ok('Soru soru görünümde her çocuk için "Boş bırak" düğmesi', (await t1.locator('[data-ef-skip]').count()) === 2);
  await t1.evaluate(() => document.querySelector('[data-ef-skip="82026002"]').click()); await t1.waitForTimeout(300);
  await t1.evaluate(() => document.querySelector('[data-ef-score="q1_82026001_7"]').click()); await t1.waitForTimeout(300);
  await t1.evaluate(() => document.querySelector('[data-ef-gsave]').click()); await t1.waitForTimeout(3000);
  const rs = (await col('evalResponses')).filter(r => r.formId === 'KF1');
  const r1 = rs.find(r => r.targetNo === '82026001'), r2 = rs.find(r => r.targetNo === '82026002');
  ok('Puanlı çocuk kaydedildi, boş bırakılan "skipped" (puansız)', !!r1 && r1.score10 == 7 && !!r2 && r2.skipped === true && r2.score10 === undefined, JSON.stringify(rs.map(r => [r.targetNo, r.score10, r.skipped])));
  ok('Kaydedince özet (kontrol) ekranı: 1 tamam + 1 boş', (await t1.locator('[data-ef-summary]').count()) === 1 && (await t1.evaluate(() => [...document.querySelectorAll('[data-ef-sum-st]')].map(e => e.dataset.efSumSt).sort().join())) === 'done,skip');
  await t1.evaluate(() => document.querySelector('[data-ef-sum-edit="82026001"]').click()); await t1.waitForTimeout(700);
  await t1.evaluate(() => document.querySelector('[data-ef-score="q1_9"]').click()); await t1.waitForTimeout(300);
  await t1.evaluate(() => document.querySelector('[data-ef-save]').click()); await t1.waitForTimeout(2500);
  ok('Özetten düzenleyip puanı güncelledi (7 → 9)', (await col('evalResponses')).find(r => r.formId === 'KF1' && r.targetNo === '82026001').score10 == 9);
  // 4) Veli: öğretmene atanan formda yalnız o öğretmen
  const g = await zl('g', '92026001', 'Vel12345'); await goZ(g, 'teval'); await g.waitForTimeout(1200);
  await g.evaluate(() => { const b = [...document.querySelectorAll('[data-ef-mode] button')][1]; b && b.click(); }); await g.waitForTimeout(500);
  const tg = await g.evaluate(() => [...document.querySelectorAll('[data-ef-target]')].map(e => e.dataset.efTarget));
  ok('Veli: öğretmene atanan formda yalnız o öğretmen listelenir', tg.join() === '72026001', tg.join());
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
