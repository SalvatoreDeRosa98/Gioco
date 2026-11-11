/*
 * teatro/e6-assistenza.js — (e6) ASSISTENZA AL GIOCATORE.
 *
 *   1. RIPRENDI LA NOTTE (dall'inizio del piano). Quando un piano comincia (avviaPiano finito, run in scena) si
 *      scrive un'istantanea della DOTAZIONE in localStorage (chiave ASSISTENZA_E6.ripresa.prefisso + slot, con
 *      versione): personaggio, notte, piano/ciclo, seme, Maschere, monete/bombe/chiavi, passivi nell'ordine
 *      presi (id + mod, per i doppioni), attivo e carica, consumabile, trasformazioni/temi (b4), pool e boss
 *      della run, registro in corso (a7), percorso (campo generico). Le statistiche derivate NON si salvano:
 *      si rifanno con ricalcolaStatistiche() sugli oggetti della lista. In Piazza Dante (dove porta il menu iniziale),
 *      se c'è un'istantanea valida, un cartello offre «Riprendi la notte» accanto a «Nuova notte» (tastiera,
 *      gamepad e tocco: registrato in comandiB3.menuAperti). Riprendere rigenera il piano da capo; ogni ripresa
 *      è contata (campo «riprese» del Registro delle notti). L'istantanea si cancella alla morte, alla vittoria
 *      e quando si torna volontariamente in piazza o al menu; dati vecchi o rotti si ignorano.
 *
 *   2. MIRA ASSISTITA (Opzioni, «Suono e scena»: Spenta / Leggera / Piena; predefinita Leggera col tocco, Spenta
 *      con tastiera e gamepad finché il giocatore non sceglie). Leggera: il colpo cardinale si inclina (al più
 *      ASSISTENZA_E6.mira.correzioneMaxGradi) verso il nemico colpibile dentro un cono più largo da lontano; niente
 *      sotto distanzaMinPx. Piena: in più Spazio, R3 o levetta a tocco al centro sparano verso il più vicino.
 *      Vale per colpi, spada, maglio di Taddeo (alla partenza), colpi spettrali dell'Ombra; il raggio (t3) resta
 *      dritto. Mai nemici in volo/in alto (stesse soglie di nemicoVicinoD e danneggiaNemico).
 *
 * Avvolge (chiamando sempre la base): avviaPiano, t4Gancio, disegnaFrame, eseguiAttacco4Direzioni,
 * sparaProiettiliDirezione, colpoMaglioD2, passoLogico, righeB3, impostaOpzioneB3. Nessun gancio nei file altrui.
 * Script classico caricato dopo l'ultimo teatro/d*.js. Regole: teatro/LEGGIMI.md.
 */

// ===========================================================================
// TABELLE
// ===========================================================================
const ASSISTENZA_E6 = Object.freeze({
  ripresa: Object.freeze({
    prefisso: 'ferruccio.teatro.ripresa.',  // + slot T3
    versione: 1,
    cartello: Object.freeze({ w: 300, h: 132, bottoneW: 124, bottoneH: 26, distanzaBottoni: 14 }),
  }),
  mira: Object.freeze({
    correzioneMaxGradi: 12,     // inclinazione massima del colpo verso il nemico
    distanzaMinPx: 44,          // sotto questa distanza nessuna correzione (niente strattoni da vicino)
    conoVicinoGradi: 10,        // semiampiezza del cono alla distanza minima…
    conoLontanoGradi: 24,       // …e alla distanza «lontano» (più largo da lontano)
    lontanoPx: 220,
    gittataMult: 1.15,          // oltre gittata × questo valore il nemico non si considera
    pienaGittataMult: 1.6,      // mira piena: quanto lontano si cerca il nemico più vicino
    altezzaMaxNemico: 16,       // nemici più in alto (airZ) non si colpiscono (come nemicoVicinoD)
    altezzaMaxBoss: 25,         // boss in volo alto (come danneggiaNemico)
    toccoForzaSenzaDirezione: 0.24, // levetta a tocco appoggiata entro questa frazione del raggio = «senza direzione»
    padBottoneSenzaDirezione: 11,   // R3 (clic della levetta destra): sparo senza direzione col gamepad
    riflessoTick: 10,           // per quanti tick il colpo corretto porta il piccolo riflesso
    predefinito: Object.freeze({ tocco: 'leggera', tastiera: 'spenta', pad: 'spenta' }),
  }),
});

