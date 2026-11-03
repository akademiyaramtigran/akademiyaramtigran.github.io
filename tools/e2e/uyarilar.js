// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: Uyarı merkezi — bir derste ≥3 devamsızlık (izinli/geç sayılmaz) ve 5/10 altı değerlendirme (öğretmen→öğrenci, öğrenci→öğretmen isimsiz)
//      bölüm sorumlusu yalnız kendi bölümünü, yönetici hepsini görür; "ilgilenildi" + not; yeni devamsızlıkta uyarı yeniden açılır
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
  const pad = n => String(n).padStart(2, '0'), ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const day = k => { const d = new Date(); d.setDate(d.getDate() - k); return ymd(d); };
  await put('idx_staff/1000', { no: '1000', lvl: 'admin' }); await put('teachers/TA', { no: '1000', name: 'Rêveber', isAdmin: true, area: 'genel' }); await signUp('1000@ogretmen.aat', 'Admin123');
  await put('idx_staff/96000001', { no: '96000001', lvl: 'head', area: 'tiyatro' });
  await put('teachers/H1', { id: 'H1', no: '96000001', name: 'Berpirsa Şanoyê', area: 'tiyatro', isHead: true });
  await signUp('96000001@ogretmen.aat', 'Head1234');
  await put('teachers/T50', { id: 'T50', no: '50202601', name: 'Mamoste Şano', area: 'tiyatro' });
  await put('students/S1', { no: '20202601', name: 'Rojîn Aram', area: 'tiyatro', fireId: 'S1', id: 101 });
  await put('students/S2', { no: '20202602', name: 'Baran Şêx', area: 'tiyatro', fireId: 'S2', id: 102 });
  await put('students/S3', { no: '20202603', name: 'Jîyan Roj', area: 'muzik', fireId: 'S3', id: 103 });
  await put('schedule/L1', { id: 'L1', fireId: 'L1', area: 'tiyatro', name: 'Şano 1', lessonType: 'main', day: 'Dûşem', start: '09:00', end: '10:00', teacherNo: '50202601', teacherName: 'Mamoste Şano' });
  await put('schedule/LM', { id: 'LM', fireId: 'LM', area: 'muzik', name: 'Piyano', lessonType: 'main', day: 'Dûşem', start: '11:00', end: '12:00' });
  const rec = o => ({ mapValue: { fields: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { stringValue: v }])) } });
  const putAtt = (id, lid, date, r) => fetch(`${FS}/attendance/${id}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: { lessonId: { stringValue: lid }, date: { stringValue: date }, records: rec(r) } }) });
  // Rojîn: Şano 1'de 3 kez gelmedi; Baran: 2 gelmedi + 1 izinli + 1 geç → uyarı yok; Jîyan (müzik): 3 kez
  await putAtt('L1-a', 'L1', day(21), { '101': 'off', '102': 'off', '103': 'on' });
  await putAtt('L1-b', 'L1', day(14), { '101': 'off', '102': 'leave' });
  await putAtt('L1-c', 'L1', day(7), { '101': 'off', '102': 'late' });
  await putAtt('L1-d', 'L1', day(6), { '101': 'on', '102': 'off' });
  for (const k of [20, 13, 6]) await putAtt('LM-' + k, 'LM', day(k), { '103': 'off' });
  // Değerlendirmeler (1–5 → ×2): Rojîn 2 → 4/10 (uyarı), Baran 4 → 8/10 (yok); öğretmene 2 → 4/10 (uyarı, isimsiz)
  const ev = (o) => ({ fields: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'object' ? { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([a, b]) => [a, { integerValue: String(b) }])) } } : { stringValue: v }])) });
  const putJ = (path, o) => fetch(`${FS}/${path}`, { method: 'PATCH', headers: H, body: JSON.stringify(ev(o)) });
  const WK = day(10);
  // Sorumlunun formu (öğretmen → öğrenci / öğrenci → öğretmen) yanıtları — eski haftalık değerlendirme kaldırıldı
  const enc = v => typeof v === 'number' ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }) : typeof v === 'object' ? { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)])) } } : { stringValue: String(v) };
  const efr = (id, o) => { const { note, ...r } = o; return fetch(`${FS}/evalResponses/${id}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: enc({ formId: 'FU', period: WK, academy: 'aat', answers: { q1: o.score10, ...(note ? { q2: note } : {}) }, ...r }).mapValue.fields }) }); };
  await efr('E1', { raterNo: '50202601', raterRole: 'teacher', targetNo: '20202601', targetName: 'Rojîn Aram', area: 'tiyatro', direction: 't2s', score10: 4, note: 'Kêm beşdar dibe' });
  await efr('E2', { raterNo: '50202601', raterRole: 'teacher', targetNo: '20202602', targetName: 'Baran Şêx', area: 'tiyatro', direction: 't2s', score10: 8 });
  await efr('T1', { raterNo: '20202602', raterRole: 'student', targetNo: '50202601', targetName: 'Mamoste Şano', area: 'tiyatro', direction: 's2t', score10: 4, note: 'Ders zor' });


  // Çocuk akademisi (Drama): KS1 haftalık ders; Dilan 3 ders gününde gelmedi (Azad geldi → ders yapıldı); düşük değerlendirmeler
  const YR = String(new Date().getFullYear());
  await put('idx_staff/96202602', { no: '96202602', lvl: 'head', area: 'drama' });
  await put('teachers/TH2', { id: 'TH2', no: '96202602', name: 'Berpirsa Dramayê', isHead: true, area: 'drama' });
  await signUp('96202602@ogretmen.aat', 'Head1234');
  const K1 = '8' + YR + '501', K2 = '8' + YR + '502';
  await put('kids/KD1', { no: K1, name: 'Dilan Aram', area: 'drama', guardianNos: ['9' + YR + '501'] });
  await put('kids/KD2', { no: K2, name: 'Azad Şêx', area: 'drama', guardianNos: ['9' + YR + '502'] });
  await put('kidClasses/KC', { kind: 'area', name: '1. Sînif', area: 'drama', studentNos: [K1, K2] });
  const old = new Date(); old.setDate(old.getDate() - 30);
  await put('kidSchedule/KS1', { title: 'Drama', day: new Date(day(7) + 'T12:00:00').getDay(), start: '10:00', end: '11:00', area: 'drama', classId: 'KC', teacher: 'Mamoste Berfîn', createdAt: old });
  for (const k of [21, 14, 7]) await put('kidAttendance/A' + k, { kidId: 'KD2', kidNo: K2, kidName: 'Azad Şêx', type: 'in', date: day(k) });
  // Çocuk Akademisi: sorumlunun formu yanıtları (öğretmen → çocuk, veli → öğretmen isimsiz); eski haftalık değerlendirme yok
  const kefr = (id, o) => fetch(`${FS}/evalResponses/${id}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: enc({ formId: 'FK', period: WK, academy: 'kid', answers: { q1: o.score10 }, ...o }).mapValue.fields }) });
  await kefr('KE1', { raterNo: '72026001', raterRole: 'kidteacher', targetNo: K2, targetName: 'Azad Şêx', area: 'drama', direction: 't2k', score10: 3 });
  await kefr('KT1', { raterNo: '9' + YR + '501', raterRole: 'guardian', targetNo: '72026001', targetName: 'Mamoste Berfîn', area: 'drama', direction: 'g2t', score10: 4 });

  const out = []; const ok = (n, c, x) => { const l = (c ? '✅ ' : '❌ ') + n + (x ? ' — ' + x : ''); out.push(l); console.log('STEP ' + l); };
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const errs = [];
  const mk = async () => { const c = await b.newContext({ viewport: { width: 1280, height: 900 } }); await routes(c);
    await c.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} }); return c; };
  const login = async (no, pw) => { const p = await (await mk()).newPage(); p.on('pageerror', e => errs.push(no + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.goto('http://localhost:8765/app/?emu=1'); await p.waitForSelector('text=Têkeve', { timeout: 60000 });
    await p.getByText('Mamoste', { exact: true }).first().click();
    await p.locator('input.inp').first().fill(no); await p.locator('input[type=password]').first().fill(pw);
    await p.getByText('Têkeve', { exact: true }).last().click(); await p.waitForTimeout(7000); return p; };
  const keys = p => p.evaluate(() => [...document.querySelectorAll('[data-alert]')].map(e => e.dataset.alert).sort());

  // 1) Bölüm sorumlusu (Tiyatro)
  const hp = await login('96000001', 'Head1234');
  const badge = await hp.evaluate(() => { const e = document.querySelector('.sm-it[data-key="alerts"]'); return e ? e.innerText.replace(/\D+/g, ' ').trim() : null; });
  await hp.evaluate(() => document.querySelector('.sm-it[data-key="alerts"]').click()); await hp.waitForTimeout(2000);
  const k1 = await keys(hp);
  // Rozet = açık uyarı sayısı. Uyarı türleri: aylık analiz (man_) + bir derste 3 devamsızlık (abs_); anlık değerlendirme uyarısı YOK
  ok('Sorumluda "Hişyarî" menüsü ve rozet (açık uyarı sayısı; aylık analiz dışında yalnız 3 devamsızlık uyarısı)', badge !== null && new RegExp('\\b' + k1.length + '\\b').test(badge) && k1.filter(k => !k.startsWith('man_') && !k.startsWith('noatt_')).length === 1, badge + ' · ' + JSON.stringify(k1));
  // ⚠ Yoklama girilmedi: son 14 günde (bugün hariç) Şano 1'in pazartesileri, yoklaması olmayanlar
  const ymdL = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const has = new Set([day(21), day(14), day(7), day(6)]);
  const expNo = []; for (let i = 1; i <= 14; i++) { const d = new Date(); d.setDate(d.getDate() - i); if (d.getDay() === 1 && !has.has(ymdL(d))) expNo.push('noatt_L1_' + ymdL(d)); }
  const gotNo = k1.filter(k => k.startsWith('noatt_')).sort();
  ok('⚠ Yoklama girilmedi uyarısı: Şano 1 pazartesileri (yoklaması olmayanlar); müzik dersi sorumluda yok', JSON.stringify(gotNo) === JSON.stringify(expNo.sort()) && !k1.some(k => k.startsWith('noatt_LM')), JSON.stringify(gotNo) + ' / beklenen ' + JSON.stringify(expNo));
  if (expNo.length) {
    await hp.click('[data-alert-fix="' + expNo[0] + '"]'); await hp.waitForTimeout(800);
    ok('Uyarıdan elle yoklama ekranı açılır (tiyatro öğrencileri)', (await hp.locator('[data-att-fix] [data-fix-row]').count()) === 2);
    await hp.click('[data-fix-row="20202601"] [data-fv="on"]'); await hp.click('[data-fix-save]'); await hp.waitForTimeout(2500);
    ok('Yoklama girilince uyarı kendiliğinden kapanır', !(await keys(hp)).includes(expNo[0]));
  }
  ok('Rojîn: Şano 1 dersinde 3 devamsızlık uyarısı', k1.includes('abs_20202601_L1'), JSON.stringify(k1));
  ok('Baran uyarıya düşmez (2 gelmedi; izinli ve geç sayılmaz)', !k1.some(k => k.startsWith('abs_20202602')));
  ok('Başka bölüm (müzik) öğrencisi sorumlunun uyarılarında yok', !k1.some(k => k.includes('20202603')));
  ok('Tek değerlendirme formu 5/10 altı olsa da ANLIK uyarı yok (aylık analizde değerlendirilir)', !k1.some(k => k.startsWith('efr_')), JSON.stringify(k1));
  ok('Uyarı süzgecinde değerlendirme türleri yok (aylık analiz + devamsızlık)', (await hp.locator('[data-alert-kind="sev"],[data-alert-kind="tev"]').count()) === 0 && (await hp.locator('[data-alert-kind="man"]').count()) === 1 && (await hp.locator('[data-alert-kind="abs"]').count()) === 1);
  // İlgilenildi + not
  await hp.click('[data-alert-ack="abs_20202601_L1"]'); await hp.waitForTimeout(300);
  await hp.fill('[data-alert-note]', 'Veliyle görüşüldü');
  await hp.evaluate(() => [...document.querySelectorAll('button')].filter(x => x.offsetParent && x.textContent.includes('Tomar bike')).pop().click()); await hp.waitForTimeout(2000);
  const ack = await fetch(`${FS}/alertAcks/abs_20202601_L1`, { headers: H }).then(r => r.json());
  ok('"İlgilenildi" kaydedildi (not + sayı 3)', ack.fields && ack.fields.note.stringValue === 'Veliyle görüşüldü' && ack.fields.count.integerValue === '3');
  ok('İşaretlenen uyarı açıklardan çıktı', !(await keys(hp)).includes('abs_20202601_L1'));
  // Yeni devamsızlık → yeniden açılır
  await putAtt('L1-e', 'L1', day(1), { '101': 'off' }); await hp.waitForTimeout(2500);
  ok('Yeni devamsızlıkta uyarı yeniden açıldı (3 → 4)', (await keys(hp)).includes('abs_20202601_L1') && (await hp.evaluate(() => document.querySelector('[data-alert="abs_20202601_L1"]').innerText)).includes('3 → 4'));
  await hp.context().close();

  // 1b) Çocuk akademisi sorumlusu (Drama)
  const kp = await login('96202602', 'Head1234');
  await kp.evaluate(() => document.querySelector('.sm-it[data-key="alerts"]').click()); await kp.waitForTimeout(2500);
  const k3 = await keys(kp);
  ok('Çocuk: Dilan Drama dersinde 3 gün gelmedi → uyarı; Azad uyarısız', k3.includes('kabs_' + K1 + '_KS1') && !k3.some(k => k.startsWith('kabs_' + K2)), JSON.stringify(k3));
  ok('Çocuk: tek değerlendirme 5/10 altı olsa da anlık uyarı yok', !k3.some(k => k.startsWith('efr_')), JSON.stringify(k3));
  ok('Çocuk sorumlusu ana akademi uyarılarını görmez', !k3.some(k => k.startsWith('abs_')));
  await kp.context().close();

  // 2) Yönetici: tüm bölümler
  const ap = await login('1000', 'Admin123');
  await ap.evaluate(() => document.querySelector('.sm-it[data-key="alerts"],.pano-tile[data-key="alerts"]').click()); await ap.waitForTimeout(2000);
  const k2 = await keys(ap);
  ok('Yönetici müzik öğrencisinin uyarısını da görür', k2.includes('abs_20202603_LM') && k2.includes('abs_20202601_L1'), JSON.stringify(k2));
  ok('Yönetici çocuk akademisi uyarılarını da görür', k2.includes('kabs_' + K1 + '_KS1') && !k2.some(k => k.startsWith('efr_')));
  ok('Sayfa hatası yok', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(out.join('\n')); await b.close(); process.exit(out.some(l => l.startsWith('❌')) ? 1 : 0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
