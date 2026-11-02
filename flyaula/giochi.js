// ===================================================================
//  FLY AULA · 🎮 GIOCHI E BENESSERE
//  🧑‍🎤 Indovina il personaggio · 🔐 Escape room di materia · 🏆 Sfida tra classi · 🫧 Un minuto di respiro
//  Le risposte degli enigmi arrivano dalle liste con la risposta SICURA e dalla calcolatrice.
// ===================================================================
// 🏆 un punto alla classe (sfida della settimana tra le classi della scuola: niente nomi di alunni)
function puntiClasse(n) {
  const classe = (document.getElementById("classe").value || "").trim();
  if (!classe || !(n > 0) || (typeof esameAttivo !== "undefined" && esameAttivo)) return;
  fetch("/fa/sfida", { method: "POST", headers: { "Content-Type": "application/json", ...(typeof intestazioniMemoria === "function" ? intestazioniMemoria() : {}) }, body: JSON.stringify({ classe: classe.slice(0, 12), punti: Math.min(20, Math.round(n)) }) }).catch(() => {});
}
const Giochi = (() => {
  const el = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const caso = n => Math.floor(Math.random() * n), scegli = l => l[caso(l.length)];
  const json = t => { const s = String(t || ""); return JSON.parse(s.slice(s.indexOf("{"), s.lastIndexOf("}") + 1)); };
  const norm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  let segreto = null, domande = [], timerEsc = null, escape = null;

  function pannello() {
    let p = el("pGiochi");
    if (!p) { p = document.createElement("div"); p.className = "pannello"; p.id = "pGiochi"; p.innerHTML = `<div class="box"><h2>🎮 Giochi</h2><div id="giCorpo"></div></div>`; document.body.appendChild(p); }
    return p;
  }
  function apri(k) { pannello().style.display = "block"; k ? vai(k) : piastrelle(); }
  function chiudi() { if (el("pGiochi")) el("pGiochi").style.display = "none"; clearInterval(timerEsc); }
  function piastrelle() {
    clearInterval(timerEsc);
    el("giCorpo").innerHTML = `<div class="at-griglia">${[["indovina", "🧑‍🎤", "Indovina il personaggio", "Fly Aula pensa a un personaggio: la classe fa domande sì/no."], ["escape", "🔐", "Escape room", "5 lucchetti, 10 minuti: conti, date, parole, capitali."], ["sfida", "🏆", "Sfida tra classi", "La classifica della settimana tra le classi della scuola."]]
      .map(([k, i, t, d]) => `<button class="at-tile" data-k="${k}"><span class="at-i">${i}</span><b>${t}</b><span>${d}</span></button>`).join("")}</div><div class="riga-btn"><button class="btn sec" id="giChiudi">Chiudi</button></div>`;
    el("giCorpo").querySelectorAll("[data-k]").forEach(b => b.onclick = () => vai(b.dataset.k));
    el("giChiudi").onclick = chiudi;
  }
  const testa = (t, s = "") => `<div class="at-testa"><button class="btn sec at-indietro" id="giIndietro">← Giochi</button><h3>${t}</h3></div>${s ? `<p class="sotto">${s}</p>` : ""}`;
  function vai(k) { clearInterval(timerEsc); ({ indovina, escape: escapeRoom, sfida })[k](); const b = el("giIndietro"); if (b) b.onclick = piastrelle; }

  // =================== 🧑‍🎤 INDOVINA IL PERSONAGGIO ===================
  function indovina() {
    const tutti = typeof Attivita !== "undefined" ? Attivita.PERSONAGGI : [], m = el("materia").value;
    const vicini = tutti.filter(p => p[2].includes(m));
    const p = scegli(vicini.length >= 3 ? vicini : tutti);
    segreto = { nome: p[0], chi: p[1] }; domande = [];
    el("giCorpo").innerHTML = testa("🧑‍🎤 Indovina il personaggio", "Ho pensato a un personaggio famoso. Fate domande a cui si risponde <b>sì</b> o <b>no</b> (massimo 20). Quando pensate di saperlo, scrivete il nome.") +
      `<div class="riga-btn"><input id="giDom" class="at-input" maxlength="150" placeholder="es. È una donna? È vissuto prima del 1800?"><button class="btn" id="giChiedi">❓ Chiedi</button></div>
      <ol id="giLista" class="gi-lista"></ol>
      <div class="riga-btn"><input id="giNome" class="at-input" maxlength="60" placeholder="Il nome del personaggio"><button class="btn sec" id="giProva">🎯 È lui / lei?</button><button class="btn sec" id="giArrendo">🏳️ Mi arrendo</button></div><div id="giEsito"></div>
      <p class="nota-s">Le risposte sì/no le dà il cervello: può sbagliare. Il nome lo controlla Fly Aula.</p>`;
    const chiedi1 = async () => {
      const d = el("giDom").value.trim(); if (!d || !segreto) return;
      if (domande.length >= 20) { el("giEsito").innerHTML = `<p class="at-msg">Avete finito le 20 domande: provate a indovinare!</p>`; return; }
      const sic = controllaDomanda(d, el("materia").value); if (!sic.ok) { el("giEsito").innerHTML = `<p class="at-msg">${esc(sic.risposta)}</p>`; return; }
      if (!modello) return mostraAiuto();
      el("giChiedi").disabled = true;
      let r = "non lo so";
      try {
        const j = json(await cervello(`Gioco "indovina il personaggio" in una classe. Il personaggio segreto è ${segreto.nome} (${segreto.chi}). Rispondi alla domanda della classe con la verità storica.
NON dire mai il nome. Rispondi SOLO con JSON: {"risposta": "sì" oppure "no" oppure "non lo so"}`, d, { temperature: 0, format: "json" }));
        const x = norm(j.risposta); r = x.startsWith("si") ? "sì" : x.startsWith("no") && !x.startsWith("non") ? "no" : "non lo so";
      } catch (e) {}
      domande.push([d, r]); el("giDom").value = ""; el("giChiedi").disabled = false;
      el("giLista").innerHTML = domande.map(([q, a]) => `<li>${esc(q)} → <b class="${a === "sì" ? "si" : a === "no" ? "no" : ""}">${a}</b></li>`).join("");
    };
    el("giChiedi").onclick = chiedi1; el("giDom").onkeydown = e => { if (e.key === "Enter") chiedi1(); };
    const prova = () => {
      const g = norm(el("giNome").value); if (!g || !segreto) return;
      const parti = norm(segreto.nome).split(" ").filter(x => x.length > 2 && !["conte", "di", "del", "von", "de"].includes(x)), cognome = parti[parti.length - 1];
      // ✍️ anche scritto con un errore ("Garibaldy", "Leonardo da Vici") vale; un altro personaggio no
      const v = Quiz.valuta(el("giNome").value, { accettate: [segreto.nome, ...(cognome ? [cognome] : [])], gruppo: "personaggi" });
      if (g === norm(segreto.nome) || (cognome && g.split(" ").includes(cognome)) || v.voto === "giusta") {
        el("giEsito").innerHTML = `<p class="at-msg ok">🎉 Sì! Era <b>${esc(segreto.nome)}</b> (${esc(segreto.chi)}). Indovinato con ${domande.length} ${domande.length === 1 ? "domanda" : "domande"}!</p><div class="riga-btn"><button class="btn" id="giAncora">🔄 Un altro</button></div>`;
        puntiClasse(3); conta("indovinati"); segreto = null; el("giAncora").onclick = () => vai("indovina");
      } else el("giEsito").innerHTML = `<p class="at-msg">No, non è ${esc(el("giNome").value)}. Continuate!</p>`;
    };
    el("giProva").onclick = prova; el("giNome").onkeydown = e => { if (e.key === "Enter") prova(); };
    el("giArrendo").onclick = () => { if (!segreto) return; el("giEsito").innerHTML = `<p class="at-msg">Era <b>${esc(segreto.nome)}</b>: ${esc(segreto.chi)}.</p><div class="riga-btn"><button class="btn" id="giAncora">🔄 Un altro</button></div>`; segreto = null; el("giAncora").onclick = () => vai("indovina"); };
    return segreto;
  }

  // =================== 🔐 ESCAPE ROOM ===================
  function lucchetti() {
    const a = 12 + caso(30), b = 3 + caso(7), c = 5 + caso(40);
    const out = [{ tema: "🧮 Matematica", testo: `Quanto fa ${a} × ${b} + ${c}?`, r: a * b + c, mostra: String(a * b + c) }];
    for (const [k, nome] of [["storia", "🏛️ Storia"], ["geografia", "🌍 Geografia"], ["inglese", "🇬🇧 Inglese"], ["scienze", "🔬 Scienze"]]) {
      const q = typeof Precisione !== "undefined" ? Precisione.domandePer(k, 1)[0] : null;
      if (q) out.push({ tema: nome, testo: q.testo, r: q.r, accettate: q.accettate, mostra: String(q.mostra), sbagliate: q.sbagliate, gruppo: q.gruppo, lingua: q.lingua });
    }
    return out;
  }
  // ✍️ risposta scritta male? Fly Aula la capisce (refusi, inglese…) ma non regala niente: { voto: giusta | quasi | sbagliata }
  async function giusta(l, risposta) {
    if (l.accettate) return Quiz.valutaIntelligente(risposta, l);
    const x = leggiNumero(String(risposta).replace(/[^\d.,\-]/g, ""));
    return { voto: isFinite(x) && Math.abs(x - l.r) <= Math.max(0.011, Math.abs(l.r) * 1e-6) ? "giusta" : "sbagliata", forma: l.mostra };
  }
  function escapeRoom() {
    escape = { l: lucchetti(), i: 0, fine: Date.now() + 10 * 60000, aiuti: 0 };
    el("giCorpo").innerHTML = testa("🔐 Escape room", "Siete chiusi in classe! Per uscire aprite i 5 lucchetti prima che finisca il tempo. Ogni risposta giusta apre un lucchetto.") +
      `<div class="gi-luc" id="giLuc"></div><div class="at-timer" id="giTempo"></div><div id="giEnigma"></div>`;
    const giro = () => {
      const r = Math.max(0, Math.ceil((escape.fine - Date.now()) / 1000)), t = el("giTempo"); if (!t) return clearInterval(timerEsc);
      t.innerHTML = `<span>⏳</span><b class="${r <= 60 ? "fine" : ""}">${Math.floor(r / 60)}:${String(r % 60).padStart(2, "0")}</b>`;
      if (!r && escape.i < escape.l.length) { clearInterval(timerEsc); el("giEnigma").innerHTML = `<p class="at-msg">⌛ Tempo scaduto! Avete aperto ${escape.i} lucchetti su ${escape.l.length}.</p><div class="riga-btn"><button class="btn" id="giRiprova">🔄 Riprova</button></div>`; el("giRiprova").onclick = () => vai("escape"); }
    };
    giro(); clearInterval(timerEsc); timerEsc = setInterval(giro, 500);
    enigma();
  }
  function enigma() {
    const L = escape.l;
    el("giLuc").innerHTML = L.map((x, k) => `<span class="${k < escape.i ? "aperto" : k === escape.i ? "ora" : ""}">${k < escape.i ? "🔓" : "🔒"}</span>`).join("");
    if (escape.i >= L.length) {
      clearInterval(timerEsc);
      const sec = Math.round((Date.now() - (escape.fine - 10 * 60000)) / 1000);
      el("giEnigma").innerHTML = `<p class="at-msg ok">🎉 Siete usciti in ${Math.floor(sec / 60)} min e ${sec % 60} s${escape.aiuti ? ` (con ${escape.aiuti} ${escape.aiuti === 1 ? "aiuto" : "aiuti"})` : ""}!</p><div class="riga-btn"><button class="btn" id="giRiprova">🔄 Un'altra stanza</button></div>`;
      el("giRiprova").onclick = () => vai("escape"); conta("escape"); return;
    }
    const x = L[escape.i];
    el("giEnigma").innerHTML = `<p class="nota-s">Lucchetto ${escape.i + 1} di ${L.length} · ${esc(x.tema)}</p><p class="at-dom">${esc(x.testo)}</p>
      <div class="riga-btn"><input id="giRisp" class="at-input" maxlength="60" placeholder="La risposta" autocomplete="off"><button class="btn" id="giApri">🔑 Apri</button><button class="btn sec" id="giAiuto">💡 Aiuto</button></div><div id="giMsg"></div>`;
    let provando = false;
    const apri1 = async () => {
      const r = el("giRisp").value.trim(); if (!r || provando) return;
      provando = true; el("giMsg").innerHTML = `<p class="at-msg">🔑 Provo la chiave…</p>`;
      const v = await giusta(x, r); provando = false;
      if (!el("giMsg") || !escape || escape.l[escape.i] !== x) return;
      const nota = Quiz.commento(v, r);
      if (v.voto === "giusta") {
        escape.i++; puntiClasse(1); enigma();
        if (nota) { const m = el("giMsg"); if (m) m.innerHTML = `<p class="at-msg ok">🔓 Aperto! ${esc(nota)}</p>`; }
      } else if (v.voto === "quasi") { el("giMsg").innerHTML = `<p class="at-msg">🟡 Quasi! Il lucchetto si muove ma non si apre: ${esc(v.perche || "manca un pezzo")}. Riprova!</p>`; el("giRisp").select(); }
      else { el("giMsg").innerHTML = `<p class="at-msg">❌ Il lucchetto non si apre. Riprova!</p>`; el("giRisp").select(); }
    };
    el("giApri").onclick = apri1; el("giRisp").onkeydown = e => { if (e.key === "Enter") apri1(); };
    el("giAiuto").onclick = () => { escape.aiuti++; const s = x.mostra; el("giMsg").innerHTML = `<p class="at-msg">💡 Inizia con «${esc(s.slice(0, 1))}» ed è lunga ${s.replace(/\s/g, "").length} ${s.replace(/\s/g, "").length === 1 ? "carattere" : "caratteri"}.</p>`; };
    setTimeout(() => el("giRisp") && el("giRisp").focus(), 50);
  }

  // =================== 🏆 SFIDA TRA CLASSI ===================
  async function sfida() {
    el("giCorpo").innerHTML = testa("🏆 Sfida tra classi", "Ogni risposta giusta nei giochi (escape room, indovina il personaggio, INVALSI, trova l'errore) dà punti alla <b>classe</b>. Si riparte ogni lunedì. Niente nomi: solo le classi.") + `<div id="giClass" class="lavoro">🏆 Carico la classifica…</div>`;
    let j = null; try { const r = await fetch("/fa/sfida", { cache: "no-store" }); j = r.ok ? await r.json() : null; } catch (e) {}
    const l = j && Array.isArray(j.classifica) ? j.classifica : [], mia = el("classe").value.trim();
    el("giClass").className = "";
    el("giClass").innerHTML = l.length ? `<table class="cv-tab gi-class"><tbody>${l.slice(0, 30).map((x, i) => `<tr class="${x.classe === mia ? "mia" : ""}"><td>${["🥇", "🥈", "🥉"][i] || i + 1}</td><td><b>${esc(x.classe)}</b></td><td>${x.punti} punti</td></tr>`).join("")}</tbody></table>`
      : `<p class="sotto">Ancora nessun punto questa settimana: giocate all'escape room per cominciare!</p>`;
    return l;
  }

  // =================== 🫧 UN MINUTO DI RESPIRO ===================
  let respiroT = null;
  function respiro() {
    let o = el("respiro");
    if (!o) { o = document.createElement("div"); o.id = "respiro"; o.innerHTML = `<div class="re-cerchio" id="reCerchio"></div><div class="re-testo" id="reTesto"></div><div class="re-tempo" id="reTempo"></div><button class="btn sec" id="reChiudi">Chiudi</button>`; document.body.appendChild(o); el("reChiudi").onclick = fineRespiro; }
    o.classList.add("on"); const inizio = Date.now();
    const fasi = [["Inspira…", 4000, 1.6], ["Trattieni…", 2000, 1.6], ["Espira piano…", 6000, 1]];
    const passo = () => {
      const t = Date.now() - inizio, resto = Math.max(0, 60 - Math.floor(t / 1000));
      el("reTempo").textContent = resto ? `${resto} s` : "";
      if (t >= 60000) { el("reTesto").textContent = "Bravi 🙂 Si ricomincia con calma."; el("reCerchio").style.transform = "scale(1)"; clearInterval(respiroT); conta("respiri"); return; }
      let x = t % 12000;
      for (const [testo, dur, sc] of fasi) { if (x < dur) { if (el("reTesto").textContent !== testo) { el("reTesto").textContent = testo; el("reCerchio").style.transition = `transform ${dur}ms ease-in-out`; el("reCerchio").style.transform = `scale(${sc})`; } break; } x -= dur; }
    };
    clearInterval(respiroT); el("reTesto").textContent = ""; passo(); respiroT = setInterval(passo, 200);
  }
  function fineRespiro() { clearInterval(respiroT); const o = el("respiro"); if (o) o.classList.remove("on"); }
  document.addEventListener("keydown", e => { if (e.key === "Escape" && el("respiro") && el("respiro").classList.contains("on")) fineRespiro(); });

  return { apri, chiudi, respiro, fineRespiro, giusta, lucchetti, get segreto() { return segreto; }, get escape() { return escape; } };
})();
