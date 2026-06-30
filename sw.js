// ══════════════════════════════════════════════
// Akademîya Aram Tîgran — Service Worker
// ══════════════════════════════════════════════
const CACHE = 'aat-cache-v2';
const NOTIF_ICON = 'data:image/png;base64,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';
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
    body: data.body || '', icon: NOTIF_ICON, badge: NOTIF_ICON, tag: 'aat-push',
    data: { url: data.url || './' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url || './'));
});
