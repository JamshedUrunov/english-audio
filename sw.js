// Хранит приложение на устройстве: оно открывается сразу и без интернета.
// Каждая версия — свой кэш. Файлы с хэшем в имени (словарь, переводы, значки) не меняются,
// поэтому новая версия берёт их из прежнего кэша и не качает заново: обычно скачивается
// только страница с кодом. Всё, что качается, берётся в обход кэша браузера
// (GitHub Pages разрешает браузеру 10 минут держать старую копию — из-за этого обновление
// иногда «не срабатывало»).
const CACHE = "audio-english-66b50b0d34";
const FILES = ["data.f062ea7b5f.js", "icon-180.3fffa56405.png", "icon-192.510a2e2da0.png", "icon-512.53990faed2.png", "index.html", "manifest.d6569d8e8b.webmanifest"];
const hashed = (name) => /\.[0-9a-f]{10}\.[a-z]+$/.test(name);

async function install() {
  const cache = await caches.open(CACHE);
  for (const name of FILES) {
    if (hashed(name)) {
      const old = await caches.match(name);
      if (old) {
        await cache.put(name, old);
        continue;
      }
    }
    const response = await fetch(new Request(name, { cache: "reload" }));
    if (!response.ok) throw new Error(name + " " + response.status);
    await cache.put(name, response);
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(install().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Отдаём только из кэша этой версии; сеть — лишь если файла в кэше почему-то нет
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  const name = url.pathname.slice(new URL(self.registration.scope).pathname.length);
  const key = request.mode === "navigate" ? "index.html" : name;
  if (!FILES.includes(key)) return;
  event.respondWith(caches.open(CACHE)
    .then((cache) => cache.match(key))
    .then((cached) => cached || fetch(request)));
});
