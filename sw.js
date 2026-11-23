// Хранит код приложения на устройстве: оно открывается сразу и без интернета,
// а новая версия тихо скачивается в фоне и включается при следующем запуске
const CACHE = "audio-english-f05ae008c246";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  const name = url.pathname.slice(new URL(self.registration.scope).pathname.length);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode !== "navigate" && !FILES.includes(name)) return;
  const key = request.mode === "navigate" ? "index.html" : name;
  event.respondWith(caches.open(CACHE).then((cache) => cache.match(key, { ignoreSearch: true }).then((cached) => {
    const fresh = fetch(request).then((response) => {
      if (response.ok) cache.put(key, response.clone());
      return response;
    });
    if (!cached) return fresh;
    fresh.catch(() => {});
    return cached;
  })));
});
