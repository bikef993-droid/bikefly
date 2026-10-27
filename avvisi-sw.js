// Service worker della pagina dei Pionieri: riceve la notifica del lancio di BikeFly
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { testo: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.titolo || "BikeFly", {
    body: d.testo || "", icon: "/bikefly/app/icona-192.png", badge: "/bikefly/app/icona-192.png", tag: d.tag || "lancio",
    data: { url: d.url || "https://bikef993-droid.github.io/bikefly/" }
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.openWindow((e.notification.data && e.notification.data.url) || "https://bikef993-droid.github.io/bikefly/"));
});
