const CACHE_NAME = 'momentum-v1';
const URLS_TO_CACHE = [
  '/',
  '/momentum.html',
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap',
  'https://fonts.gstatic.com/s/spacegrotesk/v16/V8mQoQDjQikFxW9eU32d_CzptyxOYgA.woff2',
  'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHapMsc5d-_kCZ9IFROe8jhjbsDT64.woff2',
  'https://fonts.gstatic.com/s/ibmplexmono/v19/-F6offjtqb1eV0TNngUAKRpA.woff2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(URLS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Skip cross-origin & non-GET
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;

  // Network-first for API calls
  if (event.request.url.includes('/api/') || event.request.url.includes('supabase')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(event.request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
