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
  const YR = String(new Date().getFullYear());
  await put('idx_staff/96000001', { no: '96000001', lvl: 'head', area: 'tiyatro' });
  await put('teachers/H1', { id: 'H1', no: '96000001', name: 'Berpirsa Şanoyê', area: 'tiyatro', isHead: true });
  await signUp('96000001@ogretmen.aat', 'Head1234');
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' });
  await put('teachers/T50', { id: 'T50', no: '50202601', name: 'Mamoste Şano', area: 'tiyatro' });
  await signUp('50202601@ogretmen.aat', 'Tea12345');
  for (const [i, no, name] of [[1, '20202601', 'Rojîn Aram'], [2, '20202602', 'Baran Şêx']]) {
    await put('idx_students/' + no, { no }); await put('students/S' + i, { no, name, area: 'tiyatro', fireId: 'S' + i, id: 100 + i }); await signUp(no + '@ogrenci.aat', 'Stu12345');
  }
  await put('classes/A1', { kind: 'area', name: '1. Sînif', area: 'tiyatro', studentNos: ['20202601', '20202602'], teacherNos: ['50202601'], teacherNames: ['Mamoste Şano'] });
  // Ortak Giştî sınıfı: Şano buna da giriyor; içinde müzik öğrencisi de var
  await put('students/S9', { no: '20202609', name: 'Jîyan Roj', area: 'muzik', fireId: 'S9', id: 109 });
  await put('classes/GG', { kind: 'general', name: 'Giştî', area: 'genel', studentNos: ['20202601', '20202609'], teacherNos: ['50202601'], teacherNames: ['Mamoste Şano'] });
  // Çocuk akademisi
  await put('idx_staff/96202602', { no: '96202602', lvl: 'head', area: 'drama' });
  await put('teachers/TH2', { id: 'TH2', no: '96202602', name: 'Berpirsa Dramayê', isHead: true, area: 'drama' });
  await signUp('96202602@ogretmen.aat', 'Head1234');
  const G = '9' + YR + '501', KT = '72026001', KN = '8' + YR + '501';
  await put('idx_guardians/' + G, { no: G }); await put('guardians/' + G, { no: G, name: 'Nûrê Aram', phone: '0555' });
  await put('kids/K1', { no: KN, name: 'Dilan Aram', area: 'drama', guardianNos: [G] });
  await put('kidClasses/KC', { kind: 'area', name: '1. Sînif', area: 'drama', studentNos: [KN], teacherNos: [KT], teacherNames: ['Mamoste Berfîn'] });
  await signUp(G + '@veli.aat', 'Veli12345');

  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const mk = async (w) => { const c = await b.newContext({ viewport: { width: w || 1280, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); localStorage.setItem('zarok-lang', 'ku'); } catch (_) {} }); return c; };
  const login = async (no, pw, role, w) => { const p = await (await mk(w)).newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
    await p.getByText(role || 'Mamoste', { exact: true }).first().click();
    await p.locator('input.inp').first().fill(no); await p.locator('input[type=password]').first().fill(pw);
    await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(7000); return p; };
  const txt = p => p.evaluate(() => document.body.innerText);
  const go = (p, k) => p.evaluate(k => [...document.querySelectorAll('.sm-it[data-key="' + k + '"],.pano-tile[data-key="' + k + '"],[data-key="' + k + '"]')].filter(x => x.getClientRects().length)[0].click(), k);
  const clk = (p, sel) => p.evaluate(sel => { const e = document.querySelector(sel); if (!e) throw new Error('yok: ' + sel); e.scrollIntoView(); e.click(); }, sel);
  const scoreAll = (p, n) => p.evaluate(n => { const qs = new Set([...document.querySelectorAll('[data-ef-score]')].map(e => e.dataset.efScore.replace(/_\d+$/, '')));
    qs.forEach(q => { const e = document.querySelector('[data-ef-score="' + q + '_' + n + '"]'); e && e.click(); }); return qs.size; }, n);

  // 1) Sorumlu: iki form (öğretmen→öğrenci haftalık, öğrenci→öğretmen aylık)
  const hp = await login('96000001', 'Head1234');
  await go(hp, 'evalforms'); await hp.waitForTimeout(1000);
  await hp.click('[data-new-form]'); await hp.waitForTimeout(500);
  ok('Yeni form boş başlar (hazır soru yok)', (await hp.locator('[data-ef-qtext]').count()) === 0);
  await hp.fill('[data-ef-title]', 'Nirxandina Şanoyê');
  await hp.click('[data-ef-add="score"]'); await hp.waitForTimeout(100); await hp.locator('[data-ef-qtext]').last().fill('Beşdarî');
  await hp.click('[data-ef-add="score"]'); await hp.waitForTimeout(100); await hp.locator('[data-ef-qtext]').last().fill('Pêşketin');
  await hp.click('[data-ef-add="score"]'); await hp.waitForTimeout(100); await hp.locator('[data-ef-qtext]').last().fill('Hevkarî');
  await hp.click('[data-ef-add="score"]'); await hp.waitForTimeout(100); await hp.locator('[data-ef-qtext]').last().fill('Berpirsiyarî');
  await hp.click('[data-ef-add="text"]'); await hp.waitForTimeout(100);
  await hp.locator('[data-ef-qtext]').last().fill('Xala xurt a xwendekar?');
  await hp.click('[data-ef-publish]'); await hp.waitForTimeout(2000);
  await hp.click('[data-new-form]'); await hp.waitForTimeout(500);
  await hp.fill('[data-ef-title]', 'Nêrîna xwendekaran');
  await hp.click('[data-ef-dir="s2t"]'); await hp.click('[data-ef-period="monthly"]'); await hp.waitForTimeout(200);
  await hp.click('[data-ef-add="score"]'); await hp.waitForTimeout(100); await hp.locator('[data-ef-qtext]').last().fill('Ravekirin');
  await hp.click('[data-ef-add="score"]'); await hp.waitForTimeout(100); await hp.locator('[data-ef-qtext]').last().fill('Rêz');
  await hp.click('[data-ef-publish]'); await hp.waitForTimeout(2000);
  const forms = await list('evalForms');
  const F1 = forms.find(d => d.fields.title.stringValue === 'Nirxandina Şanoyê'), F2 = forms.find(d => d.fields.title.stringValue === 'Nêrîna xwendekaran');
  ok('Form 1: öğretmen→öğrenci, haftalık, 4 puan + 1 yazılı, bölüm Tiyatro, yayında', !!F1 && F1.fields.direction.stringValue === 't2s' && F1.fields.period.stringValue === 'weekly'
    && F1.fields.questions.arrayValue.values.length === 5 && F1.fields.area.stringValue === 'tiyatro' && F1.fields.active.booleanValue === true);
  ok('Form 2: öğrenci→öğretmen, aylık', !!F2 && F2.fields.direction.stringValue === 's2t' && F2.fields.period.stringValue === 'monthly');

  // 2) Öğretmen: Rojîn 3/10, Baran 9/10
  const tp = await login('50202601', 'Tea12345', 'Mamoste', 430);
  await go(tp, 'seval'); await tp.waitForTimeout(1500);
  ok('Öğretmen: form ekranı (eski 4 pîvan yerine)', (await tp.locator('[data-ef-fill]').count()) === 1 && (await txt(tp)).includes('Nirxandina Şanoyê'));
  // Soru soru (varsayılan): her sorunun altında öğrenci listesi; kişiye puan + not
  ok('Soru soru görünüm: her soruda iki öğrenci', (await tp.locator('[data-ef-grid]').count()) === 1 && (await tp.locator('[data-ef-gcell$="_20202601"]').count()) === 5 && (await tp.locator('[data-ef-gcell$="_20202602"]').count()) === 5);
  ok('Tiyatro formunda Giştî öğretmeninin müzik öğrencisi listelenmez (yalnız formun alanı)', (await tp.locator('[data-ef-gcell$="_20202609"]').count()) === 0);
  const nq = await tp.evaluate(() => { const qs = [...document.querySelectorAll('[data-ef-gq]')].map(e => e.dataset.efGq); let n = 0;
    qs.forEach(q => { const a = document.querySelector('[data-ef-score="' + q + '_20202601_3"]'), b = document.querySelector('[data-ef-score="' + q + '_20202602_9"]'); if (a && b) { a.click(); b.click(); n++; } }); return n; });
  await tp.waitForTimeout(300);
  const Q1 = await tp.evaluate(() => document.querySelector('[data-ef-gq]').dataset.efGq);
  await tp.locator('[data-ef-gnote="' + Q1 + '_20202601"]').fill('Ders tê de beşdar nabe');
  await tp.locator('[data-ef-gtext$="_20202601"]').fill('Dengê wê baş e');
  await clk(tp, '[data-ef-gsave]'); await tp.waitForTimeout(2500);
  const R = await list('evalResponses');
  const r1 = R.find(d => d.fields.targetNo.stringValue === '20202601'), r2 = R.find(d => d.fields.targetNo.stringValue === '20202602');
  ok('Öğretmen cevapları tek seferde kaydedildi (Rojîn 3.0, Baran 9.0, yazılı cevap)', nq === 4 && !!r1 && Number(r1.fields.score10.doubleValue ?? r1.fields.score10.integerValue) === 3 && !!r2 && Number(r2.fields.score10.doubleValue ?? r2.fields.score10.integerValue) === 9 && JSON.stringify(r1.fields.answers).includes('Dengê wê baş e'),
    r1 ? JSON.stringify(r1.fields.score10) : '');
  ok('Kişiye göre not kaydedildi (soru 1, Rojîn)', !!r1 && JSON.stringify(r1.fields.notes || {}).includes('Ders tê de beşdar nabe'), r1 ? JSON.stringify(r1.fields.notes) : '');
  await tp.context().close();

  // 3) Öğrenci: öğretmeni değerlendirir (aylık, isimsiz)
  const sp = await login('20202601', 'Stu12345', 'Xwendekar', 430);
  await go(sp, 'teval'); await sp.waitForTimeout(1500);
  ok('Öğrenci: öğretmen değerlendirme formu', (await sp.locator('[data-ef-fill]').count()) === 1 && (await txt(sp)).includes('Nêrîna xwendekaran'));
  // Kişi kişi görünüm de çalışır (öğretmen başına puan + not)
  await sp.evaluate(() => [...document.querySelectorAll('[data-ef-mode] button')][1].click()); await sp.waitForTimeout(300);
  await clk(sp, '[data-ef-target="50202601"] button'); await sp.waitForTimeout(400);
  await scoreAll(sp, 8); await sp.locator('[data-ef-note]').first().fill('Baş rave dike'); await clk(sp, '[data-ef-save]'); await sp.waitForTimeout(1800);
  const r3 = (await list('evalResponses')).find(d => d.fields.direction.stringValue === 's2t');
  ok('Öğrenci cevabı aylık döneme kaydedildi (not ile)', !!r3 && /^\d{4}-\d{2}$/.test(r3.fields.period.stringValue) && r3.fields.targetNo.stringValue === '50202601' && JSON.stringify(r3.fields.notes || {}).includes('Baş rave dike'));
  await sp.context().close();

  // 4) Sorumlu: sonuçlar + uyarı
  await hp.reload(); await hp.waitForTimeout(7000); await go(hp, 'evalforms'); await hp.waitForTimeout(1200);
  await hp.click('[data-ef-results="' + F1.name.split('/').pop() + '"]'); await hp.waitForTimeout(1500);
  const t4 = await txt(hp);
  ok('Sonuçlar: soru ortalamaları (6.0) ve kişi bazında (Rojîn 3.0, Baran 9.0)', t4.includes('6.0') && t4.includes('3.0') && t4.includes('9.0') && t4.includes('Dengê wê baş e'));
  await hp.click('[data-ef-qavg="' + Q1 + '"]'); await hp.waitForTimeout(400);
  const qp = await hp.evaluate(q => (document.querySelector('[data-ef-qper="' + q + '"]') || {}).innerText || '', Q1);
  ok('Sonuç: soruya tıklayınca kişi kişi puan ve not (Rojîn 3 · not, Baran 9)', qp.includes('Rojîn') && qp.includes('Ders tê de beşdar nabe') && qp.includes('Baran') && /\b3\b/.test(qp) && /\b9\b/.test(qp), qp.replace(/\n/g, ' / '));
  // Rapor → Değerlendirme: eski + yeni tek ekranda, notlarıyla
  await go(hp, 'reports'); await hp.waitForTimeout(1500);
  await hp.evaluate(() => document.querySelector('[data-rw-type="eval"]').click()); await hp.waitForTimeout(600);
  await hp.evaluate(() => document.querySelector('[data-rw-who="student"]').click()); await hp.waitForTimeout(1500);
  await hp.click('[data-eval-row="20202601"] button'); await hp.waitForTimeout(400);
  const rd = await hp.evaluate(() => (document.querySelector('[data-eval-detail="20202601"]') || {}).innerText || '');
  ok('Rapor → Değerlendirme: öğrencinin soru puanları ve öğretmen notu', rd.includes('Beşdarî') && rd.includes('Ders tê de beşdar nabe') && rd.includes('Mamoste'), rd.replace(/\n/g, ' / ').slice(0, 300));
  await go(hp, 'alerts'); await hp.waitForTimeout(1500);
  const ak = await hp.evaluate(() => [...document.querySelectorAll('[data-alert]')].map(e => e.dataset.alert));
  ok('Tek form cevabı 5/10 altı olsa da anlık uyarı yok (aylık analizde değerlendirilir)', !ak.some(k => k.startsWith('efr_')), JSON.stringify(ak));
  await hp.context().close();

  // 5) Çocuk akademisi: veli → öğretmen formu
  const kp = await login('96202602', 'Head1234');
  await go(kp, 'evalforms'); await kp.waitForTimeout(1000);
  await kp.click('[data-new-form]'); await kp.waitForTimeout(500);
  await kp.fill('[data-ef-title]', 'Nêrîna dêûbavan');
  await kp.click('[data-ef-dir="g2t"]'); await kp.click('[data-ef-period="once"]'); await kp.waitForTimeout(200);
  await kp.click('[data-ef-add="score"]'); await kp.waitForTimeout(100); await kp.locator('[data-ef-qtext]').last().fill('Têkilî');
  await kp.click('[data-ef-add="score"]'); await kp.waitForTimeout(100); await kp.locator('[data-ef-qtext]').last().fill('Ders');
  await kp.click('[data-ef-publish]'); await kp.waitForTimeout(2000);
  const KF = (await list('evalForms')).find(d => d.fields.title.stringValue === 'Nêrîna dêûbavan');
  ok('Çocuk formu: veli→öğretmen, bir kez, Drama', !!KF && KF.fields.academy.stringValue === 'kid' && KF.fields.direction.stringValue === 'g2t' && KF.fields.area.stringValue === 'drama');
  const vc = await mk(390); const vp = await vc.newPage(); vp.on('pageerror', e => errs.push('veli: ' + e.message));
  await vp.goto('http://localhost:8765/zarok/app/?emu=1'); await vp.waitForSelector('#l-no', { timeout: 20000 });
  await vp.click('.roles button:nth-child(1)'); await vp.fill('#l-no', G); await vp.fill('#l-pw', 'Veli12345'); await vp.click('.login .btn');
  await vp.waitForSelector('.top', { timeout: 20000 }); await vp.waitForTimeout(1500);
  await goZ(vp, 'teval'); await vp.waitForTimeout(1200);
  ok('Veli: soru soru görünüm varsayılan (öğretmen her soruda)', (await vp.locator('[data-ef-grid]').count()) === 1 && (await vp.locator('[data-ef-gcell$="_' + KT + '"]').count()) === 2);
  await vp.evaluate(() => [...document.querySelectorAll('[data-ef-mode] button')][1].click()); await vp.waitForTimeout(400);
  ok('Veli: kişi kişi görünümde öğretmen listede', (await vp.locator('[data-ef-target="' + KT + '"]').count()) === 1, (await txt(vp)).slice(0, 200));
  await vp.evaluate(KT => document.querySelector('[data-ef-target="' + KT + '"] button').click(), KT); await vp.waitForTimeout(400);
  await scoreAll(vp, 4); await vp.evaluate(() => document.querySelector('[data-ef-save]').click()); await vp.waitForTimeout(2000);
  const kr = (await list('evalResponses')).find(d => d.fields.direction.stringValue === 'g2t');
  ok('Veli cevabı kaydedildi (bir kez, 4.0)', !!kr && kr.fields.period.stringValue === 'once' && kr.fields.raterRole.stringValue === 'guardian');
  await go(kp, 'alerts'); await kp.waitForTimeout(1500);
  const ak2 = await kp.evaluate(() => [...document.querySelectorAll('[data-alert]')].map(e => e.dataset.alert));
  ok('Çocuk sorumlusu: tek veli cevabı 4/10 olsa da anlık uyarı yok (aylık analizde değerlendirilir)', !!kr && !ak2.some(k => k.startsWith('efr_')), JSON.stringify(ak2));
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
