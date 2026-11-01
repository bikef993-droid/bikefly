// ===================================================================
//  FLY AULA v0.9.11 · il programma
//  Il "cervello" gira sul computer (Ollama); questa è la lavagna.
//  Niente internet: domande, risposte e voce restano sul computer.
// ===================================================================
const OLLAMA = "http://localhost:11434";
// i cervelli che conosciamo, dal più forte al più leggero (tutti entrano in una scheda da 16 GB).
// Se è stata fatta la GARA, vince il cervello scelto lì.
const MODELLI = ["gemma4:26b-a4b", "gemma4:12b", "qwen3.5:9b", "qwen3:14b", "gpt-oss:20b", "qwen2.5:14b", "gemma3:12b", "qwen3:8b", "qwen2.5:7b", "llama3.1:8b"];
let modello = null;      // il cervello principale (il più forte)
let secondo = null;      // il secondo cervello della COPPIA (di un'altra famiglia), oppure null
window.modelliPresenti = [];
// SEMPRE la stessa misura: se una richiesta chiede una misura diversa, Ollama deve ricaricare tutto il cervello
// (con tante classi sarebbe un disastro). Con le pagine del libro si accorcia la storia della lezione.
const contesto = () => 8192;
const $ = id => document.getElementById(id);
// il menu delle materie si costruisce da solo: ci sono tutte quelle che Fly Aula sa
(function menuMaterie() {
  const s = $("materia"); if (!s || typeof GRUPPI_MATERIE === "undefined") return;
  const prima = s.value;
  s.innerHTML = GRUPPI_MATERIE.map(([g, ks]) => `<optgroup label="${g}">${ks.filter(k => MATERIE[k]).map(k => `<option value="${k}">${MATERIE[k].emoji} ${MATERIE[k].nome}</option>`).join("")}</optgroup>`).join("");
  s.value = MATERIE[prima] ? prima : "matematica";
})();
const chat = $("chat");
function leggi(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function scrivi(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
function escape(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

// ---------------- il cervello ----------------
// Tetti di lunghezza: una risposta non può andare avanti per sempre
const MAX_PAROLE_LAVAGNA = 1500, MAX_PAROLE_LAVORO = 2048, MAX_CARATTERI_LAVAGNA = 6000;
// il "ragionamento lungo" dei cervelli nuovi: spento per la lavagna (risponde subito),
// acceso solo nel terzo controllo dei casi difficili. Si chiede a Ollama cosa sa fare ogni cervello.
const capacita = {};
async function leggiCapacita(m) {
  if (!m || capacita[m]) return capacita[m] || [];
  try {
    const r = await Scuola.chiama("/api/show", { method: "POST", body: JSON.stringify({ model: m }) });
    capacita[m] = r.ok ? ((await r.json()).capabilities || []) : [];
  } catch (e) { capacita[m] = []; }
  return capacita[m];
}
function pensiero(m, pensa) {
  if (!(capacita[m] || []).includes("thinking")) return {};
  if (/gpt-oss/.test(m)) return { think: pensa ? "medium" : "low" };   // gpt-oss non si spegne del tutto
  return { think: !!pensa };
}
const tetto = (m, pensa, base) => { const t = pensiero(m, pensa).think; return t && t !== false ? base + 6144 : base; };
const senzaPensieri = t => t.replace(/<think>[\s\S]*?(<\/think>|$)/g, "");

// 🔁 il "disco rotto": il cervello ripete la stessa cosa all'infinito.
// Se succede si tiene solo la prima volta e ci si ferma.
const NUMERO_PASSO = /^\s*\d+[.)]\s*/;
function trovaGiro(testo) {
  // a) la stessa riga ripetuta (anche se cambia il numero del passaggio)
  const visti = new Map(); let pos = 0;
  for (const r of testo.split("\n")) {
    const k = r.replace(NUMERO_PASSO, "").replace(/\s+/g, " ").trim().toLowerCase();
    if (k.length >= 4) {
      const v = visti.get(k);
      if (!v) visti.set(k, { n: 1, seconda: 0 });
      else {
        v.n++;
        if (v.n === 2) v.seconda = pos;
        if (v.n >= 4) return { testo: testo.slice(0, v.seconda).trimEnd(), giro: true };
      }
    }
    pos += r.length + 1;
  }
  // b) lo stesso pezzo ripetuto di fila: "320 : 8 320 : 8 320 : 8 …"
  const inizio = Math.max(0, testo.length - 600), coda = testo.slice(inizio);
  const m = coda.match(/([^\n]{3,80}?)(?:[\s,;.]*\1){6,}[\s,;.]*$/);
  if (m) {
    // si tolgono anche le ripetizioni più indietro: resta una volta sola
    const pezzo = m[1].trim(), sep = /[ \t,;.]*$/;
    let prima = testo.slice(0, inizio + m.index);
    for (let k = 0; k < 2000 && pezzo; k++) {
      const p = prima.replace(sep, "");
      if (!p.endsWith(pezzo)) break;
      prima = p.slice(0, -pezzo.length);
    }
    prima = prima.replace(sep, "");
    return { testo: (prima + (prima && !prima.endsWith("\n") ? " " : "") + pezzo).trim(), giro: true };
  }
  return null;
}

// ---------------- 🛟 ANTI-BLOCCO ----------------
// Nessuna chiamata può restare appesa: se un cervello non risponde in tempo si passa all'altro
// della coppia (e quello lento viene tolto dalla coppia). Senza coppia, si avvisa e si riprova.
const LIMITI = {
  prima: Number(leggi("flyaula_t_prima")) || 90000,      // prima parola sulla lavagna (comprende il caricamento del cervello)
  silenzio: Number(leggi("flyaula_t_silenzio")) || 45000, // pausa massima a metà risposta
  lavoro: Number(leggi("flyaula_t_lavoro")) || 150000,    // un controllo (risposta intera)
  pensa: Number(leggi("flyaula_t_pensa")) || 300000       // un controllo con il ragionamento lungo
};
class CervelloLento extends Error { constructor(m) { super(`${m} non risponde in tempo`); this.name = "CervelloLento"; } }
const altroDellaCoppia = m => secondo ? (m === modello ? secondo : m === secondo ? modello : null) : null;
const coppieNo = () => { try { return JSON.parse(leggi("flyaula_coppie_no") || "[]"); } catch (e) { return []; } };
const chiaveCoppia = (a, b) => [a, b].sort().join(" + ");
function scaricaDallaScheda(m) { Scuola.chiama("/api/generate", { method: "POST", body: JSON.stringify({ model: m, keep_alive: 0 }) }).catch(() => {}); }
// un cervello della coppia non va: si toglie dalla coppia (e non si riprova più questa coppia su questo computer)
const tolti = new Set();        // cervelli tolti dalla coppia in questa sessione
function togliDallaCoppia(m, motivo) {
  if (!secondo || (m !== modello && m !== secondo)) return;
  tolti.add(m);
  const no = coppieNo(); no.push(chiaveCoppia(modello, secondo)); scrivi("flyaula_coppie_no", JSON.stringify([...new Set(no)].slice(-20)));
  if (m === modello) modello = secondo;
  secondo = null;
  scaricaDallaScheda(m);
  try { annotaErrore("Cervello tolto dalla coppia", `${m}: ${motivo}. Fly Aula continua con ${modello}.`, "(automatico)"); } catch (e) {}
  aggiornaEtichettaStato();
}
async function unaChiamata(m, corpo, ms) {
  const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await Scuola.chiama("/api/chat", { method: "POST", signal: ctrl.signal, body: JSON.stringify({ ...corpo, model: m, ...pensiero(m, corpo._pensa), _pensa: undefined }) });
    if (!r.ok) throw new Error(`Ollama ha risposto ${r.status}: ${(await r.text()).slice(0, 160)}`);
    return await r.json();
  } catch (e) { throw e.name === "AbortError" ? new CervelloLento(m) : e; }
  finally { clearTimeout(t); }
}

// risposta intera (per revisore, esercizi, esame, riassunti)
// usa = quale cervello (se non si dice: il principale)
async function cervello(sistema, utente, { temperature = 0.2, format, pensa = false, usa } = {}) {
  const m = usa && !tolti.has(usa) ? usa : modello;   // un cervello tolto dalla coppia (perché bloccato) non si usa più
  const corpo = m2 => ({ stream: false, keep_alive: "2h", ...(format ? { format } : {}), _pensa: pensa,
    options: { temperature, num_ctx: contesto(), num_predict: tetto(m2, pensa, MAX_PAROLE_LAVORO) }, messages: [{ role: "system", content: sistema }, { role: "user", content: utente }] });
  const ms = pensa ? LIMITI.pensa : LIMITI.lavoro;
  let j;
  try { j = await unaChiamata(m, corpo(m), ms); }
  catch (e) {
    const altro = altroDellaCoppia(m);
    if (!altro) throw e;
    togliDallaCoppia(m, e.message);           // il controllo lo rifà l'altro cervello
    j = await unaChiamata(altro, corpo(altro), ms);
  }
  let t = senzaPensieri(j.message?.content || "").trim();
  if (format) return t;                      // JSON: lo pulisce chi lo legge
  const g = trovaGiro(t);
  if (g) t = g.testo;
  return pulisciLatex(t);                    // il LaTeX diventa simboli normali
}

// risposta che si scrive mentre arriva (per la lavagna).
// Si ferma da sola se si incanta o diventa troppo lunga; il prof la può fermare (⏹ o Esc).
// Restituisce { testo, fine }: fine = null (tutto ok) | "giro" | "lunga" | "fermata" | "lento"
let rispostaInCorso = null;
function fermaRisposta() { if (rispostaInCorso) rispostaInCorso.abort(); }
async function cervelloInDiretta(messaggi, ogniPezzo, m = modello) {
  const ctrl = new AbortController();
  rispostaInCorso = ctrl;
  let testo = "", fine = null, ultimo = Date.now(), arrivato = false;
  // il guardiano: se il cervello tace troppo, si ferma tutto (anche se si è bloccato prima della prima parola)
  const guardiano = setInterval(() => {
    if (Date.now() - ultimo > (arrivato ? LIMITI.silenzio : LIMITI.prima)) { fine = "lento"; ctrl.abort(); }
  }, 1000);
  try {
    const r = await Scuola.chiama("/api/chat", {
      method: "POST", signal: ctrl.signal,
      body: JSON.stringify({ model: m, stream: true, keep_alive: "2h", ...pensiero(m, false), options: { temperature: 0.2, num_ctx: contesto(), num_predict: tetto(m, false, MAX_PAROLE_LAVAGNA) }, messages: messaggi })
    });
    if (!r.ok) throw new Error(`Ollama ha risposto ${r.status}: ${(await r.text()).slice(0, 160)}`);
    const lettore = r.body.getReader(), dec = new TextDecoder();
    let resto = "", controllato = 0;
    flusso: for (;;) {
      const { value, done } = await lettore.read();
      if (done) break;
      resto += dec.decode(value, { stream: true });
      const righe = resto.split("\n"); resto = righe.pop();
      for (const l of righe) {
        if (!l.trim()) continue;
        const pezzo = JSON.parse(l);
        if (pezzo.error) throw new Error("Ollama: " + String(pezzo.error).slice(0, 160));
        ultimo = Date.now(); arrivato = true;            // anche il "ragionamento" conta: il cervello è vivo
        testo += pezzo.message?.content || "";
        const pulito = senzaPensieri(testo);
        if (pulito.length - controllato >= 30) {
          controllato = pulito.length;
          const g = trovaGiro(pulito);
          if (g) { testo = g.testo; fine = "giro"; break flusso; }
        }
        if (pulito.length > MAX_CARATTERI_LAVAGNA) { testo = pulito; fine = "lunga"; break flusso; }
        ogniPezzo(pulisciLatex(pulito));
      }
    }
    if (fine) ctrl.abort();                  // così il cervello smette davvero di scrivere
  } catch (e) {
    if (e.name !== "AbortError") throw e;
    fine = fine || "fermata";
  } finally { clearInterval(guardiano); if (rispostaInCorso === ctrl) rispostaInCorso = null; }
  return { testo: pulisciLatex(senzaPensieri(testo).trim()), fine };
}

// ---------------- tabella degli errori ----------------
let domandaCorrente = "";
function registro() { try { return JSON.parse(leggi("flyaula_errori") || "[]"); } catch (e) { return []; } }
function statistiche() { try { return JSON.parse(leggi("flyaula_stat") || "{}"); } catch (e) { return {}; } }
function conta(campo, n = 1) { const s = statistiche(); s[campo] = (s[campo] || 0) + n; scrivi("flyaula_stat", JSON.stringify(s)); }
function annotaErrore(tipo, dettaglio, domanda = domandaCorrente) {
  const r = registro();
  r.unshift({ quando: new Date().toLocaleString("it-IT"), classe: $("classe").value, livello: $("livello").value, materia: MATERIE[$("materia").value].nome, modello, tipo, domanda: String(domanda).slice(0, 200), dettaglio: String(dettaglio).slice(0, 400) });
  scrivi("flyaula_errori", JSON.stringify(r.slice(0, 500)));
  $("nErrori").textContent = r.length;
}
function disegnaRegistro() {
  const r = registro(), s = statistiche();
  const controllati = (s.contiOk || 0) + (s.contiCorretti || 0);
  const affid = s.risposte ? Math.round(1000 * (1 - (s.segnalate || 0) / s.risposte)) / 10 : 100;
  $("stat").innerHTML = `
    <div><b>${s.risposte || 0}</b><span>risposte date</span></div>
    <div><b>${s.doppi || 0}</b><span>controllate 2 volte ✓✓</span></div>
    <div><b>${s.tripli || 0}</b><span>controllate 3 volte ✓✓✓</span></div>
    <div><b style="color:var(--corallo)">${s.dubbi || 0}</b><span>dubbi segnalati al prof</span></div>
    <div><b style="color:var(--viola)">${s.correttiRevisore || 0}</b><span>corrette dal ricontrollo</span></div>
    <div><b>${controllati}</b><span>conti controllati</span></div>
    <div><b style="color:var(--sole)">${s.contiCorretti || 0}</b><span>conti corretti dalla calcolatrice</span></div>
    <div><b style="color:var(--corallo)">${s.segnalate || 0}</b><span>segnalate dal prof</span></div>
    <div><b>${affid}%</b><span>risposte senza segnalazioni</span></div>`;
  const cls = t => t.startsWith("Conto") ? "calc" : t.startsWith("Corretta dal") || t.startsWith("Dubbio") ? "rev" : t.startsWith("Bloccata") ? "sic" : "prof";
  $("righe").innerHTML = r.length ? r.map(e => `<tr><td>${escape(e.quando)}</td><td>${escape(e.classe)}<br><small>${escape(e.materia || "")} · ${escape(e.livello || "")}</small></td><td class="tipo ${cls(e.tipo)}">${escape(e.tipo)}</td><td>${escape(e.domanda)}</td><td>${escape(e.dettaglio)}</td></tr>`).join("")
    : `<tr><td colspan="5" style="text-align:center;color:var(--nebbia);padding:24px">Nessun errore registrato 🎉</td></tr>`;
}
function scaricaCsv(nome, intestazione, righe) {
  const q = v => '"' + String(v ?? "").replace(/"/g, '""') + '"';
  const csv = "﻿" + [intestazione.join(";"), ...righe.map(r => r.map(q).join(";"))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = nome; a.click();
}

// ---------------- la lezione (memoria) ----------------
let storia = [], inizioLezione = Date.now(), fineLezione = null, lezioneOrario = null, avvisoRipasso = false;
const chiaveRiassunto = () => "flyaula_riassunto_" + ($("classe").value || "classe").trim() + "_" + $("materia").value;
function schermataIniziale() {
  const m = MATERIE[$("materia").value], anno = annoDellaClasse($("classe").value);
  const esempi = ($("livello").value === "superiori" && (anno === 1 || anno === 2) && m.esempi.biennio) || m.esempi[$("livello").value] || m.esempi.medie;
  const r = leggi(chiaveRiassunto());
  chat.innerHTML = `
    <div id="avvisoMateria"></div>
    ${r ? `<div id="ricordo" style="display:block">📒 <b>L'ultima volta con la ${escape($("classe").value)}:</b> ${escape(r)}</div>` : ""}
    <div class="vuoto" id="vuoto">
      <h1>Ciao! Sono Fly Aula ${m.emoji}</h1>
      <p>Assistente di <b>${m.nome}</b>. Spiego passo passo e ricontrollo sempre quello che dico. Tutto resta su questo computer.</p>
      <div class="esempi">${esempi.map(e => `<button>${escape(e)}</button>`).join("")}<button class="es-eser">✏️ Fammi un esercizio</button></div>
    </div>`;
  chat.querySelectorAll(".esempi button").forEach(b => b.onclick = () => b.classList.contains("es-eser") ? nuovoEsercizio() : chiedi(b.textContent));
  aggiornaAvvisoMateria();
}
function aggiungi(chi, html) {
  $("vuoto") && $("vuoto").remove();
  const d = document.createElement("div");
  d.className = "msg " + chi;
  d.innerHTML = chi === "ai" ? `<div class="chi">🧠 Fly Aula</div><div class="bolla">${html}</div>` : chi === "io" ? `<div class="bolla">${html}</div>` : html;
  chat.appendChild(d); chat.scrollTop = chat.scrollHeight;
  return d.querySelector(".bolla") || d;
}
async function riassunto() {
  if (!modello || storia.length < 2) return null;
  try {
    const t = await cervello("Scrivi in massimo 2 frasi SOLO FATTI di questa lezione: quali argomenti ed esercizi sono stati fatti (con i numeri) e, se è successo davvero, su cosa la classe ha avuto dubbi. Niente supposizioni: non scrivere mai 'probabilmente', 'forse', 'sembra'. Niente nomi di persone, niente consigli.",
      storia.map(m => (m.role === "user" ? "Classe: " : "Fly Aula: ") + m.content).join("\n").slice(-6000), { temperature: 0.1 });
    // se il cervello tira a indovinare lo stesso, quelle frasi si tolgono
    const fatti = (t.match(/[^.!?]+[.!?]*/g) || []).filter(f => !/\b(probabilment|forse|sembr|presumibil|potrebbe|ipotizz)/i.test(f)).join(" ").replace(/\s+/g, " ").trim();
    return fatti.length >= 15 ? fatti : null;
  } catch (e) { return null; }
}
async function riassumi() {
  const s = await riassunto();
  if (s) storia = [{ role: "user", content: "Riassunto della lezione finora: " + s }, { role: "assistant", content: "Va bene, continuo da qui." }, ...storia.slice(-4)];
}
async function nuovaLezione(salva = true) {
  if (storia.length) conta("lezioni");
  if (salva && storia.length) { const s = await riassunto(); if (s) scrivi(chiaveRiassunto(), s); }
  storia = []; inizioLezione = Date.now(); avvisoRipasso = false;
  Pagine.svuota();
  schermataIniziale();
}

// ---------------- impaginazione: passaggi, conti, disegni ----------------
function impagina(testo, finito, segna) {
  const righe = testo.split(/\n+/).filter(r => r.trim());
  const disegnati = new Set();                 // ogni disegno una volta sola, al massimo 3
  return righe.map(r => {
    const dis = r.trim().match(/^\[DISEGNO:\s*(.+?)\]\s*$/i);
    if (dis) {
      const k = dis[1].replace(/\s+/g, " ").toLowerCase();
      if (disegnati.has(k) || disegnati.size >= 3) return "";
      disegnati.add(k);
      return finito ? (disegna(dis[1]) || "") : `<div class="lavoro">🎨 preparo il disegno…</div>`;
    }
    let e = escape(r).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\[DISEGNO:[^\]]*\]/gi, "");
    if (typeof Scrittura !== "undefined") e = Scrittura.abbellisci(e, $("materia").value);   // H₂O, m/s², art. 3
    const m = e.match(/^\s*(\d+)[.)]\s+(.*)$/);
    const corpo = finito ? controllaConti(m ? m[2] : e, segna) : (m ? m[2] : e);
    return m ? `<div class="passo"><span class="n">${m[1]}</span><span>${corpo}</span></div>` : `<div>${corpo}</div>`;
  }).join("") + (finito ? "" : '<span class="cursore"></span>');
}
// versione testo (per l'esame): i conti sbagliati vengono corretti dalla calcolatrice
function correggiTesto(testo) { return correggiConti(testo).testo; }

// quando la domanda è un conto, il disegno lo aggiunge Fly Aula (sempre giusto: lo calcola il programma)
function disegnoPerConto(conto) {
  const m = String(conto.testo).match(/^([\d.,]+)\s*([+\-−×x*·÷:\/])\s*([\d.,]+)$/);
  if (!m) return null;
  const a = leggiNumero(m[1]), b = leggiNumero(m[3]), op = m[2];
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b <= 0) return null;
  if (":÷/".includes(op)) return a < 1e7 && b < 1000 ? `[DISEGNO: divisione ${a} ${b}]` : null;
  if ("+".includes(op)) return a < 1e9 && b < 1e9 ? `[DISEGNO: colonna ${a} + ${b}]` : null;
  if ("-−".includes(op)) return a >= b && a < 1e9 ? `[DISEGNO: colonna ${a} − ${b}]` : null;
  return a < 1e7 && b < 1000 ? `[DISEGNO: colonna ${a} × ${b}]` : null;
}

// ---------------- ⚡ MEMORIA DELLE RISPOSTE GIÀ CONTROLLATE ----------------
// Con tante classi molte domande si ripetono ("320 : 8", "cos'è una frazione"…). La prima volta Fly Aula
// risponde e controlla; poi la risposta controllata resta sul server della scuola per 30 giorni e,
// in qualsiasi aula, la stessa domanda (stessa materia, livello, anno e argomento) arriva SUBITO.
// Non si salvano: risposte con un dubbio, domande che continuano la conversazione, pagine del libro,
// modalità del prof diverse da "normale", DSA. Se un prof segnala un errore, la risposta si cancella.
const VERSIONE_MEMORIA = 2;   // si cambia quando le risposte migliorano: le vecchie non si usano più
function impronta(t) {                       // un'impronta del testo (32 cifre esadecimali): niente testo in chiaro nel nome
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57, h3 = 0x9e3779b9, h4 = 0x7f4a7c15;
  for (let i = 0; i < t.length; i++) {
    const c = t.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677);
    h3 = Math.imul(h3 ^ c, 2246822507); h4 = Math.imul(h4 ^ c, 3266489909);
  }
  return [h1, h2, h3, h4].map(h => (h >>> 0).toString(16).padStart(8, "0")).join("");
}
const CONTINUA = /^(e|ma|allora|quindi|poi|invece|ok|sì|si|no|perché no)\b|\b(quest[oaie]|quell[oaie]|sopra|ancora|rifai|ripeti|di nuovo|lo stesso|la stessa|l'esercizio|il tuo|la tua)\b/i;
function chiaveMemoria(domanda, materia, livello, classe, giaParlato, speciale = {}) {
  if (Pagine.attive || Prof.modo !== "normale" || DSA.attiva || speciale.esercizio) return null;
  const d = domanda.toLowerCase().replace(/[“”"'’`]/g, "").replace(/[?!;]+/g, " ").replace(/\s+/g, " ").trim().replace(/[.,]$/, "");
  if (d.length < 6) return null;
  if (giaParlato && CONTINUA.test(d)) return null;          // continua la conversazione: dipende da cosa è stato detto prima
  if (/\b(dammi|fammi|inventa|crea|preparami)\b[^?]{0,30}\besercizi?\b/i.test(d)) return null;   // esercizi sempre nuovi, non dalla memoria
  return impronta(JSON.stringify([VERSIONE_MEMORIA, materia, livello, annoDellaClasse(classe) || 0, (Prof.argomento || "").toLowerCase(), d]));
}
function intestazioniMemoria() { return Scuola.codiceLim ? { "X-FlyAula-Codice": Scuola.codiceLim } : {}; }
async function leggiMemoria(k, materia = "") {
  const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), 2500);
  try {
    const r = await fetch("/fa/memo?k=" + k, { cache: "no-store", signal: ctrl.signal });
    if (!r.ok) return null;
    const j = await r.json();
    const testo = ripulisciRobot(String(j.testo || "")).testo;
    // anche dalla memoria: niente di strano, conti giusti, niente ripetizioni (altrimenti si risponde da capo)
    if (!testo || testo.length > 8000 || !controllaRisposta(testo, materia) || correggiConti(testo).corretti || Fatti.correggi(testo).corretti || trovaGiro(testo)) return null;
    return { testo, controlli: Number(j.controlli) || 2, coppia: !!j.coppia };
  } catch (e) { return null; } finally { clearTimeout(t); }
}
function salvaInMemoria(k, dati) {
  fetch("/fa/memo?k=" + k, { method: "POST", headers: intestazioniMemoria(), body: JSON.stringify({ ...dati, quando: new Date().toISOString() }) }).catch(() => {});
}
function cancellaDaMemoria(k) { if (k) fetch("/fa/memo?k=" + k, { method: "DELETE", headers: intestazioniMemoria() }).catch(() => {}); }