const TESTI_E6 = Object.freeze({
  titoloRipresa: 'LA NOTTE È RIMASTA A METÀ',
  riprendi: (piano, nome) => `Riprendi la notte (Piano ${piano}, ${nome})`,
  sottoRipresa: 'Si riparte dall\'inizio del piano, con tutto quello che avevi. Il piano si rimonta da capo.',
  bottoneRiprendi: 'RIPRENDI',
  bottoneNuova: 'NUOVA NOTTE',
  piedeRipresa: '◂ ▸ scegli · [E] / Invio conferma · [ESC] nuova notte',
  ripresaBanner: (piano) => `🌙 Si riprende dall'inizio del Piano ${piano}`,
  riprese: (n) => `ripresa ${n} ${n === 1 ? 'volta' : 'volte'}`,
  rigaMira: 'Mira assistita',
  notaMira: 'Leggera: il colpo si piega un poco verso il nemico. Piena: anche senza direzione spara al più vicino.',
  sceltaMira: Object.freeze({ spenta: 'SPENTA', leggera: 'LEGGERA', piena: 'PIENA' }),
});

// ===========================================================================
// STATO
// ===========================================================================
const e6 = {
  riprendendo: false,      // true mentre si ricostruisce la run (niente istantanee intermedie)
  cartello: null,          // { snap, sel: 0|1 } cartello «Riprendi» aperto
  cartelloScartato: false, // il giocatore ha scelto «nuova notte»: non si ripropone finché non cambia fase
  faseVista: null,
  riprese: 0,              // riprese della run in corso
  runRiprese: null,        // numeroRun a cui si riferisce `riprese`
};

function slotE6() {
  const sv = window.__teatroT3 && window.__teatroT3.salvataggi;
  return sv && Number.isFinite(sv.slotAttivo) ? sv.slotAttivo : 0;
}
const chiaveRipresaE6 = (slot = slotE6()) => ASSISTENZA_E6.ripresa.prefisso + slot;
const copiaE6 = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
const idsE6 = (lista) => (Array.isArray(lista) ? lista.map((o) => (o && o.id) || null).filter(Boolean) : []);

// ===========================================================================
// ISTANTANEA
// ===========================================================================

/** Fotografia della dotazione all'inizio del piano corrente (solo dati, niente statistiche derivate). */
function istantaneaE6() {
  const S = statoRun.consumabiliA2;
  const b4 = statoRun.trasfB4;
  const b5 = statoRun.b5;
  const reg = typeof a7 !== 'undefined' && a7.run ? copiaE6(a7.run) : null;
  let sigilli = null;
  try { const f = window.__teatro.interni.finaliB8; if (f && typeof f.sigilli === 'number') sigilli = f.sigilli; } catch (_) { /* facoltativo */ }
  return {
    versione: ASSISTENZA_E6.ripresa.versione,
    slot: slotE6(), scritta: new Date().toISOString(),
    personaggio: statoRun.personaggioId, notte: statoRun.numeroNotte, numeroRun: statoRun.numeroRun,
    piano: statoRun.piano, ciclo: statoRun.ciclo, seme: runSeed >>> 0,
    hpHalf: statoRun.hpHalf, baseMaxHpHalf: statoRun.baseMaxHpHalf,
    baseDmgChar: statoRun.baseDmgChar, baseSpdChar: statoRun.baseSpdChar,
    monete: statoRun.monete || 0, bombe: statoRun.bombe || 0, chiavi: statoRun.chiavi || 0,
    viteExtra: statoRun.viteExtra || 0, volo: Boolean(statoRun.volo), dropDoppi: Boolean(statoRun.dropDoppi),
    oggetti: (statoRun.oggettiEquipaggiati || []).map((o) => ({ id: o.id, mod: copiaE6(o.mod || null) })),
    attivo: statoRun.oggettoAttivo ? statoRun.oggettoAttivo.id || null : null,
    caricaAttivo: statoRun.caricaAttivo || 0,
    consumabile: S && S.run === statoRun.numeroRun ? { slot: copiaE6(S.slot), noti: copiaE6(S.notiRun || {}) } : null,
    maledizioni: copiaE6(statoRun.maledizioniD || {}),
    pool: {
      base: idsE6(statoRun.poolOggettiBase), forti: idsE6(statoRun.poolOggettiForti),
      patto: idsE6(statoRun.poolPatto), segreto: idsE6(statoRun.poolSegreto), runB: copiaE6(statoRun.poolRunB),
    },
    boss: idsE6(statoRun.bossOrdine),
    rosa: statoRun.rosaB6 ? copiaE6(statoRun.rosaB6.scelti || {}) : null,
    trasf: b4 && b4.run === statoRun.numeroRun
      ? { attive: copiaE6(b4.attive), ordine: copiaE6(b4.ordine), conteggi: copiaE6(b4.conteggi), annunciate: copiaE6(b4.annunciate), sinergie: copiaE6(b4.sinergie) }
      : null,
    b5: b5 && b5.run === statoRun.numeroRun ? { cariche: copiaE6(b5.cariche || {}), pattiGratisUsati: b5.pattiGratisUsati || 0 } : null,
    percorso: campiPercorsoE6(),
    sigilli,
    registro: reg,
    riprese: e6.riprese,
  };
}

