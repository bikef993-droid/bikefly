// ===================================================================
//  FLY AULA · la lavagna disegnata
//  Il cervello scrive un comando ([DISEGNO: frazione 3/4]) e qui lo
//  disegniamo noi: sempre giusto, animato, e non pesa niente.
// ===================================================================
const COLORI = { menta: "#00D2A0", cielo: "#3B8BFF", sole: "#FFD23F", corallo: "#FF5A5F", viola: "#7C5CFF", latte: "#F3F6FB", nebbia: "#93A6C3" };
const nInt = s => Number(String(s).replace(/\./g, "").replace(",", "."));
const fmt = x => (Math.round(x * 1000) / 1000).toLocaleString("it-IT");
const box = (titolo, corpo) => `<div class="disegno"><div class="titolo-dis">🎨 ${titolo}</div>${corpo}</div>`;

// 🍕 frazione n/d: una o più pizze
function disFrazione(n, d) {
  if (!(d >= 1 && d <= 24 && n >= 0 && n <= d * 4)) return null;
  const pizze = Math.max(1, Math.ceil(n / d)), r = 90;
  let svg = "", k = 0;
  for (let p = 0; p < pizze; p++) {
    let fette = "";
    for (let i = 0; i < d; i++) {
      const a0 = -Math.PI / 2 + i * 2 * Math.PI / d, a1 = a0 + 2 * Math.PI / d;
      const piena = k < n; k++;
      const x0 = 100 + r * Math.cos(a0), y0 = 100 + r * Math.sin(a0), x1 = 100 + r * Math.cos(a1), y1 = 100 + r * Math.sin(a1);
      const path = d === 1 ? `M10,100 a90,90 0 1,0 180,0 a90,90 0 1,0 -180,0` : `M100,100 L${x0},${y0} A${r},${r} 0 ${d === 2 ? 0 : 0},1 ${x1},${y1} Z`;
      fette += `<path d="${path}" fill="${piena ? "#F4A340" : "rgba(255,255,255,.06)"}" stroke="#071226" stroke-width="3" class="fetta" style="animation-delay:${(p * d + i) * 0.12}s"/>`;
      if (piena) fette += `<circle cx="${100 + 55 * Math.cos((a0 + a1) / 2)}" cy="${100 + 55 * Math.sin((a0 + a1) / 2)}" r="7" fill="#D6402E" class="fetta" style="animation-delay:${(p * d + i) * 0.12 + 0.05}s"/>`;
    }
    svg += `<svg viewBox="0 0 200 200" width="190" height="190"><circle cx="100" cy="100" r="96" fill="none" stroke="#E8C27A" stroke-width="6"/>${fette}</svg>`;
  }
  return box(`${n}/${d} · ${n} fette su ${d}`, `<div class="riga-dis">${svg}</div><div class="cap-dis"><b>${n}</b> = fette prese · <b>${d}</b> = fette in tutta la pizza</div>`);
}

// ➗ divisione in colonna (metodo italiano), che si scrive passo passo
function disDivisione(a, b) {
  a = Math.round(a); b = Math.round(b);
  if (!(a >= 0 && b >= 1 && a < 1e9 && b < 1e6)) return null;
  const cifre = String(a).split(""), n = cifre.length;
  const celle = []; let t = 0;
  const cella = (r, c, txt, cls = "", dt = 0) => celle.push(`<span class="cd ${cls}" style="grid-row:${r};grid-column:${c};animation-delay:${dt}s">${txt}</span>`);
  cifre.forEach((x, i) => cella(1, i + 1, x, "", 0));
  cella(1, n + 1, "", "barra-v", 0);
  cella(1, n + 2, b, "div", 0.2);
  cella(2, n + 2, "", "barra-o", 0.3);
  let corrente = 0, iniziato = false, riga = 1, quoziente = "", passo = 0;
  for (let i = 0; i < n; i++) {
    corrente = corrente * 10 + Number(cifre[i]);
    if (!iniziato && corrente < b && i < n - 1) continue;
    iniziato = true;
    const q = Math.floor(corrente / b), resto = corrente - q * b;
    t = 0.6 + passo * 1.1;
    quoziente += q;
    cella(2, n + 2, quoziente, "quoz", t);
    // il resto scritto sotto, allineato all'ultima cifra usata; poi si "abbassa" la cifra dopo
    const rs = String(resto);
    for (let j = 0; j < rs.length; j++) cella(riga + 1, i + 2 - rs.length + j, rs[j], "resto", t + 0.4);
    if (i < n - 1) cella(riga + 1, i + 2, cifre[i + 1], "giu", t + 0.75);
    corrente = resto; riga++; passo++;
  }
  const qFinale = Math.floor(a / b), rFinale = a % b;
  return box(`${a.toLocaleString("it-IT")} : ${b} in colonna`,
    `<div class="divcol" style="grid-template-columns:repeat(${n},1.1em) .4em auto">${celle.join("")}</div>
     <div class="cap-dis" style="animation-delay:${t + 1}s">Risultato: <b>${qFinale.toLocaleString("it-IT")}</b>${rFinale ? ` con resto <b>${rFinale}</b>` : " · resto 0 ✓"}</div>`);
}