// ---------------- ⏳ LA FILA ----------------
// Quando tante classi chiedono insieme, il server della scuola sa chi aspetta da quando:
// la LIM, invece di un'attesa muta, dice "sei il 3° in fila". (Senza server: non fa niente.)
function entraInFila(bolla) {
  const id = (Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(/[^a-z0-9]/g, "").slice(0, 16);
  let attivo = true;
  const giro = async () => {
    if (!attivo) return;
    try {
      const r = await fetch(`/fa/fila?id=${id}`, { cache: "no-store" });   // GET: il server di Windows rifiuta i POST vuoti
      if (r.ok) {
        const j = await r.json(), pos = j.davanti - Math.max(1, j.posti) + 1;
        if (attivo && bolla.dataset.scrive !== "1") {
          if (pos >= 1) bolla.innerHTML = `<div class="lavoro fila">⏳ Tante classi stanno chiedendo insieme: sei ${pos === 1 ? "il prossimo" : "il " + pos + "° in fila"}. Arrivo!</div>`;
          else if (bolla.querySelector(".fila")) bolla.innerHTML = '<span class="cursore"></span>';
        }
      }
    } catch (e) {}
    if (attivo) setTimeout(giro, 2000);
  };
  giro();
  return () => { attivo = false; fetch(`/fa/fila?id=${id}&azione=esci`, { cache: "no-store" }).catch(() => {}); };
}

// ---------------- 🤝 la COPPIA di cervelli ----------------
// Due cervelli di famiglie diverse (es. Google + Alibaba) non fanno gli stessi errori:
// uno scrive, l'altro controlla. Chi scrive dipende dalla domanda:
//  - domanda facile (un conto secco, una definizione): scrive il secondo, controlla il principale
//  - domanda difficile (problemi, sistemi, partita doppia, perché…): scrive il principale, controlla il secondo
//  - il terzo controllo (quando serve) lo fa il cervello che NON ha fatto il secondo; nei casi difficili ragiona a lungo
const cervelloDi = m => (sistema, utente, o = {}) => cervello(sistema, utente, { ...o, usa: m });
function domandaDifficile(domanda, materia, speciale = {}) {
  if (speciale.esercizio || Pagine.attive) return true;
  const calcoli = MATERIE[materia] && MATERIE[materia].calcoli;
  if (calcoli && contoNellaDomanda(domanda)) return false;          // conto secco: i numeri li ha già la calcolatrice
  if (calcoli && /\d/.test(domanda)) return true;                   // problema con i numeri
  return domanda.length > 140 || /problem|sistem|equazion|disequaz|dimostr|risolv|partita doppia|scrittur|bilanci|perch[eé]|confront|differenz|analizz/i.test(domanda);
}
function squadra(difficile) {
  if (!secondo) return { autore: modello, controllore: modello };
  return difficile ? { autore: modello, controllore: secondo } : { autore: secondo, controllore: modello };
}

// ---------------- 🧮 la calcolatrice fa i conti ----------------
// conto secco ("320 : 8"): lo fa subito. Problema con numeri: il cervello dice quali conti servono, la calcolatrice li fa.
async function contiPrima(domanda, materia, bolla) {
  if (!MATERIE[materia].calcoli || !/\d/.test(domanda)) return [];
  const secco = contoNellaDomanda(domanda);
  if (secco) return [{ cosa: "", testo: secco.testo, risultato: secco.risultato }];
  if (bolla) bolla.innerHTML = `<div class="lavoro">🧮 La calcolatrice prepara i conti…</div>`;
  const fatti = await pianoConti(cervello, domanda, MATERIE[materia].nome);
  if (bolla) bolla.innerHTML = '<span class="cursore"></span>';
  return fatti;
}

// ✏️ conto secco: il cervello sa che il disegno c'è già e riceve i passaggi giusti cifra per cifra
function passiPerConto(conto) {
  const m = conto && String(conto.testo).match(/^([\d.,]+)\s*([+\-−×x*·÷:\/])\s*([\d.,]+)$/);
  return m ? passiInColonna(leggiNumero(m[1]), m[2], leggiNumero(m[3])) : null;
}
function aiutoColonna(conto) {
  if (!conto) return "";
  const dis = disegnoPerConto(conto);
  if (!dis) return "";
  let t = `\nIL DISEGNO C'È GIÀ: sopra la tua spiegazione Fly Aula mostra da sola ${conto.testo} in colonna. NON scrivere tu il comando del disegno e NON dire mai che non puoi disegnare o creare immagini.`;
  if (Prof.modo === "guida") return t;
  let passi = passiPerConto(conto);
  if (!passi) return t;
  if (Prof.modo === "spiega") passi = passi.slice(0, -1);         // il prof non vuole il risultato finale
  return t + `\nPASSAGGI GIUSTI DEL CALCOLO IN COLONNA (calcolati da Fly Aula: usali così come sono, uno per riga numerata, spiegandoli con parole semplici):\n` + passi.map((p, i) => `${i + 1}. ${p}`).join("\n");
}

// ---------------- la domanda: risposta + CONTROLLO SEMPRE ----------------
let occupato = false;
function inPausa() {
  if (!Prof.verificaAttiva()) return false;
  Prof.mostraVerifica(); return true;
}
// speciale = { esercizio: true } quando la domanda arriva dagli esercizi (controllo triplo)
async function chiedi(domanda, speciale = {}) {
  if (occupato || inPausa()) return;
  if (!modello) return mostraAiuto();
  if (lezioneOrario && !lezioneOrario.chiave) return;
  const sic = controllaDomanda(domanda);
  aggiungi("io", escape(domanda));
  if (!sic.ok) {
    aggiungi("ai", escape(sic.risposta));
    annotaErrore("Bloccata dalla sicurezza", sic.motivo, sic.motivo === "aiuto" ? "(domanda personale: non salvata)" : domanda);
    return;
  }
  const vietata = Prof.bloccata(domanda);
  if (vietata) {
    aggiungi("ai", "Oggi il prof ha chiesto di non parlare di questo 🙂 Torniamo alla lezione!");
    annotaErrore("Bloccata dal prof", `parola vietata oggi: "${vietata}"`, domanda);
    return;
  }
  occupato = true; $("invia").disabled = true; Voce.zitto();
  const t0 = Date.now(); let daMemoria = false, risposta = false;
  domandaCorrente = domanda;
  const giaParlato = storia.length > 0;
  storia.push({ role: "user", content: domanda });
  const bolla = aggiungi("ai", '<span class="cursore"></span>');
  const attesa = setTimeout(() => { if (bolla.querySelector(".cursore") && bolla.textContent.trim() === "") bolla.innerHTML = `<div class="lavoro">${Scuola.ruolo === "lim" ? "⏳ Fly Aula sta aiutando altre classi, arrivo…" : "☕ Ci penso un attimo…"}</div>`; }, 4000);
  const materia = $("materia").value, livello = $("livello").value;
  let sistema = istruzioniMateria(materia, livello, $("classe").value, leggi(chiaveRiassunto())) + istruzioniProgramma(materia, livello, $("classe").value) + Prof.istruzioni(MATERIE[materia].nome) + Pagine.istruzioni() + DSA.istruzioni();
  const chiave = chiaveMemoria(domanda, materia, livello, $("classe").value, giaParlato, speciale);
  let esciDallaFila = null;
  try { fatto: {
    // ⚡ questa domanda ha già una risposta controllata (da un'altra lezione o un'altra aula)? arriva subito
    const ricordo = chiave ? await leggiMemoria(chiave, materia) : null;
    if (ricordo) {
      clearTimeout(attesa);
      const timbri = [`<span class="timbro">Controllata ${ricordo.controlli >= 3 ? "3 volte ✓✓✓" : "2 volte ✓✓"}</span>`];
      if (ricordo.coppia) timbri.push(`<span class="timbro blu">🤝 Controllata da un secondo cervello</span>`);
      timbri.push(`<span class="timbro blu">⚡ Già controllata in un'altra lezione: risposta immediata</span>`);
      bolla.innerHTML = impagina(ricordo.testo, true, tipo => { if (tipo === "ok") conta("contiOk"); }) + `<div class="timbri">${timbri.join("")}</div>`;
      conta("risposte"); conta("dallaMemoria"); contaGiorno(materia);
      aggiungiAzioni(bolla, domanda, ricordo.testo, chiave);
      storia.push({ role: "assistant", content: ricordo.testo });
      if (leggiAuto) leggiRisposta(bolla, ricordo.testo);
      const lingua = $("lingua").value;
      if (lingua) { chat.scrollTop = chat.scrollHeight; await aggiungiTraduzione(bolla, ricordo.testo, lingua); }
      daMemoria = risposta = true;
      break fatto;
    }
    esciDallaFila = entraInFila(bolla);
    // 0) 🧮 i conti li fa la calcolatrice PRIMA che il cervello scriva
    const fatti = await contiPrima(domanda, materia, bolla);
    sistema += istruzioniFatti(fatti) + Fatti.perDomanda(domanda);   // 📚 date, capitali, autori… quelli sicuri
    const contoSecco = MATERIE[materia].calcoli ? contoNellaDomanda(domanda) : null;
    sistema += aiutoColonna(contoSecco);
    // 1) prima stesura (si vede mentre la scrive; il prof la può fermare con ⏹)
    mostraFerma(true);
    const difficile = domandaDifficile(domanda, materia, speciale);
    let sq, prima;
    // se il cervello che scrive non risponde (o dà errore) e c'è la coppia, si riprova subito con l'altro
    for (let tentativo = 0; tentativo < 2; tentativo++) {
      sq = squadra(difficile);
      let errore = null;
      try { prima = await cervelloInDiretta([{ role: "system", content: sistema }, ...storia.slice(Pagine.attive ? -6 : -16)], t => { clearTimeout(attesa); bolla.dataset.scrive = "1"; bolla.innerHTML = impagina(t, false); chat.scrollTop = chat.scrollHeight; }, sq.autore); }
      catch (e) { errore = e; prima = { testo: "", fine: "lento" }; }
      const vuota = prima.testo.replace(/\[DISEGNO:[^\]]*\]/gi, "").trim().length < 40;
      if (prima.fine !== "lento" || !vuota) break;
      if (!altroDellaCoppia(sq.autore)) { if (errore) throw errore; break; }
      togliDallaCoppia(sq.autore, errore ? errore.message : "non ha risposto in tempo");
      bolla.innerHTML = `<div class="lavoro">🔁 Il primo cervello non risponde: provo con l'altro…</div>`;
    }
    mostraFerma(false);
    clearTimeout(attesa);
    let testo = prima.testo;
    if (prima.fine === "lento" && testo.replace(/\[DISEGNO:[^\]]*\]/gi, "").trim().length < 40) {
      bolla.innerHTML = Scuola.ruolo === "lim" ? "🐢 Il cervello della scuola è molto lento in questo momento. Riprova tra un attimo: se continua, chiama il tecnico." : "🐢 Il cervello ci sta mettendo troppo. Riprova tra un attimo: se continua, riavvia Fly Aula.";
      annotaErrore("Cervello troppo lento", `${sq.autore} non ha risposto in tempo`);
      storia.pop();
      break fatto;
    }
    if (prima.fine === "fermata") {
      bolla.innerHTML = (testo ? impagina(testo, true) : "") + `<div class="timbri"><span class="timbro rosso">⏹ Fermata dal prof: questa risposta non è stata controllata</span></div>`;
      storia.pop();
      break fatto;
    }
    if (prima.fine && testo.replace(/\[DISEGNO:[^\]]*\]/gi, "").trim().length < 40) {
      bolla.innerHTML = "🔁 Mi sono incantata e mi sono fermata da sola. Riprova con altre parole 🙂";
      annotaErrore("Si ripeteva (fermata da sola)", "non era rimasto niente di utile da mostrare");
      storia.pop();
      break fatto;
    }
    if (prima.fine) annotaErrore(prima.fine === "giro" ? "Si ripeteva (fermata da sola)" : prima.fine === "lento" ? "Si è fermato a metà (troppo lento)" : "Risposta troppo lunga (accorciata)", testo.slice(-160));
    // 2) CONTROLLO SEMPRE: 2 volte, 3 nei casi speciali
    bolla.classList.add("controllo");
    bolla.insertAdjacentHTML("beforeend", `<div class="lavoro" id="lavoroRev">🧮 Controllo 1: la calcolatrice rifà i conti…</div>`);
    const passi = { 1: "🧮 Controllo 1: la calcolatrice rifà i conti…", 2: "🔍 Controllo 2: rileggo tutto da revisore…", 3: "🔎 Controllo 3: lo rifaccio da capo per sicurezza…" };
    const timbri = [];
    const conto = MATERIE[materia].calcoli ? contoNellaDomanda(domanda) : null;
    const modoProf = Prof.modo;
    let ctx = `${MATERIE[materia].nome}, scuola ${livello}.`;
    if (modoProf === "spiega") ctx += " SCELTA DEL PROF: la risposta NON deve contenere il risultato finale, deve fermarsi prima dell'ultimo passaggio. Non è un errore.";
    if (modoProf === "guida") ctx += " SCELTA DEL PROF: la risposta deve essere UNA domanda guida con un indizio, senza risultato. Non è un errore.";
    if (Pagine.attive) ctx += "\n" + Pagine.fonte();
    const es = await ricontrolloCompleto(cervelloDi(sq.autore), {
      controllore: cervelloDi(sq.controllore),
      domanda, testo, contesto: ctx, conto,
      speciale: !!speciale.esercizio || !MATERIE[materia].calcoli || !!prima.fine,
      risultatoObbligatorio: modoProf === "normale",
      ogniPasso: n => { const l = $("lavoroRev"); if (l) l.textContent = passi[n]; }
    });
    testo = es.testo;
    // 📚 i fatti sicuri: una data, una capitale, un autore o un numero della Costituzione sbagliati si correggono qui
    const fc = Fatti.correggi(testo, materia);
    if (fc.corretti) { testo = fc.testo; conta("fattiCorretti", fc.corretti); annotaErrore("Fatto sbagliato (corretto con i fatti sicuri)", fc.dettagli.join(" · ")); }
    conta("ricontrollate"); conta(es.controlli >= 3 ? "tripli" : "doppi"); contaGiorno(materia);
    if (es.contiCorretti) { conta("contiCorretti", es.contiCorretti); annotaErrore("Conto sbagliato (corretto dalla calcolatrice)", `${es.contiCorretti} ${es.contiCorretti === 1 ? "conto corretto" : "conti corretti"}`); }
    es.correzioni.forEach(c => { conta("correttiRevisore"); annotaErrore("Corretta dal ricontrollo", c); });
    const quante = es.controlli >= 3 ? "3 volte ✓✓✓" : "2 volte ✓✓";
    if (es.stato === "dubbio") {
      conta("dubbi");
      annotaErrore("Dubbio dopo 3 controlli", es.correzioni.join(" · "));
      testo += "\n⚠️ Non sono sicura di questa risposta: controlliamola insieme con il prof.";
      timbri.push(`<span class="timbro rosso">⚠️ Dubbio dopo 3 controlli: controllate con il prof</span>`);
    } else if (es.stato === "corretta") {
      timbri.push(`<span class="timbro giallo">🔁 Corretta e ricontrollata ${quante}${es.correzioni[0] ? ": " + escape(es.correzioni[0]).slice(0, 80) : ""}</span>`);
    } else timbri.push(`<span class="timbro">Controllata ${quante}</span>`);
    if (fc.corretti) timbri.push(`<span class="timbro giallo" title="${escape(fc.dettagli.join(" · "))}">📚 ${fc.corretti === 1 ? "1 fatto corretto" : fc.corretti + " fatti corretti"} con i fatti sicuri</span>`);
    if (es.contiCorretti) timbri.push(`<span class="timbro giallo">🧮 ${es.contiCorretti} ${es.contiCorretti === 1 ? "conto corretto" : "conti corretti"} dalla calcolatrice</span>`);
    if (Pagine.attive) timbri.push(`<span class="timbro blu">📷 Usate le pagine del libro</span>`);
    if (sq.autore !== sq.controllore) timbri.push(`<span class="timbro blu" title="Ha scritto ${escape(sq.autore)}, ha controllato ${escape(sq.controllore)}">🤝 Controllata da un secondo cervello</span>`);
    if (fatti.length) timbri.push(`<span class="timbro blu">🧮 ${fatti.length === 1 ? "Conto fatto" : fatti.length + " conti fatti"} dalla calcolatrice</span>`);
    if (prima.fine) timbri.push(`<span class="timbro giallo">${prima.fine === "giro" ? "🔁 Si stava ripetendo: ho tolto le ripetizioni" : prima.fine === "lento" ? "🐢 Si è fermato a metà: ho controllato la parte scritta" : "✂️ Era troppo lunga: l'ho accorciata"}</span>`);
    // disegno automatico del conto, se il cervello non l'ha messo
    if (conto && MATERIE[materia].calcoli && !/\[DISEGNO:/i.test(testo)) {
      const dis = disegnoPerConto(conto);
      if (dis) { const r = testo.split("\n"); r.splice(Math.min(1, r.length), 0, dis); testo = r.join("\n"); }
    }
    // 🤖 niente frasi da robot ("le istruzioni date", "non posso creare immagini" con il disegno sotto…)
    const robot = ripulisciRobot(testo);
    if (robot.tolte) { testo = robot.testo; annotaErrore("Frasi da robot tolte", `${robot.tolte} ${robot.tolte === 1 ? "frase tolta" : "frasi tolte"}`); }
    // ✏️ conto secco spiegato in troppo pochi passaggi: Fly Aula aggiunge lei i passaggi giusti in colonna
    if (contoSecco && Prof.modo === "normale" && MATERIE[materia].calcoli) {
      const pas = passiPerConto(contoSecco), numerate = (testo.match(/^\s*\d+[.)]\s/gm) || []).length;
      if (pas && numerate < 3) testo += "\n✏️ In colonna, passo passo:\n" + pas.map(x => "• " + x.replace(/\s*✓$/, "")).join("\n");   // il ✓ lo mette la calcolatrice
    }
    // 3) sicurezza anche sulla risposta
    if (!controllaRisposta(testo, materia)) { annotaErrore("Bloccata dalla sicurezza", "risposta non adatta"); testo = "Torniamo alla materia 😊 Prova a farmi un'altra domanda."; timbri.length = 0; }
    // 4) disegno finale: ogni conto rimasto viene segnato dalla calcolatrice
    const html = impagina(testo, true, tipo => { if (tipo === "ok") conta("contiOk"); });
    bolla.classList.remove("controllo");
    bolla.innerHTML = html + `<div class="timbri">${timbri.join("")}</div>`;
    conta("risposte"); risposta = true;
    if (sq.autore !== sq.controllore) controllaMemoria();
    controllaScheda();
    // ⚡ si ricorda solo una risposta pulita: niente dubbi, niente tagli, niente blocchi della sicurezza
    const daRicordare = chiave && (es.stato === "ok" || es.stato === "corretta") && !prima.fine && timbri.length;
    if (daRicordare) salvaInMemoria(chiave, { testo, controlli: es.controlli, coppia: sq.autore !== sq.controllore, modello: sq.autore });
    aggiungiAzioni(bolla, domanda, testo, daRicordare ? chiave : null);
    storia.push({ role: "assistant", content: testo });
    if (leggiAuto) leggiRisposta(bolla, testo);
    const lingua = $("lingua").value;
    if (lingua) { chat.scrollTop = chat.scrollHeight; await aggiungiTraduzione(bolla, testo, lingua); }
    if (storia.length > 14) riassumi();
  } } catch (e) {
    mostraFerma(false);
    bolla.classList.remove("controllo");
    clearTimeout(attesa);
    bolla.innerHTML = Scuola.ruolo === "lim" ? "☕ Fly Aula non riesce a raggiungere il cervello della scuola. Riprova tra un attimo: se continua, chiama il tecnico." : "☕ Fly Aula si sta svegliando: riprova tra qualche secondo.";
    storia.pop(); controlla();
  }
  if (esciDallaFila) esciDallaFila();
  // ⏱️ il tempo di questa risposta (solo il numero) per il pannello del tecnico
  if (risposta) fetch(`/fa/tempo?ms=${Date.now() - t0}&m=${daMemoria ? 1 : 0}`, { cache: "no-store" }).catch(() => {});
  occupato = false; $("invia").disabled = false;
  chat.scrollTop = chat.scrollHeight;
}

