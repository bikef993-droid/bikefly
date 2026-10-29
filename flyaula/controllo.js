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

// 1) calcolatrice: "320 : 8 = 40", "3,5 × 2 = 7"… → ricalcola e, se serve, corregge
const RE_CONTO = /(\d+(?:[.,]\d+)*)\s*([+\-−×x*·÷:\/])\s*(\d+(?:[.,]\d+)*)\s*=\s*(-?\d+(?:[.,]\d+)*)/g;
function controllaConti(testo, segna) {
  return testo.replace(RE_CONTO, (tutto, a, op, b, c) => {
    const A = leggiNumero(a), B = leggiNumero(b), C = leggiNumero(c);
    const giusto = calcola(A, op, B);
    if (!isFinite(giusto) || !isFinite(A) || !isFinite(B)) return tutto;
    const opBella = { "x": "×", "*": "×", "·": "×", "/": ":", "÷": ":", "-": "−" }[op] || op;
    if (Math.abs(giusto - C) < 1e-6 * Math.max(1, Math.abs(giusto))) {
      segna && segna("ok");
      return `<span class="conto">${a} ${opBella} ${b} = ${c}</span><span class="verificato">✓ calcolatrice</span>`;
    }
    segna && segna("corretto", `${a} ${opBella} ${b} = ${c} → giusto: ${formatta(giusto)}`);
    return `<span class="conto">${a} ${opBella} ${b} = ${formatta(giusto)}</span><span class="corretto">✎ corretto dalla calcolatrice</span>`;
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

async function revisiona(cervello, domanda, risposta, contesto, istruzioni = ISTRUZIONI_REVISORE) {
  const testo = `CONTESTO: ${contesto}\nDOMANDA: ${domanda}\nRISPOSTA DA CONTROLLARE:\n${risposta}`;
  const out = await cervello(istruzioni, testo, { temperature: 0, format: "json" });
  try {
    const j = JSON.parse(out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1));
    if (j.ok === false && typeof j.correzione === "string" && j.correzione.trim().length > 20) return { ok: false, problema: String(j.problema || "errore"), correzione: j.correzione.trim() };
    if (j.ok === true) return { ok: true };
    return { ok: null };
  } catch (e) { return { ok: null }; }   // il revisore non ha risposto bene: lo diciamo
}

// 4) la calcolatrice sul testo: corregge i conti sbagliati e dice quanti erano
function correggiConti(testo) {
  let n = 0;
  const out = testo.replace(RE_CONTO, (tutto, a, op, b, c) => {
    const g = calcola(leggiNumero(a), op, leggiNumero(b));
    if (!isFinite(g) || Math.abs(g - leggiNumero(c)) < 1e-6 * Math.max(1, Math.abs(g))) return tutto;
    n++; return `${a} ${op} ${b} = ${formatta(g)}`;
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
async function ricontrolloCompleto(cervello, { domanda, testo, contesto, conto = null, speciale = false, risultatoObbligatorio = true, ogniPasso = () => {} }) {
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
  ogniPasso(2);
  let r1 = await revisiona(cervello, domanda, esito.testo, ctx);
  if (r1.ok === null) r1 = await revisiona(cervello, domanda, esito.testo, ctx);
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
    const r2 = await revisiona(cervello, domanda, esito.testo, ctx, ISTRUZIONI_TERZO);
    esito.controlli++;
    if (r2.ok === false) {
      esito.correzioni.push(r2.problema);
      c = correggiConti(r2.correzione); esito.testo = c.testo; esito.contiCorretti += c.corretti;
      // il terzo ha trovato un errore anche dopo una correzione: troppi dubbi
      if (r1.ok === false) esito.stato = "dubbio";
    } else if (r2.ok === null && r1.ok === null) esito.stato = "dubbio";
  }
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
