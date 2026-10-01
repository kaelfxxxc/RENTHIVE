const CACHE = "renthive-offline-v1";
const offlineUrl = new URL("offline.html", self.registration.scope).href;

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([
    offlineUrl,
    new URL("icons/icon-192.png", self.registration.scope).href,
  ])));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith("renthive-offline-") && key !== CACHE).map(key => caches.delete(key)),
  )).then(() => self.clients.claim()));
});

// Rental, identity, payment, and API data always use the network.
// Only document navigations get a static offline fallback.
self.addEventListener("fetch", event => {
  if (event.request.mode !== "navigate" || event.request.method !== "GET") return;
  if (!event.request.url.startsWith(self.registration.scope)) return;
  event.respondWith(fetch(event.request).catch(async () =>
    (await caches.match(offlineUrl)) || Response.error(),
  ));
});
