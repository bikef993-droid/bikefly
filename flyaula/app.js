// ===================================================================
//  FLY AULA v0.9.3 · il programma
//  Il "cervello" gira sul computer (Ollama); questa è la lavagna.
//  Niente internet: domande, risposte e voce restano sul computer.
// ===================================================================
const OLLAMA = "http://localhost:11434";
// i cervelli che conosciamo, dal più forte al più leggero (tutti entrano in una scheda da 16 GB).
// Se è stata fatta la GARA, vince il cervello scelto lì.
const MODELLI = ["gemma4:26b-a4b", "gemma4:12b", "qwen3.5:9b", "qwen3:14b", "gpt-oss:20b", "qwen2.5:14b", "gemma3:12b", "qwen3:8b", "qwen2.5:7b", "llama3.1:8b"];
let modello = null;
window.modelliPresenti = [];
const contesto = () => (Pagine.attive ? 16384 : 8192);
const $ = id => document.getElementById(id);
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

// risposta intera (per revisore, esercizi, esame, riassunti)
async function cervello(sistema, utente, { temperature = 0.2, format, pensa = false } = {}) {
  const r = await Scuola.chiama("/api/chat", {
    method: "POST",
    body: JSON.stringify({ model: modello, stream: false, keep_alive: "2h", ...(format ? { format } : {}), ...pensiero(modello, pensa),
      options: { temperature, num_ctx: contesto(), num_predict: tetto(modello, pensa, MAX_PAROLE_LAVORO) }, messages: [{ role: "system", content: sistema }, { role: "user", content: utente }] })
  });
  const j = await r.json();
  let t = senzaPensieri(j.message?.content || "").trim();
  if (format) return t;                      // JSON: lo pulisce chi lo legge
  const g = trovaGiro(t);
  if (g) t = g.testo;
  return pulisciLatex(t);                    // il LaTeX diventa simboli normali
}

