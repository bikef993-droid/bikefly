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
  "Economia aziendale": () => scegli([
    () => { const x = rnd(5, 200) * 10; return { d: `Calcola l'IVA al 22% su un imponibile di ${x} €.`, r: Math.round(x * 22) / 100 }; },
    () => { const c = rnd(1, 20) * 1000, r = scegli([2, 3, 4, 5]), t = rnd(1, 4); return { d: `Calcola l'interesse semplice su un capitale di ${c} € al ${r}% annuo per ${t} anni.`, r: c * r * t / 100 }; },
    () => { const costo = rnd(10, 90), ric = costo + rnd(5, 60); return { d: `Un negozio compra un prodotto a ${costo} € e lo vende a ${ric} €. Qual è il guadagno (margine) in euro?`, r: ric - costo }; }
  ])()
};
function creaEsame(n) {
  const nomi = Object.keys(CATEGORIE), out = [];
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
