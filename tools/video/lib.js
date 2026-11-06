// Kullanım kılavuzu videoları için ortak yardımcılar (Playwright + emülatör verisi + ekrana altyazı)
// Altyazı sayfanın içine çizilir (Kürtçe üstte, Türkçe altta): video sessizdir.
const { chromium } = require('playwright-core');
const fs = require('fs');
const FBV = require('firebase/package.json').version;
const P = 'aram2026-a9fd7';
const NM = require('path').dirname(require.resolve('firebase/package.json')) + '/../';
const FS = `http://127.0.0.1:8080/v1/projects/${P}/databases/(default)/documents`;
const H = { 'Content-Type': 'application/json', 'Authorization': 'Bearer owner' };
const val = v => v instanceof Date ? { timestampValue: v.toISOString() } : typeof v === 'number' ? { integerValue: String(v) } : Array.isArray(v) ? { arrayValue: { values: v.map(val) } } : typeof v === 'boolean' ? { booleanValue: v } : v && typeof v === 'object' ? { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, val(x)])) } } : { stringValue: String(v) };
const put = (path, obj) => fetch(`${FS}/${path}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, val(v)])) }) }).then(r => { if (!r.ok) throw new Error('seed ' + path + ' ' + r.status); });
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
const CAP_JS = () => {
  if (window.__capInit) return; window.__capInit = true;
  const mk = () => {
    if (document.getElementById('__cap')) return;
    const d = document.createElement('div'); d.id = '__cap';
    d.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:2147483647;padding:10px 14px 14px;background:linear-gradient(transparent,rgba(8,20,24,.92) 30%);color:#fff;text-align:center;font-family:system-ui,sans-serif;pointer-events:none;display:none';
    d.innerHTML = '<div id="__ku" style="font-size:18px;font-weight:800;line-height:1.3"></div><div id="__tr" style="font-size:14.5px;opacity:.88;margin-top:3px;line-height:1.3"></div>';
    document.body.appendChild(d);
    const r = document.createElement('div'); r.id = '__ring'; r.style.cssText = 'position:fixed;z-index:2147483646;border:3px solid #ffb703;border-radius:10px;box-shadow:0 0 0 4px rgba(255,183,3,.35);pointer-events:none;display:none;transition:all .25s';
    document.body.appendChild(r);
  };
  window.__cap = (ku, tr) => { mk(); const d = document.getElementById('__cap'); d.style.display = ku ? 'block' : 'none'; document.getElementById('__ku').textContent = ku || ''; document.getElementById('__tr').textContent = tr || ''; };
  window.__ring = (x, y, w, h) => { mk(); const r = document.getElementById('__ring'); if (!w) { r.style.display = 'none'; return; } r.style.display = 'block'; r.style.left = (x - 6) + 'px'; r.style.top = (y - 6) + 'px'; r.style.width = (w + 12) + 'px'; r.style.height = (h + 12) + 'px'; };
  document.addEventListener('DOMContentLoaded', mk);
};
async function recorder({ out, width, height, name }) {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const ctx = await b.newContext({ viewport: { width, height }, recordVideo: { dir: out, size: { width, height } } });
  await routes(ctx);
  await ctx.addInitScript(() => { try { localStorage.setItem('aat-gdpr-consent', '1'); localStorage.setItem('aat-lang', 'ku'); } catch (_) {} });
  await ctx.addInitScript(CAP_JS);
  const page = await ctx.newPage(); page.on('dialog', d => d.accept());
  const wait = ms => page.waitForTimeout(ms);
  const cap = async (ku, tr) => { await page.evaluate(([a, b2]) => window.__cap && window.__cap(a, b2), [ku, tr]).catch(() => {}); };
  const ring = async (sel) => { const bb = sel ? await page.locator(sel).first().boundingBox().catch(() => null) : null; await page.evaluate(([x, y, w, h]) => window.__ring && window.__ring(x, y, w, h), bb ? [bb.x, bb.y, bb.width, bb.height] : [0, 0, 0, 0]).catch(() => {}); };
  // bir adım: altyazı + (varsa) vurgu + eylem + bekleme
  const step = async (ku, tr, o = {}) => { await cap(ku, tr); if (o.ring) await ring(o.ring); await wait(o.pre == null ? 1800 : o.pre); if (o.act) { try { await o.act(); } catch (e) { console.log('ADIM-HATA:', ku || tr, '→', String(e.message).split('\n')[0].slice(0, 160)); } } await wait(o.post == null ? 1700 : o.post); if (o.ring) await ring(null); };
  const finish = async () => { await cap('', ''); const v = page.video(); await ctx.close(); const p = await v.path(); await b.close(); const dst = out + '/' + name + '.webm'; fs.renameSync(p, dst); return dst; };
  return { page, wait, cap, ring, step, finish };
}
const login = async (page, no, pw, role) => {
  await page.goto('http://localhost:8765/app/?emu=1'); await page.waitForSelector('text=Têkeve', { timeout: 60000 });
  await page.getByText(role || 'Mamoste', { exact: true }).first().click();
  await page.locator('input.inp').first().fill(no); await page.locator('input[type=password]').first().fill(pw);
};
module.exports = { put, signUp, recorder, login, FS, H };
