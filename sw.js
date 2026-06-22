// ══════════════════════════════════════════════
// Akademîya Aram Tîgran — Service Worker
// ══════════════════════════════════════════════
const CACHE = 'aat-cache-v1';
const OFFLINE_PAGE = './';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Sadece GET isteklerini cache'le / yönet
  if (e.request.method !== 'GET') return;

  // CDN kaynakları (React, Babel, jsQR) — cache first
  if (url.includes('cdnjs.cloudflare.com') || url.includes('cdn.jsdelivr.net')) {
    e.respondWith(
      caches.match(e.request).then(r => r ||
        fetch(e.request).then(resp => {
          if (resp.ok) { const clone = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, clone)); }
          return resp;
        })
      )
    );
    return;
  }

  // Ana sayfa (HTML) — network first, offline fallback
  if (e.request.mode === 'navigate' || url.endsWith('/') || url.includes('.html')) {
    e.respondWith(
      fetch(e.request).then(resp => {
        if (resp.ok) { const clone = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, clone)); }
        return resp;
      }).catch(() => caches.match(OFFLINE_PAGE).then(r => r || caches.match(e.request)))
    );
    return;
  }

  // Diğer kaynaklar — stale-while-revalidate
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(resp => {
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'Akademîya AT', body: 'Agahdarîyek nû heye' };
  e.waitUntil(self.registration.showNotification(data.title || 'Akademîya AT', {
    body: data.body || '', icon: '/favicon.ico', badge: '/favicon.ico', tag: 'aat-push',
    data: { url: data.url || './' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url || './'));
});
