// Mittente delle notifiche di BikeFly Web (iPhone e browser).
// Gira ogni 5 minuti su GitHub: guarda i noleggi attivi e avvisa le persone giuste.
// Nessun segreto in questo file: la chiave di Firebase sta nei Secrets di GitHub,
// la chiave privata delle notifiche sta in Firestore in una collezione che nessuno può leggere.
import admin from "firebase-admin";
import webpush from "web-push";

if (!process.env.FIREBASE_SERVICE_ACCOUNT) { console.log("::warning title=Notifiche::Manca la chiave FIREBASE_SERVICE_ACCOUNT nei Secrets: non invio niente"); process.exit(0); }
const chiave = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(chiave) });
const db = admin.firestore();

// 1. chiavi VAPID: create una volta sola e salvate in Firestore
const rifVapid = db.doc("server/vapid");
let vapid = (await rifVapid.get()).data();
if (!vapid) {
  vapid = webpush.generateVAPIDKeys();
  await rifVapid.set(vapid);
  await db.doc("config/push").set({ publicKey: vapid.publicKey });
  console.log("::notice title=Notifiche::Create le chiavi delle notifiche");
}
const pub = (await db.doc("config/push").get()).data();
if (!pub || pub.publicKey !== vapid.publicKey) await db.doc("config/push").set({ publicKey: vapid.publicKey });
webpush.setVapidDetails("mailto:bikef993@gmail.com", vapid.publicKey, vapid.privateKey);

// 2. cosa c'è da dire
const ora = Date.now();
const attivi = await db.collection("noleggi").where("fase", "in", ["IN_ATTESA", "ACCETTATO", "IN_CORSO"]).get();
const messaggi = [];
for (const d of attivi.docs) {
  const n = d.data();
  if (n.fase === "IN_ATTESA" && n.proprietarioUid)
    messaggi.push({ chiave: "r_" + d.id, a: n.proprietarioUid, titolo: "🔔 Nuova richiesta", testo: `${n.clienteNome || "Qualcuno"} vuole la tua bici: accetta o rifiuta` });
  if (n.fase === "ACCETTATO" && n.clienteUid)
    messaggi.push({ chiave: "a_" + d.id, a: n.clienteUid, titolo: "✅ Richiesta accettata", testo: "Vai a ritirare la bici!" });
  if (n.fase === "IN_CORSO" && n.clienteUid && n.inizioMs && n.durataMs) {
    const manca = n.inizioMs + n.durataMs - ora;
    if (manca > 0 && manca <= 16 * 60 * 1000)
      messaggi.push({ chiave: `f_${d.id}_${n.durataMs}`, a: n.clienteUid, titolo: "⏰ Mancano 15 minuti", testo: "Riporta la bici in tempo per non pagare la penale, oppure prolunga di 1 ora." });
  }
}
// 3. niente doppioni: ogni avviso si manda una volta sola
let inviati = 0, tolti = 0;
for (const m of messaggi) {
  const segno = db.doc("serverInviate/" + m.chiave);
  if ((await segno.get()).exists) continue;
  const iscr = await db.collection("pushWeb").doc(m.a).collection("iscrizioni").get();
  for (const s of iscr.docs) {
    const x = s.data();
    try {
      await webpush.sendNotification({ endpoint: x.endpoint, keys: { p256dh: x.p256dh, auth: x.auth } },
        JSON.stringify({ titolo: m.titolo, testo: m.testo, tag: m.chiave, url: "./" }), { TTL: 6 * 3600, urgency: "high" });
      inviati++;
    } catch (e) {
      // iscrizione scaduta (telefono cambiato, app tolta dalla Home): la cancello
      if (e.statusCode === 404 || e.statusCode === 410) { await s.ref.delete(); tolti++; }
      else console.log(`::warning title=Notifiche::Invio fallito (${e.statusCode || "?"})`);
    }
  }
  await segno.set({ quando: admin.firestore.FieldValue.serverTimestamp() });
}
console.log(`::notice title=Notifiche::Noleggi attivi ${attivi.size}, avvisi nuovi ${messaggi.length}, notifiche inviate ${inviati}, iscrizioni scadute ${tolti}`);
