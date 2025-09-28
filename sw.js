// sw.js - simple App Shell cache-first for static assets
const CACHE = "html-wrapper-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/192.png",
  "./icons/512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
});
self.addEventListener("fetch", (e) => {
  const { request } = e;
  // Only cache GET requests from same-origin
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }
  e.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
