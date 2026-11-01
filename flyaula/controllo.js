// ===================================================================
//  FLY AULA · i controlli (SEMPRE, su ogni risposta)
//  1) calcolatrice vera su ogni conto  2) se la domanda è un conto, il risultato
//  lo calcoliamo noi  3) un secondo passaggio del cervello rilegge tutto da revisore
// ===================================================================
const num = s => Number(String(s).replace(/\./g, "").replace(",", "."));
const numDot = s => Number(String(s).replace(",", "."));
function leggiNumero(s) { return /,\d/.test(s) || /^\d{1,3}(\.\d{3})+$/.test(s) ? num(s) : numDot(s); }
function formatta(x) {
  if (!isFinite(x)) return null;
  const r = Math.round(x * 1e6) / 1e6;
  return r.toLocaleString("it-IT", { maximumFractionDigits: 6 }).replace(/ /g, "");
}
function calcola(A, op, B) {
  if ("+".includes(op)) return A + B;
  if ("-−".includes(op)) return A - B;
  if ("×x*·".includes(op)) return A * B;
  return B === 0 ? NaN : A / B;
}

// 0) il cervello a volte scrive in LaTeX (\( \), \times, \frac…): lo traduciamo in simboli normali
const SIMBOLI_LATEX = { times: "×", cdot: "×", div: ":", pm: "±", mp: "∓", leq: "≤", le: "≤", geq: "≥", ge: "≥", neq: "≠", ne: "≠", approx: "≈",
  infty: "∞", pi: "π", alpha: "α", beta: "β", gamma: "γ", delta: "δ", Delta: "Δ", theta: "θ", lambda: "λ", mu: "μ", sigma: "σ", Sigma: "Σ",
  Rightarrow: "⇒", implies: "⇒", rightarrow: "→", to: "→", Leftrightarrow: "⇔", iff: "⇔", circ: "°", degree: "°", cdots: "…", ldots: "…", dots: "…",
  in: "∈", cup: "∪", cap: "∩", forall: "∀", exists: "∃", perp: "⊥", parallel: "∥", angle: "∠", triangle: "△" };
function pulisciLatex(t) {
  let s = String(t);
  // potenze e pedici scritti "alla tastiera": x^2 → x², x_1 → x₁
  s = s.replace(/\^\{?2\}?(?!\d)/g, "²").replace(/\^\{?3\}?(?!\d)/g, "³").replace(/([a-zA-Z])_\{?(\d)\}?/g, (m, l, d) => l + "₀₁₂₃₄₅₆₇₈₉"[+d]);
  if (!/\\[a-zA-Z()[\]{}%]|\$/.test(s)) return s;
  const semplice = x => /^\s*-?[\w.,²³]+\s*$/.test(x);
  s = s.replace(/\$\$([\s\S]+?)\$\$/g, "$1").replace(/\$([^$\n]+?)\$/g, "$1");
  s = s.replace(/\\begin\{(?:cases|array|aligned|align\*?|system)\}(?:\{[^}]*\})?([\s\S]*?)\\end\{(?:cases|array|aligned|align\*?|system)\}/g,
    (m, c) => "{ " + c.split(/\\\\/).map(x => x.replace(/&/g, "").trim()).filter(Boolean).join(" ; ") + " }");
  for (let k = 0; k < 3; k++) {   // anche frazioni dentro le frazioni
    s = s.replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, (m, a, b) => (semplice(a) ? a.trim() : "(" + a.trim() + ")") + "/" + (semplice(b) ? b.trim() : "(" + b.trim() + ")"));
    s = s.replace(/\\sqrt\s*\{([^{}]*)\}/g, (m, a) => "√" + (semplice(a) ? a.trim() : "(" + a.trim() + ")"));
    s = s.replace(/\\(?:text|mathrm|mathbf|textbf|textit|operatorname|boxed|mathit)\s*\{([^{}]*)\}/g, "$1");
  }
  s = s.replace(/\\left|\\right|\\displaystyle|\\,|\\;|\\!|\\:|\\quad|\\qquad/g, " ");
  s = s.replace(/\\\(|\\\)|\\\[|\\\]/g, "");
  s = s.replace(/\\%/g, "%").replace(/\\\{/g, "{").replace(/\\\}/g, "}").replace(/\\\\/g, " ");
  s = s.replace(/\\([a-zA-Z]+)/g, (m, w) => SIMBOLI_LATEX[w] !== undefined ? SIMBOLI_LATEX[w] : w);
  s = s.replace(/\^\{?2\}?(?!\d)/g, "²").replace(/\^\{?3\}?(?!\d)/g, "³").replace(/\^\{([^{}]*)\}/g, "^$1");
  s = s.replace(/([a-zA-Z])_\{?(\d)\}?/g, (m, l, d) => l + "₀₁₂₃₄₅₆₇₈₉"[+d]);
  return s.replace(/[ \t]{2,}/g, " ").replace(/ +([,.;:)])(?=\s|$)/g, "$1").replace(/\( +/g, "(");
}

