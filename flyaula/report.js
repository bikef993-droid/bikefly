// ===================================================================
//  FLY AULA · 📈 report per la scuola (solo numeri, nessun nome)
//  Quante lezioni, quante domande, quanti errori corretti dai controlli.
//  Serve alla scuola per vedere che Fly Aula viene usata e funziona.
// ===================================================================
const USO = "flyaula_uso";
function usoGiorni() { try { return JSON.parse(localStorage.getItem(USO) || "{}"); } catch (e) { return {}; } }
function contaGiorno(materia) {
  const u = usoGiorni(), g = new Date().toISOString().slice(0, 10);
  u[g] = u[g] || {}; u[g][materia] = (u[g][materia] || 0) + 1;
  const giorni = Object.keys(u).sort(); while (giorni.length > 180) delete u[giorni.shift()];
  try { localStorage.setItem(USO, JSON.stringify(u)); } catch (e) {}
}

const Report = (() => {
  const el = id => document.getElementById(id);
  const n = x => (x || 0).toLocaleString("it-IT");
  function dati() {
    const s = statistiche(), u = usoGiorni(), oggi = new Date();
    const giorni = Array.from({ length: 30 }, (_, i) => { const d = new Date(oggi); d.setDate(d.getDate() - 29 + i); const k = d.toISOString().slice(0, 10); return { k, d, v: Object.values(u[k] || {}).reduce((a, b) => a + b, 0) }; });
    const perMateria = {}; Object.values(u).forEach(g => Object.entries(g).forEach(([m, v]) => perMateria[m] = (perMateria[m] || 0) + v));
    let esame = null; try { esame = JSON.parse(localStorage.getItem("flyaula_esame_" + modello) || "null"); } catch (e) {}
    return { s, giorni, perMateria, esame };
  }
  // colonne delle domande al giorno (una serie: nessuna legenda, il titolo dice cosa sono)
  function grafico(giorni, stampa = false) {
    const W = 760, H = 220, L = 34, B = 26, T = 10, max = Math.max(4, ...giorni.map(g => g.v));
    const passo = [1, 2, 5, 10, 20, 50, 100, 200, 500].find(p => max / p <= 5), top = Math.ceil(max / passo) * passo;
    const bw = (W - L - 8) / giorni.length, y = v => T + (H - T - B) * (1 - v / top);
    const ink = stampa ? "#222" : "#93A6C3", grid = stampa ? "#ddd" : "rgba(255,255,255,.08)", col = stampa ? "#2A5DB0" : "#3B8BFF";
    let g = "";
    for (let v = 0; v <= top; v += passo) g += `<line x1="${L}" x2="${W - 4}" y1="${y(v)}" y2="${y(v)}" stroke="${grid}"/><text x="${L - 6}" y="${y(v) + 4}" font-size="11" fill="${ink}" text-anchor="end">${v}</text>`;
    const barre = giorni.map((d, i) => {
      const h = Math.max(0, y(0) - y(d.v)), x = L + i * bw + 1, w = Math.max(2, bw - 2), r = Math.min(4, w / 2, h);
      const giorno = d.d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });
      const forma = h > 0 ? `<path d="M${x},${y(0)} V${y(d.v) + r} Q${x},${y(d.v)} ${x + r},${y(d.v)} H${x + w - r} Q${x + w},${y(d.v)} ${x + w},${y(d.v) + r} V${y(0)} Z" fill="${col}"/>` : "";
      return `<g class="rp-barra" data-t="${giorno}: ${d.v} ${d.v === 1 ? "domanda" : "domande"}"><rect x="${L + i * bw}" y="${T}" width="${bw}" height="${H - T - B}" fill="transparent"/>${forma}</g>`
        + (i % 5 === 4 ? `<text x="${x + w / 2}" y="${H - 8}" font-size="11" fill="${ink}" text-anchor="middle">${d.d.getDate()}/${d.d.getMonth() + 1}</text>` : "");
    }).join("");
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px" role="img" aria-label="Domande al giorno negli ultimi 30 giorni">${g}<line x1="${L}" x2="${W - 4}" y1="${y(0)}" y2="${y(0)}" stroke="${ink}"/>${barre}</svg>`;
  }
  function contenuto(stampa = false) {
    const { s, giorni, perMateria, esame } = dati();
    const affid = s.risposte ? Math.round(1000 * (1 - (s.segnalate || 0) / s.risposte)) / 10 : null;
    const tot = Object.values(perMateria).reduce((a, b) => a + b, 0);
    const tile = (v, t) => `<div><b>${v}</b><span>${t}</span></div>`;
    return `
      <h3>📚 Uso</h3>
      <div class="stat">${tile(n(s.risposte), "risposte date")}${tile(n(s.lezioni), "lezioni")}${tile(n(s.esercizi), "esercizi alla LIM")}${tile(n(s.verificheCreate), "verifiche preparate")}${tile(n(s.ripassi), "ripassi")}${tile(n(s.gare), "gare a squadre")}${tile(n(s.riassunti), "riassunti per assenti")}${tile(n(s.traduzioni), "traduzioni per alunni stranieri")}</div>
      <h3>✅ Qualità e controlli</h3>
      <div class="stat">${tile(n(s.doppi), "controllate 2 volte")}${tile(n(s.tripli), "controllate 3 volte")}${tile(n(s.correttiRevisore), "errori corretti dal ricontrollo")}${tile(n(s.contiCorretti), "conti corretti dalla calcolatrice")}${tile(n(s.dubbi), "dubbi segnalati al prof (invece di inventare)")}${tile(n(s.segnalate), "errori segnalati dai prof")}${tile(affid === null ? "—" : affid.toLocaleString("it-IT") + "%", "risposte senza segnalazioni")}${esame ? tile(`${Math.round(100 * esame.dopo / esame.n)}%`, `esame (${esame.n} domande): giuste con i controlli`) : ""}</div>
      <h3>📅 Domande al giorno · ultimi 30 giorni</h3>
      <div class="rp-graf">${grafico(giorni, stampa)}<div class="rp-tip" hidden></div></div>
      <h3>📖 Per materia</h3>
      <table class="rp-mat"><tbody>${Object.entries(perMateria).sort((a, b) => b[1] - a[1]).map(([m, v]) => `<tr><td>${escC(MATERIE[m]?.nome || m)}</td><td class="rp-num">${n(v)}</td><td style="width:60%"><div class="rp-bar" style="width:${tot ? 100 * v / tot : 0}%"></div></td></tr>`).join("") || `<tr><td>Ancora nessuna domanda.</td></tr>`}</tbody></table>
      <p class="nota-s" style="margin-top:14px">🔒 Solo numeri: nessun nome, nessuna domanda degli alunni, nessuna foto. Tutto resta su questo computer.</p>`;
  }
  async function apri() {
    if (!(await Prof.accesso())) return;
    el("pReport").style.display = "block";
    el("rpCorpo").innerHTML = contenuto();
    const tip = el("rpCorpo").querySelector(".rp-tip"), box = el("rpCorpo").querySelector(".rp-graf");
    el("rpCorpo").querySelectorAll(".rp-barra").forEach(b => {
      b.onmouseenter = e => { tip.hidden = false; tip.textContent = b.dataset.t; };
      b.onmousemove = e => { const r = box.getBoundingClientRect(); tip.style.left = (e.clientX - r.left + 12) + "px"; tip.style.top = (e.clientY - r.top - 34) + "px"; };
      b.onmouseleave = () => { tip.hidden = true; };
    });
  }
  function stampaReport() {
    const scuola = leggiC("flyaula_scuola") || "";
    stampa("Report Fly Aula", `<h1>Report di Fly Aula${scuola ? " · " + escC(scuola) : ""}</h1><div class="testa"><span>Classe/computer: ${escC(el("classe").value)}</span><span>${new Date().toLocaleDateString("it-IT")}</span></div>
      <style>.stat{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.stat div{border:1px solid #bbb;border-radius:8px;padding:8px}.stat b{display:block;font-size:20px}.stat span{font-size:12px;color:#444}.rp-mat{width:100%;border-collapse:collapse}.rp-mat td{padding:4px 6px;border-bottom:1px solid #ddd}.rp-bar{height:10px;background:#2A5DB0;border-radius:0 4px 4px 0}.rp-num{text-align:right}.rp-tip{display:none}</style>` + contenuto(true));
  }
  return { apri, stampaReport };
})();
