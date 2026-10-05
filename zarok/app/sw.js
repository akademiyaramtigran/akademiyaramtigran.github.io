// Akademiya Zarokan (Konservatuara Aram Tîgran) — veli/öğretmen uygulaması Service Worker (kapsam: bu klasör)
const CACHE = 'zarok-v25';
const SHELL = ['./', './index.html', './manifest.webmanifest', './vendor/jsQR.js', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('zarok-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Firebase / Google API istekleri önbelleğe alınmaz
  if (/googleapis\.com|firebaseio\.com|firebasestorage|cloudfunctions/.test(url.hostname)) return;
  // Sayfa: önce ağ, çevrimdışıysa önbellek
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put('./index.html', c)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // Diğerleri (ikon, SDK, yazı tipi): önbellek, arkada yenile
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
// Uygulama açıkken gelen yoklama bildirimi (sayfa postMessage ile ister)
self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.type === 'notify') self.registration.showNotification(d.title || 'Akademiya Zarokan', { body: d.body || '', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: d.tag || 'zarok' });
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow('./')));
});
