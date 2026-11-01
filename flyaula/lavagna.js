// ===================================================================
//  FLY AULA · 🖊️ LAVAGNA che corregge
//  Penna, evidenziatore, gomma, colori, pagine, sfondi (quadretti, righe).
//  "✅ Correggi i conti": Fly Aula legge i numeri dai TRATTI della penna (tratti.js),
//  chiede "Ho letto bene?", la CALCOLATRICE controlla, e se c'è un errore mette
//  un cerchietto e un aiuto, senza dare subito la soluzione (che arriva al 2° tentativo).
//  "📖 Leggi": per parole e frasi usa il cervello che vede (se c'è), caricato solo per
//  quel momento e tolto subito dalla scheda video.
// ===================================================================
const Lavagna = (() => {
  const el = id => document.getElementById(id);
  const LARGO = 1000;                       // la lavagna è larga 1000 "unità": così i disegni restano uguali su ogni schermo
  const CHIAVE = "flyaula_lavagna";
  const VISIONE = /qwen2\.5vl|qwen2\.5-vl|qwen3-vl|llava|llama3\.2-vision|gemma3:(4|12|27)b|minicpm-v|granite3\.2-vision/;
  const COLORI = { auto: null, sole: "#FFD23F", cielo: "#3B8BFF", menta: "#00D2A0", corallo: "#FF5A5F" };
  const SFONDI = ["scuro", "quadretti", "righe", "bianco"];
  let pagine = [{ sfondo: "scuro", tratti: [] }], pg = 0;
  let strumento = "penna", colore = "auto", spessore = 4;
  let annulla = [], ripeti = [], segni = [], tentativi = {}, aperta = false;
  let tela, ctx, sopra, sctx, scala = 1, alto = 562, dpr = 1;
  let attivo = null, idAttivo = null, ultimaPenna = 0, gommati = null;
  const stat = { giusti: 0, sbagliati: 0 };
  const chiaro = s => s === "scuro";
  const inchiostro = (c, sf) => c === "auto" ? (chiaro(sf) ? "#F3F6FB" : "#14213D") : COLORI[c];

  // ---------- salvataggio (solo su questo computer) ----------
  function salva() {
    clearTimeout(salva.t);
    salva.t = setTimeout(() => {
      try {
        const s = JSON.stringify({ pg, pagine: pagine.map(p => ({ sfondo: p.sfondo, tratti: p.tratti.map(t => ({ ...t, punti: t.punti.map(q => [Math.round(q[0] * 10) / 10, Math.round(q[1] * 10) / 10]) })) })) });
        if (s.length < 2500000) localStorage.setItem(CHIAVE, s);
      } catch (e) {}
    }, 800);
  }
  function carica() {
    try {
      const j = JSON.parse(localStorage.getItem(CHIAVE) || "null");
      if (j && Array.isArray(j.pagine) && j.pagine.length) { pagine = j.pagine.filter(p => p && Array.isArray(p.tratti)).map(p => ({ sfondo: SFONDI.includes(p.sfondo) ? p.sfondo : "scuro", tratti: p.tratti })); pg = Math.min(Math.max(0, j.pg | 0), pagine.length - 1); }
    } catch (e) {}
    if (!pagine.length) pagine = [{ sfondo: "scuro", tratti: [] }];
  }

  // ---------- disegno ----------
  function misura() {
    const f = el("lvFoglio"), r = f.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    for (const c of [tela, sopra]) { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); c.style.width = r.width + "px"; c.style.height = r.height + "px"; }
    scala = r.width / LARGO; alto = r.height / scala;
    disegna(); disegnaSegni();
  }
  function sfondo(c, sf, w, h, s) {
    c.fillStyle = chiaro(sf) ? "#0B1A30" : "#FBFBF7"; c.fillRect(0, 0, w, h);
    if (sf === "quadretti" || sf === "righe") {
      const passo = (sf === "quadretti" ? 25 : 40) * s; c.strokeStyle = sf === "quadretti" ? "rgba(59,139,255,.22)" : "rgba(59,139,255,.3)"; c.lineWidth = 1;
      c.beginPath();
      for (let y = passo; y < h; y += passo) { c.moveTo(0, Math.round(y) + .5); c.lineTo(w, Math.round(y) + .5); }
      if (sf === "quadretti") for (let x = passo; x < w; x += passo) { c.moveTo(Math.round(x) + .5, 0); c.lineTo(Math.round(x) + .5, h); }
      c.stroke();
    }
  }
  function tratto(c, t, s, sf, forza) {
    const p = t.punti; if (!p.length) return;
    c.save();
    c.strokeStyle = forza || inchiostro(t.colore, sf); c.fillStyle = c.strokeStyle;
    c.lineCap = "round"; c.lineJoin = "round";
    if (t.tipo === "evid") { c.globalAlpha = .35; c.lineWidth = t.sp * 4 * s; } else c.lineWidth = t.sp * s;
    if (p.length === 1) { c.beginPath(); c.arc(p[0][0] * s, p[0][1] * s, Math.max(1, c.lineWidth / 2), 0, 7); c.fill(); c.restore(); return; }
    c.beginPath(); c.moveTo(p[0][0] * s, p[0][1] * s);
    for (let i = 1; i < p.length - 1; i++) { const mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2; c.quadraticCurveTo(p[i][0] * s, p[i][1] * s, mx * s, my * s); }
    const u = p[p.length - 1]; c.lineTo(u[0] * s, u[1] * s); c.stroke(); c.restore();
  }
  function disegna() {
    if (!ctx) return;
    const pag = pagine[pg], s = scala * dpr;
    sfondo(ctx, pag.sfondo, tela.width, tela.height, s);
    for (const t of pag.tratti) if (t.tipo === "evid") tratto(ctx, t, s, pag.sfondo);
    for (const t of pag.tratti) if (t.tipo !== "evid") tratto(ctx, t, s, pag.sfondo);
    el("lvNum").textContent = `${pg + 1} / ${pagine.length}`;
    el("lvAnnulla").disabled = !annulla.length; el("lvRipeti").disabled = !ripeti.length;
  }
  // i segni della correzione (cerchietti, ✓) stanno su un foglio trasparente sopra
  function disegnaSegni() {
    if (!sctx) return;
    sctx.clearRect(0, 0, sopra.width, sopra.height);
    const s = scala * dpr;
    for (const g of segni) {
      sctx.save(); sctx.lineWidth = 5 * s; sctx.lineCap = "round";
      if (g.tipo === "ok") {
        sctx.strokeStyle = "#00D2A0"; const x = (g.b.x1 + 18) * s, y = (g.b.y0 + g.b.y1) / 2 * s, k = Math.max(14, (g.b.y1 - g.b.y0) * .45) * s;
        sctx.beginPath(); sctx.moveTo(x, y); sctx.lineTo(x + k * .4, y + k * .45); sctx.lineTo(x + k * 1.1, y - k * .6); sctx.stroke();
      } else if (g.tipo === "no") {
        sctx.strokeStyle = "#FF9F43"; sctx.setLineDash([12 * s, 8 * s]);
        const cx = (g.b.x0 + g.b.x1) / 2 * s, cy = (g.b.y0 + g.b.y1) / 2 * s, rx = ((g.b.x1 - g.b.x0) / 2 + 16) * s, ry = ((g.b.y1 - g.b.y0) / 2 + 14) * s;
        sctx.beginPath(); sctx.ellipse(cx, cy, rx, ry, 0, 0, 7); sctx.stroke();
      }
      if (g.n) { sctx.setLineDash([]); sctx.fillStyle = g.tipo === "ok" ? "#00D2A0" : g.tipo === "no" ? "#FF9F43" : "#93A6C3"; sctx.font = `900 ${20 * s}px Figtree, sans-serif`; sctx.fillText(g.n, (g.b.x0 - 34) * s, (g.b.y0 + g.b.y1) / 2 * s + 7 * s); }
      sctx.restore();
    }
  }

  // ---------- penna, evidenziatore, gomma ----------
  function punto(e) { const r = tela.getBoundingClientRect(); return [(e.clientX - r.left) / scala, (e.clientY - r.top) / scala]; }
  function giu(e) {
    if (idAttivo !== null) return;                                    // un dito alla volta
    if (e.pointerType === "pen") ultimaPenna = Date.now();
    else if (e.pointerType === "touch" && Date.now() - ultimaPenna < 2000) return;   // la mano appoggiata mentre si scrive con la penna
    e.preventDefault(); tela.setPointerCapture(e.pointerId); idAttivo = e.pointerId;
    if (segni.length) { segni = []; disegnaSegni(); }
    if (strumento === "gomma") { gommati = []; gomma(punto(e)); return; }
    const pag = pagine[pg];
    attivo = { tipo: strumento === "evid" ? "evid" : "penna", colore: strumento === "evid" && colore === "auto" ? "sole" : colore, sp: spessore, punti: [punto(e)] };
    pag.tratti.push(attivo);
    tratto(ctx, attivo, scala * dpr, pag.sfondo);
  }
  function muovi(e) {
    if (e.pointerId !== idAttivo) return;
    e.preventDefault();
    const eventi = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    if (strumento === "gomma") { for (const x of (eventi.length ? eventi : [e])) gomma(punto(x)); return; }
    if (!attivo) return;
    const pag = pagine[pg], s = scala * dpr;
    for (const x of (eventi.length ? eventi : [e])) {
      const q = punto(x), u = attivo.punti[attivo.punti.length - 1];
      if (Math.hypot(q[0] - u[0], q[1] - u[1]) < .7) continue;
      attivo.punti.push(q);
      // si disegna solo il pezzo nuovo (veloce anche con tanti tratti sulla pagina)
      ctx.save(); ctx.strokeStyle = inchiostro(attivo.colore, pag.sfondo); ctx.lineCap = "round"; ctx.lineJoin = "round";
      if (attivo.tipo === "evid") { ctx.globalAlpha = .35; ctx.lineWidth = attivo.sp * 4 * s; } else ctx.lineWidth = attivo.sp * s;
      ctx.beginPath(); ctx.moveTo(u[0] * s, u[1] * s); ctx.lineTo(q[0] * s, q[1] * s); ctx.stroke(); ctx.restore();
    }
  }
  function su(e) {
    if (e.pointerId !== idAttivo) return;
    idAttivo = null;
    if (strumento === "gomma") { if (gommati && gommati.length) { annulla.push({ t: "via", pg, tratti: gommati }); ripeti = []; salva(); } gommati = null; disegna(); return; }
    if (attivo) { annulla.push({ t: "add", pg, tratto: attivo }); ripeti = []; attivo = null; disegna(); salva(); }
  }
  function gomma(q) {
    const pag = pagine[pg], r = 14 + spessore * 2; let tolto = false;
    for (let i = pag.tratti.length - 1; i >= 0; i--) {
      const t = pag.tratti[i];
      if (t.punti.some((p, j) => Math.hypot(p[0] - q[0], p[1] - q[1]) < r + t.sp || (j && distSeg(q, t.punti[j - 1], p) < r))) { gommati.push({ tratto: t, i }); pag.tratti.splice(i, 1); tolto = true; }
    }
    if (tolto) disegna();
  }
  function distSeg(p, a, b) { const vx = b[0] - a[0], vy = b[1] - a[1], L = vx * vx + vy * vy; let t = L ? ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * vx, p[1] - a[1] - t * vy); }
  function indietro() {
    const a = annulla.pop(); if (!a) return;
    pg = Math.min(a.pg, pagine.length - 1);
    const pag = pagine[pg];
    if (a.t === "add") { const i = pag.tratti.lastIndexOf(a.tratto); if (i >= 0) pag.tratti.splice(i, 1); }
    else if (a.t === "via") a.tratti.slice().reverse().forEach(x => pag.tratti.splice(Math.min(x.i, pag.tratti.length), 0, x.tratto));
    else if (a.t === "pulisci") pag.tratti = a.tratti.slice();
    ripeti.push(a); segni = []; disegnaSegni(); disegna(); salva();
  }
  function avanti() {
    const a = ripeti.pop(); if (!a) return;
    pg = Math.min(a.pg, pagine.length - 1);
    const pag = pagine[pg];
    if (a.t === "add") pag.tratti.push(a.tratto);
    else if (a.t === "via") for (const x of a.tratti) { const i = pag.tratti.indexOf(x.tratto); if (i >= 0) pag.tratti.splice(i, 1); }
    else if (a.t === "pulisci") pag.tratti = [];
    annulla.push(a); disegna(); salva();
  }
  function pulisci() {
    const pag = pagine[pg]; if (!pag.tratti.length) return;
    annulla.push({ t: "pulisci", pg, tratti: pag.tratti.slice() }); ripeti = []; pag.tratti = []; segni = []; tentativi = {};
    chiudiFumetto(); disegna(); disegnaSegni(); salva();
  }
  function vaiPagina(n) { pg = Math.max(0, Math.min(pagine.length - 1, n)); segni = []; chiudiFumetto(); disegna(); disegnaSegni(); salva(); }
  function nuovaPagina() { if (pagine.length >= 30) return; pagine.splice(pg + 1, 0, { sfondo: pagine[pg].sfondo, tratti: [] }); vaiPagina(pg + 1); }
  function cambiaSfondo() { const p = pagine[pg]; p.sfondo = SFONDI[(SFONDI.indexOf(p.sfondo) + 1) % SFONDI.length]; el("lvSfondo").title = "Sfondo: " + p.sfondo; disegna(); salva(); }

  // ---------- 💬 il fumetto con gli aiuti ----------
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function fumetto(html) { const f = el("lvFumetto"); f.innerHTML = `<button class="lv-x" title="Chiudi">✕</button>` + html; f.hidden = false; f.querySelector(".lv-x").onclick = chiudiFumetto; }
  function chiudiFumetto() { const f = el("lvFumetto"); if (f) { f.hidden = true; f.innerHTML = ""; } }
  function aggiornaStat() { el("lvStat").textContent = stat.giusti + stat.sbagliati ? `Oggi alla lavagna: ✓ ${stat.giusti} · da rivedere ${stat.sbagliati}` : ""; }

  // ---------- ✅ CORREGGI I CONTI ----------
  const bello = t => t.replace(/\s+/g, "").replace(/([+\-×:=])/g, " $1 ").replace(/\s+/g, " ").trim();
  async function correggi() {
    const pag = pagine[pg], penna = pag.tratti.filter(t => t.tipo === "penna" && t.punti.length).map(t => t.punti);
    if (!penna.length) { fumetto(`<p>Scrivi un conto alla lavagna, per esempio <b>345 : 5 = 69</b>, poi tocca <b>✅ Correggi</b>.</p>`); return; }
    fumetto(`<p class="lv-lavoro">✍️ Leggo la tua scrittura…</p>`);
    await new Promise(r => setTimeout(r, 30));
    let righe = [];
    try { righe = Tratti.leggi(penna).filter(r => /\d/.test(r.testo)); } catch (e) { righe = []; }
    if (!righe.length) { fumetto(`<p>Non trovo numeri da controllare. Scrivi il conto un po' più grande, una riga per conto.</p>`); return; }
    chiudiFumetto(); conferma(righe);
  }
  // "Ho letto bene?": una casella per riga, che si può correggere
  function conferma(righe, daTesto = false) {
    const c = el("lvConferma");
    c.innerHTML = `<div class="lv-box"><h3>Ho letto bene?</h3>
      <p class="sotto">${daTesto ? "Ecco i conti che ho trovato." : "Se ho letto male un numero, correggilo qui: così imparo la tua scrittura."}</p>
      ${righe.map((r, i) => `<div class="lv-riga"><span class="lv-n">${i + 1}</span><input data-i="${i}" value="${esc(bello(r.testo))}" autocomplete="off" spellcheck="false">${r.segni && r.segni.some(s => !s.sicuro) ? `<span class="lv-dubbio" title="Non sono sicuro di qualche segno">❓</span>` : ""}</div>`).join("")}
      <div class="riga-btn"><button class="btn" id="lvSi">✅ Sì, controlla</button><button class="btn sec" id="lvNo">Annulla</button></div></div>`;
    c.hidden = false;
    const primo = c.querySelector("input"); if (primo) setTimeout(() => primo.focus(), 50);
    c.querySelectorAll("input").forEach(i => i.onkeydown = e => { if (e.key === "Enter") el("lvSi").click(); });
    el("lvNo").onclick = () => { c.hidden = true; c.innerHTML = ""; };
    el("lvSi").onclick = () => {
      const testi = [...c.querySelectorAll("input")].map(i => i.value);
      c.hidden = true; c.innerHTML = "";
      if (!daTesto) impara(righe, testi);
      controlla(righe, testi);
    };
  }
  // se il ragazzo corregge un numero letto male, Fly Aula tiene quel modo di scriverlo
  function impara(righe, testi) {
    righe.forEach((r, i) => {
      const nuovo = String(testi[i] || "").replace(/\s+/g, "").replace(/[x*]/gi, "×").replace(/[÷/]/g, ":");
      if (!r.segni || nuovo.length !== r.segni.length || nuovo === r.testo) return;
      r.segni.forEach((s, j) => { if (s.segno !== nuovo[j] && /[0-9+×()]/.test(nuovo[j])) { try { Tratti.impara(nuovo[j], s.tratti); } catch (e) {} } });
    });
  }
  function controlla(righe, testi) {
    segni = []; const msg = [];
    righe.forEach((r, i) => {
      const c = Tratti.conto(testi[i]), n = righe.length > 1 ? i + 1 : "";
      const tutta = r.segni ? Tratti.scatola(r.segni.flatMap(s => s.tratti)) : null;
      const pezzoRisultato = () => {
        if (!r.segni) return tutta;
        const k = r.segni.findIndex(s => s.segno === "=");
        const dopo = k >= 0 ? r.segni.slice(k + 1) : r.segni.slice(-1);
        return dopo.length ? Tratti.scatola(dopo.flatMap(s => s.tratti)) : tutta;
      };
      if (!c.ok) {
        msg.push(`<div class="lv-m"><b>${n ? n + ". " : ""}${esc(bello(testi[i]))}</b> — ${c.motivo === "uguale" ? "manca il risultato: scrivi <b>=</b> e il tuo risultato." : c.motivo === "risultato" ? "dopo l'<b>=</b> scrivi solo il risultato (un numero)." : "non riesco a capire il conto: controlla i segni."}</div>`);
        if (tutta) segni.push({ tipo: "?", b: tutta, n });
        return;
      }
      const v = rifaiConto(c.espr, c.risultato);
      if (!v) { msg.push(`<div class="lv-m"><b>${n ? n + ". " : ""}${esc(bello(testi[i]))}</b> — questo conto non si può fare (per esempio una divisione per 0).</div>`); return; }
      const chiave = c.espr;
      if (v.giusto) {
        stat.giusti++; delete tentativi[chiave];
        if (tutta) segni.push({ tipo: "ok", b: tutta, n });
        msg.push(`<div class="lv-m ok"><b>${n ? n + ". " : ""}${esc(bello(c.testo))}</b> — ${["Giusto! 🎉", "Perfetto! ✓", "Ottimo lavoro! ✓", "Esatto! 👏"][stat.giusti % 4]}</div>`);
        return;
      }
      stat.sbagliati++; tentativi[chiave] = (tentativi[chiave] || 0) + 1;
      if (tutta) segni.push({ tipo: "no", b: pezzoRisultato(), n });
      let h = `<div class="lv-m no"><b>${n ? n + ". " : ""}${esc(bello(c.testo))}</b> — ${aiuto(c.espr, c.risultato, v.valore)}`;
      if (tentativi[chiave] >= 2) h += soluzione(c.espr, v);
      else h += ` <button class="lv-link" data-sol="${esc(chiave)}">Vedi la soluzione</button>`;
      msg.push(h + "</div>");
    });
    disegnaSegni(); aggiornaStat();
    fumetto(msg.join(""));
    el("lvFumetto").querySelectorAll("[data-sol]").forEach(b => b.onclick = () => { const k = b.dataset.sol, v = rifaiConto(k, "0"); b.outerHTML = v ? soluzione(k, v) : ""; });
  }
  // l'aiuto giusto: dove sta l'errore, senza dire il risultato
  function aiuto(espr, scritto, valore) {
    const m = espr.match(/^(\d+)([+\-×:])(\d+)$/), giusto = formatta(valore), s = String(scritto).replace(/^-/, "");
    const generico = "Quasi! Ricontrolla con calma, poi fai la prova con l'operazione inversa.";
    if (!m || !Number.isInteger(valore) || /,/.test(scritto) || valore < 0) return generico;
    const a = +m[1], op = m[2], b = +m[3], g = String(valore);
    const posto = j => ["unità", "decine", "centinaia", "migliaia", "decine di migliaia", "centinaia di migliaia"][j] || "cifre più a sinistra";
    if (op === ":") {
      if (b === 0) return generico;
      // la divisione in colonna: i "pezzi" del dividendo che si dividono uno dopo l'altro
      const cifre = String(a).split("").map(Number), parziali = []; let r = 0, iniziato = false;
      for (const d of cifre) { r = r * 10 + d; if (r >= b || iniziato) { parziali.push(r); iniziato = true; r = r % b; } }
      if (s.length !== g.length) return `Quasi! Il risultato giusto ha <b>${g.length} ${g.length === 1 ? "cifra" : "cifre"}</b>: ricontrolla quante cifre prendi all'inizio (${parziali[0] || a} : ${b}).`;
      const k = [...s].findIndex((c, i) => c !== g[i]);
      if (k >= 0 && parziali[k] !== undefined) return `Quasi! Ricontrolla la <b>${k + 1}ª cifra</b>: quante volte il <b>${b}</b> sta nel <b>${parziali[k]}</b>?`;
      return generico;
    }
    if (s.length !== g.length) return `Quasi! Il risultato giusto ha <b>${g.length} ${g.length === 1 ? "cifra" : "cifre"}</b>: ricontrolla ${op === "-" ? "i prestiti" : "i riporti"}.`;
    // da destra: la prima colonna sbagliata
    let j = -1; for (let i = 0; i < g.length; i++) if (s[s.length - 1 - i] !== g[g.length - 1 - i]) { j = i; break; }
    if (j < 0) return generico;
    const cA = x => Math.floor(a / 10 ** x) % 10, cB = x => Math.floor(b / 10 ** x) % 10;
    if (op === "+") { const riporto = j > 0 && (a % 10 ** j) + (b % 10 ** j) >= 10 ** j; return `Quasi! Ricontrolla le <b>${posto(j)}</b>: ${cA(j)} + ${cB(j)}${riporto ? " <b>più il riporto</b>" : ""}.`; }
    if (op === "-") { const prestito = j > 0 && (a % 10 ** j) < (b % 10 ** j); return `Quasi! Ricontrolla le <b>${posto(j)}</b>${prestito ? ": ricordati che la cifra a destra ha <b>preso in prestito</b> 1" : ` (${cA(j)} − ${cB(j)})`}.`; }
    if (op === "×" && b < 10) { const riporto = j > 0 && (a % 10 ** j) * b >= 10 ** j; return `Quasi! Ricontrolla le <b>${posto(j)}</b>: ${b} × ${cA(j)}${riporto ? " <b>più il riporto</b>" : ""}.`; }
    if (op === "×" && a < 10) { const riporto = j > 0 && (b % 10 ** j) * a >= 10 ** j; return `Quasi! Ricontrolla le <b>${posto(j)}</b>: ${a} × ${cB(j)}${riporto ? " <b>più il riporto</b>" : ""}.`; }
    return "Quasi! Ricontrolla i prodotti di ogni riga e poi la somma finale.";
  }
  function soluzione(espr, v) {
    const m = espr.match(/^([\d,]+)([+\-×:])([\d,]+)$/);
    const passi = m && typeof passiInColonna === "function" ? passiInColonna(leggiNumero(m[1]), m[2], leggiNumero(m[3])) : null;
    return `<div class="lv-sol"><div class="lv-sol-t">👀 La soluzione, passo passo</div>${passi ? `<ol>${passi.map(p => `<li>${esc(p)}</li>`).join("")}</ol>` : `<p>${esc(bello(espr))} = <b>${esc(v.scritto)}</b></p>`}</div>`;
  }

  // ---------- 📖 LEGGI (parole e frasi) con il cervello che vede ----------
  const cervelloCheVede = () => (window.modelliPresenti || []).find(m => VISIONE.test(m)) || null;
  function immagine() {   // la pagina in nero su bianco, ritagliata intorno alla scrittura (si legge meglio)
    const pag = pagine[pg], tr = pag.tratti.filter(t => t.tipo === "penna" && t.punti.length);
    if (!tr.length) return null;
    const b = Tratti.scatola(tr.map(t => t.punti)), m = 30;
    const x0 = Math.max(0, b.x0 - m), y0 = Math.max(0, b.y0 - m), w = Math.min(LARGO, b.x1 + m) - x0, h = (b.y1 + m) - y0;
    const k = Math.min(2, 1400 / Math.max(w, h)), c = document.createElement("canvas");
    c.width = Math.max(8, Math.round(w * k)); c.height = Math.max(8, Math.round(h * k));
    const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.translate(-x0 * k, -y0 * k);
    for (const t of tr) tratto(g, { ...t, sp: Math.max(3, t.sp) }, k, "bianco", "#000");
    return c.toDataURL("image/png").split(",")[1];
  }
  async function leggiConIlCervello() {
    const vede = cervelloCheVede();
    if (!vede) { fumetto(`<p>Per leggere <b>parole e frasi</b> serve un <b>cervello che vede</b> (consigliato: <code>qwen3-vl:8b</code>). I conti invece li correggo già: tocca <b>✅ Correggi i conti</b>.</p>`); return; }
    const img = immagine();
    if (!img) { fumetto(`<p>La pagina è vuota: scrivi qualcosa e poi tocca <b>📖 Leggi</b>.</p>`); return; }
    // se Fly Aula sta rispondendo in chat, si aspetta: così la scheda video non si riempie
    for (let i = 0; i < 120 && typeof occupato !== "undefined" && occupato; i++) { fumetto(`<p class="lv-lavoro">⏳ Aspetto che Fly Aula finisca la risposta…</p>`); await new Promise(r => setTimeout(r, 500)); }
    fumetto(`<p class="lv-lavoro">📖 Leggo con ${esc(vede)}…</p>`);
    let testo = "";
    try {
      const r = await Scuola.chiama("/api/chat", { method: "POST", body: JSON.stringify({ model: vede, stream: false, keep_alive: 0, options: { temperature: 0, num_ctx: 4096 },
        messages: [{ role: "user", content: "Trascrivi ESATTAMENTE quello che è scritto a mano in questa immagine, riga per riga. NON correggere niente: se un conto è sbagliato, copialo sbagliato. Scrivi solo il testo, senza commenti.", images: [img] }] }) });
      testo = String(((await r.json()).message || {}).content || "").replace(/```[a-z]*|```/g, "").trim();
    } catch (e) { testo = ""; }
    if (!testo) { fumetto(`<p>Non sono riuscito a leggere. Riprova scrivendo un po' più grande.</p>`); return; }
    const c = el("lvConferma");
    c.innerHTML = `<div class="lv-box"><h3>📖 Ho letto così</h3><p class="sotto">Correggi tu se ho letto male.</p><textarea id="lvLetto" rows="5">${esc(testo)}</textarea>
      <div class="riga-btn"><button class="btn" id="lvChiedi">💬 Chiedi a Fly Aula</button><button class="btn sec" id="lvConti">✅ Controlla i conti</button><button class="btn sec" id="lvNo">Chiudi</button></div></div>`;
    c.hidden = false; chiudiFumetto();
    el("lvNo").onclick = () => { c.hidden = true; c.innerHTML = ""; };
    el("lvChiedi").onclick = () => { const t = el("lvLetto").value.trim(); c.hidden = true; c.innerHTML = ""; if (!t) return; chiudi(); if (typeof chiedi === "function") chiedi(t.slice(0, 600)); };
    el("lvConti").onclick = () => {
      const righe = el("lvLetto").value.split(/\n+/).map(x => x.trim()).filter(x => /\d/.test(x) && /=/.test(x)).slice(0, 12);
      c.hidden = true; c.innerHTML = "";
      if (!righe.length) { fumetto(`<p>Non ho trovato conti con l'<b>=</b> nel testo letto.</p>`); return; }
      conferma(righe.map(t => ({ testo: t })), true);
    };
  }

  // ---------- 💾 salvare la pagina come immagine ----------
  function salvaImmagine() {
    const a = document.createElement("a"); a.download = `lavagna-pagina-${pg + 1}.png`;
    tela.toBlob(b => { if (!b) return; a.href = URL.createObjectURL(b); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); });
  }

  // ---------- aprire e chiudere ----------
  function apri() {
    if (!tela) collega2();
    aperta = true; el("pLavagna").classList.add("aperta");
    el("lvLeggi").title = cervelloCheVede() ? "Leggi parole e frasi con " + cervelloCheVede() : "Per leggere parole e frasi serve un cervello che vede (es. qwen3-vl:8b)";
    requestAnimationFrame(misura);
  }
  function chiudi() { aperta = false; el("pLavagna").classList.remove("aperta"); el("lvConferma").hidden = true; salva(); }
  function collega2() {
    tela = el("lvTela"); ctx = tela.getContext("2d"); sopra = el("lvSegni"); sctx = sopra.getContext("2d");
    tela.addEventListener("pointerdown", giu); tela.addEventListener("pointermove", muovi);
    tela.addEventListener("pointerup", su); tela.addEventListener("pointercancel", su);
    tela.addEventListener("contextmenu", e => e.preventDefault());
    new ResizeObserver(() => aperta && misura()).observe(el("lvFoglio"));
  }
  function collega() {
    if (!el("pLavagna")) return;
    carica();
    el("apriLavagna").onclick = apri; el("lvChiudi").onclick = chiudi;
    document.querySelectorAll("#pLavagna [data-str]").forEach(b => b.onclick = () => { strumento = b.dataset.str; document.querySelectorAll("#pLavagna [data-str]").forEach(x => x.classList.toggle("on", x === b)); tela.style.cursor = strumento === "gomma" ? "cell" : "crosshair"; });
    document.querySelectorAll("#pLavagna [data-col]").forEach(b => b.onclick = () => { colore = b.dataset.col; document.querySelectorAll("#pLavagna [data-col]").forEach(x => x.classList.toggle("on", x === b)); if (strumento === "gomma") document.querySelector('#pLavagna [data-str="penna"]').click(); });
    document.querySelectorAll("#pLavagna [data-sp]").forEach(b => b.onclick = () => { spessore = +b.dataset.sp; document.querySelectorAll("#pLavagna [data-sp]").forEach(x => x.classList.toggle("on", x === b)); });
    el("lvAnnulla").onclick = indietro; el("lvRipeti").onclick = avanti;
    el("lvPulisci").onclick = e => { const b = e.currentTarget; if (!pagine[pg].tratti.length) return; if (b.dataset.sicuro !== "1") { b.dataset.sicuro = "1"; b.textContent = "Sicuro?"; setTimeout(() => { b.dataset.sicuro = ""; b.textContent = "🗑️"; }, 2500); return; } b.dataset.sicuro = ""; b.textContent = "🗑️"; pulisci(); };
    el("lvPrima").onclick = () => vaiPagina(pg - 1); el("lvDopo").onclick = () => vaiPagina(pg + 1); el("lvNuova").onclick = nuovaPagina;
    el("lvSfondo").onclick = cambiaSfondo; el("lvCorreggi").onclick = correggi; el("lvLeggi").onclick = leggiConIlCervello; el("lvSalva").onclick = salvaImmagine;
    document.addEventListener("keydown", e => {
      if (!aperta) return;
      if (e.key === "Escape") { if (!el("lvConferma").hidden) { el("lvConferma").hidden = true; el("lvConferma").innerHTML = ""; } else chiudi(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") { e.preventDefault(); e.shiftKey ? avanti() : indietro(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y" && e.target.tagName !== "INPUT") { e.preventDefault(); avanti(); }
    });
  }
  return { collega, apri, chiudi, correggi, aiuto, get pagine() { return pagine; }, get pagina() { return pg; }, get segni() { return segni; }, get aperta() { return aperta; }, stat };
})();
Lavagna.collega();
