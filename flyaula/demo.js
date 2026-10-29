// ===================================================================
//  FLY AULA · 🎬 presentazione per la preside
//  5 minuti, senza sorprese: esempi PREPARATI (e lo diciamo chiaramente),
//  disegnati con la vera lavagna di Fly Aula. Alla fine: si prova dal vivo.
// ===================================================================
const Demo = (() => {
  const el = id => document.getElementById(id);
  let i = 0, timerScrivi = null;
  const ETICHETTA = `<div class="demo-etichetta">Esempio preparato per la presentazione · poi lo proviamo dal vivo</div>`;
  const LOGO = `<svg width="150" height="108" viewBox="25 60 250 160" aria-hidden="true" class="logo"><circle cx="100" cy="140" r="70" fill="none" stroke="#00D2A0" stroke-width="16"/><circle cx="200" cy="140" r="70" fill="none" stroke="#3B8BFF" stroke-width="16"/><path d="M100 140 L150 70 L200 140 Z" fill="none" stroke="#F3F6FB" stroke-width="8" stroke-linejoin="round"/><circle class="neu" cx="100" cy="140" r="14" fill="#F3F6FB"/><circle class="neu" cx="150" cy="70" r="14" fill="#FFD23F"/><circle class="neu" cx="200" cy="140" r="14" fill="#F3F6FB"/></svg>`;
  const SLIDE = [
    () => `<div class="demo-cover">${LOGO}<h1>Fly<b>Aula</b></h1><p class="demo-grande">L'assistente della classe che <b>resta in classe</b>.</p><p class="demo-motto">Local AI. Your data never leaves the room.</p></div>`,
    () => `<h2>Il problema</h2><div class="demo-carte">
        <div><span>🌐</span><b>I dati dei ragazzi</b><p>Le AI online mandano domande e voci su server lontani, spesso fuori dall'Europa.</p></div>
        <div><span>🤖</span><b>Gli errori</b><p>Un'AI che sbaglia un conto alla lavagna fa perdere fiducia a tutta la classe.</p></div>
        <div><span>🧩</span><b>La complessità</b><p>Account, password, abbonamenti: i prof non hanno tempo da perdere.</p></div></div>`,
    () => `<h2>Una domanda, alla LIM</h2>
      <div class="msg io demo-msg"><div class="bolla" id="demoDomanda"></div></div>
      <div class="msg ai demo-msg"><div class="chi">🧠 Fly Aula</div><div class="bolla" id="demoRisposta"></div></div>${ETICHETTA}`,
    () => `<h2>Ogni risposta controllata 2 volte, 3 nei casi difficili</h2><div class="demo-passi">
        <div style="animation-delay:.1s"><span>✍️</span><b>Scrive</b><p>La risposta compare subito, passo passo.</p></div><i>→</i>
        <div style="animation-delay:.4s"><span>🧮</span><b>Controllo 1</b><p>Una calcolatrice vera rifà ogni conto.</p></div><i>→</i>
        <div style="animation-delay:.7s"><span>🔍</span><b>Controllo 2</b><p>Un revisore rilegge tutto: passaggi, regole, fatti.</p></div><i>→</i>
        <div style="animation-delay:1s"><span>🔎</span><b>Controllo 3</b><p>Nei casi difficili rifà il problema da capo.</p></div></div>
      <p class="demo-grande" style="margin-top:28px">Se resta un dubbio, Fly Aula <b>non inventa</b>: scrive "⚠️ controlliamo con il prof".</p>
      <p class="demo-piccolo">Ogni errore trovato finisce nella tabella degli errori, e Fly Aula ha un esame di 200 domande per misurare quanto sbaglia.</p>`,
    () => `<h2>Per i professori</h2><div class="demo-carte quattro">
        <div><span>👩‍🏫</span><b>Pannello con PIN</b><p>Argomento di oggi, "spiega senza dare il risultato", parole vietate.</p></div>
        <div><span>📄</span><b>Verifiche in 2 minuti</b><p>Fila A e B con numeri diversi, soluzioni a parte. Ogni esercizio controllato 3 volte. Decide sempre il prof.</p></div>
        <div><span>📷</span><b>Le pagine del libro</b><p>Il prof fotografa 3 pagine col telefono: Fly Aula risponde usando il libro di quella lezione.</p></div>
        <div><span>📝</span><b>Modalità verifica</b><p>Durante i compiti in classe Fly Aula si blocca. Si sblocca solo col PIN.</p></div></div>`,
    () => `<h2>Per tutti gli alunni</h2><div class="demo-due"><div>${disegna("mappa Frazioni | Numeratore: le parti prese | Denominatore: le parti totali | Esempio: 3/4 della pizza") || ""}<p class="demo-piccolo">🧩 Modalità DSA: frasi brevi, carattere leggibile, lettura ad alta voce riga per riga, mappa concettuale.</p></div>
      <div class="demo-carte verticale"><div><span>🌍</span><b>Alunni stranieri</b><p>La spiegazione anche in inglese, arabo, cinese, spagnolo… con la traduzione controllata.</p></div>
      <div><span>🏆</span><b>Gara a squadre</b><p>Rossi contro Blu, punti, tempo e "ruba il punto". Risultati calcolati: zero errori.</p></div>
      <div><span>🔁</span><b>Ripasso e riassunto</b><p>Domande di fine lezione e riassunto stampabile per chi era assente.</p></div></div></div>${ETICHETTA}`,
    () => `<h2>Privacy, per davvero</h2><div class="demo-lista">
        <div>🔒 Il cervello gira <b>su questo computer</b>: le domande non vanno su internet.</div>
        <div>👤 <b>Nessun account</b> per gli alunni, nessun nome salvato.</div>
        <div>📷 Le foto delle pagine si <b>cancellano a fine lezione</b>.</div>
        <div>📈 Alla scuola arriva un report <b>solo di numeri</b>.</div>
        <div>⚖️ Fly Aula <b>aiuta</b> la lezione: non dà voti e non valuta gli alunni. Il prof decide sempre.</div></div>`,
    () => `<div class="demo-cover">${LOGO}<h1>Proviamo dal vivo?</h1><p class="demo-grande">Fate voi una domanda a Fly Aula.</p><button class="btn demo-prova" id="demoProva">▶️ Prova adesso</button></div>`
  ];
  function scriviDomanda(testo, poi) {
    const d = el("demoDomanda"); let k = 0;
    clearInterval(timerScrivi);
    timerScrivi = setInterval(() => { if (!d) return clearInterval(timerScrivi); d.textContent = testo.slice(0, ++k); if (k >= testo.length) { clearInterval(timerScrivi); setTimeout(poi, 400); } }, 45);
  }
  function rispostaPreparata() {
    const r = el("demoRisposta"); if (!r) return;
    const testo = "Facciamo 320 : 8 insieme! 🍕\n1. Immagina 320 € da dividere tra 8 amici.\n[DISEGNO: divisione 320 8]\n2. Prima dividiamo 32 decine: 32 : 8 = 4\n3. Quindi 320 : 8 = 40\n4. Prova: 40 × 8 = 330\nDomanda per la classe: quanto fa 160 : 8?";
    const righe = testo.split("\n"); let k = 0;
    const passo = () => {
      if (!el("demoRisposta")) return;
      if (k < righe.length) { r.innerHTML = impagina(righe.slice(0, ++k).join("\n"), false); setTimeout(passo, 380); return; }
      r.classList.add("controllo");
      r.insertAdjacentHTML("beforeend", `<div class="lavoro" id="demoLav">🧮 Controllo 1: la calcolatrice rifà i conti…</div>`);
      setTimeout(() => { const l = el("demoLav"); if (l) l.textContent = "🔍 Controllo 2: rileggo tutto da revisore…"; }, 1300);
      setTimeout(() => { const l = el("demoLav"); if (l) l.textContent = "🔎 Controllo 3: lo rifaccio da capo per sicurezza…"; }, 2500);
      setTimeout(() => {
        if (!el("demoRisposta")) return;
        r.classList.remove("controllo");
        r.innerHTML = impagina(testo, true) + `<div class="timbri"><span class="timbro giallo">🔁 Corretta e ricontrollata 3 volte ✓✓✓</span><span class="timbro giallo">🧮 1 conto corretto dalla calcolatrice</span></div>`;
      }, 3700);
    };
    passo();
  }
  function mostra() {
    clearInterval(timerScrivi);
    el("demoSlide").innerHTML = `<div class="demo-pag" style="animation:entra .45s both">${SLIDE[i]()}</div>`;
    el("demoPunti").innerHTML = SLIDE.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("");
    el("demoIndietro").disabled = i === 0;
    el("demoAvanti").textContent = i === SLIDE.length - 1 ? "Fine" : "Avanti ▶";
    if (i === 2) scriviDomanda("Fammi 320 : 8 passo passo", rispostaPreparata);
    const prova = el("demoProva"); if (prova) prova.onclick = () => { chiudi(); setTimeout(() => el("domanda").focus(), 100); };
  }
  const tasti = e => { if (el("pDemo").style.display !== "flex") return; if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); avanti(); } if (e.key === "ArrowLeft") indietro(); if (e.key === "Escape") chiudi(); };
  function avanti() { if (i < SLIDE.length - 1) { i++; mostra(); } else chiudi(); }
  function indietro() { if (i > 0) { i--; mostra(); } }
  function apri() { i = 0; el("pDemo").style.display = "flex"; mostra(); try { document.documentElement.requestFullscreen?.().catch(() => {}); } catch (e) {} }
  function chiudi() { clearInterval(timerScrivi); el("pDemo").style.display = "none"; el("demoSlide").innerHTML = ""; }
  function collega() { el("demoAvanti").onclick = avanti; el("demoIndietro").onclick = indietro; el("demoEsci").onclick = chiudi; addEventListener("keydown", tasti); }
  return { apri, chiudi, collega, get pagina() { return i; } };
})();
