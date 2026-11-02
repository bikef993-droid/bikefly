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

  // ------------- in più (v0.9.11): liste più grandi, stesse regole -------------
  const altre = (g, voci) => GRUPPI[g].voci.push(...voci);
  altre("capitali", [
    capitale("dei Paesi Bassi", "Amsterdam"), capitale("del Lussemburgo", "Lussemburgo"), capitale("di Cipro", "Nicosia"), capitale("della Bielorussia", "Minsk"),
    capitale("della Bosnia ed Erzegovina", "Sarajevo"), capitale("della Macedonia del Nord", "Skopje"), capitale("del Montenegro", "Podgorica"), capitale("di San Marino", "San Marino|città di san marino"),
    capitale("della Corea del Sud", "Seul|seoul"), capitale("della Thailandia", "Bangkok"), capitale("dell'Iran", "Teheran|tehran"), capitale("dell'Arabia Saudita", "Riad|riyadh"),
    capitale("della Nigeria", "Abuja"), capitale("del Kenya", "Nairobi"), capitale("dell'Etiopia", "Addis Abeba|addis ababa"), capitale("dell'Algeria", "Algeri"),
    capitale("della Tunisia", "Tunisi"), capitale("del Cile", "Santiago|santiago del cile"), capitale("del Perù", "Lima"), capitale("della Colombia", "Bogotà|bogota"),
    capitale("del Venezuela", "Caracas"), capitale("di Cuba", "L'Avana|avana"), capitale("della Nuova Zelanda", "Wellington"), capitale("del Vietnam", "Hanoi"),
    capitale("delle Filippine", "Manila"), capitale("del Pakistan", "Islamabad")
  ]);
  altre("geofatti", [
    ["Qual è la montagna più alta del mondo?", "Everest|monte everest", "Monte Bianco|Kilimangiaro|Aconcagua"],
    ["Qual è il deserto caldo più grande del mondo?", "Sahara|deserto del sahara", "Gobi|Kalahari|Atacama"],
    ["Quante sono le province dell'Emilia-Romagna?", "9"],
    ["Quale fiume attraversa Roma?", "Tevere", "Arno|Po|Adige"],
    ["Quale fiume attraversa Firenze?", "Arno", "Tevere|Po|Adige"],
    ["Qual è l'isola più grande d'Italia?", "Sicilia", "Sardegna|Elba|Capri"],
    ["Quale stretto separa la Sicilia dalla Calabria?", "Stretto di Messina|messina", "Stretto di Gibilterra|Bosforo|Stretto di Bonifacio"],
    ["Quale mare c'è tra l'Italia e i Balcani?", "Adriatico|mar adriatico|mare adriatico", "Tirreno|Ligure|Mar Nero"],
    ["Quante sono le regioni italiane a statuto speciale?", "5"]
  ]);
  altre("date", [
    ["In che anno fu concesso lo Statuto Albertino?", "1848"], ["In che anno ci fu la pace di Westfalia?", "1648"],
    ["In che anno nacque l'Impero tedesco (unificazione della Germania)?", "1871"], ["In che anno ci fu la battaglia di Lepanto?", "1571"],
    ["In che anno cadde Costantinopoli, conquistata dagli Ottomani?", "1453"], ["In che anno fu emanato l'Editto di Milano (Costantino)?", "313"],
    ["In che anno si sciolse l'Unione Sovietica?", "1991"], ["In che anno fu firmato il Trattato di Maastricht?", "1992"],
    ["In che anno ci fu lo sbarco in Normandia?", "1944"], ["In che anno ci fu l'armistizio dell'8 settembre?", "1943"],
    ["In che anno morì Giulio Cesare?", "44 a.C.|44 ac|44", "27 a.C.|49 a.C.|14 d.C."]
  ]);
  altre("personaggi", [
    ["Chi fu il primo presidente della Repubblica italiana?", "Enrico De Nicola|de nicola"], ["Chi guidò l'India verso l'indipendenza con la non violenza?", "Gandhi|mahatma gandhi|mohandas gandhi"],
    ["Quale regina d'Egitto fu alleata di Marco Antonio?", "Cleopatra"], ["Quale condottiero cartaginese attraversò le Alpi con gli elefanti?", "Annibale"],
    ["Chi guidò i bolscevichi nella Rivoluzione russa del 1917?", "Lenin|vladimir lenin"], ["Chi pronunciò il discorso \"I have a dream\"?", "Martin Luther King|luther king"],
    ["Chi fondò il fascismo in Italia?", "Benito Mussolini|mussolini"], ["Chi scoprì il Polo Sud per primo, nel 1911?", "Roald Amundsen|amundsen"]
  ]);
  altre("autori", [
    ["Chi ha scritto Il Gattopardo?", "Giuseppe Tomasi di Lampedusa|tomasi di lampedusa"], ["Chi ha scritto Ossi di seppia?", "Eugenio Montale|montale"],
    ["Chi ha scritto L'allegria?", "Giuseppe Ungaretti|ungaretti"], ["Chi ha scritto Dei Sepolcri?", "Ugo Foscolo|foscolo"],
    ["Chi ha scritto Il nome della rosa?", "Umberto Eco|eco"], ["Chi ha scritto La locandiera?", "Carlo Goldoni|goldoni"],
    ["Chi ha scritto Myricae?", "Giovanni Pascoli|pascoli"], ["Chi ha scritto Il piacere?", "Gabriele D'Annunzio|d'annunzio|dannunzio"],
    ["Chi ha scritto il libro Cuore?", "Edmondo De Amicis|de amicis"], ["Chi ha scritto il Cantico delle creature?", "San Francesco d'Assisi|francesco d'assisi|san francesco"],
    ["Chi ha scritto l'Odissea?", "Omero"], ["Chi ha scritto l'Eneide?", "Virgilio|publio virgilio marone"], ["Chi ha scritto Romeo e Giulietta?", "William Shakespeare|shakespeare"]
  ]);
  altre("grammatica", [
    ["Qual è il plurale di \"dio\"?", "dei", "dii|dio|die"], ["Qual è il plurale di \"ala\"?", "ali", "alas|alle|alli"],
    ["Qual è il plurale di \"mano\"?", "mani", "mano|mane|manni"], ["Qual è il plurale di \"eco\"?", "echi", "eci|echie|eco"],
    ["Qual è il plurale di \"re\"?", "re", "rei|ri|rie"], ["Che parte del discorso è \"e\" in \"Marco e Luca\"?", "congiunzione", "preposizione|avverbio|articolo"],
    ["Che parte del discorso è \"lui\"?", "pronome", "aggettivo|articolo|avverbio"], ["Che parte del discorso è \"il\"?", "articolo", "pronome|preposizione|aggettivo"]
  ]);
  GRUPPI.complementi = { livelli: "MS", voci: [
    ["Nella frase \"Vado a Roma\", che complemento è \"a Roma\"?", "complemento di moto a luogo|moto a luogo", "stato in luogo|moto da luogo|complemento di termine"],
    ["Nella frase \"Parto da Milano\", che complemento è \"da Milano\"?", "complemento di moto da luogo|moto da luogo", "moto a luogo|stato in luogo|complemento d'agente"],
    ["Nella frase \"Il libro è sul tavolo\", che complemento è \"sul tavolo\"?", "complemento di stato in luogo|stato in luogo", "moto a luogo|moto per luogo|complemento oggetto"],
    ["Nella frase \"Esco con Luca\", che complemento è \"con Luca\"?", "complemento di compagnia|compagnia", "complemento di mezzo|complemento di modo|complemento di termine"],
    ["Nella frase \"La casa di Marco\", che complemento è \"di Marco\"?", "complemento di specificazione|specificazione", "complemento di termine|complemento di origine|complemento di materia"],
    ["Nella frase \"Regalo un libro a Sara\", che complemento è \"a Sara\"?", "complemento di termine|termine", "complemento oggetto|moto a luogo|complemento di specificazione"]
  ] };
  GRUPPI.figure = { livelli: "MS", voci: [
    ["\"Il tuo sorriso è il sole\": che figura retorica è?", "metafora", "similitudine|iperbole|ossimoro"],
    ["\"Forte come un leone\": che figura retorica è?", "similitudine", "metafora|iperbole|ossimoro"],
    ["\"Te l'ho detto mille volte\": che figura retorica è?", "iperbole", "metafora|similitudine|ossimoro"],
    ["\"Ghiaccio bollente\": che figura retorica è?", "ossimoro", "metafora|similitudine|iperbole"]
  ] };
  altre("costituzione", [
    ["Quanti sono gli articoli dei Principi fondamentali della Costituzione?", "12"], ["Quante sono le Camere del Parlamento italiano?", "2"],
    ["Quante firme servono per chiedere un referendum abrogativo?", "500.000|500000|cinquecentomila"], ["Quante firme servono per una proposta di legge di iniziativa popolare?", "50.000|50000|cinquantamila"]
  ]);
  altre("poteri", [
    ["Chi elegge il Presidente della Repubblica?", "il Parlamento in seduta comune|parlamento|il parlamento", "i cittadini|il Governo|il Senato"],
    ["Chi nomina il Presidente del Consiglio?", "il Presidente della Repubblica|presidente della repubblica", "il Parlamento|i cittadini|la Corte costituzionale"],
    ["Chi controlla che le leggi rispettino la Costituzione?", "la Corte costituzionale|corte costituzionale", "il Senato|il Governo|la Corte dei conti"],
    ["Come si chiama il sistema con due Camere che hanno gli stessi poteri?", "bicameralismo perfetto|bicameralismo paritario", "monocameralismo|bicameralismo imperfetto|federalismo"],
    ["Con quale strumento i cittadini possono cancellare una legge?", "referendum abrogativo|referendum", "decreto legge|petizione|legge delega"]
  ]);
  altre("economiapol", [
    ["Come si chiama la quantità di un bene che i consumatori vogliono comprare?", "domanda|la domanda", "offerta|produzione|equilibrio"],
    ["Come si chiama la quantità di un bene che le imprese vogliono vendere?", "offerta|l'offerta", "domanda|consumo|equilibrio"],
    ["Come si chiama il prezzo a cui la domanda è uguale all'offerta?", "prezzo di equilibrio|equilibrio", "prezzo di costo|prezzo massimo|prezzo politico"],
    ["Quale imposta pagano le società sui loro utili?", "IRES", "IRPEF|IVA|IMU"],
    ["Chi approva il bilancio dello Stato?", "il Parlamento|parlamento", "il Governo|la Banca d'Italia|il Presidente della Repubblica"],
    ["Qual è la moneta del Regno Unito?", "sterlina|sterlina inglese", "euro|dollaro|franco"], ["Qual è la moneta degli Stati Uniti?", "dollaro|dollaro statunitense", "euro|sterlina|yen"],
    ["Qual è la moneta del Giappone?", "yen", "yuan|won|dollaro"], ["Qual è la moneta della Svizzera?", "franco svizzero|franco", "euro|sterlina|corona"]
  ]);
  altre("europa", [
    ["Qual è l'inno dell'Unione europea?", "Inno alla gioia|l'inno alla gioia", "Marsigliese|Fratelli d'Italia|God Save the King"],
    ["Quante stelle ci sono sulla bandiera dell'Unione europea?", "12"]
  ]);
  altre("biologia", [
    ["Quale molecola contiene l'informazione genetica?", "DNA|il dna", "ATP|glucosio|amido"],
    ["Come si chiama la divisione di una cellula in due cellule uguali?", "mitosi", "meiosi|fotosintesi|fecondazione"],
    ["Come si chiama la divisione cellulare che forma i gameti?", "meiosi", "mitosi|fotosintesi|osmosi"],
    ["Quale organo filtra il sangue e produce l'urina?", "reni|i reni|rene", "fegato|polmoni|milza"],
    ["Quali cellule del sangue trasportano l'ossigeno?", "globuli rossi|i globuli rossi|eritrociti", "globuli bianchi|piastrine|neuroni"],
    ["Quali cellule del sangue ci difendono dalle infezioni?", "globuli bianchi|i globuli bianchi|leucociti", "globuli rossi|piastrine|neuroni"],
    ["Quante cavità (camere) ha il cuore umano?", "4"],
    ["Come si chiamano gli animali che depongono le uova?", "ovipari", "vivipari|mammiferi|erbivori"],
    ["Come si chiamano gli animali che allattano i piccoli?", "mammiferi", "rettili|anfibi|uccelli"]
  ]);
  altre("terra", [
    ["Qual è il gas più abbondante nell'atmosfera?", "azoto", "ossigeno|anidride carbonica|argon"],
    ["In quale strato dell'atmosfera viviamo?", "troposfera", "stratosfera|mesosfera|termosfera"],
    ["In quale strato dell'atmosfera si trova lo strato di ozono?", "stratosfera", "troposfera|mesosfera|esosfera"],
    ["Quale pianeta è chiamato \"il pianeta rosso\"?", "Marte", "Venere|Giove|Mercurio"],
    ["Quale pianeta ha gli anelli più famosi?", "Saturno", "Giove|Urano|Nettuno"],
    ["Qual è la stella più vicina alla Terra?", "il Sole|sole", "Sirio|la Stella Polare|Alfa Centauri"],
    ["Con quale scala si misura la magnitudo (l'energia) di un terremoto?", "Richter|scala richter", "Mercalli|Beaufort|Celsius"],
    ["Con quale scala si misurano gli effetti (i danni) di un terremoto?", "Mercalli|scala mercalli", "Richter|Beaufort|Kelvin"],
    ["Come si chiama il punto della superficie che sta sopra l'ipocentro?", "epicentro", "cratere|faglia|magma"]
  ]);
  GRUPPI.scienziati = { livelli: "MS", voci: [
    ["Chi formulò i tre principi della dinamica e la legge di gravitazione universale?", "Isaac Newton|newton"], ["Chi scoprì con il cannocchiale i quattro satelliti più grandi di Giove?", "Galileo Galilei|galileo"],
    ["Chi propose la teoria dell'evoluzione per selezione naturale?", "Charles Darwin|darwin"], ["Chi scoprì le leggi dell'ereditarietà con le piante di pisello?", "Gregor Mendel|mendel"],
    ["Chi formulò la teoria della relatività?", "Albert Einstein|einstein"], ["Chi fu la prima donna a vincere un premio Nobel, per gli studi sulla radioattività?", "Marie Curie|curie|maria curie"],
    ["Chi scoprì la penicillina?", "Alexander Fleming|fleming"], ["Chi inventò la pila elettrica?", "Alessandro Volta|volta"],
    ["Chi inventò il telegrafo senza fili (la radio)?", "Guglielmo Marconi|marconi"], ["Chi creò la tavola periodica degli elementi?", "Dmitrij Mendeleev|mendeleev|mendeleiev"],
    ["Chi propose che la Terra gira intorno al Sole (eliocentrismo) nel Cinquecento?", "Niccolò Copernico|copernico"], ["Chi scoprì il principio del galleggiamento dei corpi?", "Archimede"]
  ] };
  altre("unita", [
    ["Quanti metri ci sono in un chilometro?", "1000|1.000|mille"], ["Quanti grammi ci sono in un chilogrammo?", "1000|1.000|mille"],
    ["Quanti secondi ci sono in un'ora?", "3600|3.600"], ["A quanti gradi Celsius bolle l'acqua, al livello del mare?", "100"],
    ["A quanti gradi Celsius gela l'acqua?", "0|zero"], ["Quanto vale circa l'accelerazione di gravità sulla Terra, in m/s²?", "9,8|9.8|9,81|9.81"]
  ]);
  altre("simboli", [["manganese", "Mn"], ["cobalto", "Co"], ["platino", "Pt"], ["bromo", "Br"], ["berillio", "Be"], ["boro", "B"], ["titanio", "Ti"], ["tungsteno", "W"], ["bario", "Ba"], ["cromo", "Cr"], ["cripto", "Kr"], ["xeno", "Xe"]]
    .map(([el, s]) => [`Qual è il simbolo chimico di: ${el}?`, s]));
  altre("formule", [
    ["Qual è la formula del glucosio?", "C6H12O6"], ["Qual è la formula dell'acido solforico?", "H2SO4"], ["Qual è la formula dell'idrossido di sodio?", "NaOH"],
    ["Qual è la formula dell'ossigeno gassoso?", "O2"], ["Qual è la formula dell'azoto gassoso?", "N2"], ["Qual è la formula del carbonato di calcio?", "CaCO3"]
  ]);
  altre("informatica", [
    ["Che cosa vuol dire la sigla CPU?", "Central Processing Unit|unità centrale di elaborazione", "Computer Personal Unit|Central Program Utility|Control Power Unit"],
    ["Che cosa vuol dire la sigla RAM?", "Random Access Memory", "Read Access Memory|Rapid Action Memory|Random Archive Module"],
    ["Quale porta logica dà 1 solo se tutti e due gli ingressi sono 1?", "AND", "OR|NOT|XOR"],
    ["Quale porta logica dà 1 se almeno un ingresso è 1?", "OR", "AND|NOT|NAND"],
    ["Quale porta logica inverte il valore (0 diventa 1)?", "NOT", "AND|OR|XOR"],
    ["Come si chiama il programma che si usa per navigare in Internet?", "browser|il browser", "firewall|driver|compilatore"],
    ["Come si chiama la protezione che blocca gli accessi non autorizzati alla rete?", "firewall|il firewall", "browser|router|antivirus"],
    ["Come si chiama la truffa via email che cerca di rubare le password?", "phishing|il phishing", "spam|backup|streaming"],
    ["Quale funzione del foglio di calcolo fa la media dei numeri?", "MEDIA|media()", "SOMMA|CONTA|MAX"]
  ]);
  altre("artisti", [
    ["Chi ha dipinto la Ronda di notte?", "Rembrandt|rembrandt van rijn"], ["Chi ha dipinto L'urlo?", "Edvard Munch|munch"],
    ["Chi ha dipinto La persistenza della memoria, con gli orologi molli?", "Salvador Dalí|dali"], ["Chi ha progettato il colonnato di piazza San Pietro?", "Gian Lorenzo Bernini|bernini"],
    ["Chi ha dipinto la Venere di Urbino?", "Tiziano|tiziano vecellio"], ["Chi ha affrescato la Cappella degli Scrovegni a Padova?", "Giotto|giotto di bondone"],
    ["Chi ha dipinto La Libertà che guida il popolo?", "Eugène Delacroix|delacroix"], ["Chi ha dipinto Il Quarto Stato?", "Giuseppe Pellizza da Volpedo|pellizza da volpedo|pellizza"]
  ]);
  altre("luoghi", [
    ["In quale città si trova la Mole Antonelliana?", "Torino"], ["In quale città si trova Piazza del Campo, dove si corre il Palio?", "Siena"],
    ["In quale città si trova la Cappella degli Scrovegni?", "Padova"], ["In quale città si trova l'Arena famosa per la lirica?", "Verona"],
    ["In quale città si trova la grande Reggia dei Borbone?", "Caserta"], ["In quale città si trova la Valle dei Templi?", "Agrigento"],
    ["In quale città si trovano i Sassi?", "Matera"], ["In quale città si trova il Big Ben?", "Londra"], ["In quale città si trova la Sagrada Família?", "Barcellona"],
    ["In quale città si trova la Porta di Brandeburgo?", "Berlino"], ["In quale città si trova il Partenone?", "Atene"]
  ]);
  altre("stili", [
    ["Come si chiama lo stile delle chiese con archi a tutto sesto e muri spessi (XI-XII secolo)?", "romanico", "gotico|barocco|rococò"],
    ["Come si chiama il movimento di fine Settecento che si ispira all'arte greca e romana?", "neoclassicismo", "romanticismo|barocco|futurismo"],
    ["Come si chiama il movimento italiano di Marinetti che esaltava la velocità e le macchine?", "futurismo", "cubismo|impressionismo|surrealismo"],
    ["Come si chiama il periodo di Leonardo, Michelangelo e Raffaello?", "Rinascimento", "Medioevo|Barocco|Illuminismo"]
  ]);
  altre("sport", [
    ["Quanti cerchi ci sono nel simbolo delle Olimpiadi?", "5"], ["Quanti metri è lunga una piscina olimpionica?", "50"],
    ["Quanti punti vale un canestro tirato da oltre la linea dei tre punti?", "3"], ["Quanti minuti di gioco dura una partita di pallacanestro (regole FIBA)?", "40"],
    ["Quanto è alta, in metri, la rete della pallavolo femminile?", "2,24|2.24"], ["Quanti metri misura la gara di velocità più corta alle Olimpiadi?", "100"]
  ]);
  altre("corpo", [
    ["Quanti denti ha la dentatura completa di un adulto?", "32"], ["Qual è l'organo più grande del corpo umano?", "la pelle|pelle", "fegato|cervello|intestino"],
    ["Qual è il muscolo più grande del corpo umano?", "grande gluteo|gluteo", "bicipite|quadricipite|deltoide"]
  ]);

  GRUPPI.diritto2 = { livelli: "MS", voci: [
    ["A che età si diventa maggiorenni in Italia?", "18"],
    ["Come si chiama il contratto che trasferisce la proprietà di una cosa in cambio di un prezzo?", "compravendita|vendita", "locazione|mutuo|donazione"],
    ["Come si chiama il contratto con cui si dà in uso un bene in cambio di un canone?", "locazione|affitto", "compravendita|mutuo|comodato"],
    ["Come si chiama il contratto con cui si presta una somma di denaro?", "mutuo", "locazione|comodato|compravendita"],
    ["Nell'obbligazione, chi deve fare la prestazione?", "il debitore|debitore", "il creditore|il garante|il notaio"],
    ["Nell'obbligazione, chi ha diritto a ricevere la prestazione?", "il creditore|creditore", "il debitore|il fideiussore|il giudice"],
    ["Dopo quanti giorni dalla pubblicazione, di solito, una legge entra in vigore?", "15"],
    ["Su quale giornale ufficiale si pubblicano le leggi?", "Gazzetta Ufficiale|la gazzetta ufficiale", "Bollettino Europeo|Albo pretorio|Codice civile"],
    ["Chi promulga le leggi?", "il Presidente della Repubblica|presidente della repubblica", "il Presidente del Consiglio|il Senato|la Corte costituzionale"],
    ["Entro quanti giorni un decreto-legge deve diventare legge?", "60"],
    ["Articolo 3: \"Tutti i cittadini hanno pari dignità sociale e sono eguali davanti alla…\"", "legge|alla legge", "Costituzione|Stato|Repubblica"],
    ["La Costituzione italiana è rigida o flessibile?", "rigida", "flessibile|consuetudinaria|ottriata"],
    ["Qual è la forma di governo dell'Italia?", "repubblica parlamentare", "repubblica presidenziale|monarchia costituzionale|repubblica semipresidenziale"],
    ["Chi può sciogliere le Camere?", "il Presidente della Repubblica|presidente della repubblica", "il Presidente del Consiglio|la Corte costituzionale|il Presidente del Senato"],
    ["Chi dà la fiducia al Governo?", "le Camere|il Parlamento|parlamento", "il Presidente della Repubblica|i cittadini|la Corte costituzionale"]
  ] };
  altre("economiapol", [
    ["Come si chiama la parte dell'economia che studia il singolo consumatore e la singola impresa?", "microeconomia", "macroeconomia|econometria|statistica"],
    ["Come si chiama la parte dell'economia che studia l'economia di un intero Paese?", "macroeconomia", "microeconomia|ragioneria|merceologia"],
    ["Come si chiamano i beni che si usano insieme, come auto e benzina?", "complementari|beni complementari", "succedanei|inferiori|pubblici"],
    ["Come si chiamano i beni che si possono usare uno al posto dell'altro, come burro e margarina?", "succedanei|sostituti|beni succedanei", "complementari|inferiori|di lusso"],
    ["Come si chiama la fase in cui il PIL cala per almeno due trimestri di fila?", "recessione", "espansione|ripresa|inflazione"],
    ["Chi decide la politica monetaria nei Paesi dell'euro?", "la BCE|bce|banca centrale europea", "la Commissione europea|il Parlamento europeo|il Fondo monetario internazionale"],
    ["Quale imposta si paga sul possesso degli immobili?", "IMU", "IVA|IRPEF|IRES"],
    ["Il debito pubblico è il debito di chi?", "dello Stato|lo stato|stato", "delle famiglie|delle imprese|delle banche"],
    ["Come si chiama la differenza tra esportazioni e importazioni?", "saldo commerciale|bilancia commerciale", "debito pubblico|PIL|inflazione"],
    ["I fattori della produzione classici sono terra, lavoro e…", "capitale|il capitale", "moneta|tasse|consumo"],
    ["Quando i prezzi salgono, il potere d'acquisto della moneta…", "diminuisce|scende|cala", "aumenta|resta uguale|raddoppia"],
    ["Come si chiama il mercato con tanti venditori e tanti compratori di un bene uguale?", "concorrenza perfetta", "monopolio|oligopolio|monopsonio"]
  ]);
  GRUPPI.regole = { livelli: "EMS", voci: [
    ["Quanti giocatori per squadra ci sono in campo nella pallamano?", "7"], ["Quanti giocatori per squadra ci sono in campo nel calcio a 5?", "5"],
    ["Quanti punti vale un tiro libero nella pallacanestro?", "1"], ["In quale sport si fa il \"muro\" sotto rete?", "pallavolo", "calcio|pallacanestro|rugby"],
    ["Quanti tocchi può fare al massimo una squadra di pallavolo prima di mandare la palla di là (senza contare il muro)?", "3"],
    ["Quanti metri è lunga la pista di atletica, nella corsia interna?", "400"], ["Quante gare ha il decathlon?", "10"], ["Quante gare ha l'eptathlon?", "7"],
    ["Ogni quanti anni si giocano i Mondiali di calcio?", "4"], ["In quale città si sono svolte le Olimpiadi estive del 2024?", "Parigi", "Londra|Tokyo|Los Angeles"],
    ["Quale capacità permette di fare uno sforzo a lungo?", "resistenza", "forza|velocità|equilibrio"],
    ["Come si chiama la capacità di muovere le articolazioni in tutta la loro ampiezza?", "mobilità articolare|flessibilità|mobilità", "resistenza|forza|velocità"],
    ["Come si chiama il muscolo davanti alla coscia?", "quadricipite|quadricipite femorale", "bicipite|tricipite|polpaccio"],
    ["Come si chiama l'osso del braccio tra la spalla e il gomito?", "omero", "femore|radio|tibia"],
    ["Come si chiama il muscolo dietro il braccio, che lo distende?", "tricipite", "bicipite|deltoide|quadricipite"],
    ["Qual è il numero unico per le emergenze in Italia?", "112"],
    ["In che posizione si mette una persona svenuta che respira?", "posizione laterale di sicurezza|laterale di sicurezza|pls", "supina con le gambe giù|seduta|in piedi"]
  ] };
  altre("biologia", [
    ["Come si chiama il pigmento verde che serve alla fotosintesi?", "clorofilla", "emoglobina|melanina|carotene"],
    ["Quale parte della cellula contiene il DNA e controlla la cellula?", "nucleo|il nucleo", "ribosoma|vacuolo|membrana"],
    ["Come si chiamano gli esseri viventi che producono da soli il proprio cibo?", "autotrofi", "eterotrofi|decompositori|parassiti"],
    ["Come si chiamano gli esseri viventi che non producono da soli il proprio cibo?", "eterotrofi", "autotrofi|produttori|fotosintetici"],
    ["Come si chiama la struttura che avvolge e protegge ogni cellula?", "membrana cellulare|membrana plasmatica|membrana", "parete cellulare|nucleo|citoplasma"],
    ["In quale parte dell'intestino si assorbono la maggior parte dei nutrienti?", "intestino tenue|tenue", "intestino crasso|stomaco|esofago"]
  ]);
  altre("terra", [
    ["Come si chiama il passaggio dell'acqua da liquido a vapore?", "evaporazione", "condensazione|fusione|solidificazione"],
    ["Come si chiama il passaggio dell'acqua da vapore a liquido?", "condensazione", "evaporazione|sublimazione|fusione"],
    ["Come si chiama il passaggio da solido a liquido?", "fusione", "solidificazione|evaporazione|condensazione"]
  ]);

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


  const piuParole = (l, voci) => LINGUE[l].voci.push(...voci);
  piuParole("francese", [["bicicletta", "le vélo|vélo|la bicyclette|bicyclette"], ["macchina (auto)", "la voiture|voiture"], ["strada (di città)", "la rue|rue"], ["pioggia", "la pluie|pluie"],
    ["neve", "la neige|neige"], ["mare", "la mer|mer"], ["fiore", "la fleur|fleur"], ["albero", "l'arbre|arbre"], ["cielo", "le ciel|ciel"], ["notte", "la nuit|nuit"], ["giorno", "le jour|jour"],
    ["settimana", "la semaine|semaine"], ["mese", "le mois|mois"], ["caldo", "chaud"], ["freddo", "froid"], ["nero", "noir"], ["bianco", "blanc"], ["blu", "bleu"], ["parlare", "parler"],
    ["mangiare", "manger"], ["bere", "boire"], ["dormire", "dormir"], ["scrivere", "écrire"], ["leggere", "lire"], ["grande", "grand|grande"]]);
  piuParole("spagnolo", [["bicicletta", "la bicicleta|bicicleta"], ["macchina (auto)", "el coche|coche|el carro|carro"], ["strada (di città)", "la calle|calle"], ["pioggia", "la lluvia|lluvia"],
    ["neve", "la nieve|nieve"], ["mare", "el mar|mar"], ["fiore", "la flor|flor"], ["albero", "el árbol|árbol"], ["notte", "la noche|noche"], ["giorno", "el día|día"], ["settimana", "la semana|semana"],
    ["mese", "el mes|mes"], ["caldo", "caliente"], ["freddo", "frío"], ["nero", "negro"], ["bianco", "blanco"], ["parlare", "hablar"], ["mangiare", "comer"], ["bere", "beber"], ["dormire", "dormir"],
    ["scrivere", "escribir"], ["leggere", "leer"], ["insegnante", "el profesor|profesor|la profesora|profesora"], ["libro", "el libro|libro"]]);
  piuParole("tedesco", [["bicicletta", "das Fahrrad|fahrrad|das Rad"], ["macchina (auto)", "das Auto|auto|der Wagen"], ["strada", "die Straße|straße"], ["pioggia", "der Regen|regen"],
    ["neve", "der Schnee|schnee"], ["mare", "das Meer|meer|die See"], ["fiore", "die Blume|blume"], ["albero", "der Baum|baum"], ["cielo", "der Himmel|himmel"], ["notte", "die Nacht|nacht"],
    ["giorno", "der Tag|tag"], ["settimana", "die Woche|woche"], ["mese", "der Monat|monat"], ["anno", "das Jahr|jahr"], ["freddo", "kalt"], ["nero", "schwarz"], ["bianco", "weiß"], ["blu", "blau"],
    ["parlare", "sprechen"], ["mangiare", "essen"], ["bere", "trinken"], ["dormire", "schlafen"], ["scrivere", "schreiben"], ["leggere", "lesen"], ["insegnante", "der Lehrer|lehrer|die Lehrerin|lehrerin"]]);
  piuParole("cinese", [["sole", "太阳|tàiyáng"], ["luna", "月亮|yuèliang"], ["casa (famiglia)", "家|jiā"], ["rosso", "红色|hóngsè"], ["bianco", "白色|báisè"], ["nero", "黑色|hēisè"],
    ["anno", "年|nián"], ["uomo", "男人|nánrén"], ["donna", "女人|nǚrén"], ["bambino", "孩子|háizi"], ["medico", "医生|yīshēng"], ["ospedale", "医院|yīyuàn"], ["computer", "电脑|diànnǎo"],
    ["telefono", "电话|diànhuà"], ["cento", "百|bǎi"], ["fuoco", "火|huǒ"]]);

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
    pressione: () => { const S = rnd(2, 10), p = rnd(2, 50) * 10; return { d: `Una forza di ${p * S} N preme su una superficie di ${S} m². Quanti pascal è la pressione? (p = F : S)`, r: p }; },
    potenza: () => { const t = rnd(2, 20), P = rnd(2, 30) * 10; return { d: `Un motore fa un lavoro di ${P * t} J in ${t} secondi. Quanti watt è la sua potenza? (P = L : t)`, r: P }; },
    spazio: () => { const v = rnd(2, 30), t = rnd(2, 12); return { d: `Una bici va a velocità costante di ${v} m/s per ${t} secondi. Quanti metri percorre? (s = v × t)`, r: v * t }; },
    bin2dec: () => { const n = rnd(3, 63); return { d: `Quanto vale in decimale il numero binario ${n.toString(2)}?`, r: n }; },
    dec2bin: () => { const n = rnd(3, 63), b = n.toString(2); return { d: `Scrivi in binario il numero ${n}.`, testo: true, accettate: [b, b.padStart(8, "0")], mostra: b }; }
  };

  // che cosa può chiedere ogni materia
  const PIANO = {
    italiano: { gruppi: ["autori", "grammatica", "tempi", "complementi", "figure"] },
    storia: { gruppi: ["date", "personaggi"] },
    geografia: { gruppi: ["capitali", "regioni", "geofatti"] },
    diritto: { gruppi: ["costituzione", "poteri", "diritto2", "europa"] },
    economiapolitica: { gruppi: ["economiapol", "europa"] },
    relazioni: { gruppi: ["europa", "economiapol", "capitali"] },
    scienze: { gruppi: ["biologia", "terra", "scienziati"] },
    fisica: { gruppi: ["unita", "scienziati"], conti: ["velocita", "forza", "ohm", "densita", "lavoro", "cinetica", "pressione", "potenza", "spazio"] },
    chimica: { gruppi: ["simboli", "elementi", "formule", "atomo"] },
    informatica: { gruppi: ["informatica"], conti: ["bin2dec", "dec2bin"] },
    turismo: { gruppi: ["capitali", "regioni", "luoghi"], categorie: ["Percentuali", "Economia aziendale"] },
    arte: { gruppi: ["artisti", "luoghi", "stili"] },
    motorie: { gruppi: ["sport", "corpo", "regole"] },
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

  // ------------- ✍️ RISPOSTE SCRITTE MALE: Fly Aula capisce i refusi, ma non regala niente -------------
  //  giusta  = giusta anche se scritta con errori (refusi, parole in altro ordine, "di/delle" mancanti, plurale sbagliato)
  //  quasi   = c'è una parte giusta ma manca o è sbagliato un pezzo (niente punto, ma si dice cosa manca)
  //  sbagliata
  //  Mai elastici con: numeri, date, simboli corti (Na, H2O), lingue straniere ("come si dice": l'ortografia è il punto).
  const PICCOLE = new Set("di del dello della dei degli delle d da dal dalla dai dalle e ed il lo la i gli le l un uno una in nel nella nei nelle a al allo alla ai agli alle per con su sul sulla tra fra of the and a an de du des la le les el los las y der die das und von".split(" "));
  const parole = t => String(t ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’'`´]/g, " ").split(/[^a-z0-9一-鿿]+/).filter(Boolean);
  const piene = t => parole(t).filter(w => !PICCOLE.has(w));
  // distanza tra due parole (scambio di due lettere vicine = 1 errore solo)
  function distanza(a, b) {
    if (a === b) return 0;
    const n = a.length, m = b.length; if (Math.abs(n - m) > 3) return 9;
    let pp = null, p = Array.from({ length: m + 1 }, (_, j) => j);
    for (let i = 1; i <= n; i++) {
      const c = [i];
      for (let j = 1; j <= m; j++) {
        c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (pp && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) c[j] = Math.min(c[j], pp[j - 2] + 1);
      }
      pp = p; p = c;
    }
    return p[m];
  }
  // quanti errori si perdonano (per ogni parola): niente fino a 4 lettere, 1 fino a 9, 2 da 10 in su; mai dentro i numeri
  // (così "Austria" non diventa "Australia", "Iran" non diventa "Iraq")
  const tolleranza = w => /\d/.test(w) ? 0 : w.length <= 4 ? 0 : w.length <= 9 ? 1 : 2;
  const simili = (r, a) => r === a || (!/\d/.test(r + a) && distanza(r, a) <= tolleranza(a));
  // tutte le risposte che Fly Aula conosce (capitali, nazioni, personaggi…): servono a NON scambiare una risposta sbagliata per un refuso
  const banche = {};
  function bancaDi(nomi) {
    const chiave = nomi.join(","); if (banche[chiave]) return banche[chiave];
    const tutti = new Set();
    for (const n of nomi) for (const v of (GRUPPI[n] || { voci: [] }).voci) for (const k of [1, 2]) String(v[k] || "").split("|").forEach(w => { if (w && !numerica(w)) tutti.add(w); });
    return (banche[chiave] = [...tutti]);
  }
  const bancaDiTutto = () => bancaDi(Object.keys(GRUPPI));
  // le parole piccole che CAMBIANO il senso ("moto a luogo" ≠ "moto da luogo"): se la risposta ne ha una diversa, non è giusta
  const CONTANO = new Set("a da di in su per con tra fra".split(" "));
  // quanto la risposta somiglia a una voce: { tutte, prese, totale, extra, errori, ordine, piccole }
  function confronta(risposta, voce, domanda = "") {
    const A = piene(voce).length ? piene(voce) : parole(voce), R = piene(risposta).length ? piene(risposta) : parole(risposta);
    const usate = [], pos = []; let prese = 0, errori = 0;
    for (const a of A) {
      let k = R.findIndex((r, i) => !usate.includes(i) && r === a);
      if (k < 0) k = R.findIndex((r, i) => !usate.includes(i) && simili(r, a));
      if (k < 0) continue;
      usate.push(k); pos.push(k); prese++; if (R[k] !== a) errori += distanza(R[k], a);
    }
    // parole in più: va bene solo se sono nella domanda (es. "(ONU)") o sono parole piccole
    const qd = new Set(piene(domanda));
    const piccolaScrittaMale = r => r.length <= 6 && [...PICCOLE].some(p => p.length >= 3 && distanza(r, p) <= 1);   // "devla" = "della"
    const extra = R.filter((r, i) => !usate.includes(i) && !qd.has(r) && !piccolaScrittaMale(r)).length;
    const ordine = pos.every((x, i) => i === 0 || x > pos[i - 1]);
    const pv = new Set(parole(voce).filter(w => CONTANO.has(w))), piccole = parole(risposta).filter(w => CONTANO.has(w)).every(w => pv.has(w));
    let c = { tutte: prese === A.length, prese, totale: A.length, extra, errori, ordine, piccole };
    // tutta attaccata o spezzata diversamente ("nazioniunite", "new york" → "newyork"): si confronta tutto insieme
    if (!c.tutte && parole(risposta).length !== parole(voce).length) {
      const nr = norm(risposta), nv = norm(voce), d = distanza(nr, nv);
      if (!/\d/.test(nv) && nv.length >= 6 && d <= (nv.length <= 9 ? 1 : nv.length <= 20 ? 2 : 3)) c = { tutte: true, prese: A.length, totale: A.length, extra: 0, errori: d, ordine: true, piccole: true };
    }
    return c;
  }
  const severa = (q, a) => numerica(a) || /\d/.test(a) || norm(a).length <= 3;
  const diLingua = q => !!(q && (q.lingua || /come si dice|tradu[cz]|past simple|participio|in (inglese|francese|spagnolo|tedesco|cinese)\b/i.test(q.testo || "")));
  // la voce più vicina: prima quella con tutte le parole, poi meno parole in più, poi meno errori
  const meglioDi = (x, y) => !y || (x.tutte !== y.tutte ? x.tutte : x.tutte ? (x.extra !== y.extra ? x.extra < y.extra : x.errori < y.errori) : x.prese / x.totale > y.prese / y.totale);
  function valuta(risposta, q) {
    const acc = (q && q.accettate) || [], sbagliate = ((q && q.sbagliate) || []).filter(Boolean), forma = acc[0] || "", dom = (q && q.testo) || "";
    if (!norm(risposta)) return { voto: "sbagliata", forma };
    if (stessa(risposta, acc)) return { voto: "giusta", forma, esatta: true };
    // numeri, date, simboli: o è giusta o no
    if (acc.length && acc.every(a => severa(q, a))) return { voto: "sbagliata", forma };
    let meglio = null;
    for (const a of acc.filter(a => !severa(q, a))) { const c = confronta(risposta, a, dom); if (meglioDi(c, meglio)) meglio = c; }
    if (!meglio) return { voto: "sbagliata", forma };
    // è proprio un'ALTRA risposta che Fly Aula conosce ("Austria" invece di "Australia")? allora è sbagliata
    const nr = norm(risposta);
    if (bancaDiTutto().some(w => norm(w) === nr && !stessa(w, acc))) return { voto: "sbagliata", forma };
    // somiglia almeno quanto a una risposta sbagliata vicina (le opzioni sbagliate, le altre risposte dello stesso argomento)?
    // allora non si capisce cosa voleva scrivere: niente punto ("quasi", e si mostra quella giusta)
    const vicine = [...sbagliate, ...(q && q.gruppo ? bancaDi([q.gruppo]) : [])].filter(w => !stessa(w, acc));
    const ambigua = vicine.some(w => {
      if (Math.abs(norm(w).length - nr.length) > 4) return false;
      const c = confronta(risposta, w, dom);
      return c.tutte && c.piccole && c.extra <= meglio.extra && (!meglio.tutte ? c.errori <= 1 : c.errori <= meglio.errori);
    });
    if (ambigua) return meglio.prese ? { voto: "quasi", forma, perche: "così scritta si confonde con un'altra risposta" } : { voto: "sbagliata", forma };
    const lingua = diLingua(q);
    if (meglio.tutte && !meglio.extra && meglio.piccole) {
      if (!meglio.ordine) return { voto: "quasi", forma, perche: "le parole sono in un altro ordine" };
      return lingua && meglio.errori ? { voto: "quasi", forma, perche: "attenzione all'ortografia" } : { voto: "giusta", forma, refuso: meglio.errori > 0 };
    }
    if (meglio.tutte && !meglio.piccole) return { voto: "quasi", forma, perche: "attenzione alle parole piccole: cambiano il senso" };
    if (meglio.tutte) return { voto: "quasi", forma, perche: "c'è qualche parola in più" };
    if (meglio.totale >= 2 && meglio.prese / meglio.totale >= 0.5) return { voto: "quasi", forma, perche: "manca o è sbagliato un pezzo" };
    return { voto: "sbagliata", forma };
  }
  // 🧠 più intelligente: se le regole non bastano, un cervello RISCRIVE la risposta in italiano corretto
  // (traduce se è in un'altra lingua, corregge l'ortografia). Il cervello NON vede la domanda né la soluzione:
  // non può "aggiustare" una risposta sbagliata. Poi decidono sempre le regole qui sopra.
  async function valutaIntelligente(risposta, q, { ms = 6000 } = {}) {
    const v = valuta(risposta, q);
    if (v.voto === "giusta" || diLingua(q) || typeof cervello !== "function") return v;
    const acc = (q && q.accettate) || [];
    if (!acc.some(a => !severa(q, a)) || !/[a-z]{3}/i.test(String(risposta)) || String(risposta).length > 120) return v;
    try {
      const t = cervello(`Riscrivi in italiano corretto la risposta breve di uno studente. Se è in un'altra lingua (per esempio inglese) traducila in italiano.
Correggi SOLO ortografia e grammatica. NON aggiungere parole, NON completare, NON cambiare il significato, NON correggere i fatti: se è sbagliata deve restare sbagliata.
Rispondi SOLO con JSON: {"italiano": "la risposta riscritta"}`, String(risposta).slice(0, 120), { temperature: 0, format: "json" });
      const out = await Promise.race([t, new Promise((_, no) => setTimeout(() => no(new Error("tempo")), ms))]);
      let it = ""; try { it = String(JSON.parse(String(out).replace(/^[^{]*/, "").replace(/[^}]*$/, "")).italiano || ""); } catch (e) {}
      // il cervello non deve allungare la risposta (niente parole aggiunte)
      if (!it || piene(it).length > piene(risposta).length + 1) return v;
      const v2 = valuta(it, q);
      const peso = x => x.voto === "giusta" ? 2 : x.voto === "quasi" ? 1 : 0;
      if (peso(v2) > peso(v)) return { ...v2, tradotta: it, refuso: true, esatta: false };
    } catch (e) {}
    return v;
  }
  // la frase da mostrare alla classe
  function commento(v, risposta) {
    if (v.voto === "giusta" && v.tradotta && norm(v.tradotta) !== norm(risposta) && /[a-z]/i.test(risposta) && v.esatta === false && v.tradotta) return `In italiano corretto: «${v.forma}»`;
    if (v.voto === "giusta" && !v.esatta && v.refuso) return `Si scrive così: «${v.forma}»`;
    if (v.voto === "quasi") return `Quasi! La risposta è «${v.forma}» (${v.perche || "manca un pezzo"})`;
    return "";
  }
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
      return { testo: `Come si dice "${it}" in ${L.nome}?`, accettate: acc, mostra: mostraLingua(L, acc), lingua: true };
    }
    const fonti = [...gruppiDi(materia, livello).map(g => ["g", g]), ...(p.conti || []).filter(() => livello !== "elementari").map(c => ["c", c]),
      ...(p.categorie || []).filter(() => livello !== "elementari" && typeof CATEGORIE !== "undefined").map(c => ["k", c])];
    const [tipo, nome] = pesca(fonti);
    if (tipo === "c") { const e = CONTI[nome](); return e.testo ? { testo: e.d, accettate: e.accettate, mostra: e.mostra } : { testo: e.d, r: e.r, mostra: formattaN(e.r) }; }
    if (tipo === "k") { const e = CATEGORIE[nome](); return { testo: e.d, r: e.r, mostra: formattaN(e.r) }; }
    const [d, r, sb] = pesca(GRUPPI[nome].voci), acc = r.split("|"), sbagliate = String(sb || "").split("|").filter(Boolean);
    if (acc.every(numerica)) return { testo: d, r: Number(acc[0].replace(",", ".")), mostra: acc[0], accettate: acc };
    return { testo: d, accettate: acc, mostra: acc[0], sbagliate, gruppo: nome };
  }

  // sbagliate credibili: per i numeri, numeri vicini; per le parole, altre risposte dello stesso gruppo
  function sbagliateDi(voce, gruppo) {
    const [, r, sb] = voce, acc = r.split("|");
    if (sb) return sb.split("|");
    if (acc.every(numerica)) {
      const x = Number(acc[0].replace(",", ".")), dec = /[.,]/.test(acc[0]);
      const passi = dec ? [1, -1, 2, 0.5] : x >= 300 ? [1, -1, 2, -2, 3, 5, -5, 10, -10] : [1, -1, 2, -2, 3, 4];
      const cand = []; for (const s of passi.sort(() => Math.random() - .5)) { const v = Math.round((x + s) * 1000) / 1000; if (v > 0 && !(/\banno\b/i.test(voce[0]) && v > 2026) && v !== x) cand.push(dec ? formattaN(v) : String(v)); }
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

  return { GRUPPI, LINGUE, CONTI, PIANO, norm, stessa, valuta, valutaIntelligente, commento, sa, domanda, sceltaMultipla, gruppiDi };
})();
