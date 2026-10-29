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
  leggiAdAltaVoce(testo) {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const pulito = testo.replace(/\[DISEGNO:[^\]]*\]/gi, "").replace(/<[^>]+>/g, "")
      .replace(/×/g, " per ").replace(/(\d)\s*:\s*(\d)/g, "$1 diviso $2").replace(/−/g, " meno ").replace(/=/g, " uguale ")
      .replace(/(\d)\/(\d)/g, "$1 su $2").replace(/[*#_]/g, "").replace(/\n\s*(\d+)[.)]\s+/g, ". ");
    const u = new SpeechSynthesisUtterance(pulito);
    u.lang = "it-IT"; u.rate = 0.97;
    const voci = speechSynthesis.getVoices().filter(v => v.lang && v.lang.toLowerCase().startsWith("it"));
    u.voice = voci.find(v => v.localService) || voci[0] || null;   // prima quelle sul computer (offline)
    speechSynthesis.speak(u);
  },
  zitto() { if ("speechSynthesis" in window) speechSynthesis.cancel(); }
};
