/*
 * (h4) RITORNO IN PIAZZA — «la notte non è finita».
 *
 * Richiesta dell'autore: dopo Donna Luciana, se si continua, si torna almeno una volta in Piazza Dante proprio per
 * combattere il Grande Burattinaio, con le vite rigenerate e con tutto ciò che si è costruito nella notte.
 *
 * Come si incontra:
 *  1. Caduta Donna Luciana, se la porta della bottega è apribile o già aperta (tre sigilli rotti e finale vero visto,
 *     stato di b8), il cordone del sipario lascia il posto alla «seconda uscita» di h4: [E] «Torna in piazza».
 *     Ferruccio rientra in Piazza Dante con la notte VIVA: stessa run (oggetti, trasformazioni, monete, attivo,
 *     consumabile, personaggio) e le Maschere piene. Niente pergamena nuova, niente notte in più.
 *     Si ripresenta a OGNI ciclo della notte senza fine.
 *  2. In piazza Tonino dice una battuta e la porta pulsa. Dalla porta (bussata / Fucina di b8) «Sali sopra la
 *     ribalta» apre la rastrelliera dei ferri di Gaetano: si prendono quanti ferri si vuole, ognuno pesa (passo più
 *     lento nello scontro, RITORNO_H4.ferri). Poi lo scontro di d1 parte SENZA nuovaRun, con la dotazione della run,
 *     e il Burattinaio scalato sulla forza della dotazione e sul ciclo (RITORNO_H4.scala).
 *     Rinuncia: la porta di destra della piazza riporta al primo piano del ciclo successivo (la botola);
 *     il menu di pausa («Ricomincia notte», «Menù personaggi») chiude la notte come un abbandono.
 *  3. Vittoria: il finale segreto di b8 (fine()) e la notte si chiude con il conto della notte (a7/e6).
 *     Morte: la morte normale della run.
 *  Senza notte viva (una sera nuova, a mani nude) lo scontro resta quello di prima: d1 fa nuovaRun.
 *
 * Agganci: d1-burattinaio.js (opz.notteViva / opz.vita / opz.ritmo / opz.ferri, righe segnate «(h4)»).
 * Avvolge: t4Gancio, interagisciStanza, disegnaStanzaPixelArt, ricalcolaStatistiche,
 * interni.nuovaRun (l'uscita della piazza di T4), interni.scontroSopraLaRibalta (lo chiama b8).
 * Sonda QA: window.__teatro.interni.ritornoH4.
 */
'use strict';

// ===========================================================================
// 1. TABELLE
// ===========================================================================
const RITORNO_H4 = Object.freeze({
  bossFinale: 'donna-luciana',
  /** La seconda uscita nella stanza di Donna Luciana (dove b8 metteva il cordone del sipario). */
  uscita: Object.freeze({ x: 112, y: 128, raggio: 42 }),
  /**
   * Scala del Burattinaio. forza = (danno × colpi al secondo) della dotazione / quella di Ferruccio a mani nude
   * (3,50 × 2,73), tenuta fra forzaMin e forzaMax. Vita delle parti × forza × ciclo; il ciclo conta
   * 1 + perCiclo × (ciclo − 1) fino a cicloMax. Ritmo: pausa fra i colpi × (1 − ritmoPerForza × (forza − 1)
   * − ritmoPerCiclo × (ciclo − 1)), mai sotto ritmoMin. Tarata con tools/sim-bilancio-teatro.js (vedi report h4).
   */
  scala: Object.freeze({
    dpsRiferimento: 3.5 * 2.73, forzaMin: 1, forzaMax: 4.5,
    perCiclo: 0.25, cicloMax: 2,
    ritmoPerForza: 0.06, ritmoPerCiclo: 0.08, ritmoMin: 0.6,
  }),
  /** I ferri presi dalla rastrelliera: ognuno pesa, il passo cala di questa frazione nello scontro. */
  ferri: Object.freeze({ passoPerFerro: 0.1, ordine: Object.freeze(['tenaglie', 'punzone', 'lima']) }),
  /** Rastrelliera (riquadro 640×360). */
  pannello: Object.freeze({ x: 150, y: 70, w: 340, h: 220, riga0: 140, rigaH: 28 }),
  pulsaTick: 64,
});

