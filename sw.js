/**
 * sw.js — Service Worker para "¿Qué cocino hoy?"
 *
 * Estrategia:
 *  - Cache-first para el shell estático (HTML, CSS, JS)
 *  - Network-only para las llamadas a la API de Spoonacular
 *    (no queremos cachear respuestas de recetas)
 */

const CACHE_NAME   = 'qch-shell-v1';
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './src/styles.css',
  './src/utils/storage.js',
  './src/utils/ingredientMatch.js',
  './src/utils/historial.js',
  './src/services/spoonacular.js',
  './src/components/components.js',
  './src/pages/home.js',
  './src/pages/ingredientes.js',
  './src/pages/resultado.js',
  './src/pages/ajustes.js',
  './src/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

/* ---------- Install: pre-cachear el shell ---------- */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* ---------- Activate: limpiar caches viejas ---------- */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ---------- Fetch: cache-first para shell, network para API ---------- */
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Spoonacular → siempre desde la red
  if (url.includes('api.spoonacular.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Google Fonts → red primero, luego cache
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Shell → cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    })
  );
});
