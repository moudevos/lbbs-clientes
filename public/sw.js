const CACHE = "lbbs-clientes-shell-v1";
const SAFE_ASSETS = ["/offline", "/icon.svg", "/icon-maskable.svg"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SAFE_ASSETS))));
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin || new URL(request.url).pathname.startsWith("/api/")) return;
  if (request.mode === "navigate") { event.respondWith(fetch(request).catch(() => caches.match("/offline"))); return; }
  if (new URL(request.url).pathname.startsWith("/_next/static/") || ["/icon.svg", "/icon-maskable.svg"].includes(new URL(request.url).pathname)) event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => { const copy = response.clone(); void caches.open(CACHE).then((cache) => cache.put(request, copy)); return response; }))); 
});
