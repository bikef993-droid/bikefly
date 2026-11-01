// ===================================================================
//  FLY AULA · versione scuola
//  Tre modi:
//   - "singolo": il cervello è su questo computer (come sul Razer)
//   - LIM collegata al server: Fly Aula arriva dal server della scuola e usa
//     il SUO cervello; se non risponde passa da sola al server di riserva
//   - "server": il computer della segreteria che fa da cervello per tutti
//  La LIM sa in che aula è (scritto una volta all'installazione):
//  dal server prende l'orario di quell'aula, e le foto delle pagine.
// ===================================================================
const Scuola = (() => {
  const LOCALE = "http://localhost:11434";
  const st = { ruolo: "singolo", nome: "", aula: "", cervelli: [LOCALE], attivo: 0, riserva: false, info: null };
  const qui = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(location.hostname);
  const ricorda = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };

  // l'aula arriva dal collegamento della LIM (?aula=1ªA) e resta salvata
  const param = new URLSearchParams(location.search).get("aula");
  if (param) ricorda("flyaula_aula", param.slice(0, 20));
  st.aula = ricorda("flyaula_aula") || "";
  // il codice delle LIM (dal collegamento della LIM: ?c=123456): serve per scrivere nella memoria delle risposte
  const codice = new URLSearchParams(location.search).get("c");
  if (codice && /^\d{6}$/.test(codice)) {
    ricorda("flyaula_codice_lim", codice);
    try { const u = new URL(location.href); u.searchParams.delete("c"); history.replaceState(null, "", u); } catch (e) {}
  }

  async function avvia() {
    try {
      const r = await fetch("/fa/scuola" + (st.aula ? "?aula=" + encodeURIComponent(st.aula) : ""), { cache: "no-store" });
      if (r.ok) st.info = await r.json();
    } catch (e) {}
    if (st.info && st.info.ruolo === "server") {
      st.ruolo = qui ? "server" : "lim";
      st.nome = st.info.nome || "";
      const principale = qui ? LOCALE : `http://${location.hostname}:11434`;
      st.cervelli = [principale];
      if (st.info.riserva) st.cervelli.push(st.info.riserva.startsWith("http") ? st.info.riserva : `http://${st.info.riserva}:11434`);
      await caricaOrario();
      setInterval(caricaOrario, 10 * 60000);
    }
    // 🧩 le parole d'allarme che la scuola aggiunge dalla pagina del server arrivano entro 10 minuti
    setInterval(async () => {
      try { const r = await fetch("/fa/scuola", { cache: "no-store" }); if (r.ok && st.info) { st.info.parole = (await r.json()).parole; if (typeof impostaParoleAllarme === "function") impostaParoleAllarme(Scuola.paroleAllarme); } } catch (e) {}
    }, 10 * 60000);
    return st;
  }
  // l'orario dell'aula lo gestisce la segreteria sul server: qui se ne tiene una copia
  async function caricaOrario() {
    if (!st.aula || st.ruolo === "singolo") return;
    try {
      const r = await fetch("/fa/orario?aula=" + encodeURIComponent(st.aula), { cache: "no-store" });
      if (r.ok) { const o = await r.json(); if (o && o.griglia) ricorda("flyaula_orario", JSON.stringify(o)); }
    } catch (e) {}
  }

  // un "ci sei?" veloce al cervello (2,5 secondi al massimo)
  let ultimoOk = 0;
  async function risponde(base) {
    const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), 2500);
    try { const r = await fetch(base + "/api/version", { signal: ctrl.signal, cache: "no-store" }); clearTimeout(t); return r.ok; }
    catch (e) { clearTimeout(t); return false; }
  }
  function passaA(k) { st.attivo = k; st.riserva = k !== 0; aggiornaStato(); }
  // tutte le chiamate al cervello passano da qui: se il server non risponde, si passa alla riserva
  async function chiama(percorso, opzioni = {}) {
    if (st.cervelli.length > 1) {
      // ogni tanto si riprova il principale (magari è tornato acceso)
      if (st.attivo !== 0 && Date.now() - ultimoOk > 60000 && await risponde(st.cervelli[0])) passaA(0);
      if (Date.now() - ultimoOk > 20000 && !(await risponde(st.cervelli[st.attivo]))) {
        const altro = st.cervelli.findIndex((b, k) => k !== st.attivo);
        if (altro >= 0 && await risponde(st.cervelli[altro])) passaA(altro);
      }
    }
    try {
      const r = await fetch(st.cervelli[st.attivo] + percorso, opzioni);
      ultimoOk = Date.now();
      return r;
    } catch (e) {
      if (e.name === "AbortError" || st.cervelli.length < 2) throw e;   // fermata dal prof: non è un guasto
      // caduto proprio adesso: un tentativo sull'altro
      const altro = (st.attivo + 1) % st.cervelli.length;
      passaA(altro);
      const r = await fetch(st.cervelli[altro] + percorso, opzioni);
      ultimoOk = Date.now();
      return r;
    }
  }
  function aggiornaStato() { if (window.aggiornaEtichettaStato) window.aggiornaEtichettaStato(); }

  return {
    avvia, chiama, caricaOrario,
    get ruolo() { return st.ruolo; }, get aula() { return st.aula; }, get nome() { return st.nome; },
    get suRiserva() { return st.riserva; }, get riposo() { return Number(st.info && st.info.riposo) || 0; }, get paroleAllarme() { try { const x = st.info && st.info.parole; return x ? JSON.parse(x) : []; } catch (e) { return []; } }, get cervelloScelto() { return (st.info && st.info.cervello) || ""; },
    get secondoScelto() { return (st.info && st.info.cervello2) || ""; }, get vram() { return Number(st.info && st.info.vram) || 0; }, get cervelliMateria() { if (st.cm !== undefined) return st.cm; try { const x = st.info && st.info.materie; return x ? JSON.parse(x) : null; } catch (e) { return null; } }, impostaCervelliMateria(p) { st.cm = p; }, get marca() { return (st.info && st.info.marca) || ""; }, get scheda() { return (st.info && st.info.scheda) || ""; }, get codiceLim() { return ricorda("flyaula_codice_lim") || ""; }, get parallelo() { return Number(st.info && st.info.parallelo) || 0; }, get base() { return st.cervelli[st.attivo]; },
    parAula: () => st.aula ? "aula=" + encodeURIComponent(st.aula) : ""
  };
})();
