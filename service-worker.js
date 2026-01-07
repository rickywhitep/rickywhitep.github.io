// Incluido contenido de HIM
// Nota: marcador indicando inclusión de recursos relacionados con HIM
const CACHE_NAME = 'ricky-cards-v1';
const OFFLINE_URL = '/offline.html';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  OFFLINE_URL
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).catch(console.error)
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Navigation requests (documents): network-first, fallback to cache/offline
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req).then(res => {
        caches.open(CACHE_NAME).then(cache => cache.put(req, res.clone()));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match(OFFLINE_URL)))
    );
    return;
  }

  // CSVs: network-first (so we fetch updates), fallback to cache
  if (url.pathname.endsWith('.csv')) {
    event.respondWith(
      fetch(req).then(res => { caches.open(CACHE_NAME).then(c => c.put(req, res.clone())); return res; }).catch(() => caches.match(req))
    );
    return;
  }

  // Other assets: cache-first
  event.respondWith(
    caches.match(req).then(resp => resp || fetch(req).then(res => { caches.open(CACHE_NAME).then(c => c.put(req, res.clone())); return res; }))
  );
});