function aggiungiAzioni(bolla, domanda, testo, chiave = null) {
  const d = document.createElement("div"); d.className = "azioni";
  d.innerHTML = `<button class="b-leggi">🔊 Leggi</button><button class="b-segnala">👎 Segnala un errore</button>`;
  bolla.parentElement.appendChild(d);
  d.querySelector(".b-leggi").onclick = () => leggiRisposta(bolla, testo);
  d.querySelector(".b-segnala").onclick = () => {
    d.innerHTML = `<input placeholder="Cosa era sbagliato? (es. il passaggio 3)" maxlength="300"><button>Invia</button><button>Annulla</button>`;
    const [inp, invia, annulla] = [d.querySelector("input"), ...d.querySelectorAll("button")];
    inp.focus();
    const manda = () => {
      annotaErrore("Segnalato dal prof", (inp.value.trim() || "(nessuna nota)") + " · risposta: " + testo.slice(0, 160), domanda);
      conta("segnalate");
      cancellaDaMemoria(chiave);          // una risposta segnalata non si ripropone più a nessuna classe
      d.innerHTML = `<span class="grazie">✓ Segnalato: grazie, servirà a migliorare Fly Aula</span>`;
    };
    invia.onclick = manda; inp.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); manda(); } };
    annulla.onclick = () => { d.remove(); aggiungiAzioni(bolla, domanda, testo, chiave); };
  };
}

