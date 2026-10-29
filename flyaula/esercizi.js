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
      // controllo 1 (calcolatrice): il conto dell'esercizio deve dare proprio il risultato dichiarato
      if (!(j.testo && isFinite(r) && isFinite(c) && Math.abs(c - r) < 1e-6 * Math.max(1, Math.abs(r)))) continue;
      // controllo 2 (revisore): il testo è chiaro, ha un solo risultato, e il conto corrisponde davvero al testo?
      const rev = await revisiona(cervello,
        "Controlla questo ESERCIZIO (non è una risposta): il testo è chiaro e adatto alla scuola, ha UN solo risultato, e il conto corrisponde davvero a quello che chiede il testo?",
        `TESTO DELL'ESERCIZIO: ${j.testo}\nCONTO: ${j.conto} = ${r} ${j.unita || ""}`, `${materia}, scuola ${livello}.`);
      if (rev.ok !== true) continue;
      // controllo 3 (risolto da capo): un altro passaggio risolve l'esercizio senza sapere il risultato
      const sol = await cervello(`Risolvi questo esercizio di ${materia} passo passo. Alla fine scrivi su una riga da sola: RISULTATO: <solo il numero>`, j.testo, { temperature: 0 });
      const x = leggiRisultato(sol);
      if (!(isFinite(x) && Math.abs(x - r) <= Math.max(0.011, Math.abs(r) * 1e-6))) continue;
      return { testo: j.testo, risultato: r, unita: j.unita || "", spiegazione: j.spiegazione || "", conto: j.conto, controllato: true, controlli: 3 };
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
