// ===================================================================
//  FLY AULA · 🏆 gara a squadre alla LIM
//  Le domande e i risultati li calcola Fly Aula con la calcolatrice
//  (per Inglese: parole di una lista controllata), quindi ZERO errori.
//  Turni alternati; se una squadra sbaglia, l'altra può "rubare" il punto.
// ===================================================================
const PAROLE_INGLESE = [
  ["mela", "apple"], ["cane", "dog"], ["gatto", "cat"], ["casa", "house|home"], ["libro", "book"], ["scuola", "school"], ["acqua", "water"], ["rosso", "red"],
  ["verde", "green"], ["giallo", "yellow"], ["sole", "sun"], ["luna", "moon"], ["pane", "bread"], ["latte", "milk"], ["bicicletta", "bike|bicycle"], ["finestra", "window"],
  ["porta", "door"], ["amico", "friend"], ["famiglia", "family"], ["lavoro", "job|work"], ["tempo (meteo)", "weather"], ["domani", "tomorrow"], ["ieri", "yesterday"],
  ["sempre", "always"], ["mai", "never"], ["comprare", "buy|to buy"], ["vendere", "sell|to sell"], ["prezzo", "price"], ["negozio", "shop|store"], ["fattura", "invoice"],
  ["azienda", "company|firm|business"], ["guadagno", "profit|gain|earnings"], ["viaggio", "trip|journey|travel"], ["biglietto", "ticket"], ["albergo", "hotel"],
  ["stazione", "station"], ["aeroporto", "airport"], ["spiaggia", "beach"], ["montagna", "mountain"], ["città", "city|town"], ["lunedì", "monday"], ["venerdì", "friday"],
  ["preventivo", "estimate|quote|quotation"], ["consegna", "delivery"], ["magazzino", "warehouse"], ["cliente", "customer|client"], ["fornitore", "supplier"],
  ["sconto", "discount"], ["spedizione", "shipment|shipping"], ["riunione", "meeting"], ["colloquio di lavoro", "job interview|interview"], ["stipendio", "salary|wage"],
  ["inverno", "winter"], ["estate", "summer"], ["felice", "happy"], ["stanco", "tired"], ["veloce", "fast|quick"], ["lento", "slow"], ["grande", "big|large"], ["piccolo", "small|little"]
];
const VERBI_IRREGOLARI = [["go", "went"], ["eat", "ate"], ["see", "saw"], ["buy", "bought"], ["take", "took"], ["make", "made"], ["write", "wrote"], ["speak", "spoke"],
  ["think", "thought"], ["bring", "brought"], ["choose", "chose"], ["pay", "paid"], ["sell", "sold"], ["send", "sent"], ["begin", "began"], ["drink", "drank"], ["come", "came"], ["know", "knew"]];
