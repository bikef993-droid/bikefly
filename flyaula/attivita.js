// ===================================================================
//  FLY AULA · 🎲 ATTIVITÀ PER LA CLASSE
//  🔍 Dove sbaglio? · 🕵️ Trova l'errore · 🎭 Intervista a un personaggio · 📘 Glossario della classe
//  🧾 Fattura (Economia aziendale) · ✈️ Progetta un viaggio · 📝 Allenamento INVALSI (matematica)
//  🗣️ Dibattito guidato · ⚖️ Caso di Diritto
//  Dove ci sono numeri, li calcola SEMPRE la calcolatrice (mai il cervello).
// ===================================================================
const Attivita = (() => {
  const el = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const caso = n => Math.floor(Math.random() * n), scegli = l => l[caso(l.length)];
  const euro = x => (Math.round(x * 100) / 100).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const json = t => { const s = String(t || ""); return JSON.parse(s.slice(s.indexOf("{"), s.lastIndexOf("}") + 1)); };
  const materiaOra = () => el("materia").value;
  let intervista = null, timerDib = null;

  // ---------- il pannello con le "piastrelle" ----------
  const ATTIVITA = [
    ["dove", "🔍", "Dove sbaglio?", "Scrivi i tuoi passaggi: Fly Aula trova il primo sbagliato, senza darti la soluzione."],
    ["errore", "🕵️", "Trova l'errore", "Una spiegazione con un errore nascosto apposta: chi lo trova?"],
    ["intervista", "🎭", "Intervista a un personaggio", "La classe intervista Galileo, Dante, Marie Curie… (ricostruzione, non parole vere)."],
    ["glossario", "📘", "Glossario della classe", "Le parole importanti uscite a lezione, materia per materia."],
    ["fattura", "🧾", "Fattura (Ec. aziendale)", "Imponibile, IVA e totale di una fattura sempre diversa."],
    ["viaggio", "✈️", "Progetta un viaggio", "Il budget della gita: voci, cambio, totale a persona."],
    ["invalsi", "📝", "Allenamento INVALSI", "10 domande di matematica nello stile della prova di seconda."],
    ["dibattito", "🗣️", "Dibattito guidato", "Due posizioni, i tempi per ogni squadra. Chi vince lo decidete voi."],
    ["diritto", "⚖️", "Caso di Diritto", "Un caso di tutti i giorni, i ruoli e gli articoli della Costituzione."]
  ];
  function pannello() {
    let p = el("pAttivita");
    if (!p) { p = document.createElement("div"); p.className = "pannello"; p.id = "pAttivita"; p.innerHTML = `<div class="box"><h2>🎲 Attività per la classe</h2><div id="atCorpo"></div></div>`; document.body.appendChild(p); }
    return p;
  }
  function apri(quale) { pannello().style.display = "block"; quale ? vai(quale) : piastrelle(); }
  function chiudi() { if (el("pAttivita")) el("pAttivita").style.display = "none"; fermaTimer(); }
  function piastrelle() {
    el("atCorpo").innerHTML = `<div class="at-griglia">${ATTIVITA.map(([k, i, t, d]) => `<button class="at-tile" data-k="${k}"><span class="at-i">${i}</span><b>${t}</b><span>${d}</span></button>`).join("")}</div>
      <div class="riga-btn"><button class="btn sec" id="atChiudi">Chiudi</button></div>`;
    el("atCorpo").querySelectorAll("[data-k]").forEach(b => b.onclick = () => vai(b.dataset.k));
    el("atChiudi").onclick = chiudi;
  }
  const testa = (titolo, sotto = "") => `<div class="at-testa"><button class="btn sec at-indietro" id="atIndietro">← Attività</button><h3>${titolo}</h3></div>${sotto ? `<p class="sotto">${sotto}</p>` : ""}`;
  function vai(k) {
    fermaTimer(); el("atCorpo").oninput = el("atCorpo").onchange = null;   // i calcoli del viaggio non restano attaccati alle altre attività
    ({ dove, errore, intervista: formIntervista, glossario, fattura, viaggio, invalsi, dibattito, diritto })[k]();
    const b = el("atIndietro"); if (b) b.onclick = piastrelle;
  }

  // =================== 🔍 DOVE SBAGLIO? ===================
  function dove() {
    el("atCorpo").innerHTML = testa("🔍 Dove sbaglio?", "Scrivi i passaggi, uno per riga (per esempio <b>345 : 5 = 68</b>). Fly Aula ti dice qual è il PRIMO passaggio sbagliato e ti dà un aiuto, non la soluzione.") +
      `<textarea id="atPassi" rows="7" class="at-area" maxlength="2000" placeholder="12 × 4 = 48&#10;48 + 7 = 56&#10;56 : 2 = 28"></textarea>
      <div class="riga-btn"><button class="btn" id="atControlla">🔍 Dove sbaglio?</button></div><div id="atEsito"></div>`;
    el("atControlla").onclick = async () => {
      const righe = el("atPassi").value.split(/\n+/).map(x => x.trim()).filter(Boolean).slice(0, 20);
      if (!righe.length) return el("atPassi").focus();
      const sic = controllaDomanda(righe.join(" "), materiaOra());
      if (!sic.ok) { el("atEsito").innerHTML = `<p class="at-msg">${esc(sic.risposta)}</p>`; return; }
      // 1) i conti: la calcolatrice, riga per riga
      let conti = 0;
      for (let i = 0; i < righe.length; i++) {
        const c = Tratti.conto(righe[i]); if (!c.ok) continue;
        const v = rifaiConto(c.espr, c.risultato); if (!v) continue;
        conti++;
        if (!v.giusto) { mostraDove(righe, i, Lavagna.aiuto(c.espr, c.risultato, v.valore)); return; }
      }
      if (conti && conti === righe.filter(r => /=/.test(r)).length) { mostraDove(righe, -1, `${conti === 1 ? "Il conto è giusto" : `Tutti e ${conti} i conti sono giusti`} ✓ (${conti === 1 ? "l'ha rifatto" : "li ha rifatti"} la calcolatrice).`); return; }
      // 2) passaggi a parole (o conti con lettere): ci pensa il cervello, senza dare la soluzione
      if (!modello) return mostraAiuto();
      el("atEsito").innerHTML = `<div class="lavoro">🔍 Rileggo i tuoi passaggi…</div>`;
      try {
        const j = json(await cervello(`Sei un insegnante paziente di ${MATERIE[materiaOra()].nome}. Lo studente ha scritto dei passaggi numerati. Trova il PRIMO passaggio sbagliato. NON dare la soluzione e NON correggere tu: dai solo un aiuto breve per farglielo trovare.
Rispondi SOLO con JSON: {"riga": numero del primo passaggio sbagliato (0 se sono tutti giusti), "aiuto": "una frase"}`, righe.map((r, i) => `${i + 1}. ${r}`).join("\n"), { temperature: 0.1, format: "json" }));
        const n = Math.round(Number(j.riga) || 0), aiuto = String(j.aiuto || "").slice(0, 300);
        mostraDove(righe, n >= 1 && n <= righe.length ? n - 1 : -1, controllaRisposta(aiuto, materiaOra()) && aiuto ? aiuto : (n ? "Ricontrolla questo passaggio con calma." : "Non vedo errori nei passaggi."), true);
      } catch (e) { el("atEsito").innerHTML = `<p class="at-msg">Il cervello non ha risposto: riprova tra un attimo.</p>`; }
    };
  }
  function mostraDove(righe, i, msg, dalCervello = false) {
    el("atEsito").innerHTML = `<ol class="at-passi">${righe.map((r, k) => `<li class="${k === i ? "sbagliato" : i < 0 || k < i ? "ok" : ""}">${esc(r)}${k === i ? " <b>← qui</b>" : ""}</li>`).join("")}</ol>
      <p class="at-msg ${i < 0 ? "ok" : ""}">${i < 0 ? "✅ " : "💡 "}${msg}</p>${dalCervello ? `<p class="nota-s">Passaggi a parole: li ha riletti il cervello, che può sbagliare.</p>` : ""}`;
  }

  // =================== 🕵️ TROVA L'ERRORE ===================
  function errore() {
    const m = materiaOra(), conti = MATERIE[m].calcoli && m !== "informatica";
    const gioco = conti ? erroreNeiConti() : erroreNeiFatti(m);
    if (!gioco) { el("atCorpo").innerHTML = testa("🕵️ Trova l'errore") + `<p class="sotto">Per questa materia non ho ancora abbastanza fatti sicuri: prova con Matematica, Storia, Geografia, Scienze o una lingua.</p>`; return; }
    el("atCorpo").innerHTML = testa("🕵️ Trova l'errore", conti ? `Ecco come si fa <b>${esc(gioco.titolo)}</b>. In uno dei passaggi c'è un errore messo apposta: quale?` : "Una di queste risposte è sbagliata apposta: quale?") +
      `<ol class="at-passi at-scelta">${gioco.righe.map((r, i) => `<li data-i="${i}">${esc(r)}</li>`).join("")}</ol><div id="atEsito"></div>
      <div class="riga-btn"><button class="btn sec" id="atAncora">🔄 Un altro</button></div>`;
    el("atAncora").onclick = errore;
    el("atCorpo").querySelectorAll(".at-scelta li").forEach(li => li.onclick = () => {
      if (el("atEsito").dataset.fatto === "1") return;
      el("atEsito").dataset.fatto = "1";
      const giusto = +li.dataset.i === gioco.sbagliato;
      el("atCorpo").querySelectorAll(".at-scelta li").forEach(x => x.classList.add(+x.dataset.i === gioco.sbagliato ? "sbagliato" : "ok"));
      if (giusto && typeof puntiClasse === "function") puntiClasse(1);
      el("atEsito").innerHTML = `<p class="at-msg ${giusto ? "ok" : ""}">${giusto ? "🎉 Trovato!" : "Non era quello."} L'errore era al passaggio <b>${gioco.sbagliato + 1}</b>: ${esc(gioco.spiega)}</p>`;
      conta("trovaErrore");
    });
  }
  function erroreNeiConti() {
    for (let t = 0; t < 30; t++) {
      const op = scegli([":", "×", "+", "-"]);
      const [a, b] = op === ":" ? (() => { const b = 3 + caso(7), q = 21 + caso(180); return [b * q, b]; })() : op === "×" ? [23 + caso(800), 3 + caso(7)] : op === "+" ? [148 + caso(800), 37 + caso(600)] : (() => { const a = 400 + caso(600); return [a, 38 + caso(a - 100)]; })();
      const passi = passiInColonna(a, op, b);
      if (!passi || passi.length < 3) continue;
      // si cambia UN numero dopo un "=" in un passaggio (non l'ultimo, così non è troppo facile)
      const k = caso(passi.length - 1), m = [...passi[k].matchAll(/= (\d+)/g)];
      if (!m.length) continue;
      const x = scegli(m), vero = +x[1], falso = vero + scegli([-2, -1, 1, 2, 10]);
      if (falso < 0 || falso === vero) continue;
      const nuovo = passi[k].slice(0, x.index) + "= " + falso + passi[k].slice(x.index + x[0].length);
      return { titolo: `${a} ${op === "-" ? "−" : op} ${b}`, righe: passi.map((p, i) => i === k ? nuovo : p).map(p => p.replace(/\s*✓$/, "")), sbagliato: k, spiega: `doveva essere ${vero}, non ${falso}.` };
    }
    return null;
  }
  function erroreNeiFatti(m) {
    if (typeof Precisione === "undefined") return null;
    const q = Precisione.domandePer(m, 5);
    if (q.length < 5 || new Set(q.map(x => Quiz.norm(String(x.mostra)))).size < 5) return null;
    const k = caso(4), righe = q.slice(0, 4).map((x, i) => `${x.testo} → ${i === k ? q[4].mostra : x.mostra}`);
    return { righe, sbagliato: k, spiega: `la risposta giusta è «${q[k].mostra}».` };
  }

  // =================== 🎭 INTERVISTA ===================
  const PERSONAGGI = [
    ["Gian Domenico Romagnosi", "giurista, filosofo ed economista nato a Salsomaggiore, studiò a Piacenza (1761-1835): la scuola porta il suo nome", ["storia", "diritto", "economia"]],
    ["Giuseppe Verdi", "compositore nato a Busseto, vicino a Piacenza (1813-1901)", ["storia", "arte", "italiano"]],
    ["Dante Alighieri", "poeta fiorentino, autore della Divina Commedia (1265-1321)", ["italiano", "storia"]],
    ["Alessandro Manzoni", "scrittore, autore dei Promessi sposi (1785-1873)", ["italiano"]],
    ["Giacomo Leopardi", "poeta di Recanati (1798-1837)", ["italiano"]],
    ["Giulio Cesare", "generale e politico romano (100-44 a.C.)", ["storia", "latino"]],
    ["Carlo Magno", "re dei Franchi e imperatore (742 circa-814)", ["storia"]],
    ["Cristoforo Colombo", "navigatore genovese (1451-1506)", ["storia", "geografia"]],
    ["Leonardo da Vinci", "artista, scienziato e inventore (1452-1519)", ["arte", "scienze", "storia"]],
    ["Michelangelo Buonarroti", "scultore, pittore e architetto (1475-1564)", ["arte"]],
    ["Galileo Galilei", "scienziato pisano, padre del metodo scientifico (1564-1642)", ["fisica", "scienze", "storia"]],
    ["Isaac Newton", "scienziato inglese, leggi del moto e gravitazione (1643-1727)", ["fisica", "matematica"]],
    ["Archimede", "matematico e inventore di Siracusa (287-212 a.C. circa)", ["matematica", "fisica"]],
    ["Pitagora", "filosofo e matematico greco (VI secolo a.C.)", ["matematica"]],
    ["Marie Curie", "scienziata, due premi Nobel, studi sulla radioattività (1867-1934)", ["chimica", "fisica", "scienze"]],
    ["Dmitrij Mendeleev", "chimico russo, inventore della tavola periodica (1834-1907)", ["chimica"]],
    ["Charles Darwin", "naturalista inglese, teoria dell'evoluzione (1809-1882)", ["scienze"]],
    ["Rita Levi-Montalcini", "scienziata italiana, premio Nobel per la medicina (1909-2012)", ["scienze", "storia"]],
    ["Albert Einstein", "fisico, teoria della relatività (1879-1955)", ["fisica"]],
    ["Giuseppe Garibaldi", "protagonista del Risorgimento (1807-1882)", ["storia"]],
    ["Camillo Benso conte di Cavour", "politico del Risorgimento (1810-1861)", ["storia"]],
    ["Maria Montessori", "medica e pedagogista (1870-1952)", ["storia", "scienze"]],
    ["Luca Pacioli", "matematico, il primo a spiegare la partita doppia in un libro stampato (1445 circa-1517)", ["economia", "matematica"]],
    ["Adam Smith", "economista scozzese, La ricchezza delle nazioni (1723-1790)", ["economia", "diritto"]],
    ["William Shakespeare", "drammaturgo inglese (1564-1616)", ["inglese"]],
    ["Victor Hugo", "scrittore francese, I miserabili (1802-1885)", ["francese"]],
    ["Miguel de Cervantes", "scrittore spagnolo, Don Chisciotte (1547-1616)", ["spagnolo"]],
    ["Johann Wolfgang von Goethe", "scrittore tedesco (1749-1832)", ["tedesco"]],
    ["Ada Lovelace", "matematica inglese, la prima programmatrice (1815-1852)", ["informatica", "matematica"]],
    ["Alan Turing", "matematico inglese, padre dell'informatica (1912-1954)", ["informatica"]]
  ];
  function formIntervista() {
    const m = materiaOra(), primi = PERSONAGGI.filter(p => p[2].includes(m)), altri = PERSONAGGI.filter(p => !p[2].includes(m));
    el("atCorpo").innerHTML = testa("🎭 Intervista a un personaggio", "La classe fa le domande in chat e Fly Aula risponde <b>come se fosse</b> il personaggio. È una <b>ricostruzione</b>: sulla lavagna è sempre scritto che non sono parole vere.") +
      (intervista ? `<p class="at-msg ok">Adesso: intervista a <b>${esc(intervista.nome)}</b>. <button class="btn sec" id="atFine">⏹️ Finisci l'intervista</button></p>` : "") +
      `<div class="at-pers">${[...primi, ...altri].map(p => `<button data-n="${esc(p[0])}" class="${primi.includes(p) ? "su" : ""}"><b>${esc(p[0])}</b><span>${esc(p[1])}</span></button>`).join("")}</div>`;
    if (el("atFine")) el("atFine").onclick = () => { fineIntervista(); formIntervista(); };
    el("atCorpo").querySelectorAll("[data-n]").forEach(b => b.onclick = () => iniziaIntervista(b.dataset.n));
  }
  function iniziaIntervista(nome) {
    const p = PERSONAGGI.find(x => x[0] === nome); if (!p) return;
    intervista = { nome: p[0], chi: p[1] };
    const pill = el("pillIntervista") || (() => { const s = document.createElement("span"); s.id = "pillIntervista"; s.className = "info-pill intervista"; el("lezione").after(s); return s; })();
    pill.style.display = ""; pill.innerHTML = `🎭 Intervista: <b>${esc(nome)}</b> <button title="Finisci l'intervista">✕</button>`;
    pill.querySelector("button").onclick = fineIntervista;
    chiudi();
    if (typeof aggiungi === "function") aggiungi("ai", `🎭 <b>Intervista a ${esc(nome)}</b> (${esc(p[1])}).<br>Fate le vostre domande! Ricordate: è una <b>ricostruzione</b> di Fly Aula, non sono parole vere di ${esc(nome)}.`);
    conta("interviste");
  }
  function fineIntervista() { intervista = null; const p = el("pillIntervista"); if (p) p.style.display = "none"; }
  function istruzioniIntervista() {
    if (!intervista) return "";
    return `\n\n🎭 GIOCO DELL'INTERVISTA (scelto dal prof): rispondi in prima persona COME SE fossi ${intervista.nome} (${intervista.chi}), con il suo modo di parlare ma in italiano semplice, 4-6 frasi.
Racconta solo cose storicamente vere della sua vita e del suo tempo; se non lo sai, di' che non lo ricordi. Non parlare di fatti avvenuti dopo la sua morte. Niente opinioni sulla politica di oggi.
Questa è una ricostruzione: non dire mai di essere davvero ${intervista.nome} fuori dal gioco.`;
  }

  // =================== 📘 GLOSSARIO ===================
  const GK = "flyaula_glossario";
  const gloss = () => { try { return JSON.parse(localStorage.getItem(GK) || "[]"); } catch (e) { return []; } };
  function raccogli(testo, materia, classe) {
    const frasi = String(testo).replace(/\[DISEGNO:[^\]]*\]/gi, "").split(/(?<=[.!?])\s+|\n+/);
    const l = gloss(); let nuove = 0;
    for (const f of frasi) for (const m of f.matchAll(/\*\*([^*\n]{3,40})\*\*/g)) {
      const t = m[1].trim().replace(/[.:;,!?]+$/, ""), k = t.toLowerCase();
      if (!/[a-zà-ÿ]{3}/i.test(t) || /^\d|[=×:+]/.test(t) || l.some(x => x.k === k && x.materia === materia && x.classe === classe)) continue;
      l.unshift({ k, termine: t, materia, classe, frase: f.replace(/\*\*/g, "").trim().slice(0, 220), quando: Date.now() }); nuove++;
    }
    if (nuove) try { localStorage.setItem(GK, JSON.stringify(l.slice(0, 400))); } catch (e) {}
    return nuove;
  }
  function glossario() {
    const classe = el("classe").value, m = materiaOra(), l = gloss().filter(x => x.classe === classe && x.materia === m).sort((a, b) => a.k.localeCompare(b.k, "it"));
    el("atCorpo").innerHTML = testa(`📘 Glossario · ${esc(MATERIE[m].nome)} · ${esc(classe)}`, "Le parole importanti (quelle in grassetto) delle risposte di Fly Aula a lezione, con la frase in cui sono comparse. Si riempie da solo.") +
      (l.length ? `<table class="cv-tab at-gloss"><tbody>${l.map(x => `<tr><td><b>${esc(x.termine)}</b></td><td>${esc(x.frase)}</td><td><button data-k="${esc(x.k)}" title="Togli">✕</button></td></tr>`).join("")}</tbody></table>
        <div class="riga-btn"><button class="btn" id="atStampaG">🖨️ Stampa per ripassare</button></div>` : `<p class="sotto">Ancora vuoto: fate qualche domanda in ${esc(MATERIE[m].nome)} e le parole importanti arriveranno qui.</p>`);
    el("atCorpo").querySelectorAll("[data-k]").forEach(b => b.onclick = () => { try { localStorage.setItem(GK, JSON.stringify(gloss().filter(x => !(x.k === b.dataset.k && x.classe === classe && x.materia === m)))); } catch (e) {} glossario(); el("atIndietro").onclick = piastrelle; });
    if (el("atStampaG")) el("atStampaG").onclick = () => stampa(`Glossario ${MATERIE[m].nome}`, `<h1>Glossario di ${esc(MATERIE[m].nome)} · ${esc(classe)}</h1>` + l.map(x => `<p><b>${esc(x.termine)}</b>: ${esc(x.frase)}</p>`).join(""));
  }

  // =================== 🧾 FATTURA ===================
  // aliquote IVA italiane: 22% ordinaria, 10% (es. uova), 4% (es. libri, pasta, olio d'oliva)
  const MERCI = [["Risme di carta A4", 3.9, 22], ["Toner per stampante", 64.5, 22], ["Sedie da ufficio", 89, 22], ["Libri di testo", 24.8, 4], ["Confezioni di pasta", 1.35, 4], ["Bottiglie d'olio extravergine", 7.6, 4], ["Lampade LED", 12.4, 22], ["Quaderni", 1.8, 22], ["Confezioni di uova", 3.2, 10], ["Monitor", 139, 22]];
  function nuovaFattura() {
    const n = 1 + caso(3), righe = [];
    for (let i = 0; i < n; i++) { const [cosa, p, iva] = scegli(MERCI.filter(x => !righe.some(r => r.cosa === x[0]))); righe.push({ cosa, q: 2 + caso(24), prezzo: Math.round(p * (0.9 + Math.random() * 0.25) * 100) / 100, iva }); }
    // il trasporto addebitato dal venditore segue l'IVA della merce: per non complicare, solo se tutta la merce è al 22%
    const sconto = scegli([0, 0, 5, 10]), trasporto = righe.every(r => r.iva === 22) ? scegli([0, 15, 25]) : 0;
    // la calcolatrice: tutto al centesimo, IVA per aliquota
    const lordo = righe.map(r => Math.round(r.q * r.prezzo * 100) / 100);
    const netto = lordo.map(x => Math.round(x * (1 - sconto / 100) * 100) / 100);
    const perIva = {}; righe.forEach((r, i) => perIva[r.iva] = (perIva[r.iva] || 0) + netto[i]);
    if (trasporto) perIva[22] = (perIva[22] || 0) + trasporto;
    const imponibile = Math.round(Object.values(perIva).reduce((a, b) => a + b, 0) * 100) / 100;
    const iva = Math.round(Object.entries(perIva).reduce((a, [al, v]) => a + Math.round(v * al) / 100, 0) * 100) / 100;
    return { righe, lordo, netto, sconto, trasporto, perIva, imponibile, iva, totale: Math.round((imponibile + iva) * 100) / 100, numero: 100 + caso(900) };
  }
  function fattura() {
    const f = nuovaFattura();
    el("atCorpo").innerHTML = testa("🧾 La fattura", "Calcola imponibile, IVA e totale. Gli arrotondamenti sono al centesimo.") +
      `<div class="at-fattura"><div class="at-f-testa"><b>Fattura n. ${f.numero}</b><span>Cartoleria Fly Srl → Cliente Rossi Srl</span></div>
      <table class="cv-tab"><thead><tr><th>Descrizione</th><th>Q.tà</th><th>Prezzo unit.</th><th>IVA</th></tr></thead><tbody>${f.righe.map(r => `<tr><td>${esc(r.cosa)}</td><td>${r.q}</td><td>€ ${euro(r.prezzo)}</td><td>${r.iva}%</td></tr>`).join("")}</tbody></table>
      <p>${f.sconto ? `Sconto incondizionato: <b>${f.sconto}%</b> sulle merci. ` : ""}${f.trasporto ? `Spese di trasporto: <b>€ ${euro(f.trasporto)}</b> (IVA 22%).` : ""}</p></div>
      <div class="at-campi"><label>Imponibile € <input id="atImp" inputmode="decimal"></label><label>IVA € <input id="atIva" inputmode="decimal"></label><label>Totale fattura € <input id="atTot" inputmode="decimal"></label></div>
      <div class="riga-btn"><button class="btn" id="atVerifica">✅ Controlla</button><button class="btn sec" id="atSol">👀 Soluzione</button><button class="btn sec" id="atNuova">🔄 Un'altra</button></div><div id="atEsito"></div>`;
    const leggiE = id => { const x = leggiNumero(String(el(id).value).replace(/[€\s]/g, "")); return isFinite(x) ? x : NaN; };
    el("atVerifica").onclick = () => {
      const v = [["imponibile", "atImp", f.imponibile], ["IVA", "atIva", f.iva], ["totale", "atTot", f.totale]].map(([n, id, giusto]) => { const x = leggiE(id), ok = Math.abs(x - giusto) < 0.005; el(id).classList.toggle("giusto", ok); el(id).classList.toggle("sbagliato", !ok); return [n, ok]; });
      const ko = v.filter(x => !x[1]).map(x => x[0]);
      el("atEsito").innerHTML = `<p class="at-msg ${ko.length ? "" : "ok"}">${ko.length ? `Da ricontrollare: <b>${ko.join(", ")}</b>. ${ko.includes("imponibile") ? "Ricordati lo sconto e le spese di trasporto." : ko.includes("IVA") ? "L'IVA si calcola per ogni aliquota." : "Totale = imponibile + IVA."}` : "🎉 Tutto giusto!"}</p>`;
      conta("fatture");
    };
    el("atSol").onclick = () => {
      el("atEsito").innerHTML = `<ol class="at-passi">${f.righe.map((r, i) => `<li>${esc(r.cosa)}: ${r.q} × ${euro(r.prezzo)} = € ${euro(f.lordo[i])}${f.sconto ? ` − ${f.sconto}% = € ${euro(f.netto[i])}` : ""}</li>`).join("")}
        ${f.trasporto ? `<li>Trasporto: € ${euro(f.trasporto)}</li>` : ""}<li><b>Imponibile: € ${euro(f.imponibile)}</b></li>
        ${Object.entries(f.perIva).map(([al, v]) => `<li>IVA ${al}% su € ${euro(v)} = € ${euro(Math.round(v * al) / 100)}</li>`).join("")}<li><b>IVA totale: € ${euro(f.iva)}</b></li><li><b>Totale fattura: € ${euro(f.imponibile)} + € ${euro(f.iva)} = € ${euro(f.totale)}</b></li></ol>`;
    };
    el("atNuova").onclick = () => { fattura(); el("atIndietro").onclick = piastrelle; };
    return f;
  }

  // =================== ✈️ PROGETTA UN VIAGGIO ===================
  function viaggio() {
    el("atCorpo").innerHTML = testa("✈️ Progetta un viaggio", "Scrivete le voci della gita: la calcolatrice fa i totali, anche con il cambio di valuta.") +
      `<div class="at-campi"><label>Persone <input id="atPers" type="number" min="1" max="200" value="25"></label><label>Budget a persona € <input id="atBudget" inputmode="decimal" value="300"></label></div>
      <table class="cv-tab at-viaggio"><thead><tr><th>Voce</th><th>Quantità</th><th>Prezzo</th><th>Valuta</th><th>Cambio (1 = … €)</th><th>Per</th><th>Totale €</th><th></th></tr></thead><tbody id="atVoci"></tbody></table>
      <div class="riga-btn"><button class="btn sec" id="atVoce">➕ Voce</button><button class="btn sec" id="atStampaV">🖨️ Stampa</button></div><div id="atTotali" class="at-totali"></div>`;
    const riga = (v = {}) => `<tr><td><input class="v-n" value="${esc(v.n || "")}" placeholder="es. Treno"></td><td><input class="v-q" type="number" min="0" value="${v.q ?? 1}"></td><td><input class="v-p" inputmode="decimal" value="${v.p ?? ""}"></td>
      <td><select class="v-v">${["EUR", "GBP", "USD", "CHF"].map(x => `<option ${x === (v.v || "EUR") ? "selected" : ""}>${x}</option>`).join("")}</select></td><td><input class="v-c" inputmode="decimal" value="${v.c ?? 1}"></td>
      <td><select class="v-x"><option value="p" ${v.x !== "g" ? "selected" : ""}>persona</option><option value="g" ${v.x === "g" ? "selected" : ""}>gruppo</option></select></td><td class="v-t">—</td><td><button class="v-via">✕</button></td></tr>`;
    el("atVoci").innerHTML = [{ n: "Treno andata e ritorno", q: 1, p: "45" }, { n: "Hotel (notti)", q: 2, p: "38" }, { n: "Ingresso museo", q: 1, p: "12" }, { n: "Pullman privato", q: 1, p: "650", x: "g" }].map(riga).join("");
    const calcola = () => {
      const pers = Math.max(1, +el("atPers").value || 1), budget = leggiNumero(String(el("atBudget").value)) || 0; let tot = 0, errori = 0;
      el("atVoci").querySelectorAll("tr").forEach(tr => {
        const q = +tr.querySelector(".v-q").value || 0, p = leggiNumero(String(tr.querySelector(".v-p").value || "0")), v = tr.querySelector(".v-v").value;
        const c = v === "EUR" ? 1 : leggiNumero(String(tr.querySelector(".v-c").value || "0")); tr.querySelector(".v-c").disabled = v === "EUR";
        if (!isFinite(p) || !isFinite(c) || c <= 0) { tr.querySelector(".v-t").textContent = "?"; errori++; return; }
        const t = Math.round(q * p * c * (tr.querySelector(".v-x").value === "p" ? pers : 1) * 100) / 100; tot += t; tr.querySelector(".v-t").textContent = euro(t);
      });
      const aPers = Math.round(tot / pers * 100) / 100, diff = Math.round((budget - aPers) * 100) / 100;
      el("atTotali").innerHTML = `<div><span>Totale gruppo</span><b>€ ${euro(tot)}</b></div><div><span>A persona</span><b>€ ${euro(aPers)}</b></div><div class="${diff >= 0 ? "ok" : "ko"}"><span>${diff >= 0 ? "Avanzano a persona" : "Mancano a persona"}</span><b>€ ${euro(Math.abs(diff))}</b></div>${errori ? `<p class="nota-s">⚠️ ${errori} ${errori === 1 ? "voce ha" : "voci hanno"} un numero non valido.</p>` : ""}`;
      return { tot, aPers, diff };
    };
    el("atCorpo").oninput = calcola; el("atCorpo").onchange = calcola;
    el("atVoci").onclick = e => { if (e.target.classList.contains("v-via")) { e.target.closest("tr").remove(); calcola(); } };
    el("atVoce").onclick = () => { el("atVoci").insertAdjacentHTML("beforeend", riga({})); calcola(); };
    el("atStampaV").onclick = () => { const r = calcola(); stampa("Il nostro viaggio", `<h1>Il nostro viaggio</h1><table style="width:100%;border-collapse:collapse">${[...el("atVoci").querySelectorAll("tr")].map(tr => `<tr><td style="border:1px solid #999;padding:6px">${esc(tr.querySelector(".v-n").value)}</td><td style="border:1px solid #999;padding:6px;text-align:right">€ ${esc(tr.querySelector(".v-t").textContent)}</td></tr>`).join("")}</table><p><b>Totale: € ${euro(r.tot)} · a persona: € ${euro(r.aPers)}</b></p>`); };
    calcola(); conta("viaggi");
  }

  // =================== 📝 INVALSI (matematica) ===================
  // domande nello STILE delle prove di grado 10, scritte da Fly Aula (non sono le prove vere). Risposta e distrattori: calcolatrice.
  function domandaInvalsi() {
    const f = x => formatta(x), t = caso(8);
    const mc = (testo, giusta, sbagliate, perche) => { const opz = [...new Set([giusta, ...sbagliate].map(String))].slice(0, 4); for (let k = 1; opz.length < 4 && k < 50; k++) { const c = String(giusta).replace(/\d+/, d => +d + k); if (!opz.includes(c)) opz.push(c); } const ord = opz.sort(() => Math.random() - .5); return { testo, opz: ord, giusta: ord.indexOf(String(giusta)), perche }; };
    if (t === 0) { const p = scegli([10, 15, 20, 25, 30]), x = 40 + 10 * caso(30), r = x * (100 - p) / 100; return mc(`Un paio di scarpe costa ${f(x)} €. Con lo sconto del ${p}%, quanto si paga?`, f(r), [f(x * p / 100), f(x - p), f(x * (100 + p) / 100)], `${f(x)} − ${p}% di ${f(x)} = ${f(x)} − ${f(x * p / 100)} = ${f(r)} €.`); }
    if (t === 1) { const a = 2 + caso(8), b = 3 + caso(20), c = a * (2 + caso(10)) + b; return mc(`Qual è la soluzione dell'equazione ${a}x + ${b} = ${c}?`, f((c - b) / a), [f((c + b) / a), f(c / a - b), f(c - b - a)], `${a}x = ${c} − ${b} = ${c - b}, quindi x = ${c - b} : ${a} = ${f((c - b) / a)}.`); }
    if (t === 2) { const v = Array.from({ length: 5 }, () => 4 + caso(7)), m = v.reduce((a, b) => a + b, 0) / 5; return mc(`I voti di Luca sono ${v.join(", ")}. Qual è la media?`, f(m), [f(m + 0.5), f([...v].sort((a, b) => a - b)[2]), f(Math.max(...v))], `(${v.join(" + ")}) : 5 = ${v.reduce((a, b) => a + b, 0)} : 5 = ${f(m)}.`); }
    if (t === 3) { const b = 4 + caso(12), h = 3 + caso(10); return mc(`Un rettangolo ha i lati di ${b} cm e ${h} cm. Qual è la sua area?`, `${b * h} cm²`, [`${2 * (b + h)} cm²`, `${b + h} cm²`, `${b * h * 2} cm²`], `Area = base × altezza = ${b} × ${h} = ${b * h} cm².`); }
    if (t === 4) { const r = 2 + caso(5), v = 1 + caso(r + 2), tot = r + v; return mc(`In un sacchetto ci sono ${r} palline rosse e ${v} verdi. Qual è la probabilità di pescare una pallina rossa?`, `${r}/${tot}`, [`${v}/${tot}`, `${r}/${v}`, `1/${tot}`], `Casi favorevoli ${r}, casi possibili ${tot}: ${r}/${tot}.`); }
    if (t === 5) { const a = 2 + caso(4), b = 2 + caso(3), c = 1 + caso(3); return mc(`Quanto vale ${a}^${b} × ${a}^${c}?`, `${a}^${b + c}`, [`${a}^${b * c}`, `${a * a}^${b + c}`, `${a}^${b - c > 0 ? b - c : b + c + 1}`], `Stessa base: si sommano gli esponenti, ${b} + ${c} = ${b + c}.`); }
    if (t === 6) { const k = 2 + caso(4), a = 3 * k, b = 5 * k, c = 4 + caso(6); return mc(`Se ${a} quaderni costano ${b} €, quanto costano ${c * 3} quaderni?`, f(b / a * c * 3), [f(b * c * 3 / k), f(b + c * 3 - a), f(b / a * c)], `Un quaderno costa ${b} : ${a} = ${f(b / a)} €; ${c * 3} × ${f(b / a)} = ${f(b / a * c * 3)} €.`); }
    const n = 2 + caso(6), d = n + 1 + caso(6), k = 2 + caso(4); return mc(`Quale frazione è equivalente a ${n}/${d}?`, `${n * k}/${d * k}`, [`${n + k}/${d + k}`, `${n * k}/${d + k}`, `${d}/${n}`], `Si moltiplicano numeratore e denominatore per lo stesso numero (${k}).`);
  }
  function invalsi() {
    const q = Array.from({ length: 10 }, domandaInvalsi); let i = 0, giuste = 0;
    const una = () => {
      if (i >= q.length) { el("atQ").innerHTML = `<p class="at-msg ok">Fine! <b>${giuste} su ${q.length}</b> giuste.</p><div class="riga-btn"><button class="btn" id="atRifai">🔄 Altre 10</button></div>`; el("atRifai").onclick = () => { invalsi(); el("atIndietro").onclick = piastrelle; }; conta("invalsi"); return; }
      const d = q[i];
      el("atQ").innerHTML = `<p class="nota-s">Domanda ${i + 1} di ${q.length} · giuste finora: ${giuste}</p><p class="at-dom">${esc(d.testo)}</p><div class="at-opz">${d.opz.map((o, k) => `<button data-k="${k}"><b>${"ABCD"[k]}</b> ${esc(o)}</button>`).join("")}</div><div id="atPerche"></div>`;
      el("atQ").querySelectorAll("[data-k]").forEach(b => b.onclick = () => {
        if (el("atPerche").innerHTML) return;
        const ok = +b.dataset.k === d.giusta; if (ok) { giuste++; if (typeof puntiClasse === "function") puntiClasse(1); }
        el("atQ").querySelectorAll("[data-k]").forEach(x => x.classList.add(+x.dataset.k === d.giusta ? "giusto" : x === b ? "sbagliato" : "spento"));
        el("atPerche").innerHTML = `<p class="at-msg ${ok ? "ok" : ""}">${ok ? "✓ Giusto!" : "✗ Era la " + "ABCD"[d.giusta] + "."} ${esc(d.perche)}</p><div class="riga-btn"><button class="btn" id="atAvanti">Avanti →</button></div>`;
        el("atAvanti").onclick = () => { i++; una(); };
      });
    };
    el("atCorpo").innerHTML = testa("📝 Allenamento INVALSI · matematica", "Domande nello stile della prova di seconda superiore, scritte da Fly Aula (non sono le prove ufficiali). Le risposte le calcola la calcolatrice.") + `<div id="atQ"></div>`;
    una();
    return q;
  }

  // =================== 🗣️ DIBATTITO ===================
  const TEMI = ["Lo smartphone a scuola: sì o no?", "Più compiti per casa o meno compiti?", "La settimana corta (dal lunedì al venerdì)", "Il voto a 16 anni", "L'uniforme a scuola", "Più ore di educazione fisica", "I videogiochi fanno bene o male?"];
  function dibattito() {
    el("atCorpo").innerHTML = testa("🗣️ Dibattito guidato", "Fly Aula presenta due posizioni con gli argomenti di chi le sostiene. Non dice chi ha ragione: lo decide la classe.") +
      `<div class="riga-btn"><input id="atTema" list="atTemi" class="at-input" maxlength="120" placeholder="Il tema del dibattito"><datalist id="atTemi">${TEMI.map(t => `<option value="${esc(t)}">`).join("")}</datalist><button class="btn" id="atPrepara">🗣️ Prepara</button></div><div id="atDib"></div>`;
    el("atPrepara").onclick = async () => {
      const tema = el("atTema").value.trim(); if (!tema) return el("atTema").focus();
      const sic = controllaDomanda(tema, materiaOra()); if (!sic.ok) { el("atDib").innerHTML = `<p class="at-msg">${esc(sic.risposta)}</p>`; return; }
      if (!modello) return mostraAiuto();
      el("atDib").innerHTML = `<div class="lavoro">🗣️ Preparo le due posizioni…</div>`;
      try {
        const j = json(await cervello(`Prepari un dibattito per una classe di scuola superiore. Presenta in modo EQUILIBRATO due posizioni opposte sul tema, con gli argomenti che userebbero i loro sostenitori. Non dire quale è giusta. Italiano semplice.
Rispondi SOLO con JSON: {"a": {"titolo": "…", "argomenti": ["…","…","…"]}, "b": {"titolo": "…", "argomenti": ["…","…","…"]}, "domande": ["2 domande per approfondire"]}`, `Tema: ${tema}`, { temperature: 0.4, format: "json" }));
        const lato = x => ({ titolo: String(x && x.titolo || "").slice(0, 80), argomenti: (x && Array.isArray(x.argomenti) ? x.argomenti : []).slice(0, 4).map(a => String(a).slice(0, 240)).filter(a => controllaRisposta(a, materiaOra())) });
        const A = lato(j.a), B = lato(j.b);
        if (!A.argomenti.length || !B.argomenti.length) throw new Error("vuoto");
        el("atDib").innerHTML = `<div class="at-lati"><div class="at-lato a"><h4>🅰️ ${esc(A.titolo || "Squadra A")}</h4><ul>${A.argomenti.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div><div class="at-lato b"><h4>🅱️ ${esc(B.titolo || "Squadra B")}</h4><ul>${B.argomenti.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div></div>
          ${Array.isArray(j.domande) && j.domande.length ? `<p class="nota-s">💭 ${j.domande.slice(0, 2).map(x => esc(String(x).slice(0, 200))).join(" · ")}</p>` : ""}
          <div class="at-turni">${[["🅰️ Apertura A", 120], ["🅱️ Apertura B", 120], ["🅰️ Replica A", 60], ["🅱️ Replica B", 60]].map(([n, s]) => `<button class="btn sec" data-s="${s}">${n} · ${s / 60} min</button>`).join("")}</div><div class="at-timer" id="atTimer"></div>`;
        el("atDib").querySelectorAll("[data-s]").forEach(b => b.onclick = () => avviaTimer(+b.dataset.s, b.textContent));
        conta("dibattiti");
      } catch (e) { el("atDib").innerHTML = `<p class="at-msg">Il cervello non ha risposto bene: riprova.</p>`; }
    };
  }
  function avviaTimer(s, nome) {
    fermaTimer(); const fine = Date.now() + s * 1000;
    const giro = () => { const r = Math.max(0, Math.ceil((fine - Date.now()) / 1000)), t = el("atTimer"); if (!t) return fermaTimer(); t.innerHTML = `<span>${esc(nome.split("·")[0])}</span><b class="${r <= 10 ? "fine" : ""}">${Math.floor(r / 60)}:${String(r % 60).padStart(2, "0")}</b>`; if (!r) fermaTimer(); };
    giro(); timerDib = setInterval(giro, 250);
  }
  function fermaTimer() { clearInterval(timerDib); timerDib = null; }

  // =================== ⚖️ CASO DI DIRITTO ===================
  // articoli della Costituzione: il testo lo scrive Fly Aula qui (riassunto fedele), il cervello sceglie solo i numeri
  const COSTITUZIONE = {
    1: "L'Italia è una Repubblica democratica, fondata sul lavoro. La sovranità appartiene al popolo.", 2: "La Repubblica riconosce e garantisce i diritti inviolabili dell'uomo e chiede i doveri di solidarietà.",
    3: "Tutti i cittadini hanno pari dignità sociale e sono uguali davanti alla legge, senza distinzioni di sesso, razza, lingua, religione, opinioni politiche, condizioni personali e sociali.",
    4: "La Repubblica riconosce a tutti il diritto al lavoro.", 9: "La Repubblica promuove la cultura e la ricerca, tutela il paesaggio, l'ambiente, la biodiversità e gli ecosistemi, anche nell'interesse delle future generazioni.",
    11: "L'Italia ripudia la guerra come strumento di offesa alla libertà degli altri popoli.", 13: "La libertà personale è inviolabile.", 14: "Il domicilio è inviolabile.",
    15: "La libertà e la segretezza della corrispondenza e di ogni altra forma di comunicazione sono inviolabili.", 16: "Ogni cittadino può circolare e soggiornare liberamente in qualsiasi parte del territorio nazionale.",
    17: "I cittadini hanno diritto di riunirsi pacificamente e senz'armi.", 18: "I cittadini hanno diritto di associarsi liberamente, senza autorizzazione, per fini non vietati dalla legge penale.",
    19: "Tutti hanno diritto di professare liberamente la propria fede religiosa.", 21: "Tutti hanno diritto di manifestare liberamente il proprio pensiero con la parola, lo scritto e ogni altro mezzo di diffusione.",
    24: "Tutti possono agire in giudizio per la tutela dei propri diritti. La difesa è un diritto inviolabile.", 27: "La responsabilità penale è personale. L'imputato non è considerato colpevole sino alla condanna definitiva. Le pene devono tendere alla rieducazione.",
    29: "La Repubblica riconosce i diritti della famiglia come società naturale fondata sul matrimonio.", 32: "La Repubblica tutela la salute come fondamentale diritto dell'individuo e interesse della collettività.",
    33: "L'arte e la scienza sono libere e libero ne è l'insegnamento.", 34: "La scuola è aperta a tutti. L'istruzione inferiore, impartita per almeno otto anni, è obbligatoria e gratuita.",
    35: "La Repubblica tutela il lavoro in tutte le sue forme ed applicazioni.", 36: "Il lavoratore ha diritto a una retribuzione proporzionata alla quantità e qualità del suo lavoro e sufficiente ad assicurare a sé e alla famiglia un'esistenza libera e dignitosa; ha diritto al riposo settimanale e a ferie annuali retribuite.",
    37: "La donna lavoratrice ha gli stessi diritti e, a parità di lavoro, le stesse retribuzioni che spettano al lavoratore. La legge tutela il lavoro dei minori.", 41: "L'iniziativa economica privata è libera, ma non può svolgersi in contrasto con l'utilità sociale o in modo da recare danno alla salute, all'ambiente, alla sicurezza, alla libertà, alla dignità umana.",
    48: "Sono elettori tutti i cittadini che hanno raggiunto la maggiore età. Il voto è personale ed eguale, libero e segreto.", 53: "Tutti sono tenuti a concorrere alle spese pubbliche in ragione della loro capacità contributiva.",
    54: "Tutti i cittadini hanno il dovere di essere fedeli alla Repubblica e di osservarne la Costituzione e le leggi."
  };
  function diritto() {
    el("atCorpo").innerHTML = testa("⚖️ Caso di Diritto", "Fly Aula inventa un caso di tutti i giorni; la classe si divide i ruoli e cerca la soluzione negli articoli della Costituzione (il testo degli articoli è riassunto da Fly Aula, non dal cervello).") +
      `<div class="riga-btn"><input id="atTemaD" class="at-input" maxlength="100" placeholder="Tema (facoltativo): es. lavoro, scuola, libertà di parola, ambiente"><button class="btn" id="atCaso">⚖️ Prepara il caso</button></div><div id="atCasoBox"></div>`;
    el("atCaso").onclick = async () => {
      if (!modello) return mostraAiuto();
      const tema = el("atTemaD").value.trim(), sic = controllaDomanda(tema || "diritto", "diritto"); if (!sic.ok) { el("atCasoBox").innerHTML = `<p class="at-msg">${esc(sic.risposta)}</p>`; return; }
      el("atCasoBox").innerHTML = `<div class="lavoro">⚖️ Preparo il caso…</div>`;
      try {
        const j = json(await cervello(`Inventi un CASO di vita quotidiana per una lezione di Diritto (scuola superiore), con nomi inventati, senza violenza e senza reati gravi. Articoli disponibili della Costituzione: ${Object.entries(COSTITUZIONE).map(([n, t]) => `art. ${n}: ${t.slice(0, 70)}`).join(" | ")}.
Rispondi SOLO con JSON: {"titolo": "…", "caso": "5-7 frasi", "ruoli": ["3-4 ruoli per la classe"], "domande": ["2-3 domande"], "articoli": [numeri degli articoli utili, presi SOLO dall'elenco]}`, `Tema: ${tema || "a scelta"}`, { temperature: 0.6, format: "json" }));
        const arts = [...new Set((Array.isArray(j.articoli) ? j.articoli : []).map(Number))].filter(n => COSTITUZIONE[n]).slice(0, 4);
        const testo = String(j.caso || "").slice(0, 1400);
        if (!testo || !controllaRisposta(testo, "diritto")) throw new Error("caso");
        el("atCasoBox").innerHTML = `<div class="st-doc"><h3>📁 ${esc(String(j.titolo || "Il caso").slice(0, 80))}</h3><p>${esc(testo)}</p>
          ${Array.isArray(j.ruoli) && j.ruoli.length ? `<h3>🎭 I ruoli</h3><ul>${j.ruoli.slice(0, 4).map(r => `<li>${esc(String(r).slice(0, 100))}</li>`).join("")}</ul>` : ""}
          ${Array.isArray(j.domande) && j.domande.length ? `<h3>❓ Le domande</h3><ul>${j.domande.slice(0, 3).map(r => `<li>${esc(String(r).slice(0, 200))}</li>`).join("")}</ul>` : ""}
          ${arts.length ? `<h3>📜 Articoli della Costituzione utili</h3>${arts.map(n => `<p><b>Art. ${n}</b> — ${esc(COSTITUZIONE[n])}</p>`).join("")}` : ""}
          <p class="st-nota">Il caso è inventato da Fly Aula; gli articoli sono riassunti. Per il testo esatto: la Costituzione.</p></div>`;
        conta("casiDiritto");
      } catch (e) { el("atCasoBox").innerHTML = `<p class="at-msg">Il cervello non ha risposto bene: riprova.</p>`; }
    };
  }

  return { apri, chiudi, raccogli, istruzioniIntervista, fineIntervista, get intervista() { return intervista; }, nuovaFattura, domandaInvalsi, erroreNeiConti, COSTITUZIONE, PERSONAGGI };
})();
