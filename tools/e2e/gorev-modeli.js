// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Haftalık değerlendirme + öğretmen kartları — öğretmen öğrencilerini değerlendirir (hatırlatma), yalnız kendi
//      sınıfına dosyasız duyuru gönderir, Sınıfım = ödev/belge + mesaj; öğrenci öğretmenini isimsiz değerlendirir;
//      sorumlu raporlarda iki değerlendirmeyi ve anketi görür; yöneticide öğrenci ayrıntısında gerçek haftalık grafik;
//      öğrenci işlerinde rapor yok.
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

// E2E: Görev modeli — yönetici Çocuk Akademisi genel sorumlusu atar + öğretmeni Zarok'a bağlar; genel sorumlu alan sorumlusu işaretler
(async () => {
  const goA = (pg, k) => pg.evaluate(k => [...document.querySelectorAll('.sm-it[data-key="' + k + '"],.pano-tile[data-key="' + k + '"]')].find(x => x.getClientRects().length).click(), k).then(() => pg.waitForTimeout(1800));
  await put('idx_staff/1000', { no: '1000', lvl: 'admin' }); await put('teachers/TA', { no: '1000', name: 'Rêveber', isAdmin: true, area: 'genel' }); await signUp('1000@ogretmen.aat', 'Admin123');
  await put('idx_staff/96202600', { no: '96202600', lvl: 'head', area: 'genel' }); await put('teachers/TG', { id: 'TG', no: '96202600', name: 'Berpirsê Giştî', isHead: true, area: 'genel' }); await signUp('96202600@ogretmen.aat', 'Head1234');
  await put('idx_staff/50202601', { no: '50202601', lvl: 'teacher' }); await signUp('50202601@ogretmen.aat', 'Tea12345'); await put('teachers/T50', { id: 'T50', fireId: 'T50', no: '50202601', name: 'Mamoste Şano', area: 'tiyatro' });
  await put('idx_staff/50202602', { no: '50202602', lvl: 'teacher' }); await put('teachers/T51', { id: 'T51', fireId: 'T51', no: '50202602', name: 'Mamoste Dengbêj', area: 'muzik' });
  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const getD = async p => { const r = await fetch(`${FS}/${p}`, { headers: H }); return r.ok ? r.json() : null; };
  const waitFor = async (f, ms) => { const t0 = Date.now(); for (;;) { const r = await f(); if (r) return r; if (Date.now() - t0 > (ms || 20000)) return null; await new Promise(r => setTimeout(r, 800)); } };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const login = async (no, pw, role) => { const c = await b.newContext({ viewport: { width: 1280, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} });
    const p = await c.newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/app/?emu=1&dvcut=2000-01-01'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
    await p.getByText(role || 'Mamoste', { exact: true }).first().click();
    await p.locator('input.inp').first().fill(no); await p.locator('input[type=password]').first().fill(pw);
    await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(8000); return p; };
  // Yönetici
  const ap = await login('1000', 'Admin123');
  await goA(ap, 'roles');
  ok('Yönetici panelinde "Peywir" bölümü açılır', (await ap.locator('[data-roles-panel]').count()) === 1);
  await ap.fill('[data-roles-panel] #lv-x, [data-roles-panel] input[placeholder]', 'dengb').catch(() => {});
  await ap.evaluate(() => { const i = document.querySelector('[data-roles-panel] [data-search-select] input'); i.focus(); });
  await ap.waitForTimeout(300);
  await ap.click('[data-roles-panel] [data-ss-item="50202602"]'); await ap.waitForTimeout(2500);
  const cfg = await waitFor(async () => { const d = await getD('config/kidAcademy'); return d && d.fields && d.fields.generalNos ? d : null; });
  ok('Çocuk Akademisi genel sorumlusu kaydedildi (config/kidAcademy.generalNos)', !!cfg && JSON.stringify(cfg.fields.generalNos).includes('50202602'), JSON.stringify(cfg && cfg.fields));
  ok('Genel sorumlu otomatik Zarok öğretmenine bağlandı (kidTeachers + idx_kidstaff)', !!(await getD('kidTeachers/50202602')) && !!(await getD('idx_kidstaff/50202602')));
  await ap.evaluate(() => document.querySelector('[data-kt-toggle="50202601"]').click()); await ap.waitForTimeout(2500);
  ok('Öğretmen Zarok öğretmenliğine bağlandı', !!(await getD('kidTeachers/50202601')) && !!(await getD('idx_kidstaff/50202601')));
  await ap.evaluate(() => document.querySelector('[data-kt-toggle="50202601"]').click()); await ap.waitForTimeout(2500);
  ok('Bağlantı kaldırılınca kidTeachers/idx_kidstaff silinir', !(await getD('kidTeachers/50202601')) && !(await getD('idx_kidstaff/50202601')));
  await ap.evaluate(() => document.querySelector('[data-kgen-rm="50202602"]').click()); await ap.waitForTimeout(2000);
  const cfg2 = await getD('config/kidAcademy');
  ok('Genel sorumlu kaldırılır', !JSON.stringify(cfg2.fields.generalNos).includes('50202602'));
  await goA(ap, 'audit');
  const lg = await waitFor(async () => { const j = await fetch(`${FS}/auditLog?pageSize=50`, { headers: H }).then(r => r.json()); return (j.documents || []).length >= 2 ? j.documents : null; });
  ok('Görev değişiklikleri auditLog\'a yazıldı', !!lg && lg.some(d => d.fields.kind.stringValue === 'role-kidgen'), lg && lg.map(d => d.fields.kind.stringValue).join(','));
  await ap.waitForSelector('[data-audit-row]', { timeout: 8000 }).catch(() => {});
  ok('Yönetici "Qeyda Guhertinan" ekranında kayıtları görür', (await ap.locator('[data-audit-row]').count()) >= 2);
  const [dl] = await Promise.all([ap.waitForEvent('download', { timeout: 30000 }).catch(() => null), ap.evaluate(() => document.querySelector('[data-export-all]').click())]);
  let dj = null; if (dl) { dj = JSON.parse(fs.readFileSync(await dl.path(), 'utf8')); }
  ok('Tüm veriyi indir: JSON dosyası iner, koleksiyonlar içinde', !!dj && !!dj.collections && Array.isArray(dj.collections.teachers) && dj.collections.teachers.length >= 4, dj && Object.keys(dj.collections).length + ' koleksiyon, hata: ' + JSON.stringify(dj.errors));
  await ap.context().close();
  // Genel sorumlu → alan sorumlusu işaretler
  const gp = await login('96202600', 'Head1234');
  await goA(gp, 'areaheads');
  ok('Genel sorumlu "Berpirsên Beşan" bölümünü görür', (await gp.locator('[data-areaheads]').count()) === 1);
  await gp.evaluate(() => document.querySelector('[data-ah-toggle="50202601"]').click());
  const idx = await waitFor(async () => { const d = await getD('idx_staff/50202601'); return d && d.fields.lvl.stringValue === 'head' ? d : null; });
  const td = await getD('teachers/T50');
  ok('Alan sorumlusu işaretlendi (teachers.isHead + idx_staff lvl=head, area)', !!idx && idx.fields.area.stringValue === 'tiyatro' && td.fields.isHead && td.fields.isHead.booleanValue === true);
  await gp.evaluate(() => document.querySelector('[data-ah-toggle="50202601"]').click());
  const back = await waitFor(async () => { const d = await getD('idx_staff/50202601'); return d && d.fields.lvl.stringValue === 'teacher' ? d : null; });
  ok('İşaret kaldırılınca öğretmene döner', !!back);
  await gp.context().close();
  // Hem akademi hem Zarok görevli öğretmen: menüde Zarok geçişi
  await put('idx_kidstaff/50202602', { no: '50202602' }); await signUp('50202602@ogretmen.aat', 'Tea12345');
  const tp = await login('50202602', 'Tea12345');
  ok('Zarok bağlantılı öğretmenin menüsünde Zarok geçişi var', (await tp.locator('[data-role-switch="kid"]').count()) >= 1);
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
