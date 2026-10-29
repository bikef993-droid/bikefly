// ===================================================================
//  FLY AULA · modalità esercizi
//  Fly Aula inventa un esercizio, la classe risponde, lei corregge.
//  Il risultato giusto lo controlla SEMPRE la calcolatrice: se il cervello
//  sbaglia l'esercizio, lo butta e ne fa un altro.
// ===================================================================

// calcolatrice per espressioni intere: "(1000 × 22) : 100", "3/4 × 120"…
function valuta(espr) {
  const t = String(espr).replace(/×|x|\*/gi, "*").replace(/:|÷/g, "/").replace(/−/g, "-").replace(/(\d)\.(\d{3})(?!\d)/g, "$1$2").replace(/,/g, ".");
  if (!/^[\d.+\-*/()\s%]+$/.test(t)) return NaN;
  const tok = t.match(/\d+(?:\.\d+)?|[+\-*/()%]/g) || [];
  let i = 0;
  const prossimo = () => tok[i], prendi = () => tok[i++];
  function fattore() {
    let v; const x = prendi();
    if (x === "(") { v = somma(); if (prendi() !== ")") return NaN; }
    else if (x === "-") v = -fattore();
    else v = Number(x);
    if (prossimo() === "%") { prendi(); v = v / 100; }
    return v;
  }
  function prodotto() { let v = fattore(); while (prossimo() === "*" || prossimo() === "/") { const o = prendi(), w = fattore(); v = o === "*" ? v * w : v / w; } return v; }
  function somma() { let v = prodotto(); while (prossimo() === "+" || prossimo() === "-") { const o = prendi(), w = prodotto(); v = o === "+" ? v + w : v - w; } return v; }
  const r = somma();
  return i === tok.length ? r : NaN;
}

const ISTRUZIONI_ESERCIZIO = (materia, livello, argomento) => `Inventa UN esercizio di ${materia} per la scuola ${livello}${argomento ? " sull'argomento: " + argomento : ""}.
Deve avere UN solo risultato numerico. Situazione concreta e adatta all'età.
Rispondi SOLO con JSON:
{"testo": "il testo dell'esercizio", "conto": "l'espressione che dà il risultato, solo con numeri, + - × : e parentesi", "risultato": numero, "unita": "unità di misura o vuoto", "spiegazione": "2-4 passaggi numerati che spiegano come si risolve"}`;

async function creaEsercizio(cervello, materia, livello, argomento) {
  for (let tentativo = 0; tentativo < 3; tentativo++) {
    try {
      const out = await cervello(ISTRUZIONI_ESERCIZIO(materia, livello, argomento), "Nuovo esercizio, diverso dai precedenti. Numero casuale: " + Math.random().toString(36).slice(2, 7), { temperature: 0.8, format: "json" });
      const j = JSON.parse(out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1));
      const r = Number(String(j.risultato).replace(",", "."));
      const c = valuta(j.conto);
      // controllo SEMPRE: il conto dell'esercizio deve dare proprio il risultato dichiarato
      if (j.testo && isFinite(r) && isFinite(c) && Math.abs(c - r) < 1e-6 * Math.max(1, Math.abs(r))) return { testo: j.testo, risultato: r, unita: j.unita || "", spiegazione: j.spiegazione || "", conto: j.conto, controllato: true };
    } catch (e) {}
  }
  // il cervello non ce l'ha fatta 3 volte: esercizio di riserva, calcolato da noi
  const nomi = materia === "Economia aziendale" ? ["Economia aziendale"] : ["Divisioni", "Frazioni", "Percentuali", "Problemi", "Aree"];
  const e = CATEGORIE[scegli(nomi)]();
  return { testo: e.d, risultato: e.r, unita: "", spiegazione: "", conto: "", controllato: true, riserva: true };
}

function risultatoGiusto(rispostaClasse, risultato) {
  const x = leggiNumero(String(rispostaClasse).replace(/[^\d.,\-]/g, ""));
  return isFinite(x) && Math.abs(x - risultato) <= Math.max(0.011, Math.abs(risultato) * 1e-6);
}
