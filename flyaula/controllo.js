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

async function revisiona(cervello, domanda, risposta, contesto) {
  const testo = `CONTESTO: ${contesto}\nDOMANDA: ${domanda}\nRISPOSTA DA CONTROLLARE:\n${risposta}`;
  const out = await cervello(ISTRUZIONI_REVISORE, testo, { temperature: 0, format: "json" });
  try {
    const j = JSON.parse(out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1));
    if (j.ok === false && typeof j.correzione === "string" && j.correzione.trim().length > 20) return { ok: false, problema: String(j.problema || "errore"), correzione: j.correzione.trim() };
    return { ok: true };
  } catch (e) { return { ok: null }; }   // il revisore non ha risposto bene: lo diciamo
}
