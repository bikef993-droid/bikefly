// Iscrizione alla lista d'attesa con il numero del Pioniere (usata da teaser e quiz)
import { doc, setDoc, getDoc, writeBatch, serverTimestamp, increment } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// iscritti arrivati prima che esistesse il contatore
export const GIA_ISCRITTI = 0; // dal 27/10 il contatore parte dal numero vero di iscritti

// prova a iscrivere: { stato: "nuovo" | "gia", numero }
export async function iscrivi(db, email) {
  try {
    const lotto = writeBatch(db);
    lotto.set(doc(db, "attesa", email), { email, quando: serverTimestamp() });
    lotto.set(doc(db, "contatori", "pionieri"), { n: increment(1), ultimo: email }, { merge: true });
    lotto.set(doc(db, "contatori", "pubblico"), { n: increment(1) }, { merge: true });
    await lotto.commit();
    const numero = await quanti(db);
    try { if (numero) localStorage.setItem("pioniere_n", String(numero)); } catch (e) {}
    return { stato: "nuovo", numero };
  } catch (e) {
    if (!String(e.code || "").includes("permission")) throw e;
    // regole vecchie, oppure email già in lista: prova l'iscrizione semplice
    try {
      await setDoc(doc(db, "attesa", email), { email, quando: serverTimestamp() });
      return { stato: "nuovo", numero: null };
    } catch (e2) {
      if (String(e2.code || "").includes("permission")) return { stato: "gia", numero: numeroSalvato() };
      throw e2;
    }
  }
}

// quanti Pionieri ci sono (null se non si riesce a leggere)
export async function quanti(db) {
  try {
    const d = await getDoc(doc(db, "contatori", "pubblico"));
    return (d.data()?.n || 0) + GIA_ISCRITTI;
  } catch (e) { return null; }
}

export function numeroSalvato() {
  try { return Number(localStorage.getItem("pioniere_n")) || null; } catch (e) { return null; }
}

// il riquadro "Sei il Pioniere n° X" con il tasto per invitare gli amici
export function mostraInvito(box, numero, link) {
  const testo = `Qualcosa sta arrivando a Piacenza 👀 Sono già in lista${numero ? ` (Pioniere n° ${numero})` : ""}. Entra anche tu prima del 1 dicembre: ${link}`;
  box.innerHTML = `
    ${numero ? `<p class="invito-num">Sei il Pioniere<br><b>n° ${numero}</b><br>di Piacenza 🚀</p>` : `<p class="invito-num">Sei tra i <b>Pionieri</b> 🚀</p>`}
    <p class="invito-sotto">Il 1 dicembre ti arriva il codice. Intanto porta un amico: chi entra prima, prende il codice prima.</p>
    <a class="invito-wa" href="https://wa.me/?text=${encodeURIComponent(testo)}" target="_blank" rel="noopener">Invita un amico su WhatsApp</a>
    <button type="button" class="invito-altro">Condividi in un altro modo</button>`;
  box.classList.remove("nascosto");
  box.querySelector(".invito-altro").onclick = async () => {
    try {
      if (navigator.share) await navigator.share({ text: testo });
      else { await navigator.clipboard.writeText(testo); box.querySelector(".invito-altro").textContent = "Link copiato ✓"; }
    } catch (e) {}
  };
}
