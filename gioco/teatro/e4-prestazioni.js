/*
 * teatro/e4-prestazioni.js — qualità automatica sul telefono (squadra e4, profilo delle prestazioni).
 *
 * Se la media mobile del fotogramma resta sopra il bersaglio per qualche secondo, spegne uno alla volta, nell'ordine,
 * grana → ombre lunghe → pubblico animato → vignetta; se torna margine li riaccende in ordine inverso.
 * Vale solo per la sessione, come il fusibile di 000-errori.js: OPZIONI cambia in memoria ma salvaOpzioni() scrive
 * sempre i valori del giocatore. Non tocca ciò che il giocatore ha spento a mano, e se il giocatore cambia a mano
 * un effetto spento da qui, quell'effetto non viene più toccato per la sessione.
 * Riga «Qualità automatica» nel menu Opzioni (pagina scena, dopo «Ombre lunghe») per disattivarla.
 * Attiva solo coi comandi a tocco (puntatore grossolano o b3.dispositivo === 'tocco') e non sotto le prove
 * automatiche (navigator.webdriver), che girano su macchine cariche e misurano gli strati: la sonda
 * `interni.qualitaAutoE4.forza(true)` la accende per le prove.
 * Caricato dopo l'ultimo teatro/d*.js. Agganci: avvolge disegnaFrame, salvaOpzioni, impostaOpzioneB3, righeB3.
 */
'use strict';

/** Numeri della regolazione. Misure e motivi in production/polish/teatro-report-2026-11-11.md. */
const QUALITA_E4 = Object.freeze({
  ordine: Object.freeze(['grana', 'ombre', 'pubblico', 'vignetta']), // dal meno visibile al più caro da perdere
  bersaglioMs: 22,        // media mobile sopra questo (≈ 45 fps) → si spegne il prossimo effetto
  margineMs: 17.5,        // media mobile sotto questo (≈ 57 fps) → si riaccende l'ultimo spento
  pesoMedia: 0.05,        // media mobile esponenziale: ~20 fotogrammi
  attesaSpegniMs: 3000,   // per quanto la media deve restare alta prima di spegnere
  attesaAccendiMs: 8000,  // per quanto deve restare bassa prima di riaccendere (raddoppia a ogni ricaduta)
  attesaMassimaMs: 64000,
  ricadutaMs: 6000,       // se entro questo tempo dal riacceso si deve rispegnere, l'attesa raddoppia
  salto: 250,             // intervalli più lunghi (scheda nascosta, caricamento) non contano
});

const RIGA_E4 = Object.freeze({
  id: 'qualitaAuto', tipo: 'spunta', nome: 'Qualità automatica',
  nota: 'Sul telefono, se il teatro rallenta spegne da sé grana, ombre lunghe, pubblico e vignetta, e li riaccende quando torna fluido.',
});

if (OPZIONI.qualitaAuto === undefined) OPZIONI.qualitaAuto = true;

const e4 = {
  forzata: null,          // sonda QA: true/false sostituisce il riconoscimento del telefono
  media: null,            // media mobile del fotogramma (ms)
  ultimo: null,           // performance.now() del fotogramma precedente
  altaDa: null, bassaDa: null,
  spenti: [],             // effetti spenti da qui, in ordine
  toccati: new Set(),     // effetti cambiati a mano dal giocatore: mai più toccati in sessione
  attesaAccendi: QUALITA_E4.attesaAccendiMs,
  ultimoAcceso: -1e9,
  cambi: 0,
};

/** true se la regolazione deve lavorare su questo dispositivo. */
function qualitaAutoAttivaE4() {
  if (OPZIONI.qualitaAuto === false) return false;
  if (e4.forzata !== null) return e4.forzata;
  if (typeof navigator !== 'undefined' && navigator.webdriver) return false;
  try { if (typeof b3 === 'object' && b3 && b3.dispositivo === 'tocco') return true; } catch (_) { /* b3 assente */ }
  try { return Boolean(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); } catch (_) { return false; }
}

/** Riaccende tutto ciò che è stato spento da qui (regolazione disattivata o sonda). */
function riaccendiTuttoE4() {
  while (e4.spenti.length) { const k = e4.spenti.pop(); if (!e4.toccati.has(k)) OPZIONI[k] = true; }
}

/**
 * Un passo della regolazione: chiamato a ogni fotogramma col tempo corrente (ms).
 * @param {number} ora performance.now()
 */