// 1) calcolatrice: "320 : 8 = 40", "3 × 3 − 4 = 5", "(3 + 2) × 4 = 20"… → ricalcola il conto INTERO e, se serve, corregge.
//    Si controlla solo un conto completo: mai un pezzo di un conto più lungo, mai dentro una proporzione,
//    mai una divisione "con il resto", mai dopo un esponente o una radice.
const OPC = "+\\-−×x*·÷:\\/";
const RE_CONTO = new RegExp(
  `(?<![\\w.,()^²³√%${OPC}])` +
  // ":" è una divisione solo con gli spazi da tutte e due le parti ("8 : 4") o senza spazi ("8:4"); "cifra 4: 4 : 4" non è "4 : 4 : 4"
  `([-−]?\\(?\\d+(?:[.,]\\d+)*\\)?(?:(?:\\s*[+\\-−×x*·÷\\/]\\s*|\\s+:\\s+|:(?=\\(?[-−]?\\d))\\(?[-−]?\\d+(?:[.,]\\d+)*\\)?)+)` +
  `\\s*=\\s*([-−]?\\d+(?:[.,]\\d+)*)` +
  `(?!\\s*[${OPC}^²³%]\\s*\\(?\\d)(?!\\s*,?\\s*(?:con\\s+)?(?:il\\s+)?(?:resto|r\\.?\\s*\\d))(?![.,]?\\d)`, "gi");
function decimaliDi(c) { const m = /,(\d+)$/.exec(c) || /\.(\d{1,2})$/.exec(c); return m ? m[1].length : 0; }
// valuta il conto intero: tutti i conti delle risposte passano da qui
function rifaiConto(espr, risultato) {
  // una parentesi del testo attaccata al conto, es. "(8 × 4 = 32)": si toglie
  let e = espr.trim();
  const conta = (x, c) => (x.match(c === "(" ? /\(/g : /\)/g) || []).length;
  while (conta(e, "(") > conta(e, ")") && e.startsWith("(")) e = e.slice(1).trim();
  while (conta(e, ")") > conta(e, "(") && e.endsWith(")")) e = e.slice(0, -1).trim();
  if (conta(e, "(") !== conta(e, ")")) return null;
  espr = e;
  const g = valuta(espr), C = leggiNumero(String(risultato).replace("−", "-"));
  if (!isFinite(g) || !isFinite(C)) return null;
  const d = decimaliDi(risultato), tol = Math.max(1e-6 * Math.max(1, Math.abs(g)), d ? 0.5 * Math.pow(10, -d) + 1e-9 : 0);
  const giusto = Math.abs(g - C) <= tol;
  const bello = Number.isInteger(Math.round(g * 1e6) / 1e6) ? formatta(g) : formatta(Math.round(g * 100) / 100);
  return { giusto, valore: g, scritto: bello };
}
const bellaEspr = e => e.replace(/\s*\*\s*/g, " × ").replace(/(\d)\s*-\s*(\d)/g, "$1 − $2").replace(/\s{2,}/g, " ").trim();
function controllaConti(testo, segna) {
  return testo.replace(RE_CONTO, (tutto, espr, c) => {
    const r = rifaiConto(espr, c);
    if (!r) return tutto;
    if (r.giusto) {
      segna && segna("ok");
      return `<span class="conto">${bellaEspr(espr)} = ${c}</span><span class="verificato">✓ calcolatrice</span>`;
    }
    segna && segna("corretto", `${espr} = ${c} → giusto: ${r.scritto}`);
    return `<span class="conto">${bellaEspr(espr)} = ${r.scritto}</span><span class="corretto">✎ corretto dalla calcolatrice</span>`;
  });
}

