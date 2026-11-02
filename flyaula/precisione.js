// ===================================================================
//  FLY AULA · 🎯 PROVA DI PRECISIONE (materia per materia) e 🧠 CERVELLO GIUSTO PER OGNI MATERIA
//  Fly Aula fa a sé stessa domande con la risposta già SICURA (liste controllate a mano,
//  conti fatti dalla calcolatrice), con tutti i controlli accesi come in classe, e conta
//  quante risposte arrivano giuste sulla lavagna. Obiettivo: almeno il 96% in ogni materia.
//  Con la coppia di cervelli, si può provare ogni domanda con tutti e due: per ogni materia
//  scrive quello che va meglio (l'altro controlla).
// ===================================================================
const Precisione = (() => {
  const el = id => typeof document !== "undefined" && document ? document.getElementById(id) : null;
  const OBIETTIVO = 96;
  let attiva = false, righe = [];

  // ---------- il cervello giusto per ogni materia ----------
  function preferiti() {
    const dalServer = typeof Scuola !== "undefined" ? Scuola.cervelliMateria : null;
    if (dalServer && typeof dalServer === "object") return dalServer;
    try { return JSON.parse(localStorage.getItem("flyaula_cervelli_materia") || "{}") || {}; } catch (e) { return {}; }
  }
  async function salvaPreferiti(p) {
    try { localStorage.setItem("flyaula_cervelli_materia", JSON.stringify(p)); } catch (e) {}
    try { await fetch("/fa/config", { method: "POST", body: JSON.stringify({ materie: JSON.stringify(p) }) }); } catch (e) {}   // sul server: vale per tutte le LIM
    if (typeof Scuola !== "undefined" && Scuola.impostaCervelliMateria) Scuola.impostaCervelliMateria(p);
  }
  // chi scrive in questa materia (null = si decide come sempre, con la difficoltà della domanda)
  function autorePer(materia, a, b) {
    const p = preferiti()[materia];
    return p && (p === a || p === b) ? p : null;
  }

  // ---------- le domande con la risposta sicura ----------
  function domandaPer(k) {
    if (typeof Quiz !== "undefined" && Quiz.sa(k)) {
      const q = Quiz.domanda(k, "superiori");
      return q.accettate ? { testo: q.testo, accettate: q.accettate, mostra: q.mostra, sbagliate: q.sbagliate, gruppo: q.gruppo, lingua: q.lingua } : { testo: q.testo, r: q.r, mostra: q.mostra };
    }
    if (k === "inglese") {
      if (Math.random() < .35) { const [inf, past] = scegli(VERBI_IRREGOLARI); return { testo: `Qual è il past simple di "to ${inf}"?`, accettate: past.split("|"), mostra: past.split("|")[0] }; }
      const [it, en] = scegli(PAROLE_INGLESE); return { testo: `Come si dice "${it}" in inglese?`, accettate: en.split("|"), mostra: en.split("|")[0] };
    }
    const e = CATEGORIE[scegli(categoriePer(k, "superiori", "2ªA", ""))]();
    return { testo: e.d, r: e.r, mostra: formatta(e.r) };
  }
  function domandePer(k, n) {
    const out = [], viste = new Set();
    for (let t = 0; out.length < n && t < n * 40; t++) { const q = domandaPer(k); if (!viste.has(q.testo)) { viste.add(q.testo); out.push(q); } }
    return out;
  }

  // ---------- il voto: la risposta sulla lavagna è giusta? ----------
  const norm = t => Quiz.norm(t);
  function rispostaDi(testo) {
    const t = String(testo).replace(/<think>[\s\S]*?<\/think>/g, "");
    const m = t.match(/RISPOSTA\s*[:=]\s*([^\n]+)/i) || t.match(/RISULTATO\s*[:=]\s*([^\n]+)/i);
    return m ? m[1].replace(/\*\*/g, "").trim() : null;
  }
  function giusta(q, testo) {
    const r = rispostaDi(testo);
    if (q.r !== undefined) {
      const x = r ? leggiNumero(((r.match(/-?\d+(?:[.,]\d+)*/) || [""])[0])) : leggiRisultato(testo);
      return isFinite(x) && giusto(x, q.r);
    }
    const dove = r != null ? r : String(testo).slice(-300);
    if (r != null && Quiz.stessa(r, q.accettate)) return true;
    // la risposta giusta dentro la riga, come parola intera (es. "RISPOSTA: Parigi, la capitale"; "romanico" non vale "Roma"),
    // ma niente risposte "a caso" con più opzioni
    const parole = t => " " + String(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss").replace(/(\d)[.,](?=\d{3}\b)/g, "$1").replace(/[^a-z0-9\u4e00-\u9fff,]+/g, " ").replace(/,/g, " , ").replace(/\s+/g, " ").trim() + " ";
    const riga = parole(dove);
    return q.accettate.some(a => { const x = parole(a).trim(); return x.length >= 1 && riga.includes(" " + x + " "); })
      && !(r != null && /\b(oppure|o forse|non so)\b/i.test(r));
  }

  // ---------- una domanda, come in classe (calcolatrice prima, fatti sicuri, ricontrollo, correzioni) ----------
  async function rispondi(k, q, autore, controllore) {
    const t0 = Date.now();
    let sistema = istruzioniMateria(k, "superiori", "2ªA", "") + (typeof Fatti !== "undefined" ? Fatti.perDomanda(q.testo) : "");
    if (MATERIE[k].calcoli && /\d/.test(q.testo)) { try { sistema += istruzioniFatti(await contiPrima(q.testo, k, null)); } catch (e) {} }
    sistema += "\nAlla fine scrivi su una riga da sola: RISPOSTA: <solo la risposta, brevissima: un numero, un nome o una parola>";
    const bozza = await cervelloDi(autore)(sistema, q.testo, { temperature: 0.2 });
    const primaGiusta = giusta(q, bozza);
    const es = await ricontrolloCompleto(cervelloDi(autore), { controllore: cervelloDi(controllore), domanda: q.testo, testo: bozza,
      contesto: `${MATERIE[k].nome}, scuola superiori. La risposta deve finire con una riga "RISPOSTA: …".`, speciale: !MATERIE[k].calcoli, risultatoObbligatorio: false });
    let finale = es.testo;
    if (typeof Fatti !== "undefined") finale = Fatti.correggi(finale, k).testo;
    return { primaGiusta, giusta: giusta(q, finale), dubbio: es.stato === "dubbio", ms: Date.now() - t0, risposta: rispostaDi(finale) || "" };
  }

  // ---------- la prova ----------
  async function via() {
    if (attiva || typeof modello === "undefined" || !modello) return;
    if (typeof esameAttivo !== "undefined" && esameAttivo) return;
    const n = +el("prN").value, solo = el("prMateria").value, confronta = el("prConfronta").checked && !!secondo;
    const materie = Object.keys(MATERIE).filter(k => !solo || k === solo);
    const cervelli = confronta ? [modello, secondo] : [modello];
    const lavori = []; for (const k of materie) for (const q of domandePer(k, n)) lavori.push({ k, q });
    attiva = true; righe = []; mostra(true);
    const tot = lavori.length * cervelli.length, t0 = Date.now(); let fatte = 0;
    const conti = {};   // materia → cervello → { n, prima, dopo, dubbi }
    for (const { k, q } of lavori) for (const c of cervelli) {
      if (!attiva) break;
      const altro = cervelli.length > 1 ? cervelli.find(x => x !== c) : (secondo && secondo !== c ? secondo : c);
      let r;
      try { r = await rispondi(k, q, c, altro); } catch (e) { r = { primaGiusta: false, giusta: false, dubbio: false, ms: 0, risposta: "(errore: " + e.message + ")" }; }
      const s = ((conti[k] = conti[k] || {})[c] = conti[k][c] || { n: 0, prima: 0, dopo: 0, dubbi: 0 });
      s.n++; s.prima += r.primaGiusta ? 1 : 0; s.dopo += r.giusta ? 1 : 0; s.dubbi += r.dubbio ? 1 : 0;
      righe.push([MATERIE[k].nome, c, q.testo, q.mostra, r.risposta, r.primaGiusta ? "giusta" : "sbagliata", r.giusta ? "giusta" : "sbagliata", r.dubbio ? "sì" : "", Math.round(r.ms / 100) / 10]);
      fatte++;
      const resta = Math.round((Date.now() - t0) / fatte * (tot - fatte) / 60000);
      el("prBarra").style.width = (100 * fatte / tot) + "%";
      el("prStato").textContent = `🎯 ${fatte}/${tot} · ${MATERIE[k].nome} · manca circa ${resta < 60 ? resta + " min" : Math.round(resta / 6) / 10 + " ore"}`;
      disegna(conti, cervelli, false);
    }
    const finita = attiva; attiva = false; mostra(false);
    disegna(conti, cervelli, true, finita);
    try { localStorage.setItem("flyaula_precisione", JSON.stringify({ quando: new Date().toISOString(), cervelli, conti })); } catch (e) {}
  }
  const perc = (a, n) => n ? Math.round(1000 * a / n) / 10 : 0;
  function disegna(conti, cervelli, fine, completa = true) {
    const materie = Object.keys(conti);
    let totN = 0, totOk = 0;
    const scelta = {};
    const righeHtml = materie.map(k => {
      const celle = cervelli.map(c => {
        const s = conti[k][c]; if (!s) return "<td>…</td><td></td>";
        if (c === cervelli[0] || cervelli.length === 1) { totN += s.n; totOk += s.dopo; }
        const p = perc(s.dopo, s.n);
        return `<td class="${p >= OBIETTIVO ? "pr-si" : p >= 85 ? "pr-quasi" : "pr-no"}"><b>${p}%</b> <small>(${s.dopo}/${s.n})</small></td><td><small>prima dei controlli ${perc(s.prima, s.n)}%</small></td>`;
      }).join("");
      if (cervelli.length > 1 && conti[k][cervelli[0]] && conti[k][cervelli[1]]) {
        const a = conti[k][cervelli[0]], b = conti[k][cervelli[1]], pa = perc(a.dopo, a.n), pb = perc(b.dopo, b.n);
        scelta[k] = Math.abs(pa - pb) >= 4 && Math.min(a.n, b.n) >= 10 ? (pa > pb ? cervelli[0] : cervelli[1]) : null;
      }
      return `<tr><td>${MATERIE[k].emoji} ${escape(MATERIE[k].nome)}</td>${celle}${cervelli.length > 1 ? `<td>${scelta[k] ? "✍️ " + escape(scelta[k]) : "<small>uguali</small>"}</td>` : ""}</tr>`;
    }).join("");
    const pTot = perc(totOk, totN);
    const sotto = materie.filter(k => { const s = conti[k][cervelli[0]]; return s && perc(s.dopo, s.n) < OBIETTIVO; });
    el("prRisultato").innerHTML = `
      ${fine ? `<div class="pr-totale ${pTot >= OBIETTIVO ? "pr-si" : "pr-no"}">${completa ? "" : "⏹️ Fermata · "}In tutto: <b>${pTot}%</b> giuste (${totOk} su ${totN})${cervelli.length > 1 ? ` con ${escape(cervelli[0])}` : ""} · obiettivo ${OBIETTIVO}%</div>` : ""}
      <table class="cv-tab pr-tab"><thead><tr><th>Materia</th>${cervelli.map(c => `<th colspan="2">${escape(c)}</th>`).join("")}${cervelli.length > 1 ? "<th>Chi scrive meglio</th>" : ""}</tr></thead><tbody>${righeHtml}</tbody></table>
      ${fine && sotto.length ? `<p class="sotto">Sotto il ${OBIETTIVO}%: <b>${sotto.map(k => escape(MATERIE[k].nome)).join(", ")}</b>. Nel file dei risultati ci sono le domande sbagliate, una per una: servono per migliorare quelle materie.</p>` : ""}
      ${fine ? `<div class="riga-btn"><button class="btn sec" id="prCsv">⬇️ Scarica i risultati (Excel)</button>${cervelli.length > 1 && Object.values(scelta).some(Boolean) ? `<button class="btn" id="prUsa">✍️ Per ogni materia fai scrivere il cervello migliore</button>` : ""}</div>` : ""}`;
    if (fine) {
      el("prCsv").onclick = () => scaricaCsv("precisione-fly-aula.csv", ["Materia", "Cervello", "Domanda", "Risposta giusta", "Risposta data", "Prima dei controlli", "Sulla lavagna", "Dubbio", "Secondi"], righe);
      if (el("prUsa")) el("prUsa").onclick = async () => {
        const p = { ...preferiti() };
        for (const [k, c] of Object.entries(scelta)) { if (c) p[k] = c; else delete p[k]; }
        await salvaPreferiti(p);
        el("prUsa").textContent = "✓ Fatto: ogni materia ha il suo cervello"; el("prUsa").disabled = true;
      };
    }
  }
  function mostra(inCorso) {
    el("prVia").style.display = inCorso ? "none" : ""; el("prStop").style.display = inCorso ? "" : "none";
    if (!inCorso) el("prStato").textContent = "";
  }
  function stima() {
    const n = +el("prN").value, solo = el("prMateria").value, m = solo ? 1 : Object.keys(MATERIE).length;
    const doppia = el("prConfronta").checked && typeof secondo !== "undefined" && !!secondo ? 2 : 1;
    const q = n * m * doppia;
    el("prQuante").textContent = `${q} risposte · circa ${q * 25 / 3600 < 1 ? Math.round(q * 25 / 60) + " min" : Math.round(q * 25 / 360) / 10 + " ore"} (da lanciare la sera)`;
    el("prConfrontaBox").style.display = typeof secondo !== "undefined" && secondo ? "" : "none";
  }
  function collega() {
    if (!el("prVia")) return;
    el("prMateria").innerHTML = `<option value="">Tutte le materie</option>` + Object.entries(MATERIE).map(([k, m]) => `<option value="${k}">${m.emoji} ${escape(m.nome)}</option>`).join("");
    el("prVia").onclick = via;
    el("prStop").onclick = () => { attiva = false; };
    ["prN", "prMateria", "prConfronta"].forEach(i => el(i).onchange = stima);
    stima(); setInterval(() => { if (!attiva) stima(); }, 5000);
    if (el("apriEsame")) el("apriEsame").addEventListener("click", () => setTimeout(stima, 0));   // all'apertura del pannello: i cervelli di adesso
    // l'ultima prova fatta, se c'è
    try { const u = JSON.parse(localStorage.getItem("flyaula_precisione") || "null"); if (u && u.conti) { disegna(u.conti, u.cervelli, false); el("prRisultato").insertAdjacentHTML("afterbegin", `<p class="sotto">Ultima prova: ${new Date(u.quando).toLocaleString("it-IT")}</p>`); } } catch (e) {}
  }
  return { collega, preferiti, autorePer, domandePer, giusta, rispostaDi, get attiva() { return attiva; } };
})();
Precisione.collega();