// ✚ operazioni in colonna (+, −, ×)
function disColonna(a, op, b) {
  if (!(a >= 0 && b >= 0 && a < 1e9 && b < 1e9)) return null;
  const ris = op === "+" ? a + b : op === "×" ? a * b : a - b;
  if (ris < 0) return null;
  const sa = String(a), sb = String(b), sr = String(ris), w = Math.max(sa.length, sb.length + 1, sr.length);
  const riga = (s, r, cls = "", lenta = false) => s.padStart(w, " ").split("").map((ch, i) =>
    `<span class="cd ${cls}" style="grid-row:${r};grid-column:${i + 1};animation-delay:${lenta ? 0.8 + (w - i) * 0.35 : 0}s">${ch === " " ? "" : ch}</span>`).join("");
  const celle = riga(sa, 1) + riga(op + sb.padStart(w - 1, " "), 2, "op") + `<span class="cd barra-col" style="grid-row:3;grid-column:1/${w + 1}"></span>` + riga(sr, 4, "quoz", true);
  return box(`${a.toLocaleString("it-IT")} ${op} ${b.toLocaleString("it-IT")} in colonna`, `<div class="divcol" style="grid-template-columns:repeat(${w},1.1em)">${celle}</div>
    <div class="cap-dis" style="animation-delay:${0.8 + w * 0.35 + 0.3}s">Risultato: <b>${ris.toLocaleString("it-IT")}</b>${op === "+" || op === "−" ? " · si parte sempre dalle unità, a destra" : ""}</div>`);
}

// 🍎 oggetti da contare e dividere in gruppi
const EMOJI = { mele: "🍎", mela: "🍎", caramelle: "🍬", caramella: "🍬", palloni: "⚽", pallone: "⚽", bici: "🚲", monete: "🪙", moneta: "🪙", stelle: "⭐", pere: "🍐", fragole: "🍓", biscotti: "🍪", libri: "📚", matite: "✏️" };
function disOggetti(n, cosa, gruppi) {
  if (!(n >= 1 && n <= 60)) return null;
  const e = EMOJI[cosa] || "🔵";
  gruppi = gruppi >= 1 && gruppi <= 12 ? gruppi : 1;
  const per = Math.floor(n / gruppi), avanzo = n - per * gruppi;
  let html = "", k = 0;
  for (let g = 0; g < gruppi; g++) {
    html += `<div class="gruppo">${Array.from({ length: per }, () => `<span class="ogg" style="animation-delay:${(k++) * 0.06}s">${e}</span>`).join("")}${gruppi > 1 ? `<div class="etg">${per}</div>` : ""}</div>`;
  }
  if (avanzo) html += `<div class="gruppo avanzo">${Array.from({ length: avanzo }, () => `<span class="ogg" style="animation-delay:${(k++) * 0.06}s">${e}</span>`).join("")}<div class="etg">resto ${avanzo}</div></div>`;
  return box(gruppi > 1 ? `${n} ${cosa} in ${gruppi} gruppi` : `${n} ${cosa}`, `<div class="riga-dis gruppi">${html}</div>
    ${gruppi > 1 ? `<div class="cap-dis">${n} : ${gruppi} = <b>${per}</b> per gruppo${avanzo ? `, ne avanzano <b>${avanzo}</b>` : ""}</div>` : ""}`);
}