// 2) se la domanda è un conto secco ("quanto fa 320 : 8?"), il risultato giusto lo sappiamo già
function contoNellaDomanda(domanda) {
  const d = domanda.replace(/per\b/gi, "×").replace(/diviso\b/gi, ":").replace(/più\b/gi, "+").replace(/meno\b/gi, "−");
  const m = d.match(/(\d+(?:[.,]\d+)*)\s*([+\-−×x*·÷:\/])\s*(\d+(?:[.,]\d+)*)(?!\s*[\d+\-−×x*·÷:\/=])/);
  if (!m) return null;
  // solo se nella domanda c'è UN solo conto (altrimenti è un problema più complesso)
  if ((d.match(/\d+(?:[.,]\d+)*\s*[+\-−×x*·÷:\/]\s*\d/g) || []).length !== 1) return null;
  const r = calcola(leggiNumero(m[1]), m[2], leggiNumero(m[3]));
  return isFinite(r) ? { testo: `${m[1]} ${m[2]} ${m[3]}`, risultato: r } : null;
}
function contieneRisultato(testo, r) {
  const numeri = (testo.match(/-?\d+(?:[.,]\d+)*/g) || []).map(leggiNumero);
  return numeri.some(x => Math.abs(x - r) < 1e-6 * Math.max(1, Math.abs(r)) || Math.abs(x - Math.round(r * 100) / 100) < 1e-9);
}

// 3) il revisore: un secondo passaggio del cervello rilegge la risposta, severo
const ISTRUZIONI_REVISORE = `Sei un REVISORE severissimo di risposte scolastiche. Controlli la risposta di un assistente per una classe.
Controlla: 1) ogni calcolo e ogni passaggio; 2) che il risultato finale risponda davvero alla domanda; 3) definizioni e regole; 4) che non ci siano contraddizioni; 5) che il linguaggio sia adatto alla scuola.
Rispondi SOLO con un oggetto JSON, senza altro testo:
{"ok": true}  se è tutto giusto
{"ok": false, "problema": "frase breve che spiega l'errore", "correzione": "la risposta completa riscritta in modo giusto, con gli stessi passaggi numerati e lo stesso stile"}  se c'è anche un solo errore.`;

// il terzo controllo: un revisore diverso, che prima risolve da solo e poi confronta
const ISTRUZIONI_TERZO = `Sei il TERZO REVISORE, indipendente, di risposte scolastiche. Altri due controlli sono già stati fatti, ma tu non ti fidi.
Metodo: 1) PRIMA risolvi tu la domanda da solo, in silenzio, passo per passo; 2) POI confronta il tuo risultato e i tuoi fatti con la risposta; 3) controlla ogni numero, ogni data, ogni definizione, ogni regola.
Se nel CONTESTO ci sono PAGINE DEL LIBRO, quelle sono la fonte giusta: la risposta non deve contraddirle.
Rispondi SOLO con un oggetto JSON, senza altro testo:
{"ok": true}  se è tutto giusto
{"ok": false, "problema": "frase breve che spiega l'errore", "correzione": "la risposta completa riscritta in modo giusto, con gli stessi passaggi numerati e lo stesso stile"}  se c'è anche un solo errore.`;

// pensa = true: il cervello può "ragionare a lungo" prima di rispondere (solo nei casi difficili)
async function revisiona(cervello, domanda, risposta, contesto, istruzioni = ISTRUZIONI_REVISORE, pensa = false) {
  const testo = `CONTESTO: ${contesto}\nDOMANDA: ${domanda}\nRISPOSTA DA CONTROLLARE:\n${risposta}`;
  const out = await cervello(istruzioni, testo, { temperature: 0, format: "json", pensa });
  try {
    const j = JSON.parse(out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1));
    if (j.ok === false && typeof j.correzione === "string" && j.correzione.trim().length > 20) return { ok: false, problema: pulisciLatex(String(j.problema || "errore")), correzione: pulisciLatex(j.correzione.trim()) };
    if (j.ok === true) return { ok: true };
    return { ok: null };
  } catch (e) { return { ok: null }; }   // il revisore non ha risposto bene: lo diciamo
}

