// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Ekler (Storage, ≤20MB) + seçilen öğrenciye ödev — öğretmen sınıfa ya da yalnız seçtiği öğrencilere ödev gönderir (PDF eki),
//      öğrenciye özel mesaja Word eki ekler; öğrenci ekleri görür/indirir, seçilmeyen öğrenci ödevi görmez; 20MB üstü ve yasak tür reddedilir
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
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' });
  await put('teachers/T50', { id: 'T50', no: '50202601', name: 'Mamoste Şano', area: 'tiyatro' });
  await signUp('50202601@ogretmen.aat', 'Tea12345');
  for (const [i, no, name] of [[1, '20202601', 'Rojîn Aram'], [2, '20202602', 'Baran Şêx']]) {
    await put('idx_students/' + no, { no });
    await put('students/S' + i, { no, name, area: 'tiyatro', fireId: 'S' + i, id: 100 + i });
    await signUp(no + '@ogrenci.aat', 'Stu12345');
  }
  await put('classes/A1', { kind: 'area', name: '1. Sînif', area: 'tiyatro', studentNos: ['20202601', '20202602'], teacherNos: ['50202601'], teacherNames: ['Mamoste Şano'] });

  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const mk = async (w) => { const c = await b.newContext({ viewport: { width: w || 430, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} }); return c; };
  const login = async (ctx, no, pw, role) => {
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
    await p.getByText(role || 'Mamoste', { exact: true }).first().click();
    await p.locator('input.inp').first().fill(no); await p.locator('input[type=password]').first().fill(pw);
    await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(7000); return p;
  };
  const txt = p => p.evaluate(() => document.body.innerText);
  const goA = (pg, k) => pg.evaluate(k => [...document.querySelectorAll('.pano-tile[data-key="' + k + '"],.sm-it[data-key="' + k + '"]')].filter(x => x.getClientRects().length).concat([...document.querySelectorAll('[data-key="' + k + '"]')])[0].click(), k);
  const btnTx = (p, t) => p.evaluate(t => { const e = [...document.querySelectorAll('button')].filter(x => x.offsetParent && x.textContent.includes(t)).pop(); if (!e) throw new Error('düğme yok: ' + t); e.click(); }, t);
  const pdf = { name: 'erk-1.pdf', mimeType: 'application/pdf', buffer: Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(900 * 1024, 32)]) };   // ~900 KB (eski sınırın üstünde)
  const docx = { name: 'not.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: Buffer.from('PK\x03\x04deneme') };
  const big = { name: 'mezin.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(20 * 1024 * 1024 + 100, 32) };
  const exe = { name: 'x.exe', mimeType: 'application/x-msdownload', buffer: Buffer.from('MZ') };

  // ── 1) Öğretmen: yalnız Rojîn'e ödev (PDF eki) ──
  const tp = await login(await mk(), '50202601', 'Tea12345');
  await goA(tp, 'myclass'); await tp.waitForTimeout(1200);
  await btnTx(tp, '1. Sînif'); await tp.waitForTimeout(300);
  ok('Tek sınıf seçilince "Ji kê re?" çıkar', (await tp.locator('[data-post-to]').count()) === 1);
  await tp.click('[data-to="pick"]'); await tp.waitForTimeout(300);
  await tp.locator('[data-pick-st="20202601"] input').check();
  await tp.locator('input[placeholder="Sernav"]').fill('Erka Rojînê');
  await tp.locator('[data-post-attach] input[type=file]').setInputFiles([pdf]);
  await tp.waitForFunction(() => !document.querySelector('[data-att-busy]') && document.body.innerText.includes('erk-1.pdf'), null, { timeout: 30000 }).catch(() => {});
  await tp.locator('[data-post-attach] input[type=file]').setInputFiles([big]); await tp.waitForTimeout(1500);
  await tp.locator('[data-post-attach] input[type=file]').setInputFiles([exe]); await tp.waitForTimeout(800);
  const att1 = await tp.evaluate(() => [...document.querySelectorAll('[data-post-attach] .c-file')].map(x => x.textContent));
  ok('PDF (900 KB) yüklendi; 20 MB üstü ve .exe eklenmedi', att1.length === 1 && att1[0].includes('erk-1.pdf'), JSON.stringify(att1));
  await btnTx(tp, 'Bişîne'); await tp.waitForTimeout(2500);
  const posts = await list('classPosts');
  const P = posts.find(d => d.fields.title && d.fields.title.stringValue === 'Erka Rojînê');
  const fu = P && P.fields.files.arrayValue.values[0].mapValue.fields.url.stringValue;
  ok('Ödev yalnız seçilen öğrenciye (studentNos) ve ek Storage\'da', !!P && JSON.stringify(P.fields.studentNos.arrayValue.values.map(v => v.stringValue)) === '["20202601"]' && /127\.0\.0\.1:9199/.test(fu || ''), fu);
  const dl = fu ? await fetch(fu).then(r => r.ok ? r.arrayBuffer() : null) : null;
  ok('Ek indirilebilir, boyutu doğru', !!dl && dl.byteLength === pdf.buffer.length, dl ? String(dl.byteLength) : '');
  ok('Öğretmenin listesinde "👤 Rojîn Aram" etiketi', (await tp.evaluate(() => [...document.querySelectorAll('[data-post-only]')].map(x => x.textContent).join('|'))).includes('Rojîn Aram'));

  // ── 2) Öğretmen: Baran'a özel mesaj + Word eki ──
  await tp.click('[data-hub-tab="messages"]'); await tp.waitForTimeout(800);
  await btnTx(tp, 'Peyamek Nû'); await tp.waitForTimeout(400);
  await tp.evaluate(() => { const s = [...document.querySelectorAll('select')].find(x => [...x.options].some(o => o.textContent.includes('Baran Şêx'))); const v = [...s.options].find(o => o.textContent.includes('Baran Şêx')).value;
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(s, v); s.dispatchEvent(new Event('change', { bubbles: true })); });
  await tp.locator('input[placeholder="Sernav..."]').fill('Belgeya te'); await tp.locator('textarea').first().fill('Ev belge ji te re ye');
  ok('Öğretmen mesaj ekranında belge ekleme var', (await tp.locator('[data-tmsg-attach] input[type=file]').count()) === 1);
  await tp.locator('[data-tmsg-attach] input[type=file]').setInputFiles([docx]);
  await tp.waitForFunction(() => !document.querySelector('[data-att-busy]') && document.body.innerText.includes('not.docx'), null, { timeout: 30000 }).catch(() => {});
  await tp.evaluate(() => [...document.querySelectorAll('button')].filter(x => x.offsetParent && x.textContent.includes('Bişîne')).pop().click()); await tp.waitForTimeout(2500);
  const M = (await list('messages')).find(d => d.fields.subject && d.fields.subject.stringValue === 'Belgeya te');
  const mu = M && M.fields.attachments.arrayValue.values[0].mapValue.fields.url.stringValue;
  ok('Mesaj Baran\'a gitti, Word eki Storage\'da', !!M && M.fields.recipientNo.stringValue === '20202602' && /127\.0\.0\.1:9199/.test(mu || ''), mu);
  await tp.context().close();

  // ── 3) Öğrenciler ──
  const s1 = await login(await mk(), '20202601', 'Stu12345', 'Xwendekar');
  await goA(s1, 'myclass'); await s1.waitForTimeout(1500);
  const t1 = await txt(s1);
  ok('Rojîn kendisine gönderilen ödevi ve eki görür', t1.includes('Erka Rojînê') && t1.includes('erk-1.pdf'));
  await s1.context().close();
  const s2 = await login(await mk(), '20202602', 'Stu12345', 'Xwendekar');
  await goA(s2, 'myclass'); await s2.waitForTimeout(1500);
  ok('Baran (seçilmeyen) ödevi görmez', !(await txt(s2)).includes('Erka Rojînê'));
  await goA(s2, 'messages'); await s2.waitForTimeout(1500);
  await s2.evaluate(() => { const e = [...document.querySelectorAll('div')].filter(d => d.textContent.includes('Belgeya te') && d.style.cursor === 'pointer').pop(); e.click(); }); await s2.waitForTimeout(800);
  const href = await s2.evaluate(() => { const a = document.querySelector('[data-msg-att] a'); return a ? a.getAttribute('href') : ''; });
  ok('Baran mesajdaki Word ekini görür (indirme bağlantısı)', /127\.0\.0\.1:9199/.test(href) && (await txt(s2)).includes('not.docx'), href);
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
