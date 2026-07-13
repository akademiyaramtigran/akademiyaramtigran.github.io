// ══════════════════════════════════════════════
// Akademîya Aram Tîgran — Service Worker
// ══════════════════════════════════════════════
const CACHE = 'aat-cache-v6';
const NOTIF_ICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAMAAABlApw1AAADAFBMVEX///88Cjs9CDz8+/z9/v47CTz9/P48Cj3+//78/fw8Cjw8CTz+/f4+DD3//v89Bz4zADQ9Cz48CD08Bzw9CD09CT0wAC49Cjw/CkD9/Pw8Bj0+CT0/DT89Cz0+Cz89Bj0wADEvAC0wADIsASs+CD8yADNAC0D//v0yADD08vT8/PwzADM8Cj37+fo1ATP6+Pk6Bjs2ATcyADIuADA0ADU7Cjw5BTk3Bjg9CT4wADAsAC42ADX8/f38+vtrR2r49vctACwkACM7Bzo3AjlACEA9BD3//v////44ATqfiJ8oACk3BzaXf5dZMFjSyNHg2eDv6+7i2uE4AjcgACA7CT1AEUDp5enk3uQuAC68rbzs5+w7BDy6qbmtmqwlACYoACY+Bzz28/XEt8Tw7fDXztc+BD1IH0gvAC9FHUbIu8i0o7NCFENKHUnd1Nzz8PNBCkLOwsxdNl3n4ecqACu2p7ZHGUj49/gqACn+/fxRJ1Hu6e5sS2zm4OWbhptZNFvDtcIcABtgOmB3WniTeZPUy9Q0BDTf1954V3fGucZPJE9TLFTPxM9ADkGDaYN9XXzo4+iPdY9EGEXZ0NloRGizoLJBE0B+YH1dOVx5XHpmQWfy8PHd1tw5CTlWK1Q9ED6nlKdvS2+9sLzVzNVlP2TUydSSd5HLv8v9/PvIv8lhPmLn4+Y7DTyYg5iNcI3NxM2Ga4dpRWhOIk03EDe4qLiKcYltR2xCGEFMHkxFE0RULVOqlqpCC0M2BDaijqKEZIM4CjhWMlbKvMmCYYFjO2KIbIexnrB1VHY/FUGgjKHi3eJxTXDBs8FuTm1cMVuAY4AzBjGPdo3b09qPeJB7W3vs5OvArr6WfJabg5uqlKmvn69PKE6unK7Qxs+qmKpUKFNXLVdxUXJKIkyUfZOiiqE8ETt1UnKljaOagprAscBGDUZkQ2QzAjJGFkaKbohCEEGmkqYzDDQ8Gz3b0ds7CDnX0tediJxdPl1iQWSdhJyNdI5xSW4xBTFnS2lPLk8vCS+gkaAVWJuIAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAQfUlEQVR42u2deVRT19bAd5Kb5mtmMhAuxCRACHBZDIEAARJmF4OiCCoCgjMIIg44oOIszrPiVOfpaZ3qPFat1ql1tg5Va219bW1ta4fX8Q3fdxLEKibh/vG83Put7OUfCq5wfufsvc/e++xzAHCLW9ziFre4xS1ucYtb3OKW1ypYRmjlxcOHv7gpxjBGjh+KEpP9ioul5d8xEgADzjfxR42mEP3RmrGAMw+AgHvJX5vOvndneL/0b4eCkGnjF2OwIc84LhSD3scGhbRHPAwTIXQd0NY3C0ZY4QNp5uFwYJoZWGDq7H4hvQHnwD3Pr0M2M84KLNA3ul/cdMCF8HZ//3/eR19gGsC1bW2jHiPdx2Dq0/uM0yBkA0MH9JN2Bytm38YYNX5MiHM4HJiHAI4ABzCLNdxqETIEAcMJ/JkKdeyiD7gO4c+/QxBCMd31nmOfZmvXwYvbz100Qy5JPzRqVE7i3Ktrxr9V3QhBY1PGCAzEkPveL5OGHKjXJQeYjDK5xjuvPuSJb41v/YlRY652L0B8FgKjqepkADb1/JiqY55BphizRq3xaCMQcKN5PA8PtVrtIcsLiC/v8lvWNRz9VxqOH3n7PmcW8aJCMtPT0730eolE4iPgCthNotB7eWk8ik1xPyd2Dwc8kH6BW+72siipxOClVCgkCrZMIBcIBHyegK1iK2VI2AqFTC5XagzaIM+cYYFYLc3mHwo/i0/z8JBF8wVIaaK5PB7640iiO2u8TLqzRfTalzGYH5+WrpVI0MRzO/NcCJfLVfTUDyo//Da8Qaeg4frI9HRvuYzbWSDguZRoLpet0JqPlv9Ko+iUgMJ4vQQpD5fLIyF8gUKrHYRyNII2+iMeJ5W0ZbMFpMbP49kAJJmfBdNlCSwwcGXbtgiASxKArZBotfrYDnRJEHCYHqlvi1wnj+QCsNH4JV6m7nTRIdsKeEskSiVJADZbn55uOBr5mDZGYIEl2YPSSQ6fp2SbjQF+fk/2J9HGDWGwYm1pVEREBJlF4HJl8iFjJk2+mUSjFAcnsIr9xRGp5AD0Ce/ZzJc2tTqMgypWK9b92VMuF5AC8ApaAknh4VYOgVtan0JoC+5/2rQ72V8ql5OyAa657Yl/PI+EUJZmacUsDUfjCO6+Vj3S/9iDDRE2AH6LAJ1lXsZFmzbdflo5fuPQXo0fg2Otk4Ch4V+4/aA8O3rI1Qq4rfN6Zfx8BzwKtrk4OaU0O7vbk2OHViV+V7IxyfZZrZM/bjy1Lb9mxncbQ8UQ/JnRrGSRAJApi4dvXbR84ri7C7ZFlaakZLdbtasiHChWJNvwQx8nevZomLSuGsQZodDbz8tb2Xy8fAcEAo1pP2BiqA3uem3zsK+mfcofWRp2+ialTtU2/OrFl1L8Tx8ZitJ4pMIEvBvl5S0jZ8T6sMGoWNQkSdeOfPG9p+dVKrN3DHrd+WzCf5Z0IJpqDBzYRxpANih+DhBiMSa0EITNjgKh0yl5j0oKPU/SnYP55/54C50ANFVICDirQwB8MgCdvUwv1toxC8cC4uU1a6mafrAU3p1Q9uVowGqJF8KhxACN96vxKN/hVixfOfCllFgI1avKH1ITt1lg/dYJ/c/0alZiw2C5VONNKh5FwZCXbtiLkSjGgcmRfkcoMV5YscP/77+sAOzl6hryqBNNZG2A29kQ/9ULVmzB4dETv8PBFEw/DhVl2cc/aowfXhTkwzeEeMnJZQRcriH+j+cAaFKI62EB56ZQkbv3+qN01eDms//MBi6ifYBHGmDyMwDbZ01NLC+fufD114k48NPM/PeTwGF5GUNGTBaAJ1DH37afGnAsGPT56lBy7OXc158fc+DDH/7T3aZGDsePTTTpyQPo3oVwjq2U3TWrqsex/YNtzuG1Z+7D4vv3RcdFTnKyXqPSzKQBNH5rbCrUde+Nhvx//jmdAEvt69f/7jVlnV5wHc2Pw+rUxQrvJh13PX4Z26A7n/T488Rvu6WcmLYZbSwEBZWTjSdOTAGr87R+fZpERhrAXDy8ShqV7X9w/lsInkNFGJc0LvuO0/m3V1bk3mQBlGylXpsZELu8JBcZMkXFrbEpJ0e4CHhRcHowk5QRs/gsdNqhNy1YVoE3ZnSUSG5Z9nYXC2DTsctRBjI5Md8GYDZd7gNianSnUYZ1S9vp0lNbYIqP1odERsznowXwkfaGUJzKFOy47+xrrrZKDEXEYyJ9+CwSa6BCGhRGdWF3vzTGxY+055fdq9LYpAC4AnNMwzyK2592PJFmQajj74lRglb98RBTjJytIgUg9zLlhFJcV+xQn1l2AayOlIioheCnM3x7xMq95TxyK2DQXaT8iO+reN3JAjRrBOflciBSnqSSByG+9ctm3TWa+Sw+KYBun1NdWcfgzvcpBx4NxZraOQgCR4ICU7wwJ9IUeXoWwCcBBh6fXDRdPozyowELFHy3Z8KVIfP3dpiX9NeXA8dPjMzTzxz2xoips7KKfUgBdOZJVqLaaKDQYqHSDtAPm/d0kSg7pUe73UunbXq3cvrmwR0+XJtgPDooYsOpiVWGPKlW67AS98pBqyBmQVFjWCum0pfag5Y+s0p2fJDzbWpQj5SgvISYPGlYSEgk+sdIXZ7ZrO3poyRlAxHn5qGWqNEd60ZQ60wtTblYdcH6is1Zh/SDElbeuP37lyWVhdO33N/YcXKQhisgU5kzXqqrnLT0btkP/ddYgeJWVpxDCDNsRr13hjYvJLHDX+4cFRf9DSQOWrlcQUzD3W+29y4o2vLrhH2t0TJh4cCFxHi/uEuPMdQTShCNLikcxvoazOyWx8+VxV59G+xdgNUzk/tSTiAmAP/kQHL5qHsjXspkUb9BN4NC0TKAh3SrbRJwIRYK1/M/cRnkvp7a1tQ/g3wXjF3RLL9HaXGOSS9veQk08dufpXYcmJNP9Y6A+rKOfJ/88/E6qG1+LGSBDrOLeypbXAGNX2HjrOOoLfPAaGqDIgKKpnl2u+SwuIXBiE8TfNgtA0Rl2QEsmHhS/sfUhtUcmDWjPO54NRBCR+FGOBkAgUb6m839E2C9POEW1FKr/otPlG+756QMIrZVqA1sQUtO1OC3C5kPAXW/5mdRejKGTga2h4RUodMhoTP9ulVuQAljC04o82BXtJT/M2zPnkJKDRjN/2Rf44ypzt0eKg7Jis0Sl2sg4xqSf0FOaGHihKWoToZRar+/e+bN6OTCbePw0fBMs0QhaKHRYDx0POXvn4VTa7847A0rXr3R5fj7/JYdo1ew5QIX4zfrA768dSX/nYEU1HObXWZY7R11xuX4c8dllzyMMiict86hwxmJxOtYflllLTqmpPhG2FaTaZmLRUf6c/iHWZCbY9T3tPVLO3FBMkNxfJf21ehoGai+EaZLH9DJeeBlgdx//zgQXRV4LB3ktDjK5Sr1AQP21SGHQHnr9IiTmbrLzr2eBapP/ogMPLAW3onTdHYGoJRv2zHP4RHVa5feOn35eKcahGHWRXvsDtYC/+gSwRPIHJ9wS9IK0R7WKk3T75cXN9Q563bGLLDsh4WN64PDQ51aoXQch0qXgLWVLiRuMKWNctqlR0D77J3PHJQF1voZHG8F0ebYKa3V6zoiJzNtlLNubQIqS/c2OVj7kb1jAJHuYat1rFuWGts2FDh2Qjis9//rpicB0yK/dwiAUrHprddsPDfga8/zECp2tEX0+fEivJnxHOBmaYCjvRiNf+mb0Gr9fb0jj/ZrQHr+igcUvwH/+jG3sb6D2lcIVDhdN9En9dUtQO7l93Hr9RoHwinPr/sNqMRsRxnYywZwPmUzCitx4tkRctH4IzcOcfmC5gC8vBnVrderi2rQZ+O90k2JFVb0dyHBsVVSLEhC4Sf/yRBqrxNC0sDu+77p71daGh+hlHObAajLW/VKNDqCab9NpzWmDtneIfjFL8PSk0IQ1+YOLPx82qrZupGlNX7Dv5l/MFMhf6nKyI2Wx/Zt1Xs/aLPquOtbU4I08ucHF/c9Lay433fgwGvrO9wKOV6yadrpg8aa0tKa2KrTcx9VFAlhTpQhtfPLGmQaR7RutzeGdL9o8dwHsbrslJQe/kHH2q1krayvN2XW5KeUjqwfPu5G+8WziqyNdlFwzqjmvnTzRx2/q9WvC9gzkD73711dlphTtaBLl9WrV/efnTZzzJLrax5PmWdtamRHpSMLjN+jM/Bkgr+6zAxxW2hw40TYVJ8Orx49tK6uoE/H2EUZTYphQcdPmLhpc7u21U9vRoVQ+zpw2xytmUSTZxmQv+Tgz11oVvlPaM6tyCU1u+2MEt5HMVpeI0C0R0T8v/rQ6Uo3umKOCYU4hPYfA06Ce1Q7qqyXaO3e1GxasD2JhlfSCZie7PytBbEV3g9IR1ezuB7G9qgSTMN3PXBYdtjFXX8cZqWhGgsCqN/ZuNUB3Z5+Cf67q80V9RDFaBGAwKN+Cy3fxMBhi7+rzRU97BGj9UG3ij2O7aQlgBU+P8BxYZpo607VKtANSzN9Lh02G+A7Y1wNDJ2Nq+RKtoLtcWwjHV8lQZF1//auDrhsnYypqFitMsfSFGB0u5uuVgC9TNLlZxVbpeKd6EtHAPR2zRWXM2tBzwvF+KAeItm2jnQEIKDiylRXAxNC0QIEwEIAnegJsK7dR64CNKRjVTEqNosvWH2BjgAc2NsSQG5Vng2Au7qOTi8YvHAyH+ZSNVC9ZXeeSoAAzr1NRwAcBoctdA2w4m6eis9SRSzoSscn2tBGe2W6qywRxUqrEvgsliq1fxEdAWyxXJarjQw1T6xKUNkAyopo+T4VBkO+cLWRodaDnDAE0CZidy4tATiwo+xNFyMLbAKIGbWClgAEvOfryoqxjPBLYSIWS5Q2M5imKhR6wNX7KFjG34aEaRBA3qdJ9HyjjYA//u3ibQIsI3BiI8A4mj6z+AYU7HHx/iCWkbHBDmAcYqXpK3k4zFnmXIewQHQ90QaQsNRCUwAUrp284HSPCgyE5U8QgCZhYmAGTR/5w2HxdeeHx+jQO0htW4GttH1oERPC/15wOjgc9gfZ3Kh0EWBi2j4LvCLXBcBaTzvAGDq/dOm8aS8Dhw9sK6AOeUjrp1LFLizkgzgbQORZxr312gTwhV2FAiYx78Fju/wNpnnaV2AZEx/NtocaNzxFfJYoaC5jAebaVyBoDkNViIAldiPW7WIswGUbgChuFzNVCF1RmmP3Qrp9zAQIfAag1s1nrBG/bweIu8VYG2gE8MxiLMAOO4BvFtUXff5rAJs81TaAdxkMYF+Bp4wFmIxWgK/2PcJYgPaeaj5f7VnCWCP+3VdkAzgDVoYCPPK17wN7GbsCX6IVQACFjAVYk4xUSKT7kKEAHPgkWaTiayLHMxagpJuIxReF9WasCp3xRW5UFDadsQB7fUUqlip2MGMB1pWr0Ws2rI2MzQfGB4lUKlabvowFqAjTKNuw1AsZC7Cl3keFAAYytrS4s53Kw4PV0JGhAKglapvcQ5R6qIB5v83uGUCnhlSRR+rwrgwFwGwtWyJRzO5gwBgKwMlJUKuNpwHEwFAdmhs3e7aOqbVdezTnOXv2kzOMBbD9RjUfXsMFhnpR+1MZ7+QZxzDUhBv34pIQ6ceM1SD7E0hVw1cweAVQNHF+LEMjObe4xS1ucYtb3OIWt7jl/6/8H9k4D0TfSU+4AAAAAElFTkSuQmCC';
const OFFLINE_PAGE = './';

self.addEventListener('install', e => {
  self.skipWaiting();
});

// "Güncelle" butonundan gelen mesajla bekleyen SW'yi hemen etkinleştir
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
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
