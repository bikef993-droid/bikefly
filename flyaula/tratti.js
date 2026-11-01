// ===================================================================
//  FLY AULA · ✍️ lettore dei TRATTI della lavagna (numeri e segni dei conti)
//  Non guarda una foto: sa come si è mossa la penna. Gira nel browser,
//  senza scheda video e senza internet, in pochi millisecondi.
//  1) divide i tratti in RIGHE e poi in SEGNI  2) i segni facili (punti, -, =, :)
//  li riconosce dalla forma  3) cifre, +, ×, ( ) con il metodo "$P" (nuvola di punti)
//  confrontandoli con modelli scritti a mano + quelli imparati dalle correzioni.
// ===================================================================
const Tratti = (() => {
  const N = 32;
  // ---------- i modelli base (scatola 0..1, y verso il basso) ----------
  const BASE = {
    "0": [[[.5, 0], [.15, .15], [.05, .5], [.15, .85], [.5, 1], [.85, .85], [.95, .5], [.85, .15], [.5, 0]]],
    "0b": [[[.55, .02], [.2, .1], [.08, .45], [.2, .9], [.55, 1], [.88, .8], [.9, .35], [.7, .05], [.45, .05]]],
    "1": [[[.5, 0], [.5, 1]]],
    "1b": [[[.25, .25], [.55, 0], [.55, 1]]],
    "1c": [[[.25, .25], [.55, 0], [.55, 1]], [[.25, 1], [.85, 1]]],
    "2": [[[.1, .25], [.3, .03], [.65, .02], [.88, .2], [.85, .42], [.5, .72], [.08, 1], [.95, 1]]],
    "2b": [[[.12, .2], [.45, 0], [.82, .12], [.8, .4], [.15, .95], [.35, .85], [.6, .95], [.92, .98]]],
    "3": [[[.1, .12], [.42, 0], [.8, .1], [.82, .3], [.45, .48], [.85, .62], [.88, .85], [.5, 1], [.1, .9]]],
    "3b": [[[.1, 0], [.85, 0], [.4, .42], [.8, .55], [.9, .8], [.55, 1], [.1, .9]]],
    "4": [[[.65, 0], [.05, .65], [.95, .65]], [[.7, .3], [.7, 1]]],
    "4b": [[[.2, 0], [.1, .58], [.9, .58]], [[.7, .1], [.7, 1]]],
    "4c": [[[.2, 0], [.1, .58], [.9, .58]], [[.7, 0], [.7, 1]]],
    "5": [[[.85, 0], [.2, 0], [.15, .42], [.5, .35], [.85, .5], [.88, .8], [.55, 1], [.1, .9]]],
    "5b": [[[.2, 0], [.15, .42], [.5, .35], [.85, .5], [.88, .8], [.55, 1], [.1, .9]], [[.2, 0], [.85, 0]]],
    "6": [[[.75, 0], [.35, .25], [.12, .65], [.25, .95], [.6, 1], [.85, .8], [.75, .55], [.4, .5], [.15, .7]]],
    "6b": [[[.7, 0], [.3, .35], [.15, .75], [.4, 1], [.75, .9], [.8, .65], [.5, .52], [.2, .7]]],
    "7": [[[.05, 0], [.95, 0], [.45, 1]]],
    "7b": [[[.05, .05], [.95, 0], [.45, 1]], [[.25, .5], [.8, .5]]],
    "7c": [[[.05, .15], [.05, 0], [.95, 0], [.7, .4], [.5, 1]]],
    "8": [[[.55, .48], [.15, .25], [.5, 0], [.85, .22], [.5, .48], [.12, .75], [.5, 1], [.88, .75], [.5, .48]]],
    "8b": [[[.85, .15], [.5, 0], [.15, .2], [.5, .48], [.88, .75], [.5, 1], [.12, .78], [.5, .48], [.82, .2]]],
    "9": [[[.85, .3], [.5, .5], [.15, .3], [.5, 0], [.85, .2], [.85, .6], [.8, 1]]],
    "9b": [[[.85, .25], [.5, .5], [.12, .28], [.45, 0], [.85, .15], [.85, .25], [.55, 1]]],
    "9c": [[[.8, .25], [.45, .48], [.12, .25], [.45, 0], [.8, .2]], [[.85, .05], [.85, 1]]],
    "+": [[[0, .5], [1, .5]], [[.5, 0], [.5, 1]]],
    "+b": [[[.5, 0], [.5, 1]], [[0, .5], [1, .5]]],
    "×": [[[0, 0], [1, 1]], [[1, 0], [0, 1]]],
    "×b": [[[.1, .1], [.9, .9]], [[.9, .05], [.1, .95]]],
    "(": [[[.8, 0], [.3, .25], [.2, .5], [.3, .75], [.8, 1]]],
    ")": [[[.2, 0], [.7, .25], [.8, .5], [.7, .75], [.2, 1]]]
  };
  // curve morbide (Catmull-Rom) per i modelli: assomigliano di più alla penna vera
  function liscia(p) {
    if (p.length < 3) return p;
    const out = [];
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[Math.max(0, i - 1)], b = p[i], c = p[i + 1], d = p[Math.min(p.length - 1, i + 2)];
      for (let t = 0; t < 1; t += 0.2) {
        const t2 = t * t, t3 = t2 * t;
        out.push([.5 * (2 * b[0] + (-a[0] + c[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * t2 + (-a[0] + 3 * b[0] - 3 * c[0] + d[0]) * t3),
                  .5 * (2 * b[1] + (-a[1] + c[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 + (-a[1] + 3 * b[1] - 3 * c[1] + d[1]) * t3)]);
      }
    }
    out.push(p[p.length - 1]);
    return out;
  }
  // ---------- $P: nuvola di punti ----------
  function nuvola(tratti) {
    let pts = [];
    tratti.forEach((t, id) => t.forEach(p => pts.push({ x: p[0], y: p[1], id })));
    if (!pts.length) return [];
    // un tratto di un solo punto (un puntino): lo si allarga un poco
    if (pts.length === 1) pts.push({ x: pts[0].x + 1e-3, y: pts[0].y + 1e-3, id: 0 });
    pts = ricampiona(pts, N);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of pts) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); }
    const s = Math.max(maxX - minX, maxY - minY) || 1;
    pts = pts.map(p => ({ x: (p.x - minX) / s, y: (p.y - minY) / s, id: p.id }));
    const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length, cy = pts.reduce((a, p) => a + p.y, 0) / pts.length;
    return pts.map(p => ({ x: p.x - cx, y: p.y - cy, id: p.id }));
  }
  function lungo(pts) { let d = 0; for (let i = 1; i < pts.length; i++) if (pts[i].id === pts[i - 1].id) d += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); return d; }
  function ricampiona(pts, n) {
    const I = lungo(pts) / (n - 1); if (!(I > 0)) return Array.from({ length: n }, () => ({ ...pts[0] }));
    let D = 0; const out = [pts[0]]; pts = pts.slice();
    for (let i = 1; i < pts.length; i++) {
      if (pts[i].id !== pts[i - 1].id) continue;
      const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      if (D + d >= I && d > 0) {
        const q = { x: pts[i - 1].x + ((I - D) / d) * (pts[i].x - pts[i - 1].x), y: pts[i - 1].y + ((I - D) / d) * (pts[i].y - pts[i - 1].y), id: pts[i].id };
        out.push(q); pts.splice(i, 0, q); D = 0;
      } else D += d;
    }
    while (out.length < n) out.push({ ...pts[pts.length - 1] });
    return out.slice(0, n);
  }
  function distNuvole(a, b, inizio, tetto) {
    const usato = new Array(a.length).fill(false); let somma = 0, i = inizio;
    do {
      if (somma >= tetto) return somma;          // già peggio del migliore trovato: inutile continuare (velocità)
      let min = Infinity, idx = -1;
      for (let j = 0; j < b.length; j++) if (!usato[j]) { const d = (a[i].x - b[j].x) ** 2 + (a[i].y - b[j].y) ** 2; if (d < min) { min = d; idx = j; } }
      usato[idx] = true;
      const peso = 1 - ((i - inizio + a.length) % a.length) / a.length;
      somma += peso * Math.sqrt(min);
      i = (i + 1) % a.length;
    } while (i !== inizio);
    return somma;
  }
  function distanza(a, b, tetto = Infinity) {
    const passo = Math.floor(Math.pow(a.length, 0.5)); let min = tetto;
    for (let i = 0; i < a.length; i += passo) { min = Math.min(min, distNuvole(a, b, i, min)); min = Math.min(min, distNuvole(b, a, i, min)); }
    return min;
  }
  // ---------- modelli: base + varianti (corsivo, stretto/largo, ruotato) + imparati ----------
  let MODELLI = [];
  function varianti(tratti) {
    const out = [];
    for (const [incl, sx, rot] of [[0, 1, 0], [.25, 1, 0], [-.15, .9, 0], [0, .7, 0], [.1, 1.35, 0]]) {
      const c = Math.cos(rot), s = Math.sin(rot);
      out.push(tratti.map(t => t.map(([x, y]) => { let X = (x - .5) * sx + incl * (.5 - y), Y = y - .5; return [X * c - Y * s, X * s + Y * c]; })));
    }
    return out;
  }
  const IMPARATI_K = "flyaula_tratti_imparati";
  function imparati() { try { return JSON.parse(localStorage.getItem(IMPARATI_K) || "[]"); } catch (e) { return []; } }
  function costruisci() {
    MODELLI = [];
    for (const [nome, tratti] of Object.entries(BASE)) {
      const segno = nome[0], stretto = /[0-9()]/.test(segno) ? .62 : 1;
      for (const v of varianti(tratti.map(t => liscia(t).map(([x, y]) => [.5 + (x - .5) * stretto, y])))) MODELLI.push({ segno, nuvola: nuvola(v), n: tratti.length, asp: forma(v) });
    }
    for (const m of imparati()) if (m && m.segno && Array.isArray(m.tratti)) MODELLI.push({ segno: m.segno, nuvola: nuvola(m.tratti), n: m.tratti.length, asp: forma(m.tratti), mio: true });
  }
  function impara(segno, tratti) {
    if (!/^[0-9+×()]$/.test(segno) || !tratti.length) return;
    const l = imparati(), norm = normalizza(tratti);
    l.push({ segno, tratti: norm });
    // al massimo 12 per segno: i più vecchi escono
    const tenuti = []; const conta = {};
    for (let i = l.length - 1; i >= 0; i--) { conta[l[i].segno] = (conta[l[i].segno] || 0) + 1; if (conta[l[i].segno] <= 12) tenuti.unshift(l[i]); }
    try { localStorage.setItem(IMPARATI_K, JSON.stringify(tenuti)); } catch (e) {}
    MODELLI.push({ segno, nuvola: nuvola(norm), n: norm.length, asp: forma(norm), mio: true });
  }
  function dimentica() { try { localStorage.removeItem(IMPARATI_K); } catch (e) {} costruisci(); }
  function normalizza(tratti) {   // in una scatola 0..1, arrotondato (si salva leggero)
    const b = scatola(tratti), s = Math.max(b.w, b.h) || 1;
    return tratti.map(t => t.map(p => [Math.round(1000 * (p[0] - b.x0) / s) / 1000, Math.round(1000 * (p[1] - b.y0) / s) / 1000]));
  }
  function scatola(tratti) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const t of tratti) for (const p of t) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  }
  const forma = tratti => { const b = scatola(tratti); return Math.max(b.w, .02) / Math.max(b.h, .02); };
  function classifica(tratti, tutti = false) {
    const n = nuvola(tratti), asp = forma(tratti); let migliore = null, secondo = null;
    const perSegno = {};
    for (const m of MODELLI) {
      if (!tutti && m.asp && (asp / m.asp > 3.2 || m.asp / asp > 3.2)) continue;      // forme troppo diverse (un 1 sottile e uno 0 largo): non si confrontano (velocità)
      // numero di tratti diverso (es. + e × ne hanno 2, l'1 di solito 1): un piccolo svantaggio
      const pen = m.n && m.n !== tratti.length ? 1.12 : 1;
      const d = distanza(n, m.nuvola, (perSegno[m.segno] ?? Infinity) / pen) * pen;
      if (!(m.segno in perSegno) || d < perSegno[m.segno]) perSegno[m.segno] = d;
    }
    const ord = Object.entries(perSegno).sort((a, b) => a[1] - b[1]);
    if (ord.length < 2 && !tutti) return classifica(tratti, true);
    migliore = ord[0]; secondo = ord[1] || [null, Infinity];
    return { segno: migliore[0], distanza: migliore[1], sicuro: secondo[1] - migliore[1] > 0.12 * migliore[1], secondo: secondo[0] };
  }
  // ---------- dalla pagina alle righe e ai segni ----------
  function leggi(trattiPagina) {
    const tr = trattiPagina.filter(t => t.length).map(t => ({ punti: t, b: scatola([t]) }));
    if (!tr.length) return [];
    // altezza tipica di un segno: la mediana dei tratti "alti"
    const alt = tr.map(t => t.b.h).sort((a, b) => a - b);
    const Hmax = alt[alt.length - 1], H = Math.max(alt.filter(h => h > .35 * Hmax)[Math.floor(alt.filter(h => h > .35 * Hmax).length / 2)] || Hmax, 1e-6);
    // 1) righe: prima i tratti grandi formano le fasce, poi i piccoli (punti, -, =) vanno nella fascia più vicina
    const grandi = tr.filter(t => t.b.h >= .45 * H).sort((a, b) => a.b.cy - b.b.cy), piccoli = tr.filter(t => t.b.h < .45 * H);
    const righe = [];
    for (const t of grandi) {
      const r = righe.find(r => Math.min(r.y1, t.b.y1) - Math.max(r.y0, t.b.y0) > .35 * Math.min(r.y1 - r.y0, t.b.h));
      if (r) { r.tratti.push(t); r.y0 = Math.min(r.y0, t.b.y0); r.y1 = Math.max(r.y1, t.b.y1); } else righe.push({ y0: t.b.y0, y1: t.b.y1, tratti: [t] });
    }
    for (const t of piccoli) {
      let r = righe.find(r => t.b.cy >= r.y0 - .25 * H && t.b.cy <= r.y1 + .25 * H);
      if (!r) r = righe.slice().sort((a, b) => Math.abs((a.y0 + a.y1) / 2 - t.b.cy) - Math.abs((b.y0 + b.y1) / 2 - t.b.cy))[0];
      if (!r || Math.abs((r.y0 + r.y1) / 2 - t.b.cy) > 1.5 * H) { r = { y0: t.b.y0, y1: t.b.y1, tratti: [] }; righe.push(r); }
      r.tratti.push(t);
    }
    righe.sort((a, b) => a.y0 - b.y0);
    return righe.filter(r => r.tratti.length).map(r => leggiRiga(r, H));
  }
  function leggiRiga(riga, Hpag) {
    const tr = riga.tratti.slice().sort((a, b) => a.b.x0 - b.b.x0);
    const alti = tr.map(t => t.b.h).filter(h => h > .45 * Hpag).sort((a, b) => a - b);
    const H = alti.length ? alti[Math.floor(alti.length / 2)] : Hpag;
    const base = riga.y0 + (riga.y1 - riga.y0) / 2;
    // 2) segni: tratti che si sovrappongono in orizzontale stanno nello stesso segno
    const segni = [];
    for (const t of tr) {
      const s = segni.find(s => sovrapposti(s, t, H)) || segni.find(s => insiemeSegni(s, t, H));
      if (s) { s.tratti.push(t); s.b = scatola(s.tratti.map(x => x.punti)); } else segni.push({ tratti: [t], b: t.b });
    }
    segni.sort((a, b) => a.b.x0 - b.b.x0);
    const letti = segni.map(s => ({ ...riconosci(s, H, riga), b: s.b, tratti: s.tratti.map(x => x.punti) }));
    // buon senso sulle parentesi: una ")" senza la sua "(" (o viceversa) è quasi sempre una cifra letta male
    let aperte = 0;
    for (const l of letti) {
      if (l.segno === "(") aperte++;
      else if (l.segno === ")") { if (aperte > 0) aperte--; else if (l.alternativa) { l.segno = l.alternativa; l.sicuro = false; } }
    }
    for (let i = letti.length - 1; i >= 0 && aperte > 0; i--) if (letti[i].segno === "(" && letti[i].alternativa) { letti[i].segno = letti[i].alternativa; letti[i].sicuro = false; aperte--; }
    return { testo: letti.map(l => l.segno).join(""), segni: letti, y0: riga.y0, y1: riga.y1, H };
  }
  const piatto = (t, H) => t.b.h < .3 * H && t.b.w > .3 * H;
  const punto = (t, H) => t.b.h < .22 * H && t.b.w < .22 * H && t.b.w < 1.8 * t.b.h + .05 * H && t.b.h < 2.5 * t.b.w + .08 * H;   // piccolo e tondeggiante
  // due tratti dello stesso segno? (il 4, il +, il 7 con la stanghetta…). Un tratto stretto (1, asta del 4) conta solo se sta DENTRO l'altro
  function sovrapposti(s, t, H) {
    const ov = Math.min(s.b.x1, t.b.x1) - Math.max(s.b.x0, t.b.x0);
    if (ov <= -.06 * H || punto(s, H) || punto(t, H)) return false;
    const [p, g] = s.b.w < t.b.w ? [s.b, t.b] : [t.b, s.b];
    if (ov > 0 && (p.w < .15 * H ? p.cx > g.x0 - .06 * H && p.cx < g.x1 + .06 * H : ov > .35 * p.w)) return true;
    // si toccano davvero (l'asta del 9 attaccata al bordo, la stanghetta del 5 scritte inclinate)
    return (ov > .12 * p.w || p.w < .15 * H) && vicini(s.tratti ? s.tratti.map(x => x.punti) : [s.punti], [t.punti], .07 * H);
  }
  function vicini(A, B, d) {   // un punto di un tratto vicino a un PEZZO (segmento) dell'altro
    const seg = (p, a, b) => { const vx = b[0] - a[0], vy = b[1] - a[1], L = vx * vx + vy * vy; let t = L ? ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * vx, p[1] - a[1] - t * vy); };
    const tocca = (X, Y) => { for (const a of X) for (const p of a) for (const b of Y) { if (b.length === 1 && Math.hypot(p[0] - b[0][0], p[1] - b[0][1]) < d) return true; for (let j = 1; j < b.length; j++) if (seg(p, b[j - 1], b[j]) < d) return true; } return false; };
    return tocca(A, B) || tocca(B, A);
  }
  // i punti di un tratto ogni "passo" (la penna vera ne dà tanti, ma non sempre alla stessa distanza)
  function fitto(t, passo) {
    const out = [t[0]];
    for (let i = 1; i < t.length; i++) { const d = Math.hypot(t[i][0] - t[i - 1][0], t[i][1] - t[i - 1][1]), k = Math.max(1, Math.ceil(d / passo)); for (let j = 1; j <= k; j++) out.push([t[i - 1][0] + (t[i][0] - t[i - 1][0]) * j / k, t[i - 1][1] + (t[i][1] - t[i - 1][1]) * j / k]); }
    return out;
  }
  // un tratto quasi dritto? (lunghezza del percorso ≈ distanza tra inizio e fine)
  function dritto(t) {
    let L = 0; for (let i = 1; i < t.length; i++) L += Math.hypot(t[i][0] - t[i - 1][0], t[i][1] - t[i - 1][1]);
    const D = Math.hypot(t[t.length - 1][0] - t[0][0], t[t.length - 1][1] - t[0][1]);
    return L > 0 && D / L > .9;
  }
  // due segmenti che si incrociano nel MEZZO (non agli estremi): il + e il ×
  function incrocio(a, b) {
    const [p, q] = [a[0], a[a.length - 1]], [r, s2] = [b[0], b[b.length - 1]];
    const d = (q[0] - p[0]) * (s2[1] - r[1]) - (q[1] - p[1]) * (s2[0] - r[0]);
    if (Math.abs(d) < 1e-9) return false;
    const t = ((r[0] - p[0]) * (s2[1] - r[1]) - (r[1] - p[1]) * (s2[0] - r[0])) / d, u = ((r[0] - p[0]) * (q[1] - p[1]) - (r[1] - p[1]) * (q[0] - p[0])) / d;
    return t > .15 && t < .85 && u > .15 && u < .85;
  }
  // i segni fatti di pezzi piccoli: = (due trattini), : (due punti), ÷ (trattino e due punti)
  function insiemeSegni(s, t, H) {
    const pezzi = x => punto(x, H) || piatto(x, H);
    if (!pezzi(t) || !s.tratti.every(pezzi)) return false;
    const ov = Math.min(s.b.x1, t.b.x1) - Math.max(s.b.x0, t.b.x0);
    if (piatto(t, H) && s.tratti.every(x => piatto(x, H))) return s.tratti.length < 2 && ov > .5 * Math.min(s.b.w, t.b.w) && Math.abs(s.b.cy - t.b.cy) < .5 * H;
    return ov > -.1 * H && Math.abs(s.b.cx - t.b.cx) < .35 * H;
  }
  function riconosci(s, H, riga) {
    const t = s.tratti, n = t.length;
    const tuttiPunti = t.every(x => punto(x, H)), tuttiPiatti = t.every(x => piatto(x, H));
    if (tuttiPunti) {
      if (n >= 2) return { segno: ":", sicuro: true };
      // un puntino da solo: virgola dei decimali (sta in basso nella riga)
      return { segno: ",", sicuro: s.b.cy > riga.y0 + .55 * (riga.y1 - riga.y0) };
    }
    if (n === 1 && piatto(t[0], H)) return { segno: "-", sicuro: true };
    if (n === 2 && tuttiPiatti) return { segno: "=", sicuro: true };
    if (n === 3 && t.filter(x => punto(x, H)).length === 2 && t.some(x => piatto(x, H))) return { segno: ":", sicuro: true };   // ÷
    // una virgola fatta con un trattino corto in basso
    if (n === 1 && s.b.h < .38 * H && s.b.w < .25 * H && s.b.y0 > riga.y0 + .5 * (riga.y1 - riga.y0)) return { segno: ",", sicuro: false };
    // + e ×: due tratti dritti che si incrociano nel mezzo
    if (n === 2 && dritto(t[0].punti) && dritto(t[1].punti) && incrocio(t[0].punti, t[1].punti)) {
      const ang = x => { const a = x.punti[0], b = x.punti[x.punti.length - 1]; return Math.abs(Math.atan2(b[1] - a[1], b[0] - a[0])) * 180 / Math.PI; };
      const oriz = g => g < 25 || g > 155, vert = g => Math.abs(g - 90) < 25, a0 = ang(t[0]), a1 = ang(t[1]);
      return { segno: (oriz(a0) && vert(a1)) || (vert(a0) && oriz(a1)) ? "+" : "×", sicuro: true };
    }
    const c = classifica(t.map(x => x.punti));
    // "1" o "7"? il 7 ha in alto una stanghetta ORIZZONTALE; il trattino dell'1 sale in diagonale
    if ((c.segno === "1" || c.segno === "7") && n <= 2) {
      const p0 = t.slice().sort((a, b) => b.b.h - a.b.h)[0].punti;
      if (n === 1 && dritto(p0) && s.b.h > .6 * H) return { segno: "1", sicuro: true };
      const top = fitto(p0, .02 * H).filter(q => q[1] < s.b.y0 + .25 * s.b.h);
      if (top.length) {
        // dal punto più a sinistra al punto più in alto: nel 7 è la stanghetta (piatta), nell'1 il trattino (ripido)
        const cima = top.filter(q => q[1] < s.b.y0 + .12 * s.b.h), L = top.reduce((a, q) => q[0] < a[0] ? q : a), R = (cima.length ? cima : top).reduce((a, q) => q[0] > a[0] ? q : a), dx = Math.abs(R[0] - L[0]);
        const ang = Math.atan2(Math.abs(R[1] - L[1]), dx) * 180 / Math.PI;
        const sette = dx > .15 * H && ang < 24;
        return { segno: sette ? "7" : "1", sicuro: sette ? ang < 14 : dx < .1 * H, alternativa: sette ? "1" : "7" };
      }
    }
    // "3" o "5"? il 5 ha in alto a sinistra un tratto che scende dritto
    if (c.segno === "3" || c.segno === "5") {
      const tutti = t.flatMap(x => fitto(x.punti, .02 * H)), w = s.b.w, h = s.b.h;
      const sinistra = tutti.filter(q => q[0] < s.b.x0 + .4 * w && q[1] > s.b.y0 + .14 * h && q[1] < s.b.y0 + .42 * h).length;
      const cinque = sinistra >= 3;
      return { segno: cinque ? "5" : "3", sicuro: cinque === (c.segno === "5") && c.sicuro, alternativa: cinque ? "3" : "5" };
    }
    return { segno: c.segno, sicuro: c.sicuro, alternativa: c.secondo };
  }
  // ---------- un conto della riga: "345:5=68" ----------
  function conto(testo) {
    const t = String(testo).replace(/\s+/g, "").replace(/[x*]/gi, "×").replace(/[÷/]/g, ":").replace(/−/g, "-");
    const m = t.match(/^(.+?)=([-]?\d+(?:,\d+)?)$/);
    if (!m) return { ok: false, motivo: /=/.test(t) ? "risultato" : "uguale", testo: t };
    if (!/^[\d,+\-×:()]+$/.test(m[1]) || !/[+\-×:]/.test(m[1].replace(/^-/, ""))) return { ok: false, motivo: "espressione", testo: t };
    return { ok: true, espr: m[1], risultato: m[2], testo: t };
  }
  costruisci();
  return { leggi, conto, impara, dimentica, classifica, costruisci, scatola, normalizza, get modelli() { return MODELLI.length; }, BASE, liscia };
})();