function leggiRisposta(bolla, testo) { if (DSA.attiva) leggiEvidenziando(bolla, testo); else Voce.leggiAdAltaVoce(testo); }

// ---------------- 🔁 ripasso e 📒 riassunto ----------------
async function ripasso() {
  if (!modello) return mostraAiuto();
  if (occupato || inPausa()) return;
  occupato = true;
  $("pRipasso").style.display = "block";
  const c = $("ripCorpo");
  c.innerHTML = `<div class="lavoro" style="font-size:22px">🔁 Preparo le domande di ripasso e controllo ognuna 3 volte…</div>`;
  try {
    const domande = await creaRipasso(cervello, storia, $("materia").value, $("livello").value, 4);
    conta("ripassi");
    mostraRipasso(c, domande, () => { $("pRipasso").style.display = "none"; });
  } catch (e) { c.innerHTML = "⚠️ Non riesco a preparare il ripasso: controlla che Ollama sia acceso."; }
  occupato = false;
}
let ultimoRiassunto = "";
async function riassuntoAssenti() {
  if (!modello) return mostraAiuto();
  if (occupato || inPausa()) return;
  $("pRiassunto").style.display = "block";
  $("riaArchivio").textContent = "💾 Nel mio archivio"; $("riaArchivio").style.display = Prof.conProfili ? "" : "none";
  const c = $("riaCorpo");
  if (storia.length < 2) { c.innerHTML = `<p class="sotto">La lezione è appena iniziata: fate qualche domanda a Fly Aula e poi il riassunto si prepara da solo.</p>`; return; }
  occupato = true;
  c.innerHTML = `<div class="lavoro" style="font-size:22px">📒 Scrivo il riassunto e lo controllo 3 volte con la lezione…</div>`;
  try {
    const es = await creaRiassunto(cervello, storia, $("materia").value, $("livello").value, $("classe").value);
    es.testo = Fatti.correggi(es.testo).testo;
    ultimoRiassunto = es.testo;
    const data = new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
    c.innerHTML = `<div class="ria-testa">📒 ${escape(MATERIE[$("materia").value].nome)} · ${escape($("classe").value)} · ${escape(data)}</div>
      <div class="ria-testo">${riassuntoInHtml(es.testo)}</div>
      <div class="timbri">${es.stato === "dubbio" ? `<span class="timbro rosso">⚠️ Dubbio dopo 3 controlli: il prof lo rilegga prima di darlo</span>` : `<span class="timbro${es.stato === "corretta" ? " giallo" : ""}">${es.stato === "corretta" ? "🔁 Corretto e ricontrollato" : "Controllato"} ${es.controlli} volte</span>`}</div>`;
    es.correzioni.forEach(x => annotaErrore("Corretta dal ricontrollo", "riassunto: " + x, "Riassunto per gli assenti"));
    conta("riassunti");
  } catch (e) { c.innerHTML = "⚠️ Non riesco a scrivere il riassunto: controlla che Ollama sia acceso."; }
  occupato = false;
}