// 4) la calcolatrice sul testo: corregge i conti sbagliati e dice quanti erano
function correggiConti(testo) {
  let n = 0;
  const out = testo.replace(RE_CONTO, (tutto, espr, c) => {
    const r = rifaiConto(espr, c);
    if (!r || r.giusto) return tutto;
    n++; return `${espr} = ${r.scritto}`;
  });
  return { testo: out, corretti: n, conti: (testo.match(RE_CONTO) || []).length };
}

// 5) partita doppia: in ogni scrittura il totale Dare deve essere uguale al totale Avere
function leggiScrittura(spec) {
  const righe = spec.replace(/^\s*scrittura\s*/i, "").split("|").map(x => x.trim()).filter(Boolean).map(r => {
    const m = r.match(/^(.+?)\s+(D|A|Dare|Avere)\s+(-?\d+(?:[.,]\d+)*)\s*€?$/i);
    return m ? { conto: m[1].trim(), lato: m[2][0].toUpperCase(), importo: leggiNumero(m[3]) } : null;
  });
  if (!righe.length || righe.some(r => !r || !isFinite(r.importo))) return null;
  const dare = righe.filter(r => r.lato === "D").reduce((a, r) => a + r.importo, 0), avere = righe.filter(r => r.lato === "A").reduce((a, r) => a + r.importo, 0);
  return { righe, dare: Math.round(dare * 100) / 100, avere: Math.round(avere * 100) / 100, quadra: Math.abs(dare - avere) < 0.005 };
}
function controllaScritture(testo) {
  const problemi = [];
  for (const m of testo.matchAll(/\[DISEGNO:\s*(scrittura[^\]]*)\]/gi)) {
    const s = leggiScrittura(m[1]);
    if (!s) problemi.push(`la scrittura "${m[1].slice(0, 60)}" è scritta male (serve: conto D importo | conto A importo)`);
    else if (!s.quadra) problemi.push(`la scrittura in partita doppia NON quadra: totale Dare ${formatta(s.dare)} ≠ totale Avere ${formatta(s.avere)}`);
  }
  return problemi;
}

