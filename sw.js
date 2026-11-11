// Silicon service worker: caches the app shell so it opens with no connection.
// Bump VERSION here and APP_VERSION in index.html on every release.
const VERSION = 'silicon-v3';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Barcode lookups and anything cross-origin always go to the network.
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // Network first so updates land; fall back to cache when offline.
  e.respondWith(
    fetch(e.request.url, { cache: 'no-cache' }) // skip the browser's HTTP cache so releases show up right away
      .then(r => {
        const copy = r.clone();
        caches.open(VERSION).then(c => c.put(e.request, copy));
        return r;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});
