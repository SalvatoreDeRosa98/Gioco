'use strict';
/*
 * lanciatore/livelli.js — i tre livelli di qualità del lanciatore, dal più bello al più veloce.
 *
 * Un livello fissa: la risoluzione interna del palco (scala), i fotogrammi al secondo voluti (la logica
 * resta sempre a 60 passi al secondo), i tagli di scena (finto-browser.js → impostaTagli) e se lo schermo
 * ingrandisce in modo liscio. In impostazioni.json si sceglie con "livello": "…" e, volendo, si cambia una
 * singola voce ("scala", "fps", "tagli": { … }) che vince sul livello.
 */
const LIVELLI = Object.freeze({
  bello: { scala: 1, fps: 30, liscio: false, tagli: {} },
  medio: { scala: 0.75, fps: 20, liscio: true, tagli: { luci: true, riflessi: true, velo: true } },
  veloce: { scala: 0.5, fps: 20, liscio: true, tagli: { luci: true, riflessi: true, atmosfera: true, particelle: true, crollo: true } },
});

/** Le scelte effettive: il livello di impostazioni.json più le voci singole che lo correggono. */
function risolviLivello(imp) {
  const nome = LIVELLI[imp.livello] ? imp.livello : 'medio';
  const base = LIVELLI[nome];
  const schermo = imp.schermo || {};
  return {
    nome,
    scala: imp.scala !== undefined ? Number(imp.scala) : base.scala,
    fps: Math.max(5, Math.min(60, Number(imp.fps !== undefined ? imp.fps : base.fps))),
    liscio: schermo.liscio !== undefined ? Boolean(schermo.liscio) : base.liscio,
    tagli: Object.assign({}, base.tagli, imp.tagli || {}),
  };
}

module.exports = { LIVELLI, risolviLivello };