/** Campi `statoRun.percorso*` (Acquedotto di d6 e simili): copiati in modo generico se sono dati. */
function campiPercorsoE6() {
  const out = {};
  for (const k of Object.keys(statoRun)) {
    if (!/^percorso/.test(k) || statoRun[k] == null) continue;
    try { out[k] = copiaE6(statoRun[k]); } catch (_) { /* non serializzabile: si salta */ }
  }
  return out;
}

/** Scrive l'istantanea dello slot attivo (errori del localStorage: niente, si gioca lo stesso). */
function scriviIstantaneaE6() {
  try { localStorage.setItem(chiaveRipresaE6(), JSON.stringify(istantaneaE6())); } catch (err) { console.warn('[e6] istantanea non scritta', err); }
}

/** Cancella l'istantanea dello slot attivo. */
function cancellaIstantaneaE6(slot = slotE6()) {
  try { localStorage.removeItem(chiaveRipresaE6(slot)); } catch (_) { /* idem */ }
}

/** Istantanea valida dello slot attivo, oppure null (vecchia, rotta, di un personaggio che non c'è più). */
function leggiIstantaneaE6(slot = slotE6()) {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(chiaveRipresaE6(slot)) || 'null'); } catch (_) { return null; }
  if (!d || typeof d !== 'object' || d.versione !== ASSISTENZA_E6.ripresa.versione) return null;
  if (!PERSONAGGI_GIOCABILI[d.personaggio]) return null;
  if (!Number.isInteger(d.piano) || d.piano < 1 || d.piano > 99) return null;
  if (!Array.isArray(d.oggetti) || !Number.isFinite(d.hpHalf) || d.hpHalf <= 0) return null;
  return d;
}

// ===========================================================================
// RIPRESA
// ===========================================================================

/** Oggetto del catalogo per id (passivi di base, B, b5), oppure null. */
function oggettoDaIdE6(id) {
  try { const o = trovaOggettoB(id); if (o) return o; } catch (_) { /* catalogo B assente */ }
  return CATALOGO_OGGETTI.find((o) => o.id === id) || (typeof CATALOGO_PATTO !== 'undefined' ? CATALOGO_PATTO.find((o) => o.id === id) : null) || null;
}

/** Ricostruisce una lista di oggetti dal catalogo a partire dagli id (gli id sconosciuti si saltano). */
function listaDaIdE6(ids, tutti) {
  return (ids || []).map((id) => tutti.find((o) => o.id === id)).filter(Boolean);
}

/**
 * Riprende la notte dall'istantanea `snap`: run nuova dello stesso personaggio, poi dotazione riapplicata e
 * piano `snap.piano` rigenerato da capo. Ritorna true se la ripresa è riuscita.
 */
