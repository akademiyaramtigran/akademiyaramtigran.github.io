// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Ana akademi sınıfları — alan sınıfı + ders programı, genel sınıf (tüm alanlardan),
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
const clickText = (p, text, top) => p.evaluate(([t, top]) => {
  if (top) { const mv = [...document.querySelectorAll('.sm-it,.pano-tile')].filter(x => x.getClientRects().length); const m = mv.find(x => x.textContent.trim() === t) || mv.find(x => x.textContent.includes(t)); if (m) { m.click(); return; } }
  const ok = x => { const r = x.getBoundingClientRect(); return r.width > 0 && (!top || (r.top > 60 && r.top < 260)); };
  // Önce ekrandaki, yoksa yatay şeritte kaymış olanı al (kapalı yan menüdeki kopyalar -left ile elenir)
  const b = [...document.querySelectorAll('button')].filter(x => x.textContent.includes(t) && x.offsetParent !== null && ok(x))
    .sort((a, c) => (a.getBoundingClientRect().left < -200) - (c.getBoundingClientRect().left < -200))[0];
  if (!b) throw new Error('düğme yok: ' + t); b.scrollIntoView({ inline: 'center', block: 'nearest' }); b.click();
}, [text, top]);

const goA = (pg, k) => pg.evaluate(k => document.querySelector('.pano-tile[data-key="' + k + '"],.sm-it[data-key="' + k + '"]').click(), k);
(async () => {
  const goA = (pg, k) => pg.evaluate(k => document.querySelector('.pano-tile[data-key="' + k + '"],.sm-it[data-key="' + k + '"]').click(), k);
  await put('idx_staff/96000001', { no: '96000001', lvl: 'head', area: 'tiyatro' }); await put('teachers/H1', { id: 'H1', no: '96000001', name: 'Berpirsa Şanoyê', area: 'tiyatro', isHead: true }); await signUp('96000001@ogretmen.aat', 'Head1234');
  await put('idx_staff/96000002', { no: '96000002', lvl: 'head', area: 'genel' }); await put('teachers/HG', { id: 'HG', no: '96000002', name: 'Berpirsê Giştî', area: 'genel', isHead: true }); await signUp('96000002@ogretmen.aat', 'Head1234');
  for (const [i, no, nm, ar] of [['1', '20202601', 'Rojîn Aram', 'tiyatro'], ['2', '20202602', 'Baran Şêx', 'tiyatro'], ['3', '20202603', 'Dilan Kar', 'muzik']]) { await put('idx_students/' + no, { no, area: ar }); await put('students/S' + i, { no, name: nm, area: ar, fireId: 'S' + i }); await signUp(no + '@ogrenci.aat', 'Stu12345'); }
  await put('classes/C1', { kind: 'area', name: '1. Sînif', area: 'tiyatro', studentNos: ['20202601', '20202602'] });
  await put('classes/C2', { kind: 'area', name: 'Müzik 1', area: 'muzik', studentNos: ['20202603'] });
  await put('classes/G1', { kind: 'general', name: 'Giştî', area: 'genel', studentNos: ['20202601', '20202603'] });
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const mk = async (w) => { const c = await b.newContext({ viewport: { width: w || 430, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} }); return c; };
  const login = async (role, no, pw) => {
    const p = await (await mk()).newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
    await p.getByText(role, { exact: true }).first().click();
    await p.locator('input.inp').first().fill(no); await p.locator('input[type=password]').first().fill(pw);
    await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(7000); return p;
  };
  const msgs = async () => ((await fetch(`${FS}/messages?pageSize=100`, { headers: H }).then(r => r.json())).documents || []);
  const sv = d => Object.fromEntries(Object.entries(d.fields).map(([k, v]) => [k, v.stringValue !== undefined ? v.stringValue : v.integerValue !== undefined ? v.integerValue : v.booleanValue]));
  const setSel = (p, q, v) => p.evaluate(([q, v]) => { const s = document.querySelector(q); const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set; set.call(s, v); s.dispatchEvent(new Event('change', { bubbles: true })); }, [q, v]);
  const hp = await login('Mamoste', '96000001', 'Head1234');
  await goA(hp, 'messages'); await hp.waitForTimeout(1200);
  await hp.evaluate(() => [...document.querySelectorAll('button')].find(x => x.textContent.includes('Peyamek Nû')).click()); await hp.waitForTimeout(500);
  const opts = await hp.evaluate(() => [...document.querySelector('[data-head-to]').options].map(o => o.value));
  ok('Sorumlu alıcıları: kendi bölümünün sınıfı var, başka bölümün / genel sınıf yok', opts.includes('cls_C1') && !opts.includes('cls_C2') && !opts.includes('cls_G1'), JSON.stringify(opts));
  // Seçilen öğrenciye özel mesaj
  await setSel(hp, '[data-head-to]', 'cls_C1'); await hp.waitForTimeout(400);
  await hp.evaluate(() => document.querySelector('[data-hw="pick"]').click()); await hp.waitForTimeout(300);
  await hp.locator('[data-hpick="20202601"] input').check();
  await hp.locator('#hm-subject').fill('Ji bo Rojînê'); await hp.locator('#hm-body').fill('Tenê ji te re');
  await hp.evaluate(() => [...document.querySelectorAll('button')].filter(x => x.textContent.includes('Bişîne') && x.offsetParent).pop().click()); await hp.waitForTimeout(2500);
  let m = (await msgs()).map(sv).filter(x => x.subject === 'Ji bo Rojînê');
  ok('Seçilen öğrenciye özel mesaj: yalnız Rojîn (sınıf kimliğiyle)', m.length === 1 && m[0].recipientNo === '20202601' && m[0].classId === 'C1' && m[0].fromType === 'head', JSON.stringify(m.map(x => x.recipientNo)));
  // Bütün sınıfa mesaj
  await hp.evaluate(() => [...document.querySelectorAll('button')].find(x => x.textContent.includes('Peyamek Nû')).click()); await hp.waitForTimeout(500);
  await setSel(hp, '[data-head-to]', 'cls_C1'); await hp.waitForTimeout(300);
  await hp.locator('#hm-subject').fill('Ji bo sinifê'); await hp.locator('#hm-body').fill('Silav');
  await hp.evaluate(() => [...document.querySelectorAll('button')].filter(x => x.textContent.includes('Bişîne') && x.offsetParent).pop().click()); await hp.waitForTimeout(2800);
  m = (await msgs()).map(sv).filter(x => x.subject === 'Ji bo sinifê');
  ok('Bütün sınıfa mesaj: her öğrenciye ayrı kayıt (2)', m.length === 2 && new Set(m.map(x => x.recipientNo)).size === 2 && m.every(x => x.classId === 'C1'));
  // Gönderilenler tek satır, silince hepsi kalkar
  await hp.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /Şandî|Sent/.test(x.textContent) && x.offsetParent); b && b.click(); }); await hp.waitForTimeout(600);
  const rows = await hp.evaluate(() => [...document.querySelectorAll('.card')].filter(r => r.textContent.includes('Ji bo sinifê')).length);
  ok('Sınıf mesajı "Şandî"de tek satır', rows === 1, String(rows));
  await hp.evaluate(() => { const c = [...document.querySelectorAll('.card')].find(r => r.textContent.includes('Ji bo sinifê')); c.firstElementChild.click(); }); await hp.waitForTimeout(500);
  await hp.evaluate(() => document.querySelector('[data-msg-del]').click()); await hp.waitForTimeout(2500);
  m = (await msgs()).map(sv).filter(x => x.subject === 'Ji bo sinifê');
  ok('Silince sınıfa giden bütün kayıtlar silinir', m.length === 0, String(m.length));
  // Ödev & Belge (sınıfa / seçilen öğrenciye)
  await hp.evaluate(() => [...document.querySelectorAll('button')].find(x => x.textContent.includes('Erk û Belge')).click()); await hp.waitForTimeout(800);
  ok('Sorumlu "Erk û Belge" ekranı: sınıf seçimi + "kime" seçimi', (await hp.locator('[data-head-posts]').count()) === 1 && (await hp.locator('[data-post-to]').count()) === 1);
  await hp.click('[data-to="pick"]'); await hp.waitForTimeout(300);
  await hp.locator('[data-pick-st="20202602"] input').check();
  await hp.locator('input[placeholder="Sernav"]').fill('Ödeva sorumlu'); await hp.locator('textarea').first().fill('Ji Baran re');
  await hp.evaluate(() => [...document.querySelectorAll('button')].filter(x => x.textContent.includes('Bişîne') && x.offsetParent).pop().click()); await hp.waitForTimeout(2500);
  const cp = ((await fetch(`${FS}/classPosts?pageSize=50`, { headers: H }).then(r => r.json())).documents || []).map(sv).find(x => x.title === 'Ödeva sorumlu');
  ok('Sorumlu ödevi seçilen öğrenciye gönderdi (yalnız Baran, sınıf C1)', !!cp && cp.classId === 'C1' && cp.type === 'odev' && cp.teacherNo === '96000001');
  // Sınıf duyurusu
  await goA(hp, 'announce'); await hp.waitForTimeout(1000);
  await hp.evaluate(() => document.querySelector('[data-ann-mode="cls"]').click()); await hp.waitForTimeout(500);
  const cls = await hp.evaluate(() => [...document.querySelectorAll('[data-hann-class]')].map(e => e.dataset.hannClass));
  ok('Sınıf duyurusu: yalnız kendi bölümünün sınıfları', cls.join() === 'C1', cls.join());
  await hp.evaluate(() => document.querySelector('[data-hann-class="C1"]').click());
  await hp.locator('#hca-title').fill('Duyuruya sinif'); await hp.locator('#hca-body').fill('Prova sibê');
  await hp.evaluate(() => [...document.querySelectorAll('button')].filter(x => x.textContent.includes('Bişîne') && x.offsetParent).pop().click()); await hp.waitForTimeout(2500);
  const an = ((await fetch(`${FS}/classPosts?pageSize=50`, { headers: H }).then(r => r.json())).documents || []).map(sv).find(x => x.title === 'Duyuruya sinif');
  ok('Sınıf duyurusu kaydedildi (duyuru, C1)', !!an && an.type === 'duyuru' && an.classId === 'C1');
  // Öğrenci tarafı: kendi sınıfının duyurusunu görür, başka bölümün öğrencisi görmez
  const sp = await login('Xwendekar', '20202601', 'Stu12345'); await goA(sp, 'announce'); await sp.waitForTimeout(1500);
  ok('Sınıftaki öğrenci sınıf duyurusunu görür', (await sp.evaluate(() => document.body.innerText)).includes('Duyuruya sinif'));
  const sp3 = await login('Xwendekar', '20202603', 'Stu12345'); await goA(sp3, 'announce'); await sp3.waitForTimeout(1500);
  ok('Başka bölümün öğrencisi görmez', !(await sp3.evaluate(() => document.body.innerText)).includes('Duyuruya sinif'));
  // Genel sorumlu: yalnız genel sınıf
  const gp = await login('Mamoste', '96000002', 'Head1234'); await goA(gp, 'messages'); await gp.waitForTimeout(1200);
  await gp.evaluate(() => [...document.querySelectorAll('button')].find(x => x.textContent.includes('Peyamek Nû')).click()); await gp.waitForTimeout(500);
  const gopts = await gp.evaluate(() => [...document.querySelector('[data-head-to]').options].map(o => o.value));
  ok('Genel sorumlu alıcıları: yalnız genel sınıf (bölüm sınıfı yok)', gopts.includes('cls_G1') && !gopts.includes('cls_C1') && !gopts.includes('cls_C2'), JSON.stringify(gopts));
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
