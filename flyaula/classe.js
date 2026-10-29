// ===================================================================
//  FLY AULA · per tutta la classe
//  🧩 modalità DSA · 🌍 alunni stranieri · 🔁 ripasso finale
//  📒 riassunto per gli assenti · 🖨️ stampa
//  Regola di sempre: ogni cosa che esce viene controllata almeno 2 volte.
// ===================================================================
const escC = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function leggiC(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function scriviC(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

// ---------------- 🖨️ stampa (o "Salva come PDF") ----------------
function stampa(titolo, corpoHtml) {
  const f = document.createElement("iframe");
  f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(f);
  const d = f.contentDocument;
  d.open();
  d.write(`<!doctype html><html lang="it"><head><meta charset="utf-8"><title>${escC(titolo)}</title><style>
    @page{margin:16mm 14mm}
    body{font:15px/1.55 "Segoe UI",Arial,sans-serif;color:#111;margin:0}
    h1{font-size:22px;margin:0 0 4px}h2{font-size:17px;margin:18px 0 6px;border-bottom:2px solid #111;padding-bottom:3px}h3{font-size:15px;margin:14px 0 4px}
    .testa{display:flex;justify-content:space-between;gap:20px;border:2px solid #111;border-radius:8px;padding:10px 14px;margin:8px 0 16px;font-size:14px}
    .es{break-inside:avoid;margin:0 0 14px;padding:10px 12px;border:1px solid #bbb;border-radius:8px}
    .es b.n{display:inline-block;min-width:24px}
    .spazio{height:90px;border-bottom:1px dashed #999;margin-top:6px}
    .punti{float:right;font-size:13px;color:#444}
    .sol{color:#063}
    .pie{margin-top:20px;font-size:11px;color:#666;border-top:1px solid #ccc;padding-top:6px}
    ul{margin:4px 0 8px 18px;padding:0}li{margin:3px 0}
    .salto{break-before:page}
  </style></head><body>${corpoHtml}<div class="pie">Preparato con Fly Aula · controllato dalla calcolatrice e ricontrollato · da rileggere sempre a cura del docente</div></body></html>`);
  d.close();
  setTimeout(() => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) {} setTimeout(() => f.remove(), 60000); }, 300);
}

// ---------------- 🧩 modalità DSA ----------------
const DSA = {
  attiva: leggiC("flyaula_dsa") === "1",
  applica() {
    document.body.classList.toggle("dsa", this.attiva);
    const b = document.getElementById("dsa"); if (b) { b.classList.toggle("on", this.attiva); b.title = this.attiva ? "Modalità DSA attiva" : "Modalità DSA"; }
  },
  cambia() { this.attiva = !this.attiva; scriviC("flyaula_dsa", this.attiva ? "1" : "0"); this.applica(); },
  istruzioni() {
    if (!this.attiva) return "";
    return `\nMODALITÀ DSA (in classe ci sono alunni con DSA, scrivi per tutti così):
- Frasi BREVI (massimo 12 parole), UNA idea per riga, parole semplici.
- Metti in **grassetto** le 2-3 parole chiave.
- Niente doppie negazioni, niente frasi lunghe con tanti "che".
- Alla fine aggiungi SEMPRE una mappa concettuale su una riga da sola, così:
[DISEGNO: mappa Argomento | Parola chiave 1: spiegazione breve | Parola chiave 2: spiegazione breve | Esempio: un esempio]`;
  }
};

// lettura ad alta voce riga per riga, con la riga evidenziata (utile per DSA)
function leggiEvidenziando(bolla, testo, lingua = "it") {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const righe = [...bolla.querySelectorAll(":scope > .passo, :scope > div:not(.timbri):not(.disegno)")].filter(r => r.textContent.trim());
  const voci = speechSynthesis.getVoices().filter(v => v.lang && v.lang.toLowerCase().startsWith(lingua));
  const voce = voci.find(v => v.localService) || voci[0] || null;
  const pulisci = t => t.replace(/✓ calcolatrice|✎ corretto dalla calcolatrice/g, "").replace(/×/g, " per ").replace(/(\d)\s*:\s*(\d)/g, "$1 diviso $2").replace(/−/g, " meno ").replace(/=/g, " uguale ").replace(/(\d)\/(\d)/g, "$1 su $2");
  if (!righe.length) return Voce.leggiAdAltaVoce(testo);
  let i = 0;
  const prossima = () => {
    righe.forEach(r => r.classList.remove("leggendo"));
    if (i >= righe.length) return;
    const r = righe[i++];
    r.classList.add("leggendo");
    const u = new SpeechSynthesisUtterance(pulisci(r.textContent));
    u.lang = lingua === "it" ? "it-IT" : lingua; u.rate = DSA.attiva ? 0.88 : 0.97; if (voce) u.voice = voce;
    u.onend = prossima; u.onerror = () => righe.forEach(x => x.classList.remove("leggendo"));
    speechSynthesis.speak(u);
  };
  prossima();
}

