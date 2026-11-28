const CACHE = 'cozydesk-shell-v14';
const CORE = [
  './',
  './index.html',
  './styles.css',
  './extra.css',
  './app.js',
  './extra.js',
  './extra2.js',
  './manifest.webmanifest',
  './pwa.js',
  './assets/cozydesk-app-icon.svg',
  './assets/cozydesk-shopping-world.svg',
  './assets/cozydesk-bunny-scene.svg',
  './assets/cozydesk-home-bunny.jpg',
  './assets/cozydesk-bunny-scene.jpg'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('cozydesk-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (response && response.ok) caches.open(CACHE).then(cache => cache.put('./index.html', response.clone()));
      return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(request).then(cached => {
    if (cached) return cached;
    return fetch(request).then(response => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy));
      }
      return response;
    });
  }));
});