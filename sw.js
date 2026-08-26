const CACHE_NAME = 'aki-baseball-v2';
const CORE_ASSETS = ['/', '/manifest.json', '/favicon.ico', '/icon-192x192.png', '/icon-512x512.png', '/apple-touch-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch((err) => console.error('預先快取失敗', err))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
      .catch((err) => console.error('清除舊快取失敗', err))
  );
});

const putCopy = (request, response) => {
  try {
    if (!response || !response.ok || response.type !== 'basic') return response;
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => undefined);
  } catch (err) {
    console.error('寫入快取失敗', err);
  }
  return response;
};

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => putCopy(request, response))
        .catch(() => caches.match(request).then((hit) => hit || caches.match('/')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request).then((response) => putCopy(request, response)).catch(() => hit);
    })
  );
});
