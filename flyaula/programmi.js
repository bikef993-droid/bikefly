// ===================================================================
//  FLY AULA · programmi per anno (INDICATIVI)
//  Ispirati alle Indicazioni nazionali (primo ciclo) e alle Linee guida
//  degli istituti tecnici economici. Il prof resta libero: servono a
//  Fly Aula per non andare troppo fuori programma e per suggerire argomenti.
// ===================================================================
const PROGRAMMI = {
  matematica: {
    elementari: {
      1: ["numeri fino a 20", "contare e confrontare", "addizioni entro il 20", "sottrazioni entro il 20", "forme geometriche semplici"],
      2: ["numeri fino a 100", "decine e unità", "addizioni e sottrazioni in colonna", "tabelline", "moltiplicazione come addizione ripetuta", "problemi semplici"],
      3: ["numeri fino a 1000", "moltiplicazioni in colonna", "divisioni con una cifra al divisore", "frazioni semplici", "misure di lunghezza", "linee e angoli"],
      4: ["grandi numeri", "divisioni con due cifre al divisore", "frazioni e frazioni equivalenti", "numeri decimali", "perimetro dei poligoni", "misure"],
      5: ["numeri decimali e operazioni", "percentuali semplici", "frazioni e problemi", "area di rettangolo, triangolo e quadrato", "media", "grafici e tabelle"]
    },
    medie: {
      1: ["insiemi numerici e operazioni", "potenze", "multipli, divisori, MCD e mcm", "frazioni e operazioni con le frazioni", "enti geometrici, angoli e triangoli", "statistica: tabelle e grafici"],
      2: ["numeri razionali e decimali periodici", "radice quadrata", "rapporti e proporzioni", "percentuali", "area dei poligoni", "teorema di Pitagora", "proporzionalità diretta e inversa"],
      3: ["numeri relativi", "calcolo letterale e monomi", "equazioni di primo grado", "circonferenza e cerchio", "solidi: superfici e volumi", "piano cartesiano e funzioni", "probabilità"]
    },
    superiori: {
      1: ["insiemi numerici", "calcolo letterale: monomi e polinomi", "prodotti notevoli", "scomposizione", "equazioni di primo grado", "statistica descrittiva"],
      2: ["disequazioni di primo grado", "sistemi lineari", "radicali", "piano cartesiano e retta", "equazioni di secondo grado", "probabilità"],
      3: ["equazioni e disequazioni di secondo grado", "parabola", "funzioni e loro grafici", "percentuali e capitalizzazione", "progressioni"],
      4: ["esponenziali e logaritmi", "funzioni di due variabili (cenni)", "limiti", "statistica e regressione", "problemi di scelta"],
      5: ["derivate", "studio di funzione", "ricerca operativa", "programmazione lineare", "integrali (cenni)"]
    }
  },
  economia: {
    elementari: { 1: [], 2: [], 3: [], 4: ["soldi e risparmio"], 5: ["costo, prezzo e guadagno"] },
    medie: { 1: ["bisogni e beni"], 2: ["costo, ricavo e guadagno"], 3: ["IVA e sconto: le basi"] },
    superiori: {
      1: ["bisogni, beni e servizi", "l'azienda e i suoi elementi", "percentuali, sconti e IVA", "riparti", "documenti della compravendita: la fattura"],
      2: ["interesse e montante", "sconto commerciale", "strumenti di pagamento", "la gestione aziendale: costi e ricavi", "patrimonio e reddito"],
      3: ["la contabilità generale e la partita doppia", "scritture di acquisto e vendita", "IVA in contabilità", "scritture di assestamento", "il bilancio d'esercizio"],
      4: ["le società", "contabilità gestionale e costi", "break-even point", "marketing", "finanziamenti"],
      5: ["bilancio e analisi per indici", "rendiconto finanziario", "pianificazione e budget", "business plan", "imposte sul reddito d'impresa"]
    }
  },
  inglese: {
    elementari: { 1: ["colori", "numeri fino a 10", "saluti"], 2: ["animali", "famiglia", "numeri fino a 20"], 3: ["cibo", "verbo to be", "la scuola"], 4: ["verbo to have", "giorni e mesi", "la casa"], 5: ["present simple", "l'ora", "descrivere persone"] },
    medie: { 1: ["to be e to have", "present simple", "aggettivi possessivi"], 2: ["present continuous", "past simple", "comparativi"], 3: ["future: will e going to", "present perfect", "superlativi"] },
    superiori: {
      1: ["present simple e continuous", "past simple", "vocabolario quotidiano"],
      2: ["present perfect", "future forms", "modal verbs"],
      3: ["conditionals", "passive voice", "business English: email e lettere"],
      4: ["reported speech", "business English: ordini e fatture", "turismo: descrivere un luogo"],
      5: ["inglese per il lavoro e il colloquio", "economia e marketing in inglese", "preparazione B1/B2"]
    }
  }
};
// "3ªB" → 3 ; "2A" → 2 ; se non c'è un numero → null
function annoDellaClasse(classe) { const m = String(classe || "").match(/[1-5]/); return m ? +m[0] : null; }
function argomentiDi(materia, livello, anno) {
  const p = PROGRAMMI[materia]?.[livello]; if (!p) return [];
  if (anno && p[anno]) return p[anno];
  return Object.values(p).flat();
}
function istruzioniProgramma(materia, livello, classe) {
  const anno = annoDellaClasse(classe), arg = anno ? PROGRAMMI[materia]?.[livello]?.[anno] : null;
  if (!arg || !arg.length) return "";
  return `\nPROGRAMMA INDICATIVO della classe ${anno}ª (${livello}): ${arg.join(", ")}. Resta al livello di questa classe. Se la domanda va molto oltre il programma, spiega in modo semplice e di' che lo vedranno più avanti.`;
}