// ---------------- 🌍 alunni stranieri ----------------
const LINGUE = {
  en: { nome: "English", bandiera: "🇬🇧" }, es: { nome: "Español", bandiera: "🇪🇸" }, fr: { nome: "Français", bandiera: "🇫🇷" },
  de: { nome: "Deutsch", bandiera: "🇩🇪" }, ar: { nome: "العربية", bandiera: "🌍", rtl: true }, zh: { nome: "中文", bandiera: "🇨🇳" },
  ro: { nome: "Română", bandiera: "🇷🇴", prova: true }, sq: { nome: "Shqip", bandiera: "🇦🇱", prova: true },
  uk: { nome: "Українська", bandiera: "🇺🇦", prova: true }, ur: { nome: "اردو", bandiera: "🌍", rtl: true, prova: true }
};
const NOMI_ITA = { en: "inglese", es: "spagnolo", fr: "francese", de: "tedesco", ar: "arabo", zh: "cinese semplificato", ro: "rumeno", sq: "albanese", uk: "ucraino", ur: "urdu" };
// i numeri devono essere gli stessi nell'originale e nella traduzione (controllo automatico)
function numeriDi(t) {
  return (String(t).replace(/[٠-٩]/g, c => "٠١٢٣٤٥٦٧٨٩".indexOf(c)).replace(/[۰-۹]/g, c => "۰۱۲۳۴۵۶۷۸۹".indexOf(c)).match(/\d+/g) || []).map(Number).sort((a, b) => a - b).join(",");
}
const ISTRUZIONI_TRADUZIONE_CONTROLLO = `Sei un REVISORE di traduzioni scolastiche. Ricevi un ORIGINALE in italiano e la sua TRADUZIONE.
Controlla che la traduzione dica ESATTAMENTE le stesse cose: stessi numeri, stessi passaggi, stesso significato, niente aggiunto e niente tolto, lingua semplice e corretta.
Rispondi SOLO con JSON: {"ok": true} oppure {"ok": false, "problema": "frase breve in italiano", "correzione": "la traduzione completa corretta"}`;
async function traduci(cervello, testoIt, codice) {
  const nome = NOMI_ITA[codice];
  const origine = testoIt.split("\n").filter(r => !/^\s*\[DISEGNO:/i.test(r)).join("\n").replace(/\*\*/g, "");
  const esito = { testo: "", controlli: 0, stato: "ok" };
  let t = await cervello(`Traduci in ${nome} il testo di una lezione per uno studente straniero appena arrivato in Italia.
Regole: lingua SEMPLICE; mantieni la stessa struttura e le righe numerate "1.", "2."; scrivi i numeri ESATTAMENTE come nell'originale, con le cifre 0-9; mantieni i simboli × : + − =. Scrivi SOLO la traduzione.`, origine, { temperature: 0.1 });
  // controllo 1: i numeri combaciano?
  const numeriOk = x => numeriDi(x) === numeriDi(origine);
  esito.controlli++;
  if (!numeriOk(t)) {
    t = await cervello(`Traduci in ${nome}. ATTENZIONE: i numeri devono essere ESATTAMENTE gli stessi dell'originale, con le cifre 0-9. Scrivi SOLO la traduzione.`, origine, { temperature: 0 });
    esito.controlli++;
  }
  // controllo 2: revisore bilingue
  let rev = await revisiona(cervello, `Controlla la traduzione in ${nome}.`, t, `ORIGINALE IN ITALIANO:\n${origine}`, ISTRUZIONI_TRADUZIONE_CONTROLLO);
  esito.controlli++;
  if (rev.ok === false && numeriOk(rev.correzione)) { t = rev.correzione; esito.stato = "corretta"; }
  // controllo 3: quando qualcosa non tornava, o per le lingue "in prova"
  if (rev.ok !== true || !numeriOk(t) || LINGUE[codice].prova) {
    const r2 = await revisiona(cervello, `Controlla di nuovo, da capo, la traduzione in ${nome}.`, t, `ORIGINALE IN ITALIANO:\n${origine}`, ISTRUZIONI_TRADUZIONE_CONTROLLO);
    esito.controlli++;
    if (r2.ok === false) { if (esito.stato === "corretta" || !numeriOk(r2.correzione)) esito.stato = "dubbio"; else { t = r2.correzione; esito.stato = "corretta"; } }
    else if (r2.ok === null && rev.ok === null) esito.stato = "dubbio";
  }
  if (!numeriOk(t)) esito.stato = "dubbio";
  esito.testo = t.trim();
  return esito;
}
async function aggiungiTraduzione(bolla, testoIt, codice) {
  const L = LINGUE[codice]; if (!L) return;
  const box = document.createElement("div");
  box.className = "traduzione";
  box.innerHTML = `<div class="lavoro">${L.bandiera} Traduco in ${escC(L.nome)} e controllo la traduzione…</div>`;
  bolla.insertBefore(box, bolla.querySelector(".timbri"));
  try {
    const e = await traduci(cervello, testoIt, codice);
    if (e.stato === "dubbio") {
      box.innerHTML = `<div class="tag rosso">${L.bandiera} ${escC(L.nome)} · ⚠️ traduzione non sicura: meglio farsi aiutare da un compagno o dal prof</div>`;
      annotaErrore("Traduzione non sicura", `${L.nome}: i controlli non tornano`);
      return;
    }
    if (e.stato === "corretta") annotaErrore("Corretta dal ricontrollo", `traduzione in ${L.nome} corretta dal revisore`);
    box.lang = codice; if (L.rtl) box.dir = "rtl";
    box.innerHTML = `<div class="tag">${L.bandiera} ${escC(L.nome)} · traduzione controllata ${e.controlli >= 3 ? "3 volte ✓✓✓" : "2 volte ✓✓"}${L.prova ? " · lingua in prova" : ""}</div>
      <div class="testo-trad">${e.testo.split(/\n+/).filter(r => r.trim()).map(r => `<div>${escC(r)}</div>`).join("")}</div>
      <button class="leggi-trad">🔊</button>`;
    box.querySelector(".leggi-trad").onclick = () => leggiEvidenziando(box.querySelector(".testo-trad"), e.testo, codice);
  } catch (err) { box.innerHTML = `<div class="tag rosso">⚠️ Traduzione non riuscita</div>`; }
}

// ---------------- 🔁 ripasso finale (domande a scelta multipla) ----------------
function opzioniNumeriche(r) {
  const fmt = x => formatta(x);
  const cand = new Set([r]);
  const varianti = [r + 1, r - 1, r * 2, r / 2, r + 10, r - 10, r * 10, r / 10, Math.round(r * 1.1 * 100) / 100, r + 2];
  for (const v of varianti) { if (cand.size >= 4) break; if (isFinite(v) && v !== r && (r < 0 || v >= 0) && fmt(v) !== fmt(r)) cand.add(Math.round(v * 100) / 100); }
  const ops = [...cand].slice(0, 4).sort(() => Math.random() - .5);
  return { opzioni: ops.map(fmt), giusta: ops.indexOf(r) };
}
function domandeDiRiserva(n, materia, livello) {
  if (materia === "inglese") return Array.from({ length: n }, () => {
    const giro = PAROLE_INGLESE.slice().sort(() => Math.random() - .5).slice(0, 4), giusta = Math.floor(Math.random() * 4);
    return { domanda: `Come si dice "${giro[giusta][0]}" in inglese?`, opzioni: giro.map(p => p[1].split("|")[0]), giusta, spiegazione: `"${giro[giusta][0]}" = ${giro[giusta][1].split("|")[0]}`, controllata: true };
  });
  const nomi = materia === "economia" ? ["Economia aziendale"] : livello === "elementari" ? ["Addizioni e sottrazioni", "Moltiplicazioni", "Divisioni", "Problemi"] : livello === "medie" ? ["Frazioni", "Percentuali", "Aree", "Problemi", "Divisioni"] : ["Equazioni", "Percentuali", "Problemi", "Aree", "Frazioni"];
  return Array.from({ length: n }, () => { const e = CATEGORIE[scegli(nomi)](); const o = opzioniNumeriche(e.r); return { domanda: e.d, opzioni: o.opzioni, giusta: o.giusta, spiegazione: `Il risultato giusto è ${formatta(e.r)} (calcolato dalla calcolatrice).`, controllata: true }; });
}
async function creaRipasso(cervello, storiaLezione, materia, livello, quante = 4) {
  if (!storiaLezione.length) return domandeDiRiserva(quante, materia, livello);
  const lezione = storiaLezione.map(m => (m.role === "user" ? "Classe: " : "Fly Aula: ") + m.content).join("\n").slice(-7000);
  let proposte = [];
  try {
    const out = await cervello(`Crea ${quante + 2} domande di RIPASSO a scelta multipla SOLO su quello che è stato spiegato in questa lezione (${MATERIE[materia].nome}, scuola ${livello}).
Ogni domanda ha 4 opzioni e UNA sola giusta. Se la risposta è un numero, in "conto" scrivi l'espressione che la calcola (solo numeri e + − × : parentesi), altrimenti "".
Rispondi SOLO con JSON: {"domande":[{"domanda":"…","opzioni":["…","…","…","…"],"giusta":0,"spiegazione":"una frase","conto":""}]}`, "LEZIONE:\n" + lezione, { temperature: 0.4, format: "json" });
    proposte = (JSON.parse(out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1)).domande || []);
  } catch (e) {}
  const buone = [];
  for (const q of proposte) {
    if (buone.length >= quante) break;
    try {
      // controllo 1: forma giusta + calcolatrice sul risultato numerico
      if (!q.domanda || !Array.isArray(q.opzioni) || q.opzioni.length !== 4 || new Set(q.opzioni.map(String)).size !== 4 || !(q.giusta >= 0 && q.giusta <= 3)) continue;
      if (q.conto && String(q.conto).trim()) {
        const v = valuta(q.conto), x = leggiNumero((String(q.opzioni[q.giusta]).match(/-?\d+(?:[.,]\d+)*/) || [""])[0]);
        if (!isFinite(v) || !isFinite(x) || Math.abs(v - x) > Math.max(0.011, Math.abs(v) * 1e-6)) continue;
      }
      // controllo 2: risolta da capo, senza sapere la risposta
      const lettere = "ABCD";
      const sol = await cervello("Rispondi alla domanda a scelta multipla. Scrivi SOLO la lettera della risposta giusta (A, B, C o D).", `${q.domanda}\n${q.opzioni.map((o, i) => lettere[i] + ") " + o).join("\n")}`, { temperature: 0 });
      const l = (sol.toUpperCase().match(/\b[ABCD]\b/) || [""])[0];
      if (lettere.indexOf(l) !== Number(q.giusta)) continue;
      // controllo 3: revisore — una sola risposta giusta, ed è quella?
      const rev = await revisiona(cervello, "Questa domanda di ripasso ha UNA sola risposta giusta, ed è quella indicata come GIUSTA? Le altre sono sicuramente sbagliate?",
        `DOMANDA: ${q.domanda}\n${q.opzioni.map((o, i) => lettere[i] + ") " + o + (i === Number(q.giusta) ? "   ← GIUSTA" : "")).join("\n")}`, `${MATERIE[materia].nome}, scuola ${livello}.`);
      if (rev.ok !== true) continue;
      buone.push({ domanda: String(q.domanda), opzioni: q.opzioni.map(String), giusta: Number(q.giusta), spiegazione: String(q.spiegazione || ""), controllata: true });
    } catch (e) {}
  }
  if (buone.length < 2) return buone.concat(domandeDiRiserva(quante - buone.length, materia, livello));
  return buone;
}
function mostraRipasso(contenitore, domande, finito) {
  let i = 0, punti = 0;
  const giro = () => {
    if (i >= domande.length) {
      contenitore.innerHTML = `<div class="rip-fine"><div class="rip-trofeo">${punti === domande.length ? "🏆" : punti >= domande.length / 2 ? "🎉" : "💪"}</div>
        <h2>${punti} su ${domande.length}</h2><p>${punti === domande.length ? "Perfetto, classe!" : punti >= domande.length / 2 ? "Bravi! Ripassate quelle sbagliate." : "Niente paura: la prossima volta andrà meglio!"}</p>
        <button class="btn" id="ripChiudi">Chiudi</button></div>`;
      if (punti === domande.length) coriandoli(contenitore);
      contenitore.querySelector("#ripChiudi").onclick = finito;
      return;
    }
    const q = domande[i];
    contenitore.innerHTML = `<div class="rip-n">Domanda ${i + 1} di ${domande.length} · ✓ controllata</div><h2 class="rip-d">${escC(q.domanda)}</h2>
      <div class="rip-op">${q.opzioni.map((o, k) => `<button data-k="${k}"><b>${"ABCD"[k]}</b> ${escC(o)}</button>`).join("")}</div><div class="rip-esito"></div>`;
    contenitore.querySelectorAll(".rip-op button").forEach(b => b.onclick = () => {
      const k = +b.dataset.k, giusta = k === q.giusta;
      if (giusta) punti++;
      contenitore.querySelectorAll(".rip-op button").forEach(x => { x.disabled = true; if (+x.dataset.k === q.giusta) x.classList.add("si"); });
      if (!giusta) b.classList.add("no");
      contenitore.querySelector(".rip-esito").innerHTML = `<div class="${giusta ? "si" : "no"}">${giusta ? "🎉 Giusto!" : "Non era questa."} ${escC(q.spiegazione)}</div><button class="btn" id="ripAvanti">${i + 1 < domande.length ? "Avanti ▶" : "Risultato 🏁"}</button>`;
      contenitore.querySelector("#ripAvanti").onclick = () => { i++; giro(); };
    });
  };
  giro();
}

