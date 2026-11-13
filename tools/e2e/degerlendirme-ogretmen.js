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
  await put('idx_staff/96000001', { no: '96000001', lvl: 'head', area: 'tiyatro' });
  await put('teachers/H1', { id: 'H1', no: '96000001', name: 'Berpirsa Şanoyê', area: 'tiyatro', isHead: true }); await signUp('96000001@ogretmen.aat', 'Head1234');
  for (const [no, id, nm] of [['50202601', 'T50', 'Mamoste Şano'], ['50202602', 'T51', 'Mamoste Drama']]) { await put('idx_staff/' + no, { no, lvl: 'teacher' }); await put('teachers/' + id, { id, no, name: nm, area: 'tiyatro' }); await signUp(no + '@ogretmen.aat', 'Tea12345'); }
  for (const [i, no, name] of [[1, '20202601', 'Rojîn Aram'], [2, '20202602', 'Baran Şêx'], [3, '20202603', 'Dilan Kar']]) { await put('idx_students/' + no, { no }); await put('students/S' + i, { no, name, area: 'tiyatro', fireId: 'S' + i, id: 100 + i }); await signUp(no + '@ogrenci.aat', 'Stu12345'); }
  await put('classes/A1', { kind: 'area', name: '1. Sînif', area: 'tiyatro', studentNos: ['20202601', '20202602', '20202603'], teacherNos: ['50202601', '50202602'], teacherNames: ['Mamoste Şano', 'Mamoste Drama'] });
  await put('schedule/L1', { id: 11, fireId: 'L1', classId: 'A1', area: 'tiyatro', name: 'Şano 1', lessonType: 'main', day: 'Dûşem', start: '09:00', end: '10:00', teacherNo: '50202601', teacherName: 'Mamoste Şano' });
  await put('schedule/L2', { id: 12, fireId: 'L2', classId: 'A1', area: 'tiyatro', name: 'Drama 1', lessonType: 'main', day: 'Sêşem', start: '09:00', end: '10:00', teacherNo: '50202602', teacherName: 'Mamoste Drama' });
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const mk = async (w) => { const c = await b.newContext({ viewport: { width: w || 430, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} }); return c; };
  const login = async (no, pw, role) => { const p = await (await mk()).newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
    await p.getByText(role || 'Mamoste', { exact: true }).first().click();
    await p.locator('input.inp').first().fill(no); await p.locator('input[type=password]').first().fill(pw);
    await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(7000); return p; };
  const sv = d => Object.fromEntries(Object.entries(d.fields).map(([k, v]) => [k, v.stringValue !== undefined ? v.stringValue : v.booleanValue !== undefined ? v.booleanValue : v.integerValue !== undefined ? v.integerValue : v.doubleValue]));
  const col = async c => ((await fetch(`${FS}/${c}?pageSize=100`, { headers: H }).then(r => r.json())).documents || []).map(d => ({ id: d.name.split('/').pop(), ...sv(d) }));
  const txt = p => p.evaluate(() => document.body.innerText);
  // 1) Sorumlu: formu UI'dan, öğretmen seçerek oluşturur
  const hp = await login('96000001', 'Head1234'); await goA(hp, 'evalforms'); await hp.waitForTimeout(1200);
  await hp.evaluate(() => document.querySelector('[data-new-form]').click()); await hp.waitForTimeout(500);
  await hp.locator('[data-ef-title]').fill('Forma Şano ya taybet');
  const tOpts = await hp.evaluate(() => [...document.querySelector('[data-ef-teacher]').options].map(o => o.value));
  ok('Form düzenlemede öğretmen seçeneği: "hepsi" + bölümün öğretmenleri', tOpts[0] === '' && tOpts.includes('50202601') && tOpts.includes('50202602'), JSON.stringify(tOpts));
  await hp.evaluate(() => { const s = document.querySelector('[data-ef-teacher]'); const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set; set.call(s, '50202601'); s.dispatchEvent(new Event('change', { bubbles: true })); }); await hp.waitForTimeout(400);
  const lOpts = await hp.evaluate(() => { const s = document.querySelector('[data-ef-lesson]'); return s ? [...s.options].map(o => o.value) : null; });
  ok('Öğretmen seçilince yalnız onun dersleri listelenir', lOpts && lOpts.includes('11') && !lOpts.includes('12'), JSON.stringify(lOpts));
  await hp.evaluate(() => document.querySelector('[data-ef-add="score"]').click()); await hp.waitForTimeout(300);
  await hp.locator('[data-ef-qtext="0"]').fill('Katılım');
  await hp.evaluate(() => document.querySelector('[data-ef-publish]').click()); await hp.waitForTimeout(2500);
  const F1 = (await col('evalForms')).find(f => f.title === 'Forma Şano ya taybet');
  ok('Form öğretmen atanarak kaydedildi (teacherNo + ders)', !!F1 && F1.teacherNo === '50202601' && F1.teacherName === 'Mamoste Şano' && F1.active === true, JSON.stringify(F1 && { t: F1.teacherNo, l: F1.lessonId }));
  // Genel form (öğretmensiz) + öğrenci→öğretmen formu (Şano'ya özel)
  const mkForm = (id, o) => putO('evalForms/' + id, { academy: 'aat', area: 'tiyatro', period: 'once', active: true, ownerNo: '96000001', ownerName: 'Berpirsa Şanoyê', createdAtIso: new Date().toISOString(), questions: [{ id: 'q1', type: 'score', text: 'Katılım', required: false }], ...o });
  await mkForm('FG', { title: 'Forma giştî', direction: 't2s' });
  await mkForm('FS', { title: 'Forma mamoste Şano', direction: 's2t', teacherNo: '50202601', teacherName: 'Mamoste Şano' });
  // 2) Öğretmen A: kendi formu + genel form; Öğretmen B yalnız genel
  const ta = await login('50202601', 'Tea12345'); await goA(ta, 'seval'); await ta.waitForTimeout(1500);
  let t = await txt(ta);
  ok('Atanan öğretmen kendi formunu ve genel formu görür', t.includes('Forma Şano ya taybet') && t.includes('Forma giştî'));
  const tb = await login('50202602', 'Tea12345'); await goA(tb, 'seval'); await tb.waitForTimeout(1500);
  t = await txt(tb);
  ok('Başka öğretmen yalnız genel formu görür, atanan formu GÖRMEZ', t.includes('Forma giştî') && !t.includes('Forma Şano ya taybet'));
  // 3) Boş bırak + özet + düzenleme (öğretmen A, genel form)
  await ta.evaluate(() => { const b = [...document.querySelectorAll('[data-ef-pick]')].find(x => x.textContent.includes('Forma giştî')); b && b.click(); }); await ta.waitForTimeout(600);
  ok('Soru soru görünümde her öğrenci için "Boş bırak" düğmesi', (await ta.locator('[data-ef-skip]').count()) === 3);
  await ta.evaluate(() => document.querySelector('[data-ef-skip="20202602"]').click()); await ta.waitForTimeout(300);
  await ta.evaluate(() => document.querySelector('[data-ef-score="q1_20202601_8"]').click()); await ta.waitForTimeout(300);
  await ta.evaluate(() => document.querySelector('[data-ef-gsave]').click()); await ta.waitForTimeout(3000);
  const rs = (await col('evalResponses')).filter(r => r.formId === 'FG');
  const r1 = rs.find(r => r.targetNo === '20202601'), r2 = rs.find(r => r.targetNo === '20202602');
  ok('Değerlendirilen öğrenci puanlı, boş bırakılan "skipped" kaydedildi (puan yok)', !!r1 && r1.score10 == 8 && !!r2 && r2.skipped === true && r2.score10 === undefined, JSON.stringify(rs.map(r => [r.targetNo, r.score10, r.skipped])));
  ok('Kaydedince özet (kontrol) ekranı açılır: 1 tamam, 1 boş, 1 bekliyor', (await ta.locator('[data-ef-summary]').count()) === 1 && (await ta.evaluate(() => [...document.querySelectorAll('[data-ef-sum-st]')].map(e => e.dataset.efSumSt).sort().join())) === 'done,skip,wait');
  await ta.evaluate(() => document.querySelector('[data-ef-sum-edit="20202601"]').click()); await ta.waitForTimeout(700);
  ok('Özetten "Düzenle": kişi kişi görünümde mevcut puan yüklü açılır', (await ta.locator('[data-ef-save]').count()) === 1);
  await ta.evaluate(() => document.querySelector('[data-ef-score="q1_9"]').click()); await ta.waitForTimeout(300);
  await ta.evaluate(() => document.querySelector('[data-ef-save]').click()); await ta.waitForTimeout(2500);
  ok('Düzeltilen puan güncellendi (8 → 9)', (await col('evalResponses')).find(r => r.formId === 'FG' && r.targetNo === '20202601').score10 == 9);
  // 4) Öğrenci → öğretmen formu yalnız o öğretmen için
  const sp = await login('20202601', 'Stu12345', 'Xwendekar'); await goA(sp, 'teval'); await sp.waitForTimeout(1500);
  await sp.evaluate(() => { const b = [...document.querySelectorAll('[data-ef-mode] button')].find(x => x.textContent.includes('Mamoste bi mamoste')); b && b.click(); }); await sp.waitForTimeout(500);
  const tg = await sp.evaluate(() => [...document.querySelectorAll('[data-ef-target]')].map(e => e.dataset.efTarget));
  ok('Öğrenci: öğretmene atanan formda yalnız o öğretmen listelenir', tg.join() === '50202601', tg.join());
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
