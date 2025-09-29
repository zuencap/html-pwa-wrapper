// sw.js — cache bump v7 for share button + favicon
const CACHE = "html-wrapper-v7";
const ASSETS = ["./","./index.html","./app.js","./manifest.webmanifest","./icons/192.png","./icons/512.png","./favicon.ico"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))); });
self.addEventListener("fetch", e => {
  const {request} = e;
  if (request.method!=="GET"||new URL(request.url).origin!==self.location.origin) return;
  e.respondWith(caches.match(request).then(r=>r||fetch(request)));
});
