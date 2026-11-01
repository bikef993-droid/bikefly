// ===================================================================
//  FLY AULA · 🧰 STRUMENTI DEL PROF
//  📚 Lezione pronta in 5 minuti · 📑 UDA (bozza) · ✍️ Aiuto a correggere una risposta aperta
//  Tutto è una BOZZA: la prepara Fly Aula, la decide il prof. I conti degli esercizi li controlla
//  la calcolatrice (3 controlli), il quiz arriva dalle liste con le risposte sicure, date e nomi
//  passano dai fatti sicuri. Il voto lo decide SEMPRE il prof.
// ===================================================================
const Strumenti = (() => {
  const el = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const VISIONE = /qwen2\.5vl|qwen2\.5-vl|qwen3-vl|llava|llama3\.2-vision|gemma3:(4|12|27)b|minicpm-v|granite3\.2-vision/;
  // le 8 competenze chiave europee (Raccomandazione del Consiglio UE del 22 maggio 2018): elenco fisso, il cervello sceglie solo i numeri
  const COMPETENZE_CHIAVE = ["Competenza alfabetica funzionale", "Competenza multilinguistica", "Competenza matematica e competenza in scienze, tecnologie e ingegneria", "Competenza digitale",
    "Competenza personale, sociale e capacità di imparare a imparare", "Competenza in materia di cittadinanza", "Competenza imprenditoriale", "Competenza in materia di consapevolezza ed espressione culturali"];
  let lavoro = null, fermo = false, scheda = "lezione";

  // ---------- il pannello ----------
  function pannello() {
    let p = el("pStrumenti");
    if (!p) { p = document.createElement("div"); p.className = "pannello"; p.id = "pStrumenti"; p.innerHTML = `<div class="box"><h2>🧰 Strumenti del prof</h2>
      <div class="st-schede"><button data-s="lezione">📚 Lezione pronta</button><button data-s="uda">📑 UDA</button><button data-s="correggi">✍️ Aiuto a correggere</button></div>
      <div id="stCorpo"></div><div class="riga-btn"><button class="btn sec" id="stChiudi">Chiudi</button></div></div>`; document.body.appendChild(p);
      p.querySelectorAll("[data-s]").forEach(b => b.onclick = () => { if (lavoro && lavoro.inCorso) return; scheda = b.dataset.s; lavoro = null; disegna(); });
      el("stChiudi").onclick = chiudi;
    }
    return p;
  }
  function apri(s = "lezione") { scheda = s; pannello().style.display = "block"; disegna(); }
  function chiudi() { fermo = true; if (el("pStrumenti")) el("pStrumenti").style.display = "none"; }
  function disegna() {
    pannello().querySelectorAll("[data-s]").forEach(b => b.classList.toggle("on", b.dataset.s === scheda));
    if (scheda === "lezione") formLezione(); else if (scheda === "uda") formUda(); else formCorreggi();
  }
  const materiaOra = () => el("materia").value, livelloOra = () => el("livello").value, classeOra = () => el("classe").value;
  const json = t => { const s = String(t || ""); return JSON.parse(s.slice(s.indexOf("{"), s.lastIndexOf("}") + 1)); };
  const lista = x => (Array.isArray(x) ? x : x ? [x] : []).map(v => String(typeof v === "object" ? Object.values(v).join(": ") : v).trim()).filter(Boolean);
  // ogni pezzo di testo: fatti sicuri (date, nomi) e niente di non adatto alla scuola
  const pulito = (t, m) => { let s = String(t || "").trim(); try { s = Fatti.correggi(s, m).testo; } catch (e) {} return controllaRisposta(s, m) ? s : ""; };
  const stato = (t, cl = "") => { const s = el("stStato"); if (s) { s.className = "nota-s st-stato " + cl; s.textContent = t; } };
  async function salva(foglio) {
    if (!Prof.sessione) { if (!(Prof.conProfili && await Prof.entra("Salva nel tuo archivio"))) { stato("💾 Per salvarlo nel tuo archivio entra con il tuo PIN personale (lo dà il tecnico).", "ko"); return; } }
    const id = await Prof.salvaFoglio(foglio, lavoro && lavoro.id);
    if (id && lavoro) lavoro.id = id;
    stato(id ? `💾 Salvato nell'archivio di ${Prof.sessione.nome}.` : "⚠️ Non sono riuscito a salvarlo: stampalo o salvalo come PDF.", id ? "ok" : "ko");
  }

  // =================== 📚 LEZIONE PRONTA ===================
  function formLezione() {
    const m = materiaOra(), anno = annoDellaClasse(classeOra()), arg = argomentiDi(m, livelloOra(), anno);
    el("stCorpo").innerHTML = `<p class="sotto">Scrivi l'argomento: Fly Aula prepara la scaletta con i tempi, una spiegazione breve, 3 esercizi controllati e un mini-quiz con le risposte sicure. È una bozza: la rileggi e la cambi come vuoi.</p>
      <div class="prof-griglia"><section><h3>🎯 Argomento</h3><input id="stArg" list="stLista" maxlength="120" placeholder="es. le frazioni equivalenti" value="${esc(Prof.argomento || "")}"><datalist id="stLista">${arg.map(a => `<option value="${esc(a)}">`).join("")}</datalist>
        <p class="nota-s">${esc(MATERIE[m].nome)} · ${esc(livelloOra())} · ${esc(classeOra())}</p></section>
        <section><h3>⏱️ Durata</h3><select class="pill" id="stDurata"><option value="50">50 minuti</option><option value="60" selected>1 ora</option><option value="100">2 ore</option></select></section></div>
      <div class="riga-btn"><button class="btn" id="stVia">🪄 Prepara la lezione</button></div><div id="stStato" class="nota-s st-stato"></div><div id="stFoglio"></div>`;
    el("stVia").onclick = preparaLezione;
  }
  async function preparaLezione() {
    if (!modello) return mostraAiuto();
    const argomento = el("stArg").value.trim(); if (!argomento) return el("stArg").focus();
    const m = materiaOra(), livello = livelloOra(), classe = classeOra(), durata = +el("stDurata").value;
    fermo = false; el("stVia").disabled = true;
    lavoro = { inCorso: true, id: null, foglio: { tipo: "lezione", titolo: `Lezione: ${argomento}`.slice(0, 80), materia: m, livello, classe, argomento, durata, data: new Date().toISOString(), aula: (typeof Scuola !== "undefined" && Scuola.aula) || "" } };
    try {
      stato("📝 Preparo la scaletta e la spiegazione…");
      let j = {};
      for (let t = 0; t < 3 && !j.fasi; t++) {
        try {
          j = json(await cervello(`Sei un docente esperto di ${MATERIE[m].nome} (scuola ${livello}, classe ${classe}). Prepari la scaletta di una lezione di ${durata} minuti in italiano semplice.${istruzioniProgramma(m, livello, classe)}${Fatti.perDomanda(argomento)}
Rispondi SOLO con JSON: {"obiettivi": ["2-3 obiettivi brevi"], "fasi": [{"minuti": numero, "titolo": "…", "cosa": "cosa fanno prof e classe, 1-2 frasi"}], "spiegazione": "spiegazione dell'argomento in 6-10 frasi chiare", "domande_stimolo": ["2-3 domande per far ragionare la classe"], "compito": "un compito per casa breve"}
Le fasi sono 4-6: apertura, spiegazione, esercizi, verifica veloce, chiusura.`, `Argomento: ${argomento}`, { temperature: 0.4, format: "json" }));
          if (!Array.isArray(j.fasi) || !j.fasi.length) j = {};
        } catch (e) { j = {}; }
      }
      if (!j.fasi) throw new Error("scaletta");
      // ⏱️ i minuti li sistema la calcolatrice: la somma deve fare esattamente la durata
      const fasi = j.fasi.slice(0, 7).map(f => ({ minuti: Math.max(1, Number(f.minuti) || 5), titolo: pulito(f.titolo, m) || "Fase", cosa: pulito(f.cosa, m) }));
      const somma = fasi.reduce((a, f) => a + f.minuti, 0);
      let resto = durata; fasi.forEach((f, i) => { f.minuti = i === fasi.length - 1 ? Math.max(1, resto) : Math.max(1, Math.round(f.minuti * durata / somma)); resto -= f.minuti; });
      Object.assign(lavoro.foglio, { obiettivi: lista(j.obiettivi).slice(0, 4).map(x => pulito(x, m)).filter(Boolean), fasi, spiegazione: pulito(j.spiegazione, m), domande: lista(j.domande_stimolo).slice(0, 4).map(x => pulito(x, m)).filter(Boolean), compito: pulito(j.compito, m), esercizi: [], quiz: [] });
      mostraLezione();
      // ✏️ 3 esercizi, ognuno controllato 3 volte come nelle verifiche
      for (let i = 0; i < 3 && !fermo; i++) {
        stato(`✏️ Esercizio ${i + 1} di 3: lo scrivo e lo controllo 3 volte…`);
        lavoro.foglio.esercizi.push(await creaEsercizio(cervello, MATERIE[m].nome, livello, argomento, { evita: lavoro.foglio.esercizi.map(e => e.testo), chiave: m }));
        mostraLezione();
      }
      // ❓ il mini-quiz: dalle liste con la risposta sicura
      lavoro.foglio.quiz = (typeof Precisione !== "undefined" ? Precisione.domandePer(m, 5) : []).map(q => ({ d: q.testo, r: q.mostra }));
      lavoro.inCorso = false; mostraLezione();
      conta("lezioniPronte");
      stato(fermo ? "⏹️ Fermata." : "✓ Pronta! È una bozza: rileggila prima di usarla.", "ok");
    } catch (e) { lavoro.inCorso = false; stato("⚠️ Il cervello non ha risposto bene: riprova tra un attimo.", "ko"); }
    el("stVia") && (el("stVia").disabled = false);
  }
  function htmlLezione(f, stampa = false) {
    return `<div class="st-doc"><h2 class="st-tit">${esc(f.titolo)}</h2><p class="st-info">${esc(MATERIE[f.materia]?.nome || f.materia)} · ${esc(f.classe)} · ${f.durata} minuti</p>
      ${f.obiettivi && f.obiettivi.length ? `<h3>🎯 Obiettivi</h3><ul>${f.obiettivi.map(o => `<li>${esc(o)}</li>`).join("")}</ul>` : ""}
      <h3>⏱️ Scaletta</h3><table class="st-tab"><tbody>${(f.fasi || []).map(x => `<tr><td class="st-min">${x.minuti} min</td><td><b>${esc(x.titolo)}</b>${x.cosa ? `<br>${esc(x.cosa)}` : ""}</td></tr>`).join("")}</tbody></table>
      ${f.spiegazione ? `<h3>📖 La spiegazione in breve</h3><p>${esc(f.spiegazione)}</p>` : ""}
      ${f.domande && f.domande.length ? `<h3>💭 Domande per far ragionare</h3><ul>${f.domande.map(o => `<li>${esc(o)}</li>`).join("")}</ul>` : ""}
      ${f.esercizi && f.esercizi.length ? `<h3>✏️ Esercizi</h3><ol>${f.esercizi.map(e => `<li>${esc(e.testo)}${stampa ? "" : ` <span class="st-sol">→ ${esc(soluzioneDi(e))} ${e.riserva ? "✓ calcolato da Fly Aula" : "✓✓✓"}</span>`}</li>`).join("")}</ol>` : ""}
      ${f.quiz && f.quiz.length ? `<h3>❓ Mini-quiz finale</h3><ol>${f.quiz.map(q => `<li>${esc(q.d)}${stampa ? "" : ` <span class="st-sol">→ ${esc(q.r)}</span>`}</li>`).join("")}</ol>` : ""}
      ${f.compito ? `<h3>🏠 Per casa</h3><p>${esc(f.compito)}</p>` : ""}
      ${stampa && (f.esercizi?.length || f.quiz?.length) ? `<h3>Soluzioni (per il prof)</h3><p>${(f.esercizi || []).map((e, i) => `Es. ${i + 1}: ${esc(soluzioneDi(e))}`).join(" · ")}${f.quiz?.length ? "<br>" + f.quiz.map((q, i) => `Quiz ${i + 1}: ${esc(q.r)}`).join(" · ") : ""}</p>` : ""}
      <p class="st-nota">Bozza preparata da Fly Aula e decisa dal prof.</p></div>`;
  }
  function mostraLezione() {
    const f = lavoro.foglio;
    el("stFoglio").innerHTML = htmlLezione(f) + (lavoro.inCorso ? "" : `<div class="riga-btn"><button class="btn" id="stStampa">🖨️ Stampa</button><button class="btn sec" id="stSalva">💾 Nel mio archivio</button></div>`);
    if (el("stStampa")) el("stStampa").onclick = () => stampa(f.titolo, htmlLezione(f, true));
    if (el("stSalva")) el("stSalva").onclick = () => salva(f);
  }

  // =================== 📑 UDA ===================
  function formUda() {
    el("stCorpo").innerHTML = `<p class="sotto">L'Unità di Apprendimento in bozza: competenze, compito di realtà, fasi con le ore, valutazione con i livelli. Le competenze chiave sono quelle europee del 2018 (elenco fisso: Fly Aula sceglie solo quali). La rileggi e la completi tu.</p>
      <div class="prof-griglia"><section><h3>🎯 Tema</h3><input id="stTema" maxlength="120" placeholder="es. Organizzare una gita di classe" value="${esc(Prof.argomento || "")}"><p class="nota-s">Classe ${esc(classeOra())} · ${esc(livelloOra())}</p></section>
        <section><h3>⏱️ Ore e periodo</h3><div class="riga-btn" style="margin:0"><select class="pill" id="stOre"><option>6</option><option>10</option><option selected>15</option><option>20</option><option>30</option></select><input id="stPeriodo" maxlength="40" placeholder="es. novembre - dicembre" style="flex:1"></div></section>
        <section><h3>📚 Materie coinvolte</h3><div class="st-materie">${Object.keys(MATERIE).map(k => `<label><input type="checkbox" value="${k}" ${k === materiaOra() ? "checked" : ""}> ${esc(MATERIE[k].nome)}</label>`).join("")}</div></section></div>
      <div class="riga-btn"><button class="btn" id="stVia">🪄 Prepara la bozza</button></div><div id="stStato" class="nota-s st-stato"></div><div id="stFoglio"></div>`;
    el("stVia").onclick = preparaUda;
  }
  async function preparaUda() {
    if (!modello) return mostraAiuto();
    const tema = el("stTema").value.trim(); if (!tema) return el("stTema").focus();
    const materie = [...document.querySelectorAll(".st-materie input:checked")].map(i => i.value);
    if (!materie.length) return stato("Scegli almeno una materia.", "ko");
    const ore = +el("stOre").value, periodo = el("stPeriodo").value.trim(), classe = classeOra(), livello = livelloOra(), m = materie[0];
    el("stVia").disabled = true; lavoro = { inCorso: true, id: null };
    stato("📝 Preparo la bozza dell'UDA…");
    let j = {};
    for (let t = 0; t < 3 && !j.fasi; t++) {
      try {
        j = json(await cervello(`Sei un docente esperto di progettazione didattica in Italia. Prepari la BOZZA di un'Unità di Apprendimento (UDA) per la classe ${classe} (scuola ${livello}), materie: ${materie.map(k => MATERIE[k].nome).join(", ")}, ${ore} ore in tutto.
Competenze chiave europee (scegli i NUMERI, 2-4): ${COMPETENZE_CHIAVE.map((c, i) => `${i + 1}) ${c}`).join("; ")}.
Rispondi SOLO con JSON: {"titolo": "…", "prodotto": "il compito di realtà / prodotto finale", "competenze_chiave": [numeri], "competenze": ["…"], "abilita": ["…"], "conoscenze": ["…"], "fasi": [{"fase": "…", "attivita": "…", "ore": numero, "materie": ["…"]}], "metodologie": ["…"], "strumenti": ["…"], "criteri": [{"criterio": "…", "iniziale": "…", "base": "…", "intermedio": "…", "avanzato": "…"}]}
Fasi 4-6. Criteri di valutazione 3-4, con i 4 livelli descritti in una frase. Italiano semplice e concreto.`, `Tema: ${tema}`, { temperature: 0.4, format: "json" }));
        if (!Array.isArray(j.fasi) || !j.fasi.length) j = {};
      } catch (e) { j = {}; }
    }
    el("stVia").disabled = false;
    if (!j.fasi) { lavoro.inCorso = false; return stato("⚠️ Il cervello non ha risposto bene: riprova tra un attimo.", "ko"); }
    const fasi = j.fasi.slice(0, 8).map(f => ({ fase: pulito(f.fase, m) || "Fase", attivita: pulito(f.attivita, m), ore: Math.max(1, Number(f.ore) || 1), materie: lista(f.materie).slice(0, 5).map(x => pulito(x, m)).filter(Boolean) }));
    const somma = fasi.reduce((a, f) => a + f.ore, 0); let resto = ore;
    fasi.forEach((f, i) => { f.ore = i === fasi.length - 1 ? Math.max(1, resto) : Math.max(1, Math.round(f.ore * ore / somma)); resto -= f.ore; });   // la somma fa esattamente le ore scelte
    const scelte = [...new Set((Array.isArray(j.competenze_chiave) ? j.competenze_chiave : []).map(Number).filter(n => n >= 1 && n <= 8))].slice(0, 4);
    lavoro.foglio = { tipo: "uda", titolo: (pulito(j.titolo, m) || tema).slice(0, 80), tema, classe, livello, materia: m, materie, ore, periodo, data: new Date().toISOString(),
      prodotto: pulito(j.prodotto, m), chiave: (scelte.length ? scelte : [1, 5]).map(n => COMPETENZE_CHIAVE[n - 1]),
      competenze: lista(j.competenze).slice(0, 6).map(x => pulito(x, m)).filter(Boolean), abilita: lista(j.abilita).slice(0, 6).map(x => pulito(x, m)).filter(Boolean), conoscenze: lista(j.conoscenze).slice(0, 6).map(x => pulito(x, m)).filter(Boolean),
      fasi, metodologie: lista(j.metodologie).slice(0, 6).map(x => pulito(x, m)).filter(Boolean), strumenti: lista(j.strumenti).slice(0, 6).map(x => pulito(x, m)).filter(Boolean),
      criteri: (Array.isArray(j.criteri) ? j.criteri : []).slice(0, 5).map(c => ({ criterio: pulito(c.criterio, m) || "Criterio", livelli: ["iniziale", "base", "intermedio", "avanzato"].map(l => pulito(c[l], m)) })) };
    lavoro.inCorso = false; conta("uda"); mostraUda();
    stato("✓ Bozza pronta: completala e controllala prima di consegnarla.", "ok");
  }
  function htmlUda(f) {
    const ul = l => l && l.length ? `<ul>${l.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : "<p>—</p>";
    return `<div class="st-doc"><h2 class="st-tit">UDA · ${esc(f.titolo)}</h2>
      <table class="st-tab st-uda"><tbody>
        <tr><td>Destinatari</td><td>Classe ${esc(f.classe)} (${esc(f.livello)})</td></tr>
        <tr><td>Materie</td><td>${esc((f.materie || []).map(k => MATERIE[k]?.nome || k).join(", "))}</td></tr>
        <tr><td>Tempi</td><td>${f.ore} ore${f.periodo ? " · " + esc(f.periodo) : ""}</td></tr>
        <tr><td>Compito di realtà / prodotto</td><td>${esc(f.prodotto || "—")}</td></tr>
        <tr><td>Competenze chiave europee</td><td>${ul(f.chiave)}</td></tr>
        <tr><td>Competenze</td><td>${ul(f.competenze)}</td></tr><tr><td>Abilità</td><td>${ul(f.abilita)}</td></tr><tr><td>Conoscenze</td><td>${ul(f.conoscenze)}</td></tr>
        <tr><td>Metodologie</td><td>${ul(f.metodologie)}</td></tr><tr><td>Strumenti</td><td>${ul(f.strumenti)}</td></tr>
      </tbody></table>
      <h3>🗓️ Fasi</h3><table class="st-tab"><thead><tr><th>Fase</th><th>Attività</th><th>Ore</th><th>Materie</th></tr></thead><tbody>${(f.fasi || []).map(x => `<tr><td><b>${esc(x.fase)}</b></td><td>${esc(x.attivita)}</td><td>${x.ore}</td><td>${esc((x.materie || []).join(", "))}</td></tr>`).join("")}</tbody></table>
      ${f.criteri && f.criteri.length ? `<h3>📊 Valutazione (rubrica)</h3><table class="st-tab"><thead><tr><th>Criterio</th><th>Iniziale</th><th>Base</th><th>Intermedio</th><th>Avanzato</th></tr></thead><tbody>${f.criteri.map(c => `<tr><td><b>${esc(c.criterio)}</b></td>${c.livelli.map(l => `<td>${esc(l)}</td>`).join("")}</tr>`).join("")}</tbody></table>` : ""}
      <p class="st-nota">Bozza preparata da Fly Aula: va completata e decisa dal consiglio di classe.</p></div>`;
  }
  function mostraUda() {
    const f = lavoro.foglio;
    el("stFoglio").innerHTML = htmlUda(f) + `<div class="riga-btn"><button class="btn" id="stStampa">🖨️ Stampa</button><button class="btn sec" id="stSalva">💾 Nel mio archivio</button></div>`;
    el("stStampa").onclick = () => stampa(f.titolo, htmlUda(f));
    el("stSalva").onclick = () => salva(f);
  }

  // =================== ✍️ AIUTO A CORREGGERE ===================
  const GRIGLIA = [["Correttezza dei contenuti", 4], ["Completezza", 3], ["Uso del linguaggio specifico", 2], ["Ordine e chiarezza", 1]];
  function formCorreggi() {
    const vede = typeof cervelloCheVede === "function" ? cervelloCheVede() : (window.modelliPresenti || []).find(m => VISIONE.test(m));
    el("stCorpo").innerHTML = `<p class="sotto">Per le risposte aperte: Fly Aula legge la risposta (dalla foto o scritta qui), la confronta con la tua griglia e <b>propone</b> i punti, criterio per criterio, spiegando perché. <b>Il voto lo decidi tu.</b> Niente nomi: la foto e il testo non vengono salvati.</p>
      <div class="prof-griglia"><section><h3>❓ La domanda della verifica</h3><textarea id="stTraccia" rows="3" maxlength="600" placeholder="es. Spiega le cause della Prima guerra mondiale"></textarea></section>
        <section><h3>📊 La griglia</h3><div id="stGriglia">${GRIGLIA.map(([c, p]) => rigaGriglia(c, p)).join("")}</div><button class="btn sec st-piccolo" id="stRiga">➕ Criterio</button></section></div>
      <section class="st-risp"><h3>📝 La risposta dell'alunno</h3>
        <div class="riga-btn" style="margin:0 0 8px"><label class="btn sec st-piccolo">📷 Da una foto<input type="file" id="stFoto" accept="image/*" capture="environment" hidden></label><span class="nota-s">${vede ? "La legge " + esc(vede) + " (si toglie subito dalla scheda video)." : "Per leggere le foto serve un cervello che vede (es. qwen3-vl:8b): intanto puoi scrivere o incollare la risposta."}</span></div>
        <textarea id="stRisposta" rows="7" maxlength="4000" placeholder="La risposta dell'alunno (letta dalla foto o scritta qui)"></textarea></section>
      <div class="riga-btn"><button class="btn" id="stVia">⚖️ Proponi i punti</button></div><div id="stStato" class="nota-s st-stato"></div><div id="stFoglio"></div>`;
    el("stRiga").onclick = () => el("stGriglia").insertAdjacentHTML("beforeend", rigaGriglia("", 1));
    el("stGriglia").onclick = e => { if (e.target.classList.contains("st-via")) e.target.parentElement.remove(); };
    el("stFoto").onchange = () => leggiFoto(el("stFoto").files[0], vede);
    el("stVia").onclick = proponi;
  }
  const rigaGriglia = (c, p) => `<div class="st-riga"><input class="st-c" maxlength="60" value="${esc(c)}" placeholder="Criterio"><input class="st-p" type="number" min="0.5" max="20" step="0.5" value="${p}"><button class="st-via" title="Togli">✕</button></div>`;
  async function leggiFoto(file, vede) {
    if (!file) return;
    if (!vede) return stato("Per leggere le foto serve un cervello che vede (consigliato: qwen3-vl:8b). Scrivi la risposta nella casella.", "ko");
    if (file.size > 12e6) return stato("La foto è troppo grande (massimo 12 MB).", "ko");
    try {
      const b64 = await new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(",")[1]); r.onerror = no; r.readAsDataURL(file); });
      const t = (await usaCervelloCheVede(async m => {
        stato("📷 Leggo la foto…");
        const r = await Scuola.chiama("/api/chat", { method: "POST", body: JSON.stringify({ model: m, stream: false, keep_alive: 0, options: { temperature: 0, num_ctx: 8192 },
          messages: [{ role: "user", content: "Trascrivi ESATTAMENTE il testo scritto a mano in questa foto (è la risposta di uno studente). NON correggere gli errori, NON aggiungere niente, NON commentare. Se c'è un nome o un cognome, NON scriverlo.", images: [b64] }] }) });
        return String(((await r.json()).message || {}).content || "").trim();
      }, x => stato(x))) || "";
      el("stRisposta").value = t; el("stFoto").value = "";
      stato(t ? "✓ Letta: controlla il testo e correggi se ho letto male." : "Non sono riuscito a leggerla: scrivi la risposta nella casella.", t ? "ok" : "ko");
    } catch (e) { stato("Non sono riuscito a leggerla: scrivi la risposta nella casella.", "ko"); }
  }
  function griglia() { return [...document.querySelectorAll("#stGriglia .st-riga")].map(r => ({ criterio: r.querySelector(".st-c").value.trim(), max: Math.max(0.5, Math.min(20, Number(r.querySelector(".st-p").value) || 1)) })).filter(c => c.criterio); }
  // un cervello valuta: punti per criterio, MAI oltre il massimo (lo controlla Fly Aula)
  async function valuta(fn, traccia, risposta, g, m) {
    const j = json(await fn(`Sei un docente di ${MATERIE[m].nome} che corregge con equità. Valuta la risposta di uno studente con questa griglia (punti massimi tra parentesi): ${g.map(c => `${c.criterio} (${c.max})`).join("; ")}.${Fatti.perDomanda(traccia + " " + risposta)}
Sii giusto: premia quello che c'è di corretto, togli punti solo per errori o mancanze vere. Rispondi SOLO con JSON: {"criteri": [{"criterio": "…", "punti": numero, "perche": "una frase"}], "punti_forti": ["…"], "da_migliorare": ["…"]}`,
      `DOMANDA: ${traccia}\nRISPOSTA DELLO STUDENTE: ${risposta}`, { temperature: 0.1, format: "json" }));
    const per = g.map((c, i) => { const x = (j.criteri || []).find(y => String(y.criterio || "").toLowerCase().trim() === c.criterio.toLowerCase()) || (j.criteri || [])[i] || {};
      const p = Math.round(2 * Math.max(0, Math.min(c.max, Number(x.punti) || 0))) / 2; return { ...c, punti: p, perche: pulito(x.perche, m) }; });
    return { per, forti: lista(j.punti_forti).slice(0, 3).map(x => pulito(x, m)).filter(Boolean), migliorare: lista(j.da_migliorare).slice(0, 3).map(x => pulito(x, m)).filter(Boolean) };
  }
  async function proponi() {
    if (!modello) return mostraAiuto();
    const traccia = el("stTraccia").value.trim(), risposta = el("stRisposta").value.trim(), g = griglia(), m = materiaOra();
    if (!traccia) return el("stTraccia").focus();
    if (!risposta) return el("stRisposta").focus();
    if (!g.length) return stato("La griglia è vuota.", "ko");
    el("stVia").disabled = true; stato("⚖️ Leggo la risposta con la griglia…");
    try {
      const a = await valuta(cervello, traccia, risposta, g, m);
      // 🤝 se c'è il secondo cervello, valuta anche lui: se non sono d'accordo, lo dice
      let b = null;
      if (typeof secondo !== "undefined" && secondo && secondo !== modello) { stato("🤝 Lo fa valutare anche al secondo cervello…"); try { b = await valuta(cervelloDi(secondo), traccia, risposta, g, m); } catch (e) { b = null; } }
      const max = g.reduce((s, c) => s + c.max, 0), totA = a.per.reduce((s, c) => s + c.punti, 0), totB = b ? b.per.reduce((s, c) => s + c.punti, 0) : null;
      const disaccordo = b && Math.abs(totA - totB) > 0.2 * max;
      if (b) a.per.forEach((c, i) => { c.altro = b.per[i].punti; c.punti = Math.round(2 * (c.punti + b.per[i].punti) / 2) / 2; });   // la media dei due
      lavoro = { inCorso: false, max, a, disaccordo, totB };
      conta("correzioni");
      mostraCorrezione(); stato(disaccordo ? "⚠️ I due cervelli non sono d'accordo: guarda bene e decidi tu." : "✓ Proposta pronta. Il voto lo decidi tu: puoi cambiare ogni punteggio.", disaccordo ? "ko" : "ok");
    } catch (e) { stato("⚠️ Il cervello non ha risposto bene: riprova tra un attimo.", "ko"); }
    el("stVia").disabled = false;
  }
  function mostraCorrezione() {
    const { a, max, disaccordo } = lavoro;
    el("stFoglio").innerHTML = `<div class="st-doc"><h3>⚖️ Proposta di punteggio</h3>${disaccordo ? `<p class="st-avviso">⚠️ I due cervelli hanno dato punteggi molto diversi: qui c'è la media, ma <b>decidi tu</b>.</p>` : ""}
      <table class="st-tab" id="stTabCorr"><thead><tr><th>Criterio</th><th>Punti</th><th>Perché</th></tr></thead><tbody>${a.per.map((c, i) => `<tr><td><b>${esc(c.criterio)}</b></td><td class="st-punti"><input type="number" data-i="${i}" min="0" max="${c.max}" step="0.5" value="${c.punti}"> / ${c.max}${c.altro !== undefined ? `<div class="nota-s">2° cervello: ${c.altro}</div>` : ""}</td><td>${esc(c.perche || "")}</td></tr>`).join("")}</tbody>
      <tfoot><tr><td><b>Totale</b></td><td class="st-punti"><b id="stTot"></b></td><td class="nota-s">La somma la fa la calcolatrice: cambia i punti e si aggiorna.</td></tr></tfoot></table>
      ${a.forti.length ? `<h3>👍 Punti forti</h3><ul>${a.forti.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}${a.migliorare.length ? `<h3>📈 Da migliorare</h3><ul>${a.migliorare.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      <p class="st-nota">Proposta di Fly Aula. Il voto lo decide il prof.</p></div>
      <div class="riga-btn"><button class="btn sec" id="stStampa">🖨️ Stampa il giudizio</button></div>`;
    const totale = () => { const t = [...document.querySelectorAll("#stTabCorr input")].reduce((s, x) => s + Math.max(0, Math.min(Number(x.max), Number(x.value) || 0)), 0); el("stTot").textContent = `${formatta(t)} / ${formatta(max)}`; return t; };
    document.querySelectorAll("#stTabCorr input").forEach(x => x.oninput = totale); totale();
    el("stStampa").onclick = () => stampa("Giudizio", `<h1>Giudizio</h1><p><b>Domanda:</b> ${esc(el("stTraccia").value)}</p><table style="width:100%;border-collapse:collapse">${a.per.map((c, i) => `<tr><td style="border:1px solid #999;padding:6px">${esc(c.criterio)}</td><td style="border:1px solid #999;padding:6px;white-space:nowrap">${esc(document.querySelector(`#stTabCorr input[data-i="${i}"]`).value)} / ${c.max}</td><td style="border:1px solid #999;padding:6px">${esc(c.perche || "")}</td></tr>`).join("")}<tr><td style="border:1px solid #999;padding:6px"><b>Totale</b></td><td style="border:1px solid #999;padding:6px"><b>${esc(el("stTot").textContent)}</b></td><td></td></tr></table>${a.forti.length ? `<p><b>Punti forti:</b> ${a.forti.map(esc).join("; ")}</p>` : ""}${a.migliorare.length ? `<p><b>Da migliorare:</b> ${a.migliorare.map(esc).join("; ")}</p>` : ""}`);
  }

  // dall'archivio: si riapre una lezione o un'UDA salvata
  function mostra(f, id) {
    scheda = f.tipo === "uda" ? "uda" : "lezione"; pannello().style.display = "block"; disegna();
    lavoro = { inCorso: false, id, foglio: f };
    if (f.tipo === "uda") mostraUda(); else mostraLezione();
    stato("📂 Aperta dal tuo archivio.", "ok");
  }
  return { apri, chiudi, mostra, COMPETENZE_CHIAVE, get lavoro() { return lavoro; } };
})();