const Gara = (() => {
  const el = id => document.getElementById(id);
  let st = null, timer = null;
  const SUONI = (() => { let ctx = null; const nota = (f, t, d = .14) => { try { ctx = ctx || new AudioContext(); const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f; o.type = "triangle"; g.gain.setValueAtTime(.18, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + t + d); o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + d); } catch (e) {} };
    return { si: () => { nota(660, 0); nota(880, .12); nota(1320, .24, .25); }, no: () => { nota(220, 0, .3); }, fine: () => [523, 659, 784, 1046].forEach((f, i) => nota(f, i * .13, .3)) }; })();

  function domanda(materia, livello) {
    if (materia === "inglese") {
      if (livello !== "elementari" && Math.random() < .4) {
        const [inf, past] = scegli(VERBI_IRREGOLARI);
        return { d: `Qual è il <b>past simple</b> di "to ${escC(inf)}"?`, testo: true, accettate: past.split("|"), mostra: past.split("|")[0] };
      }
      const [it, en] = scegli(PAROLE_INGLESE);
      return { d: `Come si dice <b>"${escC(it)}"</b> in inglese?`, testo: true, accettate: en.split("|"), mostra: en.split("|")[0] };
    }
    const nomi = categoriePer(materia, livello, el("classe").value, "");
    const e = CATEGORIE[scegli(nomi)]();
    return { d: escC(e.d), r: e.r, mostra: formatta(e.r) };
  }
  const giusta = (q, x) => q.testo ? q.accettate.some(a => a.toLowerCase() === String(x).trim().toLowerCase().replace(/^(to |the |a |an )/, "") || a.toLowerCase() === String(x).trim().toLowerCase())
    : giusto(leggiNumero(String(x).replace(/[^\d.,\-]/g, "")), q.r);

  function apri() {
    el("pGara").style.display = "block";
    el("garaCorpo").innerHTML = `
      <div class="gara-setup">
        <div class="squadre-in"><label>Squadra 1<input id="gNomeA" value="🔴 Rossi" maxlength="18"></label><label>Squadra 2<input id="gNomeB" value="🔵 Blu" maxlength="18"></label></div>
        <div class="riga-btn"><label>Domande per squadra <select class="pill" id="gN"><option>3</option><option selected>5</option><option>8</option></select></label>
        <label>Tempo <select class="pill" id="gT"><option value="30">30 s</option><option value="60" selected>60 s</option><option value="90">90 s</option><option value="0">senza tempo</option></select></label></div>
        <p class="nota-s">Materia: <b>${escC(MATERIE[el("materia").value].nome)}</b> · livello <b>${escC(el("livello").value)}</b>. I risultati li calcola la calcolatrice: zero errori.</p>
        <div class="riga-btn"><button class="btn" id="gVia">🏁 Si parte!</button><button class="btn sec" id="gChiudi1">Chiudi</button></div>
      </div>`;
    el("gVia").onclick = () => parti(el("gNomeA").value.trim() || "Squadra 1", el("gNomeB").value.trim() || "Squadra 2", +el("gN").value, +el("gT").value);
    el("gChiudi1").onclick = chiudi;
  }
  function chiudi() { clearInterval(timer); st = null; el("pGara").style.display = "none"; }
  function parti(a, b, n, t) {
    if (window.conta) conta("gare");
    st = { nomi: [a, b], punti: [0, 0], turno: 0, fatte: 0, totali: n * 2, tempo: t, materia: el("materia").value, livello: el("livello").value };
    nuovaDomanda();
  }
  function tabellone() {
    return `<div class="tabellone">${[0, 1].map(k => `<div class="sq sq${k} ${st.turno === k ? "tocca" : ""}"><span>${escC(st.nomi[k])}</span><b id="pt${k}">${st.punti[k]}</b></div>`).join(`<div class="vs">${st.fatte + 1 > st.totali ? st.totali : st.fatte + 1}/${st.totali}</div>`)}</div>`;
  }
  function nuovaDomanda() {
    if (st.fatte >= st.totali) return finale();
    st.q = domanda(st.materia, st.livello); st.ruba = false;
    disegnaDomanda();
  }
  function disegnaDomanda() {
    clearInterval(timer);
    el("garaCorpo").innerHTML = `${tabellone()}
      <div class="gara-q"><div class="gara-chi">${st.ruba ? "🔁 Ruba il punto: " : "Tocca a "}<b>${escC(st.nomi[st.turno])}</b></div>
        <h2>${st.q.d}</h2>
        ${st.tempo ? `<div class="gara-tempo"><div id="gBarra"></div></div>` : ""}
        <form id="gForm" class="gara-risp"><input id="gRisp" autocomplete="off" placeholder="Risposta" ${st.q.testo ? "" : 'inputmode="decimal"'}><button class="btn">Rispondi</button></form>
        <div id="gEsito"></div></div>
      <div class="riga-btn"><button class="btn sec" id="gChiudi2">Chiudi la gara</button></div>`;
    el("gChiudi2").onclick = chiudi;
    el("gRisp").focus();
    el("gForm").onsubmit = e => { e.preventDefault(); if (el("gRisp").value.trim()) rispondi(el("gRisp").value); };
    if (st.tempo) {
      const fine = Date.now() + (st.ruba ? Math.ceil(st.tempo / 2) : st.tempo) * 1000, durata = fine - Date.now();
      timer = setInterval(() => {
        const resta = fine - Date.now();
        const b = el("gBarra"); if (b) { b.style.width = Math.max(0, 100 * resta / durata) + "%"; b.classList.toggle("poco", resta < 10000); }
        if (resta <= 0) { clearInterval(timer); rispondi(null); }
      }, 100);
    }
  }
  function rispondi(x) {
    clearInterval(timer);
    const ok = x !== null && giusta(st.q, x);
    const esito = el("gEsito"); el("gForm").querySelectorAll("input,button").forEach(i => i.disabled = true);
    if (ok) {
      st.punti[st.turno]++; SUONI.si(); coriandoli(el("pGara"), 60);
      esito.innerHTML = `<div class="g-si">🎉 GIUSTO! +1 a ${escC(st.nomi[st.turno])} · ${escC(st.q.mostra)}</div><button class="btn" id="gAvanti">Avanti ▶</button>`;
      const pt = el("pt" + st.turno); pt.textContent = st.punti[st.turno]; pt.classList.remove("salta"); void pt.offsetWidth; pt.classList.add("salta");
      prossimo();
    } else if (!st.ruba) {
      SUONI.no();
      st.ruba = true; st.turno = 1 - st.turno;
      esito.innerHTML = `<div class="g-no">${x === null ? "⏰ Tempo scaduto!" : "❌ Sbagliato!"} Palla a <b>${escC(st.nomi[st.turno])}</b> per rubare il punto…</div>`;
      setTimeout(() => st && disegnaDomanda(), 1600);
      return;
    } else {
      SUONI.no();
      esito.innerHTML = `<div class="g-no">${x === null ? "⏰ Tempo scaduto!" : "❌ Sbagliato!"} La risposta giusta era <b>${escC(st.q.mostra)}</b></div><button class="btn" id="gAvanti">Avanti ▶</button>`;
      prossimo();
    }
  }
  function prossimo() {
    // la domanda n tocca sempre alla squadra n % 2 (anche dopo un "ruba")
    st.fatte++;
    st.turno = st.fatte % 2;
    el("gAvanti").onclick = nuovaDomanda; el("gAvanti").focus();
  }
  function finale() {
    const [a, b] = st.punti, vince = a === b ? -1 : a > b ? 0 : 1;
    SUONI.fine(); coriandoli(el("pGara"), 160);
    el("garaCorpo").innerHTML = `<div class="gara-fine"><div class="rip-trofeo">${vince < 0 ? "🤝" : "🏆"}</div>
      <h1>${vince < 0 ? "Pareggio!" : "Vince " + escC(st.nomi[vince]) + "!"}</h1>
      <div class="tabellone fine">${[0, 1].map(k => `<div class="sq sq${k} ${k === vince ? "tocca" : ""}"><span>${escC(st.nomi[k])}</span><b>${st.punti[k]}</b></div>`).join('<div class="vs">–</div>')}</div>
      <div class="riga-btn" style="justify-content:center"><button class="btn" id="gAncora">🔁 Rivincita</button><button class="btn sec" id="gChiudi3">Chiudi</button></div></div>`;
    const nomi = st.nomi, n = st.totali / 2, t = st.tempo;
    el("gAncora").onclick = () => parti(nomi[0], nomi[1], n, t);
    el("gChiudi3").onclick = chiudi;
  }
  return { apri, chiudi, stato: () => st };
})();
