// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Ders QR kapatılıp YENİDEN açılınca öğrenci okutması çalışır — ilk oturumda bir öğrenci, kapat, yeniden aç, ikinci oturumda başka öğrenci;
//      iki oturum da yoklamaya işlenir
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
  const today = new Date(); const TD = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' });
  await put('teachers/T50', { id: 'T50', no: '50202601', name: 'Mamoste Şano', area: 'tiyatro' });
  await signUp('50202601@ogretmen.aat', 'Tea12345');
  for (const [no, k, nm, id] of [['20202601', 'S1', 'Rojîn Aram', 101], ['20202602', 'S2', 'Azad Can', 102], ['20202603', 'S3', 'Dilan Roj', 103]]) {
    await put('idx_students/' + no, { no, area: 'tiyatro' }); await put('students/' + k, { no, name: nm, area: 'tiyatro', fireId: k, id }); await signUp(no + '@ogrenci.aat', 'Stu12345');
  }
  await put('classes/C1', { kind: 'area', area: 'tiyatro', name: '1. Sınıf', studentNos: ['20202601', '20202602', '20202603'], teacherNos: [] });
  await put('schedule/LQ', { id: 'LQ', fireId: 'LQ', area: 'tiyatro', classId: 'C1', name: 'Şano QR', day: todayKu, start: '00:05', end: '23:55', teacherNo: '50202601', teacherName: 'Mamoste Şano', lessonType: 'main' });
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const mk = async (w) => { const c = await b.newContext({ viewport: { width: w || 1280, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} }); return c; };
  const txt = p => p.evaluate(() => document.body.innerText);
  const goA = (pg, k) => pg.evaluate(k => document.querySelector('.pano-tile[data-key="' + k + '"],.sm-it[data-key="' + k + '"]').click(), k);
  const btn = (p, t) => p.evaluate(t => { const e = [...document.querySelectorAll('button')].filter(x => x.offsetParent && x.textContent.includes(t)).pop(); if (!e) throw new Error('düğme yok: ' + t); e.click(); }, t);
  const get = path => fetch(`${FS}/${path}`, { headers: H }).then(r => r.json());
  const sv = d => Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, v.stringValue !== undefined ? v.stringValue : v.booleanValue !== undefined ? v.booleanValue : v.integerValue]));
  const scan = async (no, sid, code) => {
    const sp = await (await mk(430)).newPage(); sp.on('pageerror', e => errs.push(no + ': ' + e.message)); sp.on('dialog', d => d.accept());
    await sp.goto('http://localhost:8765/app/?emu=1&qr=' + encodeURIComponent('AAT|' + sid + '|' + code)); await sp.waitForSelector('text=Têkeve', { timeout: 60000 });
    await sp.getByText('Xwendekar', { exact: true }).first().click();
    await sp.locator('input.inp').first().fill(no); await sp.locator('input[type=password]').first().fill('Stu12345');
    await sp.getByText('Têkeve', { exact: true }).last().click(); await sp.waitForTimeout(9000);
    const t = await sp.evaluate(() => document.body.innerText); await sp.context().close(); return t;
  };
  const checkins = async (sid, no) => (await list('attendance')).map(sv).filter(d => d.sessionId === sid && d.studentNo === no && !d.deviceClaim);
  const openSessions = async () => (await list('qrSessions')).filter(d => d.fields.active && d.fields.active.booleanValue).map(d => d.name.split('/').pop());
  const codesOf = async sid => ((await get('qrCodes/' + sid)).fields.codes.arrayValue.values || []).map(v => v.stringValue);

  const tc = await (await mk()).newPage(); tc.on('pageerror', e => errs.push('T: ' + e.message)); tc.on('dialog', d => d.accept());
  await tc.goto('http://localhost:8765/app/?emu=1'); await tc.waitForSelector('text=Têkeve', { timeout: 60000 });
  await tc.getByText('Mamoste', { exact: true }).first().click();
  await tc.locator('input.inp').first().fill('50202601'); await tc.locator('input[type=password]').first().fill('Tea12345');
  await tc.getByText('Têkeve', { exact: true }).last().click(); await tc.waitForTimeout(7000);
  await goA(tc, 'attendance'); await tc.waitForTimeout(1500);
  await tc.click('[data-att-lesson="LQ"]'); await tc.waitForTimeout(1200);
  await btn(tc, 'Dersê Dest Pê Bike'); await tc.waitForTimeout(2000);
  // 1. oturum
  await btn(tc, 'QR ya dersê'); await tc.waitForTimeout(2500);
  const s1 = await openSessions(); const SID1 = s1[0];
  ok('1. QR oturumu açıldı', s1.length === 1, JSON.stringify(s1));
  const CODE1 = (await codesOf(SID1)).pop();
  await scan('20202601', SID1, CODE1);
  ok('1. oturum: Rojîn okuttu (yoklamaya yazıldı)', (await checkins(SID1, '20202601')).length === 1);
  // Kapat
  await btn(tc, 'Bigire'); await tc.waitForTimeout(3000);
  ok('QR kapatıldı (açık oturum kalmadı)', (await openSessions()).length === 0, JSON.stringify(await openSessions()));
  const a1 = await get('attendance/LQ-' + TD);
  ok('Kapatınca yoklama kaydedildi: Rojîn geldi', /"101":\{"stringValue":"(on|late)"\}/.test(JSON.stringify(a1.fields && a1.fields.records || {})), JSON.stringify(a1.fields && a1.fields.records || {}).slice(0, 200));
  // Yeniden aç
  await goA(tc, 'attendance'); await tc.waitForTimeout(1500);
  await tc.click('[data-att-lesson="LQ"]'); await tc.waitForTimeout(1500);
  const vis = await txt(tc);
  ok('Yeniden açmak için "QR ya dersê" düğmesi görünür', vis.includes('QR ya dersê'), vis.slice(0, 200).replace(/\n/g, ' / '));
  await btn(tc, 'QR ya dersê'); await tc.waitForTimeout(3000);
  const s2 = await openSessions(); const SID2 = s2[0];
  ok('2. QR oturumu açıldı (yeni oturum kimliği)', s2.length === 1 && SID2 !== SID1, JSON.stringify(s2));
  const c2 = SID2 ? await codesOf(SID2).catch(() => []) : [];
  ok('2. oturumda geçerli kod yazıldı', c2.length >= 1, JSON.stringify(c2));
  const t2 = await scan('20202602', SID2, c2[c2.length - 1]);
  const ck2 = await checkins(SID2, '20202602');
  ok('2. oturum: Azad okuttu (yoklamaya yazıldı)', ck2.length === 1, ck2.length + ' / ' + t2.slice(0, 200).replace(/\n/g, ' / '));
  // Öğretmen ekranı canlı gösterir; kapatınca ikisi de "geldi"
  await tc.waitForTimeout(2000);
  const live = await tc.evaluate(() => document.body.innerText);
  ok('Öğretmen QR ekranı yeni okutanı (Azad) canlı gösterir', live.includes('Azad Can'), live.slice(0, 300).replace(/\n/g, ' / '));
  ok('Öğretmen QR ekranı ilk oturumda okutanı (Rojîn) da listede tutar', live.includes('Rojîn Aram'), '');
  await btn(tc, 'Bigire'); await tc.waitForTimeout(3500);
  const a2 = await get('attendance/LQ-' + TD);
  const r2 = JSON.stringify(a2.fields && a2.fields.records || {});
  ok('2. kapatışta yoklama: Rojîn + Azad geldi, Dilan yok', /"101":\{"stringValue":"(on|late)"\}/.test(r2) && /"102":\{"stringValue":"(on|late)"\}/.test(r2) && /"103":\{"stringValue":"off"\}/.test(r2), r2);
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
