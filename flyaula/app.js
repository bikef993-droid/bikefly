// ===================================================================
//  FLY AULA v0.5 · il programma
//  Il "cervello" gira sul computer (Ollama); questa è la lavagna.
//  Niente internet: domande, risposte e voce restano sul computer.
// ===================================================================
const OLLAMA = "http://localhost:11434";
const MODELLI = ["qwen2.5:14b", "qwen2.5:7b", "gemma3:12b", "qwen3:8b", "llama3.1:8b"];
let modello = null;
window.modelliPresenti = [];
const contesto = () => (Pagine.attive ? 16384 : 8192);
const $ = id => document.getElementById(id);
const chat = $("chat");
function leggi(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function scrivi(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
function escape(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

// ---------------- il cervello ----------------
// risposta intera (per revisore, esercizi, esame, riassunti)
async function cervello(sistema, utente, { temperature = 0.2, format } = {}) {
  const r = await fetch(OLLAMA + "/api/chat", {
    method: "POST",
    body: JSON.stringify({ model: modello, stream: false, keep_alive: "2h", ...(format ? { format } : {}),
      options: { temperature, num_ctx: contesto() }, messages: [{ role: "system", content: sistema }, { role: "user", content: utente }] })
  });
  const j = await r.json();
  return (j.message?.content || "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}
// risposta che si scrive mentre arriva (per la lavagna)
async function cervelloInDiretta(messaggi, ogniPezzo) {
  const r = await fetch(OLLAMA + "/api/chat", {
    method: "POST",
    body: JSON.stringify({ model: modello, stream: true, keep_alive: "2h", options: { temperature: 0.2, num_ctx: contesto() }, messages: messaggi })
  });
  const lettore = r.body.getReader(), dec = new TextDecoder();
  let resto = "", testo = "";
  for (;;) {
    const { value, done } = await lettore.read();
    if (done) break;
    resto += dec.decode(value, { stream: true });
    const righe = resto.split("\n"); resto = righe.pop();
    for (const l of righe) if (l.trim()) { testo += JSON.parse(l).message?.content || ""; ogniPezzo(testo.replace(/<think>[\s\S]*?(<\/think>|$)/g, "")); }
  }
  return testo.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
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
  const m = MATERIE[$("materia").value], esempi = m.esempi[$("livello").value] || m.esempi.medie;
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
  if (salva && storia.length) { const s = await riassunto(); if (s) scrivi(chiaveRiassunto(), s); }
  storia = []; inizioLezione = Date.now(); avvisoRipasso = false;
  Pagine.svuota();
  schermataIniziale();
}

// ---------------- impaginazione: passaggi, conti, disegni ----------------
function impagina(testo, finito, segna) {
  const righe = testo.split(/\n+/).filter(r => r.trim());
  return righe.map(r => {
    const dis = r.trim().match(/^\[DISEGNO:\s*(.+?)\]\s*$/i);
    if (dis) return finito ? (disegna(dis[1]) || "") : `<div class="lavoro">🎨 preparo il disegno…</div>`;
    let e = escape(r).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\[DISEGNO:[^\]]*\]/gi, "");
    const m = e.match(/^\s*(\d+)[.)]\s+(.*)$/);
    const corpo = finito ? controllaConti(m ? m[2] : e, segna) : (m ? m[2] : e);
    return m ? `<div class="passo"><span class="n">${m[1]}</span><span>${corpo}</span></div>` : `<div>${corpo}</div>`;
  }).join("") + (finito ? "" : '<span class="cursore"></span>');
}
// versione testo (per l'esame): i conti sbagliati vengono corretti dalla calcolatrice
function correggiTesto(testo) {
  return testo.replace(RE_CONTO, (tutto, a, op, b, c) => {
    const g = calcola(leggiNumero(a), op, leggiNumero(b));
    return isFinite(g) ? `${a} ${op} ${b} = ${formatta(g)}` : tutto;
  });
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
  const materia = $("materia").value, livello = $("livello").value;
  const sistema = istruzioniMateria(materia, livello, $("classe").value, leggi(chiaveRiassunto())) + Prof.istruzioni(MATERIE[materia].nome) + Pagine.istruzioni() + DSA.istruzioni();
  try {
    // 1) prima stesura (si vede mentre la scrive)
    let testo = await cervelloInDiretta([{ role: "system", content: sistema }, ...storia.slice(-16)], t => { bolla.innerHTML = impagina(t, false); chat.scrollTop = chat.scrollHeight; });
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
      speciale: !!speciale.esercizio || !MATERIE[materia].calcoli,
      risultatoObbligatorio: modoProf === "normale",
      ogniPasso: n => { const l = $("lavoroRev"); if (l) l.textContent = passi[n]; }
    });
    testo = es.testo;
    conta("ricontrollate"); conta(es.controlli >= 3 ? "tripli" : "doppi");
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
  } catch (e) {
    bolla.classList.remove("controllo");
    bolla.innerHTML = "⚠️ Non riesco a parlare con il cervello di Fly Aula. Controlla che Ollama sia acceso.";
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
    const es = await creaEsercizio(cervello, MATERIE[$("materia").value].nome, $("livello").value, argomento);
    card.innerHTML = `<div class="esercizio"><div class="tag">✏️ ESERCIZIO ${punti.totali + 1} · ${es.riserva ? "risultato calcolato da Fly Aula ✓" : "risultato controllato 3 volte ✓✓✓"}</div>${escape(es.testo)}
      <div class="risp"><input placeholder="La vostra risposta" inputmode="decimal"><button class="btn">Controlla</button><button class="btn sec b-aiuto">💡 Aiutino</button></div><div class="esito"></div></div>`;
    const inp = card.querySelector("input"), esito = card.querySelector(".esito");
    let tentativi = 0;
    const verifica = async () => {
      if (!inp.value.trim()) return;
      tentativi++;
      if (risultatoGiusto(inp.value, es.risultato)) {
        punti.giuste++; punti.totali++;
        esito.className = "esito si";
        esito.innerHTML = `<span class="applauso">🎉</span> Giusto! ${escape(formatta(es.risultato))} ${escape(es.unita)} · punteggio ${punti.giuste}/${punti.totali}
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
        await chiedi(`Esercizio: "${es.testo}". La classe ha risposto ${inp.value}, ma il risultato giusto è ${formatta(es.risultato)} ${es.unita}. Spiega con gentilezza dove probabilmente si è sbagliato e come si arriva al risultato giusto.`, { esercizio: true });
        esito.innerHTML = `Il risultato era <b>${escape(formatta(es.risultato))} ${escape(es.unita)}</b> · punteggio ${punti.giuste}/${punti.totali}<div class="azioni"><button class="b-altro">✏️ Un altro esercizio</button></div>`;
        esito.querySelector(".b-altro").onclick = () => nuovoEsercizio(argomento);
      }
    };
    card.querySelector(".btn").onclick = verifica;
    inp.onkeydown = e => { if (e.key === "Enter") verifica(); };
    card.querySelector(".b-aiuto").onclick = () => {
      const primo = (es.spiegazione || "").split(/\n|(?=\d\.)/).find(x => x.trim());
      esito.className = "esito no"; esito.textContent = "💡 " + (primo ? primo.trim() : "Leggete bene il testo e scrivete il conto da fare prima di calcolare.");
    };
    inp.focus();
  } catch (e) { card.innerHTML = "⚠️ Non riesco a preparare l'esercizio: controlla che Ollama sia acceso."; }
  occupato = false;
}

// ---------------- esame delle domande ----------------
let esameAttivo = false, esameRighe = [];
async function esame() {
  if (!modello) return mostraAiuto();
  esameAttivo = true; esameRighe = [];
  $("esVia").style.display = "none"; $("esStop").style.display = ""; $("esCsv").style.display = "none";
  const n = +$("esN").value, livello = $("esLivello").value, domande = creaEsame(n);
  const per = {}, inizio = Date.now();
  let prima = 0, dopo = 0;
  for (let i = 0; i < domande.length && esameAttivo; i++) {
    const q = domande[i], mat = q.categoria === "Economia aziendale" ? "economia" : "matematica";
    let r1 = "", x1 = NaN, x2 = NaN, rev = { ok: null };
    try {
      r1 = await cervello(istruzioniMateria(mat, livello === "elementari" && mat === "economia" ? "superiori" : livello, "Esame", "") + "\nAlla fine scrivi su una riga da sola: RISULTATO: <solo il numero>", q.d, { temperature: 0.2 });
      x1 = leggiRisultato(r1);
      // con i controlli: calcolatrice sui conti + revisore severo (senza suggerirgli il risultato)
      const es = await ricontrolloCompleto(cervello, { domanda: q.d, testo: r1, contesto: MATERIE[mat].nome + ". La risposta deve finire con 'RISULTATO: numero'.", risultatoObbligatorio: false });
      rev = { ok: es.stato === "ok", problema: es.correzioni.join(" · "), controlli: es.controlli, dubbio: es.stato === "dubbio" };
      x2 = leggiRisultato(es.testo);
    } catch (e) {}
    const ok1 = giusto(x1, q.r), ok2 = giusto(x2, q.r);
    prima += ok1; dopo += ok2;
    (per[q.categoria] = per[q.categoria] || { n: 0, p: 0, d: 0 }); per[q.categoria].n++; per[q.categoria].p += ok1; per[q.categoria].d += ok2;
    esameRighe.push([i + 1, q.categoria, q.d, formatta(q.r), isFinite(x1) ? formatta(x1) : "?", ok1 ? "giusta" : "SBAGLIATA", isFinite(x2) ? formatta(x2) : "?", ok2 ? "giusta" : "SBAGLIATA", (rev.dubbio ? "DUBBIO: " : rev.problema ? "corretta: " : "ok") + (rev.problema || "") + (rev.controlli ? " (" + rev.controlli + " controlli)" : "")]);
    const fatte = i + 1, sec = (Date.now() - inizio) / 1000 / fatte;
    $("esBarra").style.width = (100 * fatte / domande.length) + "%";
    $("esRisultato").innerHTML = disegnaEsame(fatte, domande.length, prima, dopo, per, Math.round(sec * (domande.length - fatte) / 60));
  }
  esameAttivo = false;
  $("esVia").style.display = ""; $("esStop").style.display = "none"; $("esCsv").style.display = "";
  scrivi("flyaula_esame_" + modello, JSON.stringify({ quando: new Date().toLocaleString("it-IT"), n: esameRighe.length, prima, dopo }));
}
function disegnaEsame(fatte, tot, prima, dopo, per, minuti) {
  const pc = x => (Math.round(1000 * x / fatte) / 10).toLocaleString("it-IT") + "%";
  return `<div class="stat">
      <div><span>domande</span><b style="color:var(--latte)">${fatte}/${tot}</b></div>
      <div><span>giuste SENZA controlli</span><b style="color:var(--sole)">${pc(prima)}</b></div>
      <div><span>giuste CON i controlli</span><b>${pc(dopo)}</b></div>
      <div><span>cervello</span><b style="color:var(--cielo);font-size:22px">${escape(modello)}</b></div>
      <div><span>tempo che manca</span><b style="color:var(--latte);font-size:26px">${fatte < tot ? "~" + minuti + " min" : "finito ✓"}</b></div></div>
    <table><thead><tr><th>Categoria</th><th>Domande</th><th>Senza controlli</th><th>Con i controlli</th></tr></thead><tbody>
    ${Object.entries(per).map(([c, v]) => `<tr><td>${c}</td><td>${v.n}</td><td>${Math.round(100 * v.p / v.n)}%</td><td><b>${Math.round(100 * v.d / v.n)}%</b></td></tr>`).join("")}</tbody></table>
    ${esameRighe.filter(r => r[7] !== "giusta").length ? `<h3 style="margin-top:24px">Le sbagliate (anche dopo i controlli)</h3><table><tbody>${esameRighe.filter(r => r[7] !== "giusta").slice(-15).map(r => `<tr><td>${escape(r[2])}</td><td>giusto: <b>${r[3]}</b></td><td>Fly Aula: ${r[6]}</td></tr>`).join("")}</tbody></table>` : ""}`;
}

// ---------------- orario automatico ----------------
function aggiornaOrario() {
  const l = Orario.adesso();
  const prima = lezioneOrario;
  lezioneOrario = l;
  if (l) {
    $("lezione").style.display = "";
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
    const r = await fetch(OLLAMA + "/api/tags");
    const j = await r.json();
    const presenti = (j.models || []).map(m => m.name);
    window.modelliPresenti = presenti;
    modello = MODELLI.find(m => presenti.includes(m)) || presenti.find(m => !/vl|vision|llava|embed/.test(m)) || null;
    if (modello) { $("stato").textContent = "🧠 " + modello + " · offline"; $("stato").className = "ok"; $("aiuto").style.display = "none"; }
    else { $("stato").textContent = "Manca il modello"; $("stato").className = "ko"; mostraAiuto(true); }
  } catch (e) { modello = null; $("stato").textContent = "Cervello spento"; $("stato").className = "ko"; mostraAiuto(false); }
}
function mostraAiuto(acceso) {
  $("aiutoBox").innerHTML = acceso
    ? `<h2>Manca il cervello di Fly Aula</h2><p>Ollama è acceso, ma non c'è ancora il modello. Apri <b>PowerShell</b> e scrivi:</p><p><code>ollama pull qwen2.5:7b</code></p><p>(circa 4,7 GB, si scarica una volta sola). Poi <b>ricarica questa pagina</b>.</p>`
    : `<h2>Fly Aula non trova il suo cervello</h2><p>1. Controlla che <b>Ollama</b> sia aperto (icona del lama vicino all'orologio).</p><p>2. Se è aperto ma non va, apri <b>PowerShell</b> e scrivi:<br><code>setx OLLAMA_ORIGINS "*"</code><br>poi chiudi Ollama (tasto destro sull'icona → Quit) e riaprilo.</p><p>3. Se Chrome chiede il permesso per la <b>rete locale</b>, tocca <b>Consenti</b>.</p><p>Poi ricarica la pagina.</p><button class="btn" style="padding:14px 24px" onclick="controlla()">Riprova</button>`;
  $("aiuto").style.display = "flex";
}

// ---------------- voce ----------------
let leggiAuto = leggi("flyaula_leggi") === "1";
const aggiornaLeggi = () => { $("leggiAuto").textContent = leggiAuto ? "🔊" : "🔇"; $("leggiAuto").classList.toggle("on", leggiAuto); };
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
$("apriEsame").onclick = () => { $("esLivello").value = $("livello").value; apri("pEsame"); };
$("esVia").onclick = esame;
$("esStop").onclick = () => { esameAttivo = false; };
$("esCsv").onclick = () => scaricaCsv("fly-aula-esame.csv", ["N", "Categoria", "Domanda", "Risultato giusto", "Fly Aula (senza controlli)", "Esito", "Fly Aula (con i controlli)", "Esito", "Controlli"], esameRighe);
$("apriOrario").onclick = () => { Orario.disegnaEditor($("editorOrario")); apri("pOrario"); };
$("orFatto").onclick = () => { $("pOrario").style.display = "none"; aggiornaOrario(); };
$("orCancella").onclick = () => { try { localStorage.removeItem("flyaula_orario"); } catch (e) {} Orario.disegnaEditor($("editorOrario")); aggiornaOrario(); };
$("apriEsercizi").onclick = () => nuovoEsercizio();
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
$("vSblocca").onclick = () => Prof.sbloccaVerifica();
Pagine.collega();
Prof.applicaTema(); Prof.aggiornaPill(); Prof.mostraVerifica();
$("modulo").onsubmit = e => { e.preventDefault(); const d = $("domanda").value.trim(); if (d) { $("domanda").value = ""; chiedi(d); } };
$("nuova").onclick = () => nuovaLezione(true);
$("classe").onchange = () => nuovaLezione(false);
$("materia").onchange = () => nuovaLezione(true);
$("livello").onchange = () => schermataIniziale();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
let invitoInstalla = null;
addEventListener("beforeinstallprompt", e => { e.preventDefault(); invitoInstalla = e; $("installa").style.display = ""; });
$("installa").onclick = async () => { if (!invitoInstalla) return; invitoInstalla.prompt(); await invitoInstalla.userChoice; invitoInstalla = null; $("installa").style.display = "none"; };
addEventListener("appinstalled", () => { $("installa").style.display = "none"; });
$("nErrori").textContent = registro().length;
schermataIniziale();
aggiornaOrario();
controlla();
