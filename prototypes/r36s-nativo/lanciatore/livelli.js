'use strict';
/*
 * lanciatore/livelli.js — la scala della qualità, dal più bello al più veloce, e il regolatore automatico.
 *
 * Uno SCALINO fissa la risoluzione interna del palco (scala) e i tagli di scena (finto-browser.js →
 * impostaTagli). I tre livelli fissi «bello», «medio», «veloce» sono tre scalini; con "livello": "auto"
 * (di partenza) il lanciatore misura il tempo vero dei fotogrammi e sale o scende da solo fra gli scalini
 * per tenere i fotogrammi al secondo voluti, senza scendere sotto la scala in cui le scritte si leggono
 * ancora ("scalaMinima", di partenza 0.625 = 400×225; a 0.75 si leggono bene, a 0.5 no). In impostazioni.json si possono anche fissare "scala", "fps", "tagli".
 */
const T1 = { velo: true, riflessi: true };
const T2 = { velo: true, riflessi: true, luci: true };
const T3 = { velo: true, riflessi: true, luci: true, particelle: true, crollo: true };
const T4 = { velo: true, riflessi: true, luci: true, particelle: true, crollo: true, atmosfera: true };
const SCALINI = Object.freeze([
  { scala: 1, tagli: {} },          // 0 «bello»
  { scala: 1, tagli: T1 },          // 1
  { scala: 1, tagli: T2 },          // 2
  { scala: 0.875, tagli: T2 },      // 3
  { scala: 0.75, tagli: T2 },       // 4 «medio»: il più basso in cui le scritte si leggono bene
  { scala: 0.75, tagli: T3 },       // 5
  { scala: 0.625, tagli: T3 },      // 6
  { scala: 0.625, tagli: T4 },      // 7
  { scala: 0.5, tagli: T4 },        // 8 «veloce»: le scritte piccole non si leggono
]);
const FISSI = Object.freeze({ bello: 0, medio: 4, veloce: 8 });
/** I livelli fissi nella forma del secondo giro (li usa la misura). */
const LIVELLI = Object.freeze({
  bello: { scala: SCALINI[0].scala, fps: 30, liscio: false, tagli: SCALINI[0].tagli },
  medio: { scala: SCALINI[4].scala, fps: 30, liscio: true, tagli: SCALINI[4].tagli },
  veloce: { scala: SCALINI[8].scala, fps: 30, liscio: true, tagli: SCALINI[8].tagli },
});
const FPS_AMMESSI = [20, 30, 40, 60];

/** Le scelte effettive lette da impostazioni.json. */
function risolviLivello(imp) {
  const auto = imp.livello === undefined || imp.livello === 'auto';
  const nome = auto ? 'auto' : (FISSI[imp.livello] !== undefined ? imp.livello : 'medio');
  const voluti = Number(imp.fps) || 30;
  const fps = FPS_AMMESSI.reduce((m, v) => (Math.abs(v - voluti) < Math.abs(m - voluti) ? v : m), 30);
  const scalaMinima = Math.max(0.5, Math.min(1, Number(imp.scalaMinima) || 0.625));
  let ultimo = SCALINI.length - 1;
  while (ultimo > 0 && SCALINI[ultimo].scala < scalaMinima - 1e-6) ultimo--;
  const partenza = auto ? Math.min(ultimo, FISSI.medio) : FISSI[nome];
  const schermo = imp.schermo || {};
  return {
    nome, auto, fps, scalaMinima, primo: 0, ultimo: auto ? ultimo : partenza, partenza,
    menu: auto ? 2 : partenza, // il menu è fatto di scritte e sta quasi fermo: lì conta leggerle, non la velocità
    scalaFissa: imp.scala !== undefined ? Number(imp.scala) : null,
    tagliFissi: imp.tagli || null,
    liscio: schermo.liscio !== undefined ? Boolean(schermo.liscio) : true,
  };
}

/**
 * Il regolatore: tiene uno scalino per tipo di scena (menu, piazza, stanze: costano in modo molto diverso)
 * e decide quando cambiarlo. Scende in fretta se i fotogrammi sforano, sale piano se avanza tempo; se una
 * salita viene subito rimangiata, quello scalino resta chiuso per un po' (sempre di più).
 *   nota(scena, lavoroMs, intervalloMs, oraMs) → null, oppure { da, a, motivo } quando cambia scalino
 */
function creaRegolatore(liv, periodoMs) {
  const scene = new Map();
  const C = { finestraMs: 1500, minFot: 12, giu: 0.88, su: 0.5, attesaSuMs: 6000, assestamentoMs: 1200, pentimentoMs: 15000, chiusuraMs: 45000 };
  function statoDi(scena, ora) {
    let s = scene.get(scena);
    if (!s) { s = { indice: scena === 'menu' ? liv.menu : liv.partenza, da: ora + C.assestamentoMs, n: 0, lavoro: 0, sforati: 0, beneDa: 0, chiusi: {}, salitoA: 0, salitoIl: 0, volteGiu: {} }; scene.set(scena, s); }
    return s;
  }
  function azzera(s, ora) { s.da = ora + C.assestamentoMs; s.n = 0; s.lavoro = 0; s.sforati = 0; s.beneDa = 0; }
  return {
    scalino(scena, ora) { return statoDi(scena, ora).indice; },
    /** Quando si cambia scena i conti ripartono (le cache si rifanno: i primi fotogrammi non contano). */
    cambiaScena(scena, ora) { azzera(statoDi(scena, ora), ora); },
    nota(scena, lavoroMs, intervalloMs, ora) {
      if (!liv.auto || scena === 'menu') return null;
      const s = statoDi(scena, ora);
      if (ora < s.da) return null;
      s.n++; s.lavoro += lavoroMs; if (intervalloMs > periodoMs * 1.25) s.sforati++;
      if (ora - s.da < C.finestraMs || s.n < C.minFot) return null;
      const medio = s.lavoro / s.n; const quota = s.sforati / s.n;
      const finestraDa = s.da;
      s.da = ora; s.n = 0; s.lavoro = 0; s.sforati = 0;
      const troppo = medio > periodoMs * C.giu || quota > 0.2;
      if (troppo) {
        s.beneDa = 0;
        if (s.indice >= liv.ultimo) return null;
        const da = s.indice; s.indice++;
        if (s.salitoA === da && ora - s.salitoIl < C.pentimentoMs) { s.volteGiu[da] = (s.volteGiu[da] || 0) + 1; s.chiusi[da] = ora + C.chiusuraMs * Math.pow(2, s.volteGiu[da] - 1); }
        azzera(s, ora);
        return { da, a: s.indice, motivo: `lavoro medio ${medio.toFixed(1)} ms su ${periodoMs.toFixed(1)} disponibili, ${Math.round(quota * 100)}% dei fotogrammi in ritardo` };
      }
      const largo = medio < periodoMs * C.su && quota < 0.03;
      if (!largo) { s.beneDa = 0; return null; }
      if (!s.beneDa) s.beneDa = finestraDa;
      if (ora - s.beneDa < C.attesaSuMs || s.indice <= liv.primo) return null;
      const a = s.indice - 1;
      if (s.chiusi[a] && ora < s.chiusi[a]) return null;
      const da = s.indice; s.indice = a; s.salitoA = a; s.salitoIl = ora;
      azzera(s, ora);
      return { da, a, motivo: `lavoro medio ${medio.toFixed(1)} ms su ${periodoMs.toFixed(1)}: c'è margine` };
    },
  };
}

module.exports = { SCALINI, FISSI, LIVELLI, FPS_AMMESSI, risolviLivello, creaRegolatore };
