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
const AUDIT = () => {
  const parse = c => { const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const blend = (t, b) => ({ r: t.r * t.a + b.r * (1 - t.a), g: t.g * t.a + b.g * (1 - t.a), b: t.b * t.a + b.b * (1 - t.a), a: 1 });
  const bgOf = el => { const layers = []; let e = el, src = null;
    while (e && e.nodeType === 1) { const cs = getComputedStyle(e);
      if (cs.backgroundImage && cs.backgroundImage !== 'none' && !/^url/.test(cs.backgroundImage)) return null;
      const c = parse(cs.backgroundColor); if (c && c.a > 0) { layers.push(c); if (!src) src = e; if (c.a >= 1) break; } e = e.parentElement; }
    let base = { r: 10, g: 30, b: 35, a: 1 }; for (let i = layers.length - 1; i >= 0; i--) base = blend(layers[i], base); return { c: base, src }; };
  const out = []; const seen = new Set();
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) { const n = w.currentNode, t = n.textContent.trim(); if (t.length < 2) continue;
    const el = n.parentElement; if (!el || el.closest('.sm,.pano,.zside,script,style,option')) continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    let o = el, hid = false; while (o) { const s = getComputedStyle(o); if (+s.opacity < .05 || s.display === 'none') { hid = true; break; } o = o.parentElement; } if (hid) continue;
    const bg = bgOf(el); if (!bg) continue; const fc = parse(cs.color); if (!fc) continue;
    const col = blend(fc, bg.c); const L1 = lum(col), L2 = lum(bg.c); const ratio = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
    const big = parseFloat(cs.fontSize) >= 18 || (parseFloat(cs.fontSize) >= 14 && +cs.fontWeight >= 700);
    if (ratio < (big ? 3 : 4.0)) { const k = t.slice(0, 30) + '|' + cs.color + '|' + Math.round(bg.c.r) + ',' + Math.round(bg.c.g) + ',' + Math.round(bg.c.b); if (seen.has(k)) continue; seen.add(k);
      out.push({ t: t.slice(0, 50), ratio: +ratio.toFixed(2), color: cs.color, bg: 'rgb(' + [bg.c.r, bg.c.g, bg.c.b].map(Math.round).join(',') + ')', st: (el.getAttribute('style') || '').slice(0, 140), bst: bg.src ? (bg.src.getAttribute('style') || bg.src.className || bg.src.tagName).toString().slice(0, 140) : 'BODY' }); } }
  return out;
};
(async () => {
  await put('idx_staff/1000', { no: '1000', lvl: 'admin' }); await put('teachers/TA', { no: '1000', name: 'Rêveber', isAdmin: true, area: 'genel' }); await signUp('1000@ogretmen.aat', 'Admin123');
  await put('idx_staff/98202601', { no: '98202601', lvl: 'registrar' }); await put('teachers/TR', { no: '98202601', name: 'Karûbar', isRegistrar: true, area: 'genel' }); await signUp('98202601@ogretmen.aat', 'Reg12345');
  await put('idx_staff/97202601', { no: '97202601', lvl: 'press' }); await put('teachers/TP', { no: '97202601', name: 'Çapemenî', isPress: true, area: 'genel' }); await signUp('97202601@ogretmen.aat', 'Pre12345');
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' }); await put('teachers/T5', { id: 'T5', no: '50202601', name: 'Mamoste Dilovan', area: 'muzik' }); await signUp('50202601@ogretmen.aat', 'Tea12345');
  for (let i = 1; i <= 4; i++) { const no = '2020260' + i; await put('idx_students/' + no, { no }); await put('students/S' + i, { no, name: ['Rojîn Aram', 'Baran Şêx', 'Jîyan Roj', 'Dilan Kaya'][i - 1], area: i < 3 ? 'muzik' : 'tiyatro', classLevel: 1, fireId: 'S' + i, id: 100 + i }); }
  await signUp('20202601@ogrenci.aat', 'Stu12345');
  await put('schedule/L1', { id: 'L1', area: 'muzik', teacherId: 'T5', teacher: 'Mamoste Dilovan', lesson: 'Solfej', day: 'Sêşem', start: '10:00', end: '11:30', room: 'A1', lessonType: 'main' });
  await put('announcements/A1', { title: 'Konsera biharê', body: 'Şemî saet 15:00', target: 'all', createdAt: new Date(), date: '2026-10-20' });
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const all = {};
  const run = async (who, no, pw, role, w) => {
    const c = await b.newContext({ viewport: { width: w || 1280, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); localStorage.setItem('aat-theme', 'dark'); } catch (_) {} });
    const p = await c.newPage(); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
    await p.getByText(role || 'Mamoste', { exact: true }).first().click();
    await p.locator('input.inp').first().fill(no); await p.locator('input[type=password]').first().fill(pw);
    await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(7000);
    const keys = await p.evaluate(() => [...document.querySelectorAll('.sm-it[data-key]')].map(e => e.dataset.key));
    for (const k of keys) {
      await p.evaluate(k => document.querySelector('.sm-it[data-key="' + k + '"]').click(), k); await p.waitForTimeout(1500);
      const add = (lbl, arr) => arr.forEach(x => { const id = x.t + '|' + x.color + '|' + x.bg; (all[id] = all[id] || { ...x, where: [] }).where.push(who + '/' + lbl); });
      add(k, await p.evaluate(AUDIT));
      await p.screenshot({ path: process.env.OUT + '/dk-' + who + '-' + k + '.png' });
      // Alt sekmeler / seçenek grupları: yalnızca düğmelerden oluşan (≥3) satırlar
      const subs = await p.evaluate(() => { const out = []; document.querySelectorAll('.scroll-area *').forEach(c => { const k = [...c.children]; if (k.length >= 3 && k.every(x => x.tagName === 'BUTTON') && c.getClientRects().length) k.forEach(x => { const t = x.textContent.trim(); if (t && t.length < 40 && !out.includes(t)) out.push(t); }); }); return out.slice(0, 30); });
      for (const [i, tx] of subs.entries()) {
        await p.evaluate(tx => { const e = [...document.querySelectorAll('.scroll-area button')].find(x => x.textContent.trim() === tx && x.getClientRects().length); e && e.click(); }, tx); await p.waitForTimeout(700);
        add(k + '#' + tx, await p.evaluate(AUDIT));
        if (k === 'reports' || k === 'rapor') await p.screenshot({ path: process.env.OUT + '/dk-' + who + '-' + k + '-' + i + '.png' });
        await p.keyboard.press('Escape').catch(() => {});
      }
    }
    await c.close();
  };
  await run('admin', '1000', 'Admin123');
  await run('oi', '98202601', 'Reg12345');
  await run('basin', '97202601', 'Pre12345');
  await run('ogretmen', '50202601', 'Tea12345');
  await run('ogrenci', '20202601', 'Stu12345', 'Xwendekar');
  // ── Çocuk uygulaması (sistem koyu teması) ──
  const dow = new Date().getDay();
  await put('idx_guardians/92026001', { no: '92026001' }); await put('guardians/92026001', { no: '92026001', name: 'Leyla Aram', phone: '0555' });
  await put('kids/K1', { no: '82026001', name: 'Rojda', area: 'muzik', guardianNos: ['92026001'], pickups: [], consentPhoto: false, consentShare: false, health: '', classLevel: 1 });
  await put('kidSchedule/S1', { day: dow, start: '14:00', end: '15:30', title: 'Muzîka Zarokan', area: 'muzik', teacher: 'Hêvî', room: 'A2' });
  await put('kidAnnouncements/N1', { title: 'Şahiya demsalê', body: 'Şemî saet 15:00', createdAt: new Date() });
  await signUp('92026001@veli.aat', 'Veli1234');
  await put('idx_kidstaff/72026001', { no: '72026001' }); await put('kidTeachers/72026001', { no: '72026001', name: 'Mamoste Berfîn', area: 'muzik' }); await signUp('72026001@zmamoste.aat', 'Kid12345');
  for (const [who, no, pw, teacher] of [['veli', '92026001', 'Veli1234', false], ['zmamoste', '72026001', 'Kid12345', true]]) for (const w of [390, 1280]) {
    const c = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: 'dark' }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('zarok-lang', 'ku'); } catch (_) {} });
    const p = await c.newPage(); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/zarok/app/?emu=1'); await p.waitForSelector('#l-no', { timeout: 20000 });
    if (teacher) await p.click('.roles button:nth-child(2)');
    await p.fill('#l-no', no); await p.fill('#l-pw', pw); await p.click('.login .btn'); await p.waitForSelector('.top', { timeout: 20000 }); await p.waitForTimeout(1500);
    const add = (lbl, arr) => arr.forEach(x => { const id = x.t + '|' + x.color + '|' + x.bg; (all[id] = all[id] || { ...x, where: [] }).where.push(lbl); });
    add(who + w + '/pano', await p.evaluate(AUDIT)); await p.screenshot({ path: process.env.OUT + '/dz-' + who + '-' + w + '-pano.png' });
    const tabs = await p.evaluate(() => [...new Set([...document.querySelectorAll('[data-tab]')].map(e => e.dataset.tab))]);
    for (const k of tabs) { await p.evaluate(k => { const vis = e => e && e.getClientRects().length; const f = () => [...document.querySelectorAll('[data-tab="' + k + '"]')].find(vis); let el = f(); if (!el) { const pb = document.querySelector('.pano-btn'); if (pb) pb.click(); el = f(); } el && el.click(); }, k); await p.waitForTimeout(900);
      add(who + w + '/' + k, await p.evaluate(AUDIT)); await p.screenshot({ path: process.env.OUT + '/dz-' + who + '-' + w + '-' + k + '.png' }); }
    await c.close();
  }
  fs.writeFileSync(process.env.OUT + '/dark-audit.json', JSON.stringify(Object.values(all), null, 1));
  console.log('BULGU', Object.keys(all).length);
  await b.close(); process.exit(0);
})().catch(e => { console.error('HATA', e); process.exit(1); });