/** Testi a schermo (nuovi, da approvare dall'autore). */
const TESTI_H4 = Object.freeze({
  uscita: 'TORNA IN PIAZZA [E]',
  uscitaSotto: 'la notte non è finita',
  uscitaSotto2: 'con tutto: Maschere piene, la porta della bottega aspetta',
  banner: (ciclo) => `★ DONNA LUCIANA È CADUTA! Botola: NOTTE SENZA FINE (ciclo ${ciclo}) · A sinistra: torna in piazza, la notte non è finita`,
  rientro: 'Piazza Dante · la notte è ancora viva · Maschere piene',
  tonino: "Ancora 'n giro, guagliò? Stanotte 'a porta 'e Gaetano nun s'è chiusa. Vai, ca t'aspetta.",
  piazzaViva: 'LA NOTTE È VIVA · la porta della bottega aspetta',
  piazzaVivaSotto: 'a destra: la botola, ciclo seguente',
  pausa: '☾ La notte è ancora viva: «Ricomincia notte» o «Menù personaggi» la chiudono',
  continua: (ciclo) => `NOTTE SENZA FINE · CICLO ${ciclo} — la notte continua`,
  rastrelliera: Object.freeze({
    titolo: 'I ferri di Gaetano',
    sotto: 'Prendi quanti ferri vuoi. Aiutano contro le Mani, ma ognuno pesa.',
    costo: (pct) => `Ogni ferro preso: passo −${pct}% per tutto lo scontro`,
    ferri: Object.freeze({
      tenaglie: 'Le Tenaglie — le mani restano a terra più a lungo',
      punzone: 'Il Punzone — scendono meno marionette',
      lima: 'La Lima — le forbici s\'aprono più piano',
    }),
    preso: '[preso]', lasciato: '[lasciato]',
    sali: (n) => `Sali sopra la ribalta (${n} ${n === 1 ? 'ferro' : 'ferri'})`,
    aiuto: '[↑↓] scegli · [E] prendi/lascia · [Esc] resta in piazza',
  }),
  scontro: (n, pct) => n ? `${n} ${n === 1 ? 'ferro' : 'ferri'} di Gaetano · passo −${pct}%` : 'Senza i ferri di Gaetano',
});

// ===========================================================================
// 2. STATO
// ===========================================================================
const h4 = {
  viva: null,        // { run, piano, ciclo, personaggio } — la notte tornata in piazza
  battuta: null,     // run per cui Tonino ha già parlato
  rast: null,        // { sel, presi, opz } — rastrelliera aperta
  scontro: null,     // { run, ferri, n, forza, ciclo, molt, ritmo, vita } — Burattinaio con la dotazione
};

const IH4 = () => window.__teatro.interni;

/** true se la notte tornata in piazza è ancora quella in corso. */
function notteVivaH4() {
  return Boolean(h4.viva && h4.viva.run === statoRun.numeroRun && h4.viva.personaggio === statoRun.personaggioId);
}

/** La porta della bottega è apribile (tre sigilli e finale vero visto) o già aperta? (stato di b8) */
function portaProntaH4() {
  try {
    if (typeof statoB8 !== 'function') return false;
    const s = statoB8();
    if (s.portaAperta) return true;
    const k = typeof sigilliB8 === 'function' ? sigilliB8(s) : 0;
    return k >= 3 && (s.finaleVisto || !(typeof SEGRETO_B8 === 'object' && SEGRETO_B8.serveFinaleVero));
  } catch (_) { return false; }
}

// ===========================================================================
// 3. LA SECONDA USCITA E IL RITORNO
// ===========================================================================
function vicinoUscitaH4() {
  const U = RITORNO_H4.uscita;
  return Math.hypot(player.x - U.x, player.y - U.y) < U.raggio;
}

/** Caduta Donna Luciana con la porta pronta: il cordone di b8 diventa «Torna in piazza». */
function dopoLucianaH4(st) {
  const b = st && st.nemici && (st.nemici.find((n) => n.boss) || st.nemici[0]);
  if (!b || b.bossId !== RITORNO_H4.bossFinale || !portaProntaH4()) return;
  st.cordoneB8 = false;
  st.ritornoH4 = true;
  try { if (typeof b8 === 'object' && b8) b8.bannerPendente = { st, testo: TESTI_H4.banner((statoRun.ciclo || 1) + 1) }; } catch (_) { /* b8 assente */ }
}

