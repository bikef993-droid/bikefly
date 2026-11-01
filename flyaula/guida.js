// ===================================================================
//  FLY AULA · ❓ GUIDE PASSO PASSO (per i prof) e 🖊️ INTRODUZIONE ALLA LAVAGNA
//  Un fumetto alla volta, con il "buco" che illumina il bottone giusto.
//  La lavagna la spiega da sola la prima volta che si apre; tutto si riapre da Menu → ❓ Guida.
// ===================================================================
const Tutorial = (() => {
  const el = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const apriMenu = () => el("menu").classList.add("aperto"), chiudiMenu = () => el("menu").classList.remove("aperto");
  // passo: [selettore o null (fumetto al centro), testo, prima?]
  const GIRI = {
    lavagna: { titolo: "🖊️ La lavagna smart", prima: () => { if (!Lavagna.aperta) Lavagna.apri(); }, passi: [
      [null, "<b>Benvenuti nella lavagna smart!</b> 🖊️<br>Si scrive con la penna della LIM, con il dito o con il mouse. E Fly Aula <b>corregge i conti scritti a mano</b>."],
      ['#pLavagna [data-str="penna"]', "✏️ <b>Penna</b>, 🖍️ <b>evidenziatore</b> e 🧽 <b>gomma</b>. La gomma cancella un tratto intero: basta passarci sopra."],
      ['#pLavagna [data-col="auto"]', "🎨 I <b>colori</b>. Il primo è bianco sulla lavagna scura e nero su quella chiara."],
      ['#pLavagna [data-sp="4"]', "Lo <b>spessore</b>: sottile, medio, grosso."],
      ["#lvAnnulla", "↶ <b>Annulla</b> e ↷ <b>Rifai</b> (anche Ctrl+Z). 🗑️ pulisce la pagina, ma prima chiede «Sicuro?»."],
      ["#lvNum", "📄 Le <b>pagine</b>: ‹ › per sfogliare, ＋ per una nuova. ▦ cambia lo sfondo: scuro, <b>quadretti</b>, righe, bianco."],
      ["#lvCorreggi", "✅ <b>Il bello:</b> scrivete un conto, una riga per conto (es. <b>345 : 5 = 69</b>) e toccate qui.<br>Fly Aula chiede «<b>Ho letto bene?</b>», poi la <b>calcolatrice</b> controlla: ✓ verde se è giusto, un cerchietto arancione e un <b>aiuto</b> se è sbagliato. Al 2° tentativo, la soluzione passo passo."],
      ["#lvLeggi", "📖 <b>Leggi</b>: parole e frasi le legge il cervello che vede. Poi potete mandarle come domanda a Fly Aula."],
      ["#lvSalva", "💾 Salva la pagina come <b>immagine</b>. La lavagna resta salvata anche se si chiude. ✕ (o Esc) per tornare alla chat.<br><b>Buon lavoro!</b> Questa guida si riapre con ❓."]
    ] },
    flyaula: { titolo: "🚀 Fly Aula in 2 minuti", prima: chiudiMenu, passi: [
      [null, "<b>Fly Aula in 2 minuti</b> 🚀<br>Un giro veloce di tutto quello che c'è. Si può interrompere quando volete con «Salta»."],
      ["#domanda", "✍️ Qui la classe <b>scrive</b> (o tocca 🎤 e <b>parla</b>). Ogni risposta è controllata più volte: i conti dalla calcolatrice, date e nomi dai fatti sicuri."],
      ["#apriLavagna", "🖊️ La <b>lavagna</b>: si scrive a mano e Fly Aula corregge i conti."],
      ["#apriEsercizi", "✏️ <b>Esercizi</b> per la classe, già controllati."],
      ["#apriPagine", "📷 <b>Pagine</b>: il prof fotografa il libro con il telefono e Fly Aula risponde usando quelle pagine."],
      ["#apriGaraTop", "🏆 <b>Gara</b> a squadre tra i banchi."],
      ["#apriClasse", "⚙️ <b>Classe</b>: classe, materia, livello, <b>DSA</b>, alunni stranieri."],
      ["#apriProf", "👩‍🏫 <b>Pannello del prof</b> (con il PIN): verifica in 3 file, lezione pronta, UDA, aiuto a correggere, archivio, argomenti bloccati, modalità «solo domande guida».", apriMenu],
      ["#apriAttivita", "🎲 <b>Attività</b>: dove sbaglio, trova l'errore, intervista a un personaggio, glossario, fattura, viaggio, INVALSI, dibattito, caso di Diritto.", apriMenu],
      ["#apriGiochi", "🎮 <b>Giochi</b>: escape room, indovina il personaggio, sfida tra classi. E 🫧 un minuto di respiro.", apriMenu],
      ["#apriRegistro", "📊 La <b>tabella degli errori</b>: cosa Fly Aula ha corretto da sola e cosa avete segnalato.", apriMenu],
      ["#apriPrivacy", "🔒 <b>Privacy e dati</b>: il documento per la Dirigenza.", apriMenu],
      [null, "Sotto ogni risposta: 🔊 <b>Leggi</b>, 🔎 <b>Perché lo dici?</b>, 👎 <b>Segnala un errore</b>, e 🙂🌍🎓 per farla <b>rispiegare</b>.<br><b>Fine!</b> Le guide si riaprono da Menu → ❓ Guida.", chiudiMenu]
    ] },
    verifica: { titolo: "📄 Preparare una verifica", prima: chiudiMenu, passi: [
      [null, "<b>1.</b> Menu → 👩‍🏫 <b>Pannello del prof</b> → il vostro PIN."],
      [null, "<b>2.</b> 📄 <b>Crea una verifica da stampare</b>: scrivete l'argomento (ci sono i suggerimenti dal programma della classe), il numero di esercizi e le file: <b>A e B</b> o <b>A, B e C</b>."],
      [null, "<b>3.</b> 🪄 <b>Prepara</b>: ogni esercizio è controllato <b>3 volte</b>. Le file hanno gli stessi tipi di esercizi con numeri diversi: copiare dal vicino non serve."],
      [null, "<b>4.</b> 🔄 rifà un esercizio, ✕ lo toglie. Poi 🖨️ <b>Stampa</b> ogni fila e le <b>soluzioni</b> (solo per voi). ♿ <b>Versione per DSA</b>: carattere grande, più spazio, se volete meno esercizi."],
      [null, "<b>5.</b> Con il PIN personale la verifica si salva da sola nel vostro <b>archivio</b>. Con 🤝 la potete condividere con i colleghi del dipartimento.<br><b>La verifica la prepara Fly Aula, ma la decidete voi: rileggetela sempre.</b>"]
    ] },
    strumenti: { titolo: "🧰 Lezione pronta, UDA, correzione", prima: chiudiMenu, passi: [
      [null, "Menu → 👩‍🏫 <b>Pannello del prof</b> → 🧰 <b>Lezione pronta, UDA, aiuto a correggere</b>."],
      [null, "📚 <b>Lezione pronta</b>: scrivete l'argomento e la durata. Arrivano scaletta con i tempi, spiegazione breve, 3 esercizi controllati e un mini-quiz con le risposte sicure. 🖨️ stampa, 💾 archivio."],
      [null, "📑 <b>UDA</b>: tema, ore, materie. Una bozza con competenze chiave europee, compito di realtà, fasi con le ore e rubrica a 4 livelli. Da completare in consiglio di classe."],
      [null, "✍️ <b>Aiuto a correggere</b>: la domanda, la vostra griglia e la risposta dell'alunno (📷 foto o scritta). Fly Aula <b>propone</b> i punti criterio per criterio e spiega perché. <b>Il voto lo decidete voi</b>: ogni punteggio si può cambiare. Niente nomi, niente salvato."]
    ] }
  };
  let giro = null, k = 0;
  function avvia(nome) {
    giro = GIRI[nome]; if (!giro) return; k = 0;
    if (giro.prima) giro.prima();
    setTimeout(mostra, 120);
  }
  function chiudi() { const t = el("tour"); t.innerHTML = ""; t.style.display = "none"; if (giro && giro === GIRI.flyaula) chiudiMenu(); giro = null; }
  function mostra() {
    if (!giro) return;
    if (k >= giro.passi.length) return chiudi();
    const [sel, testo, prima] = giro.passi[k];
    if (prima) prima();
    const t = el("tour"), bersaglio = sel ? document.querySelector(sel) : null, r = bersaglio && bersaglio.offsetParent !== null ? bersaglio.getBoundingClientRect() : null;
    const bottoni = `<div class="tour-bott">${k ? `<button class="btn sec" id="guIndietro">◀</button>` : ""}<button class="btn sec" id="guSalta">Salta</button><button class="btn" id="guAvanti">${k + 1 < giro.passi.length ? "Avanti ▶" : "Fine 👍"}</button></div>`;
    t.style.display = "block";
    if (r) {
      const sotto = r.top < innerHeight / 2;
      t.innerHTML = `<div class="tour-buco" style="left:${r.left - 8}px;top:${r.top - 8}px;width:${r.width + 16}px;height:${r.height + 16}px"></div>
        <div class="tour-fumetto ${sotto ? "t-giu" : "t-su"}" style="${sotto ? `top:${Math.min(innerHeight - 260, r.bottom + 18)}px` : `bottom:${innerHeight - r.top + 18}px`};left:${Math.max(16, Math.min(innerWidth - 456, r.left + r.width / 2 - 220))}px">
        <div class="tour-n">${esc(giro.titolo)} · ${k + 1} di ${giro.passi.length}</div><p>${testo}</p>${bottoni}</div>`;
    } else {
      t.innerHTML = `<div class="tour-velo"></div><div class="tour-fumetto tour-centro"><div class="tour-n">${esc(giro.titolo)} · ${k + 1} di ${giro.passi.length}</div><p>${testo}</p>${bottoni}</div>`;
    }
    el("guAvanti").onclick = () => { k++; mostra(); };
    el("guSalta").onclick = chiudi;
    if (el("guIndietro")) el("guIndietro").onclick = () => { k--; mostra(); };
  }
  // ❓ il pannello delle guide (Menu → ❓ Guida)
  function pannello() {
    let p = el("pGuida");
    if (!p) { p = document.createElement("div"); p.className = "pannello"; p.id = "pGuida"; document.body.appendChild(p); }
    p.innerHTML = `<div class="box"><h2>❓ Guide per i prof</h2><p class="sotto">Ogni guida mostra i bottoni sullo schermo, un passo alla volta. Si può interrompere con «Salta».</p>
      <div class="at-griglia">${Object.entries(GIRI).map(([n, g]) => `<button class="at-tile" data-g="${n}"><span class="at-i">${g.titolo.split(" ")[0]}</span><b>${esc(g.titolo.slice(g.titolo.indexOf(" ") + 1))}</b><span>${g.passi.length} passi</span></button>`).join("")}
        <button class="at-tile" id="guStampa"><span class="at-i">🖨️</span><b>Guida rapida da stampare</b><span>Una pagina da tenere vicino alla LIM.</span></button></div>
      <div class="riga-btn"><button class="btn sec" id="guChiudi">Chiudi</button></div></div>`;
    p.style.display = "block";
    p.querySelectorAll("[data-g]").forEach(b => b.onclick = () => { p.style.display = "none"; avvia(b.dataset.g); });
    el("guChiudi").onclick = () => { p.style.display = "none"; };
    el("guStampa").onclick = () => stampa("Fly Aula · guida rapida", `<h1>Fly Aula · guida rapida per i prof</h1>` + Object.values(GIRI).map(g => `<h2>${esc(g.titolo)}</h2><ol>${g.passi.map(([, t]) => `<li>${t.replace(/<br>/g, " ")}</li>`).join("")}</ol>`).join(""));
  }
  // 🖊️ la prima volta che si apre la lavagna: l'introduzione parte da sola
  function primaVoltaLavagna() {
    try { if (localStorage.getItem("flyaula_guida_lavagna") === "1") return; localStorage.setItem("flyaula_guida_lavagna", "1"); } catch (e) { return; }
    setTimeout(() => avvia("lavagna"), 450);
  }
  return { avvia, chiudi, pannello, primaVoltaLavagna, GIRI, get passo() { return k; }, get attiva() { return !!giro; } };
})();
