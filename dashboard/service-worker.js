self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('a1apsvc-dashboard-cache').then((cache) => {
      return cache.addAll([
        './',
        './index.html',
        './style.css',
        './script.js',
        './reports.html',
        './schedule.html',
        './manifest.json',
        './images/icon-192.png',
        './images/icon-512.png'
      ]);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});