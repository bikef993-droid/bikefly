// Fly Aula: la pagina resta sul computer e si apre anche senza internet
const CACHE = "flyaula-v7";
const FILE = ["./", "./index.html", "./stile.css", "./app.js", "./sicurezza.js", "./materie.js", "./controllo.js", "./disegni.js", "./esame.js", "./esercizi.js", "./orario.js", "./voce.js", "./qr.js", "./prof.js", "./pagine.js", "./classe.js", "./gara.js", "./programmi.js", "./creaverifica.js", "./report.js", "./demo.js", "./telefono.html", "./manifest.json", "./icona-192.png", "./icona-512.png", "../font/Bricolage.ttf", "../font/Figtree.ttf"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILE))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE && !x.startsWith("transformers")).map(x => caches.delete(x))))); self.clients.claim(); });
// prima prova la rete (così gli aggiornamenti arrivano), se non c'è usa la copia salvata
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (u.hostname === "localhost" || u.hostname === "127.0.0.1" || e.request.method !== "GET") return;   // il cervello (Ollama) non si tocca
  if (u.hostname.endsWith("huggingface.co") || u.hostname.includes("hf.co")) return;                    // il modello della voce lo salva già la sua libreria
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; }).catch(() => caches.match(e.request)));
});