// ---------------- modalità esercizi ----------------
let punti = { giuste: 0, totali: 0 };
async function nuovoEsercizio(argomento = "") {
  if (!modello) return mostraAiuto();
  if (occupato || inPausa()) return;
  occupato = true;
  const card = aggiungi("ai", `<div class="lavoro">✏️ Preparo un esercizio e lo controllo 3 volte…</div>`);
  try {
    const es = await creaEsercizio(cervello, MATERIE[$("materia").value].nome, $("livello").value, argomento || Prof.argomento, { chiave: $("materia").value });
    conta("esercizi");
    card.innerHTML = `<div class="esercizio"><div class="tag">✏️ ESERCIZIO ${punti.totali + 1} · ${es.riserva ? (es.tipo === "parola" ? "domanda dalla lista controllata ✓" : "risultato calcolato da Fly Aula ✓") : "risultato controllato 3 volte ✓✓✓"}</div>${escape(es.testo)}
      <div class="risp"><input placeholder="La vostra risposta" ${es.tipo === "parola" ? 'autocapitalize="off" spellcheck="false"' : 'inputmode="decimal"'}><button class="btn">Controlla</button><button class="btn sec b-aiuto">💡 Aiutino</button></div><div class="esito"></div></div>`;
    const inp = card.querySelector("input"), esito = card.querySelector(".esito");
    let tentativi = 0;
    const verifica = async () => {
      if (!inp.value.trim()) return;
      tentativi++;
      if (risultatoGiusto(inp.value, es)) {
        punti.giuste++; punti.totali++;
        esito.className = "esito si";
        esito.innerHTML = `<span class="applauso">🎉</span> Giusto! ${escape(soluzioneDi(es))} · punteggio ${punti.giuste}/${punti.totali}
          <div class="azioni"><button class="b-altro">✏️ Un altro esercizio</button></div>`;
        esito.querySelector(".b-altro").onclick = () => nuovoEsercizio(argomento);
        inp.disabled = true;
      } else if (tentativi < 2) {
        esito.className = "esito no"; esito.textContent = "Quasi! Ricontrollate i passaggi e riprovate 💪";
      } else {
        punti.totali++;
        esito.className = "esito no";
        esito.innerHTML = `<div class="lavoro">Vi spiego dove si sbaglia…</div>`;
        inp.disabled = true; occupato = false;
        await chiedi(`Esercizio: "${es.testo}". La classe ha risposto ${inp.value}, ma la risposta giusta è ${soluzioneDi(es)}. Spiega con gentilezza dove probabilmente si è sbagliato e come si arriva al risultato giusto.`, { esercizio: true });
        esito.innerHTML = `La risposta giusta era <b>${escape(soluzioneDi(es))}</b> · punteggio ${punti.giuste}/${punti.totali}<div class="azioni"><button class="b-altro">✏️ Un altro esercizio</button></div>`;
        esito.querySelector(".b-altro").onclick = () => nuovoEsercizio(argomento);
      }
    };
    card.querySelector(".btn").onclick = verifica;
    inp.onkeydown = e => { if (e.key === "Enter") verifica(); };
    card.querySelector(".b-aiuto").onclick = () => {
      const primo = (es.spiegazione || "").split(/\n|(?=\d\.)/).find(x => x.trim());
      esito.className = "esito no"; esito.textContent = "💡 " + (primo ? primo.trim() : (es.tipo === "parola" ? (MATERIE[$("materia").value]?.parole ? "Leggete bene la frase: che tempo verbale o che parola serve?" : "Rileggete bene la domanda e pensate a quello che avete studiato.") : "Leggete bene il testo e scrivete il conto da fare prima di calcolare."));
    };
    inp.focus();
  } catch (e) { card.innerHTML = "⚠️ Non riesco a preparare l'esercizio: controlla che Ollama sia acceso."; }
  occupato = false;
}

// ---------------- esame delle domande ----------------
let esameAttivo = false, esameRighe = [];
// un cervello risponde a tutte le domande: prima senza controlli, poi con i controlli
async function provaCervello(domande, livello, ogniDomanda) {
  const per = {}, inizio = Date.now(), calcPrima = $("esCalc").checked;
  let prima = 0, dopo = 0, dubbi = 0, fatte = 0, guasti = 0, ritirato = false;
  const risposte = [];                       // le spiegazioni, per il giudice (dopo)
  for (let i = 0; i < domande.length && esameAttivo; i++) {
    const q = domande[i], mat = q.categoria === "Economia aziendale" ? "economia" : "matematica";
    let r1 = "", x1 = NaN, x2 = NaN, rev = { ok: null };
    try {
      const fatti = calcPrima ? await contiPrima(q.d, mat, null) : [];
      const sq = squadra(domandaDifficile(q.d, mat));
      r1 = await cervelloDi(sq.autore)(istruzioniMateria(mat, livello === "elementari" && mat === "economia" ? "superiori" : livello, "Esame", "") + istruzioniFatti(fatti) + "\nAlla fine scrivi su una riga da sola: RISULTATO: <solo il numero>", q.d, { temperature: 0.2 });
      x1 = leggiRisultato(r1);
      risposte.push({ domanda: q.d, testo: r1 });
      // con i controlli: calcolatrice sui conti + revisore severo (senza suggerirgli il risultato)
      const es = await ricontrolloCompleto(cervelloDi(sq.autore), { controllore: cervelloDi(sq.controllore), domanda: q.d, testo: r1, contesto: MATERIE[mat].nome + ". La risposta deve finire con 'RISULTATO: numero'.", risultatoObbligatorio: false });
      rev = { ok: es.stato === "ok", problema: es.correzioni.join(" · "), controlli: es.controlli, dubbio: es.stato === "dubbio" };
      x2 = leggiRisultato(es.testo);
      guasti = 0;
    } catch (e) {
      // un cervello che non risponde due volte di fila si ritira (invece di far aspettare ore)
      if (++guasti >= 2) { ritirato = true; break; }
    }
    const ok1 = giusto(x1, q.r), ok2 = giusto(x2, q.r);
    prima += ok1; dopo += ok2; dubbi += !!rev.dubbio; fatte++;
    (per[q.categoria] = per[q.categoria] || { n: 0, p: 0, d: 0 }); per[q.categoria].n++; per[q.categoria].p += ok1; per[q.categoria].d += ok2;
    const riga = [i + 1, q.categoria, q.d, formatta(q.r), isFinite(x1) ? formatta(x1) : "?", ok1 ? "giusta" : "SBAGLIATA", isFinite(x2) ? formatta(x2) : "?", ok2 ? "giusta" : "SBAGLIATA", (rev.dubbio ? "DUBBIO: " : rev.problema ? "corretta: " : "ok") + (rev.problema || "") + (rev.controlli ? " (" + rev.controlli + " controlli)" : "")];
    ogniDomanda({ riga, fatte, prima, dopo, per, sec: (Date.now() - inizio) / 1000 / fatte });
  }
  return { fatte, prima, dopo, dubbi, per, ritirato, risposte, sec: fatte ? (Date.now() - inizio) / 1000 / fatte : 0 };
}
async function esame() {
  if (!modello) return mostraAiuto();
  esameAttivo = true; esameRighe = [];
  mostraBottoniEsame(true);
  const n = +$("esN").value, livello = $("esLivello").value, domande = creaEsame(n, livello);
  const fine = await provaCervello(domande, livello, ({ riga, fatte, prima, dopo, per, sec }) => {
    esameRighe.push(riga);
    $("esBarra").style.width = (100 * fatte / domande.length) + "%";
    $("esRisultato").innerHTML = disegnaEsame(fatte, domande.length, prima, dopo, per, Math.round(sec * (domande.length - fatte) / 60));
  });
  esameAttivo = false;
  mostraBottoniEsame(false);
  if (fine.ritirato) $("esRisultato").insertAdjacentHTML("afterbegin", `<p class="sotto" style="color:var(--corallo)">⛔ Il cervello ${escape(modello)} non risponde: esame fermato. Controlla Ollama nella pagina del tecnico.</p>`);
  scrivi("flyaula_esame_" + modello, JSON.stringify({ quando: new Date().toLocaleString("it-IT"), n: fine.fatte, prima: fine.prima, dopo: fine.dopo }));
}
function mostraBottoniEsame(inCorso) {
  $("esVia").style.display = $("esGara").style.display = $("esPrepara").style.display = inCorso ? "none" : "";
  $("esStop").style.display = inCorso ? "" : "none";
  $("esCsv").style.display = !inCorso && esameRighe.length ? "" : "none";
}

// ---------------- ⚡ PREPARA LE RISPOSTE D'ESEMPIO ----------------
// Le domande d'esempio della prima schermata (per ogni materia, 1ª e 2ª): Fly Aula le fa a sé stessa,
// le controlla come sempre e le mette in memoria. Poi arrivano in un secondo in ogni aula. (Da fare la sera.)
function domandeEsempio(solo = "") {
  const out = [];
  for (const [chiave, m] of Object.entries(MATERIE)) {
    if (solo && solo !== chiave) continue;
    // le materie del biennio: 1ª e 2ª con gli esempi del biennio; quelle che iniziano in 3ª: la 3ª con gli esempi delle superiori
    const anni = m.anni || [1, 2];
    for (const a of anni)
      for (const d of ((a <= 2 ? m.esempi.biennio : null) || m.esempi.superiori || [])) out.push({ materia: chiave, classe: a + "ªA", domanda: d });
  }
  return out;
}
async function preparaEsempi() {
  if (occupato) return;
  if (Prof.modo !== "normale" || DSA.attiva || Pagine.attive) { $("esRisultato").innerHTML = `<p class="sotto">Per preparare le risposte d'esempio servono: modalità del prof "normale", DSA spenta, nessuna pagina del libro.</p>`; return; }
  const prima = { materia: $("materia").value, livello: $("livello").value, classe: $("classe").value };
  const lista = domandeEsempio($("esPrepMateria") ? $("esPrepMateria").value : ""), t0 = Date.now();
  esameAttivo = true; mostraBottoniEsame(true);
  let fatte = 0, nuove = 0;
  for (const q of lista) {
    if (!esameAttivo) break;
    $("materia").value = q.materia; $("livello").value = "superiori"; $("classe").value = q.classe;
    storia = [];
    const prima1 = statistiche().dallaMemoria || 0;
    await chiedi(q.domanda);
    if ((statistiche().dallaMemoria || 0) === prima1) nuove++;
    fatte++;
    const resta = Math.round((Date.now() - t0) / fatte * (lista.length - fatte) / 60000);
    $("esBarra").style.width = (100 * fatte / lista.length) + "%";
    $("esRisultato").innerHTML = `<p class="sotto">⚡ Preparo le risposte d'esempio: <b>${fatte}/${lista.length}</b> (${escape(MATERIE[q.materia].nome)}, ${escape(q.classe)}) · manca ~${resta} min</p>`;
  }
  esameAttivo = false; mostraBottoniEsame(false);
  $("materia").value = prima.materia; $("livello").value = prima.livello; $("classe").value = prima.classe;
  await nuovaLezione(false);
  $("esRisultato").innerHTML = `<p class="ok-gara">✓ Fatto: ${fatte} risposte d'esempio pronte (${nuove} nuove, le altre erano già in memoria). Ora in ogni aula arrivano subito.</p>`;
}