/**
 * Ferruccio torna in Piazza Dante con la notte viva: stessa run, Maschere piene. Non chiude la run.
 * @returns {boolean}
 */
function tornaInPiazzaH4() {
  if (statoRun.fase !== 'in_gioco') return false;
  h4.viva = { run: statoRun.numeroRun, piano: (statoRun.piano || 4) + 1, ciclo: statoRun.ciclo || 1, personaggio: statoRun.personaggioId };
  h4.battuta = null;
  statoRun.hpHalf = statoRun.maxHpHalf; // «le vite si rigenerano»
  statoRun.proiettiliNemici = [];
  statoRun.pausa = false; statoRun.siparioAttivo = null; statoRun.diarioD = null; statoRun.scambioPendente = null;
  try { if (typeof a7 === 'object' && a7) a7.inAttesaHub = null; } catch (_) { /* a7 assente */ }
  statoRun.fase = 'menu_selezione';
  if (!t4Gancio('avvio', statoRun.personaggioId)) statoRun.fase = 'hub';
  mostraBanner(TESTI_H4.rientro, 220);
  return true;
}

/** Dalla porta di destra della piazza con la notte viva: si riprende dal primo piano del ciclo seguente. */
function continuaNotteH4() {
  const v = h4.viva;
  h4.viva = null;
  h4.rast = null;
  statoRun.fase = 'in_gioco';
  statoRun.pausa = false;
  avviaPiano(v.piano, true);
  mostraBanner(TESTI_H4.continua(statoRun.ciclo || Math.floor((v.piano - 1) / 4) + 1), 200);
}

// ===========================================================================
// 4. LA RASTRELLIERA E LO SCONTRO CON LA DOTAZIONE
// ===========================================================================
/** Forza della dotazione: danno al secondo nominale rispetto a Ferruccio a mani nude, nei limiti della tabella. */
function forzaH4() {
  const S = RITORNO_H4.scala;
  const dps = (statoRun.dmg || 1) * (statoRun.colpiAlSec || 2.73);
  return Math.max(S.forzaMin, Math.min(S.forzaMax, dps / S.dpsRiferimento));
}

/**
 * Vita e ritmo del Burattinaio per una forza e un ciclo.
 * @param {number} forza @param {number} ciclo
 * @returns {{molt:number, ritmo:number, vita:object}}
 */
function scalaBurattinaioH4(forza, ciclo) {
  const S = RITORNO_H4.scala;
  const c = Math.max(1, Math.floor(ciclo || 1));
  const moltCiclo = Math.min(S.cicloMax, 1 + S.perCiclo * (c - 1));
  const molt = forza * moltCiclo;
  const ritmo = Math.max(S.ritmoMin, 1 - S.ritmoPerForza * (forza - 1) - S.ritmoPerCiclo * (c - 1));
  const base = BURATTINAIO_D1.vita;
  const vita = {};
  for (const k of Object.keys(base)) vita[k] = Math.round(base[k] * molt);
  return { molt, ritmo, vita: Object.freeze(vita) };
}

function apriRastrellieraH4(opz) {
  h4.rast = { sel: 3, presi: { tenaglie: false, punzone: false, lima: false }, opz };
  statoRun.fase = 'hub';
}

function ferriPresiH4(r = h4.rast) { return RITORNO_H4.ferri.ordine.filter((k) => r && r.presi[k]); }

