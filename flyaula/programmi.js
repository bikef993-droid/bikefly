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
// ---------------- le altre materie ----------------
const PROGRAMMA_LINGUA = (lingua, termini) => ({
  elementari: { 1: ["saluti", "colori", "numeri fino a 10"], 2: ["animali", "famiglia"], 3: ["cibo", "la scuola"], 4: ["giorni e mesi", "la casa"], 5: ["descrivere persone", "l'ora"] },
  medie: { 1: ["saluti e presentazioni", "verbi essere e avere", "numeri, colori, famiglia"], 2: ["presente dei verbi", "la casa e la città", "descrivere persone"], 3: ["il passato", "il futuro", "raccontare un'esperienza"] },
  superiori: { 1: ["presentarsi", "il presente", "articoli e nomi", ...(termini[1] || [])], 2: ["il passato", "vita quotidiana", "lettera o email informale", ...(termini[2] || [])],
    3: [`${lingua} per il turismo`, "corrispondenza commerciale di base", "futuro e condizionale"], 4: ["lettere commerciali: ordini e reclami", "il mondo del lavoro", "comprensione di testi"],
    5: ["cultura e civiltà dei Paesi in cui si parla " + lingua, "economia e lavoro", "preparazione alla certificazione"] }
});
Object.assign(PROGRAMMI, {
  italiano: {
    elementari: { 1: ["lettere e suoni", "leggere e scrivere parole", "frasi semplici"], 2: ["ortografia: doppie, gn, gl, sc", "la frase", "raccontare"], 3: ["nomi, articoli e verbi", "il testo narrativo", "ortografia: h, accento, apostrofo"],
      4: ["analisi grammaticale", "il testo descrittivo", "aggettivi e pronomi"], 5: ["i verbi: modi e tempi", "il riassunto", "il testo regolativo e argomentativo"] },
    medie: { 1: ["le parti del discorso", "favola, fiaba ed epica", "il testo narrativo"], 2: ["analisi logica", "letteratura dalle origini al Settecento", "il testo espositivo e la lettera"],
      3: ["analisi del periodo", "letteratura dell'Ottocento e del Novecento", "il testo argomentativo"] },
    superiori: { 1: ["grammatica e analisi logica", "il testo narrativo", "l'epica: Iliade, Odissea, Eneide", "il riassunto"], 2: ["analisi del periodo", "I promessi sposi", "la poesia e le figure retoriche", "il testo argomentativo"],
      3: ["letteratura dalle origini a Boccaccio", "Dante e l'Inferno", "Petrarca", "analisi del testo"], 4: ["Umanesimo e Rinascimento", "Ariosto, Machiavelli e Tasso", "Illuminismo e Goldoni", "Foscolo e Manzoni", "Romanticismo"],
      5: ["Leopardi", "Verismo e Verga", "Pascoli e D'Annunzio", "Pirandello e Svevo", "Ungaretti e Montale", "la prima prova dell'esame"] }
  },
  storia: {
    elementari: { 1: ["prima e dopo", "la giornata e la settimana"], 2: ["il tempo e le fonti", "la storia personale"], 3: ["la preistoria"], 4: ["le civiltà dei fiumi: Mesopotamia ed Egizi", "Fenici ed Ebrei"], 5: ["i Greci", "gli Etruschi", "i Romani"] },
    medie: { 1: ["la fine dell'Impero romano", "il Medioevo", "i Comuni"], 2: ["le scoperte geografiche", "Riforma e Controriforma", "le rivoluzioni del Settecento"], 3: ["l'Unità d'Italia", "le guerre mondiali", "i totalitarismi", "la Repubblica italiana", "la Guerra fredda"] },
    superiori: { 1: ["la preistoria", "le civiltà antiche", "la Grecia", "Roma repubblicana"], 2: ["l'Impero romano", "il cristianesimo", "l'Alto Medioevo", "Carlo Magno e il feudalesimo"],
      3: ["il Basso Medioevo e i Comuni", "le scoperte geografiche", "Riforma e Controriforma", "gli Stati nazionali"], 4: ["le rivoluzioni inglese, americana e francese", "Napoleone", "la rivoluzione industriale", "il Risorgimento"],
      5: ["la Prima guerra mondiale", "i totalitarismi", "la Seconda guerra mondiale", "la Repubblica italiana e la Costituzione", "la Guerra fredda", "l'Unione europea"] }
  },
  geografia: {
    elementari: { 3: ["orientarsi: punti cardinali", "le carte geografiche"], 4: ["montagne, colline, pianure", "fiumi, laghi e mari"], 5: ["le regioni d'Italia"] },
    medie: { 1: ["l'Italia: territorio e regioni"], 2: ["l'Europa e l'Unione europea"], 3: ["i continenti e il mondo", "la globalizzazione"] },
    superiori: { 1: ["carte e coordinate", "climi e ambienti", "popolazione e migrazioni", "le città", "Italia ed Europa"], 2: ["la globalizzazione", "i settori dell'economia", "lo sviluppo sostenibile", "i continenti e i Paesi del mondo"],
      3: ["geografia turistica dell'Italia"], 4: ["geografia turistica dell'Europa"], 5: ["geografia turistica del mondo"] }
  },
  diritto: {
    medie: { 1: ["le regole e la convivenza"], 2: ["diritti e doveri"], 3: ["la Costituzione e le istituzioni"] },
    superiori: { 1: ["la norma giuridica e le fonti del diritto", "i soggetti del diritto: capacità giuridica e d'agire", "lo Stato e i suoi elementi", "i principi della Costituzione", "bisogni, beni e sistema economico"],
      2: ["Parlamento, Governo e Presidente della Repubblica", "Magistratura e Corte costituzionale", "Regioni ed enti locali", "l'Unione europea", "mercato e moneta"],
      3: ["la proprietà e i diritti reali", "le obbligazioni", "il contratto"], 4: ["l'imprenditore e l'azienda", "le società", "i contratti d'impresa", "il lavoro"],
      5: ["lo Stato e la Costituzione", "gli organi costituzionali", "la pubblica amministrazione", "l'Unione europea e le organizzazioni internazionali"] }
  },
  economiapolitica: { superiori: { 3: ["il sistema economico e i suoi soggetti", "domanda e offerta", "il consumatore", "l'impresa: produzione e costi", "le forme di mercato"],
    4: ["il PIL e la contabilità nazionale", "moneta e banche", "l'inflazione", "il ciclo economico", "il commercio internazionale"], 5: ["la finanza pubblica", "spese ed entrate pubbliche", "le imposte e il sistema tributario", "il bilancio dello Stato"] } },
  relazioni: { superiori: { 3: ["il sistema economico", "il mercato e i prezzi"], 4: ["il commercio internazionale", "la bilancia dei pagamenti", "i tassi di cambio"],
    5: ["la finanza pubblica", "le organizzazioni internazionali", "le politiche economiche internazionali"] } },
  scienze: {
    elementari: { 1: ["i cinque sensi"], 2: ["esseri viventi e non viventi"], 3: ["l'acqua e i suoi stati", "piante e animali"], 4: ["l'aria, il suolo", "gli ecosistemi"], 5: ["il corpo umano", "il sistema solare"] },
    medie: { 1: ["il metodo scientifico", "la materia", "piante e animali"], 2: ["il corpo umano", "chimica di base"], 3: ["vulcani e terremoti", "l'universo", "la genetica"] },
    superiori: { 1: ["l'universo e il sistema solare", "la Terra: forma e moti", "atmosfera e clima", "l'idrosfera", "rocce, vulcani e terremoti"],
      2: ["la cellula", "le biomolecole", "mitosi e meiosi", "la genetica di Mendel", "l'evoluzione", "il corpo umano", "l'ecologia"] }
  },
  fisica: { medie: { 2: ["forze e peso"], 3: ["energia", "elettricità"] },
    superiori: { 1: ["grandezze e misure", "vettori e forze", "l'equilibrio"], 2: ["il moto", "i principi della dinamica", "lavoro ed energia", "calore e temperatura", "l'elettricità"] } },
  chimica: { medie: { 2: ["la materia e le sue trasformazioni"] },
    superiori: { 1: ["la materia e i suoi stati", "miscugli e sostanze", "l'atomo e la tavola periodica"], 2: ["i legami chimici", "la nomenclatura", "le reazioni e la mole", "acidi, basi e pH"] } },
  informatica: { medie: { 1: ["il computer", "usare Internet in sicurezza"], 2: ["videoscrittura e presentazioni"], 3: ["il pensiero computazionale"] },
    superiori: { 1: ["hardware e software", "il sistema binario", "file e sistema operativo", "videoscrittura e fogli di calcolo", "Internet e sicurezza"],
      2: ["algoritmi e diagrammi di flusso", "programmazione di base", "foglio di calcolo avanzato", "le reti"], 3: ["programmazione", "pagine web: HTML e CSS"],
      4: ["database e SQL", "le reti"], 5: ["basi di dati in rete", "sicurezza informatica", "commercio elettronico"] } },
  turismo: { superiori: { 3: ["le imprese turistiche", "documenti e calcoli", "la contabilità"], 4: ["il prodotto e il pacchetto turistico", "il calcolo dei prezzi", "il marketing turistico", "il bilancio"],
    5: ["pianificazione e budget", "il marketing del territorio", "il turismo sostenibile"] } },
  arte: { superiori: { 3: ["arte preistorica, greca e romana", "romanico e gotico"], 4: ["il Rinascimento", "il Barocco", "il Neoclassicismo"], 5: ["Ottocento e Novecento", "i beni culturali e il territorio", "musei e valorizzazione"] } },
  motorie: { elementari: { 1: ["schemi motori di base"], 3: ["giochi di squadra"], 5: ["regole e fair play"] }, medie: { 1: ["capacità motorie"], 2: ["giochi sportivi"], 3: ["salute e benessere"] },
    superiori: { 1: ["capacità condizionali e coordinative", "pallavolo"], 2: ["pallacanestro", "atletica", "il corpo umano in movimento"], 3: ["allenamento e riscaldamento", "sport di squadra"],
      4: ["primo soccorso", "salute e stili di vita"], 5: ["sport, regole e fair play", "lo sport e la società"] } },
  francese: PROGRAMMA_LINGUA("francese", { 1: ["être e avoir"], 2: ["il passé composé"] }),
  spagnolo: PROGRAMMA_LINGUA("spagnolo", { 1: ["ser ed estar"], 2: ["il pretérito perfecto"] }),
  tedesco: PROGRAMMA_LINGUA("tedesco", { 1: ["gli articoli der, die, das", "sein e haben"], 2: ["il Perfekt", "i casi"] }),
  cinese: { superiori: { 1: ["pinyin e toni", "saluti", "numeri"], 2: ["i primi caratteri", "la famiglia", "ore e date"], 3: ["fare acquisti e prezzi", "viaggiare"], 4: ["lavoro e azienda"], 5: ["commercio con la Cina", "cultura cinese"] },
    medie: { 1: ["pinyin e toni", "saluti e numeri"], 2: ["i primi caratteri"], 3: ["presentarsi"] } }
});
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