function riprendiNotteE6(snap = leggiIstantaneaE6()) {
  if (!snap) return false;
  e6.cartello = null;
  e6.riprendendo = true;
  try {
    selezionaPersonaggio(snap.personaggio);
    statoRun.fase = 'in_gioco';
    statoRun.pausa = false;
    nuovaRun(false);
    e6.runRiprese = statoRun.numeroRun;
    // --- dotazione ---
    if (Number.isFinite(snap.seme)) runSeed = snap.seme >>> 0;
    if (Number.isFinite(snap.notte)) statoRun.numeroNotte = snap.notte;
    statoRun.baseMaxHpHalf = snap.baseMaxHpHalf || statoRun.baseMaxHpHalf;
    if (Number.isFinite(snap.baseDmgChar)) statoRun.baseDmgChar = snap.baseDmgChar;
    if (Number.isFinite(snap.baseSpdChar)) statoRun.baseSpdChar = snap.baseSpdChar;
    statoRun.monete = snap.monete || 0;
    statoRun.bombe = snap.bombe || 0;
    statoRun.chiavi = snap.chiavi || 0;
    statoRun.viteExtra = snap.viteExtra || 0;
    statoRun.volo = Boolean(snap.volo); player.volo = statoRun.volo;
    statoRun.dropDoppi = Boolean(snap.dropDoppi);
    statoRun.maledizioniD = snap.maledizioni || {};
    statoRun.oggettiEquipaggiati = snap.oggetti.map((s) => {
      const base = oggettoDaIdE6(s.id);
      if (!base) return null;
      const o = { ...base };
      if (s.mod) o.mod = s.mod;
      try { segnaConosciutoD(s.id); } catch (_) { /* facoltativo */ }
      return o;
    }).filter(Boolean);
    if (snap.attivo && OGGETTI_ATTIVI[snap.attivo]) statoRun.oggettoAttivo = { ...OGGETTI_ATTIVI[snap.attivo] };
    statoRun.caricaAttivo = Math.max(0, Math.min(statoRun.oggettoAttivo.maxCarica || 99, snap.caricaAttivo || 0));
    const P = snap.pool || {};
    if (P.base && P.base.length) statoRun.poolOggettiBase = listaDaIdE6(P.base, CATALOGO_OGGETTI);
    if (P.forti && P.forti.length) statoRun.poolOggettiForti = listaDaIdE6(P.forti, CATALOGO_OGGETTI);
    if (P.patto && P.patto.length && typeof CATALOGO_PATTO !== 'undefined') statoRun.poolPatto = listaDaIdE6(P.patto, CATALOGO_PATTO);
    if (P.segreto && P.segreto.length) statoRun.poolSegreto = listaDaIdE6(P.segreto, statoRun.poolSegreto.concat(CATALOGO_OGGETTI));
    if (P.runB) statoRun.poolRunB = P.runB;
    if (Array.isArray(snap.boss) && snap.boss.length) {
      const ordine = listaDaIdE6(snap.boss, POOL_BOSS);
      if (ordine.length) statoRun.bossOrdine = ordine;
    }
    if (snap.rosa && statoRun.rosaB6) statoRun.rosaB6.scelti = snap.rosa;
    if (snap.percorso && typeof snap.percorso === 'object') {
      for (const [k, v] of Object.entries(snap.percorso)) if (/^percorso/.test(k)) statoRun[k] = v;
    }
    // consumabili: stessa tavola dei colori (dal seme), stesse ampolle conosciute, stesso consumabile in mano
    if (typeof statoA2 === 'function') {
      statoRun.consumabiliA2 = null;
      const S = statoA2();
      if (snap.consumabile) { S.slot = snap.consumabile.slot || null; S.notiRun = snap.consumabile.noti || {}; }
    }
    // trasformazioni già annunciate: restano tali (niente secondo annuncio)
    if (snap.trasf && typeof statoB4 === 'function') Object.assign(statoB4(), snap.trasf);
    if (snap.b5 && typeof B5 === 'function') Object.assign(B5(), snap.b5);
    ricalcolaStatistiche();
    statoRun.hpHalf = Math.max(1, Math.min(statoRun.maxHpHalf, snap.hpHalf));
    // registro delle notti: si continua la stessa voce, con una ripresa in più
    e6.riprese = (snap.riprese || 0) + 1;
    if (snap.registro && typeof a7 !== 'undefined') {
      a7.run = Object.assign(snap.registro, { esito: 'in corso', riprese: e6.riprese });
      a7.inv = { monete: statoRun.monete, bombe: statoRun.bombe, chiavi: statoRun.chiavi };
      a7.stanza = null;
    } else if (typeof a7 !== 'undefined' && a7.run) a7.run.riprese = e6.riprese;
  } catch (err) {
    console.error('[e6] ripresa', err);
    e6.riprendendo = false;
    return false;
  }
  e6.riprendendo = false;
  avviaPiano(snap.piano, true); // scrive l'istantanea di nuovo, con le riprese contate
  mostraBanner(TESTI_E6.ripresaBanner(snap.piano), 180);
  return true;
}

// ===========================================================================
// AVVOLGIMENTI
// ===========================================================================
const avviaPianoBaseE6 = avviaPiano;
avviaPiano = function avviaPianoE6(...args) {
  const r = avviaPianoBaseE6.apply(this, args);
  try {
    if (!e6.riprendendo && statoRun.fase === 'in_gioco') {
      if (statoRun.numeroRun !== e6.runRiprese) { e6.riprese = 0; e6.runRiprese = statoRun.numeroRun; } // run nuova
      scriviIstantaneaE6();
    }
  } catch (err) { console.error('[e6] istantanea', err); }
  return r;
};

const t4GancioBaseE6 = t4Gancio;
t4Gancio = function t4GancioE6(nome, ...args) {
  try {
    if (nome === 'morte' && statoRun.fase === 'in_gioco') cancellaIstantaneaE6();
    else if (nome === 'ricomincia') cancellaIstantaneaE6();
    else if (nome === 'bossSconfitto') {
      const st = args[0];
      const b = st && st.nemici && (st.nemici.find((n) => n.boss) || st.nemici[0]);
      if (b && typeof CONFIG_A7 !== 'undefined' && b.bossId === CONFIG_A7.bossFinale) cancellaIstantaneaE6();
    }
  } catch (err) { console.error('[e6] gancio', err); }
  return t4GancioBaseE6(nome, ...args);
};

