// ===================================================================
//  FLY AULA v0.3 · il programma
//  Il "cervello" gira sul computer (Ollama); questa è la lavagna.
//  Niente internet: domande, risposte e voce restano sul computer.
// ===================================================================
const OLLAMA = "http://localhost:11434";
const MODELLI = ["qwen2.5:14b", "qwen2.5:7b", "gemma3:12b", "qwen3:8b", "llama3.1:8b"];
let modello = null;
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
      options: { temperature, num_ctx: 8192 }, messages: [{ role: "system", content: sistema }, { role: "user", content: utente }] })
  });
  const j = await r.json();
  return (j.message?.content || "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}
// risposta che si scrive mentre arriva (per la lavagna)
async function cervelloInDiretta(messaggi, ogniPezzo) {
  const r = await fetch(OLLAMA + "/api/chat", {
    method: "POST",
    body: JSON.stringify({ model: modello, stream: true, keep_alive: "2h", options: { temperature: 0.2, num_ctx: 8192 }, messages: messaggi })
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
    <div><b>${s.ricontrollate || 0}</b><span>ricontrollate dal revisore</span></div>
    <div><b style="color:var(--viola)">${s.correttiRevisore || 0}</b><span>corrette dal ricontrollo</span></div>
    <div><b>${controllati}</b><span>conti controllati</span></div>
    <div><b style="color:var(--sole)">${s.contiCorretti || 0}</b><span>conti corretti dalla calcolatrice</span></div>
    <div><b style="color:var(--corallo)">${s.segnalate || 0}</b><span>segnalate dal prof</span></div>
    <div><b>${affid}%</b><span>risposte senza segnalazioni</span></div>`;
  const cls = t => t.startsWith("Conto") ? "calc" : t.startsWith("Corretta dal") ? "rev" : t.startsWith("Bloccata") ? "sic" : "prof";
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
let storia = [], inizioLezione = Date.now(), fineLezione = null, lezioneOrario = null;
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
  storia = []; inizioLezione = Date.now();
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
async function chiedi(domanda) {
  if (occupato) return;
  if (!modello) return mostraAiuto();
  if (lezioneOrario && !lezioneOrario.chiave) return;
  const sic = controllaDomanda(domanda);
  aggiungi("io", escape(domanda));
  if (!sic.ok) {
    aggiungi("ai", escape(sic.risposta));
    annotaErrore("Bloccata dalla sicurezza", sic.motivo, sic.motivo === "aiuto" ? "(domanda personale: non salvata)" : domanda);
    return;
  }
  occupato = true; $("invia").disabled = true; Voce.zitto();
  domandaCorrente = domanda;
  storia.push({ role: "user", content: domanda });
  const bolla = aggiungi("ai", '<span class="cursore"></span>');
  const materia = $("materia").value, livello = $("livello").value;
  const sistema = istruzioniMateria(materia, livello, $("classe").value, leggi(chiaveRiassunto()));
  try {
    // 1) prima stesura (si vede mentre la scrive)
    let testo = await cervelloInDiretta([{ role: "system", content: sistema }, ...storia.slice(-16)], t => { bolla.innerHTML = impagina(t, false); chat.scrollTop = chat.scrollHeight; });
    // 2) ricontrollo SEMPRE
    bolla.classList.add("controllo");
    bolla.insertAdjacentHTML("beforeend", `<div class="lavoro" id="lavoroRev">🔍 Ricontrollo tutto prima di confermare…</div>`);
    const timbri = [];
    const conto = MATERIE[materia].calcoli ? contoNellaDomanda(domanda) : null;
    const contesto = `${MATERIE[materia].nome}, scuola ${livello}.` + (conto ? ` FATTO SICURO (calcolatrice): ${conto.testo} = ${formatta(conto.risultato)}.` : "");
    const rev = await revisiona(cervello, domanda, testo, contesto);
    conta("ricontrollate");
    if (rev.ok === false) {
      annotaErrore("Corretta dal ricontrollo", rev.problema + " · prima: " + testo.slice(0, 140));
      conta("correttiRevisore");
      testo = rev.correzione;
      timbri.push(`<span class="timbro giallo">🔁 Ricontrollata e corretta: ${escape(rev.problema).slice(0, 90)}</span>`);
    } else if (rev.ok === true) timbri.push(`<span class="timbro">✓ Ricontrollata</span>`);
    else timbri.push(`<span class="timbro rosso">⚠️ Ricontrollo non riuscito: verificare con il prof</span>`);
    // 3) se la domanda era un conto, il risultato giusto deve esserci
    if (conto && !contieneRisultato(testo, conto.risultato)) {
      testo += `\n✅ Risultato della calcolatrice: ${conto.testo} = ${formatta(conto.risultato)}`;
      annotaErrore("Corretta dal ricontrollo", `mancava il risultato giusto: ${conto.testo} = ${formatta(conto.risultato)}`);
    }
    // 4) sicurezza anche sulla risposta
    if (!controllaRisposta(testo)) { annotaErrore("Bloccata dalla sicurezza", "risposta non adatta"); testo = "Torniamo alla materia 😊 Prova a farmi un'altra domanda."; }
    // 5) calcolatrice su ogni conto + disegni
    let corretti = 0;
    const html = impagina(testo, true, (tipo, det) => { if (tipo === "ok") conta("contiOk"); else { corretti++; conta("contiCorretti"); annotaErrore("Conto sbagliato (corretto dalla calcolatrice)", det); } });
    if (corretti) timbri.push(`<span class="timbro giallo">🧮 ${corretti} ${corretti === 1 ? "conto corretto" : "conti corretti"} dalla calcolatrice</span>`);
    bolla.classList.remove("controllo");
    bolla.innerHTML = html + `<div class="timbri">${timbri.join("")}</div>`;
    conta("risposte");
    aggiungiAzioni(bolla, domanda, testo);
    storia.push({ role: "assistant", content: testo });
    if (leggiAuto) Voce.leggiAdAltaVoce(testo);
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
  d.querySelector(".b-leggi").onclick = () => Voce.leggiAdAltaVoce(testo);
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

// ---------------- modalità esercizi ----------------
let punti = { giuste: 0, totali: 0 };
async function nuovoEsercizio(argomento = "") {
  if (!modello) return mostraAiuto();
  if (occupato) return;
  occupato = true;
  const card = aggiungi("ai", `<div class="lavoro">✏️ Preparo un esercizio e controllo il risultato con la calcolatrice…</div>`);
  try {
    const es = await creaEsercizio(cervello, MATERIE[$("materia").value].nome, $("livello").value, argomento);
    card.innerHTML = `<div class="esercizio"><div class="tag">✏️ ESERCIZIO ${punti.totali + 1} · risultato già controllato dalla calcolatrice ✓</div>${escape(es.testo)}
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
        await chiedi(`Esercizio: "${es.testo}". La classe ha risposto ${inp.value}, ma il risultato giusto è ${formatta(es.risultato)} ${es.unita}. Spiega con gentilezza dove probabilmente si è sbagliato e come si arriva al risultato giusto.`);
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
      let r2 = correggiTesto(r1);
      rev = await revisiona(cervello, q.d, r2, MATERIE[mat].nome + ". La risposta deve finire con 'RISULTATO: numero'.");
      if (rev.ok === false) r2 = correggiTesto(rev.correzione);
      x2 = leggiRisultato(r2);
    } catch (e) {}
    const ok1 = giusto(x1, q.r), ok2 = giusto(x2, q.r);
    prima += ok1; dopo += ok2;
    (per[q.categoria] = per[q.categoria] || { n: 0, p: 0, d: 0 }); per[q.categoria].n++; per[q.categoria].p += ok1; per[q.categoria].d += ok2;
    esameRighe.push([i + 1, q.categoria, q.d, formatta(q.r), isFinite(x1) ? formatta(x1) : "?", ok1 ? "giusta" : "SBAGLIATA", isFinite(x2) ? formatta(x2) : "?", ok2 ? "giusta" : "SBAGLIATA", rev.ok === false ? "corretta: " + rev.problema : rev.ok ? "ok" : "non riuscito"]);
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
  $("timer").textContent = `⏱️ ${Math.floor(m / 60) ? Math.floor(m / 60) + " h " : ""}${m % 60} min`;
}, 5000);
setInterval(aggiornaOrario, 30000);

// ---------------- il cervello è acceso? ----------------
async function controlla() {
  try {
    const r = await fetch(OLLAMA + "/api/tags");
    const j = await r.json();
    const presenti = (j.models || []).map(m => m.name);
    modello = MODELLI.find(m => presenti.includes(m)) || presenti[0] || null;
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
$("esCsv").onclick = () => scaricaCsv("fly-aula-esame.csv", ["N", "Categoria", "Domanda", "Risultato giusto", "Fly Aula (senza controlli)", "Esito", "Fly Aula (con i controlli)", "Esito", "Revisore"], esameRighe);
$("apriOrario").onclick = () => { Orario.disegnaEditor($("editorOrario")); apri("pOrario"); };
$("orFatto").onclick = () => { $("pOrario").style.display = "none"; aggiornaOrario(); };
$("orCancella").onclick = () => { try { localStorage.removeItem("flyaula_orario"); } catch (e) {} Orario.disegnaEditor($("editorOrario")); aggiornaOrario(); };
$("apriEsercizi").onclick = () => nuovoEsercizio();
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
