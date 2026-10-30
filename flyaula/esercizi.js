// ===================================================================
//  FLY AULA · esercizi (alla LIM e per le verifiche)
//  Ogni esercizio viene controllato 3 volte prima di arrivare alla classe:
//  1) calcolatrice: il conto dà davvero il risultato dichiarato
//  2) revisore: testo chiaro, un solo risultato, conto coerente col testo
//  3) risolto da capo da un altro passaggio, senza sapere il risultato
//  Se una sola cosa non torna, l'esercizio si butta e se ne fa un altro.
// ===================================================================

// calcolatrice per espressioni: "(1000 × 22) : 100", "3/4 × 120"…
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

const ISTRUZIONI_ESERCIZIO = (materia, livello, argomento, evita) => `Inventa UN esercizio di ${materia} per la scuola ${livello}${argomento ? " sull'argomento: " + argomento : ""}.
Deve avere UN solo risultato numerico. Situazione concreta e adatta all'età.${evita.length ? "\nDeve essere DIVERSO da questi (altro contesto e altri numeri):\n- " + evita.slice(-8).join("\n- ") : ""}
Rispondi SOLO con JSON:
{"testo": "il testo dell'esercizio", "conto": "l'espressione che dà il risultato, solo con numeri, + - × : e parentesi", "risultato": numero, "unita": "unità di misura o vuoto", "spiegazione": "2-4 passaggi numerati che spiegano come si risolve"}`;
const ISTRUZIONI_PAROLA = (livello, argomento, evita) => `Inventa UN esercizio di INGLESE per una classe italiana (scuola ${livello})${argomento ? " sull'argomento: " + argomento : ""}.
Tipo: una frase in inglese con UNA parola mancante (scrivi ___ al posto della parola), oppure "Traduci in inglese: …" di una parola o frase brevissima.
La risposta deve essere UNA parola o al massimo 3 parole, e deve esserci UNA sola risposta giusta (metti in "accettate" le varianti corrette, es. forma contratta).${evita.length ? "\nDeve essere DIVERSO da questi:\n- " + evita.slice(-8).join("\n- ") : ""}
Rispondi SOLO con JSON: {"testo": "…", "risposta": "…", "accettate": ["…"], "spiegazione": "una frase in italiano che spiega la regola"}`;