/** A ogni disegno: cambi di fase (ritorno volontario in piazza o al menu), cartello «Riprendi». */
function osservaFaseE6() {
  const f = statoRun.fase;
  const prima = e6.faseVista;
  if (prima !== f) {
    if (prima === 'in_gioco' && (f === 'hub' || f === 'menu_selezione')) cancellaIstantaneaE6(); // via di sua scelta
    if (f === 'morte') cancellaIstantaneaE6();
    if (f !== 'hub') { e6.cartello = null; }
    if (prima === 'menu_selezione' || prima === 'hub' || prima === null) {
      if (f !== 'hub' && f !== 'menu_selezione') e6.cartelloScartato = false;
    }
    e6.faseVista = f;
  }
  if (f === 'hub' && !e6.cartello && !e6.cartelloScartato && !statoRun.pausa && !altroRiquadroE6()) {
    const snap = leggiIstantaneaE6();
    if (snap) e6.cartello = { snap, sel: 0 };
  }
}

/** true se un altro riquadro è aperto (opzioni, diario, pergamena, dialoghi): il cartello aspetta. */
function altroRiquadroE6() {
  if (statoRun.diarioD) return true;
  try { if (typeof b3 !== 'undefined' && b3.opz) return true; } catch (_) { /* senza b3 */ }
  try { const reg = window.__teatro.interni.registroA7; if (reg && (reg.aperto || reg.pergamena)) return true; } catch (_) { /* idem */ }
  try { const qa = window.__teatro.t4qa; if (qa && qa.dialogo) return true; } catch (_) { /* idem */ }
  return false;
}

// ===========================================================================
// CARTELLO «RIPRENDI LA NOTTE»
// ===========================================================================
function rettCartelloE6() {
  const C = ASSISTENZA_E6.ripresa.cartello;
  const x = (W - C.w) / 2, y = (H - C.h) / 2;
  const by = y + C.h - C.bottoneH - 26;
  const bx0 = W / 2 - C.distanzaBottoni / 2 - C.bottoneW;
  return {
    x, y, w: C.w, h: C.h,
    bottoni: [
      { x: bx0, y: by, w: C.bottoneW, h: C.bottoneH },
      { x: W / 2 + C.distanzaBottoni / 2, y: by, w: C.bottoneW, h: C.bottoneH },
    ],
  };
}

/** Locandina a ombre: fondo scuro, bordo color lanterna, due bottoni. */
function disegnaCartelloE6() {
  const k = e6.cartello;
  if (!k) return;
  const R = rettCartelloE6();
  const nome = (PERSONAGGI_GIOCABILI[k.snap.personaggio] || {}).nome || k.snap.personaggio;
  ctx.save();
  ctx.fillStyle = 'rgba(5, 3, 2, 0.72)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#140c08';
  ctx.fillRect(R.x, R.y, R.w, R.h);
  ctx.strokeStyle = '#f9cb40'; ctx.lineWidth = 2;
  ctx.strokeRect(R.x, R.y, R.w, R.h);
  ctx.strokeStyle = '#5a3818'; ctx.lineWidth = 1;
  ctx.strokeRect(R.x + 4, R.y + 4, R.w - 8, R.h - 8);
  // una luna in sagoma sopra il titolo
  ctx.fillStyle = '#e6d2aa';
  ctx.beginPath(); ctx.arc(R.x + 24, R.y + 22, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#140c08';
  ctx.beginPath(); ctx.arc(R.x + 28, R.y + 19, 7, 0, Math.PI * 2); ctx.fill();
  drawTextFit(TESTI_E6.titoloRipresa, W / 2, R.y + 22, R.w - 70, { size: 10, color: '#f9cb40' });
  drawTextFit(TESTI_E6.riprendi(k.snap.piano, nome), W / 2, R.y + 42, R.w - 24, { size: 9, color: '#ffffff' });
  drawTextFit(TESTI_E6.sottoRipresa, W / 2, R.y + 58, R.w - 24, { size: 7, color: '#c9a679', style: 'italic' });
  if (k.snap.riprese > 0) drawTextFit(TESTI_E6.riprese(k.snap.riprese), W / 2, R.y + 70, R.w - 24, { size: 6.5, color: '#8a6a3f' });
  [TESTI_E6.bottoneRiprendi, TESTI_E6.bottoneNuova].forEach((t, i) => {
    const b = R.bottoni[i];
    const sc = k.sel === i;
    ctx.fillStyle = sc ? '#63150d' : '#2a1b10';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = sc ? '#f9cb40' : '#5a3818'; ctx.lineWidth = sc ? 1.6 : 1;
    ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    drawTextFit(t, b.x + b.w / 2, b.y + b.h / 2 + 3, b.w - 10, { size: 8.5, color: sc ? '#ffffff' : '#e6d2aa' });
  });
  drawTextFit(TESTI_E6.piedeRipresa, W / 2, R.y + R.h - 10, R.w - 24, { size: 6.5, color: '#a8a29e' });
  ctx.restore();
}

/** Scelta del cartello: 0 = riprendi, 1 = nuova notte (il cartello si chiude e il menu va avanti come sempre). */
function confermaCartelloE6(sel = e6.cartello && e6.cartello.sel) {
  const k = e6.cartello;
  if (!k) return;
  e6.cartello = null;
  if (sel === 0) { if (!riprendiNotteE6(k.snap)) e6.cartelloScartato = true; }
  else e6.cartelloScartato = true;
  try { AudioSys.playPasso(); } catch (_) { /* audio facoltativo */ }
}

window.addEventListener('keydown', (e) => {
  if (!e6.cartello) return;
  const c = e.code;
  if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyS', 'Tab'].includes(c)) {
    if (!e.repeat || c !== 'Tab') e6.cartello.sel = e6.cartello.sel ? 0 : 1;
  } else if (!e.repeat && ['Enter', 'NumpadEnter', 'Space', 'KeyE'].includes(c)) confermaCartelloE6();
  else if (!e.repeat && (c === 'Escape' || c === 'Backspace')) confermaCartelloE6(1);
  else return;
  e.preventDefault(); e.stopImmediatePropagation();
}, true);