/** Parte lo scontro di d1 con la dotazione della run e i ferri presi. */
function saliConDotazioneH4() {
  const r = h4.rast;
  if (!r) return false;
  h4.rast = null;
  const presi = ferriPresiH4(r);
  const forza = forzaH4();
  const ciclo = (h4.viva && h4.viva.ciclo) || statoRun.ciclo || 1;
  const sc = scalaBurattinaioH4(forza, ciclo);
  const ferri = { tenaglie: presi.includes('tenaglie'), punzone: presi.includes('punzone'), lima: presi.includes('lima') };
  h4.scontro = { run: statoRun.numeroRun, ferri, n: presi.length, forza, ciclo, molt: sc.molt, ritmo: sc.ritmo, vita: sc.vita };
  h4.viva = null;
  statoRun.hpHalf = statoRun.maxHpHalf;
  const opz = r.opz || {};
  const fine = opz.fine;
  const ok = scontroBaseH4({
    ...opz, notteViva: true, ferri, sigilli: presi.length, vita: sc.vita, ritmo: sc.ritmo,
    fine: () => { chiudiNotteVittoriaH4(); if (typeof fine === 'function') fine(); },
  });
  try { ricalcolaStatistiche(); } catch (err) { console.error('[h4] statistiche', err); }
  const pct = Math.round(RITORNO_H4.ferri.passoPerFerro * 100 * presi.length);
  if (ok) h4.scontro.bannerFerri = TESTI_H4.scontro(presi.length, pct);
  return ok;
}

/** Vittoria sul Burattinaio salito con la notte viva: la notte si chiude qui, con il conto della notte. */
function chiudiNotteVittoriaH4() {
  h4.scontro = null;
  try {
    if (typeof a7 === 'object' && a7 && a7.run) {
      const v = a7.run;
      v.esito = 'vittoria'; v.vittoria = true; v.fine = new Date().toISOString();
      v.hpFine = statoRun.hpHalf; v.maxHpFine = statoRun.maxHpHalf; v.moneteFine = statoRun.monete || 0;
      v.burattinaioH4 = true;
      if (typeof salvaVoceA7 === 'function') salvaVoceA7(v);
      a7.inAttesaHub = { voce: JSON.parse(JSON.stringify(v)), tipo: 'vittoria' };
      a7.run = null;
      try {
        if (typeof b8 === 'object' && b8 && b8.nota && !b8.nota.paginaScritta && typeof scriviPaginaRunB8 === 'function') {
          b8.nota.paginaScritta = true; scriviPaginaRunB8(v, { nota: b8.nota });
        }
      } catch (err) { console.warn('[h4] pagina del diario', err); }
    }
  } catch (err) { console.warn('[h4] conto della notte', err); }
  try { statoRun.numeroNotte = incrementaNumeroNotte(); } catch (err) { console.warn('[h4] notte', err); }
}

function tastoRastrellieraH4(e) {
  const r = h4.rast;
  const c = e.code;
  if (e.repeat) return true;
  if (c === 'ArrowUp' || c === 'KeyW') r.sel = (r.sel + 3) % 4;
  else if (c === 'ArrowDown' || c === 'KeyS') r.sel = (r.sel + 1) % 4;
  else if (c === 'Escape' || c === 'Backspace') { h4.rast = null; }
  else if (c === 'KeyE' || c === 'Enter' || c === 'Space') scegliRigaH4(r.sel);
  return true;
}

function scegliRigaH4(i) {
  const r = h4.rast;
  if (!r) return;
  r.sel = i;
  if (i < 3) { const k = RITORNO_H4.ferri.ordine[i]; r.presi[k] = !r.presi[k]; try { if (typeof suonoFerroB8 === 'function') suonoFerroB8(0.08); } catch (_) { /* suono facoltativo */ } }
  else saliConDotazioneH4();
}

function rigaClickH4(mx, my) {
  const P = RITORNO_H4.pannello;
  if (mx < P.x || mx > P.x + P.w) return -1;
  const i = Math.floor((my - (P.riga0 - P.rigaH / 2)) / P.rigaH);
  return i >= 0 && i < 4 ? i : -1;
}

