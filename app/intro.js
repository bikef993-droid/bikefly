// Intro "linea di luce" di BikeFly Web: la stessa dell'app Android
window.introBikeFly = function (corta, fine) {

// Intro "linea di luce": stessa logica che andrà in Kotlin (glow = più tratti sovrapposti, niente shadowBlur)
const c = document.createElement("canvas"), g = c.getContext("2d");
const DPR = Math.min(2, window.devicePixelRatio || 1), SC = Math.min(innerWidth / 390, innerHeight / 700);
const S = SC * DPR, OX = (innerWidth / SC - 390) / 2;
c.width = Math.round(innerWidth * DPR); c.height = Math.round(innerHeight * DPR);
c.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;z-index:9999;background:#03050B;touch-action:none";
const base = () => g.setTransform(S, 0, 0, S, OX * S, 0);
const W = 390, H = innerHeight / SC, FINE = 4850;
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const fase = (ms, a, b) => cl((ms - a) / (b - a));
const eoc = x => 1 - Math.pow(1 - x, 3), eic = x => x * x * x, eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const MENTA = [0, 210, 160], CIELO = [30, 136, 255];
const mix = (t) => MENTA.map((v, i) => Math.round(v + (CIELO[i] - v) * t));
const rgba = (col, a) => `rgba(${col[0]},${col[1]},${col[2]},${a})`;

// ---- il percorso della bici (una linea continua) ----
const BW = 240, CX = W / 2, CY = H * .43;
const P = (x, y) => [CX + (x - .5) * BW, CY + y * BW];
const R = BW * .19;
const rd = P(.2, .2), fd = P(.8, .2), bb = P(.46, .2), seatTop = P(.39, -.11), saddleA = P(.33, -.13), saddleB = P(.44, -.13), stemTop = P(.69, -.13), stemBot = P(.71, -.05), bar = P(.78, -.20);
const terra = rd[1] + R;
function arco(c, da, a, n = 56) { const out = []; for (let i = 0; i <= n; i++) { const t = da + (a - da) * i / n; out.push([c[0] + Math.cos(t) * R, c[1] + Math.sin(t) * R]); } return out; }
const giu = Math.PI / 2, forca = Math.atan2(stemBot[1] - fd[1], stemBot[0] - fd[0]);
const punti = [
  [-30, terra],
  ...arco(rd, giu, -2 * Math.PI),                 // ruota dietro: 1 giro e 1/4, finisce a destra
  bb, seatTop, saddleA, saddleB, seatTop, rd, bb, stemBot, stemTop, seatTop, stemTop, bar, stemTop, stemBot, fd,
  ...arco(fd, forca, forca + 2 * Math.PI),        // ruota davanti: parte dove la tocca la forcella
  ...arco(fd, forca + 2 * Math.PI, giu + 2 * Math.PI, 20),
  [W + 30, terra]
];
// lunghezze cumulative
const cum = [0]; for (let i = 1; i < punti.length; i++) cum.push(cum[i - 1] + Math.hypot(punti[i][0] - punti[i - 1][0], punti[i][1] - punti[i - 1][1]));
const TOT = cum[cum.length - 1];
function puntoA(len) { let i = 1; while (i < cum.length - 1 && cum[i] < len) i++; const f = (len - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]); return [punti[i - 1][0] + (punti[i][0] - punti[i - 1][0]) * f, punti[i - 1][1] + (punti[i][1] - punti[i - 1][1]) * f, i]; }
function tratto(da, a, dx = 0) {
  const p0 = puntoA(da), p1 = puntoA(a);
  g.beginPath(); g.moveTo(p0[0] + dx, p0[1]);
  for (let i = p0[2]; i < p1[2]; i++) g.lineTo(punti[i][0] + dx, punti[i][1]);
  g.lineTo(p1[0] + dx, p1[1]);
}
function luminoso(disegna, col, forza = 1) {
  // alone largo, alone medio, linea piena, anima bianca
  g.lineCap = "round"; g.lineJoin = "round";
  [[18, .07], [10, .16], [5, .55], [2.2, 1]].forEach(([w, a]) => { disegna(); g.strokeStyle = rgba(col, a * forza); g.lineWidth = w; g.stroke(); });
  disegna(); g.strokeStyle = `rgba(255,255,255,${.75 * forza})`; g.lineWidth = .9; g.stroke();
}
function stellina(x, y, r, a) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(.25, rgba(MENTA, a * .6)); gr.addColorStop(1, rgba(MENTA, 0));
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
}


