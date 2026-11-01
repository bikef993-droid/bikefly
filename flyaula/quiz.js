// ===================================================================
//  FLY AULA · domande CONTROLLATE per tutte le materie
//  Servono alla gara, agli esercizi e al ripasso quando il cervello non c'è
//  o quando un esercizio inventato non passa i 3 controlli.
//  Sono scritte a mano, solo fatti sicuri da libro di scuola, e ricontrollate
//  dai test automatici (nessuna risposta doppia, opzioni tutte diverse…).
//  Ogni voce: [domanda, "risposta|altre forme giuste", "sbagliata1|sbagliata2|sbagliata3" (facoltativo)]
//  livelli: E = elementari, M = medie, S = superiori
// ===================================================================
const Quiz = (() => {
  const capitale = (di, c) => [`Qual è la capitale ${di}?`, c];
  const capoluogo = (di, c) => [`Qual è il capoluogo ${di}?`, c];
  const GRUPPI = {
    capitali: { livelli: "EMS", voci: [
      capitale("della Francia", "Parigi"), capitale("della Spagna", "Madrid"), capitale("della Germania", "Berlino"), capitale("del Portogallo", "Lisbona"),
      capitale("del Regno Unito", "Londra"), capitale("dell'Irlanda", "Dublino"), capitale("del Belgio", "Bruxelles"), capitale("dell'Austria", "Vienna"),
      capitale("della Polonia", "Varsavia"), capitale("della Grecia", "Atene"), capitale("della Svezia", "Stoccolma"), capitale("della Norvegia", "Oslo"),
      capitale("della Danimarca", "Copenaghen|copenhagen"), capitale("della Finlandia", "Helsinki"), capitale("dell'Ungheria", "Budapest"), capitale("della Repubblica Ceca", "Praga"),
      capitale("della Romania", "Bucarest"), capitale("della Croazia", "Zagabria"), capitale("della Slovenia", "Lubiana"), capitale("della Slovacchia", "Bratislava"),
      capitale("della Bulgaria", "Sofia"), capitale("dell'Albania", "Tirana"), capitale("della Serbia", "Belgrado"), capitale("dell'Ucraina", "Kiev|kyiv"),
      capitale("della Russia", "Mosca"), capitale("della Turchia", "Ankara"), capitale("dell'Egitto", "Il Cairo|cairo"), capitale("del Giappone", "Tokyo|tokio"),
      capitale("della Cina", "Pechino|beijing"), capitale("dell'India", "Nuova Delhi|new delhi|delhi"), capitale("degli Stati Uniti", "Washington|washington dc"),
      capitale("del Canada", "Ottawa"), capitale("del Brasile", "Brasilia"), capitale("dell'Argentina", "Buenos Aires"), capitale("del Messico", "Città del Messico|mexico city"),
      capitale("dell'Australia", "Canberra"), capitale("del Marocco", "Rabat"), capitale("della Lituania", "Vilnius"), capitale("della Lettonia", "Riga"),
      capitale("dell'Estonia", "Tallinn"), capitale("dell'Islanda", "Reykjavik"), capitale("di Malta", "La Valletta|valletta"), capitale("dell'Italia", "Roma")
    ] },
    regioni: { livelli: "EMS", voci: [
      capoluogo("dell'Emilia-Romagna", "Bologna"), capoluogo("della Lombardia", "Milano"), capoluogo("del Piemonte", "Torino"), capoluogo("del Veneto", "Venezia"),
      capoluogo("della Liguria", "Genova"), capoluogo("della Toscana", "Firenze"), capoluogo("del Lazio", "Roma"), capoluogo("della Campania", "Napoli"),
      capoluogo("della Sicilia", "Palermo"), capoluogo("della Sardegna", "Cagliari"), capoluogo("della Puglia", "Bari"), capoluogo("della Calabria", "Catanzaro"),
      capoluogo("della Basilicata", "Potenza"), capoluogo("del Molise", "Campobasso"), capoluogo("dell'Abruzzo", "L'Aquila"), capoluogo("delle Marche", "Ancona"),
      capoluogo("dell'Umbria", "Perugia"), capoluogo("del Friuli-Venezia Giulia", "Trieste"), capoluogo("del Trentino-Alto Adige", "Trento"), capoluogo("della Valle d'Aosta", "Aosta")
    ] },
    geofatti: { livelli: "EMS", voci: [
      ["Qual è il fiume più lungo d'Italia?", "Po", "Tevere|Adige|Arno"],
      ["Su quale grande fiume si trova Piacenza?", "Po", "Tevere|Arno|Adige"],
      ["Qual è il lago più grande d'Italia?", "Garda|lago di garda", "Lago Maggiore|Lago di Como|Lago Trasimeno"],
      ["Qual è la montagna più alta delle Alpi?", "Monte Bianco|bianco", "Monte Rosa|Cervino|Gran Paradiso"],
      ["Qual è l'oceano più grande della Terra?", "Pacifico|oceano pacifico", "Atlantico|Indiano|Artico"],
      ["Qual è il continente più grande?", "Asia", "Africa|Europa|Oceania"],
      ["Quale mare bagna Venezia?", "Adriatico|mar adriatico|mare adriatico", "Tirreno|Ionio|Ligure"],
      ["Quale catena di montagne attraversa l'Italia da nord a sud?", "Appennini|appennino", "Alpi|Pirenei|Carpazi"],
      ["Qual è il vulcano attivo più alto d'Europa?", "Etna", "Vesuvio|Stromboli|Vulcano"],
      ["Quante sono le regioni italiane?", "20"],
      ["In quale regione si trova Piacenza?", "Emilia-Romagna|emilia romagna", "Lombardia|Piemonte|Veneto"]
    ] },
    date: { livelli: "MS", voci: [
      ["In che anno Cristoforo Colombo arrivò in America?", "1492"], ["In che anno iniziò la Prima guerra mondiale?", "1914"],
      ["In che anno l'Italia entrò nella Prima guerra mondiale?", "1915"], ["In che anno finì la Prima guerra mondiale?", "1918"],
      ["In che anno iniziò la Seconda guerra mondiale?", "1939"], ["In che anno finì la Seconda guerra mondiale?", "1945"],
      ["In che anno iniziò la Rivoluzione francese (presa della Bastiglia)?", "1789"], ["In che anno fu proclamato il Regno d'Italia?", "1861"],
      ["In che anno ci fu la presa di Roma (breccia di Porta Pia)?", "1870"], ["In che anno cadde l'Impero romano d'Occidente?", "476"],
      ["In che anno gli italiani scelsero la Repubblica con il referendum?", "1946"], ["In che anno entrò in vigore la Costituzione italiana?", "1948"],
      ["In che anno cadde il muro di Berlino?", "1989"], ["In che anno fu firmata la Dichiarazione d'indipendenza degli Stati Uniti?", "1776"],
      ["In che anno Carlo Magno fu incoronato imperatore?", "800"], ["In che anno ci fu la Rivoluzione russa d'ottobre?", "1917"],
      ["In che anno furono firmati i Trattati di Roma, che fecero nascere la CEE?", "1957"], ["In che anno l'uomo arrivò per la prima volta sulla Luna?", "1969"],
      ["In che anno partì la spedizione dei Mille?", "1860"], ["In che anno ci fu la battaglia di Waterloo?", "1815"],
      ["In che anno ci fu il crollo della Borsa di Wall Street?", "1929"], ["In che anno entrarono in circolazione le monete e le banconote in euro?", "2002"],
      ["In che anno Martin Lutero rese pubbliche le 95 tesi?", "1517"], ["In che anno ci fu la Marcia su Roma?", "1922"],
      ["In che anno Napoleone diventò imperatore dei francesi?", "1804"],
      ["In che anno fu fondata Roma, secondo la tradizione?", "753 a.C.|753 ac|753", "509 a.C.|476 a.C.|44 a.C."]
    ] },
    personaggi: { livelli: "MS", voci: [
      ["Chi guidò la spedizione dei Mille?", "Giuseppe Garibaldi|garibaldi"], ["Chi arrivò in America nel 1492?", "Cristoforo Colombo|colombo"],
      ["Chi fu il primo imperatore romano?", "Augusto|ottaviano|ottaviano augusto|cesare augusto"], ["Chi fu il primo presidente degli Stati Uniti?", "George Washington|washington"],
      ["Chi fu incoronato imperatore la notte di Natale dell'anno 800?", "Carlo Magno"], ["Chi fu il primo re d'Italia, nel 1861?", "Vittorio Emanuele II|vittorio emanuele secondo|vittorio emanuele"],
      ["Quale primo ministro del Regno di Sardegna guidò l'unificazione d'Italia?", "Camillo Benso conte di Cavour|cavour|camillo benso di cavour|camillo cavour"],
      ["Quale generale francese diventò imperatore nel 1804?", "Napoleone Bonaparte|napoleone"], ["Chi rese pubbliche le 95 tesi nel 1517?", "Martin Lutero|lutero"],
      ["Chi fu il primo uomo a camminare sulla Luna, nel 1969?", "Neil Armstrong|armstrong"]
    ] },
    autori: { livelli: "MS", voci: [
      ["Chi ha scritto la Divina Commedia?", "Dante Alighieri|dante"], ["Chi ha scritto I promessi sposi?", "Alessandro Manzoni|manzoni"],
      ["Chi ha scritto il Decameron?", "Giovanni Boccaccio|boccaccio"], ["Chi ha scritto il Canzoniere?", "Francesco Petrarca|petrarca"],
      ["Chi ha scritto la poesia L'infinito?", "Giacomo Leopardi|leopardi"], ["Chi ha scritto I Malavoglia?", "Giovanni Verga|verga"],
      ["Chi ha scritto Il fu Mattia Pascal?", "Luigi Pirandello|pirandello"], ["Chi ha scritto La coscienza di Zeno?", "Italo Svevo|svevo"],
      ["Chi ha scritto l'Orlando furioso?", "Ludovico Ariosto|ariosto"], ["Chi ha scritto la Gerusalemme liberata?", "Torquato Tasso|tasso"],
      ["Chi ha scritto Il principe?", "Niccolò Machiavelli|machiavelli"], ["Chi ha scritto Le avventure di Pinocchio?", "Carlo Collodi|collodi"],
      ["Chi ha scritto la poesia X agosto?", "Giovanni Pascoli|pascoli"], ["Chi ha scritto Il barone rampante?", "Italo Calvino|calvino"],
      ["Chi ha scritto Se questo è un uomo?", "Primo Levi"]
    ] },
    grammatica: { livelli: "EMS", voci: [
      ["Che parte del discorso è \"velocemente\"?", "avverbio", "aggettivo|verbo|nome"], ["Che parte del discorso è \"bello\"?", "aggettivo", "avverbio|verbo|nome"],
      ["Che parte del discorso è \"correre\"?", "verbo", "aggettivo|avverbio|nome"], ["Che parte del discorso è \"tavolo\"?", "nome|sostantivo", "aggettivo|verbo|avverbio"],
      ["Qual è il plurale di \"uovo\"?", "uova", "uovi|uove|ovi"], ["Qual è il plurale di \"uomo\"?", "uomini", "uomi|uome|omini"],
      ["Qual è il plurale di \"bue\"?", "buoi", "bui|buei|bue"], ["Qual è il plurale di \"camicia\"?", "camicie", "camicce|camici|camicia"],
      ["Nella frase \"Marco mangia una mela\", qual è il soggetto?", "Marco", "mangia|una mela|una"],
      ["Nella frase \"Marco mangia una mela\", qual è il complemento oggetto?", "una mela|mela", "Marco|mangia|una"],
      ["Nella frase \"Luca corre veloce\", che cos'è \"corre\"?", "predicato verbale|predicato", "soggetto|complemento oggetto|attributo"]
    ] },
    tempi: { livelli: "EMS", voci: [
      ["In che tempo è il verbo \"io ho mangiato\"?", "passato prossimo", "passato remoto|imperfetto|trapassato prossimo"],
      ["In che tempo è il verbo \"io mangiai\"?", "passato remoto", "passato prossimo|imperfetto|futuro anteriore"],
      ["In che tempo è il verbo \"io mangiavo\"?", "imperfetto|indicativo imperfetto", "passato remoto|passato prossimo|presente"],
      ["In che tempo è il verbo \"io mangerò\"?", "futuro semplice|futuro", "futuro anteriore|condizionale presente|presente"],
      ["In che tempo è il verbo \"io avrò mangiato\"?", "futuro anteriore", "futuro semplice|trapassato prossimo|passato prossimo"],
      ["In che tempo è il verbo \"io avevo mangiato\"?", "trapassato prossimo", "passato prossimo|trapassato remoto|imperfetto"],
      ["In che modo e tempo è \"che io mangi\"?", "congiuntivo presente", "indicativo presente|condizionale presente|imperativo"],
      ["In che modo e tempo è \"io mangerei\"?", "condizionale presente", "futuro semplice|congiuntivo imperfetto|imperfetto"],
      ["In che modo e tempo è \"che io mangiassi\"?", "congiuntivo imperfetto", "condizionale presente|imperfetto|passato remoto"]
    ] },
    costituzione: { livelli: "MS", voci: [
      ["In che anno entrò in vigore la Costituzione italiana?", "1948"], ["Quanti anni dura in carica il Presidente della Repubblica?", "7"],
      ["Quanti sono i deputati della Camera (dal 2022)?", "400"], ["Quanti sono i senatori eletti dal popolo (dal 2022)?", "200"],
      ["Quanti anni dura una legislatura del Parlamento?", "5"], ["Quanti anni bisogna avere per votare alle elezioni politiche?", "18"],
      ["Quanti anni bisogna avere, almeno, per essere eletti deputati?", "25"], ["Quanti anni bisogna avere, almeno, per essere eletti senatori?", "40"],
      ["Quanti anni bisogna avere, almeno, per diventare Presidente della Repubblica?", "50"], ["Quanti giudici ci sono nella Corte costituzionale?", "15"],
      ["A che età si acquista la capacità d'agire?", "18"]
    ] },
    poteri: { livelli: "MS", voci: [
      ["Chi fa le leggi in Italia?", "il Parlamento|parlamento", "il Governo|il Presidente della Repubblica|la Magistratura"],
      ["Chi ha il potere esecutivo?", "il Governo|governo", "il Parlamento|la Magistratura|la Corte costituzionale"],
      ["Chi ha il potere giudiziario?", "la Magistratura|magistratura|i giudici", "il Governo|il Parlamento|il Presidente della Repubblica"],
      ["Chi è il capo dello Stato?", "il Presidente della Repubblica|presidente della repubblica", "il Presidente del Consiglio|il Presidente del Senato|il Ministro dell'Interno"],
      ["Chi guida il Governo?", "il Presidente del Consiglio|presidente del consiglio|presidente del consiglio dei ministri", "il Presidente della Repubblica|il Presidente della Camera|il Presidente del Senato"],
      ["Articolo 1: \"L'Italia è una Repubblica democratica, fondata sul…\"", "lavoro|sul lavoro", "popolo|territorio|diritto"],
      ["Qual è la legge più importante dello Stato?", "la Costituzione|costituzione", "il Codice civile|il decreto legge|il regolamento"],
      ["Quando si acquista la capacità giuridica?", "alla nascita|nascita|con la nascita", "a 18 anni|a 14 anni|a 16 anni"]
    ] },
    economiapol: { livelli: "S", voci: [
      ["Che cosa vuol dire PIL?", "prodotto interno lordo", "prodotto italiano lordo|prezzo interno lordo|prodotto industriale lordo"],
      ["Se il prezzo di un bene sale, la quantità domandata di solito…", "diminuisce|scende|cala", "aumenta|resta uguale|raddoppia"],
      ["Come si chiama l'aumento generale e continuo dei prezzi?", "inflazione", "deflazione|recessione|stagnazione"],
      ["Come si chiama la diminuzione generale dei prezzi?", "deflazione", "inflazione|espansione|svalutazione"],
      ["Come si chiama il mercato con un solo venditore?", "monopolio", "oligopolio|concorrenza perfetta|monopsonio"],
      ["Come si chiama il mercato con pochi venditori?", "oligopolio", "monopolio|concorrenza perfetta|monopsonio"],
      ["In quale città ha sede la Banca centrale europea?", "Francoforte|francoforte sul meno|frankfurt", "Bruxelles|Parigi|Roma"],
      ["Quale moneta usa l'Italia?", "euro", "lira|dollaro|franco"],
      ["Chi scrisse \"La ricchezza delle nazioni\" (1776)?", "Adam Smith|smith", "Karl Marx|John Maynard Keynes|David Ricardo"],
      ["Quale imposta si paga sugli acquisti di beni e servizi?", "IVA", "IRPEF|IMU|IRES"],
      ["Quale imposta si paga sul reddito delle persone fisiche?", "IRPEF", "IVA|IMU|IRES"]
    ] },
    europa: { livelli: "MS", voci: [
      ["Quanti Stati fanno parte dell'Unione europea (dal 2020)?", "27"],
      ["In quale città ha sede la Commissione europea?", "Bruxelles", "Parigi|Roma|Francoforte"],
      ["In quale città ha la sede ufficiale il Parlamento europeo?", "Strasburgo", "Parigi|Roma|Berlino"],
      ["Quale Paese è uscito dall'Unione europea nel 2020?", "Regno Unito|gran bretagna", "Norvegia|Svizzera|Grecia"],
      ["Che cosa vuol dire ONU?", "Organizzazione delle Nazioni Unite|nazioni unite|organizzazione delle nazioni unite", "Organizzazione dei Nuovi Uniti|Ordine delle Nazioni Unite|Organismo Nazionale Unito"],
      ["In quale città ha sede l'ONU?", "New York", "Parigi|Londra|Roma"],
      ["In quale città ha sede la FAO?", "Roma", "Parigi|Londra|Madrid"]
    ] },
    biologia: { livelli: "EMS", voci: [
      ["Qual è l'unità di base di tutti gli esseri viventi?", "la cellula|cellula", "l'atomo|il tessuto|l'organo"],
      ["In quale parte della cellula avviene la respirazione cellulare?", "mitocondrio|mitocondri|nei mitocondri", "cloroplasto|nucleo|ribosoma"],
      ["In quale parte della cellula vegetale avviene la fotosintesi?", "cloroplasto|cloroplasti|nei cloroplasti", "mitocondrio|nucleo|vacuolo"],
      ["Quanti cromosomi ha una cellula umana del corpo?", "46"],
      ["Quale gas producono le piante con la fotosintesi?", "ossigeno", "anidride carbonica|azoto|idrogeno"],
      ["Quale gas assorbono le piante con la fotosintesi?", "anidride carbonica|co2|diossido di carbonio", "ossigeno|azoto|elio"],
      ["Come si chiama l'organo che pompa il sangue?", "cuore|il cuore", "fegato|polmone|rene"],
      ["Come si chiamano gli animali che mangiano solo piante?", "erbivori|erbivoro", "carnivori|onnivori|insettivori"]
    ] },
    terra: { livelli: "EMS", voci: [
      ["Qual è il pianeta più vicino al Sole?", "Mercurio", "Venere|Marte|Terra"], ["Quanti pianeti ci sono nel sistema solare?", "8"],
      ["Qual è il pianeta più grande del sistema solare?", "Giove", "Saturno|Nettuno|Terra"],
      ["Come si chiama lo strato più esterno e solido della Terra?", "crosta|crosta terrestre", "mantello|nucleo esterno|nucleo interno"],
      ["Come si chiama il satellite naturale della Terra?", "la Luna|luna", "Marte|Venere|il Sole"],
      ["Come si chiama il movimento della Terra su sé stessa?", "rotazione", "rivoluzione|precessione|traslazione"],
      ["Come si chiama il movimento della Terra intorno al Sole?", "rivoluzione", "rotazione|precessione|nutazione"],
      ["Come si chiamano le rocce che si formano dal magma che si raffredda?", "magmatiche|ignee|rocce magmatiche", "sedimentarie|metamorfiche|calcaree"]
    ] },
    unita: { livelli: "MS", voci: [
      ["Qual è l'unità di misura della forza nel Sistema Internazionale?", "newton", "joule|watt|pascal"],
      ["Qual è l'unità di misura dell'energia nel Sistema Internazionale?", "joule", "newton|watt|volt"],
      ["Qual è l'unità di misura della potenza nel Sistema Internazionale?", "watt", "joule|newton|ampere"],
      ["Qual è l'unità di misura della pressione nel Sistema Internazionale?", "pascal", "newton|joule|hertz"],
      ["Qual è l'unità di misura della massa nel Sistema Internazionale?", "chilogrammo|kilogrammo|kg", "newton|litro|metro"],
      ["Qual è l'unità di misura della lunghezza nel Sistema Internazionale?", "metro", "secondo|chilogrammo|litro"],
      ["Qual è l'unità di misura del tempo nel Sistema Internazionale?", "secondo", "metro|kelvin|ampere"],
      ["Qual è l'unità di misura della temperatura nel Sistema Internazionale?", "kelvin", "watt|pascal|joule"],
      ["Qual è l'unità di misura della corrente elettrica?", "ampere", "volt|ohm|watt"], ["Qual è l'unità di misura della tensione elettrica?", "volt", "ampere|ohm|watt"],
      ["Qual è l'unità di misura della resistenza elettrica?", "ohm", "volt|ampere|watt"], ["Qual è l'unità di misura della frequenza?", "hertz", "watt|newton|pascal"],
      ["Qual è l'unità di misura della carica elettrica?", "coulomb", "ampere|volt|joule"]
    ] },
    simboli: { livelli: "MS", voci: [
      ["idrogeno", "H"], ["elio", "He"], ["litio", "Li"], ["carbonio", "C"], ["azoto", "N"], ["ossigeno", "O"], ["fluoro", "F"], ["neon", "Ne"], ["sodio", "Na"],
      ["magnesio", "Mg"], ["alluminio", "Al"], ["silicio", "Si"], ["fosforo", "P"], ["zolfo", "S"], ["cloro", "Cl"], ["argon", "Ar"], ["potassio", "K"], ["calcio", "Ca"],
      ["ferro", "Fe"], ["nichel", "Ni"], ["rame", "Cu"], ["zinco", "Zn"], ["argento", "Ag"], ["stagno", "Sn"], ["iodio", "I"], ["oro", "Au"], ["mercurio", "Hg"], ["piombo", "Pb"], ["uranio", "U"]
    ].map(([el, s]) => [`Qual è il simbolo chimico di: ${el}?`, s]) },
    elementi: { livelli: "MS", voci: [
      ["H", "idrogeno"], ["He", "elio"], ["C", "carbonio"], ["N", "azoto"], ["O", "ossigeno"], ["Na", "sodio"], ["Cl", "cloro"], ["K", "potassio"], ["Ca", "calcio"],
      ["Fe", "ferro"], ["Cu", "rame"], ["Ag", "argento"], ["Au", "oro"], ["Hg", "mercurio"], ["Pb", "piombo"], ["Zn", "zinco"], ["S", "zolfo"], ["P", "fosforo"]
    ].map(([s, el]) => [`Quale elemento ha il simbolo ${s}?`, el]) },
    formule: { livelli: "MS", voci: [
      ["Qual è la formula dell'acqua?", "H2O"], ["Qual è la formula dell'anidride carbonica?", "CO2"], ["Qual è la formula del cloruro di sodio (il sale da cucina)?", "NaCl"],
      ["Qual è la formula dell'ammoniaca?", "NH3"], ["Qual è la formula del metano?", "CH4"], ["Qual è la formula dell'ozono?", "O3"], ["Qual è la formula dell'acido cloridrico?", "HCl"]
    ] },
    atomo: { livelli: "MS", voci: [
      ["Come si chiamano le particelle dell'atomo con carica negativa?", "elettroni|elettrone", "protoni|neutroni|ioni"],
      ["Come si chiamano le particelle dell'atomo con carica positiva?", "protoni|protone", "elettroni|neutroni|ioni"],
      ["Come si chiamano le particelle dell'atomo senza carica?", "neutroni|neutrone", "protoni|elettroni|ioni"],
      ["Qual è il pH dell'acqua pura a 25 °C?", "7"], ["Qual è il numero atomico del carbonio?", "6"], ["Qual è il numero atomico dell'ossigeno?", "8"],
      ["Qual è il numero atomico del sodio?", "11"], ["Qual è il numero atomico del ferro?", "26"]
    ] },
    informatica: { livelli: "MS", voci: [
      ["Quanti bit ci sono in un byte?", "8"], ["Quanti valori diversi si possono scrivere con 8 bit?", "256"],
      ["Qual è la base del sistema binario?", "2"], ["Qual è la base del sistema esadecimale?", "16"],
      ["Quale parte del computer esegue le istruzioni dei programmi?", "CPU|processore|unità centrale di elaborazione", "RAM|disco fisso|monitor"],
      ["Quale memoria si cancella quando spegni il computer?", "RAM|memoria ram", "ROM|disco fisso|chiavetta USB"],
      ["Con quale linguaggio si scrive la struttura delle pagine web?", "HTML", "SQL|PDF|Excel"],
      ["Con quale linguaggio si interrogano i database?", "SQL", "HTML|PDF|Word"],
      ["Che cosa vuol dire \"www\"?", "World Wide Web", "World Web Wide|Wide World Web|Web World Wide"]
    ] },
    artisti: { livelli: "EMS", voci: [
      ["Chi ha dipinto la Gioconda?", "Leonardo da Vinci|leonardo"], ["Chi ha affrescato la volta della Cappella Sistina?", "Michelangelo|michelangelo buonarroti"],
      ["Chi ha dipinto la Nascita di Venere?", "Sandro Botticelli|botticelli"], ["Chi ha scolpito il David in marmo della Galleria dell'Accademia di Firenze?", "Michelangelo|michelangelo buonarroti"],
      ["Chi ha dipinto la Notte stellata?", "Vincent van Gogh|van gogh"], ["Chi ha dipinto Guernica?", "Pablo Picasso|picasso"],
      ["Chi ha dipinto l'Ultima Cena di Santa Maria delle Grazie a Milano?", "Leonardo da Vinci|leonardo"], ["Chi ha dipinto la Scuola di Atene?", "Raffaello|raffaello sanzio"],
      ["Chi ha progettato la cupola di Santa Maria del Fiore a Firenze?", "Filippo Brunelleschi|brunelleschi"],
      ["Chi ha scolpito i due cavalli di bronzo di Piazza Cavalli a Piacenza?", "Francesco Mochi|mochi"], ["Chi ha dipinto Le ninfee?", "Claude Monet|monet"]
    ] },
    luoghi: { livelli: "EMS", voci: [
      ["In quale città si trova il Colosseo?", "Roma"], ["In quale città si trova la Torre pendente?", "Pisa"], ["In quale città si trova la basilica di San Marco?", "Venezia"],
      ["In quale città si trova la Galleria degli Uffizi?", "Firenze"], ["In quale città si trova il Duomo con la Madonnina?", "Milano"], ["In quale città si trova Piazza Cavalli?", "Piacenza"],
      ["In quale città si trova la Torre Eiffel?", "Parigi"], ["In quale città si trova il museo del Prado?", "Madrid"]
    ] },
    stili: { livelli: "MS", voci: [
      ["Come si chiama lo stile delle cattedrali con archi a sesto acuto e grandi vetrate?", "gotico", "romanico|barocco|neoclassico"],
      ["Come si chiama lo stile di Bernini e Borromini, nel Seicento?", "barocco", "gotico|romanico|neoclassico"],
      ["Come si chiama il movimento di Monet e Renoir, che dipingevano la luce all'aperto?", "impressionismo", "cubismo|futurismo|barocco"],
      ["Come si chiama il movimento di Picasso con le figure scomposte in forme geometriche?", "cubismo", "impressionismo|romanticismo|gotico"]
    ] },
    sport: { livelli: "EMS", voci: [
      ["Quanti giocatori per squadra ci sono in campo nella pallavolo?", "6"], ["Quanti giocatori per squadra ci sono in campo nel calcio?", "11"],
      ["Quanti giocatori per squadra ci sono in campo nella pallacanestro?", "5"], ["Quanti giocatori per squadra ci sono in acqua nella pallanuoto?", "7"],
      ["Ogni quanti anni si fanno le Olimpiadi estive?", "4"], ["Quanti set bisogna vincere per vincere una partita di pallavolo?", "3"],
      ["Quanti punti servono per vincere un set di pallavolo (non il tie-break)?", "25"], ["Quanti minuti dura un tempo di una partita di calcio?", "45"],
      ["Quanti chilometri è lunga una maratona?", "42,195|42.195"], ["Quanto è alta, in metri, la rete della pallavolo maschile?", "2,43|2.43"]
    ] },
    corpo: { livelli: "EMS", voci: [
      ["Quante ossa ha il corpo di un adulto?", "206"], ["Qual è il muscolo principale della respirazione?", "diaframma|il diaframma", "bicipite|quadricipite|deltoide"],
      ["Qual è l'osso più lungo del corpo umano?", "femore|il femore", "omero|tibia|radio"], ["Quale organo porta l'ossigeno nel sangue?", "polmoni|i polmoni|polmone", "fegato|stomaco|reni"]
    ] }
  };

  // ------------- vocabolario delle lingue (italiano → lingua) -------------
  const LINGUE = {
    francese: { nome: "francese", voci: [
      ["mela", "la pomme|pomme"], ["cane", "le chien|chien"], ["gatto", "le chat|chat"], ["casa", "la maison|maison"], ["libro", "le livre|livre"], ["scuola", "l'école|école"],
      ["acqua", "l'eau|eau"], ["rosso", "rouge"], ["verde", "vert"], ["giallo", "jaune"], ["sole", "le soleil|soleil"], ["luna", "la lune|lune"], ["pane", "le pain|pain"],
      ["latte", "le lait|lait"], ["amico", "l'ami|ami"], ["famiglia", "la famille|famille"], ["domani", "demain"], ["ieri", "hier"], ["sempre", "toujours"], ["mai", "jamais"],
      ["comprare", "acheter"], ["vendere", "vendre"], ["prezzo", "le prix|prix"], ["negozio", "le magasin|magasin|la boutique|boutique"], ["viaggio", "le voyage|voyage"],
      ["biglietto (del treno)", "le billet|billet|le ticket|ticket"], ["albergo", "l'hôtel|hôtel"], ["stazione", "la gare|gare"], ["aeroporto", "l'aéroport|aéroport"],
      ["spiaggia", "la plage|plage"], ["montagna", "la montagne|montagne"], ["città", "la ville|ville"], ["lunedì", "lundi"], ["venerdì", "vendredi"], ["grazie", "merci"],
      ["buongiorno", "bonjour"], ["arrivederci", "au revoir"], ["per favore", "s'il vous plaît|s'il te plaît"], ["finestra", "la fenêtre|fenêtre"], ["porta", "la porte|porte"],
      ["lavoro", "le travail|travail"], ["inverno", "l'hiver|hiver"], ["estate", "l'été|été"], ["piccolo", "petit"], ["fattura", "la facture|facture"], ["ufficio", "le bureau|bureau"],
      ["colazione", "le petit-déjeuner|petit-déjeuner|petit déjeuner"], ["oggi", "aujourd'hui"], ["azienda", "l'entreprise|entreprise"], ["cliente", "le client|client"]
    ] },
    spagnolo: { nome: "spagnolo", voci: [
      ["mela", "la manzana|manzana"], ["cane", "el perro|perro"], ["gatto", "el gato|gato"], ["scuola", "la escuela|escuela"], ["acqua", "el agua|agua"], ["rosso", "rojo"],
      ["giallo", "amarillo"], ["sole", "el sol|sol"], ["pane", "el pan|pan"], ["latte", "la leche|leche"], ["amico", "el amigo|amigo"], ["famiglia", "la familia|familia"],
      ["domani", "mañana"], ["ieri", "ayer"], ["sempre", "siempre"], ["mai", "nunca|jamás"], ["comprare", "comprar"], ["vendere", "vender"], ["prezzo", "el precio|precio"],
      ["negozio", "la tienda|tienda"], ["azienda", "la empresa|empresa"], ["viaggio", "el viaje|viaje"], ["stazione", "la estación|estación"], ["aeroporto", "el aeropuerto|aeropuerto"],
      ["spiaggia", "la playa|playa"], ["montagna", "la montaña|montaña"], ["città", "la ciudad|ciudad"], ["lunedì", "lunes"], ["venerdì", "viernes"], ["grazie", "gracias"],
      ["buongiorno", "buenos días"], ["arrivederci", "adiós|hasta luego"], ["per favore", "por favor"], ["finestra", "la ventana|ventana"], ["porta", "la puerta|puerta"],
      ["lavoro", "el trabajo|trabajo"], ["inverno", "el invierno|invierno"], ["estate", "el verano|verano"], ["felice", "feliz"], ["piccolo", "pequeño"],
      ["fattura", "la factura|factura"], ["ufficio", "la oficina|oficina"], ["colazione", "el desayuno|desayuno"], ["fornitore", "el proveedor|proveedor"],
      ["sconto", "el descuento|descuento"], ["anno", "el año|año"], ["oggi", "hoy"], ["cibo", "la comida|comida"], ["casa", "la casa|casa"], ["albergo", "el hotel|hotel"]
    ] },
    tedesco: { nome: "tedesco", voci: [
      ["mela", "der Apfel|apfel"], ["cane", "der Hund|hund"], ["gatto", "die Katze|katze"], ["casa", "das Haus|haus"], ["libro", "das Buch|buch"], ["scuola", "die Schule|schule"],
      ["acqua", "das Wasser|wasser"], ["rosso", "rot"], ["verde", "grün"], ["giallo", "gelb"], ["sole", "die Sonne|sonne"], ["luna", "der Mond|mond"], ["pane", "das Brot|brot"],
      ["latte", "die Milch|milch"], ["amico", "der Freund|freund"], ["famiglia", "die Familie|familie"], ["domani", "morgen"], ["ieri", "gestern"], ["sempre", "immer"],
      ["mai", "nie|niemals"], ["comprare", "kaufen"], ["vendere", "verkaufen"], ["prezzo", "der Preis|preis"], ["negozio", "das Geschäft|geschäft|der Laden|laden"],
      ["azienda", "das Unternehmen|unternehmen|die Firma|firma"], ["viaggio", "die Reise|reise"], ["stazione", "der Bahnhof|bahnhof"], ["aeroporto", "der Flughafen|flughafen"],
      ["spiaggia", "der Strand|strand"], ["montagna", "der Berg|berg"], ["città", "die Stadt|stadt"], ["lunedì", "Montag"], ["venerdì", "Freitag"], ["grazie", "danke"],
      ["buongiorno", "guten Tag|guten Morgen"], ["arrivederci", "auf Wiedersehen|tschüss"], ["per favore", "bitte"], ["finestra", "das Fenster|fenster"], ["porta", "die Tür|tür"],
      ["lavoro", "die Arbeit|arbeit"], ["inverno", "der Winter|winter"], ["estate", "der Sommer|sommer"], ["felice", "glücklich|froh"], ["grande", "groß"], ["piccolo", "klein"],
      ["fattura", "die Rechnung|rechnung"], ["ufficio", "das Büro|büro"], ["colazione", "das Frühstück|frühstück"], ["oggi", "heute"], ["albergo", "das Hotel|hotel"]
    ] },
    cinese: { nome: "cinese", cinese: true, voci: [
      ["ciao", "你好|nǐ hǎo"], ["grazie", "谢谢|xièxie"], ["arrivederci", "再见|zàijiàn"], ["acqua", "水|shuǐ"], ["uno", "一|yī"], ["due", "二|èr"], ["tre", "三|sān"],
      ["quattro", "四|sì"], ["cinque", "五|wǔ"], ["sei", "六|liù"], ["sette", "七|qī"], ["otto", "八|bā"], ["nove", "九|jiǔ"], ["dieci", "十|shí"], ["io", "我|wǒ"],
      ["tu", "你|nǐ"], ["lui", "他|tā"], ["grande", "大|dà"], ["piccolo", "小|xiǎo"], ["persona", "人|rén"], ["Cina", "中国|Zhōngguó"], ["Italia", "意大利|Yìdàlì"],
      ["insegnante", "老师|lǎoshī"], ["studente", "学生|xuésheng"], ["scuola", "学校|xuéxiào"], ["amico", "朋友|péngyou"], ["mamma", "妈妈|māma"], ["papà", "爸爸|bàba"],
      ["tè", "茶|chá"], ["riso (cotto)", "米饭|mǐfàn"], ["cane", "狗|gǒu"], ["gatto", "猫|māo"], ["libro", "书|shū"], ["oggi", "今天|jīntiān"], ["domani", "明天|míngtiān"],
      ["ieri", "昨天|zuótiān"], ["mangiare", "吃|chī"], ["bere", "喝|hē"], ["soldi", "钱|qián"], ["negozio", "商店|shāngdiàn"], ["treno", "火车|huǒchē"], ["aereo", "飞机|fēijī"]
    ] }
  };

  // ------------- conti calcolati (zero errori di calcolo) -------------
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pesca = arr => arr[Math.floor(Math.random() * arr.length)];
  const CONTI = {
    velocita: () => { const t = rnd(2, 6), v = rnd(4, 30) * 5; return { d: `Un treno percorre ${v * t} km in ${t} ore. Qual è la sua velocità media in km/h?`, r: v }; },
    forza: () => { const m = rnd(2, 50), a = rnd(1, 10); return { d: `Una forza spinge un carrello di ${m} kg con un'accelerazione di ${a} m/s². Quanti newton vale la forza? (F = m × a)`, r: m * a }; },
    ohm: () => { const R = rnd(2, 60), I = rnd(1, 5); return { d: `In un circuito la resistenza è ${R} Ω e la corrente è ${I} A. Quanti volt è la tensione? (V = R × I)`, r: R * I }; },
    densita: () => { const d = rnd(1, 9), V = rnd(2, 20); return { d: `Un oggetto ha massa ${d * V} g e volume ${V} cm³. Qual è la sua densità in g/cm³?`, r: d }; },
    lavoro: () => { const F = rnd(2, 20) * 5, s = rnd(2, 20); return { d: `Una forza di ${F} N sposta una cassa di ${s} m nella stessa direzione. Quanti joule di lavoro fa? (L = F × s)`, r: F * s }; },
    cinetica: () => { const m = rnd(1, 10) * 2, v = rnd(1, 10); return { d: `Un corpo di ${m} kg va a ${v} m/s. Quanti joule di energia cinetica ha? (Ec = ½ × m × v²)`, r: m * v * v / 2 }; },
    bin2dec: () => { const n = rnd(3, 63); return { d: `Quanto vale in decimale il numero binario ${n.toString(2)}?`, r: n }; },
    dec2bin: () => { const n = rnd(3, 63), b = n.toString(2); return { d: `Scrivi in binario il numero ${n}.`, testo: true, accettate: [b, b.padStart(8, "0")], mostra: b }; }
  };

  // che cosa può chiedere ogni materia
  const PIANO = {
    italiano: { gruppi: ["autori", "grammatica", "tempi"] },
    storia: { gruppi: ["date", "personaggi"] },
    geografia: { gruppi: ["capitali", "regioni", "geofatti"] },
    diritto: { gruppi: ["costituzione", "poteri"] },
    economiapolitica: { gruppi: ["economiapol", "europa"] },
    relazioni: { gruppi: ["europa", "economiapol", "capitali"] },
    scienze: { gruppi: ["biologia", "terra"] },
    fisica: { gruppi: ["unita"], conti: ["velocita", "forza", "ohm", "densita", "lavoro", "cinetica"] },
    chimica: { gruppi: ["simboli", "elementi", "formule", "atomo"] },
    informatica: { gruppi: ["informatica"], conti: ["bin2dec", "dec2bin"] },
    turismo: { gruppi: ["capitali", "regioni", "luoghi"], categorie: ["Percentuali", "Economia aziendale"] },
    arte: { gruppi: ["artisti", "luoghi", "stili"] },
    motorie: { gruppi: ["sport", "corpo"] },
    francese: { lingua: "francese" }, spagnolo: { lingua: "spagnolo" }, tedesco: { lingua: "tedesco" }, cinese: { lingua: "cinese" }
  };

  // ------------- confronto delle risposte (gentile: accenti, articoli, maiuscole, spazi) -------------
  const ARTICOLI = /^(the|a|an|to|il|lo|la|i|gli|le|un|uno|una|le|les|des|du|el|los|las|unos|unas|der|die|das|den|dem|des|ein|eine|einen|sul|sulla|nel|nei|nella|con|alla|al)\s+(?=\S)/;
  function norm(t) {
    let s = String(t ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss").replace(/[’`´]/g, "'").trim();
    s = s.replace(/^(l|un|d)'\s*/, "");
    for (let k = 0; k < 2; k++) s = s.replace(ARTICOLI, "");
    return s.replace(/[^a-z0-9一-鿿]/g, "");
  }
  const piega = s => s.replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u");   // "gruen" = "grün" (tastiere italiane)
  function stessa(risposta, accettate) {
    const r = norm(risposta); if (!r) return false;
    return accettate.some(a => { const n = norm(a); return n && (n === r || piega(n) === piega(r)); });
  }
  const numerica = a => /^\d+(?:[.,]\d+)?$/.test(String(a).trim());
  const formattaN = x => String(Math.round(x * 1000) / 1000).replace(".", ",");

  // ------------- scelta delle domande -------------
  const lettera = livello => livello === "elementari" ? "E" : livello === "medie" ? "M" : "S";
  function gruppiDi(materia, livello) {
    const p = PIANO[materia]; if (!p || !p.gruppi) return [];
    const ok = p.gruppi.filter(g => GRUPPI[g].livelli.includes(lettera(livello)));
    return ok.length ? ok : p.gruppi;
  }
  const sa = materia => !!PIANO[materia];
  const mostraLingua = (L, acc) => L.cinese ? `${acc[0]} (${acc[1]})` : acc[0];

  // una domanda a risposta scritta: { testo, accettate, mostra } oppure numerica { testo, r, mostra }
  function domanda(materia, livello) {
    const p = PIANO[materia]; if (!p) return null;
    if (p.lingua) {
      const L = LINGUE[p.lingua], [it, en] = pesca(L.voci), acc = en.split("|");
      return { testo: `Come si dice "${it}" in ${L.nome}?`, accettate: acc, mostra: mostraLingua(L, acc) };
    }
    const fonti = [...gruppiDi(materia, livello).map(g => ["g", g]), ...(p.conti || []).filter(() => livello !== "elementari").map(c => ["c", c]),
      ...(p.categorie || []).filter(() => livello !== "elementari" && typeof CATEGORIE !== "undefined").map(c => ["k", c])];
    const [tipo, nome] = pesca(fonti);
    if (tipo === "c") { const e = CONTI[nome](); return e.testo ? { testo: e.d, accettate: e.accettate, mostra: e.mostra } : { testo: e.d, r: e.r, mostra: formattaN(e.r) }; }
    if (tipo === "k") { const e = CATEGORIE[nome](); return { testo: e.d, r: e.r, mostra: formattaN(e.r) }; }
    const [d, r] = pesca(GRUPPI[nome].voci), acc = r.split("|");
    if (acc.every(numerica)) return { testo: d, r: Number(acc[0].replace(",", ".")), mostra: acc[0], accettate: acc };
    return { testo: d, accettate: acc, mostra: acc[0] };
  }

  // sbagliate credibili: per i numeri, numeri vicini; per le parole, altre risposte dello stesso gruppo
  function sbagliateDi(voce, gruppo) {
    const [, r, sb] = voce, acc = r.split("|");
    if (sb) return sb.split("|");
    if (acc.every(numerica)) {
      const x = Number(acc[0].replace(",", ".")), dec = /[.,]/.test(acc[0]);
      const passi = dec ? [1, -1, 2, 0.5] : x >= 300 ? [1, -1, 2, -2, 3, 5, -5, 10, -10] : [1, -1, 2, -2, 3, 4];
      const cand = []; for (const s of passi.sort(() => Math.random() - .5)) { const v = Math.round((x + s) * 1000) / 1000; if (v > 0 && !(x >= 300 && v > 2026) && v !== x) cand.push(dec ? formattaN(v) : String(v)); }
      return cand;
    }
    return gruppo.voci.filter(v => v !== voce).map(v => v[1].split("|")[0]).filter(a => !stessa(a, acc));
  }
  // una domanda a scelta multipla (4 opzioni, una giusta)
  function sceltaMultipla(materia, livello) {
    const p = PIANO[materia]; if (!p) return null;
    let testo, giusta, sbagliate, spieg;
    if (p.lingua) {
      const L = LINGUE[p.lingua], voce = pesca(L.voci), acc = voce[1].split("|");
      const altre = L.voci.filter(v => v !== voce && !stessa(v[1].split("|")[0], acc)).sort(() => Math.random() - .5).slice(0, 3);
      if (Math.random() < .5) { testo = `Come si dice "${voce[0]}" in ${L.nome}?`; giusta = mostraLingua(L, acc); sbagliate = altre.map(v => mostraLingua(L, v[1].split("|"))); }
      else { testo = `Che cosa vuol dire "${mostraLingua(L, acc)}"?`; giusta = voce[0]; sbagliate = altre.map(v => v[0]); }
      spieg = `"${voce[0]}" in ${L.nome} si dice ${mostraLingua(L, acc)}.`;
    } else {
      const fonti = [...gruppiDi(materia, livello).map(g => ["g", g]), ...(p.conti || []).filter(c => c !== "dec2bin" && livello !== "elementari").map(c => ["c", c])];
      const [tipo, nome] = pesca(fonti);
      if (tipo === "c") {
        const e = CONTI[nome](), r = e.r;
        const cand = [...new Set([r + 1, r - 1, r * 2, r + 10, r - 10, Math.round(r / 2), r + 5].filter(v => v > 0 && v !== r))].sort(() => Math.random() - .5);
        testo = e.d; giusta = formattaN(r); sbagliate = cand.map(formattaN); spieg = `Il risultato giusto è ${formattaN(r)} (calcolato dalla calcolatrice).`;
      } else {
        const g = GRUPPI[nome], voce = pesca(g.voci), acc = voce[1].split("|");
        testo = voce[0]; giusta = acc[0]; sbagliate = sbagliateDi(voce, g); spieg = `La risposta giusta è: ${acc[0]}.`;
      }
    }
    const visti = new Set([norm(giusta)]), opz = [giusta];
    for (const s of sbagliate.sort(() => Math.random() - .5)) { const n = norm(s); if (opz.length >= 4) break; if (n && !visti.has(n)) { visti.add(n); opz.push(s); } }
    if (opz.length < 4) return null;
    const ordine = opz.map((o, i) => [Math.random(), o, i]).sort((a, b) => a[0] - b[0]);
    return { domanda: testo, opzioni: ordine.map(x => x[1]), giusta: ordine.findIndex(x => x[2] === 0), spiegazione: spieg, controllata: true };
  }

  return { GRUPPI, LINGUE, CONTI, PIANO, norm, stessa, sa, domanda, sceltaMultipla, gruppiDi };
})();
