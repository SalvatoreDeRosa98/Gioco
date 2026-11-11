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
 *   3. IL CONTO DELLA NOTTE: alla morte e alla vittoria la pergamena del registro (a7) si disegna come locandina:
 *      chi ti ha battuto (figura a ombre), piano, tempo, stanze, nemici, icone degli oggetti, trasformazioni, il
 *      momento migliore e un consiglio legato alla causa (CONSIGLI_E6). Stessi dati, momenti e chiusura di a7
 *      (un tasto, un click/tocco, Ⓐ): la sequenza di morte non cambia.
 *
 * Avvolge (chiamando sempre la base): avviaPiano, t4Gancio, disegnaFrame, eseguiAttacco4Direzioni,
 * sparaProiettiliDirezione, colpoMaglioD2, passoLogico, righeB3, impostaOpzioneB3, disegnaPergamenaA7. Nessun gancio nei file altrui.
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
  conto: Object.freeze({
    x: 70, y: 28, w: 500, h: 304,
    oggettiMax: 14,             // icone degli oggetti presi (poi «+N»)
    scalaIcona: 1.5,
    serieMinima: 2,             // stanze di fila senza danni perché diventino «il momento migliore»
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
  contoTitolo: (n) => `IL CONTO DELLA NOTTE ${n}`,
  contoVittoria: (n) => `NOTTE ${n}: I FILI SONO SPEZZATI`,
  battuto: 'Ti ha battuto',
  vittoria: 'Donna Luciana è caduta. Il Teatro continua.',
  voci: Object.freeze({ piano: 'Piano', tempo: 'Tempo', stanze: 'Stanze ripulite', nemici: 'Nemici battuti', oggetti: 'Oggetti presi', trasf: 'Trasformazioni' }),
  nessuno: 'nessuna',
  momento: 'Il momento migliore',
  serie: (n) => `${n} stanze di fila senza un graffio`,
  boss: (nome) => `Hai abbattuto ${nome}`,
  nemiciMomento: (n) => `${n} nemici giù prima del sipario`,
  momentoVuoto: 'Il sipario si è alzato: la prossima volta si va più lontano',
  consiglio: 'Per la prossima notte',
  chiudi: 'Premi [E] o tocca per tornare in piazza',
  chiudiVittoria: 'Premi [E] o tocca per proseguire',
  trasformazione: (t) => `${t}`,
});

/**
 * Consiglio legato alla causa della morte: la prima riga la cui espressione riconosce il nome della fonte.
 * Ogni frase dice cosa guardare (la posa che annuncia il colpo). Da approvare dall'autore.
 */
const CONSIGLI_E6 = Object.freeze([
  [/pugno.*Burattinaio/i, 'Prima del pugno la mano si ferma in alto e si chiude: quando smette di seguirti, fai due passi di lato.'],
  [/mano.*Burattinaio|presa/i, 'La mano aperta che scende piano cerca di prenderti: tieniti lontano dalla sua ombra e colpiscila quando è a terra.'],
  [/forbici.*Burattinaio|Forbici del Burattinaio/i, 'Le forbici si aprono prima di tagliare: quando le lame si allargano, esci dalla loro linea.'],
  [/Gatto dei Quattro Canti/i, 'Il Gatto si acquatta prima del balzo e da in alto non si colpisce: spostati quando abbassa la coda, colpisci quando atterra.'],
  [/Custode di Marmo|Madre di Marmo|statua/i, 'Il Custode si chiude e incassa: aspetta che si apra, è lì che i colpi fanno male davvero.'],
  [/Capitano di Piombo/i, 'Il Capitano punta il moschetto prima di sparare: quando alza la canna, mettiti di traverso alla sua linea.'],
  [/Spezzafili/i, 'Lo Spezzafili carica il colpo all\'indietro: quando si piega, allontanati prima che sciolga il braccio.'],
  [/Regina delle Vespe/i, 'La Regina si ferma a mezz\'aria prima della picchiata: muoviti in quel momento, non dopo.'],
  [/Donna Luciana|Burattinaia/i, 'Donna Luciana tende i fili prima di tirarli: quando li vedi tesi, cambia corsia.'],
  [/Vespa/i, 'La vespa vibra sul posto prima di lanciarsi: se smette di girarti attorno, scansati di lato.'],
  [/Gatto/i, 'Il gatto si abbassa sulle zampe prima di saltare: appena lo vedi acquattato, cambia direzione.'],
  [/Guardia|Plotone|Soldat/i, 'La guardia si pianta e alza l\'arma prima del colpo: quando si ferma, esci dalla sua linea di tiro.'],
  [/Maschera|Pulcinell/i, 'La maschera chiusa incassa quasi tutto: aspetta che si apra e colpisci allora, tenendoti a distanza.'],
  [/Bozzo|esplosion|bomba|scoppio/i, 'Il bozzo gonfio sta per scoppiare: non colpirlo da vicino, allontanati e tira da lontano.'],
  [/sangue|ceppo|rovi|Camerini|sacrificio/i, 'Le stanze speciali chiedono Maschere: entraci quando sei pieno, non a mezza Maschera.'],
  [/un colpo di|proiettil|Velo/i, 'I colpi partono dopo una piccola pausa di chi spara: quando un nemico si ferma e ti guarda, muoviti di lato.'],
  [/./, 'Chi ti ha battuto si è fermato un attimo prima di colpire: guarda la sua posa e muoviti in quell\'attimo.'],
]);

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
    if ((nome === 'morte' && statoRun.fase === 'in_gioco') || nome === 'bossSconfitto') arricchisciVoceE6();
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
  drawTextFit(TESTI_E6.sottoRipresa, W / 2, R.y + 58, R.w - 24, { size: 7.5, color: '#c9a679', style: 'italic' });
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
    osservaContoE6();
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
// 3. IL CONTO DELLA NOTTE (al posto della pergamena del registro, stessi momenti e stessa chiusura di a7)
// ===========================================================================
const conto = { serie: 0, serieMax: 0, pulite: 0, danni: 0, trasf: [], runVista: null };

