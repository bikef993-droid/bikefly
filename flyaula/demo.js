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
        <div style="animation-delay:.1s"><span>🧮</span><b>Prima i conti</b><p>I numeri li fa una calcolatrice vera, prima che Fly Aula scriva.</p></div><i>→</i>
        <div style="animation-delay:.4s"><span>✍️</span><b>Scrive</b><p>La spiegazione compare subito, passo passo, con i disegni.</p></div><i>→</i>
        <div style="animation-delay:.7s"><span>🤝</span><b>Un secondo cervello</b><p>Un'altra AI, di un'altra azienda, rilegge tutto: passaggi, regole, fatti.</p></div><i>→</i>
        <div style="animation-delay:1s"><span>🔎</span><b>Controllo 3</b><p>Nei casi difficili un terzo controllo, ragionando con calma.</p></div></div>
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
    () => `<h2>Pronta per tutta la scuola</h2><div class="demo-carte quattro">
        <div><span>🏫</span><b>Un server per tutte le LIM</b><p>Un computer della scuola fa da cervello per ogni aula. Se si ferma, le LIM passano da sole a quello di riserva.</p></div>
        <div><span>⚡</span><b>Memoria della scuola</b><p>Una domanda già controllata in un'aula, nelle altre arriva in un secondo.</p></div>
        <div><span>⏳</span><b>Mai un'attesa muta</b><p>Se tante classi chiedono insieme, ogni LIM dice "sei il 2° in fila".</p></div>
        <div><span>🛟</span><b>Mai bloccata</b><p>Se un cervello non risponde, risponde l'altro. Il prof può sempre fermare con ⏹.</p></div></div>`,
    () => { let k = 0; return `<h2>Le materie: ${Object.keys(MATERIE).length}</h2>${(typeof GRUPPI_MATERIE !== "undefined" ? GRUPPI_MATERIE : [["", Object.keys(MATERIE)]]).map(([g, ks]) =>
      `${g ? `<h3 class="demo-gruppo">${g}</h3>` : ""}<div class="demo-materie">${ks.filter(c => MATERIE[c]).map(c => `<div style="animation-delay:${(k++ * 0.04).toFixed(2)}s"><span>${MATERIE[c].emoji}</span><b>${MATERIE[c].nome}</b></div>`).join("")}</div>`).join("")}
      <p class="demo-piccolo" style="margin-top:18px">In ogni materia, con le pagine del libro fotografate dal prof, Fly Aula segue proprio il libro della classe. Con l'orario si accende da sola sulla materia giusta.</p>`; },
    () => `<div class="demo-cover">${LOGO}<h1>Proviamo dal vivo?</h1><p class="demo-grande">Un percorso di 5 minuti, oppure fate voi una domanda.</p>
      <div class="demo-scelte"><button class="btn demo-prova" id="demoGuida">🎬 Percorso guidato dal vivo</button><button class="btn sec demo-prova" id="demoProva">✋ Fate voi una domanda</button></div></div>`
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
    const guida = el("demoGuida"); if (guida) guida.onclick = () => { chiudi(); Guida.apri(); };
  }
  const tasti = e => { if (el("pDemo").style.display !== "flex") return; if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); avanti(); } if (e.key === "ArrowLeft") indietro(); if (e.key === "Escape") chiudi(); };
  function avanti() { if (i < SLIDE.length - 1) { i++; mostra(); } else chiudi(); }
  function indietro() { if (i > 0) { i--; mostra(); } }
  function apri() { i = 0; el("pDemo").style.display = "flex"; mostra(); try { document.documentElement.requestFullscreen?.().catch(() => {}); } catch (e) {} }
  function chiudi() { clearInterval(timerScrivi); el("pDemo").style.display = "none"; el("demoSlide").innerHTML = ""; }
  function collega() { el("demoAvanti").onclick = avanti; el("demoIndietro").onclick = indietro; el("demoEsci").onclick = chiudi; addEventListener("keydown", tasti); }
  return { apri, chiudi, collega, get pagina() { return i; } };
})();