// ---------------- 🏁 la GARA tra cervelli ----------------
// Stesse domande per tutti, stessi controlli. Vince chi sbaglia meno (a parità, il più veloce).
// Si decide con i numeri veri su QUESTO computer, non con le classifiche di internet.
function cervelliDaGara() {
  return (window.modelliPresenti || []).filter(m => !/vl[:\-]|vision|llava|embed|ocr|whisper/.test(m));   // niente cervelli solo-foto
}
function preparaGara() {
  const el = $("esModelli"), tutti = cervelliDaGara();
  if (tutti.length < 2) { el.innerHTML = `<span class="sotto">Per la gara servono almeno 2 cervelli scaricati (es. <code>ollama pull gemma4:12b</code>).</span>`; $("esGara").disabled = true; return; }
  $("esGara").disabled = false;
  el.innerHTML = tutti.map(m => `<label class="scelta-cervello"><input type="checkbox" value="${escape(m)}" checked> ${escape(m)}${m === modello || m === secondo ? " <small>(in uso)</small>" : ""}</label>`).join("");
}
async function gara() {
  const scelti = [...$("esModelli").querySelectorAll("input:checked")].map(i => i.value);
  if (scelti.length < 2) { $("esRisultato").innerHTML = `<p class="sotto">Scegli almeno 2 cervelli per la gara.</p>`; return; }
  const inUso = modello, inUsoS = secondo, livello = $("esLivello").value, n = +$("esNGara").value;
  const domande = creaEsame(n, livello), risultati = [];
  esameAttivo = true; esameRighe = [];
  mostraBottoniEsame(true);
  // c'è almeno una coppia possibile? allora alla fine gareggia anche la coppia
  const coppiaInVista = scelti.some((a, i) => scelti.some((b, k) => k > i && coppiaPossibile(a, b)));
  const giri = scelti.length + (coppiaInVista ? 1 : 0), totale = giri * domande.length;
  let giro = 0;
  const corri = async (forte, sec2) => {
    modello = forte; secondo = sec2;
    await leggiCapacita(forte); if (sec2) await leggiCapacita(sec2);
    const nome = sec2 ? `${forte} + ${sec2}` : forte, t0 = Date.now(), k = giro++;
    const r = await provaCervello(domande, livello, ({ riga, fatte, prima, dopo, sec }) => {
      esameRighe.push([nome, ...riga]);
      $("esBarra").style.width = (100 * (k * domande.length + fatte) / totale) + "%";
      const resta = Math.round((sec * (domande.length - fatte) + sec * domande.length * (giri - k - 1)) / 60);
      $("esRisultato").innerHTML = disegnaGara(risultati, { m: nome, fatte, tot: domande.length, prima, dopo }, resta);
    });
    if (r.fatte || r.ritirato) risultati.push({ m: nome, forte, secondo: sec2, ...r, minuti: (Date.now() - t0) / 60000 });
  };
  const libera = m => Scuola.chiama("/api/generate", { method: "POST", body: JSON.stringify({ model: m, keep_alive: 0 }) }).catch(() => {});
  for (const m of scelti) {
    if (!esameAttivo) break;
    await corri(m, null);
    if (m !== inUso && m !== inUsoS) libera(m);         // libera la scheda video per il prossimo concorrente
  }
  // 🤝 la coppia: il migliore + il migliore di un'altra famiglia che sta nella scheda insieme a lui
  if (esameAttivo) {
    const ord = classifica(risultati).filter(r => !r.ritirato).map(r => r.forte);
    let c = null;
    for (let i = 0; i < ord.length && !c; i++) for (let k = i + 1; k < ord.length && !c; k++) if (coppiaPossibile(ord[i], ord[k])) c = [ord[i], ord[k]];
    if (c) await corri(c[0], c[1]);
  }
  // ⭐ il giudice: alla fine, così non deve alternarsi con i concorrenti nella scheda video
  if (esameAttivo && $("esGiudice").checked) {
    modello = inUso; secondo = null;
    const daGiudicare = risultati.filter(r => !r.ritirato && r.risposte?.length);
    for (let k = 0; k < daGiudicare.length && esameAttivo; k++) {
      const r = daGiudicare[k];
      r.voto = await giudica(r, livello, n => {
        $("esRisultato").innerHTML = `<p class="sotto">⭐ Il giudice legge le spiegazioni di <b>${escape(r.m)}</b>: ${n}/${r.risposte.length}</p>` + disegnaGara(risultati, null, 0).replace(/<div class="fine-gara">[\s\S]*$/, "");
      });
    }
  }
  modello = inUso; secondo = inUsoS;
  esameAttivo = false;
  mostraBottoniEsame(false);
  $("esRisultato").innerHTML = disegnaGara(risultati, null, 0);
  const b = $("esRisultato").querySelector(".usa-vincitore");
  if (b) b.onclick = async () => {
    await usaCervello(b.dataset.m, b.dataset.s || null);
    b.outerHTML = `<p class="ok-gara">✓ Da adesso Fly Aula usa <b>${escape(b.dataset.s ? b.dataset.m + " + " + b.dataset.s : b.dataset.m)}</b>${b.dataset.s ? " (coppia)" : ""}${Scuola.ruolo === "server" ? " su tutte le LIM della scuola" : ""}.</p>`;
    preparaGara();
  };
  scrivi("flyaula_gara", JSON.stringify({ quando: new Date().toLocaleString("it-IT"), n: domande.length, risultati: risultati.map(r => ({ m: r.m, prima: r.prima, dopo: r.dopo, fatte: r.fatte, sec: Math.round(r.sec), voto: r.voto?.media || null })) }));
}
// ⭐ IL GIUDICE DELLA SPIEGAZIONE: un cervello (sempre lo stesso, e mai quello giudicato) vota da 1 a 5
// quanto è chiara la spiegazione. Il risultato giusto lo controlla già la calcolatrice: qui conta come spiega.
const ISTRUZIONI_GIUDICE = livello => `Sei un professore esperto e severo. Valuti la SPIEGAZIONE scritta da un assistente per una classe (scuola ${livello}).
NON giudicare se il risultato finale è giusto: quello lo controlliamo noi. Giudica solo come spiega:
- chiarezza: si capisce subito cosa fare e perché?
- passaggi: ogni passaggio è scritto e spiegato, senza salti?
- italiano: corretto, semplice, adatto ai ragazzi, senza frasi strane o da robot?
Rispondi SOLO con JSON: {"voto": un numero intero da 1 a 5, "motivo": "una frase breve"}`;
function scegliGiudice(escluso) {
  const tutti = cervelliDaGara();
  return MODELLI.map(m => trova(tutti, m)).filter(Boolean).find(m => m !== escluso) || tutti.find(m => m !== escluso) || null;
}
async function giudica(risultato, livello, ogniVoto) {
  const giudice = scegliGiudice(risultato.forte);
  if (!giudice) return null;
  const voti = [];
  for (const r of risultato.risposte || []) {
    if (!esameAttivo) break;
    try {
      const out = await cervello(ISTRUZIONI_GIUDICE(livello), `DOMANDA: ${r.domanda}\nSPIEGAZIONE DA VALUTARE:\n${String(r.testo).slice(0, 4000)}`, { temperature: 0, format: "json", usa: giudice });
      const v = Number(JSON.parse(out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1)).voto);
      if (v >= 1 && v <= 5) voti.push(Math.round(v));
    } catch (e) {}
    ogniVoto(voti.length);
  }
  return voti.length ? { media: voti.reduce((a, b) => a + b, 0) / voti.length, giudice, n: voti.length } : null;
}
// classifica: più risposte giuste con i controlli; a parità, meno dubbi; poi il più veloce
function classifica(risultati) {
  return [...risultati].sort((a, b) => (a.ritirato - b.ritirato) || b.dopo / b.fatte - a.dopo / a.fatte || ((b.voto?.media || 0) - (a.voto?.media || 0)) || a.dubbi - b.dubbi || a.sec - b.sec);
}
function disegnaGara(risultati, inCorso, minuti) {
  const pc = (x, n) => n ? (Math.round(1000 * x / n) / 10).toLocaleString("it-IT") + "%" : "–";
  const ord = classifica(risultati), medaglie = ["🥇", "🥈", "🥉"], conVoto = risultati.some(r => r.voto);
  const secondi = x => (x < 10 ? Math.round(x * 10) / 10 : Math.round(x)).toLocaleString("it-IT") + " s";
  const righe = ord.map((r, i) => `<tr${i === 0 && !inCorso ? ' class="vincitore"' : ""}><td>${medaglie[i] || i + 1}</td><td><b>${escape(r.m)}</b>${r.secondo ? ' <small class="tag-coppia">🤝 coppia</small>' : ""}${r.ritirato ? ' <small class="tag-ritirato">⛔ ritirato: non risponde</small>' : ""}</td><td>${pc(r.prima, r.fatte)}</td><td><b>${pc(r.dopo, r.fatte)}</b></td><td>${r.dubbi}</td>${conVoto ? `<td>${r.voto ? `<b>${r.voto.media.toLocaleString("it-IT", { maximumFractionDigits: 1 })}</b> ⭐` : "–"}</td>` : ""}<td>${secondi(r.sec)}</td></tr>`).join("");
  const ora = inCorso ? `<tr><td>⏳</td><td><b>${escape(inCorso.m)}</b> <small>sta rispondendo: ${inCorso.fatte}/${inCorso.tot}</small></td><td>${pc(inCorso.prima, inCorso.fatte)}</td><td>${pc(inCorso.dopo, inCorso.fatte)}</td><td></td>${conVoto ? "<td></td>" : ""}<td></td></tr>` : "";
  const v = !inCorso && ord[0] && !ord[0].ritirato && ord[0];
  return `${inCorso ? `<p class="sotto">🏁 Gara in corso · tempo che manca: ~${minuti} min</p>` : ""}
    <table class="tab-gara"><thead><tr><th></th><th>Cervello</th><th>Giuste alla prima risposta</th><th>Giuste con i controlli</th><th>Dubbi</th>${conVoto ? "<th>Spiegazione</th>" : ""}<th>Tempo per domanda</th></tr></thead><tbody>${righe}${ora}</tbody></table>
    ${v ? `<div class="fine-gara"><p>🏆 Vince <b>${escape(v.m)}</b>${v.secondo ? " (coppia: uno scrive, l'altro controlla)" : ""}: ${pc(v.dopo, v.fatte)} giuste con i controlli${v.voto ? `, spiegazione ${v.voto.media.toLocaleString("it-IT", { maximumFractionDigits: 1 })} ⭐ su 5` : ""}, ${secondi(v.sec).replace(" s", " secondi")} per domanda.</p>
      ${conVoto ? `<p class="sotto">⭐ La spiegazione l'ha votata un altro cervello (mai sé stesso). È un'indicazione utile, non un giudizio perfetto: leggete anche qualche risposta.</p>` : ""}
      ${v.forte !== modello || (v.secondo || null) !== (secondo || null) ? `<button class="btn usa-vincitore" data-m="${escape(v.forte)}" data-s="${escape(v.secondo || "")}">✓ Usa ${escape(v.m)} da adesso</button>` : `<p class="ok-gara">✓ È già ${v.secondo ? "la coppia" : "il cervello"} in uso.</p>`}
      <p class="sotto">Il tempo conta: in classe una risposta dovrebbe arrivare in meno di 20-30 secondi. Prima di scegliere un cervello per tutta la scuola, prova anche il <b>test di carico</b> nella pagina del tecnico.</p></div>` : ""}`;
}
function disegnaEsame(fatte, tot, prima, dopo, per, minuti) {
  const pc = x => (Math.round(1000 * x / fatte) / 10).toLocaleString("it-IT") + "%";
  return `<div class="stat">
      <div><span>domande</span><b style="color:var(--latte)">${fatte}/${tot}</b></div>
      <div><span>giuste alla prima risposta</span><b style="color:var(--sole)">${pc(prima)}</b></div>
      <div><span>giuste CON i controlli</span><b>${pc(dopo)}</b></div>
      <div><span>cervello</span><b style="color:var(--cielo);font-size:22px">${escape(modello)}</b></div>
      <div><span>tempo che manca</span><b style="color:var(--latte);font-size:26px">${fatte < tot ? "~" + minuti + " min" : "finito ✓"}</b></div></div>
    <table><thead><tr><th>Categoria</th><th>Domande</th><th>Prima risposta</th><th>Con i controlli</th></tr></thead><tbody>
    ${Object.entries(per).map(([c, v]) => `<tr><td>${c}</td><td>${v.n}</td><td>${Math.round(100 * v.p / v.n)}%</td><td><b>${Math.round(100 * v.d / v.n)}%</b></td></tr>`).join("")}</tbody></table>
    ${esameRighe.filter(r => r[7] !== "giusta").length ? `<h3 style="margin-top:24px">Le sbagliate (anche dopo i controlli)</h3><table><tbody>${esameRighe.filter(r => r[7] !== "giusta").slice(-15).map(r => `<tr><td>${escape(r[2])}</td><td>giusto: <b>${r[3]}</b></td><td>Fly Aula: ${r[6]}</td></tr>`).join("")}</tbody></table>` : ""}`;
}

// ---------------- orario automatico ----------------
function aggiornaOrario() {
  const l = Orario.adesso();
  const prima = lezioneOrario;
  lezioneOrario = l;
  if (l) {
    $("lezione").style.display = "inline-block";
    $("lezione").textContent = `📅 ${l.classe} · ${l.materia} · fino alle ${l.fine.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`;
    fineLezione = l.fine;
    $("durata").style.display = "none";
    const cambiata = !prima || prima.materia !== l.materia || prima.classe !== l.classe;
    if (cambiata) {
      $("classe").value = l.classe;
      if (l.chiave) $("materia").value = l.chiave;
      if (prima) nuovaLezione(true); else schermataIniziale();
    }
  } else {
    $("lezione").style.display = "none"; $("durata").style.display = ""; fineLezione = null;
    if (prima) schermataIniziale();
  }
  aggiornaAvvisoMateria();
}
function aggiornaAvvisoMateria() {
  const av = $("avvisoMateria"); if (!av) return;
  const off = lezioneOrario && !lezioneOrario.chiave;
  av.style.display = off ? "block" : "none";
  if (off) av.innerHTML = lezioneOrario.materia === "Seconda lingua"
    ? `📚 Ora c'è <b>Seconda lingua</b>.<br><small style="color:var(--nebbia)">Nell'orario scrivete quale lingua (Francese, Spagnolo, Tedesco o Cinese): così Fly Aula si accende da sola.</small>`
    : `📚 Ora c'è <b>${escape(lezioneOrario.materia)}</b>: in quest'ora Fly Aula resta in pausa.<br><small style="color:var(--nebbia)">Buona lezione!</small>`;
  $("domanda").disabled = !!off; $("invia").disabled = !!off;
  const v = $("vuoto"); if (v) v.style.display = off ? "none" : "";
}
setInterval(() => {
  const fine = fineLezione || new Date(inizioLezione + Number($("durata").value) * 60000);
  const resta = fine - Date.now();
  if (resta <= 0 && !fineLezione) { nuovaLezione(true); return; }
  const m = Math.max(0, Math.ceil(resta / 60000));
  if (resta > 0 && resta < 6 * 60000 && storia.length >= 4 && !avvisoRipasso && !occupato) {
    avvisoRipasso = true;
    const b = aggiungi("ai", `⏰ Mancano ${m} minuti alla fine: facciamo un ripasso veloce? <div class="azioni"><button class="b-rip">🔁 Sì, ripasso!</button></div>`);
    b.querySelector(".b-rip").onclick = ripasso;
  }
  $("timer").textContent = `⏱️ ${Math.floor(m / 60) ? Math.floor(m / 60) + " h " : ""}${m % 60} min`;
}, 5000);
setInterval(aggiornaOrario, 30000);