function passoQualitaE4(ora) {
  const Q = QUALITA_E4;
  if (!qualitaAutoAttivaE4()) { if (e4.spenti.length) riaccendiTuttoE4(); e4.ultimo = ora; e4.media = null; return; }
  const dt = e4.ultimo === null ? null : ora - e4.ultimo;
  e4.ultimo = ora;
  if (dt === null || dt <= 0 || dt > Q.salto) return;
  e4.media = e4.media === null ? dt : e4.media + (dt - e4.media) * Q.pesoMedia;
  if (e4.media > Q.bersaglioMs) {
    e4.bassaDa = null;
    if (e4.altaDa === null) e4.altaDa = ora;
    if (ora - e4.altaDa < Q.attesaSpegniMs) return;
    e4.altaDa = null;
    const k = Q.ordine.find((x) => OPZIONI[x] !== false && !e4.toccati.has(x));
    if (!k) return;
    if (ora - e4.ultimoAcceso < Q.ricadutaMs) e4.attesaAccendi = Math.min(Q.attesaMassimaMs, e4.attesaAccendi * 2);
    OPZIONI[k] = false; e4.spenti.push(k); e4.cambi++;
    e4.media = Q.margineMs + (Q.bersaglioMs - Q.margineMs) / 2; // si riparte a metà: il prossimo passo si giudica da capo
  } else if (e4.media < Q.margineMs && e4.spenti.length) {
    e4.altaDa = null;
    if (e4.bassaDa === null) e4.bassaDa = ora;
    if (ora - e4.bassaDa < e4.attesaAccendi) return;
    e4.bassaDa = null;
    const k = e4.spenti.pop();
    if (!e4.toccati.has(k)) { OPZIONI[k] = true; e4.cambi++; }
    e4.ultimoAcceso = ora;
  } else { e4.altaDa = null; e4.bassaDa = null; }
}

const disegnaFrameBaseE4 = disegnaFrame;
disegnaFrame = function disegnaFrameE4(...a) {
  try { passoQualitaE4(performance.now()); } catch (err) { console.error('[e4] qualità automatica', err); }
  return disegnaFrameBaseE4.apply(this, a);
};

// Le opzioni salvate restano quelle del giocatore: mentre si salva, gli effetti spenti da qui tornano accesi.
const salvaOpzioniBaseE4 = salvaOpzioni;
salvaOpzioni = function salvaOpzioniE4(...a) {
  const miei = e4.spenti.filter((k) => !e4.toccati.has(k) && OPZIONI[k] === false);
  for (const k of miei) OPZIONI[k] = true;
  try { return salvaOpzioniBaseE4.apply(this, a); } finally { for (const k of miei) OPZIONI[k] = false; }
};

// Un effetto cambiato a mano dal giocatore non si tocca più (per la sessione).
if (typeof impostaOpzioneB3 === 'function') {
  const impostaOpzioneBaseE4 = impostaOpzioneB3;
  impostaOpzioneB3 = function impostaOpzioneE4(id, valore, ...r) {
    if (QUALITA_E4.ordine.includes(id)) { e4.toccati.add(id); e4.spenti = e4.spenti.filter((k) => k !== id); }
    return impostaOpzioneBaseE4.call(this, id, valore, ...r);
  };
}

// La riga nel menu Opzioni, subito dopo «Ombre lunghe».
if (typeof righeB3 === 'function') {
  const righeBaseE4 = righeB3;
  let cacheE4 = null, sorgenteE4 = null;
  righeB3 = function righeB3E4(pagina, ...r) {
    const righe = righeBaseE4.call(this, pagina, ...r);
    if (pagina !== 'scena' && pagina !== undefined) return righe;
    if (!Array.isArray(righe) || righe.some((x) => x.id === RIGA_E4.id)) return righe;
    if (righe !== sorgenteE4) {
      const i = righe.findIndex((x) => x.id === 'ombre');
      cacheE4 = Object.freeze([...righe.slice(0, i + 1), RIGA_E4, ...righe.slice(i + 1)]);
      sorgenteE4 = righe;
    }
    return cacheE4;
  };
}

Object.assign(window.__teatro.interni, {
  QUALITA_E4,
  qualitaAutoE4: {
    /** Sonda QA: true/false forza la regolazione, null torna al riconoscimento del telefono. */
    forza(v) { e4.forzata = v === null ? null : Boolean(v); },
    passo: passoQualitaE4,
    stato: () => ({ attiva: qualitaAutoAttivaE4(), media: e4.media, spenti: [...e4.spenti], toccati: [...e4.toccati], attesaAccendi: e4.attesaAccendi, cambi: e4.cambi }),
    azzera() { riaccendiTuttoE4(); e4.toccati.clear(); e4.media = null; e4.ultimo = null; e4.altaDa = null; e4.bassaDa = null; e4.attesaAccendi = QUALITA_E4.attesaAccendiMs; },
  },
});
