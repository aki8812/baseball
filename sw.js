const CACHE = 'aki-baseball-v1';
const SHELL = ['/', '/manifest.webmanifest', '/favicon.ico', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png', '/icons/apple-touch-icon.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

const putCopy = (request, response) => {
  if (!response || !response.ok || response.type === 'opaque') return response;
  const copy = response.clone();
  caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => undefined);
  return response;
};

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => putCopy(request, response))
        .catch(() => caches.match(request).then(hit => hit || caches.match('/')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(hit => {
      const network = fetch(request).then(response => putCopy(request, response)).catch(() => hit);
      return hit || network;
    })
  );
});
