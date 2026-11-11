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
 * Avvolge (chiamando sempre la base): avviaPiano, t4Gancio, disegnaFrame. Nessun gancio nei file altrui.
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
    percorso: statoRun.percorso != null ? copiaE6(statoRun.percorso) : null,
    sigilli,
    registro: reg,
    riprese: e6.riprese,
  };
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
    if (snap.percorso != null) statoRun.percorso = snap.percorso;
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
  try { osservaFaseE6(); disegnaCartelloE6(); } catch (err) { console.error('[e6] disegno', err); }
  return r;
};

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
});