// ===================================================================
//  IL RICONTROLLO COMPLETO: SEMPRE 2 controlli, 3 nei casi speciali
//  controllo 1 = calcolatrice (+ risultato giusto se la domanda è un conto)
//  controllo 2 = revisore severo
//  controllo 3 = revisore indipendente, quando:
//    - un controllo ha trovato un errore (si ricontrolla anche la correzione)
//    - calcolatrice e revisore non sono d'accordo
//    - non ci sono conti da verificare con la calcolatrice (fatti, regole, teoria)
//    - il caso è speciale (esercizi, lingue, materie senza calcolatrice…)
//  Se dopo il terzo c'è ancora un dubbio: NON si inventa, si avvisa il prof.
// ===================================================================
// cervello = chi ha scritto la risposta; controllore = chi la controlla (con la coppia è l'altro cervello)
async function ricontrolloCompleto(cervello, { controllore = null, domanda, testo, contesto, conto = null, speciale = false, risultatoObbligatorio = true, ogniPasso = () => {} }) {
  const altro = controllore || cervello;
  const esito = { controlli: 0, contiCorretti: 0, correzioni: [], stato: "ok", testo };
  // controllo 1: calcolatrice
  ogniPasso(1);
  let c = correggiConti(esito.testo);
  esito.testo = c.testo; esito.contiCorretti += c.corretti; esito.controlli++;
  const scrittureSbagliate = controllaScritture(esito.testo);
  const contiDaVerificare = c.conti + (esito.testo.match(/\[DISEGNO:\s*scrittura/gi) || []).length;
  const ctx = contesto + (conto ? ` FATTO SICURO (calcolatrice): ${conto.testo} = ${formatta(conto.risultato)}.` : "")
    + (scrittureSbagliate.length ? ` FATTO SICURO (calcolatrice): ${scrittureSbagliate.join("; ")}. Va corretta.` : "");
  // controllo 2: revisore (se non risponde bene, riprova una volta)
  // ⏱️ in classe c'è un tempo massimo: se finisce ci si ferma qui, e la risposta arriva con un timbro onesto
  ogniPasso(2);
  esito.tempi = [];
  const fermo = e => { if (e && e.name === "FuoriTempo") { esito.fuoriTempo = true; return; } throw e; };
  let r1 = { ok: null }, t0 = Date.now();
  try { r1 = await revisiona(altro, domanda, esito.testo, ctx); if (r1.ok === null) r1 = await revisiona(altro, domanda, esito.testo, ctx); }
  catch (e) { fermo(e); }
  esito.tempi.push(Date.now() - t0);
  if (esito.fuoriTempo) return chiudiEsito(esito, conto, risultatoObbligatorio);
  esito.controlli++;
  if (r1.ok === false) {
    esito.correzioni.push(r1.problema);
    c = correggiConti(r1.correzione); esito.testo = c.testo; esito.contiCorretti += c.corretti;
  }
  // controllo 3: solo quando serve
  const disaccordo = (r1.ok === true && esito.contiCorretti > 0) || scrittureSbagliate.length > 0;
  const terzo = r1.ok !== true || disaccordo || speciale || contiDaVerificare === 0;
  if (terzo) {
    ogniPasso(3);
    // caso difficile (errore trovato o disaccordo): il terzo revisore ragiona a lungo
    // con la coppia lo fa il cervello che NON ha fatto il controllo 2: ogni controllo è un parere nuovo
    let r2 = null; t0 = Date.now();
    try { r2 = await revisiona(cervello, domanda, esito.testo, ctx, ISTRUZIONI_TERZO, r1.ok !== true || disaccordo); }
    catch (e) { fermo(e); }
    esito.tempi.push(Date.now() - t0);
    if (esito.fuoriTempo) return chiudiEsito(esito, conto, risultatoObbligatorio);
    esito.controlli++;
    if (r2.ok === false) {
      esito.correzioni.push(r2.problema);
      c = correggiConti(r2.correzione); esito.testo = c.testo; esito.contiCorretti += c.corretti;
      // il terzo ha trovato un errore anche dopo una correzione: troppi dubbi
      if (r1.ok === false) esito.stato = "dubbio";
    } else if (r2.ok === null && r1.ok === null) esito.stato = "dubbio";
  }
  return chiudiEsito(esito, conto, risultatoObbligatorio);
}
// la fine di ogni ricontrollo (anche quando il tempo è finito): partita doppia, risultato della calcolatrice, stato
function chiudiEsito(esito, conto, risultatoObbligatorio) {
  // la partita doppia deve quadrare anche alla fine: altrimenti è un dubbio
  const restano = controllaScritture(esito.testo);
  if (restano.length) { esito.stato = "dubbio"; esito.correzioni.push(restano[0]); }
  if (esito.stato !== "dubbio" && (esito.correzioni.length || esito.contiCorretti)) esito.stato = "corretta";
  // se la domanda era un conto secco, il risultato giusto deve esserci (salvo scelta del prof)
  if (conto && risultatoObbligatorio && !contieneRisultato(esito.testo, conto.risultato)) {
    esito.testo += `\n✅ Risultato della calcolatrice: ${conto.testo} = ${formatta(conto.risultato)}`;
    esito.correzioni.push(`mancava il risultato giusto: ${conto.testo} = ${formatta(conto.risultato)}`);
    if (esito.stato === "ok") esito.stato = "corretta";
  }
  return esito;
}

// ===================================================================
//  🧮 LA CALCOLATRICE FA I CONTI (prima che il cervello scriva)
//  Il cervello dice SOLO quali conti servono; i numeri li calcola la
//  calcolatrice. Poi il cervello spiega usando quei risultati.
//  Così gli errori di aritmetica spariscono alla radice.
// ===================================================================
const ISTRUZIONI_PIANO = `Prepari i CONTI per risolvere una domanda di scuola. NON spiegare e NON risolvere a parole: elenca solo i conti che servono, in ordine.
Rispondi SOLO con JSON: {"conti": [{"cosa": "che cosa calcola, in 2-5 parole", "espressione": "il conto"}]}
Regole per "espressione":
- solo numeri e + - * / ( ) ^ (potenza) sqrt( ) (radice quadrata). Niente lettere, niente unità di misura, niente €.
- decimali con il punto (0.25), MAI separatori delle migliaia (1000, non 1.000).
- per usare il risultato di un conto precedente scrivi #1, #2, … (es. "150 - #1").
- percentuale: il 20% di 150 → "150 * 20 / 100".
- equazioni e sistemi: scrivi i conti che danno il valore dell'incognita (es. per 2x + 3 = 11 → "(11 - 3) / 2").
- massimo 8 conti.
Se la domanda NON chiede conti (teoria, definizioni, regole), rispondi {"conti": []}.`;

// prende il piano del cervello e lo fa calcolare alla calcolatrice: restituisce solo i conti validi
function eseguiPiano(piano) {
  const fatti = [], valori = [];
  const lista = Array.isArray(piano && piano.conti) ? piano.conti.slice(0, 8) : [];
  for (const c of lista) {
    const e = String((c && c.espressione) || "").trim();
    if (!e || e.length > 120) { valori.push(NaN); continue; }
    let rotto = false;
    const sostituita = e.replace(/#(\d+)/g, (_, k) => { const v = valori[+k - 1]; if (!isFinite(v)) rotto = true; return "(" + v + ")"; });
    const v = rotto ? NaN : valutaPulita(sostituita.replace(/,/g, "."));
    valori.push(v);
    if (!isFinite(v)) continue;
    // come si scrive alla lavagna: × e :, numeri all'italiana, al posto di #1 il suo risultato
    const leggibile = e.replace(/\d+\.\d+/g, x => formatta(Number(x)))
      .replace(/sqrt\s*\(/gi, "√(").replace(/\*/g, " × ").replace(/\//g, " : ").replace(/(?<=\d|\)|#\d+)\s*-\s*/g, " − ")
      .replace(/#(\d+)/g, (_, k) => formatta(valori[+k - 1])).replace(/\s+/g, " ").trim();
    fatti.push({ cosa: String(c.cosa || "").slice(0, 60), testo: leggibile, risultato: v });
  }
  return fatti;
}
async function pianoConti(cervello, domanda, materiaNome) {
  try {
    const out = await cervello(ISTRUZIONI_PIANO, `Materia: ${materiaNome}\nDOMANDA: ${domanda}`, { temperature: 0, format: "json" });
    return eseguiPiano(JSON.parse(out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1)));
  } catch (e) { return []; }            // se il piano non arriva, si va avanti come prima
}
// i risultati da dare al cervello prima che scriva la risposta
function istruzioniFatti(fatti) {
  if (!fatti.length) return "";
  return `\nCONTI GIÀ FATTI DALLA CALCOLATRICE (i numeri sono sicuri: usali così come sono, NON rifare i conti a mente; controlla solo che siano i conti giusti per la domanda):\n`
    + fatti.map((f, i) => `${i + 1}. ${f.cosa ? f.cosa + ": " : ""}${f.testo} = ${formatta(f.risultato)}`).join("\n");
}

// ===================================================================
//  ✏️ I PASSAGGI IN COLONNA, CALCOLATI DA FLY AULA
//  Per un conto secco (320 : 8, 345 + 278…) Fly Aula prepara lei i passaggi
//  cifra per cifra, come sul quaderno: il cervello li deve solo raccontare.
// ===================================================================
const POSTI = ["unità", "decine", "centinaia", "migliaia", "decine di migliaia", "centinaia di migliaia", "milioni", "decine di milioni", "centinaia di milioni"];
const cifre = n => String(n).split("").map(Number);
function passiInColonna(a, op, b) {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a > 999999999 || b > 999999999) return null;
  const f = formatta, passi = [];
  if (":÷/".includes(op)) {
    if (b === 0 || b > 999 || a > 9999999) return null;
    const d = cifre(a); let i = 0, parz = 0;
    // la prima "presa": tante cifre quante servono per arrivare almeno al divisore
    while (i < d.length && parz * 10 + d[i] < b && i < d.length - 1) { parz = parz * 10 + d[i]; i++; }
    parz = parz * 10 + d[i];
    if (i > 0) passi.push(`${d.slice(0, i).join("")} : ${b} non si può (${d.slice(0, i).join("")} è più piccolo di ${b}): prendo ${i + 1} cifre, cioè ${parz}.`);
    let q = Math.floor(parz / b), r = parz - q * b, quoz = String(q);
    // (scritto "= 3 con resto 2": così la calcolatrice sa che è una divisione con il resto e non la "corregge")
    const unPasso = (parz, q, r) => r ? `${parz} : ${b} = ${q} con resto ${r} (${q ? `perché ${q} × ${b} = ${q * b}` : `${parz} è più piccolo di ${b}`})`
      : `${parz} : ${b} = ${q} (${q ? `perché ${q} × ${b} = ${q * b}` : "zero diviso un numero fa sempre 0"}), resto 0`;
    passi.push(unPasso(parz, q, r) + ".");
    for (i = i + 1; i < d.length; i++) {
      parz = r * 10 + d[i]; q = Math.floor(parz / b); r = parz - q * b; quoz += q;
      passi.push(`Abbasso la cifra ${d[i]} e ottengo ${parz}. ${unPasso(parz, q, r)}.`);
    }
    const Q = Number(quoz);
    passi.push(`Risultato: ${a} : ${b} = ${f(Q)}${r ? ` con il resto di ${r}` : ""}. Prova: ${f(Q)} × ${b}${r ? ` + ${r}` : ""} = ${f(a)} ✓`);
    return passi;
  }
  if (op === "+") {
    const A = cifre(a).reverse(), B = cifre(b).reverse(); let rip = 0;
    for (let k = 0; k < Math.max(A.length, B.length); k++) {
      const x = A[k] || 0, y = B[k] || 0, s = x + y + rip;
      passi.push(`${POSTI[k][0].toUpperCase() + POSTI[k].slice(1)}: ${x} + ${y}${rip ? ` + ${rip} (riporto)` : ""} = ${s}: ${s >= 10 ? `scrivo ${s % 10} e riporto 1` : `scrivo ${s}`}.`);
      rip = s >= 10 ? 1 : 0;
    }
    if (rip) passi.push(`Il riporto 1 va scritto davanti: è il nuovo primo numero.`);
    passi.push(`Risultato: ${f(a)} + ${f(b)} = ${f(a + b)}.`);
    return passi.length <= 11 ? passi : null;
  }
  if ("-−".includes(op)) {
    if (a < b) return null;
    const A = cifre(a).reverse(), B = cifre(b).reverse(); let prestito = 0;
    const Pos = k => POSTI[k][0].toUpperCase() + POSTI[k].slice(1);
    for (let k = 0; k < A.length; k++) {
      const orig = A[k], y = B[k] || 0, x = orig - prestito;
      if (k >= B.length && k === A.length - 1 && x === 0) break;            // lo zero davanti non si scrive
      if (prestito && orig === 0) {                                           // lo 0 non ha niente da prestare: diventa 9
        passi.push(`${Pos(k)}: lo 0 ha dovuto prestare 1, ma non ha niente: prende 1 dalla cifra a sinistra e diventa 9. 9 − ${y} = ${9 - y}.`);
        prestito = 1;
      } else if (x < y) {
        passi.push(`${Pos(k)}: ${x} − ${y} non si può${prestito ? ` (il ${orig} ha prestato 1 ed è diventato ${x})` : ""}: prendo 1 in prestito dalla cifra a sinistra, ${x + 10} − ${y} = ${x + 10 - y}.`);
        prestito = 1;
      } else {
        passi.push(`${Pos(k)}: ${x} − ${y} = ${x - y}${prestito ? ` (il ${orig} ha prestato 1 ed è diventato ${x})` : ""}.`);
        prestito = 0;
      }
    }
    passi.push(`Risultato: ${f(a)} − ${f(b)} = ${f(a - b)}. Prova: ${f(a - b)} + ${f(b)} = ${f(a)} ✓`);
    return passi.length <= 11 ? passi : null;
  }
  if ("×x*·".includes(op)) {
    if (b > 999 || a > 9999999) return null;
    const B = cifre(b).reverse();
    if (B.length === 1) {
      const A = cifre(a).reverse(); let rip = 0;
      for (let k = 0; k < A.length; k++) {
        const p = A[k] * b + rip;
        passi.push(`${b} × ${A[k]}${rip ? ` + ${rip} (riporto)` : ""} = ${p}: ${k === A.length - 1 ? `scrivo ${p}` : p >= 10 ? `scrivo ${p % 10} e riporto ${Math.floor(p / 10)}` : `scrivo ${p}`}.`);
        rip = Math.floor(p / 10);
      }
      passi.push(`Risultato: ${f(a)} × ${b} = ${f(a * b)}.`);
      return passi.length <= 11 ? passi : null;
    }
    const parziali = [];
    B.forEach((c, k) => {
      const p = a * c * Math.pow(10, k); parziali.push(p);
      passi.push(k === 0 ? `${f(a)} × ${c} (unità) = ${f(a * c)}.` : `${f(a)} × ${c} (${POSTI[k]}) = ${f(a * c)}: si scrive spostato di ${k} ${k === 1 ? "posto" : "posti"} a sinistra, cioè ${f(p)}.`);
    });
    passi.push(`Sommo i risultati: ${parziali.map(f).join(" + ")} = ${f(a * b)}.`);
    passi.push(`Risultato: ${f(a)} × ${f(b)} = ${f(a * b)}.`);
    return passi;
  }
  return null;
}

// ===================================================================
//  🤖 NIENTE FRASI DA ROBOT SULLA LAVAGNA
//  Si tolgono le frasi in cui il cervello parla delle sue istruzioni o di sé come
//  "modello", e (se il disegno c'è) quelle in cui dice di non saper disegnare.
// ===================================================================
const FRASI_ROBOT = [
  // (le "istruzioni" di un programma, in Informatica, non si toccano)
  /\bistruzion[ie]\b(?![^.!?\n]{0,40}\b(computer|macchina|processore|cpu|programm\w*|codice|algoritm\w*|robot|python|ciclo|linguaggio|calcolatore)\b)[^.!?\n]{0,40}\b(date|ricevute|che ho|del sistema|fornite)\b/i,
  // "come modello di mercato", "come programma di viaggio"… vanno bene: si tolgono solo le frasi su di sé
  /\b(come|in quanto)\s+(un |una )?(modello (linguistico|di (intelligenza artificiale|linguaggio|ia))|intelligenza artificiale|ia|ai|assistente virtuale)\s*,?\s*(non|io|posso|ho|sono|devo)\b/i,
  /\bsono (solo |soltanto |semplicemente )?(un|una|un')\s*(modello( linguistico| di (intelligenza artificiale|linguaggio))?|intelligenza artificiale|ia|ai|assistente virtuale|programma( informatico| di intelligenza artificiale)?)\s*(,|\.|e\b|che\b|non\b|$)/i,
  /\b(system prompt|prompt di sistema|il mio prompt|le mie regole)\b/i,
  /\bsiamo concentrati sull[ae]? /i,
  /\bnon ho (accesso|la possibilità) (a internet|di navigare)/i
];
const FRASI_NO_DISEGNO = [
  /\bnon (posso|possiamo|riesco a|sono in grado di) (creare|fare|generare|disegnare|mostrare|produrre)[^.!?\n]{0,25}\b(immagin[ie]|disegn[oi]|foto|figur[ae])/i,
  /\bvuoi[^.!?\n]{0,60}\b(disegno|immagine)[^.!?\n]{0,40}\?/i,
  /\bse (hai bisogno|vuoi|serve)[^.!?\n]{0,50}\b(disegno|immagine|figura)/i
];
function ripulisciRobot(testo) {
  const haDisegno = /\[DISEGNO:/i.test(testo);
  const regole = haDisegno ? [...FRASI_ROBOT, ...FRASI_NO_DISEGNO] : FRASI_ROBOT;
  let tolte = 0;
  const righe = testo.split("\n").map(riga => {
    if (/^\s*\[DISEGNO:/i.test(riga)) return riga;
    const m = riga.match(/^(\s*\d+[.)]\s+)?(.*)$/);
    const pezzi = (m[2].match(/[^.!?]+[.!?]*\s*/g) || [m[2]]);
    const resto = pezzi.filter(f => { const via = regole.some(re => re.test(f)); if (via) tolte++; return !via; }).join("").trim();
    return resto ? (m[1] || "") + resto : null;
  }).filter(r => r !== null);
  const pulito = righe.join("\n").trim();
  // se togliendo le frasi non resta quasi niente, meglio lasciare com'era (e lo dirà il controllo)
  return { testo: pulito.replace(/\[DISEGNO:[^\]]*\]/gi, "").trim().length >= 25 ? pulito : testo, tolte };
}
