// pwa/sw.js
// Service worker for Dicey Drinks PWA

const CACHE_NAME = 'dicey-drinks-v1';
const urlsToCache = [
  '../index.html',
  '../css/theme.css',
  '../js/app.js',
  '../js/storage.js',
  '../js/rng.js',
  '../js/rules.js',
  '../js/measure.js',
  '../js/exporter.js',
  '../js/anim.js',
  '../js/vendor/three.min.js',
  '../js/vendor/pako.min.js',
  '../data/defaults.json',
  '../assets/icon-192.png',
  '../assets/icon-512.png',
  '../assets/joker.svg',
  './manifest.json'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