/** Consiglio per la causa `causa` (mai generico: c'è sempre una riga che riconosce la fonte). */
function consiglioE6(causa) {
  const c = String(causa || 'le ombre');
  for (const [re, frase] of CONSIGLI_E6) if (re.test(c)) return frase;
  return CONSIGLI_E6[CONSIGLI_E6.length - 1][1];
}

/** A ogni tick: stanze ripulite di fila senza danni (dati del registro a7, niente contatori doppi). */
function osservaContoE6() {
  if (typeof a7 === 'undefined' || !a7.run) return;
  const r = a7.run;
  if (conto.runVista !== r.id) { conto.runVista = r.id; conto.serie = 0; conto.serieMax = 0; conto.pulite = r.stanzePulite; conto.danni = r.danni.length; }
  if (r.danni.length > conto.danni) { conto.danni = r.danni.length; conto.serie = 0; }
  if (r.stanzePulite > conto.pulite) { conto.serie += r.stanzePulite - conto.pulite; conto.pulite = r.stanzePulite; conto.serieMax = Math.max(conto.serieMax, conto.serie); }
}

/** Trasformazioni della run in corso (nomi dei temi di b4). */
function trasformazioniE6() {
  const s = statoRun.trasfB4;
  if (!s || s.run !== statoRun.numeroRun || !s.attive) return [];
  return Object.keys(s.attive).filter((k) => s.attive[k]).map((k) => (typeof TEMI_B4 !== 'undefined' && TEMI_B4.nomi[k]) || k);
}

/** Il momento migliore della notte, dai dati del registro. */
function momentoE6(v) {
  const C = ASSISTENZA_E6.conto;
  if (v.serieE6 >= C.serieMinima) return TESTI_E6.serie(v.serieE6);
  if (v.boss && v.boss.length) return TESTI_E6.boss(v.boss[v.boss.length - 1].nome);
  if (v.nemiciUccisi > 0) return TESTI_E6.nemiciMomento(v.nemiciUccisi);
  return TESTI_E6.momentoVuoto;
}