// ===================================================================
//  🎬 IL PERCORSO GUIDATO DAL VIVO
//  Una scheda accanto alla lavagna: per ogni passo, cosa dire alla preside
//  e un pulsante che fa la domanda VERA a Fly Aula (niente di preparato).
// ===================================================================
const Guida = (() => {
  const el = id => document.getElementById(id);
  const PASSI = [
    { titolo: "Un conto alla lavagna", materia: "matematica", domanda: "Fammi 320 : 8 in colonna",
      dire: "Facciamo una domanda vera. Fly Aula disegna la divisione in colonna, la spiega passo passo e una calcolatrice controlla ogni numero: guardate i ✓ verdi." },
    { titolo: "Un problema con i soldi", materia: "matematica", domanda: "Una bici costa 480 €. Il negozio fa lo sconto del 15% e poi aggiunge l'IVA al 22%. Quanto paga il cliente?",
      dire: "Un problema più difficile. I conti li fa prima la calcolatrice, poi Fly Aula spiega, e un secondo cervello di un'altra azienda ricontrolla tutto." },
    { titolo: "La stessa domanda, in un'altra classe", materia: "matematica", domanda: "Fammi 320 : 8 in colonna", nuova: true,
      dire: "Facciamo finta di essere in un'altra aula, con la stessa domanda: la risposta già controllata arriva in un secondo. Con 54 classi succede di continuo." },
    { titolo: "Economia aziendale", materia: "economia", domanda: "Registra in partita doppia l'acquisto di merci per 2.000 € più IVA al 22%, pagato con bonifico bancario",
      dire: "La partita doppia: Fly Aula disegna la scrittura in tabella e controlla da sola che il totale Dare sia uguale al totale Avere." },
    { titolo: "Inglese, anche per chi è appena arrivato", materia: "inglese", domanda: "Spiegami la differenza tra present perfect e past simple", lingua: "ar",
      dire: "Spiega in italiano semplice. E per un alunno straniero appena arrivato, la stessa spiegazione compare anche nella sua lingua: qui in arabo." },
    { titolo: "Un esercizio per la classe", materia: "matematica", esercizio: true,
      dire: "Fly Aula inventa un esercizio nuovo, lo controlla 3 volte, e la classe prova a risolverlo. Le verifiche A e B si preparano allo stesso modo." },
    { titolo: "Senza internet", materia: "matematica", domanda: "Quanto fa 1.248 : 6?", nota: "Prima di toccare il pulsante, staccate il Wi-Fi o il cavo di rete di questo computer.",
      dire: "Ora stacchiamo internet. Fly Aula continua a funzionare, perché il cervello è qui dentro: le domande dei ragazzi non escono mai dalla scuola." }
  ];
  let k = 0, occupata = false;
  function disegna() {
    const p = PASSI[k];
    el("guida").innerHTML = `<div class="gd-testa"><span>🎬 Passo ${k + 1} di ${PASSI.length}</span><button class="gd-x" id="gdChiudi" title="Chiudi il percorso">✕</button></div>
      <h3>${p.titolo}</h3>
      <div class="gd-dire"><b>🗣️ Cosa dire</b><p>${p.dire}</p></div>
      ${p.nota ? `<div class="gd-nota">⚠️ ${p.nota}</div>` : ""}
      ${p.domanda ? `<div class="gd-domanda">“${p.domanda}”</div>` : ""}
      <div class="gd-bottoni"><button class="btn" id="gdVai"${occupata ? " disabled" : ""}>${p.esercizio ? "✏️ Crea l'esercizio" : "▶ Fai la domanda"}</button>
        <button class="btn sec" id="gdIndietro"${k === 0 ? " disabled" : ""}>◀</button><button class="btn sec" id="gdAvanti">${k === PASSI.length - 1 ? "Fine ✓" : "Avanti ▶"}</button></div>`;
    el("gdChiudi").onclick = chiudi;
    el("gdIndietro").onclick = () => { if (k > 0) { k--; disegna(); } };
    el("gdAvanti").onclick = () => { if (k < PASSI.length - 1) { k++; disegna(); } else chiudi(); };
    el("gdVai").onclick = esegui;
  }
  async function esegui() {
    const p = PASSI[k];
    if (occupata) return;
    occupata = true; disegna();
    try {
      if (el("materia").value !== p.materia) { el("materia").value = p.materia; await nuovaLezione(true); }
      else if (p.nuova) await nuovaLezione(false);
      const lingua = el("lingua"), primaLingua = lingua.value;
      if (p.lingua) lingua.value = p.lingua;
      if (p.esercizio) await nuovoEsercizio(); else await chiedi(p.domanda);
      lingua.value = primaLingua;
    } catch (e) {}
    occupata = false; disegna();
  }
  function apri() { k = 0; el("guida").style.display = "block"; document.body.classList.add("con-guida"); disegna(); }
  function chiudi() { el("guida").style.display = "none"; document.body.classList.remove("con-guida"); }
  return { apri, chiudi, get passo() { return k; }, get occupata() { return occupata; } };
})();
