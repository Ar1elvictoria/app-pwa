const CACHE_NAME = "gestionnet-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-128x128.png",
  "/icons/icon-144x144.png",
];

// Instalar SW y cachear archivos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
      .then(() => self.skipWaiting());
    })
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.match("/").then((cachedIndex) => {
        return cachedIndex || fetch(event.request);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          if (event.request.method === "GET" && event.request.url.startsWith(self.location.origin)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      }).catch(() => {
      });
    })
  );
});