window.addEventListener('mousedown', (e) => {
  if (!e6.cartello) return;
  const r = canvas.getBoundingClientRect();
  const mx = (e.clientX - r.left) * (W / r.width), my = (e.clientY - r.top) * (H / r.height);
  const R = rettCartelloE6();
  const i = R.bottoni.findIndex((b) => mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h);
  if (i >= 0) confermaCartelloE6(i);
  e.preventDefault(); e.stopImmediatePropagation();
}, true);

try { window.__teatro.interni.comandiB3.menuAperti.push(() => Boolean(e6.cartello)); } catch (_) { /* senza b3: tastiera e mouse */ }

const disegnaFrameBaseE6 = disegnaFrame;
disegnaFrame = function disegnaFrameE6(...args) {
  const r = disegnaFrameBaseE6.apply(this, args);
  try { if (!OPZIONI.miraAssistitaScelta) OPZIONI.miraAssistita = modoMiraE6(); } catch (_) { /* idem */ }
  try { disegnaRiflessiE6(); osservaFaseE6(); disegnaCartelloE6(); } catch (err) { console.error('[e6] disegno', err); }
  return r;
};


// ===========================================================================
// 2. MIRA ASSISTITA
// ===========================================================================
const RIGA_MIRA_E6 = Object.freeze({
  id: 'miraAssistita', tipo: 'scelta', nome: TESTI_E6.rigaMira, nota: TESTI_E6.notaMira,
  scelte: Object.freeze(['spenta', 'leggera', 'piena'].map((k) => Object.freeze([k, TESTI_E6.sceltaMira[k]]))),
});
const GRADI_E6 = Math.PI / 180;

/** Modo di mira in vigore: la scelta del giocatore se l'ha fatta, altrimenti il predefinito del dispositivo. */
function modoMiraE6() {
  if (OPZIONI.miraAssistitaScelta && RIGA_MIRA_E6.scelte.some((x) => x[0] === OPZIONI.miraAssistita)) return OPZIONI.miraAssistita;
  let disp = 'tastiera';
  try { if (typeof b3 !== 'undefined' && b3.dispositivo) disp = b3.dispositivo; } catch (_) { /* senza b3 */ }
  return ASSISTENZA_E6.mira.predefinito[disp] || 'spenta';
}

/** true se il nemico si può colpire adesso (vivo, a terra o abbastanza basso). */
function colpibileE6(n) {
  const M = ASSISTENZA_E6.mira;
  if (!n || n.hp <= 0) return false;
  return (n.airZ || 0) <= (n.boss ? M.altezzaMaxBoss : M.altezzaMaxNemico);
}

/**
 * Angolo corretto per un colpo che parte in `angBase` (radianti): verso il nemico colpibile più allineato
 * dentro il cono (più largo da lontano), di al più correzioneMaxGradi. null = nessuna correzione.
 */
