// ===================================================================
//  FLY AULA · voce offline
//  Ascoltare: Whisper gira DENTRO il computer (scheda video), l'audio non esce mai.
//  Parlare: la voce italiana di Windows, già sul computer.
//  La prima volta il modello Whisper (~250 MB) si scarica e resta salvato.
// ===================================================================
const Voce = {
  trascrittore: null, caricamento: null, registratore: null, pezzi: [], attivo: false,

  async prepara(avanzamento) {
    if (this.trascrittore) return this.trascrittore;
    if (this.caricamento) return this.caricamento;
    this.caricamento = (async () => {
      const { pipeline, env } = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2");
      env.allowLocalModels = false;
      const opzioni = { progress_callback: p => { if (p.status === "progress" && avanzamento) avanzamento(Math.round(p.progress || 0)); } };
      try {
        if (!navigator.gpu) throw new Error("niente WebGPU");
        this.trascrittore = await pipeline("automatic-speech-recognition", "onnx-community/whisper-small", { ...opzioni, device: "webgpu", dtype: { encoder_model: "fp32", decoder_model_merged: "q4" } });
      } catch (e) {
        this.trascrittore = await pipeline("automatic-speech-recognition", "Xenova/whisper-small", opzioni);   // processore (più lento)
      }
      return this.trascrittore;
    })();
    return this.caricamento;
  },

  async inizia() {
    const flusso = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
    this.pezzi = [];
    this.registratore = new MediaRecorder(flusso);
    this.registratore.ondataavailable = e => e.data.size && this.pezzi.push(e.data);
    this.registratore.start();
    this.attivo = true;
    this.limite = setTimeout(() => this.attivo && this.ferma(), 20000);   // al massimo 20 secondi
  },

  ferma() {
    return new Promise(ok => {
      clearTimeout(this.limite);
      if (!this.registratore) return ok(null);
      this.registratore.onstop = async () => {
        this.registratore.stream.getTracks().forEach(t => t.stop());
        this.attivo = false;
        const blob = new Blob(this.pezzi, { type: this.registratore.mimeType });
        const ctx = new AudioContext({ sampleRate: 16000 });
        const audio = await ctx.decodeAudioData(await blob.arrayBuffer());
        ctx.close();
        ok(audio.getChannelData(0));
      };
      this.registratore.stop();
    });
  },

  async trascrivi(campioni) {
    const t = await this.prepara();
    const r = await t(campioni, { language: "italian", task: "transcribe", chunk_length_s: 30 });
    return (r.text || "").trim();
  },

  // ---- parlare (voce di Windows, offline) ----
  // Nelle lingue straniere le parole in **grassetto** (quelle in francese, inglese…) si leggono con la voce di QUELLA lingua,
  // il resto con la voce italiana. Se sul computer la voce straniera non c'è, si legge tutto in italiano.
  LINGUE: { inglese: "en-GB", francese: "fr-FR", spagnolo: "es-ES", tedesco: "de-DE", cinese: "zh-CN" },
  voce(lang) {
    const tutte = speechSynthesis.getVoices(), base = lang.slice(0, 2).toLowerCase();
    const giuste = tutte.filter(v => v.lang && v.lang.toLowerCase().replace("_", "-") === lang.toLowerCase());
    const simili = tutte.filter(v => v.lang && v.lang.toLowerCase().startsWith(base));
    const l = giuste.length ? giuste : simili;
    return l.find(v => v.localService) || l[0] || null;   // prima quelle sul computer (offline)
  },
  pulisci(t) {
    return t.replace(/\[DISEGNO:[^\]]*\]/gi, "").replace(/<[^>]+>/g, "")
      .replace(/×/g, " per ").replace(/(\d)\s*:\s*(\d)/g, "$1 diviso $2").replace(/−/g, " meno ").replace(/=/g, " uguale ")
      .replace(/(\d)\/(\d)/g, "$1 su $2").replace(/[*#_]/g, "").replace(/\n\s*(\d+)[.)]\s+/g, ". ").replace(/✓ calcolatrice|✎ corretto dalla calcolatrice/g, "");
  },
  // il testo in pezzi: [{ t, lang }]. "**bonjour** (buongiorno)" → bonjour in francese, (buongiorno) in italiano
  pezzi(testo, materia = "") {
    const straniera = this.LINGUE[materia];
    if (!straniera || !this.voce(straniera)) return [{ t: this.pulisci(testo), lang: "it-IT" }];
    const out = [];
    String(testo).split(/(\*\*[^*]+\*\*|<b>[^<]+<\/b>)/).forEach(x => {
      if (!x.trim()) return;
      const g = x.match(/^(?:\*\*([^*]+)\*\*|<b>([^<]+)<\/b>)$/);
      const t = this.pulisci(g ? (g[1] || g[2]) : x);
      if (t.trim()) out.push({ t, lang: g ? straniera : "it-IT" });
    });
    return out;
  },
  parla(pezzi, fine = () => {}, piano = false) {
    if (!pezzi.length) return fine();
    pezzi.forEach((p, i) => {
      const u = new SpeechSynthesisUtterance(p.t);
      u.lang = p.lang; u.rate = piano ? 0.88 : (p.lang === "it-IT" ? 0.97 : 0.9);   // la lingua straniera un po' più lenta
      const v = this.voce(p.lang) || this.voce("it-IT"); if (v) u.voice = v;
      if (i === pezzi.length - 1) { u.onend = fine; u.onerror = fine; }
      speechSynthesis.speak(u);
    });
  },
  leggiAdAltaVoce(testo, materia = "") {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    this.parla(this.pezzi(testo, materia));
  },
  zitto() { if ("speechSynthesis" in window) speechSynthesis.cancel(); }
};
