// ===================================================================
//  FLY AULA · l'esame delle 200 domande
//  Domande create a caso ma con la risposta giusta calcolata da noi:
//  Fly Aula risponde e contiamo quante ne azzecca (prima e dopo i controlli).
// ===================================================================
function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function scegli(arr) { return arr[rnd(0, arr.length - 1)]; }
const CATEGORIE = {
  "Addizioni e sottrazioni": () => { const a = rnd(100, 9999), b = rnd(10, 999); return Math.random() < .5 ? { d: `Quanto fa ${a} + ${b}?`, r: a + b } : { d: `Quanto fa ${a + b} − ${b}?`, r: a }; },
  "Moltiplicazioni": () => { const a = rnd(12, 999), b = rnd(2, 99); return { d: `Quanto fa ${a} × ${b}?`, r: a * b }; },
  "Divisioni": () => { const b = rnd(2, 25), q = rnd(3, 400); return { d: `Quanto fa ${b * q} : ${b}?`, r: q }; },
  "Frazioni": () => { const d = scegli([2, 3, 4, 5, 6, 8, 10]), n = rnd(1, d - 1), x = d * rnd(2, 30); return { d: `Quanto sono i ${n}/${d} di ${x}?`, r: x / d * n }; },
  "Percentuali": () => { const p = scegli([5, 10, 15, 20, 25, 30, 40, 50, 75]), x = rnd(2, 80) * 20; return { d: `Quanto è il ${p}% di ${x}?`, r: x * p / 100 }; },
  "Aree": () => { const t = scegli(["rettangolo", "triangolo", "quadrato"]), b = rnd(2, 30), h = rnd(2, 30);
    return t === "rettangolo" ? { d: `Qual è l'area di un rettangolo con base ${b} cm e altezza ${h} cm? (in cm²)`, r: b * h }
      : t === "quadrato" ? { d: `Qual è l'area di un quadrato di lato ${b} cm? (in cm²)`, r: b * b }
      : { d: `Qual è l'area di un triangolo con base ${b * 2} cm e altezza ${h} cm? (in cm²)`, r: b * h }; },
  "Equazioni": () => { const x = rnd(-10, 20), a = rnd(2, 9), b = rnd(1, 40); return { d: `Risolvi ${a}x + ${b} = ${a * x + b}. Quanto vale x?`, r: x }; },
  "Problemi": () => scegli([
    () => { const n = rnd(3, 9), p = rnd(2, 15); return { d: `Una bici a noleggio costa ${p} € all'ora. Quanto si paga per ${n} ore?`, r: n * p }; },
    () => { const s = rnd(3, 12), t = s * rnd(2, 9); return { d: `${t} caramelle vengono divise in parti uguali tra ${s} bambini. Quante ne riceve ciascuno?`, r: t / s }; },
    () => { const c = rnd(5, 60) * 10, sc = scegli([10, 20, 25, 50]); return { d: `Un giubbotto costa ${c} €. Con uno sconto del ${sc}%, quanto si paga?`, r: c - c * sc / 100 }; },
    () => { const a = rnd(10, 40), b = rnd(10, 40), c = rnd(10, 40); return { d: `Le temperature di tre giorni sono ${a}, ${b} e ${c} gradi. Qual è la media?`, r: Math.round((a + b + c) / 3 * 100) / 100 }; }
  ])(),
  // ---- biennio delle superiori (1ª e 2ª) ----
  "Polinomi": () => { const a = rnd(1, 5), b = rnd(-9, 9), c = rnd(-9, 9), x = scegli([-3, -2, -1, 2, 3, 4, 5]);
    return { d: `Calcola il valore del polinomio P(x) = ${polinomio(a, b, c)} per x = ${x < 0 ? "(" + segno(x) + ")" : x}.`, r: a * x * x + b * x + c }; },
  "Prodotti notevoli": () => scegli([
    () => { const a = rnd(2, 12), b = rnd(1, 9); return { d: `Con il quadrato di un binomio: quanto vale a² + 2ab + b² con a = ${a} e b = ${b}?`, r: (a + b) * (a + b) }; },
    () => { const a = scegli([20, 30, 40, 50, 60]), b = rnd(1, 9); return { d: `Calcola ${a + b} × ${a - b} usando la somma per differenza (a + b)(a − b) = a² − b², con a = ${a} e b = ${b}.`, r: a * a - b * b }; }
  ])(),
  "Sistemi": () => { let a1, b1, a2, b2; const x = rnd(-5, 9), y = rnd(-5, 9);
    do { a1 = rnd(1, 6); b1 = scegli([-1, 1]) * rnd(1, 5); a2 = rnd(1, 6); b2 = scegli([-1, 1]) * rnd(1, 5); } while (a1 * b2 - a2 * b1 === 0);
    const chi = Math.random() < .5 ? "x" : "y";
    return { d: `Risolvi il sistema { ${lineare(a1, b1)} = ${segno(a1 * x + b1 * y)} ; ${lineare(a2, b2)} = ${segno(a2 * x + b2 * y)} }. Quanto vale ${chi}?`, r: chi === "x" ? x : y }; },
  "Disequazioni": () => { const a = scegli([-1, 1]) * rnd(2, 9), b = rnd(-15, 15), x0 = rnd(-6, 10), c = a * x0 + b;
    return { d: `Risolvi la disequazione ${a < 0 ? "−" : ""}${Math.abs(a)}x ${b < 0 ? "−" : "+"} ${Math.abs(b)} > ${segno(c)}. La soluzione è del tipo x > numero oppure x < numero: scrivi il numero.`, r: x0 }; },
  "Radicali": () => scegli([
    () => { const k = rnd(2, 20); return { d: `Quanto fa √${k * k}?`, r: k }; },
    () => { const m = rnd(2, 9), n = scegli([2, 3, 5, 6, 7]); return { d: `Semplifica √${m * m * n} = a√${n}. Quanto vale a?`, r: m }; }
  ])(),
  "Retta": () => scegli([
    () => { const m = scegli([-4, -3, -2, -1, 1, 2, 3, 4]), q = rnd(-6, 6), x1 = rnd(-5, 3), x2 = x1 + rnd(1, 4);
      return { d: `Qual è il coefficiente angolare (pendenza) della retta che passa per A(${segno(x1)}; ${segno(m * x1 + q)}) e B(${segno(x2)}; ${segno(m * x2 + q)})?`, r: m }; },
    () => { const m = scegli([-3, -2, 2, 3, 4]), q = rnd(-8, 8), x = rnd(-4, 6); return { d: `Nella retta y = ${segno(m)}x ${q < 0 ? "−" : "+"} ${Math.abs(q)}, quanto vale y per x = ${x < 0 ? "(" + segno(x) + ")" : x}?`, r: m * x + q }; }
  ])(),
  "Economia aziendale": () => scegli([
    () => { const x = rnd(5, 200) * 10; return { d: `Calcola l'IVA al 22% su un imponibile di ${x} €.`, r: Math.round(x * 22) / 100 }; },
    () => { const c = rnd(1, 20) * 1000, r = scegli([2, 3, 4, 5]), t = rnd(1, 4); return { d: `Calcola l'interesse semplice su un capitale di ${c} € al ${r}% annuo per ${t} anni.`, r: c * r * t / 100 }; },
    () => { const costo = rnd(10, 90), ric = costo + rnd(5, 60); return { d: `Un negozio compra un prodotto a ${costo} € e lo vende a ${ric} €. Qual è il guadagno (margine) in euro?`, r: ric - costo }; },
    () => { const p1 = rnd(1, 5), p2 = rnd(1, 5), t = (p1 + p2) * rnd(2, 30) * 10; return { d: `Ripartisci ${t} € tra due soci in proporzione a ${p1} e ${p2}. Quanto spetta al secondo socio?`, r: t * p2 / (p1 + p2) }; },
    () => { const c = rnd(1, 20) * 600, r = scegli([3, 4, 5, 6]), g = scegli([30, 60, 90, 120]); return { d: `Calcola lo sconto commerciale su una cambiale di ${c} € al ${r}% per ${g} giorni (anno commerciale di 360 giorni).`, r: Math.round(c * r * g / 360) / 100 }; },
    () => { const c = rnd(1, 20) * 1000, r = scegli([2, 3, 4, 5]), t = rnd(1, 4); return { d: `Calcola il montante di un capitale di ${c} € al ${r}% annuo di interesse semplice per ${t} anni.`, r: c + c * r * t / 100 }; },
    () => { const m = rnd(10, 90) * 10, s = scegli([5, 10, 20]); return { d: `Fattura: merce per ${m} €, sconto incondizionato del ${s}%, IVA al 22%. Qual è il totale della fattura?`, r: Math.round(m * (100 - s) * 122 / 100) / 100 }; }
  ])()
};
function segno(v) { return v < 0 ? "−" + Math.abs(v) : String(v); }
function lineare(a, b) { return `${a === 1 ? "" : a}x ${b < 0 ? "−" : "+"} ${Math.abs(b) === 1 ? "" : Math.abs(b)}y`; }
function polinomio(a, b, c) {
  let t = `${a === 1 ? "" : a}x²`;
  if (b) t += ` ${b < 0 ? "−" : "+"} ${Math.abs(b) === 1 ? "" : Math.abs(b)}x`;
  if (c) t += ` ${c < 0 ? "−" : "+"} ${Math.abs(c)}`;
  return t;
}
const CATEGORIE_BIENNIO = { 1: ["Polinomi", "Prodotti notevoli", "Equazioni", "Percentuali"], 2: ["Disequazioni", "Sistemi", "Radicali", "Retta"] };
const SOLO_SUPERIORI = ["Polinomi", "Prodotti notevoli", "Sistemi", "Disequazioni", "Radicali", "Retta"];
// quali domande calcolate usare: per materia, livello, anno della classe e argomento
function categoriePer(materia, livello, classe = "", argomento = "") {
  if (materia === "economia") return ["Economia aziendale"];
  const a = String(argomento).toLowerCase(), scelte = [];
  const regole = [[/divisi/, "Divisioni"], [/moltiplic|tabellin/, "Moltiplicazioni"], [/addizi|sottrazi|somm/, "Addizioni e sottrazioni"], [/frazion/, "Frazioni"],
    [/percentu|scont/, "Percentuali"], [/area|aree|geometr|perimetr|poligon/, "Aree"], [/disequaz/, "Disequazioni"], [/(^|[^s])equazion/, "Equazioni"], [/problem/, "Problemi"],
    [/polinom|monom|calcolo letterale/, "Polinomi"], [/prodott\w* notevol|binomio/, "Prodotti notevoli"], [/sistem/, "Sistemi"], [/radical|radic/, "Radicali"],
    [/retta|pendenz|coefficiente angolare|piano cartesiano/, "Retta"]];
  for (const [re, c] of regole) if (re.test(a) && !(livello !== "superiori" && SOLO_SUPERIORI.includes(c))) scelte.push(c);
  if (scelte.length) return scelte;
  if (livello === "elementari") return ["Addizioni e sottrazioni", "Moltiplicazioni", "Divisioni", "Problemi"];
  if (livello === "medie") return ["Frazioni", "Percentuali", "Aree", "Problemi", "Divisioni", "Equazioni"];
  const anno = typeof annoDellaClasse === "function" ? annoDellaClasse(classe) : null;
  return CATEGORIE_BIENNIO[anno] || ["Equazioni", "Percentuali", "Problemi", "Sistemi", "Disequazioni", "Retta"];
}
function creaEsame(n, livello = "superiori") {
  const nomi = Object.keys(CATEGORIE).filter(c => livello === "superiori" || !SOLO_SUPERIORI.includes(c)), out = [];
  for (let i = 0; i < n; i++) { const c = nomi[i % nomi.length]; out.push({ categoria: c, ...CATEGORIE[c]() }); }
  return out;
}
// l'ultimo numero dopo "RISULTATO:" (o, se manca, l'ultimo numero della risposta)
function leggiRisultato(testo) {
  const t = testo.replace(/<think>[\s\S]*?<\/think>/g, "");
  const m = t.match(/RISULTATO\s*[:=]\s*(-?\d+(?:[.,]\d+)*)/i);
  if (m) return leggiNumero(m[1]);
  const tutti = t.match(/-?\d+(?:[.,]\d+)*/g);
  return tutti ? leggiNumero(tutti[tutti.length - 1]) : NaN;
}
const giusto = (x, r) => isFinite(x) && Math.abs(x - r) <= Math.max(0.011, Math.abs(r) * 1e-6);
