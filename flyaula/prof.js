// ===================================================================
//  FLY AULA · il pannello del prof (con PIN), la modalità verifica
//  e il tema per la LIM.  Il controllo resta SEMPRE al prof.
// ===================================================================
const Prof = (() => {
  const CHIAVE = "flyaula_prof";
  const base = { pin: null, argomento: "", modo: "normale", bloccate: "", tema: "scuro", zoom: 100 };
  let imp = { ...base };
  try { imp = { ...base, ...JSON.parse(localStorage.getItem(CHIAVE) || "{}") }; } catch (e) {}
  const salva = () => { try { localStorage.setItem(CHIAVE, JSON.stringify(imp)); } catch (e) {} };
  const el = id => document.getElementById(id);

  async function hash(pin) {
    const t = "flyaula-pin:" + pin;
    try {
      const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
      return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, "0")).join("");
    } catch (e) { let h = 7; for (const c of t) h = (h * 31 + c.charCodeAt(0)) >>> 0; return "h" + h; }
  }

  // ---------- finestra del PIN ----------
  function chiediPin(titolo, { nuovo = false } = {}) {
    return new Promise(fatto => {
      const box = el("pin");
      box.innerHTML = `<div class="box">
        <h2>🔒 ${titolo}</h2>
        <p>${nuovo ? "Scegli un PIN di 4-6 cifre. Lo sa solo il prof: serve per il pannello e per sbloccare la verifica." : "Inserisci il PIN del prof."}</p>
        <input type="password" inputmode="numeric" maxlength="6" autocomplete="off" class="pin-in">
        ${nuovo ? `<input type="password" inputmode="numeric" maxlength="6" autocomplete="off" class="pin-in" placeholder="Ripeti il PIN">` : ""}
        <div class="pin-err"></div>
        <div class="riga-btn"><button class="btn ok">OK</button><button class="btn sec no">Annulla</button></div>
        ${nuovo ? "" : `<p class="nota" style="text-align:left">PIN dimenticato? Il tecnico della scuola può azzerarlo cancellando i dati di Fly Aula su questo computer.</p>`}
      </div>`;
      box.style.display = "flex";
      const [a, b] = box.querySelectorAll(".pin-in"), err = box.querySelector(".pin-err");
      a.focus();
      const chiudi = v => { box.style.display = "none"; box.innerHTML = ""; fatto(v); };
      const ok = async () => {
        if (!/^\d{4,6}$/.test(a.value)) { err.textContent = "Servono da 4 a 6 cifre."; return; }
        if (nuovo) {
          if (a.value !== b.value) { err.textContent = "I due PIN non sono uguali."; return; }
          imp.pin = await hash(a.value); salva(); chiudi(true);
        } else if (await hash(a.value) === imp.pin) chiudi(true);
        else { err.textContent = "PIN sbagliato."; a.value = ""; a.focus(); }
      };
      box.querySelector(".ok").onclick = ok;
      box.querySelector(".no").onclick = () => chiudi(false);
      box.querySelectorAll(".pin-in").forEach(i => i.onkeydown = e => { if (e.key === "Enter") ok(); if (e.key === "Escape") chiudi(false); });
    });
  }
  // ---------- i prof con il PIN PERSONALE (li crea il tecnico sul server della scuola) ----------
  // Se il tecnico non ha creato nessun prof, resta il PIN unico di questa LIM, come prima.
  let sessione = null;          // { token, id, nome }: solo in memoria, si chiude con "Esci" o dopo 15 minuti senza usarla
  let profili = [];
  async function caricaProfili() {
    try {
      const c = new AbortController(), t = setTimeout(() => c.abort(), 3000);
      const r = await fetch("/fa/prof/nomi", { cache: "no-store", signal: c.signal }); clearTimeout(t);
      const j = r.ok ? await r.json() : [];
      profili = Array.isArray(j) ? j.filter(x => x && /^[0-9a-f]{8}$/.test(x.id)) : [];
    } catch (e) { profili = []; }
    return profili;
  }
  async function chiamaProf(percorso, { metodo = "GET", corpo } = {}) {
    if (!sessione) return { stato: 401 };
    try {
      const r = await fetch(percorso, { method: metodo, cache: "no-store", headers: { "Content-Type": "application/json", "X-FlyAula-Prof": sessione.token }, body: corpo === undefined ? undefined : JSON.stringify(corpo) });
      if (r.status === 401) sessione = null;
      let j = null; try { j = await r.json(); } catch (e) {}
      return { stato: r.status, j };
    } catch (e) { return { stato: 0 }; }
  }
  // le impostazioni del prof lo seguono su ogni LIM
  async function caricaMie() {
    const r = await chiamaProf("/fa/prof/mie");
    if (r.stato !== 200 || !r.j) return;
    // quelle del prof; se non ne ha ancora salvate, quelle normali (non quelle del prof di prima)
    for (const k of ["modo", "tema", "bloccate"]) imp[k] = typeof r.j[k] === "string" ? r.j[k] : base[k];
    imp.zoom = Number(r.j.zoom) >= 80 && Number(r.j.zoom) <= 160 ? Number(r.j.zoom) : base.zoom;
    if (!["normale", "spiega", "guida"].includes(imp.modo)) imp.modo = "normale";
    salva(); applicaTema(); aggiornaPill();
  }
  function entraProf(titolo) {
    return new Promise(fatto => {
      const box = el("pin"); let ultimo = null; try { ultimo = localStorage.getItem("flyaula_ultimo_prof"); } catch (e) {}
      box.innerHTML = `<div class="box">
        <h2>🔒 ${titolo}</h2>
        <p>Scegli il tuo nome e scrivi il <b>tuo</b> PIN.</p>
        <select class="pin-chi">${profili.map(p => `<option value="${p.id}" ${p.id === ultimo ? "selected" : ""}>${escapeP(p.nome)}</option>`).join("")}</select>
        <input type="password" inputmode="numeric" maxlength="6" autocomplete="off" class="pin-in">
        <div class="pin-err"></div>
        <div class="riga-btn"><button class="btn ok">Entra</button><button class="btn sec no">Annulla</button></div>
        <p class="nota" style="text-align:left">PIN dimenticato? Il tecnico della scuola te ne dà uno nuovo dal suo pannello.</p>
      </div>`;
      box.style.display = "flex";
      const a = box.querySelector(".pin-in"), chi = box.querySelector(".pin-chi"), err = box.querySelector(".pin-err"), bOk = box.querySelector(".ok");
      a.focus();
      const chiudi = v => { box.style.display = "none"; box.innerHTML = ""; fatto(v); };
      const ok = async () => {
        if (!/^\d{4,6}$/.test(a.value)) { err.textContent = "Servono da 4 a 6 cifre."; return; }
        bOk.disabled = true; err.textContent = "";
        let r = null, j = {};
        try { r = await fetch("/fa/prof/entra", { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: chi.value, pin: a.value }) }); j = await r.json().catch(() => ({})); } catch (e) {}
        bOk.disabled = false; a.value = ""; a.focus();
        if (r && r.status === 200 && j.token) {
          sessione = { token: j.token, id: j.id, nome: j.nome };
          try { localStorage.setItem("flyaula_ultimo_prof", j.id); } catch (e) {}
          await caricaMie();
          return chiudi(true);
        }
        err.textContent = !r ? "Il server della scuola non risponde: riprova tra un attimo."
          : r.status === 429 ? `Troppi PIN sbagliati: riprova tra ${Math.max(1, Math.ceil((j.secondi || 300) / 60))} minuti.`
          : r.status === 403 ? `PIN sbagliato.${j.resta ? ` Ancora ${j.resta} ${j.resta === 1 ? "tentativo" : "tentativi"}.` : ""}`
          : "Non trovo questo prof: chiedi al tecnico.";
      };
      bOk.onclick = ok;
      box.querySelector(".no").onclick = () => chiudi(false);
      a.onkeydown = e => { if (e.key === "Enter") ok(); if (e.key === "Escape") chiudi(false); };
    });
  }
  // cambio del PIN personale: lo fa il prof da solo (serve il vecchio)
  function cambiaPinPersonale() {
    return new Promise(fatto => {
      const box = el("pin");
      box.innerHTML = `<div class="box"><h2>🔑 Cambia il tuo PIN</h2><p>${escapeP(sessione.nome)}</p>
        <input type="password" inputmode="numeric" maxlength="6" autocomplete="off" class="pin-in" placeholder="PIN di adesso">
        <input type="password" inputmode="numeric" maxlength="6" autocomplete="off" class="pin-in" placeholder="Nuovo PIN">
        <input type="password" inputmode="numeric" maxlength="6" autocomplete="off" class="pin-in" placeholder="Ripeti il nuovo">
        <div class="pin-err"></div><div class="riga-btn"><button class="btn ok">OK</button><button class="btn sec no">Annulla</button></div></div>`;
      box.style.display = "flex";
      const [v, n1, n2] = box.querySelectorAll(".pin-in"), err = box.querySelector(".pin-err");
      v.focus();
      const chiudi = x => { box.style.display = "none"; box.innerHTML = ""; fatto(x); };
      box.querySelector(".ok").onclick = async () => {
        if (![v, n1].every(x => /^\d{4,6}$/.test(x.value))) { err.textContent = "Servono da 4 a 6 cifre."; return; }
        if (n1.value !== n2.value) { err.textContent = "I due PIN nuovi non sono uguali."; return; }
        const r = await chiamaProf("/fa/prof/cambiapin", { metodo: "POST", corpo: { vecchio: v.value, nuovo: n1.value } });
        if (r.stato === 200) { err.style.color = "var(--menta)"; err.textContent = "✓ PIN cambiato"; setTimeout(() => chiudi(true), 900); }
        else err.textContent = r.stato === 401 ? "Sei uscito: rientra e riprova." : "Il PIN di adesso è sbagliato.";
      };
      box.querySelector(".no").onclick = () => chiudi(false);
    });
  }
  async function esci() { if (sessione) await chiamaProf("/fa/prof/esci"); sessione = null; }
  // entra con il PIN personale (se ci sono i prof) — per salvare nell'archivio anche fuori dal pannello
  async function entra(titolo = "Entra con il tuo PIN") { if (!(await caricaProfili()).length) return false; return entraProf(titolo); }

  async function accesso() {
    if ((await caricaProfili()).length) return entraProf("Pannello del prof");
    if (!imp.pin) return chiediPin("Crea il PIN del prof", { nuovo: true });
    return chiediPin("Pannello del prof");
  }

  // ---------- tema LIM ----------
  function applicaTema() {
    document.body.classList.toggle("tema-lim", imp.tema === "lim");
    document.body.style.zoom = imp.zoom === 100 ? "" : imp.zoom + "%";
  }

  // ---------- modalità verifica ----------
  let timerVerifica = null;
  const finoA = () => { try { return Number(localStorage.getItem("flyaula_verifica") || 0); } catch (e) { return 0; } };
  const verificaAttiva = () => finoA() > Date.now();
  function mostraVerifica() {
    const v = el("verifica");
    if (!verificaAttiva()) { v.style.display = "none"; clearInterval(timerVerifica); timerVerifica = null; try { localStorage.removeItem("flyaula_verifica"); } catch (e) {} return; }
    v.style.display = "flex";
    const fine = new Date(finoA()), resta = Math.max(0, Math.ceil((finoA() - Date.now()) / 60000));
    v.querySelector(".v-fine").textContent = `Finisce alle ${fine.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })} · mancano ${resta} min`;
    v.querySelector(".v-ora").textContent = new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
    if (!timerVerifica) timerVerifica = setInterval(mostraVerifica, 5000);
  }
  function iniziaVerifica(minuti) {
    try { localStorage.setItem("flyaula_verifica", String(Date.now() + minuti * 60000)); } catch (e) {}
    if (window.Voce) Voce.zitto();
    mostraVerifica();
  }
  async function sbloccaVerifica() {
    const ok = (await caricaProfili()).length ? await entraProf("Sblocca la verifica") : await chiediPin("Sblocca la verifica");
    if (ok) { try { localStorage.removeItem("flyaula_verifica"); } catch (e) {} mostraVerifica(); }
  }

  // ---------- il pannello ----------
  function disegna() {
    const p = el("profCorpo");
    p.innerHTML = `${sessione ? `<div class="prof-chi"><span>👤 <b>${escapeP(sessione.nome)}</b></span><button class="btn" id="pfArchivio">📚 Il mio archivio</button><button class="btn sec" id="pfEsci">🚪 Esci</button></div>` : ""}
      <div class="prof-griglia">
        <section><h3>🎯 Argomento di oggi</h3>
          <input id="pfArg" placeholder="es. le frazioni equivalenti" maxlength="120" value="${escapeP(imp.argomento)}">
          <p class="nota-s">Fly Aula resta su questo argomento. Vuoto = libero.</p></section>
        <section><h3>🗣️ Come risponde</h3>
          <select id="pfModo">
            <option value="normale">Spiega passo passo e dà il risultato</option>
            <option value="spiega">Spiega il metodo ma NON dà il risultato finale</option>
            <option value="guida">Guidami: una domanda alla volta, con un indizio</option>
          </select>
          <p class="nota-s">Con "non dà il risultato" la classe ci arriva da sola.</p></section>
        <section><h3>🚫 Oggi non parlare di…</h3>
          <input id="pfBlocca" placeholder="es. soluzioni della verifica, compiti di domani" maxlength="300" value="${escapeP(imp.bloccate)}">
          <p class="nota-s">Parole separate da virgola. Le domande che le contengono vengono fermate.</p></section>
        <section><h3>🖥️ Schermo della LIM</h3>
          <select id="pfTema"><option value="scuro">Normale</option><option value="lim">Alto contrasto (LIM al sole)</option></select>
          <label class="zoom-riga">Grandezza testo <input type="range" id="pfZoom" min="80" max="160" step="10" value="${imp.zoom}"> <b id="pfZoomV">${imp.zoom}%</b></label></section>
        <section class="verifica-box"><h3>📝 Verifica in classe</h3>
          <p class="nota-s">Fly Aula si mette in pausa: niente domande, niente esercizi, niente voce. Si sblocca da sola alla fine, o con il PIN.</p>
          <div class="riga-btn"><select id="pfDurata"><option value="30">30 min</option><option value="60" selected>1 ora</option><option value="90">1 ora e mezza</option><option value="120">2 ore</option></select>
          <button class="btn" id="pfVerifica">📝 Inizia la verifica</button></div>
          <div class="riga-btn" style="margin-bottom:0"><button class="btn sec" id="pfCrea">📄 Crea una verifica da stampare</button><button class="btn sec" id="pfStrumenti">🧰 Lezione pronta, UDA, aiuto a correggere</button></div></section>
      </div>
      <div class="riga-btn"><button class="btn" id="pfSalva">✓ Salva</button><button class="btn sec" id="pfPin">🔑 Cambia PIN</button><button class="btn sec chiudi-prof">Chiudi</button></div>`;
    el("pfModo").value = imp.modo; el("pfTema").value = imp.tema;
    el("pfZoom").oninput = () => { el("pfZoomV").textContent = el("pfZoom").value + "%"; imp.zoom = +el("pfZoom").value; applicaTema(); };
    el("pfTema").onchange = () => { imp.tema = el("pfTema").value; applicaTema(); };
    const prendi = () => {
      imp.argomento = el("pfArg").value.trim(); imp.modo = el("pfModo").value; imp.bloccate = el("pfBlocca").value.trim(); imp.tema = el("pfTema").value; imp.zoom = +el("pfZoom").value; salva(); applicaTema(); aggiornaPill();
      if (sessione) chiamaProf("/fa/prof/mie", { metodo: "POST", corpo: { modo: imp.modo, tema: imp.tema, zoom: imp.zoom, bloccate: imp.bloccate } });
    };
    el("pfSalva").onclick = () => { prendi(); chiudi(); };
    el("pfPin").onclick = async () => { prendi(); if (sessione) await cambiaPinPersonale(); else await chiediPin("Nuovo PIN del prof", { nuovo: true }); };
    if (el("pfEsci")) el("pfEsci").onclick = async () => { prendi(); await esci(); chiudi(); };
    if (el("pfArchivio")) el("pfArchivio").onclick = () => { prendi(); chiudi(); apriArchivio(); };
    el("pfVerifica").onclick = () => { prendi(); chiudi(); iniziaVerifica(+el("pfDurata").value); };
    el("pfCrea").onclick = () => { prendi(); chiudi(); CreaVerifica.apri(); };
    el("pfStrumenti").onclick = () => { prendi(); chiudi(); Strumenti.apri(); };
    p.querySelector(".chiudi-prof").onclick = () => { prendi(); chiudi(); };
  }
  // ---------- 📚 l'archivio del prof: verifiche e riassunti, sul server, solo suoi ----------
  async function salvaFoglio(foglio, id = null) {
    const r = await chiamaProf("/fa/prof/foglio" + (id ? "?id=" + id : ""), { metodo: "POST", corpo: foglio });
    return r.stato === 200 && r.j && r.j.id ? r.j.id : r.stato === 404 && id ? salvaFoglio(foglio, null) : null;
  }
  async function apriArchivio() {
    let p = el("pArchivio");
    if (!p) { p = document.createElement("div"); p.className = "pannello"; p.id = "pArchivio"; p.innerHTML = `<div class="box"><h2>📚 Il mio archivio</h2><div id="arCorpo"></div></div>`; document.body.appendChild(p); }
    p.style.display = "block";
    await disegnaArchivio();
  }
  const chiudiArchivio = () => { if (el("pArchivio")) el("pArchivio").style.display = "none"; };
  const ICONE = { verifica: "📄", riassunto: "📒", lezione: "📚", uda: "📑" };
  // 🤝 ARCHIVIO DI DIPARTIMENTO: quello che i prof della scuola hanno scelto di condividere
  async function disegnaDip(filtro) {
    const c = el("arCorpo"); c.innerHTML = `<div class="lavoro">🤝 Apro l'archivio di dipartimento…</div>`;
    const r = await chiamaProf("/fa/dip");
    if (r.stato !== 200) return disegnaArchivio();
    const tutte = Array.isArray(r.j) ? r.j : [], mat = filtro === undefined ? (el("materia") ? el("materia").value : "") : filtro;
    const l = tutte.filter(x => !mat || x.materia === mat);
    const nomeM = k => (typeof MATERIE !== "undefined" && MATERIE[k] ? MATERIE[k].emoji + " " + MATERIE[k].nome : k || "—");
    const materie = [...new Set(tutte.map(x => x.materia).filter(Boolean))];
    c.innerHTML = `<p class="nota-s">🤝 Quello che i prof della scuola hanno condiviso. Puoi copiarlo nel tuo archivio e cambiarlo come vuoi: l'originale resta di chi l'ha fatto.</p>
      <div class="riga-btn" style="margin:6px 0"><select class="pill" id="dipMat"><option value="">Tutte le materie (${tutte.length})</option>${materie.map(m => `<option value="${escapeP(m)}" ${m === mat ? "selected" : ""}>${escapeP(nomeM(m))}</option>`).join("")}</select></div>
      ${l.length ? `<table class="cv-tab ar-tab" id="dipTab"><thead><tr><th></th><th>Titolo</th><th>Classe</th><th>Materia</th><th>Di</th><th></th></tr></thead><tbody>
        ${l.map((x, i) => `<tr><td>${ICONE[x.tipo] || "📄"}</td><td><b>${escapeP(x.titolo)}</b></td><td>${escapeP(x.classe)}</td><td>${escapeP(nomeM(x.materia))}</td><td>${x.mio ? "<b>te</b>" : escapeP(x.autore)}</td>
          <td class="cv-az"><button data-k="${i}" title="Copia nel mio archivio">📥</button>${x.mio ? `<button data-t="${i}" title="Togli dal dipartimento">✕</button>` : ""}</td></tr>`).join("")}</tbody></table>`
        : `<p class="sotto">${tutte.length ? "Niente per questa materia." : "Ancora niente: nel tuo archivio tocca 🤝 su una verifica per condividerla."}</p>`}
      <div class="riga-btn"><button class="btn sec" id="dipIndietro">← Il mio archivio</button></div>`;
    el("dipMat").onchange = () => disegnaDip(el("dipMat").value);
    el("dipIndietro").onclick = () => disegnaArchivio();
    c.querySelectorAll("[data-k]").forEach(b => b.onclick = async () => {
      const x = l[+b.dataset.k]; b.disabled = true;
      const f = await chiamaProf("/fa/dip?id=" + x.id);
      if (f.stato !== 200 || !f.j) { b.textContent = "⚠️"; return; }
      const copia = { ...f.j, titolo: String(f.j.titolo || "Foglio").slice(0, 70) + (x.mio ? "" : ` (da ${String(x.autore).split(" ")[0]})`), data: new Date().toISOString() };
      delete copia.autore; delete copia.autoreId; delete copia.condiviso;
      const s2 = await chiamaProf("/fa/prof/foglio", { metodo: "POST", corpo: copia });
      b.textContent = s2.stato === 200 ? "✓" : "⚠️"; b.title = s2.stato === 200 ? "Copiata nel tuo archivio" : "Non riuscita (archivio pieno?)";
    });
    c.querySelectorAll("[data-t]").forEach(b => b.onclick = async () => {
      if (b.dataset.sicuro !== "1") { b.dataset.sicuro = "1"; b.textContent = "Sicuro?"; return; }
      await chiamaProf("/fa/dip?id=" + l[+b.dataset.t].id, { metodo: "DELETE" }); disegnaDip(el("dipMat") ? el("dipMat").value : mat);
    });
  }
  async function disegnaArchivio() {
    const c = el("arCorpo"); c.innerHTML = `<div class="lavoro">📚 Apro l'archivio…</div>`;
    const r = await chiamaProf("/fa/prof/archivio");
    if (r.stato !== 200) {
      c.innerHTML = `<p class="sotto">${r.stato === 401 ? "Sei uscito: dopo 15 minuti senza usarlo l'archivio si chiude da solo, così nessun altro lo vede." : "Il server della scuola non risponde: riprova tra un attimo."}</p>
        <div class="riga-btn"><button class="btn" id="arEntra">🔒 Entra di nuovo</button><button class="btn sec" id="arChiudi">Chiudi</button></div>`;
      el("arEntra").onclick = async () => { if (await entra("Il mio archivio")) disegnaArchivio(); };
      el("arChiudi").onclick = chiudiArchivio;
      return;
    }
    const l = Array.isArray(r.j) ? r.j : [];
    const data = d => { const x = new Date(d); return isNaN(x) ? "" : x.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" }); };
    const nomeM = k => (typeof MATERIE !== "undefined" && MATERIE[k] ? MATERIE[k].emoji + " " + MATERIE[k].nome : k);
    c.innerHTML = `<p class="nota-s">👤 <b>${escapeP(sessione.nome)}</b> · ${l.length} ${l.length === 1 ? "foglio" : "fogli"} · li vedi solo tu, da qualsiasi LIM della scuola.</p>
      ${l.length ? `<table class="cv-tab ar-tab"><thead><tr><th></th><th>Titolo</th><th>Classe</th><th>Materia</th><th>Aula</th><th>Data</th><th></th></tr></thead><tbody>
        ${l.map((x, i) => `<tr><td>${ICONE[x.tipo] || "📄"}</td><td><b>${escapeP(x.titolo)}</b></td><td>${escapeP(x.classe)}</td><td>${escapeP(nomeM(x.materia))}</td><td>${escapeP(x.aula || "—")}</td><td>${escapeP(data(x.data))}</td>
          <td class="cv-az"><button data-a="${i}" title="Apri">📂</button>${x.tipo === "correzione" ? "" : `<button data-c="${i}" title="Condividi con i prof del dipartimento">🤝</button>`}<button data-d="${i}" title="Cancella">🗑️</button></td></tr>`).join("")}</tbody></table>`
        : `<p class="sotto">Ancora vuoto. Le verifiche che crei si salvano qui da sole; i riassunti delle lezioni con il pulsante "💾 Nel mio archivio".</p>`}
      <div class="riga-btn"><button class="btn" id="arDip">🤝 Archivio di dipartimento</button><button class="btn sec" id="arChiudi">Chiudi</button></div>`;
    el("arChiudi").onclick = chiudiArchivio;
    el("arDip").onclick = () => disegnaDip();
    c.querySelectorAll("[data-c]").forEach(b => b.onclick = async () => {
      b.disabled = true; const r = await chiamaProf("/fa/prof/condividi?id=" + l[+b.dataset.c].id, { metodo: "POST" });
      b.textContent = r.stato === 200 ? "✓" : "⚠️"; b.title = r.stato === 200 ? "Condivisa: la vedono i prof della scuola (con il tuo nome)" : "Non riuscita";
    });
    c.querySelectorAll("[data-a]").forEach(b => b.onclick = async () => {
      const x = l[+b.dataset.a]; b.disabled = true;
      const f = await chiamaProf("/fa/prof/foglio?id=" + x.id);
      if (f.stato !== 200 || !f.j) { b.disabled = false; return disegnaArchivio(); }
      chiudiArchivio();
      if (f.j.tipo === "riassunto") window.mostraRiassuntoSalvato && window.mostraRiassuntoSalvato(f.j);
      else if (f.j.tipo === "lezione" || f.j.tipo === "uda") typeof Strumenti !== "undefined" && Strumenti.mostra(f.j, x.id);
      else CreaVerifica.carica(f.j, x.id);
    });
    c.querySelectorAll("[data-d]").forEach(b => b.onclick = async () => {
      if (b.dataset.sicuro !== "1") { b.dataset.sicuro = "1"; b.textContent = "Sicuro?"; setTimeout(() => { if (b.isConnected) { b.dataset.sicuro = ""; b.textContent = "🗑️"; } }, 4000); return; }
      await chiamaProf("/fa/prof/foglio?id=" + l[+b.dataset.d].id, { metodo: "DELETE" });
      disegnaArchivio();
    });
  }

  const escapeP = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const chiudi = () => { el("pProf").style.display = "none"; };
  async function apri() {
    if (!(await accesso())) return;
    disegna(); el("pProf").style.display = "block";
  }
  function aggiornaPill() {
    const p = el("pillProf"); if (!p) return;
    const parti = [];
    if (imp.argomento) parti.push("🎯 " + imp.argomento);
    if (imp.modo === "spiega") parti.push("senza risultato finale"); else if (imp.modo === "guida") parti.push("guidami");
    p.textContent = parti.join(" · "); p.style.display = parti.length ? "" : "none";
  }

  // ---------- cosa cambia nelle risposte ----------
  function istruzioni(nomeMateria) {
    let t = "";
    if (imp.argomento) t += `\nARGOMENTO DI OGGI scelto dal prof: "${imp.argomento}". Resta su questo argomento: se chiedono altro di ${nomeMateria}, rispondi in breve e riporta la classe all'argomento di oggi.`;
    if (imp.modo === "spiega") t += `\nSCELTA DEL PROF: NON scrivere il risultato finale. Spiega il metodo passo passo e FERMATI prima dell'ultimo passaggio, chiedendo alla classe di completarlo da sola.`;
    if (imp.modo === "guida") t += `\nSCELTA DEL PROF (modalità GUIDAMI): non spiegare tutto. Fai UNA sola domanda alla volta per far ragionare la classe, con un piccolo indizio. Massimo 3 righe. Non dare il risultato.`;
    return t;
  }
  function bloccata(domanda) {
    const d = domanda.toLowerCase();
    return imp.bloccate.split(",").map(x => x.trim().toLowerCase()).filter(x => x.length >= 3).find(x => d.includes(x)) || null;
  }

  return {
    apri, accesso, istruzioni, bloccata, verificaAttiva, mostraVerifica, sbloccaVerifica, applicaTema, aggiornaPill,
    get modo() { return imp.modo; }, get argomento() { return imp.argomento; },
    entra, esci, salvaFoglio, apriArchivio, caricaProfili,
    get sessione() { return sessione ? { id: sessione.id, nome: sessione.nome } : null }, get conProfili() { return profili.length > 0; }
  };
})();
