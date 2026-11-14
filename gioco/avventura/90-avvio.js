/*
 * avventura/90-avvio.js — Avvio dell'avventura: caricati il motore e la storia, accende l'interfaccia sul canvas.
 * Gli errori dei dati incontrati al caricamento sono già in console (righe rosse) e in AV.errori.
 */
(function (AV) {
  'use strict';
  function parti() {
    const c = document.getElementById('scena');
    if (!c) { AV.errore('manca il canvas #scena'); return; }
    if (!AV.dati.quadro.size) AV.errore('nessun quadro caricato: la storia (avventura/storia/*.js) non c\'è');
    AV.UI.avvia(c);
    window.__avventura = { AV, G: AV.UI.G, UI: AV.UI };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', parti); else parti();
})(AV);
