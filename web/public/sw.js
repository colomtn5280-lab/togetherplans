const CACHE = 'tp-shell-v2';
const SHELL = [
  '/manifest.json',
  '/favicon.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Network first for API calls
  if (e.request.url.includes('/api/')) return;

  // Network first for HTML navigation — always get the latest index.html
  // so hashed JS/CSS bundles are always current after a deploy.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/'))
    );
    return;
  }

  // Cache first for static assets (hashed filenames are content-addressed)
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
