// ===================================================================
//  FLY AULA · QR code fatto in casa (funziona senza internet)
//  Modalità byte, correzione errori livello M, versioni 1-9.
// ===================================================================
const QR = (() => {
  const TOT = [0, 26, 44, 70, 100, 134, 172, 196, 242, 292];      // codewords totali (livello M)
  const ECC = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22];            // codewords di correzione per blocco
  const BLOCCHI = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5];
  const ALLINEA = [[], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46]];

  function mul(x, y) { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z; }
  function divisore(grado) {
    const r = new Array(grado).fill(0); r[grado - 1] = 1; let radice = 1;
    for (let i = 0; i < grado; i++) {
      for (let j = 0; j < r.length; j++) { r[j] = mul(r[j], radice); if (j + 1 < r.length) r[j] ^= r[j + 1]; }
      radice = mul(radice, 2);
    }
    return r;
  }
  function resto(dati, div) {
    const r = new Array(div.length).fill(0);
    for (const b of dati) { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => r[i] ^= mul(c, f)); }
    return r;
  }

  function crea(testo) {
    const byte = Array.from(new TextEncoder().encode(testo));
    let v = 1;
    while (v <= 9 && TOT[v] - ECC[v] * BLOCCHI[v] < byte.length + 2) v++;
    if (v > 9) throw new Error("testo troppo lungo per il QR");
    const capienza = TOT[v] - ECC[v] * BLOCCHI[v];
    // bit dei dati
    const bit = [];
    const metti = (val, n) => { for (let i = n - 1; i >= 0; i--) bit.push((val >>> i) & 1); };
    metti(4, 4); metti(byte.length, 8); byte.forEach(b => metti(b, 8));
    metti(0, Math.min(4, capienza * 8 - bit.length));
    while (bit.length % 8) bit.push(0);
    const dati = [];
    for (let i = 0; i < bit.length; i += 8) dati.push(parseInt(bit.slice(i, i + 8).join(""), 2));
    for (let p = 0xEC; dati.length < capienza; p ^= 0xEC ^ 0x11) dati.push(p);
    // blocchi + correzione errori, poi mescolati
    const nb = BLOCCHI[v], ecl = ECC[v], corti = nb - TOT[v] % nb, lungCorto = Math.floor(TOT[v] / nb);
    const div = divisore(ecl), blocchi = [];
    for (let i = 0, k = 0; i < nb; i++) {
      const d = dati.slice(k, k + lungCorto - ecl + (i < corti ? 0 : 1)); k += d.length;
      const e = resto(d, div);
      if (i < corti) d.push(0);
      blocchi.push(d.concat(e));
    }
    const finale = [];
    for (let i = 0; i < blocchi[0].length; i++) blocchi.forEach((b, j) => { if (i !== lungCorto - ecl || j >= corti) finale.push(b[i]); });

    // la griglia
    const n = v * 4 + 17;
    const mod = Array.from({ length: n }, () => new Array(n).fill(false));
    const fun = Array.from({ length: n }, () => new Array(n).fill(false));
    const set = (x, y, s) => { mod[y][x] = s; fun[y][x] = true; };
    for (let i = 0; i < n; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    for (const [cx, cy] of [[3, 3], [n - 4, 3], [3, n - 4]])
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy;
        if (x >= 0 && x < n && y >= 0 && y < n) set(x, y, d !== 2 && d !== 4);
      }
    const al = ALLINEA[v];
    al.forEach((a, i) => al.forEach((b, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === al.length - 1) || (i === al.length - 1 && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(a + dx, b + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }));
    const formato = maschera => {
      const d = (0 << 3) | maschera; let r = d;   // livello M = 00
      for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      const b = ((d << 10) | r) ^ 0x5412, g = i => ((b >>> i) & 1) === 1;
      for (let i = 0; i <= 5; i++) set(8, i, g(i));
      set(8, 7, g(6)); set(8, 8, g(7)); set(7, 8, g(8));
      for (let i = 9; i < 15; i++) set(14 - i, 8, g(i));
      for (let i = 0; i < 8; i++) set(n - 1 - i, 8, g(i));
      for (let i = 8; i < 15; i++) set(8, n - 15 + i, g(i));
      set(8, n - 8, true);
    };
    formato(0);
    if (v >= 7) {
      let r = v; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25);
      const b = (v << 12) | r;
      for (let i = 0; i < 18; i++) { const s = ((b >>> i) & 1) === 1, a = n - 11 + i % 3, c = Math.floor(i / 3); set(a, c, s); set(c, a, s); }
    }
    // i dati, a serpentina
    let i = 0;
    for (let destra = n - 1; destra >= 1; destra -= 2) {
      if (destra === 6) destra = 5;
      for (let vert = 0; vert < n; vert++) for (let j = 0; j < 2; j++) {
        const x = destra - j, su = ((destra + 1) & 2) === 0, y = su ? n - 1 - vert : vert;
        if (!fun[y][x] && i < finale.length * 8) { mod[y][x] = ((finale[i >>> 3] >>> (7 - (i & 7))) & 1) === 1; i++; }
      }
    }
    // scelta della maschera migliore
    const MASCHERE = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, x => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
      (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => x * y % 2 + x * y % 3 === 0,
      (x, y) => (x * y % 2 + x * y % 3) % 2 === 0, (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0];
    const applica = m => { for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!fun[y][x] && MASCHERE[m](x, y)) mod[y][x] = !mod[y][x]; };
    const penalita = () => {
      let p = 0, scuri = 0;
      for (let k = 0; k < 2; k++) for (let a = 0; a < n; a++) {
        let run = 1;
        for (let b = 1; b < n; b++) {
          const c = k ? mod[b][a] : mod[a][b], pr = k ? mod[b - 1][a] : mod[a][b - 1];
          if (c === pr) run++; else { if (run >= 5) p += run - 2; run = 1; }
        }
        if (run >= 5) p += run - 2;
      }
      for (let y = 0; y < n - 1; y++) for (let x = 0; x < n - 1; x++) { const c = mod[y][x]; if (c === mod[y][x + 1] && c === mod[y + 1][x] && c === mod[y + 1][x + 1]) p += 3; }
      const pat = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0], tap = pat.slice().reverse();
      for (let a = 0; a < n; a++) for (let b = 0; b <= n - 11; b++) for (const pp of [pat, tap]) {
        if (pp.every((q, t) => mod[a][b + t] === !!q)) p += 40;
        if (pp.every((q, t) => mod[b + t][a] === !!q)) p += 40;
      }
      mod.forEach(r => r.forEach(c => scuri += c));
      return p + Math.floor(Math.abs(scuri * 20 - n * n * 10) / (n * n)) * 10;
    };
    let migliore = 0, minimo = Infinity;
    for (let m = 0; m < 8; m++) { applica(m); formato(m); const p = penalita(); if (p < minimo) { minimo = p; migliore = m; } applica(m); }
    applica(migliore); formato(migliore);
    return mod;
  }

  // disegno SVG con il margine bianco obbligatorio
  function svg(testo, px = 260) {
    const m = crea(testo), n = m.length, q = 4;
    let d = "";
    m.forEach((r, y) => r.forEach((c, x) => { if (c) d += `M${x + q} ${y + q}h1v1h-1z`; }));
    return `<svg class="qr" width="${px}" height="${px}" viewBox="0 0 ${n + 2 * q} ${n + 2 * q}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
  }
  return { crea, svg };
})();
