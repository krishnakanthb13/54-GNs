const CACHE = 'motor-duty-v13';
const ASSETS = [
  './',
  './index.html',
  './assets/css/styles.css',
  './assets/js/script.js',
  './manifest.json',
  './favicon.ico',
  './assets/icons/favicon.ico',
  './assets/icons/favicon.svg',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Network-first for maintenance.txt: always fetch the freshest copy when online,
  // and fall back to the last good cached copy when offline.
  if (url.pathname.endsWith('maintenance.txt')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put('./maintenance.txt', copy));
          }
          return res;
        })
        .catch(() => caches.match('./maintenance.txt'))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