// ===========================================================================
// 5. DISEGNO
// ===========================================================================
function disegnaUscitaH4() {
  const U = RITORNO_H4.uscita;
  const vicino = vicinoUscitaH4();
  const p = 0.5 + 0.5 * Math.sin(tick / 14);
  ctx.save();
  // arco di una quinta aperta: la piazza dietro, un filo di luce di lanterna
  ctx.fillStyle = '#07060a';
  ctx.beginPath(); ctx.moveTo(U.x - 18, U.y + 22); ctx.lineTo(U.x - 18, U.y - 14); ctx.quadraticCurveTo(U.x, U.y - 34, U.x + 18, U.y - 14); ctx.lineTo(U.x + 18, U.y + 22); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = `rgba(242,192,107,${0.55 + 0.4 * p})`; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = `rgba(242,192,107,${0.16 + 0.14 * p})`;
  ctx.fillRect(U.x - 12, U.y - 8, 24, 30);
  ctx.fillStyle = '#d4a017'; // la lanterna appesa
  ctx.fillRect(U.x - 3, U.y - 24, 6, 7);
  ctx.restore();
  drawPillLabel(TESTI_H4.uscita, U.x + 6, U.y + 36, 170, { size: 7.5, color: vicino ? '#ffffff' : '#f9cb40', border: '#f9cb40' });
  drawPillLabel(TESTI_H4.uscitaSotto, U.x + 6, U.y + 49, 170, { size: 6.5, color: '#c9a679', border: '#5c3a1e' });
  if (vicino) drawPillLabel(TESTI_H4.uscitaSotto2, U.x + 60, U.y + 62, 280, { size: 6.5, color: '#e6d2aa', border: '#5c3a1e' });
}

/** In piazza con la notte viva: la porta della bottega pulsa. */
function disegnaPiazzaVivaH4() {
  const P = (typeof SEGRETO_B8 === 'object' && SEGRETO_B8.porta) || { x: 320, y: 62 };
  const p = 0.5 + 0.5 * Math.sin((tick / RITORNO_H4.pulsaTick) * Math.PI * 2);
  ctx.save();
  ctx.strokeStyle = `rgba(242,192,107,${0.35 + 0.5 * p})`;
  ctx.lineWidth = 2 + 2 * p;
  ctx.strokeRect(P.x - 20 - 3 * p, P.y - 26 - 3 * p, 40 + 6 * p, 50 + 6 * p);
  ctx.restore();
  drawPillLabel(TESTI_H4.piazzaViva, W / 2, 14, 300, { size: 7.5, color: '#f9cb40', border: '#f9cb40' });
  drawPillLabel(TESTI_H4.piazzaVivaSotto, W / 2, 27, 220, { size: 6.5, color: '#c9a679', border: '#5c3a1e' });
}

function disegnaRastrellieraH4() {
  const r = h4.rast;
  const P = RITORNO_H4.pannello;
  const T = TESTI_H4.rastrelliera;
  ctx.save();
  ctx.fillStyle = 'rgba(6,4,3,0.72)'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#140c08'; ctx.fillRect(P.x, P.y, P.w, P.h);
  ctx.strokeStyle = '#f2c06b'; ctx.lineWidth = 2; ctx.strokeRect(P.x, P.y, P.w, P.h);
  ctx.strokeStyle = '#5a3818'; ctx.lineWidth = 1; ctx.strokeRect(P.x + 4, P.y + 4, P.w - 8, P.h - 8);
  ctx.restore();
  drawTextFit(T.titolo, W / 2, P.y + 22, P.w - 20, { size: 12, color: '#f9cb40', weight: 'bold' });
  drawTextFit(T.sotto, W / 2, P.y + 38, P.w - 20, { size: 7.5, color: '#e6d2aa' });
  drawTextFit(T.costo(Math.round(RITORNO_H4.ferri.passoPerFerro * 100)), W / 2, P.y + 51, P.w - 20, { size: 7.5, color: '#e0796b', weight: 'bold' });
  RITORNO_H4.ferri.ordine.forEach((k, i) => {
    const y = P.riga0 + i * P.rigaH;
    const sel = r.sel === i;
    ctx.save();
    ctx.fillStyle = sel ? '#3a2412' : '#1d130b'; ctx.fillRect(P.x + 12, y - 11, P.w - 24, 22);
    ctx.strokeStyle = r.presi[k] ? '#d4a017' : '#5a3818'; ctx.strokeRect(P.x + 12, y - 11, P.w - 24, 22);
    // il ferro: sagoma scura con il filo di lanterna
    ctx.strokeStyle = r.presi[k] ? '#f2c06b' : '#6b4e14'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(P.x + 24, y + 6); ctx.lineTo(P.x + 38, y - 6); ctx.stroke();
    ctx.restore();
    drawTextFit(T.ferri[k], P.x + 46 + (P.w - 130) / 2, y + 3, P.w - 130, { size: 7.5, color: sel ? '#ffffff' : '#e6d2aa' });
    drawTextFit(r.presi[k] ? T.preso : T.lasciato, P.x + P.w - 44, y + 3, 60, { size: 7, color: r.presi[k] ? '#f9cb40' : '#8a7a62', weight: 'bold' });
  });
  const ys = P.riga0 + 3 * P.rigaH;
  ctx.save();
  ctx.fillStyle = r.sel === 3 ? '#6b1a14' : '#3a120e'; ctx.fillRect(P.x + 40, ys - 11, P.w - 80, 22);
  ctx.strokeStyle = '#f2c06b'; ctx.strokeRect(P.x + 40, ys - 11, P.w - 80, 22);
  ctx.restore();
  drawTextFit(T.sali(ferriPresiH4(r).length), W / 2, ys + 3, P.w - 90, { size: 8.5, color: '#ffffff', weight: 'bold' });
  drawTextFit(T.aiuto, W / 2, P.y + P.h - 10, P.w - 20, { size: 6.5, color: '#c9a679' });
}