// ---------------- il cervello è acceso? ----------------
async function controlla() {
  try {
    const r = await Scuola.chiama("/api/tags", { cache: "no-store" });
    const j = await r.json();
    const presenti = (j.models || []).map(m => m.name);
    window.modelliPresenti = presenti;
    (j.models || []).forEach(m => { pesi[m.name] = m.size || 0; });
    modello = scegliModello(presenti);
    secondo = scegliSecondo(presenti, modello);
    // nessuna scelta fatta con la gara: se c'è una COPPIA che sta nella scheda, è meglio di un cervello da solo
    const scelto = Scuola.cervelloScelto || leggi("flyaula_modello");
    if (!secondo && !scelto) { const c = migliorCoppia(presenti); if (c) [modello, secondo] = c; }
    await leggiCapacita(modello); if (secondo) await leggiCapacita(secondo);
    if (modello) $("aiuto").style.display = "none"; else mostraAiuto(true);
  } catch (e) { modello = null; mostraAiuto(false); }
  aggiornaEtichettaStato();
}
// quale cervello usare: 1) quello scelto con la gara (sul server della scuola vale per tutte le LIM)
// 2) quello scelto su questo computer  3) il più forte tra quelli scaricati
function trova(presenti, m) { return m ? presenti.find(x => x === m || x === m + ":latest" || x.startsWith(m + "-")) : null; }
function scegliModello(presenti) {
  for (const m of [Scuola.cervelloScelto, leggi("flyaula_modello"), ...MODELLI]) { const t = trova(presenti, m); if (t) return t; }
  return presenti.find(m => !/vl[:\-]|vision|llava|embed|ocr|whisper/.test(m)) || null;
}
// ---- il secondo cervello della coppia ----
const pesi = {};                                                     // quanto pesa ogni cervello (byte)
const famiglia = m => String(m).split(":")[0].replace(/[\d.]+$/, "").replace(/[-_]$/, "").toLowerCase();
// ci stanno tutti e due nella scheda video, insieme, con lo spazio di lavoro per le classi?
// Per ogni cervello: il suo peso + ~0,8 GB di lavoro fisso + ~0,4 GB per ogni classe che può chiedere insieme.
// (È una stima prudente: dopo la prima risposta Fly Aula CONTROLLA davvero con Ollama, vedi controllaMemoria)
function stannoInsieme(a, b) {
  const vram = Scuola.vram * 1024 * 1024;                            // MB → byte (0 = non si sa)
  const limite = Number(leggi("flyaula_limite_coppia")) || Infinity;   // una coppia di questa misura NON ci è stata davvero
  return vram > 0 && pesi[a] > 0 && pesi[b] > 0 && memoriaCoppia(a, b) <= vram && memoriaCoppia(a, b) < limite;
}
function memoriaCoppia(a, b) {
  const classi = Math.max(1, Number(Scuola.parallelo) || 1);
  // NVIDIA: la memoria delle classi è compressa (0,4 GB l'una); AMD, Intel e le altre: normale (0,8 GB l'una)
  const perClasse = Scuola.marca && Scuola.marca !== "nvidia" ? 0.8e9 : 0.4e9;
  const serve = m => pesi[m] + 0.8e9 + classi * perClasse;
  return serve(a) + serve(b);
}
function coppiaPossibile(a, b) { return a && b && a !== b && famiglia(a) !== famiglia(b) && !coppieNo().includes(chiaveCoppia(a, b)) && stannoInsieme(a, b); }
// la prova vera: dopo una risposta della coppia, Ollama dice dove sono i cervelli.
// Se uno è finito (anche in parte) sul processore, o se uno ha dovuto cacciare l'altro, la coppia NON ci sta.
async function controllaMemoria() {
  if (!secondo) return;
  try {
    const r = await Scuola.chiama("/api/ps", { cache: "no-store" });
    const caricati = (await r.json()).models || [];
    const qui = m => caricati.find(x => x.name === m || x.model === m);
    const a = qui(modello), b = qui(secondo);
    const sulProcessore = [a, b].filter(x => x && x.size_vram < x.size * 0.97);
    if (!a || !b || sulProcessore.length) {
      // da ora si provano solo coppie PIÙ PICCOLE di questa
      const m = memoriaCoppia(modello, secondo);
      if (m > 0) scrivi("flyaula_limite_coppia", String(Math.min(m, Number(leggi("flyaula_limite_coppia")) || Infinity)));
      // funzionano tutti e due, ma non insieme: si tiene il più forte (il principale)
      if (!a || !b) togliDallaCoppia(secondo, "i due cervelli non stanno insieme nella scheda video (uno caccia l'altro)");
      else togliDallaCoppia(secondo, "nella scheda video non c'è posto per tutti e due (una parte finisce sul processore, lentissimo)");
    }
  } catch (e) {}
}
// la prova della scheda video: dopo la prima risposta, Ollama dice se il cervello sta DAVVERO nella scheda.
// Se è finito sul processore (scheda non supportata, troppo piccola, o nessuna scheda) Fly Aula passa da sola
// al cervello più leggero che c'è, così risponde lo stesso in fretta, e lo scrive per il tecnico.
let schedaControllata = false;
async function controllaScheda() {
  if (schedaControllata || !modello) return;
  schedaControllata = true;
  try {
    const r = await Scuola.chiama("/api/ps", { cache: "no-store" });
    const qui = ((await r.json()).models || []).find(x => x.name === modello || x.model === modello);
    if (!qui || !qui.size || qui.size_vram >= qui.size * 0.5) return;            // sta (quasi tutto) nella scheda: bene così
    const motivo = Scuola.vram > 0 ? `la scheda video ${Scuola.scheda || ""} non viene usata da Ollama: il cervello lavora sul processore` : "non c'è una scheda video adatta: il cervello lavora sul processore";
    if (secondo) togliDallaCoppia(secondo, motivo);
    const leggero = Object.keys(pesi).filter(m => pesi[m] > 0 && !tolti.has(m) && !/vl[:\-]|vision|llava|embed|ocr|whisper/.test(m)).sort((a, b) => pesi[a] - pesi[b])[0];
    if (leggero && leggero !== modello && pesi[leggero] < pesi[modello] * 0.85) {
      const prima = modello; modello = leggero; aggiornaEtichettaStato();
      annotaErrore("Cervello più leggero", `${motivo}. Fly Aula passa da ${prima} a ${leggero}, più veloce.`, "(automatico)");
    } else annotaErrore("Scheda video non usata", motivo + ". Le risposte saranno più lente.", "(automatico)");
  } catch (e) {}
}
function scegliSecondo(presenti, forte) {
  if (!forte) return null;
  // 1) scelto con la gara ("nessuno" = un cervello solo, per scelta)
  for (const s of [Scuola.secondoScelto, leggi("flyaula_secondo")]) {
    if (s === "nessuno") return null;
    const t = trova(presenti, s);
    if (t && t !== forte) return t;
  }
  // 2) da solo: il migliore di un'ALTRA famiglia che sta nella scheda insieme al principale
  for (const m of MODELLI) { const t = trova(presenti, m); if (t && coppiaPossibile(forte, t)) return t; }
  return null;
}
function migliorCoppia(presenti) {
  const noti = MODELLI.map(m => trova(presenti, m)).filter(Boolean);
  for (let i = 0; i < noti.length; i++) for (let k = i + 1; k < noti.length; k++) if (coppiaPossibile(noti[i], noti[k])) return [noti[i], noti[k]];
  return null;
}
async function usaCervello(m, s = null) {
  scrivi("flyaula_modello", m); scrivi("flyaula_secondo", s || "nessuno");
  // sul server della scuola la scelta vale per tutte le LIM
  try { await fetch("/fa/config", { method: "POST", body: JSON.stringify({ cervello: m, cervello2: s || "nessuno" }) }); } catch (e) {}
  modello = m; secondo = s || null;
  await leggiCapacita(m); if (secondo) await leggiCapacita(secondo);
  aggiornaEtichettaStato();
}
// in alto: parole semplici per i prof (i dettagli tecnici sono nel "title", per il tecnico)
window.aggiornaEtichettaStato = function () {
  const s = $("stato");
  if (!modello) { s.textContent = "☕ Si sta svegliando…"; s.className = "ko"; s.title = "Il cervello non risponde"; return; }
  s.textContent = Scuola.suRiserva ? "🟡 Pronta · server di riserva" : Scuola.ruolo === "lim" ? "🟢 Pronta · server della scuola" : "🟢 Pronta";
  s.className = Scuola.suRiserva ? "riserva" : "ok";
  s.title = `${secondo ? "Cervelli: " + modello + " + " + secondo + " (coppia)" : "Cervello: " + modello} · ${Scuola.base}${Scuola.aula ? " · aula " + Scuola.aula : ""}`;
};
setInterval(() => { if (!modello) controlla(); }, 15000);
function mostraAiuto(acceso) {
  const tecnico = acceso
    ? `<h2>Manca il cervello di Fly Aula</h2><p>Ollama è acceso, ma non c'è ancora il modello. Apri <b>PowerShell</b> e scrivi:</p><p><code>ollama pull gemma4:12b</code></p><p>(circa 7,6 GB, si scarica una volta sola; su un PC poco potente va bene anche <code>qwen2.5:7b</code>, 4,7 GB). Poi <b>ricarica questa pagina</b>.</p>`
    : `<h2>Fly Aula non trova il suo cervello</h2><p>1. Controlla che <b>Ollama</b> sia aperto (icona del lama vicino all'orologio).</p><p>2. Se è aperto ma non va, apri <b>PowerShell</b> e scrivi:<br><code>setx OLLAMA_ORIGINS "*"</code><br>poi chiudi Ollama (tasto destro sull'icona → Quit) e riaprilo.</p><p>3. Se Chrome chiede il permesso per la <b>rete locale</b>, tocca <b>Consenti</b>.</p><p>Poi ricarica la pagina.</p><button class="btn" style="padding:14px 24px" onclick="controlla()">Riprova</button>`;
  // ai prof: due righe semplici. Le istruzioni tecniche restano chiuse in "Per il tecnico".
  $("aiutoBox").innerHTML = `<div class="sveglia">☕</div><h2>Fly Aula si sta svegliando</h2>
    <p>${Scuola.ruolo === "lim" ? "Non riesce ancora a raggiungere il cervello della scuola. Di solito basta aspettare un minuto." : "Il suo cervello non è ancora pronto. Di solito basta aspettare un minuto."} Riprova da sola ogni 15 secondi.</p>
    <p>Se non parte, <b>chiama il tecnico della scuola</b>.</p>
    <div class="riga-btn"><button class="btn" style="padding:14px 24px" onclick="controlla()">🔄 Riprova adesso</button><button class="btn sec" style="padding:14px 24px" onclick="document.getElementById('aiuto').style.display='none'">Chiudi</button></div>
    <details class="per-tecnico"><summary>Per il tecnico</summary>${Scuola.ruolo === "lim" ? `<p>Questa LIM usa il server <code>${escape(Scuola.base)}</code>. Controlla che il server della scuola sia acceso e che Ollama sia aperto lì. Pannello del tecnico: sul server apri <code>http://localhost:8780/flyaula/tecnico.html</code>.</p>` : tecnico}</details>`;
  $("aiuto").style.display = "flex";
}

