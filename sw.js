const CACHE='aat-v4';
const OFFLINE_PAGE='./';

// Önbelleğe alınacak kaynaklar
const PRECACHE=[
  './',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.22.5/babel.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js',
];

// Firebase — sadece network (realtime veri)
const BYPASS=[
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'firebaseio.com',
];

self.addEventListener('install', e=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>
      Promise.allSettled(PRECACHE.map(url=>
        c.add(url).catch(()=>{})
      ))
    ).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>
      Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))
    ).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', e=>{
  const url = e.request.url;

  // Firebase realtime — her zaman network
  if(BYPASS.some(b=>url.includes(b))) return;

  // Google Fonts CSS — network first, cache fallback
  if(url.includes('fonts.googleapis.com')||url.includes('fonts.gstatic.com')){
    e.respondWith(
      fetch(e.request).then(r=>{
        const clone=r.clone();
        caches.open(CACHE).then(c=>c.put(e.request,clone));
        return r;
      }).catch(()=>caches.match(e.request)||new Response(''))
    );
    return;
  }

  // CDN kaynakları (React, Babel, jsQR) — cache first
  if(url.includes('cdnjs.cloudflare.com')||url.includes('cdn.jsdelivr.net')){
    e.respondWith(
      caches.match(e.request).then(r=>r||
        fetch(e.request).then(resp=>{
          if(resp.ok){ const clone=resp.clone(); caches.open(CACHE).then(c=>c.put(e.request,clone)); }
          return resp;
        })
      )
    );
    return;
  }

  // Ana sayfa (HTML) — network first, offline fallback
  if(e.request.mode==='navigate'||url.endsWith('/')||url.includes('.html')){
    e.respondWith(
      fetch(e.request).then(resp=>{
        if(resp.ok){ const clone=resp.clone(); caches.open(CACHE).then(c=>c.put(e.request,clone)); }
        return resp;
      }).catch(()=>caches.match(OFFLINE_PAGE)||caches.match('./'))
    );
    return;
  }

  // Diğer kaynaklar — stale-while-revalidate
  e.respondWith(
    caches.match(e.request).then(cached=>{
      const fetchPromise = fetch(e.request).then(resp=>{
        if(resp.ok&&e.request.method==='GET'){
          const clone=resp.clone();
          caches.open(CACHE).then(c=>c.put(e.request,clone));
        }
        return resp;
      });
      return cached||fetchPromise;
    }).catch(()=>{})
  );
});
self.addEventListener('push', e=>{
  const data = e.data ? e.data.json() : {title:'Akademîya AT', body:'Agahdarîyek nû heye'};
  e.waitUntil(self.registration.showNotification(data.title||'Akademîya AT', {
    body: data.body||'', icon: '/favicon.ico', badge: '/favicon.ico', tag: 'aat-push',
    data: { url: data.url||'./' }
  }));
});
self.addEventListener('notificationclick', e=>{ e.notification.close(); e.waitUntil(clients.openWindow(e.notification.data.url||'./')); });