const CACHE_NAME = 'moracms-v4'; // ⬆️ bump versi — paksa semua device ambil ulang & buang cache lama
const urlsToCache = [
  './',
  'index.html',
  'manifest.json',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // langsung aktif tanpa tunggu tab lama ditutup
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)) // hapus SEMUA cache lama
      )
    ).then(() => self.clients.claim()) // ambil alih semua tab langsung
  );
});

// ✅ FIX: Network-first untuk HTML/JS — selalu coba ambil versi terbaru dari server.
// Cache cuma jadi fallback kalau offline. Ini mencegah app "tersangkut" di versi lama/rusak.
self.addEventListener('fetch', event => {
  const isHTML = event.request.mode === 'navigate' || event.request.url.endsWith('index.html') || event.request.url.endsWith('/');

  if (isHTML) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request)) // offline → fallback ke cache
    );
  } else {
    // Asset statis (font, library) tetap cache-first — jarang berubah, boleh dari cache
    event.respondWith(
      caches.match(event.request).then(response => response || fetch(event.request))
    );
  }
});