// ===================== versione "bocca aperta" (3,8 s) =====================
const T0 = 700;            // il tracciato parte dopo il battito
const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// scintille: nascono lungo il tracciato, cadono con la gravità
const SCINTILLE = [];
for (let i = 0; i < 140; i++) SCINTILLE.push({ quando: T0 + 60 + rnd(i) * 900, vx: (rnd(i + 1) - .5) * 120, vy: -40 - rnd(i + 2) * 120, vita: 500 + rnd(i + 3) * 500, r: .6 + rnd(i + 4) * 1.6 });

// particelle della scritta: punti presi dai pixel del testo
const TY = H * .47;
let BERSAGLI = null, TW = 0, X0 = 0;
function preparaTesto() {
  const o = document.createElement("canvas"); o.width = W; o.height = H; const q = o.getContext("2d");
  q.font = "900 74px Bricolage, Figtree, sans-serif"; q.textBaseline = "middle"; TW = q.measureText("BikeFly").width; X0 = W / 2 - TW / 2;
  q.fillStyle = "#fff"; q.fillText("BikeFly", X0, TY);
  const d = q.getImageData(0, 0, W, H).data; BERSAGLI = [];
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (d[(y * W + x) * 4 + 3] > 128) BERSAGLI.push([x, y]);
}