// 📏 retta dei numeri
function disRetta(da, a, segna) {
  if (!(a > da && a - da <= 40)) return null;
  const W = 760, x = v => 40 + (v - da) / (a - da) * (W - 80);
  let tacche = "";
  for (let v = da; v <= a; v++) tacche += `<line x1="${x(v)}" y1="52" x2="${x(v)}" y2="${v % 5 === 0 ? 72 : 66}" stroke="#F3F6FB" stroke-width="3"/><text x="${x(v)}" y="98" fill="#93A6C3" font-size="${a - da > 20 ? 14 : 20}" text-anchor="middle" font-weight="700">${v}</text>`;
  const punto = segna >= da && segna <= a ? `<g class="salta"><circle cx="${x(segna)}" cy="60" r="13" fill="#FFD23F"/><text x="${x(segna)}" y="30" fill="#FFD23F" font-size="26" font-weight="900" text-anchor="middle">${fmt(segna)}</text></g>` : "";
  return box(`retta dei numeri`, `<svg viewBox="0 0 ${W} 110" width="100%"><line x1="20" y1="60" x2="${W - 20}" y2="60" stroke="#F3F6FB" stroke-width="4" marker-end="url(#fr)"/><defs><marker id="fr" markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10Z" fill="#F3F6FB"/></marker></defs>${tacche}${punto}</svg>`);
}

// 📐 figure geometriche con le misure e l'area calcolata dalla calcolatrice
function disFigura(tipo, p1, p2) {
  const quota = (x1, y1, x2, y2, txt, dx = 0, dy = 0) => `<text x="${(x1 + x2) / 2 + dx}" y="${(y1 + y2) / 2 + dy}" fill="#FFD23F" font-size="22" font-weight="900" text-anchor="middle">${txt}</text>`;
  let svg = "", cap = "";
  if (tipo === "rettangolo" || tipo === "quadrato") {
    const b = p1, h = tipo === "quadrato" ? p1 : p2;
    if (!(b > 0 && h > 0)) return null;
    const s = 220 / Math.max(b, h), w = b * s, hh = h * s;
    svg = `<rect x="${150 - w / 2}" y="${130 - hh / 2}" width="${w}" height="${hh}" fill="rgba(59,139,255,.25)" stroke="#3B8BFF" stroke-width="4" class="traccia"/>
      ${quota(150 - w / 2, 130 + hh / 2, 150 + w / 2, 130 + hh / 2, fmt(b), 0, 30)}${quota(150 + w / 2, 130 - hh / 2, 150 + w / 2, 130 + hh / 2, fmt(h), 28, 8)}`;
    cap = `Area = ${fmt(b)} × ${fmt(h)} = <b>${fmt(b * h)}</b> · Perimetro = (${fmt(b)} + ${fmt(h)}) × 2 = <b>${fmt((b + h) * 2)}</b>`;
  } else if (tipo === "triangolo") {
    const b = p1, h = p2;
    if (!(b > 0 && h > 0)) return null;
    const s = 220 / Math.max(b, h), w = b * s, hh = h * s, x0 = 150 - w / 2, y0 = 130 + hh / 2;
    svg = `<polygon points="${x0},${y0} ${x0 + w},${y0} ${x0 + w * 0.35},${y0 - hh}" fill="rgba(0,210,160,.22)" stroke="#00D2A0" stroke-width="4" class="traccia"/>
      <line x1="${x0 + w * 0.35}" y1="${y0 - hh}" x2="${x0 + w * 0.35}" y2="${y0}" stroke="#FFD23F" stroke-width="3" stroke-dasharray="8 6"/>
      ${quota(x0, y0, x0 + w, y0, fmt(b), 0, 30)}${quota(x0 + w * 0.35, y0 - hh, x0 + w * 0.35, y0, "h " + fmt(h), 38, 0)}`;
    cap = `Area = ${fmt(b)} × ${fmt(h)} : 2 = <b>${fmt(b * h / 2)}</b>`;
  } else if (tipo === "cerchio") {
    const r = p1;
    if (!(r > 0)) return null;
    svg = `<circle cx="150" cy="130" r="105" fill="rgba(124,92,255,.22)" stroke="#7C5CFF" stroke-width="4" class="traccia"/><line x1="150" y1="130" x2="255" y2="130" stroke="#FFD23F" stroke-width="3"/><circle cx="150" cy="130" r="5" fill="#FFD23F"/>${quota(150, 130, 255, 130, "r " + fmt(r), 0, -10)}`;
    cap = `Area = ${fmt(r)} × ${fmt(r)} × 3,14 = <b>${fmt(r * r * 3.14)}</b> · Circonferenza = ${fmt(r)} × 2 × 3,14 = <b>${fmt(r * 2 * 3.14)}</b>`;
  } else return null;
  return box(tipo, `<svg viewBox="0 0 300 270" width="320" height="288">${svg}</svg><div class="cap-dis">${cap}</div>`);
}

