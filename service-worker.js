const CACHE_NAME = 'motoroute-v3';
const STATIC_ASSETS = [
  '/motosiklet/',
  '/motosiklet/index.html',
  '/motosiklet/css/variables.css',
  '/motosiklet/css/reset.css',
  '/motosiklet/css/main.css',
  '/motosiklet/css/components.css',
  '/motosiklet/css/pages.css',
  '/motosiklet/css/animations.css',
  '/motosiklet/js/app.js',
  '/motosiklet/js/config.js',
  '/motosiklet/js/supabase-client.js',
  '/motosiklet/js/router.js',
  '/motosiklet/js/auth.js',
  '/motosiklet/js/utils/helpers.js',
  '/motosiklet/js/utils/api.js',
  '/motosiklet/js/components/toast.js',
  '/motosiklet/js/components/modal.js',
  '/motosiklet/js/components/notifications.js',
  '/motosiklet/js/pages/dashboard.js',
  '/motosiklet/js/pages/discover.js',
  '/motosiklet/js/pages/events.js',
  '/motosiklet/js/pages/route-detail.js',
  '/motosiklet/js/pages/create.js',
  '/motosiklet/js/pages/profile.js',
  '/motosiklet/js/pages/clubs.js',
  '/motosiklet/js/pages/messages.js',
  '/motosiklet/js/pages/settings.js',
  '/motosiklet/js/pages/auth-page.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  // Network-first for JS/CSS/HTML: always get fresh code
  const isAppFile = /\.(js|css|html)$/.test(url.pathname) || url.pathname.endsWith('/');
  if (isAppFile) {
    e.respondWith(
      fetch(e.request).then((resp) => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match(e.request).then(c => c || caches.match('/motosiklet/index.html')))
    );
    return;
  }

  // Cache-first for other static assets (fonts, images, etc.)
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((resp) => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => {
        if (e.request.mode === 'navigate') return caches.match('/motosiklet/index.html');
      });
    })
  );
});