function disegna(ms) {
  if (!BERSAGLI) preparaTesto();
  base();
  // "colpo di camera" quando la bici scatta
  const punch = Math.sin(fase(ms, 2050, 2450) * Math.PI) * .07;
  g.translate(CX, CY); g.scale(1 + punch, 1 + punch); g.translate(-CX, -CY);

  g.fillStyle = "#03050B"; g.fillRect(-OX - 50, -50, W + 2 * OX + 100, H + 100);
  const ms2 = ms - T0;                                   // tempo della parte "bici"
  const acceso = fase(ms2, 950, 1200) * (1 - fase(ms2, 1500, 1900) * .5);
  const bg = g.createRadialGradient(CX, CY, 0, CX, CY, W * 1.1);
  bg.addColorStop(0, rgba(CIELO, .26 * acceso + .04)); bg.addColorStop(.5, rgba([60, 40, 160], .10 * acceso)); bg.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 50; i++) { const x = (i * 97.3 + ms * .012 * (1 + i % 3)) % W, y = (i * 211.7) % H; g.fillStyle = `rgba(160,200,255,${.06 + .1 * Math.abs(Math.sin(ms / 300 + i))})`; g.fillRect(x, y, 1.2, 1.2); }

  // ---------- 1. il battito: un punto di luce che pulsa e poi schizza a sinistra ----------
  if (ms < T0 + 120) {
    const b1 = Math.sin(fase(ms, 120, 380) * Math.PI), b2 = Math.sin(fase(ms, 420, 660) * Math.PI);
    const via = eic(fase(ms, 620, T0 + 100));
    const x = CX - (CX + 60) * via, y = CY + (terra - CY) * via;
    const r = 6 + 22 * b1 + 34 * b2;
    if (via > 0) { const sg = g.createLinearGradient(x, 0, CX, 0); sg.addColorStop(0, "rgba(255,255,255,.9)"); sg.addColorStop(1, rgba(MENTA, 0)); g.strokeStyle = sg; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(CX + (x - CX) * .3, CY + (y - CY) * .3); g.stroke(); }
    stellina(x, y, r + 10, .9); stellina(x, y, 4, 1);
    // anelli del battito
    [[b1, 120, 380], [b2, 420, 660]].forEach(([b, a, z]) => { const f = fase(ms, a, z); if (f > 0 && f < 1) { g.strokeStyle = rgba(MENTA, .5 * (1 - f)); g.lineWidth = 2; g.beginPath(); g.arc(CX, CY, 10 + 90 * eoc(f), 0, 7); g.stroke(); } });
  }

  // ---------- pavimento di luce in prospettiva ----------
  const pav = fase(ms2, 100, 600) * (1 - fase(ms2, 1400, 1800));
  if (pav > 0) {
    const oriz = terra + 2, fondo = H + 40;
    g.save(); g.beginPath(); g.rect(0, oriz, W, H); g.clip();
    for (let i = -10; i <= 10; i++) { g.strokeStyle = rgba(CIELO, .10 * pav); g.lineWidth = 1; g.beginPath(); g.moveTo(CX + i * 14, oriz); g.lineTo(CX + i * 120, fondo); g.stroke(); }
    for (let k = 0; k < 9; k++) { const t = ((k + ms * .0016) % 9) / 9, y = oriz + (fondo - oriz) * t * t; g.strokeStyle = rgba(MENTA, .14 * pav * t); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    // luce che si riflette sotto la testa della linea
    const disegnoNow = eio(fase(ms2, 80, 950));
    if (disegnoNow > 0 && disegnoNow < 1) { const t = puntoA(TOT * disegnoNow); g.save(); g.translate(t[0], oriz + 6); g.scale(1, .3); const rg = g.createRadialGradient(0, 0, 0, 0, 0, 140); rg.addColorStop(0, rgba(MENTA, .45 * pav)); rg.addColorStop(1, rgba(MENTA, 0)); g.fillStyle = rg; g.beginPath(); g.arc(0, 0, 140, 0, 7); g.fill(); g.restore(); }
    g.restore();
  }

  // ---------- 2. la linea disegna la bici + scintille ----------
  const disegno = eio(fase(ms2, 80, 950));
  const scatto = eic(fase(ms2, 1350, 1750));
  const dx = scatto * (W + BW * 1.2);
  const colore = mix(.35);
  if (disegno > 0 && ms2 < 1800) {
    const fine = TOT * disegno, inizio = Math.max(0, fine - TOT * .22 * (1 - fase(ms2, 700, 950)));
    const forza = .55 + .45 * acceso;
    const lenTerraSx = cum[1], lenTerraDx = TOT - (cum[cum.length - 1] - cum[cum.length - 2]);
    // riempimento "liquido" del telaio dopo l'accensione
    luminoso(() => tratto(Math.max(lenTerraSx * fase(ms2, 300, 700), 0), Math.min(fine, lenTerraDx), dx), colore, forza);
    if (disegno < 1) { luminoso(() => tratto(Math.max(inizio, fine - 60), fine), [255, 255, 255], 1); const t = puntoA(fine); stellina(t[0], t[1], 30, 1); }
  }
  SCINTILLE.forEach((s, i) => {
    const t = ms - s.quando; if (t < 0 || t > s.vita) return;
    const nascita = puntoA(TOT * eio(fase(s.quando - T0, 80, 950)));
    const f = t / 1000, x = nascita[0] + s.vx * f, y = nascita[1] + s.vy * f + 260 * f * f;
    const a = 1 - t / s.vita;
    g.fillStyle = i % 3 ? `rgba(255,255,255,${a})` : rgba(MENTA, a); g.beginPath(); g.arc(x, y, s.r, 0, 7); g.fill();
  });

  // ---------- 3. accensione: ruote, onda d'urto, flare orizzontale ----------
  const ruote = eoc(fase(ms2, 950, 1200));
  if (ruote > 0 && ms2 < 1850) {
    const giro = (ms2 - 950) / 1000 * (9 + 34 * scatto);
    for (const h of [rd, fd]) {
      const x = h[0] + dx, y = h[1];
      const rg = g.createRadialGradient(x, y, R * .2, x, y, R * 1.3);
      rg.addColorStop(0, rgba(CIELO, .10 * ruote)); rg.addColorStop(.72, rgba(MENTA, .22 * ruote)); rg.addColorStop(.86, `rgba(255,255,255,${.6 * ruote})`); rg.addColorStop(1, rgba(CIELO, 0));
      g.fillStyle = rg; g.beginPath(); g.arc(x, y, R * 1.3, 0, 7); g.fill();
      for (let i = 0; i < 10; i++) { const a = giro + i * Math.PI / 5; g.strokeStyle = rgba(mix(i / 10), .65 * ruote); g.lineWidth = 1.3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * R * .92 * ruote, y + Math.sin(a) * R * .92 * ruote); g.stroke(); }
      g.fillStyle = `rgba(255,255,255,${ruote})`; g.beginPath(); g.arc(x, y, 3.4, 0, 7); g.fill();
    }
    const onda = fase(ms2, 980, 1500);
    if (onda > 0 && onda < 1) {
      g.strokeStyle = `rgba(255,255,255,${.55 * (1 - onda)})`; g.lineWidth = 3 * (1 - onda) + .5;
      g.beginPath(); g.ellipse(CX, CY, 30 + W * 1.1 * eoc(onda), 20 + W * .8 * eoc(onda), 0, 0, 7); g.stroke();
      g.strokeStyle = rgba(MENTA, .4 * (1 - onda)); g.lineWidth = 8 * (1 - onda); g.beginPath(); g.ellipse(CX, CY, 20 + W * .9 * eoc(onda), 14 + W * .65 * eoc(onda), 0, 0, 7); g.stroke();
    }
    // flare anamorfico (riga di luce orizzontale da cinema)
    const fl = Math.sin(fase(ms2, 980, 1500) * Math.PI);
    if (fl > 0) {
      const fg = g.createLinearGradient(0, 0, W, 0); fg.addColorStop(0, rgba(CIELO, 0)); fg.addColorStop(.5, `rgba(200,235,255,${.8 * fl})`); fg.addColorStop(1, rgba(CIELO, 0));
      g.fillStyle = fg; g.fillRect(0, CY + R * .25 - 1.5, W, 3); g.globalAlpha = .35; g.fillRect(0, CY + R * .25 - 6, W, 12); g.globalAlpha = 1;
      stellina(CX, CY + R * .25, 60 * fl, .8 * fl);
    }
  }
  // scatto: copie mosse
  if (scatto > 0 && scatto < 1) for (let k = 1; k <= 5; k++) luminoso(() => tratto(cum[1], cum[cum.length - 2], dx - k * 30 * scatto), colore, .2 / k);

  // ---------- 4. "velocità della luce": linee che escono dal centro ----------
  const warp = fase(ms2, 1400, 2000);
  if (warp > 0 && warp < 1) {
    const forza = Math.sin(warp * Math.PI);
    for (let i = 0; i < 90; i++) {
      const a = rnd(i) * 6.283, v = ((rnd(i + 50) + warp * (1.5 + rnd(i + 9))) % 1);
      const d1 = 20 + v * v * W * 1.1, d2 = d1 + (20 + 180 * v) * forza;
      g.strokeStyle = i % 4 ? `rgba(220,240,255,${.7 * forza * v})` : rgba(MENTA, .8 * forza * v); g.lineWidth = .6 + 1.6 * v;
      g.beginPath(); g.moveTo(CX + Math.cos(a) * d1, TY + Math.sin(a) * d1 * .8); g.lineTo(CX + Math.cos(a) * d2, TY + Math.sin(a) * d2 * .8); g.stroke();
    }
  }

  // ---------- 5. le particelle si assemblano in "BikeFly" ----------
  const ass = fase(ms2, 1650, 2450);
  if (ass > 0) {
    const n = BERSAGLI.length;
    for (let i = 0; i < n; i += 1) {
      const [tx, ty] = BERSAGLI[i];
      const ritardo = (tx - X0) / TW * .35;                    // si compone da sinistra a destra
      const p = eio(cl((ass - ritardo) / (1 - .35)));
      if (p <= 0) continue;
      const a0 = rnd(i) * 6.283, d0 = W * (.6 + rnd(i + 3) * .8);
      const sx = CX + Math.cos(a0) * d0, sy = TY + Math.sin(a0) * d0 * .8;
      const x = sx + (tx - sx) * p, y = sy + (ty - sy) * p;
      const col = mix((tx - X0) / TW);
      g.fillStyle = p < 1 ? `rgba(${col},${.35 + .65 * p})` : `rgba(${col},${1 - fase(ms2, 2450, 2650)})`;
      g.fillRect(x - .9, y - .9, 1.8, 1.8);
    }
  }
  // il testo pieno prende il posto delle particelle, con i colori separati che si riuniscono
  const pieno = fase(ms2, 2350, 2650);
  if (pieno > 0) {
    g.font = "900 74px Bricolage, Figtree, sans-serif"; g.textBaseline = "middle";
    const sep = (1 - eoc(pieno)) * 7;
    g.globalCompositeOperation = "lighter";
    g.globalAlpha = .75 * pieno * (1 - fase(ms2, 2600, 2850)); g.fillStyle = "#FF3D6E"; g.fillText("BikeFly", X0 - sep, TY);
    g.fillStyle = "#2BE7FF"; g.fillText("BikeFly", X0 + sep, TY);
    g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
    const off = document.createElement("canvas"); off.width = c.width; off.height = c.height; const o = off.getContext("2d"); o.setTransform(S, 0, 0, S, OX * S, 0);
    o.font = g.font; o.textBaseline = "middle";
    const tg = o.createLinearGradient(X0, 0, X0 + TW, 0); tg.addColorStop(0, "#5FF2CB"); tg.addColorStop(.5, "#FFFFFF"); tg.addColorStop(1, "#6FB6FF");
    [[.10, 12], [.18, 6]].forEach(([a, s]) => { o.globalAlpha = a * pieno; o.lineWidth = s * 2; o.strokeStyle = rgba(MENTA, 1); o.lineJoin = "round"; o.strokeText("BikeFly", X0, TY); });
    o.globalAlpha = pieno; o.fillStyle = tg; o.fillText("BikeFly", X0, TY);
    const rif = fase(ms2, 2650, 3000);
    if (rif > 0 && rif < 1) {
      o.globalCompositeOperation = "source-atop"; o.globalAlpha = 1;
      const rx = X0 - 40 + (TW + 80) * rif, rgr = o.createLinearGradient(rx - 34, 0, rx + 34, 0);
      rgr.addColorStop(0, "rgba(255,230,160,0)"); rgr.addColorStop(.5, "rgba(255,240,190,.95)"); rgr.addColorStop(1, "rgba(255,230,160,0)");
      o.fillStyle = rgr; o.fillRect(X0 - 50, TY - 60, TW + 100, 120);
    }

    const vola = ms2 - 2850;
    if (vola < 0) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(off, 0, 0); g.restore(); }
    else {
      // "Bike" resta e si spegne; "Fly" si stacca e vola
      const wBike = (() => { g.font = "900 74px Bricolage, Figtree, sans-serif"; return g.measureText("Bike").width; })();
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1 - fase(vola, 350, 800);
      g.beginPath(); g.rect(0, 0, (X0 + wBike + OX) * S, c.height); g.clip(); g.drawImage(off, 0, 0); g.restore();
      // percorso del volo: trema, decolla verso destra in alto, curva e si tuffa verso di te
      const trema = vola < 120 ? Math.sin(vola / 9) * 2.2 : 0;
      const p = eio(fase(vola, 120, 950));
      const ax = X0 + wBike, ay = TY;                                  // partenza (posizione originale)
      const c1 = [W * 1.05, TY - 330], c2 = [-W * .15, TY - 380], ex = CX - (TW - wBike) / 2, ey = TY - 120;
      const bz = (a, b, c, d, t) => (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * c + t ** 3 * d;
      const fx = bz(ax, c1[0], c2[0], ex, p) + trema, fy = bz(ay, c1[1], c2[1], ey, p);
      const tuffo = eic(fase(vola, 800, 1250));                       // si ingrandisce verso la camera
      const scala = (vola < 120 ? 1 - .05 * Math.sin(vola / 120 * Math.PI) : 1 - .25 * Math.sin(p * Math.PI)) * (1 + 22 * tuffo);
      const giro = Math.sin(p * Math.PI * 2) * .22 * (1 - tuffo);
      // scia di scintille lungo il volo
      for (let k = 0; k < 40; k++) {
        const pk = eio(fase(vola - k * 18, 120, 950)); if (pk <= 0 || pk >= p || tuffo > .3) continue;
        const sx = bz(ax, c1[0], c2[0], ex, pk) + (TW - wBike) / 2, sy = bz(ay, c1[1], c2[1], ey, pk) + Math.sin(k * 1.7) * 6;
        g.fillStyle = k % 3 ? `rgba(255,255,255,${.8 * (1 - k / 40)})` : rgba(MENTA, .9 * (1 - k / 40)); g.beginPath(); g.arc(sx, sy, 2.4 * (1 - k / 40) + .5, 0, 7); g.fill();
      }
      g.save();
      const wFly = TW - wBike;
      g.translate(fx + wFly / 2, fy); g.rotate(giro); g.scale(scala, scala);
      // le ali di luce che sbattono
      const ali = fase(vola, 100, 300) * (1 - tuffo);
      if (ali > 0) {
        const batti = Math.sin(vola / 55) * .5 + .5;
        for (const lato of [-1, 1]) {
          g.save(); g.translate(lato * wFly * .22, -26); g.scale(lato, 1); g.rotate(-.5 + batti * .9);
          const ag = g.createLinearGradient(0, 0, 70, -40); ag.addColorStop(0, `rgba(255,255,255,${.95 * ali})`); ag.addColorStop(1, rgba(MENTA, .0));
          g.fillStyle = ag;
          for (let piuma = 0; piuma < 3; piuma++) { g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(30 + piuma * 8, -46 + piuma * 12, 74 - piuma * 10, -18 + piuma * 14); g.quadraticCurveTo(40, -6 + piuma * 6, 0, 0); g.fill(); }
          g.restore();
        }
      }
      // la parola "Fly" (con alone)
      g.font = "900 74px Bricolage, Figtree, sans-serif"; g.textBaseline = "middle";
      const fg = g.createLinearGradient(-wFly / 2, 0, wFly / 2, 0); fg.addColorStop(0, "#E9FFF8"); fg.addColorStop(1, "#6FB6FF");
      g.globalAlpha = .18; g.strokeStyle = rgba(MENTA, 1); g.lineWidth = 14; g.lineJoin = "round"; g.strokeText("Fly", -wFly / 2, 0);
      g.globalAlpha = 1; g.fillStyle = fg; g.fillText("Fly", -wFly / 2, 0);
      g.restore();
      // quando ti arriva addosso lo schermo si riempie dei colori di BikeFly
      const riempi = fase(vola, 1050, 1300);
      if (riempi > 0) { base(); const rg = g.createLinearGradient(0, 0, W, H); rg.addColorStop(0, rgba(MENTA, riempi)); rg.addColorStop(.5, rgba(CIELO, riempi)); rg.addColorStop(1, rgba([124, 92, 255], riempi)); g.fillStyle = rg; g.fillRect(-OX, 0, W + 2 * OX, H); }
    }

    // flare finale sulla scritta
    const ff = Math.sin(fase(ms2, 2450, 2850) * Math.PI);
    if (ff > 0) { const fg = g.createLinearGradient(0, 0, W, 0); fg.addColorStop(0, rgba(CIELO, 0)); fg.addColorStop(.5, `rgba(220,245,255,${.7 * ff})`); fg.addColorStop(1, rgba(CIELO, 0)); g.fillStyle = fg; g.fillRect(0, TY - 1.5, W, 3); stellina(X0 + TW * .55, TY, 70 * ff, .6 * ff); }
    const sub = eoc(fase(ms2, 2700, 3000));
    g.globalAlpha = sub * (1 - fase(ms2, 2850, 3100)); g.fillStyle = "rgba(220,235,255,.88)"; g.font = "600 17px Bricolage, Figtree, sans-serif"; g.textAlign = "center";
    g.fillText("Conviene a tutti", CX, TY + 56 + (1 - sub) * 10); g.textAlign = "left"; g.globalAlpha = 1;
  }
  base();
  const vg = g.createRadialGradient(W / 2, H / 2, H * .25, W / 2, H / 2, H * .72); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.62)");
  g.globalAlpha = 1 - fase(ms2, 4000, 4150); g.fillStyle = vg; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
}
window.disegna = disegna;


document.body.appendChild(c);
const ridotto = matchMedia("(prefers-reduced-motion: reduce)").matches;
const inizio = ridotto ? 3500 : corta ? 2900 : 0;
let t0 = null, chiusa = false;
const chiudi = () => { if (chiusa) return; chiusa = true; c.style.transition = "opacity .45s"; c.style.opacity = "0"; setTimeout(() => c.remove(), 480); fine && fine(); };
c.addEventListener("pointerdown", chiudi);
function giro(t) {
  if (chiusa) return;
  if (t0 === null) t0 = t;
  const ms = inizio + (t - t0);
  disegna(Math.min(ms, FINE));
  if (ms >= FINE) chiudi(); else requestAnimationFrame(giro);
}
(document.fonts ? document.fonts.load("800 74px Bricolage") : Promise.resolve()).catch(() => {}).then(() => requestAnimationFrame(giro));
};