// ===========================================================================
// 6. AVVOLGIMENTI
// ===========================================================================
const scontroBaseH4 = (...a) => {
  const f = scontroBaseRifH4;
  return typeof f === 'function' ? f(...a) : false;
};
let scontroBaseRifH4 = IH4().scontroSopraLaRibalta;
/** b8 chiama interni.scontroSopraLaRibalta salendo dalla Fucina: con la notte viva prima la rastrelliera. */
IH4().scontroSopraLaRibalta = function scontroSopraLaRibaltaH4(opz = {}) {
  if (notteVivaH4() && !opz.notteViva) { apriRastrellieraH4(opz); return true; }
  return scontroBaseH4(opz);
};

const nuovaRunInterniBaseH4 = IH4().nuovaRun;
/** T4 esce dalla piazza con interni.nuovaRun: con la notte viva si continua la run (ciclo seguente). */
IH4().nuovaRun = function nuovaRunPiazzaH4(...args) {
  try { if (statoRun.fase === 'hub' && notteVivaH4()) { continuaNotteH4(); return undefined; } } catch (err) { console.error('[h4] continua', err); }
  return nuovaRunInterniBaseH4.apply(this, args);
};

const t4GancioBaseH4 = t4Gancio;
t4Gancio = function t4GancioH4(nome, ...args) {
  try {
    if (statoRun.fase === 'hub' && h4.rast) {
      if (nome === 'logica') return true; // la piazza è ferma mentre si scelgono i ferri
      if (nome === 'tasto') return tastoRastrellieraH4(args[0]);
      if (nome === 'click') { const i = rigaClickH4(args[0], args[1]); if (i >= 0) scegliRigaH4(i); return true; }
    }
    // «Ricomincia notte» dalla piazza con la notte viva: la notte si chiude come una run lasciata a metà
    if (nome === 'ricomincia' && statoRun.fase === 'hub' && notteVivaH4()) { h4.viva = null; statoRun.fase = 'in_gioco'; }
  } catch (err) { console.error('[h4]', nome, err); }
  const r = t4GancioBaseH4(nome, ...args);
  try {
    if (nome === 'bossSconfitto') dopoLucianaH4(args[0]);
    else if (nome === 'logica') logicaH4();
    else if (nome === 'sopra' && statoRun.fase === 'hub') {
      if (notteVivaH4() && !statoRun.pausa) disegnaPiazzaVivaH4();
      // menu di pausa (b3 lo disegna sopra il frame): una riga in cima dice che la notte è ancora viva
      if (notteVivaH4() && statoRun.pausa && !statoRun.diarioD) drawPillLabel(TESTI_H4.pausa, W / 2, 10, 520, { size: 7.5, color: '#f9cb40', border: '#f9cb40' });
      if (h4.rast) disegnaRastrellieraH4();
    }
  } catch (err) { console.error('[h4]', nome, err); }
  return r;
};

