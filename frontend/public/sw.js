// Service worker mínimo: solo precachea assets estáticos propios (manifest,
// iconos, escudo) para que la PWA sea instalable. Nunca intercepta
// navegaciones (documentos HTML) ni /api/ — mismo patrón que Gast-On:
// interceptar páginas con clients.claim() + recargas duras provoca bucles
// de recarga en dev con Turbopack, y en producción no aporta nada que la
// caché HTTP normal no dé ya.
const CACHE_NAME = "multas-shell-v1";
const PRECACHE_URLS = [
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/escudo.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") return; // nunca tocar documentos HTML

  const url = new URL(event.request.url);
  const cacheable = url.origin === self.location.origin && PRECACHE_URLS.includes(url.pathname);
  if (!cacheable) return;

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