// ---------------- 🎉 coriandoli ----------------
function coriandoli(dove = document.body, n = 90) {
  const colori = ["#00D2A0", "#3B8BFF", "#FFD23F", "#FF5A5F", "#7C5CFF", "#fff"];
  const box = document.createElement("div"); box.className = "coriandoli";
  for (let i = 0; i < n; i++) {
    const c = document.createElement("i");
    c.style.cssText = `left:${Math.random() * 100}%;background:${colori[i % colori.length]};animation-delay:${Math.random() * .5}s;animation-duration:${1.6 + Math.random() * 1.6}s;transform:rotate(${Math.random() * 360}deg)`;
    box.appendChild(c);
  }
  dove.appendChild(box); setTimeout(() => box.remove(), 4000);
}

// ---------------- 📒 riassunto per gli assenti ----------------
async function creaRiassunto(cervello, storiaLezione, materia, livello, classe) {
  const lezione = storiaLezione.map(m => (m.role === "user" ? "Classe: " : "Fly Aula: ") + m.content).join("\n").slice(-8000);
  const testo = await cervello(`Scrivi il RIASSUNTO della lezione di oggi per chi era assente (${MATERIE[materia].nome}, classe ${classe}, scuola ${livello}).
Usa SOLO quello che c'è nella lezione. Niente nomi di persone. Ogni calcolo nella forma "a × b = c". Struttura esatta:
## Cosa abbiamo fatto
- 3-5 punti brevi
## Da ricordare
- regole, formule e definizioni spiegate
## Esempio svolto
1. un esempio della lezione, passo passo
## Per casa
- 1 o 2 esercizi simili a quelli della lezione`, "LEZIONE:\n" + lezione, { temperature: 0.2 });
  // controllo SEMPRE: 3 volte (calcolatrice + revisore + revisore indipendente) con la lezione come fonte
  return await ricontrolloCompleto(cervello, { domanda: "Riassunto della lezione per gli assenti: deve dire solo cose spiegate nella lezione, senza errori.", testo, contesto: `${MATERIE[materia].nome}, scuola ${livello}.\nLEZIONE (fonte sicura):\n${lezione.slice(-5000)}`, speciale: true, risultatoObbligatorio: false });
}
function riassuntoInHtml(testo) {
  let html = "", lista = false;
  for (const r of testo.split("\n")) {
    const t = r.trim(); if (!t) continue;
    if (/^#{1,3}\s/.test(t)) { if (lista) { html += "</ul>"; lista = false; } html += `<h3>${escC(t.replace(/^#+\s*/, ""))}</h3>`; continue; }
    const voce = t.match(/^(?:[-•*]|\d+[.)])\s+(.*)$/);
    if (voce) { if (!lista) { html += "<ul>"; lista = true; } html += `<li>${controllaConti(escC(voce[1]).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"))}</li>`; }
    else { if (lista) { html += "</ul>"; lista = false; } html += `<p>${controllaConti(escC(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"))}</p>`; }
  }
  return html + (lista ? "</ul>" : "");
}
