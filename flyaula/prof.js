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
  async function accesso() {
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
    if (await chiediPin("Sblocca la verifica")) { try { localStorage.removeItem("flyaula_verifica"); } catch (e) {} mostraVerifica(); }
  }

  // ---------- il pannello ----------
  function disegna() {
    const p = el("profCorpo");
    p.innerHTML = `
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
          <button class="btn" id="pfVerifica">📝 Inizia la verifica</button></div></section>
      </div>
      <div class="riga-btn"><button class="btn" id="pfSalva">✓ Salva</button><button class="btn sec" id="pfPin">🔑 Cambia PIN</button><button class="btn sec chiudi-prof">Chiudi</button></div>`;
    el("pfModo").value = imp.modo; el("pfTema").value = imp.tema;
    el("pfZoom").oninput = () => { el("pfZoomV").textContent = el("pfZoom").value + "%"; imp.zoom = +el("pfZoom").value; applicaTema(); };
    el("pfTema").onchange = () => { imp.tema = el("pfTema").value; applicaTema(); };
    const prendi = () => { imp.argomento = el("pfArg").value.trim(); imp.modo = el("pfModo").value; imp.bloccate = el("pfBlocca").value.trim(); imp.tema = el("pfTema").value; imp.zoom = +el("pfZoom").value; salva(); applicaTema(); aggiornaPill(); };
    el("pfSalva").onclick = () => { prendi(); chiudi(); };
    el("pfPin").onclick = async () => { prendi(); await chiediPin("Nuovo PIN del prof", { nuovo: true }); };
    el("pfVerifica").onclick = () => { prendi(); chiudi(); iniziaVerifica(+el("pfDurata").value); };
    p.querySelector(".chiudi-prof").onclick = () => { prendi(); chiudi(); };
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
    apri, istruzioni, bloccata, verificaAttiva, mostraVerifica, sbloccaVerifica, applicaTema, aggiornaPill,
    get modo() { return imp.modo; }, get argomento() { return imp.argomento; }
  };
})();
