// ===================================================================
//  FLY AULA · 📷 Pagine di oggi
//  Il prof fotografa 2-5 pagine del libro con il SUO telefono (QR sulla LIM):
//  le foto vanno al PC della classe sul Wi-Fi della scuola, senza internet.
//  Fly Aula legge il testo, il prof lo controlla, e per questa lezione
//  risponde usando quelle pagine. A fine lezione si cancella tutto.
// ===================================================================
const Pagine = (() => {
  const el = id => document.getElementById(id);
  const MAX_CARATTERI = 14000;
  let pagine = [];          // { id, src, testo, stato: "leggo" | "ok" | "errore" }
  let testoUsato = "";      // quello che Fly Aula usa davvero
  let server = null, giro = null, ocrPronto = null;
  const VISIONE = /qwen2\.5vl|qwen2\.5-vl|qwen3-vl|llava|llama3\.2-vision|gemma3:(4|12|27)b|minicpm-v|granite3\.2-vision/;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  async function statoServer() {
    try { const r = await fetch("/fa/stato?" + Scuola.parAula(), { cache: "no-store" }); server = r.ok ? await r.json() : null; } catch (e) { server = null; }
    return server;
  }

  // ---------- leggere il testo da una foto ----------
  async function inBase64(src) {
    const b = await (await fetch(src)).blob();
    return await new Promise(ok => { const f = new FileReader(); f.onload = () => ok(String(f.result).split(",")[1]); f.readAsDataURL(b); });
  }
  async function leggiFoto(src) {
    const visione = (window.modelliPresenti || []).find(m => VISIONE.test(m));
    if (visione) {
      const r = await Scuola.chiama("/api/chat", { method: "POST", body: JSON.stringify({ model: visione, stream: false, keep_alive: "30m", options: { temperature: 0, num_ctx: 8192 },
        messages: [{ role: "user", content: "Trascrivi ESATTAMENTE tutto il testo stampato in questa pagina di un libro scolastico, nell'ordine in cui si legge. Mantieni i titoli, i numeri e le formule. Non aggiungere niente, non riassumere, non commentare.", images: [await inBase64(src)] }] }) });
      const j = await r.json();
      const t = (j.message?.content || "").trim();
      if (t) return t;
    }
    // senza modello che vede: lettore di testo nel browser (serve internet la prima volta)
    if (!ocrPronto) ocrPronto = new Promise((ok, no) => {
      if (window.Tesseract) return ok();
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
      s.onload = ok; s.onerror = () => { ocrPronto = null; no(new Error("lettore non disponibile")); };
      document.head.appendChild(s);
    });
    await ocrPronto;
    const r = await Tesseract.recognize(src, "ita");
    return (r.data.text || "").trim();
  }
  async function leggi(p) {
    p.stato = "leggo"; disegnaLista();
    try { p.testo = await leggiFoto(p.src); p.stato = p.testo ? "ok" : "errore"; }
    catch (e) { p.stato = "errore"; }
    disegnaLista();
  }

  // ---------- arrivo delle foto ----------
  async function controllaArrivi() {
    if (!server) return;
    try {
      const ids = await (await fetch("/fa/pagine?" + Scuola.parAula(), { cache: "no-store" })).json();
      for (const id of ids) if (!pagine.find(p => p.id === id)) { const p = { id, src: "/fa/pagina/" + id + "?" + Scuola.parAula(), testo: "", stato: "leggo" }; pagine.push(p); leggi(p); }
    } catch (e) {}
  }
  function aggiungiFile(files) {
    for (const f of files) {
      if (!f.type.startsWith("image/")) continue;
      const p = { id: "f" + Date.now() + Math.random().toString(36).slice(2, 6), src: URL.createObjectURL(f), testo: "", stato: "leggo" };
      pagine.push(p); leggi(p);
    }
  }

  // ---------- il pannello ----------
  function disegnaLista() {
    const l = el("pgLista"); if (!l) return;
    l.innerHTML = pagine.length ? pagine.map((p, i) => `
      <div class="pg" data-id="${p.id}">
        <div class="pg-sx">${p.src ? `<img src="${esc(p.src)}" alt="Pagina ${i + 1}">` : `<div class="pg-testo-icona">✍️</div>`}<b>Pagina ${i + 1}</b>
          <button class="pg-via" title="Togli questa pagina">✕</button></div>
        <div class="pg-dx">${!p.src ? `<div class="pg-ok">✍️ Scrivi o incolla qui il testo della pagina.</div><textarea placeholder="Testo della pagina">${esc(p.testo)}</textarea>`
          : p.stato === "leggo" ? `<div class="lavoro">Leggo il testo della pagina…</div>`
          : p.stato === "errore" ? `<div class="pg-err">Non riesco a leggere questa foto. Scrivi qui sotto il testo, oppure rifai la foto più dritta e con più luce.</div><textarea placeholder="Testo della pagina">${esc(p.testo)}</textarea>`
          : `<div class="pg-ok">✓ Letto. Controlla che sia giusto: puoi correggere qui.</div><textarea>${esc(p.testo)}</textarea>`}</div>
      </div>`).join("") : `<p class="nota-s" style="font-size:18px">Ancora nessuna pagina.</p>`;
    l.querySelectorAll(".pg").forEach(d => {
      const p = pagine.find(x => x.id === d.dataset.id);
      const ta = d.querySelector("textarea"); if (ta) ta.oninput = () => { p.testo = ta.value; if (p.testo.trim()) p.stato = "ok"; };
      d.querySelector(".pg-via").onclick = () => { pagine = pagine.filter(x => x !== p); disegnaLista(); };
    });
    const pronte = pagine.filter(p => p.testo.trim()).length;
    el("pgUsa").disabled = !pronte || pagine.some(p => p.stato === "leggo");
    el("pgUsa").textContent = pronte ? `✓ Usa ${pronte === 1 ? "questa pagina" : "queste " + pronte + " pagine"}` : "✓ Usa queste pagine";
  }
  async function apri() {
    el("pPagine").style.display = "block";
    const qr = el("pgQr");
    qr.innerHTML = `<div class="lavoro">Preparo il collegamento col telefono…</div>`;
    await statoServer();
    if (server && server.rete && server.ip) {
      const url = `http://${server.ip}:${server.porta}/flyaula/telefono.html?c=${server.codice}${Scuola.aula ? "&a=" + encodeURIComponent(Scuola.aula) : ""}`;
      qr.innerHTML = `<div class="qr-box">${QR.svg(url, 250)}<div>
        <h3>1. Inquadra il QR con la fotocamera del telefono</h3>
        <h3>2. Fotografa le pagine della lezione</h3>
        <h3>3. Arrivano qui da sole ✨</h3>
        <p class="nota-s">Telefono e computer devono essere sullo <b>stesso Wi-Fi</b> della scuola. Le foto non passano da internet.<br>Se il QR non si apre, scrivi nel telefono: <b>${esc(url.replace("http://", ""))}</b></p></div></div>`;
      clearInterval(giro); giro = setInterval(controllaArrivi, 2000); controllaArrivi();
    } else if (server) {
      qr.innerHTML = `<div class="avviso-pg">📶 Il collegamento col telefono non è attivo su questo computer (manca il permesso di rete dell'installazione). Puoi comunque caricare le foto dal computer qui sotto.</div>`;
    } else {
      qr.innerHTML = `<div class="avviso-pg">📱 Le foto dal telefono funzionano con <b>Fly Aula installata</b> sul computer della classe (menu ☰ → Installa sul PC della classe).<br>Intanto puoi caricare le foto o scrivere il testo qui sotto.</div>`;
    }
    disegnaLista();
  }
  function chiudi() { el("pPagine").style.display = "none"; clearInterval(giro); giro = null; }
  function usa() {
    testoUsato = pagine.filter(p => p.testo.trim()).map((p, i) => `--- Pagina ${i + 1} ---\n${p.testo.trim()}`).join("\n\n").slice(0, MAX_CARATTERI);
    aggiornaPill(); chiudi();
  }
  async function svuota() {
    pagine.forEach(p => { if (p.src && p.src.startsWith("blob:")) URL.revokeObjectURL(p.src); });
    pagine = []; testoUsato = "";
    try { if (server || await statoServer()) await fetch("/fa/pagine?" + Scuola.parAula(), { method: "DELETE" }); } catch (e) {}
    aggiornaPill(); disegnaLista();
  }
  function aggiornaPill() {
    const p = el("pillPagine"); if (!p) return;
    const n = (testoUsato.match(/--- Pagina /g) || []).length;
    p.textContent = n ? `📷 ${n} ${n === 1 ? "pagina" : "pagine"} del libro` : ""; p.style.display = n ? "" : "none";
  }
  function istruzioni() {
    if (!testoUsato) return "";
    return `\nPAGINE DEL LIBRO DI OGGI (fotografate dal prof: sono la fonte principale):\n"""\n${testoUsato}\n"""\nRispondi usando queste pagine. Quando puoi, di' "come c'è scritto nel libro". Se la risposta NON è nelle pagine, dillo chiaramente e rispondi con prudenza, senza inventare.`;
  }
  function fonte() { return testoUsato ? `PAGINE DEL LIBRO (fonte sicura, la risposta non deve contraddirle):\n${testoUsato.slice(0, 6000)}` : ""; }

  // pulsanti del pannello
  function collega() {
    el("pgFile").onchange = e => { aggiungiFile(e.target.files); e.target.value = ""; };
    el("pgScrivi").onclick = () => { pagine.push({ id: "t" + Date.now(), src: "", testo: "", stato: "errore" }); disegnaLista(); };
    el("pgUsa").onclick = usa;
    el("pgCancella").onclick = svuota;
    el("pgChiudi").onclick = chiudi;
  }
  return { apri, chiudi, svuota, istruzioni, fonte, collega, get attive() { return !!testoUsato; } };
})();
