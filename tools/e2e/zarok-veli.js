// Uçtan uca test — çalıştırma: tools/README.md → "E2E"
// E2E: zarok/app (?emu=1) ↔ Firebase Auth + Firestore emülatörleri (gerçek kurallar)
const { chromium } = require('playwright-core');
const fs = require('fs');
const FBV = require('firebase/package.json').version; // yerel SDK sürümü (CDN istekleri buna yönlendirilir)
const P = 'aram2026-a9fd7';
const FBDIR = require('path').dirname(require.resolve('firebase/package.json')) + '/';
const FS = `http://127.0.0.1:8080/v1/projects/${P}/databases/(default)/documents`;
const H = { 'Content-Type': 'application/json', 'Authorization': 'Bearer owner' };
const val = v => v instanceof Date ? { timestampValue: v.toISOString() } : Array.isArray(v) ? { arrayValue: { values: v.map(val) } } : typeof v === 'boolean' ? { booleanValue: v } : typeof v === 'number' ? { integerValue: String(v) } : { stringValue: String(v) };
const put = (path, obj) => fetch(`${FS}/${path}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, val(v)])) }) }).then(r => { if (!r.ok) throw new Error('seed ' + path + ' ' + r.status); });
const getDocs = path => fetch(`${FS}/${path}`, { headers: H }).then(r => r.json());
const signUp = (email, password) => fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=x', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) }).then(r => r.json());

(async () => {
  const today = new Date().toISOString().slice(0, 10), dow = new Date().getDay();
  await put('idx_guardians/92026001', { no: '92026001' });
  await put('guardians/92026001', { no: '92026001', name: 'Leyla Aram', phone: '0555' });
  await put('kids/K1', { no: '82026001', name: 'Rojda', area: 'muzik', guardianNos: ['92026001'], pickups: [], consentPhoto: false, consentShare: false, health: '' });
  await put('kids/K2', { no: '82026002', name: 'BaşkaZarok', area: 'dans', guardianNos: ['92026099'] });
  await put('kidSchedule/S1', { day: dow, start: '14:00', end: '15:30', title: 'Muzîka Zarokan', area: 'muzik', teacher: 'Hêvî', room: 'A2' });
  await put('kidAnnouncements/N1', { title: 'Şahiya demsalê', body: 'Şemî saet 15:00', createdAt: new Date() });
  await signUp('92026001@veli.aat', 'Veli1234');
  await signUp('92026055@veli.aat', 'Veli1234');   // dizinde YOK → sahte veli
  const out = [];
  const ok = (name, cond, extra) => out.push((cond ? '✅ ' : '❌ ') + name + (extra ? ' — ' + extra : ''));

  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/^https:\/\/www\.gstatic\.com\/firebasejs\/([\d.]+)\/(firebase-[a-z-]+\.js)$/, (route) => {
    const m = route.request().url().match(/firebasejs\/([\d.]+)\/(firebase-[a-z-]+\.js)$/);
    if (m[1] !== FBV) return route.fulfill({ contentType: 'application/javascript', body: `export * from "https://www.gstatic.com/firebasejs/${FBV}/${m[2]}";` });
    route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(FBDIR + m[2]) });
  });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const login = async (no, pw) => { await p.goto('http://localhost:8765/zarok/app/?emu=1'); await p.waitForSelector('#l-no', { timeout: 20000 }); await p.fill('#l-no', no); await p.fill('#l-pw', pw); await p.click('.login .btn'); };

  // 1) Sahte veli (dizinde yok) → reddedilir
  await login('92026055', 'Veli1234'); await p.waitForTimeout(2500);
  ok('Dizinde olmayan veli giremez', (await p.locator('.err').textContent()).length > 5, await p.locator('.err').textContent());
  // 2) Yanlış şifre
  await login('92026001', 'yanlis'); await p.waitForTimeout(2000);
  ok('Yanlış şifre reddedilir', /xelet/i.test(await p.locator('.err').textContent()));
  // 3) Gerçek veli
  await login('92026001', 'Veli1234'); await p.waitForSelector('.status', { timeout: 20000 });
  const body = await p.evaluate(() => document.body.innerText);
  ok('Veli girer, kendi çocuğunu görür', body.includes('Rojda'));
  ok('Başka ailenin çocuğu görünmez', !body.includes('BaşkaZarok'));
  ok('Bugünkü ders görünür', body.includes('Muzîka Zarokan'));
  ok('Duyuru görünür', body.includes('Şahiya demsalê'));
  // 4) Canlı yoklama → bildirim
  await put('kidAttendance/A1', { kidId: 'K1', kidNo: '82026001', kidName: 'Rojda', guardianNos: ['92026001'], type: 'in', date: today, time: new Date().toISOString() });
  await p.waitForTimeout(2500);
  const t1 = await p.locator('.toast').textContent().catch(() => '');
  ok('Öğretmen "geldi" işaretleyince veliye anında bildirim', /Rojda/.test(t1), t1);
  ok('Durum kartı "Di dersê de ye"', (await p.locator('.status').textContent()).includes('Di dersê de'));
  // 5) Mesaj gönder
  await p.click('.nav button:nth-child(5)'); await p.fill('#m-text', 'Silav ji E2E'); await p.click('main .btn'); await p.waitForTimeout(1500);
  const msgs = await getDocs('kidMessages');
  const mine = (msgs.documents || []).find(d => d.fields.text && d.fields.text.stringValue === 'Silav ji E2E');
  ok('Mesaj Firestore\'a veli numarasıyla yazılır', mine && mine.fields.guardianNo.stringValue === '92026001');
  await put('kidMessages/R1', { guardianNo: '92026001', text: 'Bersiva akademiyê', from: 'staff', read: false });
  await p.waitForTimeout(1500);
  ok('Akademinin yanıtı veliye düşer', (await p.evaluate(() => document.body.innerText)).includes('Bersiva akademiyê'));
  // 6) İzinler: teslim listesi
  await p.click('.iconbtn'); await p.fill('#s-pick', 'Xalê Rênas'); await p.click('.sheet .btn.sm >> text=Zêde bike'); await p.waitForTimeout(1500);
  const k1 = await getDocs('kids/K1');
  ok('Teslim listesi çocuğun kaydına yazılır', JSON.stringify(k1.fields.pickups || {}).includes('Xalê Rênas'));
  // 7) Çıkış
  await p.click('.sheet .btn >> text=Derkeve'); await p.waitForSelector('#l-no', { timeout: 10000 });
  ok('Çıkış yapılır', true);
  ok('Sayfa hatası yok', errs.length === 0, errs.join(' | '));
  console.log(out.join('\n'));
  await b.close(); process.exit(0);
})().catch(e => { console.error('E2E HATA', e); process.exit(1); });