/** Sagoma a ombre di chi ha battuto il giocatore (famiglia riconosciuta dal nome). */
function disegnaFiguraE6(causa, x, y) {
  const c = String(causa || '');
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#0b0705'; ctx.strokeStyle = '#f2b15a'; ctx.lineWidth = 1.4; ctx.lineJoin = 'round';
  // fili d'oro dall'alto
  ctx.save(); ctx.strokeStyle = 'rgba(249, 203, 64, 0.7)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(-10, -46); ctx.lineTo(-10, -18); ctx.moveTo(10, -46); ctx.lineTo(10, -18); ctx.moveTo(0, -46); ctx.lineTo(0, -30); ctx.stroke(); ctx.restore();
  ctx.beginPath();
  if (/gatt/i.test(c)) {
    ctx.ellipse(0, 6, 18, 10, 0, 0, Math.PI * 2);
    ctx.moveTo(14, -6); ctx.arc(14, -6, 8, 0, Math.PI * 2);
    ctx.moveTo(9, -12); ctx.lineTo(11, -20); ctx.lineTo(15, -13); ctx.lineTo(19, -20); ctx.lineTo(20, -11);
    ctx.moveTo(-18, 4); ctx.quadraticCurveTo(-30, -6, -24, -20);
  } else if (/vesp/i.test(c)) {
    ctx.ellipse(0, 4, 8, 13, 0, 0, Math.PI * 2);
    ctx.moveTo(0, -12); ctx.arc(0, -12, 6, 0, Math.PI * 2);
    ctx.moveTo(-6, -2); ctx.ellipse(-15, -6, 10, 5, -0.4, 0, Math.PI * 2);
    ctx.moveTo(6, -2); ctx.ellipse(15, -6, 10, 5, 0.4, 0, Math.PI * 2);
  } else if (/mano|pugno|presa|forbici|Burattinaio/i.test(c)) {
    ctx.moveTo(-14, 18); ctx.lineTo(-16, -4); ctx.lineTo(-12, -20); ctx.lineTo(-8, -4); ctx.lineTo(-5, -24); ctx.lineTo(-1, -4);
    ctx.lineTo(3, -24); ctx.lineTo(6, -4); ctx.lineTo(11, -18); ctx.lineTo(13, 0); ctx.lineTo(20, -6); ctx.lineTo(16, 18); ctx.closePath();
  } else {
    // marionetta in piedi (guardie, maschere, boss): testa, busto a campana, braccia appese
    ctx.arc(0, -18, 7, 0, Math.PI * 2);
    ctx.moveTo(-8, -9); ctx.lineTo(8, -9); ctx.lineTo(13, 20); ctx.lineTo(-13, 20); ctx.closePath();
    ctx.moveTo(-9, -7); ctx.lineTo(-17, 8); ctx.lineTo(-14, 9); ctx.lineTo(-7, -2);
    ctx.moveTo(9, -7); ctx.lineTo(17, 8); ctx.lineTo(14, 9); ctx.lineTo(7, -2);
    if (/Guardia|Capitano|Plotone/i.test(c)) { ctx.moveTo(-6, -24); ctx.lineTo(6, -24); ctx.lineTo(3, -34); ctx.lineTo(-3, -34); ctx.closePath(); }
  }
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

/** Spezza `testo` in righe larghe al più `maxW` px (parole intere). */
function aCapoE6(testo, maxW, size) {
  ctx.save();
  ctx.font = `italic bold ${size}px Georgia, serif`;
  const righe = [];
  let riga = '';
  for (const p of String(testo).split(' ')) {
    const prova = riga ? `${riga} ${p}` : p;
    if (ctx.measureText(prova).width > maxW && riga) { righe.push(riga); riga = p; } else riga = prova;
  }
  if (riga) righe.push(riga);
  ctx.restore();
  return righe;
}

/** La locandina del conto: sostituisce il disegno della pergamena di a7 (stessa voce del registro). */
function disegnaContoE6() {
  const { voce: v, tipo } = a7.pergamena;
  const C = ASSISTENZA_E6.conto;
  const vitt = tipo === 'vittoria';
  const T = (t, x, y, w, o = {}) => drawTextFit(t, x, y, w, { size: 8, color: '#e6d2aa', align: 'left', ...o });
  ctx.save();
  ctx.fillStyle = 'rgba(5, 3, 2, 0.78)'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#140c08'; ctx.fillRect(C.x, C.y, C.w, C.h);
  ctx.strokeStyle = '#f9cb40'; ctx.lineWidth = 2; ctx.strokeRect(C.x, C.y, C.w, C.h);
  ctx.strokeStyle = '#5a3818'; ctx.lineWidth = 1; ctx.strokeRect(C.x + 5, C.y + 5, C.w - 10, C.h - 10);
  const cx = C.x + C.w / 2;
  T(vitt ? TESTI_E6.contoVittoria(v.notte) : TESTI_E6.contoTitolo(v.notte), cx, C.y + 24, C.w - 40, { size: 13, color: '#f9cb40', align: 'center' });
  T(v.nomePersonaggio || '', cx, C.y + 38, C.w - 40, { size: 7.5, color: '#a8a29e', align: 'center', style: 'italic' });
  // a sinistra: chi ti ha battuto, con la sua figura
  const fx = C.x + 74;
  ctx.fillStyle = '#2a1b10'; ctx.fillRect(C.x + 18, C.y + 48, 112, 120);
  ctx.strokeStyle = '#5a3818'; ctx.strokeRect(C.x + 18.5, C.y + 48.5, 111, 119);
  if (vitt) T('★', fx, C.y + 112, 40, { size: 26, color: '#f9cb40', align: 'center' });
  else {
    disegnaFiguraE6(v.causa, fx, C.y + 116);
    T(TESTI_E6.battuto, fx, C.y + 60, 104, { size: 7, color: '#c9a679', align: 'center', style: 'italic' });
  }
  T(vitt ? '' : (v.causa || 'le ombre'), fx, C.y + 158, 104, { size: 7.5, color: '#ffffff', align: 'center' });
  // a destra: i numeri
  const xs = C.x + 146, w2 = C.w - 164;
  const righe = [
    [TESTI_E6.voci.piano, String(v.piano)],
    [TESTI_E6.voci.tempo, tempoA7(v.tempoMs)],
    [TESTI_E6.voci.stanze, String(v.stanzePulite)],
    [TESTI_E6.voci.nemici, String(v.nemiciUccisi)],
    [TESTI_E6.voci.trasf, (v.trasfE6 && v.trasfE6.length) ? v.trasfE6.join(', ') : TESTI_E6.nessuno],
  ];
  righe.forEach(([k, val], i) => {
    const y = C.y + 60 + i * 15;
    T(`${k}`, xs, y, 110, { size: 7.5, color: '#c9a679' });
    T(val, xs + 116, y, w2 - 116, { size: 8.5, color: '#ffffff' });
  });
  const yO = C.y + 60 + righe.length * 15 + 2;
  T(`${TESTI_E6.voci.oggetti} (${v.oggetti.length})`, xs, yO, 110, { size: 7.5, color: '#c9a679' });
  const passo = 12 * C.scalaIcona + 4;
  v.oggetti.slice(0, C.oggettiMax).forEach((o, i) => {
    const base = typeof trovaOggettoB === 'function' ? trovaOggettoB(o.id) : null;
    const spr = (base && (SPRITE_OGGETTI[base.sprite] || SPRITE_OGGETTI[base.id])) || SPRITE_OGGETTI[o.id];
    const ix = xs + 10 + (i % 7) * passo, iy = yO + 16 + Math.floor(i / 7) * passo;
    if (spr && o.nome !== '?') drawPixelSprite(spr, ix, iy, C.scalaIcona);
    else T('?', ix, iy + 3, 12, { size: 9, color: '#a8a29e', align: 'center' });
  });
  if (v.oggetti.length > C.oggettiMax) T(`+${v.oggetti.length - C.oggettiMax}`, xs + 10 + 7 * passo, yO + 16 + passo, 30, { size: 8, color: '#c9a679' });
  // in basso: il momento migliore e il consiglio
  const yM = C.y + 184;
  ctx.strokeStyle = '#5a3818'; ctx.beginPath(); ctx.moveTo(C.x + 18, yM - 8); ctx.lineTo(C.x + C.w - 18, yM - 8); ctx.stroke();
  T(`✦ ${TESTI_E6.momento}`, C.x + 22, yM + 4, 200, { size: 7.5, color: '#c9a679' });
  T(momentoE6(v), C.x + 22, yM + 20, C.w - 44, { size: 9, color: '#ffffff' });
  if (!vitt) {
    T(`✦ ${TESTI_E6.consiglio}`, C.x + 22, yM + 42, 200, { size: 7.5, color: '#c9a679' });
    const righeC = aCapoE6(consiglioE6(v.causa), C.w - 44, 8.5);
    righeC.slice(0, 3).forEach((rg, i) => T(rg, C.x + 22, yM + 58 + i * 13, C.w - 44, { size: 8.5, color: '#f2d9a6', style: 'italic' }));
  } else T(TESTI_E6.vittoria, C.x + 22, yM + 46, C.w - 44, { size: 8.5, color: '#f2d9a6', style: 'italic' });
  T(vitt ? TESTI_E6.chiudiVittoria : TESTI_E6.chiudi, cx, C.y + C.h - 14, C.w - 40, { size: 7.5, color: '#a8a29e', align: 'center' });
  ctx.restore();
}

if (typeof disegnaPergamenaA7 === 'function') {
  const pergamenaBaseE6 = disegnaPergamenaA7;
  disegnaPergamenaA7 = function disegnaPergamenaE6(...args) {
    try { if (a7.pergamena && a7.pergamena.voce) { disegnaContoE6(); return undefined; } } catch (err) { console.error('[e6] conto', err); }
    return pergamenaBaseE6.apply(this, args);
  };
}

/** Prima che a7 chiuda la voce (morte, vittoria): serie migliore e trasformazioni dentro la voce stessa. */
function arricchisciVoceE6() {
  if (typeof a7 === 'undefined' || !a7.run) return;
  osservaContoE6();
  a7.run.serieE6 = conto.serieMax;
  a7.run.trasfE6 = trasformazioniE6();
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
    consiglio: (c) => consiglioE6(c),
    sparaSenzaDirezione() { mira.senzaDirezione = true; eseguiAttacco4Direzioni(player.dirX, player.dirY); },
  }),
});
