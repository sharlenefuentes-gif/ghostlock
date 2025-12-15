const CACHE_NAME = 'magic-lock-v1';
const ASSETS = [
  './', // Caches the root page
  './index.html',
  './styles.css',
  './script.js',
  './manifest.json',
  './icon.png' // Ensure the icon is also cached for offline
];

// Install the Service Worker and Cache all core files
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Serve Cached Files when Offline
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