function angoloAssistitoE6(angBase) {
  const M = ASSISTENZA_E6.mira;
  const st = statoRun.stanzaCorrente;
  if (!st || !Array.isArray(st.nemici)) return null;
  const ox = player.x, oy = player.y - 6;
  const maxD = (statoRun.range || 170) * M.gittataMult;
  let best = null, bestDa = Infinity;
  for (const n of st.nemici) {
    if (!colpibileE6(n)) continue;
    const ddx = n.x - ox, ddy = n.y - 6 - oy;
    const d = Math.hypot(ddx, ddy);
    if (d < M.distanzaMinPx || d > maxD) continue;
    let da = Math.atan2(ddy, ddx) - angBase;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    const t = Math.max(0, Math.min(1, (d - M.distanzaMinPx) / Math.max(1, M.lontanoPx - M.distanzaMinPx)));
    const cono = (M.conoVicinoGradi + (M.conoLontanoGradi - M.conoVicinoGradi) * t) * GRADI_E6;
    if (Math.abs(da) > cono || Math.abs(da) >= Math.abs(bestDa)) continue;
    best = n; bestDa = da;
  }
  if (!best || Math.abs(bestDa) < 0.002) return null;
  const lim = M.correzioneMaxGradi * GRADI_E6;
  return angBase + Math.max(-lim, Math.min(lim, bestDa));
}

/** Mira piena: direzione cardinale verso il nemico colpibile più vicino, oppure null. */
function direzioneVersoVicinoE6() {
  const st = statoRun.stanzaCorrente;
  if (!st || !Array.isArray(st.nemici)) return null;
  const maxD = (statoRun.range || 170) * ASSISTENZA_E6.mira.pienaGittataMult;
  let best = null, bd = maxD;
  for (const n of st.nemici) {
    if (!colpibileE6(n)) continue;
    const d = Math.hypot(n.x - player.x, n.y - player.y);
    if (d < bd) { bd = d; best = n; }
  }
  if (!best) return null;
  const dx = best.x - player.x, dy = best.y - player.y;
  return Math.abs(dx) >= Math.abs(dy) ? [dx >= 0 ? 1 : -1, 0] : [0, dy >= 0 ? 1 : -1];
}

const cardinaleE6 = (dx, dy) => (dx === 0 && Math.abs(dy) === 1) || (dy === 0 && Math.abs(dx) === 1);
const mira = { ang: null, senzaDirezione: false, contati: 0 };

const attaccoBaseE6 = eseguiAttacco4Direzioni;
eseguiAttacco4Direzioni = function eseguiAttaccoE6(dx, dy, ...resto) {
  const modo = statoRun.fase === 'in_gioco' ? modoMiraE6() : 'spenta';
  if (modo === 'spenta') { mira.senzaDirezione = false; return attaccoBaseE6.call(this, dx, dy, ...resto); }
  if (modo === 'piena' && mira.senzaDirezione) {
    const d = direzioneVersoVicinoE6();
    if (d) [dx, dy] = d;
  }
  mira.senzaDirezione = false;
  const taddeo = typeof personaggioD2 === 'function' && personaggioD2() === 'taddeo';
  if (taddeo || !cardinaleE6(dx, dy)) return attaccoBaseE6.call(this, dx, dy, ...resto); // il maglio si corregge alla partenza
  const prima = player.swordAnimTick;
  mira.ang = angoloAssistitoE6(Math.atan2(dy, dx));
  try {
    return attaccoBaseE6.call(this, dx, dy, ...resto);
  } finally {
    if (mira.ang !== null && player.swordAnimTick === 0 && prima !== 0) player.swordAngle = mira.ang;
    mira.ang = null;
  }
};

const sparaBaseE6 = sparaProiettiliDirezione;
sparaProiettiliDirezione = function sparaE6(dx, dy, ...resto) {
  if (mira.ang === null) return sparaBaseE6.call(this, dx, dy, ...resto);
  const n0 = statoRun.proiettili.length;
  const r = sparaBaseE6.call(this, Math.cos(mira.ang), Math.sin(mira.ang), ...resto);
  for (let i = n0; i < statoRun.proiettili.length; i++) statoRun.proiettili[i].assistitoE6 = tick;
  mira.contati++;
  return r;
};

// Taddeo: il maglio prende la direzione assistita quando parte (la direzione del burattino resta cardinale)
if (typeof colpoMaglioD2 === 'function') {
  const maglioBaseE6 = colpoMaglioD2;
  colpoMaglioD2 = function colpoMaglioE6(dx, dy, ...resto) {
    if (modoMiraE6() === 'spenta' || !cardinaleE6(dx, dy)) return maglioBaseE6.call(this, dx, dy, ...resto);
    const ang = angoloAssistitoE6(Math.atan2(dy, dx));
    if (ang === null) return maglioBaseE6.call(this, dx, dy, ...resto);
    try {
      mira.contati++;
      return maglioBaseE6.call(this, Math.cos(ang), Math.sin(ang), ...resto);
    } finally { player.dirX = dx; player.dirY = dy; }
  };
}

// Sparo «senza direzione»: Spazio (tastiera), R3 (gamepad), levetta a tocco appoggiata al centro.
window.addEventListener('keydown', (e) => { if (e.code === 'Space' && statoRun.fase === 'in_gioco') mira.senzaDirezione = true; }, true);
window.addEventListener('keydown', () => { mira.senzaDirezione = false; });

