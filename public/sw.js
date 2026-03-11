const CACHE_NAME = 'oblique-excavator-v2';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico', // Maintaining your main shape
  '/fulllogo.png'
];

// Install: Cache icons and core UI immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: Cleanup old versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

// Fetch: Network-First with Cache Fallback
// This ensures your text-art logic stays updated while remaining offline-capable
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Update cache with the latest version from network
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});