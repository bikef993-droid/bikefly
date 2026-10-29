// Fly Aula: la pagina resta sul computer e si apre anche senza internet
const CACHE = "flyaula-v2";
const FILE = ["./", "./index.html", "./manifest.json", "./icona-192.png", "./icona-512.png", "../font/Bricolage.ttf", "../font/Figtree.ttf"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILE))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x))))); self.clients.claim(); });
// prima prova la rete (così gli aggiornamenti arrivano), se non c'è usa la copia salvata
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (u.hostname === "localhost" || e.request.method !== "GET") return;   // il cervello (Ollama) non si tocca
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