/** La levetta di sparo a tocco è tenuta ma vicino al centro (nessuna direzione netta). */
function toccoSenzaDirezioneE6() {
  try {
    if (typeof c2 === 'undefined' || !c2.leve || !c2.leve.sparo || c2.leve.sparo.id === null) return false;
    const L = c2.leve.sparo;
    return !(L.forza > ASSISTENZA_E6.mira.toccoForzaSenzaDirezione) && !keys.ArrowUp && !keys.ArrowDown && !keys.ArrowLeft && !keys.ArrowRight;
  } catch (_) { return false; }
}

function padSenzaDirezioneE6() {
  try {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const g of pads) { const b = g && g.buttons && g.buttons[ASSISTENZA_E6.mira.padBottoneSenzaDirezione]; if (b && b.pressed) return true; }
  } catch (_) { /* niente gamepad */ }
  return false;
}

const passoLogicoBaseE6 = passoLogico;
passoLogico = function passoLogicoE6(...args) {
  const r = passoLogicoBaseE6.apply(this, args);
  try {
    if (statoRun.fase === 'in_gioco' && !statoRun.pausa && player.cooldown <= 0 && modoMiraE6() === 'piena'
      && (toccoSenzaDirezioneE6() || padSenzaDirezioneE6())) {
      const d = direzioneVersoVicinoE6();
      if (d) eseguiAttacco4Direzioni(d[0], d[1]);
    }
    mira.senzaDirezione = false;
  } catch (err) { console.error('[e6] mira', err); }
  return r;
};

/** Il piccolo riflesso sui colpi corretti (nessun segno a terra, niente sui nemici). */
function disegnaRiflessiE6() {
  const lista = statoRun.proiettili;
  if (!lista || !lista.length || statoRun.fase !== 'in_gioco') return;
  const durata = ASSISTENZA_E6.mira.riflessoTick;
  ctx.save();
  for (const p of lista) {
    if (p.assistitoE6 == null) continue;
    const eta = tick - p.assistitoE6;
    if (eta < 0 || eta > durata) continue;
    ctx.globalAlpha = 0.85 * (1 - eta / durata);
    ctx.fillStyle = '#fff4c2';
    ctx.beginPath(); ctx.arc(p.x - 1.2, p.y - 1.4, 1.4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// --- riga nelle Opzioni (pagina «Suono e scena»), dopo «Testo grande» ---
if (typeof righeB3 === 'function') {
  const righeBaseE6 = righeB3;
  let cacheRigheE6 = null;
  righeB3 = function righeE6(pagina, ...resto) {
    const righe = righeBaseE6.call(this, pagina, ...resto);
    if (righe !== RIGHE_B3.scena) return righe;
    if (!cacheRigheE6) {
      const i = righe.findIndex((r) => r.id === 'testoGrande');
      cacheRigheE6 = righe.slice();
      cacheRigheE6.splice(i >= 0 ? i + 1 : cacheRigheE6.length - 3, 0, RIGA_MIRA_E6);
      Object.freeze(cacheRigheE6);
    }
    return cacheRigheE6;
  };
}
if (typeof impostaOpzioneB3 === 'function') {
  const impostaBaseE6 = impostaOpzioneB3;
  impostaOpzioneB3 = function impostaOpzioneE6(id, valore, ...resto) {
    if (id === RIGA_MIRA_E6.id) { OPZIONI.miraAssistitaScelta = true; OPZIONI.miraAssistita = modoMiraE6(); }
    const r = impostaBaseE6.call(this, id, valore, ...resto);
    if (id === RIGA_MIRA_E6.id) salvaOpzioni();
    return r;
  };
}

// ===========================================================================
// SONDA QA
// ===========================================================================
Object.assign(window.__teatro.interni, {
  ASSISTENZA_E6, TESTI_E6,
  assistenzaE6: Object.freeze({
    istantanea: () => leggiIstantaneaE6(),
    scrivi: scriviIstantaneaE6,
    cancella: () => cancellaIstantaneaE6(),
    riprendi: () => riprendiNotteE6(),
    get cartello() { return e6.cartello ? { piano: e6.cartello.snap.piano, personaggio: e6.cartello.snap.personaggio, sel: e6.cartello.sel } : null; },
    conferma: (i) => confermaCartelloE6(i),
    get riprese() { return e6.riprese; },
  }),
  miraE6: Object.freeze({
    modo: () => modoMiraE6(),
    angolo: (ang) => angoloAssistitoE6(ang),
    direzioneVicino: () => direzioneVersoVicinoE6(),
    get correzioni() { return mira.contati; },
    sparaSenzaDirezione() { mira.senzaDirezione = true; eseguiAttacco4Direzioni(player.dirX, player.dirY); },
  }),
});