// 📊 percentuale su una barra di 100 quadretti
function disPercentuale(p) {
  if (!(p >= 0 && p <= 100)) return null;
  const q = Array.from({ length: 100 }, (_, i) => `<span class="${i < Math.round(p) ? "pieno" : ""}" style="animation-delay:${i * 0.012}s"></span>`).join("");
  return box(`${fmt(p)}% = ${fmt(p)} su 100`, `<div class="cento">${q}</div><div class="cap-dis"><b>${fmt(p)}</b> quadretti colorati su <b>100</b></div>`);
}

// 🧠 mappa concettuale (per DSA e per il ripasso): centro + rami
function disMappa(spec) {
  const e = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])).replace(/\*\*/g, "");
  const parti = spec.replace(/^\s*mappa\s*/i, "").split("|").map(x => x.trim()).filter(Boolean);
  if (parti.length < 2) return null;
  const tinte = ["#00D2A0", "#3B8BFF", "#FFD23F", "#FF5A5F", "#7C5CFF", "#F4A340"];
  const rami = parti.slice(1, 7).map((p, i) => {
    const k = p.indexOf(":"), t = k > 0 ? p.slice(0, k) : p, d = k > 0 ? p.slice(k + 1) : "";
    return `<div class="m-ramo" style="--c:${tinte[i % tinte.length]};animation-delay:${0.25 + i * 0.15}s"><b>${e(t.trim())}</b>${d.trim() ? `<span>${e(d.trim())}</span>` : ""}</div>`;
  }).join("");
  return box("Mappa concettuale", `<div class="mappa"><div class="m-centro">${e(parti[0])}</div><div class="m-rami">${rami}</div></div>`);
}

// lettura del comando scritto dal cervello
function disegna(spec) {
  if (/^\s*mappa\b/i.test(spec)) { try { return disMappa(spec); } catch (e) { return null; } }
  const s = spec.toLowerCase().replace(/\s+/g, " ").trim();
  let m;
  try {
    if ((m = s.match(/^frazione (\d+)\s*\/\s*(\d+)/))) return disFrazione(+m[1], +m[2]);
    if ((m = s.match(/^divisione ([\d.]+) ([\d.]+)/))) return disDivisione(nInt(m[1]), nInt(m[2]));
    if ((m = s.match(/^colonna ([\d.]+) ?([+\-−x×*]) ?([\d.]+)/))) return disColonna(nInt(m[1]), { "+": "+", "-": "−", "−": "−", "x": "×", "×": "×", "*": "×" }[m[2]], nInt(m[3]));
    if ((m = s.match(/^oggetti (\d+) ?(\p{L}+)?(?: gruppi (\d+))?/u))) return disOggetti(+m[1], m[2] || "palline", m[3] ? +m[3] : 1);
    if ((m = s.match(/^retta (-?\d+) (-?\d+)(?: segna (-?[\d,.]+))?/))) return disRetta(+m[1], +m[2], m[3] != null ? Number(m[3].replace(",", ".")) : NaN);
    if ((m = s.match(/^(rettangolo|triangolo) ([\d,.]+) ([\d,.]+)/))) return disFigura(m[1], Number(m[2].replace(",", ".")), Number(m[3].replace(",", ".")));
    if ((m = s.match(/^(quadrato|cerchio) ([\d,.]+)/))) return disFigura(m[1], Number(m[2].replace(",", ".")));
    if ((m = s.match(/^percentuale ([\d,.]+)/))) return disPercentuale(Number(m[1].replace(",", ".")));
  } catch (e) {}
  return null;
}