// ---------------- voce ----------------
let leggiAuto = leggi("flyaula_leggi") === "1";
const aggiornaLeggi = () => { $("leggiAuto").classList.toggle("on", leggiAuto); };
aggiornaLeggi();
$("leggiAuto").onclick = () => { leggiAuto = !leggiAuto; scrivi("flyaula_leggi", leggiAuto ? "1" : "0"); aggiornaLeggi(); if (!leggiAuto) Voce.zitto(); };
$("voce").onclick = async () => {
  const b = $("voce");
  if (inPausa()) return;
  if (Voce.attivo) {
    b.classList.remove("on"); b.textContent = "⏳"; b.disabled = true;
    try {
      const campioni = await Voce.ferma();
      $("domanda").placeholder = "Sto capendo cosa hai detto…";
      const testo = campioni && campioni.length > 8000 ? await Voce.trascrivi(campioni) : "";
      $("domanda").placeholder = "Scrivi o tocca 🎤 e parla…";
      if (testo) chiedi(testo);
    } catch (e) { $("domanda").placeholder = "Non ho capito: riprova o scrivi 🙂"; }
    b.textContent = "🎤"; b.disabled = false;
    return;
  }
  try {
    if (!Voce.trascrittore) {
      b.textContent = "⏳"; b.disabled = true;
      await Voce.prepara(p => { $("domanda").placeholder = `Preparo l'orecchio di Fly Aula (solo la prima volta): ${p}%`; });
      $("domanda").placeholder = "Scrivi o tocca 🎤 e parla…";
      b.disabled = false;
    }
    await Voce.inizia();
    b.textContent = "⏹️"; b.classList.add("on");
    $("domanda").placeholder = "🎙️ Ti ascolto… tocca ⏹️ quando hai finito";
  } catch (e) {
    b.textContent = "🎤"; b.disabled = false; b.classList.remove("on");
    $("domanda").placeholder = "Microfono non disponibile: controlla i permessi 🎤";
  }
};

// ---------------- pulsanti e pannelli ----------------
const apri = id => { $("menu").classList.remove("aperto"); $(id).style.display = "block"; };
document.querySelectorAll(".pannello .chiudi").forEach(b => b.onclick = () => { b.closest(".pannello").style.display = "none"; esameAttivo = false; });
$("apriMenu").onclick = e => { e.stopPropagation(); $("menu").classList.toggle("aperto"); };
document.addEventListener("click", () => $("menu").classList.remove("aperto"));
$("apriRegistro").onclick = () => { disegnaRegistro(); apri("pRegistro"); };
$("scaricaCsv").onclick = () => scaricaCsv("fly-aula-errori.csv", ["Quando", "Classe", "Materia", "Livello", "Modello", "Tipo", "Domanda", "Cosa era sbagliato"], registro().map(e => [e.quando, e.classe, e.materia, e.livello, e.modello, e.tipo, e.domanda, e.dettaglio]));
$("svuota").onclick = () => { scrivi("flyaula_errori", "[]"); scrivi("flyaula_stat", "{}"); $("nErrori").textContent = 0; disegnaRegistro(); };
$("apriEsame").onclick = () => { $("esLivello").value = $("livello").value; preparaGara(); apri("pEsame"); };
$("esVia").onclick = esame;
$("esGara").onclick = gara;
$("esPrepara").onclick = preparaEsempi;
(function sceltaPrepara() {
  const sel = $("esPrepMateria"); if (!sel) return;
  sel.innerHTML += Object.entries(MATERIE).map(([k, m]) => `<option value="${k}">${m.emoji} ${escape(m.nome)}</option>`).join("");
  const quante = () => { const n = domandeEsempio(sel.value).length; $("esPrepQuante").textContent = `${n} domande · circa ${Math.max(1, Math.round(n * 0.75))} min`; };
  sel.onchange = quante; quante();
})();
$("esStop").onclick = () => { esameAttivo = false; };
$("esCsv").onclick = () => esameRighe[0] && esameRighe[0].length > 9
  ? scaricaCsv("fly-aula-gara.csv", ["Cervello", "N", "Categoria", "Domanda", "Risultato giusto", "Prima risposta", "Esito", "Con i controlli", "Esito", "Controlli"], esameRighe)
  : scaricaCsv("fly-aula-esame.csv", ["N", "Categoria", "Domanda", "Risultato giusto", "Fly Aula (prima risposta)", "Esito", "Fly Aula (con i controlli)", "Esito", "Controlli"], esameRighe);
$("apriOrario").onclick = () => {
  Orario.disegnaEditor($("editorOrario"));
  if (Scuola.ruolo === "lim") {
    $("editorOrario").insertAdjacentHTML("afterbegin", `<div class="avviso-pg">🏫 L'orario di quest'aula (<b>${escape(Scuola.aula || "?")}</b>) lo carica la segreteria sul server della scuola: qui si può solo guardare.</div>`);
    $("editorOrario").querySelectorAll("select,input").forEach(x => x.disabled = true);
    $("orCancella").style.display = "none";
  }
  apri("pOrario");
};
$("orFatto").onclick = () => { $("pOrario").style.display = "none"; aggiornaOrario(); };
$("orCancella").onclick = () => { try { localStorage.removeItem("flyaula_orario"); } catch (e) {} Orario.disegnaEditor($("editorOrario")); aggiornaOrario(); };
$("apriEsercizi").onclick = () => nuovoEsercizio();
$("apriReport").onclick = () => { $("menu").classList.remove("aperto"); Report.apri(); };
$("rpStampa").onclick = () => Report.stampaReport();
$("apriDemo").onclick = () => { $("menu").classList.remove("aperto"); Demo.apri(); };
Demo.collega();
Prof.caricaProfili(); setInterval(() => Prof.caricaProfili(), 10 * 60000);   // la scuola usa i PIN personali dei prof?
$("dsa").onclick = () => DSA.cambia();
DSA.applica();
$("lingua").innerHTML = `<option value="">🌍 Solo italiano</option>` + Object.entries(LINGUE).map(([k, l]) => `<option value="${k}">${l.bandiera} + ${l.nome}${l.prova ? " (in prova)" : ""}</option>`).join("");
$("apriGara").onclick = () => { $("menu").classList.remove("aperto"); Gara.apri(); };
$("apriRipasso").onclick = () => { $("menu").classList.remove("aperto"); ripasso(); };
$("apriRiassunto").onclick = () => { $("menu").classList.remove("aperto"); riassuntoAssenti(); };
$("ripChiudiX").onclick = () => { $("pRipasso").style.display = "none"; };
$("riaChiudi").onclick = () => { $("pRiassunto").style.display = "none"; };
// 📒 il riassunto nell'archivio del prof (con il PIN personale), e riaperto da lì
$("riaArchivio").onclick = async () => {
  if (!ultimoRiassunto) return;
  if (!Prof.sessione && !(await Prof.entra("Salva nel tuo archivio"))) return;
  const materia = $("materia").value, oggi = new Date();
  const id = await Prof.salvaFoglio({ tipo: "riassunto", titolo: `Riassunto · ${MATERIE[materia].nome} · ${oggi.toLocaleDateString("it-IT")}`, materia, classe: $("classe").value, aula: Scuola.aula || "", data: oggi.toISOString(), testo: ultimoRiassunto });
  $("riaArchivio").textContent = id ? "✓ Nel tuo archivio" : "⚠️ Non salvato: riprova";
};
window.mostraRiassuntoSalvato = f => {
  ultimoRiassunto = String(f.testo || "");
  $("riaCorpo").innerHTML = `<div class="ria-testa">📒 ${escape(f.titolo || "Riassunto")} · ${escape(f.classe || "")}</div><div class="ria-testo">${riassuntoInHtml(ultimoRiassunto)}</div>`;
  $("riaArchivio").textContent = "✓ Nel tuo archivio"; $("riaArchivio").style.display = ""; $("pRiassunto").style.display = "block";
};
$("riaStampa").onclick = () => { if (!ultimoRiassunto) return; stampa("Riassunto della lezione", `<h1>Riassunto della lezione</h1><div class="testa"><span>${escape(MATERIE[$("materia").value].nome)} · classe ${escape($("classe").value)}</span><span>${new Date().toLocaleDateString("it-IT")}</span></div>` + riassuntoInHtml(ultimoRiassunto).replace(/<span class="(verificato|corretto)">[^<]*<\/span>/g, "")); };
$("riaCopia").onclick = async () => { try { await navigator.clipboard.writeText(ultimoRiassunto.replace(/\*\*/g, "")); $("riaCopia").textContent = "✓ Copiato"; } catch (e) {} };
$("apriProf").onclick = () => { $("menu").classList.remove("aperto"); Prof.apri(); };
$("apriPagine").onclick = () => Pagine.apri();
$("apriInstallaPc").onclick = () => apri("pInstalla");
$("copiaCmd").onclick = async () => {
  const t = $("cmdInstalla").textContent;
  try { await navigator.clipboard.writeText(t); } catch (e) { const r = document.createRange(); r.selectNodeContents($("cmdInstalla")); getSelection().removeAllRanges(); getSelection().addRange(r); document.execCommand("copy"); }
  $("copiaCmd").textContent = "✓ Copiato!";
  setTimeout(() => $("copiaCmd").textContent = "📋 Copia il comando", 3000);
};
$("vSblocca").onclick = () => Prof.sbloccaVerifica();
Pagine.collega();
Prof.applicaTema(); Prof.aggiornaPill(); Prof.mostraVerifica();
// ⏹ il prof può fermare una risposta mentre la scrive (pulsante o tasto Esc)
function mostraFerma(on) { $("ferma").hidden = !on; $("invia").hidden = !!on; }
$("ferma").onclick = fermaRisposta;
document.addEventListener("keydown", e => { if (e.key === "Escape" && rispostaInCorso) fermaRisposta(); });
$("modulo").onsubmit = e => { e.preventDefault(); const d = $("domanda").value.trim(); if (d) { $("domanda").value = ""; chiedi(d); } };
$("nuova").onclick = () => nuovaLezione(true);
$("classe").onchange = () => nuovaLezione(false);
$("materia").onchange = () => nuovaLezione(true);
$("livello").onchange = () => schermataIniziale();
$("classe").oninput = () => { if ($("vuoto")) schermataIniziale(); };
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
let invitoInstalla = null;
addEventListener("beforeinstallprompt", e => { e.preventDefault(); invitoInstalla = e; $("installa").style.display = ""; });
$("installa").onclick = async () => { if (!invitoInstalla) return; invitoInstalla.prompt(); await invitoInstalla.userChoice; invitoInstalla = null; $("installa").style.display = "none"; };
addEventListener("appinstalled", () => { $("installa").style.display = "none"; });
$("nErrori").textContent = registro().length;
// pannello "Classe", tasti grandi e menu che si chiude da solo
$("apriClasse").onclick = () => { $("pClasse").style.display = "flex"; };
$("classeFatto").onclick = () => { $("pClasse").style.display = "none"; };
$("pClasse").onclick = e => { if (e.target === $("pClasse")) $("pClasse").style.display = "none"; };
$("apriGaraTop").onclick = () => Gara.apri();
document.querySelectorAll(".tendina button").forEach(b => b.addEventListener("click", () => $("menu").classList.remove("aperto")));

// benvenuto: 3 fumetti, solo la prima volta
function benvenuto() {
  if (leggi("flyaula_tour") === "1" || $("aiuto").style.display === "flex" || Prof.verificaAttiva()) return;
  const passi = [["domanda", "✍️ Scrivi qui la domanda, oppure tocca 🎤 e parla. Fly Aula risponde e controlla tutto 2 volte."], ["apriEsercizi", "✏️ Qui un esercizio per la classe, già controllato. 📷 Pagine: le foto del libro. 🏆 Gara: Rossi contro Blu."], ["apriMenu", "☰ Qui c'è tutto il resto: ripasso, riassunto, pannello del prof con PIN, verifiche da stampare."]];
  let k = 0;
  const mostra = () => {
    if (k >= passi.length) { $("tour").innerHTML = ""; $("tour").style.display = "none"; scrivi("flyaula_tour", "1"); return; }
    const [id, testo] = passi[k], r = $(id).getBoundingClientRect(), sotto = r.top < innerHeight / 2;
    $("tour").style.display = "block";
    $("tour").innerHTML = `<div class="tour-buco" style="left:${r.left - 8}px;top:${r.top - 8}px;width:${r.width + 16}px;height:${r.height + 16}px"></div>
      <div class="tour-fumetto ${sotto ? "t-giu" : "t-su"}" style="${sotto ? `top:${r.bottom + 18}px` : `bottom:${innerHeight - r.top + 18}px`};left:${Math.max(16, Math.min(innerWidth - 436, r.left + r.width / 2 - 210))}px">
        <div class="tour-n">${k + 1} di ${passi.length}</div><p>${testo}</p><button class="btn" id="tourOk">${k + 1 < passi.length ? "Avanti ▶" : "Ho capito 👍"}</button></div>`;
    $("tourOk").onclick = () => { k++; mostra(); };
  };
  mostra();
}

schermataIniziale();
Scuola.avvia().then(() => {
  if (Scuola.aula && Scuola.ruolo !== "singolo") { $("classe").value = Scuola.aula.slice(0, 8); $("classeNota").textContent = `Aula ${Scuola.aula} · collegata al server della scuola. Classe e materia arrivano dall'orario.`; }
  aggiornaOrario();
  return controlla();
}).then(() => setTimeout(benvenuto, 600));