/** A ogni tick: la battuta di Tonino in piazza, la pulizia dello stato a fine notte. */
function logicaH4() {
  const f = statoRun.fase;
  if (f === 'morte' || f === 'menu_selezione') { h4.viva = null; h4.rast = null; }
  if (h4.scontro && (f === 'morte' || f === 'menu_selezione' || (f === 'in_gioco' && !d1.attivo && !d1.vittoria))) {
    h4.scontro = null;
    try { ricalcolaStatistiche(); } catch (_) { /* niente */ }
  }
  if (h4.scontro && h4.scontro.bannerFerri && d1.attivo && d1.t > 20) { mostraBanner(h4.scontro.bannerFerri, 200); h4.scontro.bannerFerri = null; }
  if (f === 'hub' && notteVivaH4() && h4.battuta !== h4.viva.run && !statoRun.pausa) {
    let libero = true;
    try { libero = !dialogoT4B8() && !b8.cart; } catch (_) { libero = true; }
    if (libero) {
      h4.battuta = h4.viva.run;
      try { b8.cart = { voci: [bB8('tonino', TESTI_H4.tonino)], idx: 0, t: 0 }; } catch (_) { mostraBanner(TESTI_H4.tonino, 260); }
    }
  }
}

const interagisciStanzaBaseH4 = interagisciStanza;
/** [E] alla seconda uscita dopo Donna Luciana: si torna in piazza con la notte viva. */
interagisciStanza = function (...args) {
  try {
    const st = statoRun.stanzaCorrente;
    if (st && st.ritornoH4 && statoRun.fase === 'in_gioco' && !statoRun.siparioAttivo && !statoRun.scambioPendente && vicinoUscitaH4()) {
      tornaInPiazzaH4();
      return undefined;
    }
  } catch (err) { console.error('[h4] uscita', err); }
  return interagisciStanzaBaseH4.apply(this, args);
};

const disegnaStanzaBaseH4 = disegnaStanzaPixelArt;
disegnaStanzaPixelArt = function (t, st, ...resto) {
  const r = disegnaStanzaBaseH4.call(this, t, st, ...resto);
  try { const s = st || statoRun.stanzaCorrente; if (s && s.ritornoH4 && statoRun.fase === 'in_gioco') disegnaUscitaH4(); } catch (err) { console.error('[h4] uscita (disegno)', err); }
  return r;
};

const ricalcolaStatisticheBaseH4 = ricalcolaStatistiche;
/** I ferri presi pesano: passo più lento per tutto lo scontro col Burattinaio. */
ricalcolaStatistiche = function (...args) {
  const r = ricalcolaStatisticheBaseH4.apply(this, args);
  try {
    if (h4.scontro && h4.scontro.n > 0 && d1.attivo) statoRun.speed *= Math.max(0.3, 1 - RITORNO_H4.ferri.passoPerFerro * h4.scontro.n);
  } catch (err) { console.error('[h4] passo', err); }
  return r;
};

try { if (typeof b3 === 'object' && b3 && Array.isArray(b3.menuAperti)) b3.menuAperti.push(() => Boolean(h4.rast) && statoRun.fase === 'hub'); } catch (_) { /* b3 assente */ }

// ===========================================================================
// 7. SONDA QA
// ===========================================================================
Object.assign(window.__teatro.interni, {
  RITORNO_H4, TESTI_H4,
  ritornoH4: Object.freeze({
    stato: () => ({
      viva: h4.viva ? { ...h4.viva } : null, notteViva: notteVivaH4(), portaPronta: portaProntaH4(),
      rastrelliera: h4.rast ? { sel: h4.rast.sel, presi: { ...h4.rast.presi } } : null,
      scontro: h4.scontro ? { ...h4.scontro, ferri: { ...h4.scontro.ferri } } : null, battuta: h4.battuta,
    }),
    forza: forzaH4,
    scala: scalaBurattinaioH4,
    vicinoUscita: vicinoUscitaH4,
    tornaInPiazza: tornaInPiazzaH4,
    sali: saliConDotazioneH4,
    scegli: scegliRigaH4,
    apriRastrelliera: (opz) => apriRastrellieraH4(opz || {}),
  }),
});
