// ===================================================================
//  FLY AULA · 📚 i FATTI SICURI (come la calcolatrice, ma per date e nomi)
//  1) PRIMA: se la domanda parla di un fatto che conosciamo, il cervello riceve il fatto giusto
//  2) DOPO: se nella risposta c'è una data, una capitale, un simbolo, un autore o un numero
//     della Costituzione sbagliato, si corregge (solo quando la frase è chiara: nel dubbio non si tocca)
//  Fatti scritti a mano, da libro di scuola, e provati dai controlli automatici.
// ===================================================================
const Fatti = (() => {
  // ---------- le date ----------
  // chi = di cosa parla, cosa = che cosa è successo (tutti e due nella stessa frase), anno = quello giusto
  const P1 = /(prima guerra mondiale|grande guerra)/i, P2 = /seconda guerra mondiale/i;
  const DATE = [
    { chi: P1, cosa: /\b(inizi[\wà-ÿ]*|scoppi[\wà-ÿ]*|cominci[\wà-ÿ]*|ebbe inizio|si apr[\wà-ÿ]*)(?![\wà-ÿ])/i, anno: 1914, frase: "La Prima guerra mondiale iniziò nel 1914 e finì nel 1918." },
    { chi: P1, cosa: /\b(fin[iìe][\wà-ÿ]*|termin[\wà-ÿ]*|si concluse|conclusione|si chiuse)(?![\wà-ÿ])/i, anno: 1918, frase: "La Prima guerra mondiale finì nel 1918." },
    { chi: P1, cosa: /\bitalia\b[^.!?\n]{0,40}\b(entr[\wà-ÿ]*|intervenn[\wà-ÿ]*|dichiar[\wà-ÿ]*)\b|\b(entr[\wà-ÿ]*|ingresso)\b[^.!?\n]{0,30}\bitalia\b/i, anno: 1915, frase: "L'Italia entrò nella Prima guerra mondiale nel 1915." },
    { chi: P2, cosa: /\b(inizi[\wà-ÿ]*|scoppi[\wà-ÿ]*|cominci[\wà-ÿ]*|ebbe inizio)(?![\wà-ÿ])/i, anno: 1939, frase: "La Seconda guerra mondiale iniziò nel 1939 e finì nel 1945." },
    { chi: P2, cosa: /\b(fin[iìe][\wà-ÿ]*|termin[\wà-ÿ]*|si concluse|conclusione)(?![\wà-ÿ])/i, anno: 1945, frase: "La Seconda guerra mondiale finì nel 1945." },
    { chi: /(rivoluzione francese|presa della bastiglia)/i, cosa: /\b(inizi[\wà-ÿ]*|scoppi[\wà-ÿ]*|cominci[\wà-ÿ]*|ebbe inizio|presa|assalt[\wà-ÿ]*)(?![\wà-ÿ])/i, anno: 1789, frase: "La Rivoluzione francese iniziò nel 1789 con la presa della Bastiglia." },
    { chi: /(cristoforo colombo|colombo\b|scoperta dell.america)/i, cosa: /\b(arriv[\wà-ÿ]*|scopr[\wà-ÿ]*|scoperta|sbarc[\wà-ÿ]*|approd[\wà-ÿ]*|raggiun[\wà-ÿ]*)(?![\wà-ÿ])/i, anno: 1492, frase: "Cristoforo Colombo arrivò in America nel 1492." },
    { chi: /regno d.italia/i, cosa: /\bproclam[\wà-ÿ]*/i, anno: 1861, frase: "Il Regno d'Italia fu proclamato nel 1861." },
    { chi: /costituzione (italiana|della repubblica)/i, cosa: /\bin vigore\b/i, anno: 1948, frase: "La Costituzione italiana è entrata in vigore il 1° gennaio 1948." },
    { chi: /muro di berlino/i, cosa: /\b(cad[\wà-ÿ]*|abbatt[\wà-ÿ]*|croll[\wà-ÿ]*|caduta)(?![\wà-ÿ])/i, anno: 1989, frase: "Il muro di Berlino cadde nel 1989." },
    { chi: /impero romano d.occidente/i, cosa: /\b(cad[\wà-ÿ]*|caduta|fin[iìe][\wà-ÿ]*|croll[\wà-ÿ]*)(?![\wà-ÿ])/i, anno: 476, frase: "L'Impero romano d'Occidente cadde nel 476 d.C." },
    { chi: /referendum/i, cosa: /\b(repubblica|monarchia)(?![\wà-ÿ])/i, anno: 1946, frase: "Con il referendum del 2 giugno 1946 gli italiani scelsero la Repubblica." },
    { chi: /dichiarazione d.indipendenza/i, cosa: /\b(firm[\wà-ÿ]*|approv[\wà-ÿ]*|proclam[\wà-ÿ]*|scritt[\wà-ÿ]*)(?![\wà-ÿ])/i, anno: 1776, frase: "La Dichiarazione d'indipendenza degli Stati Uniti è del 1776." },
    { chi: /carlo magno/i, cosa: /\bincoron[\wà-ÿ]*/i, anno: 800, frase: "Carlo Magno fu incoronato imperatore nella notte di Natale dell'anno 800." },
    { chi: /(rivoluzione russa|rivoluzione d.ottobre)/i, cosa: /\b(scoppi[\wà-ÿ]*|avvenn[\wà-ÿ]*|ci fu|inizi[\wà-ÿ]*)(?![\wà-ÿ])/i, anno: 1917, frase: "La Rivoluzione russa d'ottobre è del 1917." },
    { chi: /trattati di roma/i, cosa: /\b(firm[\wà-ÿ]*)(?![\wà-ÿ])/i, anno: 1957, frase: "I Trattati di Roma, che fecero nascere la CEE, furono firmati nel 1957." },
    { chi: /(sulla luna|allunaggio|neil armstrong)/i, cosa: /\b(sbarc[\wà-ÿ]*|arriv[\wà-ÿ]*|allun[\wà-ÿ]*|cammin[\wà-ÿ]*|mise piede|mett[\wà-ÿ]* piede)(?![\wà-ÿ])/i, anno: 1969, frase: "Il primo uomo arrivò sulla Luna nel 1969." },
    { chi: /spedizione dei mille/i, cosa: /\b(part[\wà-ÿ]*|sbarc[\wà-ÿ]*|inizi[\wà-ÿ]*|avvenn[\wà-ÿ]*)(?![\wà-ÿ])/i, anno: 1860, frase: "La spedizione dei Mille partì nel 1860." },
    { chi: /waterloo/i, cosa: /\b(battaglia|sconfitt[\wà-ÿ]*|scontro|perse)(?![\wà-ÿ])/i, anno: 1815, frase: "La battaglia di Waterloo è del 1815." },
    { tema: /(wall street|crisi del 1929|grande depressione|crollo della borsa)/i, chi: /(wall street|borsa di new york)/i, cosa: /\b(croll[\wà-ÿ]*|crac[\wà-ÿ]*|crollo)(?![\wà-ÿ])/i, anno: 1929, frase: "Il crollo della Borsa di Wall Street è del 1929." },
    { chi: /marcia su roma/i, cosa: /./, anno: 1922, frase: "La Marcia su Roma è del 1922." },
    { tema: /(lutero|riforma protestante)/i, chi: /(95|novantacinque) tesi/i, cosa: /./, anno: 1517, frase: "Martin Lutero rese pubbliche le 95 tesi nel 1517." },
    { chi: /napoleone/i, cosa: /\b(si incoron[\wà-ÿ]*|incoronat[\wà-ÿ]*|divent[\wà-ÿ]* imperatore|proclam[\wà-ÿ]* imperatore)(?![\wà-ÿ])/i, anno: 1804, frase: "Napoleone diventò imperatore dei francesi nel 1804." }
  ];
  // frasi in cui la data potrebbe essere di ALTRO (una morte, una nascita, "dopo"…): lì non si tocca niente
  const ALTRO = /\b(mor[iìt][\wà-ÿ]*|morte|nacque|nato|nata|nascita|anni prima|fino al|fino a|durante|dal\s+\d{3,4}\s+al|tra il|fra il|secolo|secoli|circa|forse|anni dopo|dur[òo]|ricord[\wà-ÿ]*|anniversario|festa)(?![\wà-ÿ])/i;
  // "dopo" e "prima di" contano solo se il fatto viene DOPO di loro ("nel 1919, dopo la Prima guerra mondiale…"):
  // in "iniziò nel 1915, dopo l'attentato" la data è proprio quella del fatto, e si controlla
  const RELATIVO = /\b(dopo|prima di|prima che|prima della|prima del)\b/i;
  const ANNO = /(?<![\d.,\/:])\b(\d{3,4})\b(?!\s*(?:%|€|euro|km|m\b|kg|g\b|persone|soldati|morti|anni|abitanti|milioni|mila|[.,]\d))/g;

  // ---------- capitali, simboli, autori (da quiz.js, così sono UNA sola fonte) ----------
  const norm = t => typeof Quiz !== "undefined" ? Quiz.norm(t) : String(t).toLowerCase();
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/'/g, "['’]");
  function capitali() {
    const out = [];
    if (typeof Quiz === "undefined") return out;
    for (const [d, r] of Quiz.GRUPPI.capitali.voci) {
      const m = d.match(/^Qual è la capitale (dell'|della|delle|dei|degli|del|di) ?(.+)\?$/); if (!m) continue;
      out.push({ prep: m[1], paese: m[2], giuste: r.split("|"), mostra: r.split("|")[0] });
    }
    return out;
  }
  function simboli() {
    const out = [];
    if (typeof Quiz === "undefined") return out;
    for (const [d, r] of Quiz.GRUPPI.simboli.voci) { const m = d.match(/: (.+)\?$/); if (m) out.push({ el: m[1], sim: r }); }
    return out;
  }
  function autori() {
    const out = [];
    if (typeof Quiz === "undefined") return out;
    for (const [d, r] of Quiz.GRUPPI.autori.voci) {
      const m = d.match(/^Chi ha scritto (?:la poesia |il |la |l'|le |i |gli )?(.+)\?$/); if (!m) continue;
      out.push({ opera: m[1], giusti: r.split("|"), mostra: r.split("|")[0] });
    }
    return out;
  }
  let CAP = null, SIM = null, AUT = null, CITTA = null;
  const carica = () => {
    if (CAP) return;
    CAP = capitali(); SIM = simboli(); AUT = autori();
    // il nome di una città: prima quelli conosciuti (anche di più parole, "Città del Messico"), poi una o due parole con la maiuscola
    const note = [...new Set(CAP.map(c => c.mostra))].sort((a, b) => b.length - a.length).map(esc);
    CITTA = `(?:${note.join("|")}|(?:[Ll][a']\\s?)?[A-ZÀ-Ý][\\wÀ-ÿ']+(?:\\s+[A-Z][\\wÀ-ÿ']+)?)`;
  };

  // ---------- Costituzione e istituzioni (i cervelli spesso hanno in testa i numeri VECCHI) ----------
  const VECCHIO = /\b(prima|erano|era|fino al|fino a|riforma|vecchi\w*|ridott\w*|taglio|passat\w*|prima della|un tempo|in passato)\b/i;
  const ISTITUZIONI = [
    { re: /\b630\s+deputati\b/gi, giusto: "400 deputati", frase: "Dal 2022 i deputati sono 400." },
    { re: /\b315\s+senatori\b/gi, giusto: "200 senatori", frase: "Dal 2022 i senatori eletti sono 200." },
    { re: /(\b(?:votare|voto|elettori|eleggere)\b[^.!?\n]{0,50}\bsenato\b[^.!?\n]{0,40}\b)25(\s+anni)/gi, giusto: "$118$2", frase: "Dal 2021 per votare anche al Senato bastano 18 anni." },
    { re: /(\bsenato\b[^.!?\n]{0,40}\b(?:votare|voto|elettori)\b[^.!?\n]{0,40}\b)25(\s+anni)/gi, giusto: "$118$2", frase: "" },
    { re: /(\bpresidente della repubblica\b[^.!?\n]{0,60}\b(?:in carica|mandato|eletto per|dura)\b[^.!?\n]{0,15}\b)(?![7]\b)(\d{1,2})(\s+anni)/gi, giusto: "$17$3", frase: "Il Presidente della Repubblica resta in carica 7 anni." },
    { re: /(\blegislatura\b[^.!?\n]{0,30}\bdura\b[^.!?\n]{0,10}\b)(?![5]\b)(\d{1,2})(\s+anni)/gi, giusto: "$15$3", frase: "Una legislatura dura 5 anni." }
  ];

  // ---------- 1) PRIMA: i fatti sicuri che servono per QUESTA domanda ----------
  function perDomanda(domanda) {
    const d = String(domanda), out = new Set();
    for (const f of DATE) if (f.chi.test(d) || (f.tema && f.tema.test(d))) out.add(f.frase);
    if (/\b(deputat|senat|parlamento|camera)\w*/i.test(d)) { out.add("Dal 2022 i deputati sono 400 e i senatori eletti 200 (prima erano 630 e 315)."); out.add("Dal 2021 per votare anche al Senato bastano 18 anni; per essere eletti senatori servono 40 anni, deputati 25."); }
    if (/presidente della repubblica/i.test(d)) out.add("Il Presidente della Repubblica resta in carica 7 anni e deve avere almeno 50 anni.");
    carica();
    for (const c of CAP) if (new RegExp("(?<![\\wÀ-ÿ])" + esc(c.paese) + "(?![\\wÀ-ÿ])", "i").test(d) && /capital/i.test(d)) out.add(`La capitale ${c.prep}${c.prep.endsWith("'") ? "" : " "}${c.paese} è ${c.mostra}.`);
    for (const a of AUT) if (d.toLowerCase().includes(a.opera.toLowerCase())) out.add(`${a.opera[0].toUpperCase() + a.opera.slice(1)} è di ${a.mostra}.`);
    const l = [...out].filter(Boolean).slice(0, 6);
    return l.length ? `\nFATTI SICURI (controllati, usali così come sono e non cambiarli): ${l.join(" ")}` : "";
  }

  // ---------- 2) DOPO: correzione della risposta ----------
  function frasiDi(t) { return t.split(/(?<=[.!?;])\s+|\n/); }
  function correggi(testo, materia = "") {
    let n = 0; const dettagli = [];
    let righe = String(testo).split("\n");
    righe = righe.map(riga => {
      if (/^\s*\[DISEGNO:/i.test(riga)) return correggiLinea(riga);
      return riga.split(/(?<=[.!?;])(?=\s)/).map(correggiFrase).join("");
    });
    function correggiLinea(riga) {
      // la linea del tempo: "1915 Inizio della Prima guerra mondiale" → 1914
      return riga.replace(/(\[DISEGNO:\s*linea\s*)(.*)\]/i, (tutto, testa, corpo) => testa + corpo.split("|").map(p => {
        const m = p.match(/^(\s*)(\d{3,4})(\s+)(.*)$/); if (!m) return p;
        for (const f of DATE) if (f.chi.test(m[4]) && f.cosa.test(m[4]) && Number(m[2]) !== f.anno && !ALTRO.test(m[4])) { n++; dettagli.push(`${m[2]} → ${f.anno} (${f.frase})`); return m[1] + f.anno + m[3] + m[4]; }
        return p;
      }).join("|") + "]");
    }
    function correggiFrase(f) {
      if (!f.trim()) return f;
      // date
      const anni = [...f.matchAll(ANNO)].map(m => m[1]);
      if (anni.length === 1 && !ALTRO.test(f)) {
        const scritto = Number(anni[0]);
        // "è del 1775", "risale al 1775": vale per il fatto di cui parla la frase (se i fatti possibili sono due, non si tocca)
        const eDel = /(?<![\wà-ÿ])(?:è|e'|fu|risale)\s+(?:proprio\s+)?(?:del|al|nel)\s+\d{3,4}\b/i.test(f);
        const rel = f.search(RELATIVO);
        const giusti = DATE.filter(d => d.chi.test(f) && (d.cosa.test(f) || eDel) && !(rel >= 0 && f.search(d.chi) > rel));
        // se nella frase ci stanno due fatti diversi (es. inizio e fine) non si tocca
        if (giusti.length === 1 && scritto !== giusti[0].anno && Math.abs(scritto - giusti[0].anno) <= 60) {
          n++; dettagli.push(`${scritto} → ${giusti[0].anno} (${giusti[0].frase})`);
          f = f.replace(new RegExp(`\\b${scritto}\\b`), String(giusti[0].anno));
        }
      }
      carica();
      // capitali: "la capitale della Francia è Lione" / "Lione è la capitale della Francia"
      if (/capital/i.test(f)) for (const c of CAP) {
        const paese = esc(c.paese);
        f = f.replace(new RegExp(`(\\bcapitale ${esc(c.prep)}\\s?${paese}(?![\\wÀ-ÿ])(?:,)?\\s+(?:è|e'|resta|rimane)\\s+(?:la città di\\s+)?)(${CITTA})`, "g"), (tutto, a, citta) => {
          if (c.giuste.some(g => norm(g) === norm(citta)) || norm(citta).length < 3) return tutto;
          n++; dettagli.push(`capitale ${c.prep} ${c.paese}: ${citta} → ${c.mostra}`); return a + c.mostra;
        });
        f = f.replace(new RegExp(`((?:^|[\\s(])(?:\\*\\*)?)(${CITTA})((?:\\*\\*)?\\s+(?:è|e')\\s+la\\s+capitale\\s+${esc(c.prep)}\\s?${paese}(?![\\wÀ-ÿ]))`, "g"), (tutto, a, citta, b) => {
          if (c.giuste.some(g => norm(g) === norm(citta))) return tutto;
          if (/^(Qual|Quale|Che|Non|Oggi|Anche|Questa|Questo|La|Il|Lo)$/i.test(citta)) return tutto;
          n++; dettagli.push(`capitale ${c.prep} ${c.paese}: ${citta} → ${c.mostra}`); return a + c.mostra + b;
        });
      }
      // simboli chimici: "il simbolo del ferro è F" / "simbolo chimico dell'oro: Ag"
      if (/simbol/i.test(f)) for (const s of SIM) {
        f = f.replace(new RegExp(`(\\b[Ss]imbolo(?: chimico)? (?:del|dello|della|dell['’]|di)\\s?${esc(s.el)}\\b\\s*(?:è|e'|:)\\s*(?:\\*\\*)?)([A-Z][a-z]?)\\b(?![a-zà-ÿ])`, "g"), (tutto, a, sim) => {
          if (sim === s.sim) return tutto;
          n++; dettagli.push(`simbolo di ${s.el}: ${sim} → ${s.sim}`); return a + s.sim;
        });
      }
      // autori: "la Divina Commedia è stata scritta da Petrarca" / "Petrarca scrisse la Divina Commedia"
      if (/scritt|scriss|ha scritto/i.test(f)) for (const a of AUT) {
        const op = esc(a.opera).replace(/^(il|la|lo|i|gli|le|l\['’\]) /i, "");
        f = f.replace(new RegExp(`(${op}(?:\\*\\*)?\\s*(?:,\\s*)?(?:è stat[oa]|fu|venne)?\\s*scritt[oaie]\\s+da\\s+)([A-ZÀ-Ý][\\wÀ-ÿ']+(?:\\s+[A-ZÀ-Ý][\\wÀ-ÿ']+)?)`, "gi"), (tutto, x, nome, pos, tutta) => {
          // "Il Piccolo principe" non è "Il principe": se prima del titolo c'è un'altra parola con la maiuscola, non si tocca
          const prima = (tutta.slice(0, pos).match(/(\S+)\s*$/) || ["", ""])[1];
          if (/^[A-ZÀ-Ý]/.test(prima) && !/^(La|Il|Lo|I|Gli|Le|L['’]|Un|Una|Nella|Nel)$/.test(prima)) return tutto;
          if (a.giusti.some(g => norm(nome).includes(norm(g)) || norm(g).includes(norm(nome)))) return tutto;
          n++; dettagli.push(`${a.opera}: ${nome} → ${a.mostra}`); return x + a.mostra;
        });
        f = f.replace(new RegExp(`(^|[\\s(])([A-ZÀ-Ý][\\wÀ-ÿ']+(?:\\s+[A-ZÀ-Ý][\\wÀ-ÿ']+)?)(\\s+(?:scrisse|ha scritto)\\s+(?:la poesia\\s+|il\\s+|la\\s+|l'|le\\s+|i\\s+|gli\\s+)?(?:\\*\\*)?${op})`, "gi"), (tutto, x, nome, y) => {
          if (/^(Chi|Lui|Lei|Egli|Ella|Poi|Dante|Anche)$/i.test(nome) && !/^Dante$/i.test(nome)) return tutto;
          if (a.giusti.some(g => norm(nome).includes(norm(g)) || norm(g).includes(norm(nome)))) return tutto;
          n++; dettagli.push(`${a.opera}: ${nome} → ${a.mostra}`); return x + a.mostra + y;
        });
      }
      // istituzioni: i numeri nuovi (se la frase non parla del passato)
      if (!VECCHIO.test(f)) for (const r of ISTITUZIONI) {
        f = f.replace(r.re, (...m) => {
          const prima = m[0], dopo = prima.replace(new RegExp(r.re.source, "i"), r.giusto);
          if (dopo === prima) return prima;
          n++; dettagli.push(`${prima.trim().slice(-40)} → ${dopo.trim().slice(-40)}`); return dopo;
        });
      }
      return f;
    }
    return { testo: righe.join("\n"), corretti: n, dettagli };
  }
  return { DATE, perDomanda, correggi };
})();

// ===================================================================
//  ✍️ SCRITTURA GIUSTA PER OGNI MATERIA (sulla lavagna)
//  Chimica: H2O → H₂O · Fisica: m/s2 → m/s², cm3 → cm³ · Diritto: "art. 3" in evidenza
//  Lavora sul testo già pronto per la pagina (HTML): non tocca i numeri dei conti.
// ===================================================================
const Scrittura = (() => {
  const ELEMENTI = new Set(("H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe " +
    "Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr").split(" "));
  const PEDICI = "₀₁₂₃₄₅₆₇₈₉";
  const pedice = d => d.replace(/\d/g, c => PEDICI[+c]);
  // una formula vera: solo simboli di elementi, con almeno un numero attaccato (H2O, CO2, H2SO4, CH4)
  function formula(tok) {
    const parti = tok.match(/[A-Z][a-z]?\d*/g); if (!parti || parti.join("") !== tok) return false;
    return /[A-Za-z]\d/.test(tok) && parti.every(p => ELEMENTI.has(p.replace(/\d+$/, "")));
  }
  function chimica(e) {
    return e.replace(/(?<![\w.,\/])(\d*)((?:[A-Z][a-z]?\d*){1,10})(?![\w])/g, (tutto, coeff, f) => formula(f) ? coeff + f.replace(/([A-Za-z\)])(\d+)/g, (m, l, d) => l + pedice(d)) : tutto)
      .replace(/(\((?:[A-Z][a-z]?[₀-₉\d]*)+\))(\d+)/g, (m, g, d) => g + pedice(d));                // Ca(OH)2 → Ca(OH)₂
  }
  function fisica(e) {
    return e.replace(/(\d\s?(?:m|s)\s?\/\s?s)\s?\^?2\b/g, "$1²")                                        // m/s2 → m/s²
      .replace(/(\d\s?(?:k|c|d|m)?m)\^?([23])(?![\d\w])/g, (m, u, k) => u + (k === "2" ? "²" : "³"));  // 5 cm3 → 5 cm³
  }
  function diritto(e) {
    return e.replace(/(?<!<b>)\b((?:artt?\.|articol[oi])\s*\d+(?:\s*(?:,|e|-|–)\s*\d+)*(?:\s*(?:comma|c\.)\s*\d+)?(?:\s+(?:della Costituzione|del Codice civile|c\.c\.|Cost\.))?)/gi, "<b>$1</b>");
  }
  function abbellisci(htmlRiga, materia) {
    if (/^(chimica|scienze)$/.test(materia)) return chimica(htmlRiga);
    if (materia === "fisica") return fisica(chimica(htmlRiga));
    if (/^(diritto|economiapolitica|relazioni)$/.test(materia)) return diritto(htmlRiga);
    return htmlRiga;
  }
  return { abbellisci, formula };
})();