const normalizza = t => String(t).toLowerCase().replace(/[’`]/g, "'").replace(/[.!?,;"]/g, "").replace(/\s+/g, " ").trim();

// i 3 controlli su un esercizio numerico già scritto (JSON). Torna l'esercizio pronto o null.
async function controllaEsercizioNumerico(cervello, j, materia, livello) {
  const r = Number(String(j.risultato).replace(",", "."));
  const c = valuta(j.conto);
  if (!(j.testo && isFinite(r) && isFinite(c) && Math.abs(c - r) < 1e-6 * Math.max(1, Math.abs(r)))) return null;               // 1
  const rev = await revisiona(cervello,
    "Controlla questo ESERCIZIO (non è una risposta): il testo è chiaro e adatto alla scuola, ha UN solo risultato, e il conto corrisponde davvero a quello che chiede il testo?",
    `TESTO DELL'ESERCIZIO: ${j.testo}\nCONTO: ${j.conto} = ${r} ${j.unita || ""}`, `${materia}, scuola ${livello}.`);
  if (rev.ok !== true) return null;                                                                                          // 2
  const sol = await cervello(`Risolvi questo esercizio di ${materia} passo passo. Alla fine scrivi su una riga da sola: RISULTATO: <solo il numero>`, j.testo, { temperature: 0 });
  const x = leggiRisultato(sol);
  if (!(isFinite(x) && Math.abs(x - r) <= Math.max(0.011, Math.abs(r) * 1e-6))) return null;                               // 3
  return { tipo: "numero", testo: String(j.testo), risultato: r, unita: j.unita || "", spiegazione: String(j.spiegazione || ""), conto: String(j.conto), controllato: true, controlli: 3 };
}
async function controllaEsercizioParola(cervello, j, livello) {
  const risposta = String(j.risposta || "").trim();
  const accettate = [risposta, ...(Array.isArray(j.accettate) ? j.accettate.map(String) : [])].map(normalizza).filter(Boolean);
  if (!j.testo || !risposta || risposta.split(/\s+/).length > 3) return null;                                               // 1
  const rev = await revisiona(cervello,
    "Controlla questo ESERCIZIO DI INGLESE (non è una risposta): è chiaro, ha UNA sola risposta giusta, ed è proprio quella indicata (o una delle accettate)? L'inglese è corretto?",
    `ESERCIZIO: ${j.testo}\nRISPOSTA GIUSTA: ${risposta}\nACCETTATE: ${accettate.join(", ")}`, `Inglese, scuola ${livello}.`);
  if (rev.ok !== true) return null;                                                                                          // 2
  const sol = await cervello("Risolvi questo esercizio di inglese. Scrivi SOLO la risposta (la parola o le parole mancanti), niente altro.", j.testo, { temperature: 0 });
  if (!accettate.includes(normalizza(sol.split("\n")[0]))) return null;                                                     // 3
  return { tipo: "parola", testo: String(j.testo), risposta, accettate, unita: "", spiegazione: String(j.spiegazione || ""), controllato: true, controlli: 3 };
}
// le categorie di riserva che c'entrano con l'argomento scelto
function categorieDi(materiaChiave, livello, argomento = "") {
  if (materiaChiave === "economia") return ["Economia aziendale"];
  const a = String(argomento).toLowerCase(), scelte = [];
  if (/divisi/.test(a)) scelte.push("Divisioni");
  if (/moltiplic|tabellin/.test(a)) scelte.push("Moltiplicazioni");
  if (/addizi|sottrazi|somm/.test(a)) scelte.push("Addizioni e sottrazioni");
  if (/frazion/.test(a)) scelte.push("Frazioni");
  if (/percentu|scont/.test(a)) scelte.push("Percentuali");
  if (/area|aree|geometr|perimetr|poligon/.test(a)) scelte.push("Aree");
  if (/equazion/.test(a)) scelte.push("Equazioni");
  if (/problem/.test(a)) scelte.push("Problemi");
  if (scelte.length) return scelte;
  return livello === "elementari" ? ["Addizioni e sottrazioni", "Moltiplicazioni", "Divisioni", "Problemi"] : ["Divisioni", "Frazioni", "Percentuali", "Problemi", "Aree"];
}
function esercizioDiRiserva(materiaChiave, livello, argomento = "") {
  if (materiaChiave === "inglese") {
    const [it, en] = scegli(PAROLE_INGLESE);
    const acc = en.split("|");
    return { tipo: "parola", testo: `Traduci in inglese: "${it}"`, risposta: acc[0], accettate: acc.map(normalizza), unita: "", spiegazione: "", controllato: true, riserva: true };
  }
  const classe = (typeof document !== "undefined" && document.getElementById("classe")?.value) || "";
  const e = CATEGORIE[scegli(categoriePer(materiaChiave, livello, classe, argomento))]();
  return { tipo: "numero", testo: e.d, risultato: e.r, unita: "", spiegazione: "", conto: "", controllato: true, riserva: true };
}

// un esercizio nuovo, controllato 3 volte (fino a 3 tentativi, poi uno di riserva calcolato da noi)
async function creaEsercizio(cervello, materia, livello, argomento, { evita = [], chiave = null } = {}) {
  const k = chiave || Object.keys(MATERIE).find(x => MATERIE[x].nome === materia) || "matematica";
  for (let tentativo = 0; tentativo < 3; tentativo++) {
    try {
      const parola = !!MATERIE[k].parole;
      const out = await cervello(parola ? ISTRUZIONI_PAROLA(livello, argomento, evita) : ISTRUZIONI_ESERCIZIO(materia, livello, argomento, evita),
        "Nuovo esercizio, diverso dai precedenti. Numero casuale: " + Math.random().toString(36).slice(2, 7), { temperature: 0.8, format: "json" });
      const j = JSON.parse(out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1));
      ["testo", "spiegazione"].forEach(k => { if (typeof j[k] === "string") j[k] = pulisciLatex(j[k]); });
      const es = parola ? await controllaEsercizioParola(cervello, j, livello) : await controllaEsercizioNumerico(cervello, j, materia, livello);
      if (es && !evita.includes(es.testo)) return es;
    } catch (e) {}
  }
  return esercizioDiRiserva(k, livello, argomento);
}
// fila B: stesso tipo di esercizio, numeri e contesto diversi — con gli stessi 3 controlli
async function creaVariante(cervello, es, materia, livello, chiave, argomento = "") {
  if (es.riserva) return esercizioDiRiserva(chiave, livello, argomento);
  for (let tentativo = 0; tentativo < 3; tentativo++) {
    try {
      const parola = es.tipo === "parola";
      const out = await cervello(`Crea una VARIANTE di questo esercizio per la fila B di una verifica: stesso tipo e stessa difficoltà, ma ${parola ? "parola o frase diversa" : "numeri diversi e un contesto un po' diverso"}.
Rispondi SOLO con JSON nello stesso formato: ${parola ? '{"testo": "…", "risposta": "…", "accettate": ["…"], "spiegazione": "…"}' : '{"testo": "…", "conto": "…", "risultato": numero, "unita": "…", "spiegazione": "…"}'}`,
        JSON.stringify(parola ? { testo: es.testo, risposta: es.risposta } : { testo: es.testo, conto: es.conto, risultato: es.risultato, unita: es.unita }), { temperature: 0.7, format: "json" });
      const j = JSON.parse(out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1));
      const v = parola ? await controllaEsercizioParola(cervello, j, livello) : await controllaEsercizioNumerico(cervello, j, materia, livello);
      if (v && v.testo !== es.testo) return v;
    } catch (e) {}
  }
  return esercizioDiRiserva(chiave, livello, argomento);
}

function risultatoGiusto(rispostaClasse, es) {
  if (es && typeof es === "object" && es.tipo === "parola") return es.accettate.includes(normalizza(rispostaClasse));
  const r = typeof es === "object" ? es.risultato : es;
  const x = leggiNumero(String(rispostaClasse).replace(/[^\d.,\-]/g, ""));
  return isFinite(x) && Math.abs(x - r) <= Math.max(0.011, Math.abs(r) * 1e-6);
}
const soluzioneDi = es => es.tipo === "parola" ? es.risposta : `${formatta(es.risultato)}${es.unita ? " " + es.unita : ""}`;
