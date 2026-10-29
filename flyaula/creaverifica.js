// ===================================================================
//  FLY AULA · 📄 crea una verifica da stampare (solo per il prof, con PIN)
//  Ogni esercizio: controllato 3 volte. Fila B: stessi tipi, numeri diversi.
//  La verifica la PREPARA Fly Aula, ma la rilegge e la decide il prof.
//  I voti restano del prof: qui non si valuta nessuno.
// ===================================================================
const CreaVerifica = (() => {
  const el = id => document.getElementById(id);
  let lav = null, fermo = false;

  function apri() {
    el("pCreaVer").style.display = "block";
    const materia = el("materia").value, livello = el("livello").value, anno = annoDellaClasse(el("classe").value);
    const argomenti = argomentiDi(materia, livello, anno);
    el("cvCorpo").innerHTML = `
      <div class="prof-griglia">
        <section><h3>🎯 Argomento</h3><input id="cvArg" list="cvLista" placeholder="es. le percentuali" maxlength="120" value="${escC(Prof.argomento || "")}">
          <datalist id="cvLista">${argomenti.map(a => `<option value="${escC(a)}">`).join("")}</datalist>
          <p class="nota-s">${escC(MATERIE[materia].nome)} · ${escC(livello)}${anno ? " · classe " + anno + "ª" : ""}. Suggerimenti dal programma della classe.</p></section>
        <section><h3>📋 Com'è fatta</h3>
          <div class="riga-btn" style="margin:0"><label>Esercizi <select class="pill" id="cvN"><option>4</option><option selected>6</option><option>8</option><option>10</option></select></label>
          <label>File <select class="pill" id="cvFile"><option value="AB" selected>A e B</option><option value="A">solo A</option></select></label></div>
          <input id="cvTitolo" style="margin-top:10px" value="Verifica di ${escC(MATERIE[materia].nome)}" maxlength="80"></section>
        <section><h3>🏫 Intestazione</h3><input id="cvScuola" placeholder="Nome della scuola (facoltativo)" maxlength="80" value="${escC(leggiC("flyaula_scuola") || "")}">
          <p class="nota-s">Sul foglio: nome e cognome, classe, data e spazio per i punti (li decide il prof).</p></section>
      </div>
      <div class="riga-btn"><button class="btn" id="cvVia">🪄 Prepara la verifica</button><button class="btn sec" id="cvStop" style="display:none">⏹️ Ferma</button><button class="btn sec" id="cvChiudi">Chiudi</button></div>
      <div class="barra" id="cvBarraBox" style="display:none"><div id="cvBarra"></div></div>
      <div id="cvStato" class="nota-s" style="font-size:16px"></div>
      <div id="cvLavoro"></div>`;
    el("cvVia").onclick = prepara;
    el("cvStop").onclick = () => { fermo = true; };
    el("cvChiudi").onclick = chiudi;
    if (lav && lav.A.length) disegna();
  }
  function chiudi() { fermo = true; el("pCreaVer").style.display = "none"; }

  async function prepara() {
    if (!modello) return mostraAiuto();
    const materia = el("materia").value, livello = el("livello").value, n = +el("cvN").value, conB = el("cvFile").value === "AB";
    scriviC("flyaula_scuola", el("cvScuola").value.trim());
    lav = { A: [], B: conB ? [] : null, materia, livello, classe: el("classe").value, argomento: el("cvArg").value.trim(), titolo: el("cvTitolo").value.trim() || "Verifica", scuola: el("cvScuola").value.trim() };
    fermo = false;
    el("cvVia").style.display = "none"; el("cvStop").style.display = ""; el("cvBarraBox").style.display = "";
    const totale = n * (conB ? 2 : 1); let fatti = 0;
    const avanza = t => { el("cvBarra").style.width = (100 * fatti / totale) + "%"; el("cvStato").textContent = t; };
    for (let i = 0; i < n && !fermo; i++) {
      avanza(`✏️ Esercizio ${i + 1} di ${n} (fila A): lo scrivo e lo controllo 3 volte…`);
      const a = await creaEsercizio(cervello, MATERIE[materia].nome, livello, lav.argomento, { evita: lav.A.map(e => e.testo), chiave: materia });
      lav.A.push(a); fatti++; disegna();
      if (conB && !fermo) {
        avanza(`✏️ Esercizio ${i + 1} di ${n} (fila B): stessi tipi, numeri diversi, altri 3 controlli…`);
        lav.B.push(await creaVariante(cervello, a, MATERIE[materia].nome, livello, materia, lav.argomento)); fatti++; disegna();
      }
    }
    if (conB) while (lav.B.length < lav.A.length) lav.B.push(esercizioDiRiserva(materia, livello, lav.argomento));
    avanza(fermo ? "⏹️ Fermata: puoi stampare quello che c'è o ripartire." : `✓ Pronta! ${lav.A.length} esercizi${conB ? " per fila" : ""}, ognuno controllato 3 volte. Rileggila prima di stamparla.`);
    el("cvVia").style.display = ""; el("cvVia").textContent = "🪄 Rifai da capo"; el("cvStop").style.display = "none";
    conta("verificheCreate");
    disegna();
  }

  function rigaEs(e) {
    return `<div class="cv-es"><div>${escC(e.testo)}</div><div class="cv-sol">→ <b>${escC(soluzioneDi(e))}</b> <span class="cv-ok">${e.riserva ? "✓ calcolato da Fly Aula" : "✓✓✓ controllato 3 volte"}</span></div></div>`;
  }
  function disegna() {
    if (!lav) return;
    el("cvLavoro").innerHTML = `
      <table class="cv-tab"><thead><tr><th>N</th><th>Fila A</th>${lav.B ? "<th>Fila B</th>" : ""}<th></th></tr></thead><tbody>
      ${lav.A.map((a, i) => `<tr><td><b>${i + 1}</b></td><td>${rigaEs(a)}</td>${lav.B ? `<td>${lav.B[i] ? rigaEs(lav.B[i]) : '<div class="lavoro">…</div>'}</td>` : ""}
        <td class="cv-az"><button data-r="${i}" title="Rifai questo esercizio">🔄</button><button data-x="${i}" title="Togli questo esercizio">✕</button></td></tr>`).join("")}
      </tbody></table>
      ${lav.A.length ? `<div class="riga-btn"><button class="btn" id="cvStA">🖨️ Stampa fila A</button>${lav.B ? '<button class="btn" id="cvStB">🖨️ Stampa fila B</button>' : ""}<button class="btn sec" id="cvStS">🖨️ Soluzioni (solo prof)</button></div>
      <p class="nota-s">Dalla finestra di stampa puoi anche scegliere <b>Salva come PDF</b>. La verifica la prepara Fly Aula, ma la decide il prof: rileggila sempre.</p>` : ""}`;
    el("cvLavoro").querySelectorAll("[data-r]").forEach(b => b.onclick = async () => {
      const i = +b.dataset.r; b.disabled = true; b.textContent = "⏳";
      const evita = lav.A.map(e => e.testo);
      lav.A[i] = await creaEsercizio(cervello, MATERIE[lav.materia].nome, lav.livello, lav.argomento, { evita, chiave: lav.materia });
      if (lav.B) lav.B[i] = await creaVariante(cervello, lav.A[i], MATERIE[lav.materia].nome, lav.livello, lav.materia, lav.argomento);
      disegna();
    });
    el("cvLavoro").querySelectorAll("[data-x]").forEach(b => b.onclick = () => { const i = +b.dataset.x; lav.A.splice(i, 1); if (lav.B) lav.B.splice(i, 1); disegna(); });
    if (el("cvStA")) el("cvStA").onclick = () => stampaFila("A");
    if (el("cvStB")) el("cvStB").onclick = () => stampaFila("B");
    if (el("cvStS")) el("cvStS").onclick = stampaSoluzioni;
  }
  function testa(fila) {
    return `<h1>${escC(lav.titolo)}${fila ? " · Fila " + fila : ""}</h1>${lav.scuola ? `<div>${escC(lav.scuola)}</div>` : ""}
      <div class="testa"><span>Nome e cognome ______________________________</span><span>Classe ${escC(lav.classe)}</span><span>Data ____________</span></div>`;
  }
  function stampaFila(f) {
    const lista = f === "B" ? lav.B : lav.A;
    stampa(`${lav.titolo} - Fila ${f}`, testa(f) + (lav.argomento ? `<p><b>Argomento:</b> ${escC(lav.argomento)}</p>` : "") +
      lista.map((e, i) => `<div class="es"><span class="punti">punti ____</span><b class="n">${i + 1}.</b> ${escC(e.testo)}<div class="spazio"></div></div>`).join("") +
      `<p style="margin-top:18px"><b>Punteggio totale: ______</b></p>`);
  }
  function stampaSoluzioni() {
    const blocco = (lista, f) => `<h2>Fila ${f}</h2>` + lista.map((e, i) => `<div class="es"><b class="n">${i + 1}.</b> ${escC(e.testo)}<div class="sol"><b>Soluzione: ${escC(soluzioneDi(e))}</b>${e.conto ? ` &nbsp;(${escC(e.conto)})` : ""}${e.spiegazione ? `<br>${escC(e.spiegazione).replace(/\n/g, "<br>")}` : ""}</div></div>`).join("");
    stampa(`${lav.titolo} - Soluzioni`, `<h1>${escC(lav.titolo)} · SOLUZIONI (solo per il docente)</h1><div class="testa"><span>Classe ${escC(lav.classe)}</span><span>${escC(lav.argomento || "")}</span><span>${new Date().toLocaleDateString("it-IT")}</span></div>
      <p>Ogni soluzione è stata controllata 3 volte (calcolatrice, revisore, esercizio risolto da capo). Il docente la rilegge prima dell'uso.</p>` + blocco(lav.A, "A") + (lav.B ? `<div class="salto"></div>` + blocco(lav.B, "B") : ""));
  }
  return { apri, stato: () => lav };
})();