// risposta che si scrive mentre arriva (per la lavagna).
// Si ferma da sola se si incanta o diventa troppo lunga; il prof la può fermare (⏹ o Esc).
// Restituisce { testo, fine }: fine = null (tutto ok) | "giro" | "lunga" | "fermata"
let rispostaInCorso = null;
function fermaRisposta() { if (rispostaInCorso) rispostaInCorso.abort(); }
async function cervelloInDiretta(messaggi, ogniPezzo) {
  const ctrl = new AbortController();
  rispostaInCorso = ctrl;
  let testo = "", fine = null;
  try {
    const r = await Scuola.chiama("/api/chat", {
      method: "POST", signal: ctrl.signal,
      body: JSON.stringify({ model: modello, stream: true, keep_alive: "2h", ...pensiero(modello, false), options: { temperature: 0.2, num_ctx: contesto(), num_predict: tetto(modello, false, MAX_PAROLE_LAVAGNA) }, messages: messaggi })
    });
    const lettore = r.body.getReader(), dec = new TextDecoder();
    let resto = "", controllato = 0;
    flusso: for (;;) {
      const { value, done } = await lettore.read();
      if (done) break;
      resto += dec.decode(value, { stream: true });
      const righe = resto.split("\n"); resto = righe.pop();
      for (const l of righe) {
        if (!l.trim()) continue;
        testo += JSON.parse(l).message?.content || "";
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
  } finally { if (rispostaInCorso === ctrl) rispostaInCorso = null; }
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
    return await cervello("Riassumi in massimo 2 frasi cosa ha fatto la classe in questa lezione e dove si è bloccata. Niente nomi di persone.",
      storia.map(m => (m.role === "user" ? "Classe: " : "Fly Aula: ") + m.content).join("\n").slice(-6000), { temperature: 0.1 });
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
  domandaCorrente = domanda;
  storia.push({ role: "user", content: domanda });
  const bolla = aggiungi("ai", '<span class="cursore"></span>');
  const attesa = setTimeout(() => { if (bolla.querySelector(".cursore") && bolla.textContent.trim() === "") bolla.innerHTML = `<div class="lavoro">${Scuola.ruolo === "lim" ? "⏳ Fly Aula sta aiutando altre classi, arrivo…" : "☕ Ci penso un attimo…"}</div>`; }, 4000);
  const materia = $("materia").value, livello = $("livello").value;
  let sistema = istruzioniMateria(materia, livello, $("classe").value, leggi(chiaveRiassunto())) + istruzioniProgramma(materia, livello, $("classe").value) + Prof.istruzioni(MATERIE[materia].nome) + Pagine.istruzioni() + DSA.istruzioni();
  try { fatto: {
    // 0) 🧮 i conti li fa la calcolatrice PRIMA che il cervello scriva
    const fatti = await contiPrima(domanda, materia, bolla);
    sistema += istruzioniFatti(fatti);
    // 1) prima stesura (si vede mentre la scrive; il prof la può fermare con ⏹)
    mostraFerma(true);
    const prima = await cervelloInDiretta([{ role: "system", content: sistema }, ...storia.slice(-16)], t => { clearTimeout(attesa); bolla.innerHTML = impagina(t, false); chat.scrollTop = chat.scrollHeight; });
    mostraFerma(false);
    clearTimeout(attesa);
    let testo = prima.testo;
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
    if (prima.fine) annotaErrore(prima.fine === "giro" ? "Si ripeteva (fermata da sola)" : "Risposta troppo lunga (accorciata)", testo.slice(-160));
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
    const es = await ricontrolloCompleto(cervello, {
      domanda, testo, contesto: ctx, conto,
      speciale: !!speciale.esercizio || !MATERIE[materia].calcoli || !!prima.fine,
      risultatoObbligatorio: modoProf === "normale",
      ogniPasso: n => { const l = $("lavoroRev"); if (l) l.textContent = passi[n]; }
    });
    testo = es.testo;
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
    if (es.contiCorretti) timbri.push(`<span class="timbro giallo">🧮 ${es.contiCorretti} ${es.contiCorretti === 1 ? "conto corretto" : "conti corretti"} dalla calcolatrice</span>`);
    if (Pagine.attive) timbri.push(`<span class="timbro blu">📷 Usate le pagine del libro</span>`);
    if (fatti.length) timbri.push(`<span class="timbro blu">🧮 ${fatti.length === 1 ? "Conto fatto" : fatti.length + " conti fatti"} dalla calcolatrice</span>`);
    if (prima.fine) timbri.push(`<span class="timbro giallo">${prima.fine === "giro" ? "🔁 Si stava ripetendo: ho tolto le ripetizioni" : "✂️ Era troppo lunga: l'ho accorciata"}</span>`);
    // disegno automatico del conto, se il cervello non l'ha messo
    if (conto && MATERIE[materia].calcoli && !/\[DISEGNO:/i.test(testo)) {
      const dis = disegnoPerConto(conto);
      if (dis) { const r = testo.split("\n"); r.splice(Math.min(1, r.length), 0, dis); testo = r.join("\n"); }
    }
    // 3) sicurezza anche sulla risposta
    if (!controllaRisposta(testo)) { annotaErrore("Bloccata dalla sicurezza", "risposta non adatta"); testo = "Torniamo alla materia 😊 Prova a farmi un'altra domanda."; timbri.length = 0; }
    // 4) disegno finale: ogni conto rimasto viene segnato dalla calcolatrice
    const html = impagina(testo, true, tipo => { if (tipo === "ok") conta("contiOk"); });
    bolla.classList.remove("controllo");
    bolla.innerHTML = html + `<div class="timbri">${timbri.join("")}</div>`;
    conta("risposte");
    aggiungiAzioni(bolla, domanda, testo);
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
  occupato = false; $("invia").disabled = false;
  chat.scrollTop = chat.scrollHeight;
}

function aggiungiAzioni(bolla, domanda, testo) {
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
      d.innerHTML = `<span class="grazie">✓ Segnalato: grazie, servirà a migliorare Fly Aula</span>`;
    };
    invia.onclick = manda; inp.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); manda(); } };
    annulla.onclick = () => { d.remove(); aggiungiAzioni(bolla, domanda, testo); };
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
  const c = $("riaCorpo");
  if (storia.length < 2) { c.innerHTML = `<p class="sotto">La lezione è appena iniziata: fate qualche domanda a Fly Aula e poi il riassunto si prepara da solo.</p>`; return; }
  occupato = true;
  c.innerHTML = `<div class="lavoro" style="font-size:22px">📒 Scrivo il riassunto e lo controllo 3 volte con la lezione…</div>`;
  try {
    const es = await creaRiassunto(cervello, storia, $("materia").value, $("livello").value, $("classe").value);
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
    card.innerHTML = `<div class="esercizio"><div class="tag">✏️ ESERCIZIO ${punti.totali + 1} · ${es.riserva ? "risultato calcolato da Fly Aula ✓" : "risultato controllato 3 volte ✓✓✓"}</div>${escape(es.testo)}
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
      esito.className = "esito no"; esito.textContent = "💡 " + (primo ? primo.trim() : (es.tipo === "parola" ? "Leggete bene la frase: che tempo verbale o che parola serve?" : "Leggete bene il testo e scrivete il conto da fare prima di calcolare."));
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
  let prima = 0, dopo = 0, dubbi = 0, fatte = 0;
  for (let i = 0; i < domande.length && esameAttivo; i++) {
    const q = domande[i], mat = q.categoria === "Economia aziendale" ? "economia" : "matematica";
    let r1 = "", x1 = NaN, x2 = NaN, rev = { ok: null };
    try {
      const fatti = calcPrima ? await contiPrima(q.d, mat, null) : [];
      r1 = await cervello(istruzioniMateria(mat, livello === "elementari" && mat === "economia" ? "superiori" : livello, "Esame", "") + istruzioniFatti(fatti) + "\nAlla fine scrivi su una riga da sola: RISULTATO: <solo il numero>", q.d, { temperature: 0.2 });
      x1 = leggiRisultato(r1);
      // con i controlli: calcolatrice sui conti + revisore severo (senza suggerirgli il risultato)
      const es = await ricontrolloCompleto(cervello, { domanda: q.d, testo: r1, contesto: MATERIE[mat].nome + ". La risposta deve finire con 'RISULTATO: numero'.", risultatoObbligatorio: false });
      rev = { ok: es.stato === "ok", problema: es.correzioni.join(" · "), controlli: es.controlli, dubbio: es.stato === "dubbio" };
      x2 = leggiRisultato(es.testo);
    } catch (e) {}
    const ok1 = giusto(x1, q.r), ok2 = giusto(x2, q.r);
    prima += ok1; dopo += ok2; dubbi += !!rev.dubbio; fatte++;
    (per[q.categoria] = per[q.categoria] || { n: 0, p: 0, d: 0 }); per[q.categoria].n++; per[q.categoria].p += ok1; per[q.categoria].d += ok2;
    const riga = [i + 1, q.categoria, q.d, formatta(q.r), isFinite(x1) ? formatta(x1) : "?", ok1 ? "giusta" : "SBAGLIATA", isFinite(x2) ? formatta(x2) : "?", ok2 ? "giusta" : "SBAGLIATA", (rev.dubbio ? "DUBBIO: " : rev.problema ? "corretta: " : "ok") + (rev.problema || "") + (rev.controlli ? " (" + rev.controlli + " controlli)" : "")];
    ogniDomanda({ riga, fatte, prima, dopo, per, sec: (Date.now() - inizio) / 1000 / fatte });
  }
  return { fatte, prima, dopo, dubbi, per, sec: fatte ? (Date.now() - inizio) / 1000 / fatte : 0 };
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
  scrivi("flyaula_esame_" + modello, JSON.stringify({ quando: new Date().toLocaleString("it-IT"), n: fine.fatte, prima: fine.prima, dopo: fine.dopo }));
}
function mostraBottoniEsame(inCorso) {
  $("esVia").style.display = $("esGara").style.display = inCorso ? "none" : "";
  $("esStop").style.display = inCorso ? "" : "none";
  $("esCsv").style.display = !inCorso && esameRighe.length ? "" : "none";
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
  el.innerHTML = tutti.map(m => `<label class="scelta-cervello"><input type="checkbox" value="${escape(m)}" checked> ${escape(m)}${m === modello ? " <small>(in uso)</small>" : ""}</label>`).join("");
}
async function gara() {
  const scelti = [...$("esModelli").querySelectorAll("input:checked")].map(i => i.value);
  if (scelti.length < 2) { $("esRisultato").innerHTML = `<p class="sotto">Scegli almeno 2 cervelli per la gara.</p>`; return; }
  const inUso = modello, livello = $("esLivello").value, n = +$("esNGara").value;
  const domande = creaEsame(n, livello), risultati = [];
  esameAttivo = true; esameRighe = [];
  mostraBottoniEsame(true);
  const totale = scelti.length * domande.length;
  for (let k = 0; k < scelti.length && esameAttivo; k++) {
    const m = scelti[k];
    modello = m; await leggiCapacita(m);
    const t0 = Date.now();
    const r = await provaCervello(domande, livello, ({ riga, fatte, prima, dopo, sec }) => {
      esameRighe.push([m, ...riga]);
      $("esBarra").style.width = (100 * (k * domande.length + fatte) / totale) + "%";
      const resta = Math.round((sec * (domande.length - fatte) + sec * domande.length * (scelti.length - k - 1)) / 60);
      $("esRisultato").innerHTML = disegnaGara(risultati, { m, fatte, tot: domande.length, prima, dopo }, resta);
    });
    if (r.fatte) risultati.push({ m, ...r, minuti: (Date.now() - t0) / 60000 });
    // libera la scheda video per il prossimo concorrente
    if (m !== inUso) Scuola.chiama("/api/generate", { method: "POST", body: JSON.stringify({ model: m, keep_alive: 0 }) }).catch(() => {});
  }
  modello = inUso;
  esameAttivo = false;
  mostraBottoniEsame(false);
  $("esRisultato").innerHTML = disegnaGara(risultati, null, 0);
  const b = $("esRisultato").querySelector(".usa-vincitore");
  if (b) b.onclick = async () => { await usaCervello(b.dataset.m); b.outerHTML = `<p class="ok-gara">✓ Da adesso Fly Aula usa <b>${escape(b.dataset.m)}</b>${Scuola.ruolo === "server" ? " su tutte le LIM della scuola" : ""}.</p>`; preparaGara(); };
  scrivi("flyaula_gara", JSON.stringify({ quando: new Date().toLocaleString("it-IT"), n: domande.length, risultati: risultati.map(r => ({ m: r.m, prima: r.prima, dopo: r.dopo, fatte: r.fatte, sec: Math.round(r.sec) })) }));
}
// classifica: più risposte giuste con i controlli; a parità, meno dubbi; poi il più veloce
function classifica(risultati) {
  return [...risultati].sort((a, b) => b.dopo / b.fatte - a.dopo / a.fatte || a.dubbi - b.dubbi || a.sec - b.sec);
}
function disegnaGara(risultati, inCorso, minuti) {
  const pc = (x, n) => n ? (Math.round(1000 * x / n) / 10).toLocaleString("it-IT") + "%" : "–";
  const ord = classifica(risultati), medaglie = ["🥇", "🥈", "🥉"];
  const secondi = x => (x < 10 ? Math.round(x * 10) / 10 : Math.round(x)).toLocaleString("it-IT") + " s";
  const righe = ord.map((r, i) => `<tr${i === 0 && !inCorso ? ' class="vincitore"' : ""}><td>${medaglie[i] || i + 1}</td><td><b>${escape(r.m)}</b></td><td>${pc(r.prima, r.fatte)}</td><td><b>${pc(r.dopo, r.fatte)}</b></td><td>${r.dubbi}</td><td>${secondi(r.sec)}</td></tr>`).join("");
  const ora = inCorso ? `<tr><td>⏳</td><td><b>${escape(inCorso.m)}</b> <small>sta rispondendo: ${inCorso.fatte}/${inCorso.tot}</small></td><td>${pc(inCorso.prima, inCorso.fatte)}</td><td>${pc(inCorso.dopo, inCorso.fatte)}</td><td></td><td></td></tr>` : "";
  const v = !inCorso && ord[0];
  return `${inCorso ? `<p class="sotto">🏁 Gara in corso · tempo che manca: ~${minuti} min</p>` : ""}
    <table class="tab-gara"><thead><tr><th></th><th>Cervello</th><th>Giuste alla prima risposta</th><th>Giuste con i controlli</th><th>Dubbi</th><th>Tempo per domanda</th></tr></thead><tbody>${righe}${ora}</tbody></table>
    ${v ? `<div class="fine-gara"><p>🏆 Vince <b>${escape(v.m)}</b>: ${pc(v.dopo, v.fatte)} giuste con i controlli, ${secondi(v.sec).replace(" s", " secondi")} per domanda.</p>
      ${v.m !== modello ? `<button class="btn usa-vincitore" data-m="${escape(v.m)}">✓ Usa ${escape(v.m)} da adesso</button>` : `<p class="ok-gara">✓ È già il cervello in uso.</p>`}
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
  if (off) av.innerHTML = `📚 Ora c'è <b>${escape(lezioneOrario.materia)}</b>: Fly Aula questa materia non la sa ancora.<br><small style="color:var(--nebbia)">Arriverà con i prossimi aggiornamenti. Buona lezione!</small>`;
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
    modello = scegliModello(presenti);
    await leggiCapacita(modello);
    if (modello) $("aiuto").style.display = "none"; else mostraAiuto(true);
  } catch (e) { modello = null; mostraAiuto(false); }
  aggiornaEtichettaStato();
}
// quale cervello usare: 1) quello scelto con la gara (sul server della scuola vale per tutte le LIM)
// 2) quello scelto su questo computer  3) il più forte tra quelli scaricati
function trova(presenti, m) { return m ? presenti.find(x => x === m || x === m + ":latest" || x.startsWith(m + "-")) : null; }
function scegliModello(presenti) {
  for (const m of [Scuola.cervelloScelto, leggi("flyaula_modello"), ...MODELLI]) { const t = trova(presenti, m); if (t) return t; }
  return presenti.find(m => !/vl|vision|llava|embed|ocr/.test(m)) || null;
}
async function usaCervello(m) {
  scrivi("flyaula_modello", m);
  try { await fetch("/fa/config", { method: "POST", body: JSON.stringify({ cervello: m }) }); } catch (e) {}   // sul server: vale per tutte le LIM
  modello = m; await leggiCapacita(m); aggiornaEtichettaStato();
}
// in alto: parole semplici per i prof (i dettagli tecnici sono nel "title", per il tecnico)
window.aggiornaEtichettaStato = function () {
  const s = $("stato");
  if (!modello) { s.textContent = "☕ Si sta svegliando…"; s.className = "ko"; s.title = "Il cervello non risponde"; return; }
  s.textContent = Scuola.suRiserva ? "🟡 Pronta · server di riserva" : Scuola.ruolo === "lim" ? "🟢 Pronta · server della scuola" : "🟢 Pronta";
  s.className = Scuola.suRiserva ? "riserva" : "ok";
  s.title = `Cervello: ${modello} · ${Scuola.base}${Scuola.aula ? " · aula " + Scuola.aula : ""}`;
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
$("dsa").onclick = () => DSA.cambia();
DSA.applica();
$("lingua").innerHTML = `<option value="">🌍 Solo italiano</option>` + Object.entries(LINGUE).map(([k, l]) => `<option value="${k}">${l.bandiera} + ${l.nome}${l.prova ? " (in prova)" : ""}</option>`).join("");
$("apriGara").onclick = () => { $("menu").classList.remove("aperto"); Gara.apri(); };
$("apriRipasso").onclick = () => { $("menu").classList.remove("aperto"); ripasso(); };
$("apriRiassunto").onclick = () => { $("menu").classList.remove("aperto"); riassuntoAssenti(); };
$("ripChiudiX").onclick = () => { $("pRipasso").style.display = "none"; };
$("riaChiudi").onclick = () => { $("pRiassunto").style.display = "none"; };
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
