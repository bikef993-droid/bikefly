// Service worker di BikeFly Web: riceve le notifiche anche ad app chiusa (iPhone: solo se aggiunta alla Home)
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { testo: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.titolo || "BikeFly", {
    body: d.testo || "", icon: "icona-192.png", badge: "icona-192.png", tag: d.tag || undefined, data: { url: d.url || "./" }
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "./";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(l => {
    for (const c of l) if ("focus" in c) { c.postMessage({ apri: url }); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
