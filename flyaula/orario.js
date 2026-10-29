// ===================================================================
//  FLY AULA · orario automatico
//  La segreteria (o il prof) carica l'orario una volta: Fly Aula sa da sola
//  che classe è, che materia c'è e quando finisce l'ora.
// ===================================================================
const GIORNI = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
const ORE_STANDARD = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00"];   // inizio di ogni ora (si possono cambiare)
const MATERIE_ORARIO = ["", "Matematica", "Economia aziendale", "Italiano", "Storia", "Inglese", "Seconda lingua", "Diritto", "Economia politica", "Informatica", "Scienze motorie", "Religione", "Geografia", "Scienze", "Fisica", "Chimica", "Altro"];
const MATERIA_ATTIVA = { "Matematica": "matematica", "Economia aziendale": "economia", "Inglese": "inglese" };   // le materie che Fly Aula sa già

const Orario = {
  dati() { try { return JSON.parse(localStorage.getItem("flyaula_orario") || "null"); } catch (e) { return null; } },
  salva(d) { try { localStorage.setItem("flyaula_orario", JSON.stringify(d)); } catch (e) {} },
  vuoto(classe) { return { classe, ore: [...ORE_STANDARD], durataMin: 60, griglia: GIORNI.map(() => ORE_STANDARD.map(() => "")) }; },

  // che lezione c'è adesso? → { classe, materia, chiave, fine (Date) } oppure null
  adesso(quando = new Date()) {
    const d = this.dati(); if (!d) return null;
    const g = quando.getDay() - 1; if (g < 0 || g > 5) return null;
    const min = quando.getHours() * 60 + quando.getMinutes();
    for (let i = 0; i < d.ore.length; i++) {
      const [h, m] = d.ore[i].split(":").map(Number), inizio = h * 60 + m, fine = inizio + (d.durataMin || 60);
      if (min >= inizio && min < fine) {
        // ore uguali di seguito (es. 2 ore di matematica) = una lezione sola
        let ultima = i; while (ultima + 1 < d.ore.length && d.griglia[g][ultima + 1] && d.griglia[g][ultima + 1] === d.griglia[g][i]) ultima++;
        const [h2, m2] = d.ore[ultima].split(":").map(Number), f = new Date(quando); f.setHours(h2, m2 + (d.durataMin || 60), 0, 0);
        const materia = d.griglia[g][i];
        return materia ? { classe: d.classe, materia, chiave: MATERIA_ATTIVA[materia] || null, fine: f } : null;
      }
    }
    return null;
  },

  // pannello per scrivere l'orario (una tabella con i menu a tendina)
  disegnaEditor(el) {
    const d = this.dati() || this.vuoto(document.getElementById("classe").value || "3ªB");
    const opz = v => MATERIE_ORARIO.map(m => `<option ${m === v ? "selected" : ""}>${m}</option>`).join("");
    el.innerHTML = `
      <div class="riga-btn"><label>Classe <input class="pill" id="orClasse" value="${d.classe}" style="width:90px"></label>
        <label>Durata di un'ora <select class="pill" id="orDurata">${[50, 55, 60].map(x => `<option ${x === d.durataMin ? "selected" : ""} value="${x}">${x} min</option>`).join("")}</select></label></div>
      <table class="tab-orario"><thead><tr><th>Ora</th>${GIORNI.map(g => `<th>${g}</th>`).join("")}</tr></thead><tbody>
      ${d.ore.map((o, i) => `<tr><td><input class="ora" data-i="${i}" value="${o}" maxlength="5"></td>${GIORNI.map((_, g) => `<td><select class="cellao" data-g="${g}" data-i="${i}">${opz(d.griglia[g][i])}</select></td>`).join("")}</tr>`).join("")}
      </tbody></table>
      <p class="nota" style="text-align:left">Le materie in <b>verde</b> Fly Aula le sa già: in quelle ore si accende da sola. Due ore uguali di seguito diventano una lezione sola.</p>`;
    const colora = () => el.querySelectorAll(".cellao").forEach(s => s.classList.toggle("attiva", !!MATERIA_ATTIVA[s.value]));
    colora();
    el.onchange = () => {
      const n = { classe: el.querySelector("#orClasse").value.trim() || "Classe", durataMin: +el.querySelector("#orDurata").value,
        ore: [...el.querySelectorAll(".ora")].map(x => /^\d{1,2}:\d{2}$/.test(x.value) ? x.value.padStart(5, "0") : "08:00"),
        griglia: GIORNI.map((_, g) => [...el.querySelectorAll(`.cellao[data-g="${g}"]`)].map(s => s.value)) };
      this.salva(n); colora();
    };
  }
};
