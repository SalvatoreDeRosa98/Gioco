/*
 * teatro/a3-stanze-speciali.js — Miglioramento 3: stanze speciali in più (ispirate alle stanze della
 * Sfida, del Sacrificio, Maledetta e dell'Arcade di un noto roguelike a stanze; nomi, testi e oggetti
 * sono del Teatro: Caserta 1845, marionette e lotto napoletano).
 *
 *   sfida      — porta d'acciaio ⚔; dentro un piedistallo col premio. Toccandolo le porte si sbarrano e
 *                arrivano 2-3 ondate di comprimari; finite le ondate il premio si raccoglie. Si entra solo
 *                con tutte le Maschere (STANZE_SPECIALI_A3.sfida.soloSalutePiena).
 *   sacrificio — il Ceppo dei Chiodi †: salirci costa ½ Maschera; più sacrifici, premi migliori.
 *   maledetta  — porta di rovi ✷: ogni passaggio (entrata o uscita) costa ½ Maschera; dentro un premio,
 *                a volte custodito da nemici.
 *   bisca      — dal piano 2: il Banco del Lotto (1🪙 a giocata, numero estratto con la smorfia) e, a volte,
 *                la Cartomante che legge la sorte per un grano.
 *
 * Integrazione senza toccare i file di base: si avvolgono le funzioni di primo livello generaMappaPiano
 * (le stanze nuove si appendono come foglie a una stanza di combattimento, mai accanto al boss, al massimo
 * una per tipo), entraInStanza (costi e divieti alle porte, avvisi), verificaStanzaPulita (ondate),
 * interagisciStanza (tasto E), passoLogico (tocchi e attese), disegnaStanzaPixelArt (arredi e segni sulle
 * porte) e disegnaHUDPixelArt (icone sulla minimappa). Verifica: tools/qa-teatro-stanze-speciali.js.
 * Script classico: le dichiarazioni di primo livello stanno nello scope globale condiviso (teatro/LEGGIMI.md).
 */

/** Tabella dei valori di gioco delle stanze speciali (miglioramento 3). Tutto si accorda da qui. */
const STANZE_SPECIALI_A3 = Object.freeze({
  /** Ordine di piazzamento (il primo ha più celle libere fra cui scegliere). */
  ordine: Object.freeze(['sfida', 'sacrificio', 'maledetta', 'bisca']),
  /**
   * Probabilità che il tipo compaia nel piano (chiave: piano, oltre l'ultima chiave vale l'ultima: dal ciclo 2
   * in poi valgono i valori del piano 4). Al massimo una stanza per tipo per piano.
   */
  probPerPiano: Object.freeze({
    sfida: Object.freeze({ 1: 0.35, 2: 0.45, 3: 0.5, 4: 0.5 }),
    sacrificio: Object.freeze({ 1: 0.25, 2: 0.3, 3: 0.35, 4: 0.35 }),
    maledetta: Object.freeze({ 1: 0.2, 2: 0.35, 3: 0.4, 4: 0.45 }),
    bisca: Object.freeze({ 1: 0, 2: 0.5, 3: 0.5, 4: 0.5 }),
  }),
  /** Tipi di stanza a cui una stanza speciale può attaccarsi (vicolo cieco con una sola porta). */
  genitori: Object.freeze(['normale']),
  /** Aspetto: cornice della porta, fondo della stanza, colore e icona sulla minimappa. */
  aspetto: Object.freeze({
    sfida: Object.freeze({ cornice: '#cbd5e1', fondo: '#1c2633', minimappa: '#334155', icona: '⚔' }),
    sacrificio: Object.freeze({ cornice: '#b91c1c', fondo: '#2a0d0a', minimappa: '#5b1a12', icona: '†' }),
    maledetta: Object.freeze({ cornice: '#4d7c0f', fondo: '#1a0f1f', minimappa: '#3b0d3f', icona: '✷', spine: '#7f1d1d' }),
    bisca: Object.freeze({ cornice: '#16a34a', fondo: '#0f2a1a', minimappa: '#14532d', icona: '🎲' }),
  }),
  sfida: Object.freeze({
    soloSalutePiena: true,     // si entra solo con tutte le Maschere (come nell'originale)
    ondateMin: 2, ondateMax: 3,
    pausaFraOndateMs: 900,     // respiro fra un'ondata e l'altra
    raggioTocco: 22,           // px dal piedistallo per far partire la sfida
    piedistallo: Object.freeze({ x: 320, y: 186 }),
    probPremioForte: 0.15,     // il premio è un oggetto; a volte forte
  }),
  sacrificio: Object.freeze({
    costoHalf: 1,              // ½ Maschera a sacrificio
    letale: false,             // false: il ceppo non prende l'ultima mezza Maschera
    maxSacrifici: 6,           // poi il ceppo è sazio
    raggio: 18,                // px dal ceppo
    ceppo: Object.freeze({ x: 320, y: 176 }),
    /** Pesi dei premi per il sacrificio n (riga n-1; oltre l'ultima vale l'ultima). */
    premi: Object.freeze([
      Object.freeze({ niente: 0.5, monete: 0.5, cuore: 0, oggetto: 0 }),
      Object.freeze({ niente: 0.4, monete: 0.4, cuore: 0.2, oggetto: 0 }),
      Object.freeze({ niente: 0.3, monete: 0.3, cuore: 0.25, oggetto: 0.15 }),
      Object.freeze({ niente: 0.25, monete: 0.25, cuore: 0.2, oggetto: 0.3 }),
      Object.freeze({ niente: 0.2, monete: 0.2, cuore: 0.2, oggetto: 0.4 }),
    ]),
    moneteMin: 1, moneteMax: 3,
    cuoreHalf: 2,              // una Maschera intera
  }),
  maledetta: Object.freeze({
    costoHalf: 1,              // ½ Maschera a ogni passaggio dalle porte di rovi
    letale: false,             // false: non si entra se costerebbe l'ultima mezza Maschera; si esce gratis
    contenuto: Object.freeze({ forziere: 0.2, monete: 0.35, oggetto: 0.25, nemici: 0.2 }),
    moneteMin: 3, moneteMax: 5,
    moneteNemici: 3,           // monete in più quando i nemici custodi sono sconfitti
    probOggettoNemici: 0.5,    // ... e a volte anche un oggetto
  }),
  bisca: Object.freeze({
    daPiano: 2,
    costo: 1,                  // 🪙 a giocata al banco del lotto
    giocateMax: 8,             // poi Don Gennaro chiude il banco
    banco: Object.freeze({ x: 250, y: 170, raggioUso: 44, raggioCorpo: 18 }),
    // (bilancio 7) prima niente 0,45 / monete 0,3 / ½ 0,12 / cuore 0,08 / oggetto 0,05: una giocata da 1🪙 valeva ~1,42🪙
    // (cure al prezzo della Fucina, oggetto al prezzo base): il banco era una fonte netta di valore. Ora ~1,15🪙.
    premi: Object.freeze({ niente: 0.54, monete: 0.28, mezzaMaschera: 0.1, cuore: 0.05, oggetto: 0.03 }),
    moneteMin: 2, moneteMax: 3,
    probCartomante: 0.5,
    cartomante: Object.freeze({
      x: 400, y: 170, raggioUso: 44, raggioCorpo: 14,
      costo: 1, probBase: 0.12, probPerMoneta: 0.08, // probabilità del dono: base + (grani dati - 1) × passo
      premi: Object.freeze({ cuore: 0.5, oggetto: 0.3, monete: 0.2 }),
      moneteDono: 4,
    }),
  }),
  /** Avvisi ripetuti (porta sbarrata, ceppo che rifiuta) non più spesso di così. */
  intervalloAvvisiMs: 1500,
  /** Spinta all'indietro quando una porta rifiuta il passaggio. */
  respintaPx: 30,
});

/** Smorfia napoletana (solo numeri dal senso innocuo): il resto esce col solo numero. */
const SMORFIA_A3 = Object.freeze({
  3: "'a jatta", 4: "'o puorco", 5: "'a mano", 7: "'o vasetto", 8: "'a Maronna", 9: "'a figliata",
  10: "'e fasule", 11: "'e suricille", 13: "Sant'Antonio", 17: "'a disgrazia", 18: "'o sanghe", 22: "'o pazzo",
  33: "ll'anne 'e Cristo", 34: "'a capa", 37: "'o monaco", 47: "'o muorto", 48: "'o muorto che parla",
  55: "'a museca", 77: "'e diavule", 82: "'a tavula 'mbandita", 90: "'a paura",
});

/** Frasi della Cartomante quando la sorte non dà ancora nulla (da approvare dall'autore). */
const FRASI_CARTOMANTE_A3 = Object.freeze([
  'Vedo una porta che non sai ancora aprire...',
  "Il Re di Denari ti guarda storto. Un altro grano, figlio mio.",
  'La notte è lunga e i fili sono corti.',
  'Una donna alla finestra pensa a te. Oppure al bucato.',
  'Le carte sono timide stasera: pagale ancora.',
]);

const TIPI_A3 = new Set(STANZE_SPECIALI_A3.ordine);
const DIREZIONI_A3 = Object.freeze([
  Object.freeze({ lato: 'N', opposto: 'S', dx: 0, dy: -1 }),
  Object.freeze({ lato: 'E', opposto: 'W', dx: 1, dy: 0 }),
  Object.freeze({ lato: 'S', opposto: 'N', dx: 0, dy: 1 }),
  Object.freeze({ lato: 'W', opposto: 'E', dx: -1, dy: 0 }),
]);
const OPPOSTO_A3 = Object.freeze({ N: 'S', S: 'N', E: 'W', W: 'E' });
let ultimoAvvisoA3 = { testo: '', ms: -Infinity };

// ===========================================================================
// UTILITÀ
// ===========================================================================

/** Probabilità del tipo nel piano (oltre l'ultima chiave vale l'ultima). */
function probStanzaA3(tipo, piano) {
  const tab = STANZE_SPECIALI_A3.probPerPiano[tipo] || {};
  const chiavi = Object.keys(tab).map(Number).sort((a, b) => a - b);
  if (!chiavi.length) return 0;
  const k = chiavi.filter((c) => c <= piano).pop() ?? chiavi[0];
  return tab[Math.min(k, chiavi[chiavi.length - 1])] || 0;
}

/** Estrazione pesata: {chiave: peso} → chiave. Usa il rng del seme. */
function estraiPesataA3(pesi) {
  const voci = Object.entries(pesi).filter(([, p]) => p > 0);
  const tot = voci.reduce((a, [, p]) => a + p, 0);
  if (!tot) return voci.length ? voci[0][0] : null;
  let r = rng() * tot;
  for (const [k, p] of voci) { r -= p; if (r < 0) return k; }
  return voci[voci.length - 1][0];
}

const interoFraA3 = (min, max) => min + Math.floor(rng() * (max - min + 1));

/** Avviso con banner, non ripetuto entro intervalloAvvisiMs. */
function avvisaA3(testo, durata = 150) {
  const ora = performance.now();
  if (ultimoAvvisoA3.testo === testo && ora - ultimoAvvisoA3.ms < STANZE_SPECIALI_A3.intervalloAvvisiMs) return;
  ultimoAvvisoA3 = { testo, ms: ora };
  mostraBanner(testo, durata);
}

/** Monete a terra senza il filtro di rarità del piano 1 (sono un premio promesso, non un drop). */
function daiMoneteA3(st, n, x, y) {
  for (let i = 0; i < n; i++) {
    st.oggettiATerra.push({
      tipo: 'moneta', valore: 1, sprite: 'moneta1',
      x: Math.max(ARENA.x1 + 20, Math.min(ARENA.x2 - 20, x + (rng() - 0.5) * 40)),
      y: Math.max(ARENA.y1 + 20, Math.min(ARENA.y2 - 20, y + (rng() - 0.5) * 24)),
    });
  }
}

function daiCuraA3(st, half, x, y) {
  st.oggettiATerra.push({ tipo: 'cura', valore: half, sprite: half >= 2 ? 'cuore' : 'mezzaMaschera', x, y });
}

/** Oggetto su un piedistallo (gestito dal codice di base). Se ce n'è già uno da prendere, false. */
function daiOggettoA3(st, x, y, forte = false) {
  if (st.oggettoPiedistallo && !st.oggettoPiedistallo.preso) return null;
  const o = forte ? estraiOggettoForte() : estraiOggettoBase();
  if (!o) return null;
  st.oggettoPiedistallo = { ...o, x, y, preso: false, forteGratis: Boolean(forte && o.tier === 'forte') };
  return st.oggettoPiedistallo;
}

/** Forziere della squadra a1, se c'è (firma: generaForziere(tipo, x, y, stanza)). */
function daiForziereA3(st, x, y) {
  const I = window.__teatro && window.__teatro.interni;
  if (!I || typeof I.generaForziere !== 'function') return false;
  try { I.generaForziere('comune', x, y, st); return true; } catch (err) { console.error('[A3] generaForziere', err); return false; }
}

/**
 * Prezzo di sangue (sacrificio, rovi): toglie costoHalf senza scudi né i-frame (è un prezzo, non un colpo).
 * Se costerebbe l'ultima Maschera: con `letale` passa dal colpo normale (morte e risveglio), altrimenti rifiuta.
 * @returns {boolean} true se il prezzo è stato pagato
 */
function pagaSangueA3(costoHalf, letale, fonte) {
  if (statoRun.hpHalf > costoHalf) {
    statoRun.hpHalf -= costoHalf;
    player.invuln = Math.max(player.invuln, ticksDaMs(FEEL.iframes.durataMs));
    AudioSys.playDannoGiocatore();
    scuoti(FEEL.scossa.ferita);
    return true;
  }
  if (!letale) return false;
  player.invuln = 0; statoRun.graziaIngressoC = 0; statoRun.scudoRosaC = false; statoRun.scudoStanzaD = 0;
  subisciColpoGiocatore(costoHalf, fonte);
  return true;
}

/** Respinge il giocatore dentro la stanza corrente, lontano dalla porta del lato `latoUscita`. */
function respingiDallaPortaA3(latoUscita) {
  const d = STANZE_SPECIALI_A3.respintaPx;
  if (latoUscita === 'N') player.y = ARENA.y1 + d;
  else if (latoUscita === 'S') player.y = ARENA.y2 - d;
  else if (latoUscita === 'W') player.x = ARENA.x1 + d;
  else if (latoUscita === 'E') player.x = ARENA.x2 - d;
  player.targetX = null; player.targetY = null;
}

/** Comprimari di un'ondata: gli stessi temi delle stanze di combattimento del piano. */
function generaOndataA3(st, k) {
  const finta = { id: `${st.id}-o${k}`, tipo: 'normale', porte: {}, nemici: [], ostacoli: [], oggettiATerra: [] };
  popolaStanza(finta, statoRun.piano);
  return finta.nemici;
}

// ===========================================================================
// GENERAZIONE (avvolge generaMappaPiano)
// ===========================================================================

/** Stanza vuota con gli stessi campi di quelle di generaMappaPiano. */
function creaStanzaA3(id, tipo, cx, cy) {
  return {
    id, tipo, cx, cy, porte: {}, muroSegreto: null, pulita: true, visitata: false,
    nemici: [], ostacoli: [], oggettiATerra: [], oggettoPiedistallo: null, ricompensaOggetto: null,
    slotFucina: [], slotPatto: [], uscitaAperta: false, portaPattoAperta: false,
  };
}

/**
 * Appende alla mappa le stanze speciali del piano: foglie con una sola porta, attaccate a una stanza di
 * combattimento, in una cella libera che non tocca altre stanze né il boss (regola dei vicoli ciechi di
 * generaMappaPiano). Se non c'è posto il tipo salta questo piano (mai una mappa rifiutata per colpa sua).
 */
function aggiungiStanzeSpecialiA3(m, piano) {
  const G = MAPPA_PIANO;
  const key = (x, y) => `${x},${y}`;
  const griglia = new Map(m.stanze.filter((s) => s.cx >= 1 && s.cy >= 1).map((s) => [key(s.cx, s.cy), s]));
  const dentro = (x, y) => x >= 1 && x <= G.larghezza && y >= 1 && y <= G.altezza;
  const vicini = (x, y) => DIREZIONI_A3.map((d) => griglia.get(key(x + d.dx, y + d.dy))).filter(Boolean);
  for (const tipo of STANZE_SPECIALI_A3.ordine) {
    if (tipo === 'bisca' && piano < STANZE_SPECIALI_A3.bisca.daPiano) continue;
    if (!(rng() < probStanzaA3(tipo, piano))) continue;
    let posta = null;
    for (const g of shuffle(m.stanze.filter((s) => STANZE_SPECIALI_A3.genitori.includes(s.tipo)))) {
      for (const d of shuffle(DIREZIONI_A3)) {
        const nx = g.cx + d.dx, ny = g.cy + d.dy;
        if (!dentro(nx, ny) || griglia.has(key(nx, ny))) continue;
        if (g.porte[d.lato] || (g.muroSegreto && g.muroSegreto.lato === d.lato)) continue;
        const v = vicini(nx, ny);
        if (v.length !== 1 || v[0] !== g) continue;
        if (DIREZIONI_A3.some((d2) => griglia.get(key(nx + d2.dx, ny + d2.dy))?.tipo === 'boss')) continue;
        posta = creaStanzaA3(`r${m.stanze.length}`, tipo, nx, ny);
        g.porte[d.lato] = posta.id;
        posta.porte[d.opposto] = g.id;
        break;
      }
      if (posta) break;
    }
    if (!posta) continue;
    m.stanze.push(posta);
    m.perId.set(posta.id, posta);
    griglia.set(key(posta.cx, posta.cy), posta);
    popolaStanzaA3(posta, piano);
  }
  return m;
}

/** Contenuto delle stanze speciali (chiamato una volta, alla generazione). */
function popolaStanzaA3(s, piano) {
  const T = STANZE_SPECIALI_A3;
  if (s.tipo === 'sfida') {
    const forte = rng() < T.sfida.probPremioForte;
    const o = forte ? estraiOggettoForte() : estraiOggettoBase();
    s.sfidaA3 = {
      ondateTot: interoFraA3(T.sfida.ondateMin, T.sfida.ondateMax), ondata: 0,
      avviata: false, attiva: false, finita: false, attesa: 0,
      premio: { ...o, x: T.sfida.piedistallo.x, y: T.sfida.piedistallo.y, preso: false, forteGratis: Boolean(forte && o.tier === 'forte') },
    };
  } else if (s.tipo === 'sacrificio') {
    s.sacrificioA3 = { fatti: 0, armato: true };
  } else if (s.tipo === 'maledetta') {
    const contenuto = estraiPesataA3(T.maledetta.contenuto);
    s.maledettaA3 = { contenuto, consegnato: false };
    if (contenuto === 'monete') {
      daiMoneteA3(s, interoFraA3(T.maledetta.moneteMin, T.maledetta.moneteMax), 320, 186);
      s.maledettaA3.consegnato = true;
    } else if (contenuto === 'oggetto') {
      daiOggettoA3(s, 320, 192);
      s.maledettaA3.consegnato = true;
    } else if (contenuto === 'nemici') {
      s.nemici = generaOndataPianoA3(s, piano);
      s.pulita = false;
    } // forziere: al primo ingresso (la funzione della squadra a1 può non esserci ancora)
  } else if (s.tipo === 'bisca') {
    s.biscaA3 = {
      giocate: 0, chiuso: false,
      cartomante: rng() < T.bisca.probCartomante ? { grani: 0, andata: false } : null,
    };
  }
}

/** Come generaOndataA3 ma col piano esplicito (alla generazione statoRun.piano può essere quello vecchio). */
function generaOndataPianoA3(st, piano) {
  const finta = { id: `${st.id}-c`, tipo: 'normale', porte: {}, nemici: [], ostacoli: [], oggettiATerra: [] };
  popolaStanza(finta, piano);
  return finta.nemici;
}

// ===========================================================================
// LOGICA (avvolge entraInStanza, verificaStanzaPulita, interagisciStanza, passoLogico)
// ===========================================================================

/** Prima di attraversare una porta: divieto della Sfida e prezzo dei rovi. false = passaggio rifiutato. */
function primaDellaPortaA3(dest, daLato) {
  const T = STANZE_SPECIALI_A3;
  const da = statoRun.stanzaCorrente;
  if (!daLato || !da || !dest || statoRun.fase !== 'in_gioco') return true;
  const latoUscita = OPPOSTO_A3[daLato];
  if (dest.tipo === 'sfida' && T.sfida.soloSalutePiena && !dest.sfidaA3?.finita && statoRun.hpHalf < statoRun.maxHpHalf) {
    respingiDallaPortaA3(latoUscita);
    avvisaA3('⚔ La porta della Sfida resta sbarrata: entra solo chi ha tutte le Maschere intatte.', 170);
    return false;
  }
  if (dest.tipo === 'maledetta' || da.tipo === 'maledetta') {
    const entrando = dest.tipo === 'maledetta';
    if (pagaSangueA3(T.maledetta.costoHalf, T.maledetta.letale, 'i rovi della porta')) {
      if (statoRun.fase !== 'in_gioco') return false; // morto sui rovi (solo con letale)
      avvisaA3('✷ I rovi della porta ti graffiano: -½ ❤️', 120);
    } else if (entrando) {
      respingiDallaPortaA3(latoUscita);
      avvisaA3('✷ I rovi ti ucciderebbero: torna quando avrai più Maschere.', 170);
      return false;
    } else {
      avvisaA3('✷ I rovi ti risparmiano: sei allo stremo.', 140);
    }
  }
  return true;
}

/** Dopo l'ingresso: avvisi e premi consegnati al primo ingresso. */
function dopoIngressoA3(st) {
  const T = STANZE_SPECIALI_A3;
  if (!TIPI_A3.has(st.tipo)) return;
  if (st.tipo === 'sfida') {
    const S = st.sfidaA3;
    if (!S.avviata) mostraBanner('⚔ STANZA DELLA SFIDA: tocca il piedistallo, le porte si sbarrano e arrivano le ondate. Reggi e il premio è tuo!', 230);
  } else if (st.tipo === 'sacrificio') {
    if (st.sacrificioA3.fatti < T.sacrificio.maxSacrifici) mostraBanner('† IL CEPPO DEI CHIODI: dagli ½ ❤️ del tuo sangue, e forse il Teatro ti ripagherà.', 220);
  } else if (st.tipo === 'maledetta') {
    const M = st.maledettaA3;
    if (!M.consegnato && M.contenuto === 'forziere') {
      if (!daiForziereA3(st, 320, 186)) daiMoneteA3(st, interoFraA3(T.maledetta.moneteMin, T.maledetta.moneteMax), 320, 186);
      M.consegnato = true;
    }
    mostraBanner(st.pulita
      ? '✷ STANZA DEI ROVI: il bottino è tuo, ma anche uscire costa ½ ❤️.'
      : '✷ STANZA DEI ROVI: i custodi del bottino ti aspettavano!', 200);
  } else if (st.tipo === 'bisca') {
    mostraBanner(st.biscaA3.cartomante && !st.biscaA3.cartomante.andata
      ? `🎲 LA BISCA: ${T.bisca.costo}🪙 a giocata al Banco del Lotto di Don Gennaro, e la Cartomante legge la sorte per un grano. [E]`
      : `🎲 LA BISCA: ${T.bisca.costo}🪙 a giocata al Banco del Lotto di Don Gennaro. [E]`, 230);
  }
}

/** Ondata k della Sfida (k da 1): sostituisce i nemici caduti, lontano dalle porte e dal giocatore. */
function lanciaOndataA3(st) {
  const S = st.sfidaA3;
  S.ondata++;
  st.nemici = generaOndataA3(st, S.ondata);
  allontanaNemiciDallePorteC(st, [{ x: player.x, y: player.y }]);
  scuoti(FEEL.scossa.evento);
  AudioSys.playCampana();
  mostraBanner(S.ondata === 1
    ? `⚔ SI ALZA IL SIPARIO DELLA SFIDA! Ondata 1 di ${S.ondateTot}: le porte sono sbarrate!`
    : `⚔ Ondata ${S.ondata} di ${S.ondateTot}!`, 150);
}

/** Il giocatore tocca il piedistallo della Sfida. */
function avviaSfidaA3(st) {
  const S = st.sfidaA3;
  if (!S || S.avviata) return;
  S.avviata = true; S.attiva = true;
  st.pulita = false;
  lanciaOndataA3(st);
}

/** Fine della Sfida (dopo verificaStanzaPulita di base): il premio passa al piedistallo raccoglibile. */
function chiudiSfidaA3(st) {
  const S = st.sfidaA3;
  S.attiva = false; S.finita = true;
  if (!st.oggettoPiedistallo || st.oggettoPiedistallo.preso) st.oggettoPiedistallo = S.premio;
  mostraBanner(`⚔ SFIDA VINTA! Il premio è tuo: ${nomeD(S.premio)} [Click/E]`, 230);
}

/** Bottino dei custodi della Stanza dei Rovi. */
function premioCustodiA3(st) {
  const T = STANZE_SPECIALI_A3.maledetta;
  const M = st.maledettaA3;
  if (M.consegnato) return;
  M.consegnato = true;
  daiMoneteA3(st, T.moneteNemici, 300, 200);
  if (rng() < T.probOggettoNemici) daiOggettoA3(st, 320, 192);
  mostraBanner('✷ I custodi dei rovi sono caduti: il bottino è tuo!', 170);
}

/** Un sacrificio sul ceppo. */
function sacrificaA3(st) {
  const T = STANZE_SPECIALI_A3.sacrificio;
  const S = st.sacrificioA3;
  if (S.fatti >= T.maxSacrifici) { avvisaA3('† Il ceppo è sazio: non accetta più sangue.', 130); return null; }
  if (!pagaSangueA3(T.costoHalf, T.letale, 'il ceppo dei chiodi')) {
    avvisaA3("† Il ceppo non prende l'ultima mezza Maschera.", 140);
    return null;
  }
  if (statoRun.fase !== 'in_gioco') return null;
  S.fatti++;
  const riga = T.premi[Math.min(S.fatti, T.premi.length) - 1];
  let esito = estraiPesataA3(riga);
  const { x, y } = T.ceppo;
  if (esito === 'oggetto' && !daiOggettoA3(st, x, y + 62)) esito = 'monete';
  if (esito === 'monete') {
    const n = interoFraA3(T.moneteMin, T.moneteMax);
    daiMoneteA3(st, n, x, y + 40);
    mostraBanner(`† Il ceppo beve il sangue e restituisce ${n}🪙.`, 140);
  } else if (esito === 'cuore') {
    daiCuraA3(st, T.cuoreHalf, x + 30, y + 40);
    mostraBanner('† Dal ceppo cade una Maschera intera!', 140);
  } else if (esito === 'oggetto') {
    mostraBanner(`† Il ceppo ti offre una reliquia: ${nomeD(st.oggettoPiedistallo)} [Click/E]`, 190);
  } else {
    mostraBanner('† Il ceppo beve il sangue... e tace.', 120);
  }
  if (S.fatti >= T.maxSacrifici) S.sazio = true;
  return esito;
}

/** Una giocata al Banco del Lotto. */
function giocaLottoA3(st) {
  const T = STANZE_SPECIALI_A3.bisca;
  const B = st.biscaA3;
  if (B.chiuso) { avvisaA3('🎲 Don Gennaro ha chiuso il banco: per stanotte basta.', 130); return null; }
  if (statoRun.monete < T.costo) { avvisaA3(`🎲 Senza ${T.costo}🪙 non si gioca, guagliò.`, 130); return null; }
  statoRun.monete -= T.costo;
  B.giocate++;
  const numero = 1 + Math.floor(rng() * 90);
  const detto = SMORFIA_A3[numero] ? ` (${SMORFIA_A3[numero]})` : '';
  let esito = estraiPesataA3(T.premi);
  const px = T.banco.x, py = T.banco.y + 46;
  if (esito === 'oggetto' && !daiOggettoA3(st, 320, 236)) esito = 'monete';
  let testo;
  if (esito === 'monete') {
    const n = interoFraA3(T.moneteMin, T.moneteMax);
    daiMoneteA3(st, n, px, py);
    testo = `vinci ${n}🪙!`;
  } else if (esito === 'mezzaMaschera') {
    daiCuraA3(st, 1, px, py); testo = 'vinci ½ Maschera!';
  } else if (esito === 'cuore') {
    daiCuraA3(st, 2, px, py); testo = 'vinci una Maschera intera!';
  } else if (esito === 'oggetto') {
    testo = `TERNO SECCO! Una reliquia: ${nomeD(st.oggettoPiedistallo)} [Click/E]`;
  } else {
    testo = 'niente, ritenta!';
  }
  B.ultimo = { numero, esito };
  AudioSys.playMoneta();
  if (B.giocate >= T.giocateMax) B.chiuso = true;
  mostraBanner(`🎲 Esce il ${numero}${detto}: ${testo}${B.chiuso ? ' — Don Gennaro chiude il banco.' : ''}`, 170);
  return esito;
}

/** Un grano alla Cartomante: a volte un dono, poi se ne va. */
function pagaCartomanteA3(st) {
  const T = STANZE_SPECIALI_A3.bisca.cartomante;
  const C = st.biscaA3.cartomante;
  if (!C || C.andata) return null;
  if (statoRun.monete < T.costo) { avvisaA3('🔮 «Senza un grano le carte non parlano.»', 130); return null; }
  statoRun.monete -= T.costo;
  C.grani++;
  AudioSys.playMoneta();
  if (rng() >= T.probBase + (C.grani - 1) * T.probPerMoneta) {
    mostraBanner(`🔮 «${FRASI_CARTOMANTE_A3[Math.floor(rng() * FRASI_CARTOMANTE_A3.length)]}»`, 160);
    return 'niente';
  }
  let dono = estraiPesataA3(T.premi);
  if (dono === 'oggetto' && !daiOggettoA3(st, T.x, T.y + 66)) dono = 'monete';
  if (dono === 'cuore') daiCuraA3(st, 2, T.x, T.y + 42);
  else if (dono === 'monete') daiMoneteA3(st, T.moneteDono, T.x, T.y + 42);
  C.andata = true;
  mostraBanner(dono === 'oggetto'
    ? `🔮 «Le carte hanno parlato.» La Cartomante lascia una reliquia e svanisce: ${nomeD(st.oggettoPiedistallo)}`
    : '🔮 «Le carte hanno parlato.» La Cartomante lascia un dono e svanisce nel buio.', 200);
  return dono;
}

/** Tasto E (e click vicino) nelle stanze nuove. true = gestito. */
function interagisciA3(st) {
  if (!st || st.tipo !== 'bisca') return false;
  const T = STANZE_SPECIALI_A3.bisca;
  // il piedistallo (premio del lotto o della cartomante) ha la precedenza, come nel codice di base
  if (st.oggettoPiedistallo && !st.oggettoPiedistallo.preso
    && Math.hypot(player.x - st.oggettoPiedistallo.x, player.y - st.oggettoPiedistallo.y) < 52) return false;
  if (Math.hypot(player.x - T.banco.x, player.y - T.banco.y) < T.banco.raggioUso) { giocaLottoA3(st); return true; }
  const C = st.biscaA3.cartomante;
  if (C && !C.andata && Math.hypot(player.x - T.cartomante.x, player.y - T.cartomante.y) < T.cartomante.raggioUso) {
    pagaCartomanteA3(st); return true;
  }
  return false;
}

/** Un tick delle stanze nuove (dopo passoLogico di base). */
function passoStanzeSpecialiA3() {
  if (statoRun.fase !== 'in_gioco' || statoRun.pausa || statoRun.scambioPendente || statoRun.pannelloB || statoRun.siparioAttivo) return;
  if (ticksCongelati > 0) return;
  const st = statoRun.stanzaCorrente;
  if (!st || !TIPI_A3.has(st.tipo)) return;
  const T = STANZE_SPECIALI_A3;
  if (st.tipo === 'sfida') {
    const S = st.sfidaA3;
    if (!S.avviata) {
      if (Math.hypot(player.x - T.sfida.piedistallo.x, player.y - T.sfida.piedistallo.y) < T.sfida.raggioTocco) avviaSfidaA3(st);
    } else if (S.attiva) {
      if (S.attesa > 0) {
        if (--S.attesa === 0) lanciaOndataA3(st);
      } else if (st.nemici.every((n) => n.hp <= 0)) {
        verificaStanzaPulita(); // anche per i nemici morti senza colpo (fuoco)
      }
    }
  } else if (st.tipo === 'sacrificio') {
    const S = st.sacrificioA3;
    const d = Math.hypot(player.x - T.sacrificio.ceppo.x, player.y - T.sacrificio.ceppo.y);
    if (d > T.sacrificio.raggio + 12) S.armato = true;
    else if (d < T.sacrificio.raggio && S.armato && player.invuln <= 0) { S.armato = false; sacrificaA3(st); }
  } else if (st.tipo === 'bisca') {
    // banco e cartomante sono corpi solidi
    const corpi = [T.bisca.banco];
    if (st.biscaA3.cartomante && !st.biscaA3.cartomante.andata) corpi.push(T.bisca.cartomante);
    for (const c of corpi) {
      const dx = player.x - c.x, dy = player.y - c.y;
      const d = Math.hypot(dx, dy), rMin = c.raggioCorpo + 9;
      if (d < rMin && d > 0.01) { player.x = c.x + (dx / d) * rMin; player.y = c.y + (dy / d) * rMin; }
    }
  } else if (st.tipo === 'maledetta' && !st.pulita && st.nemici.every((n) => n.hp <= 0)) {
    verificaStanzaPulita();
  }
}

const generaMappaPianoBaseA3 = generaMappaPiano;
generaMappaPiano = function generaMappaPianoA3(piano) {
  const m = generaMappaPianoBaseA3(piano);
  return m ? aggiungiStanzeSpecialiA3(m, piano) : m;
};

const entraInStanzaBaseA3 = entraInStanza;
entraInStanza = function entraInStanzaA3(stanza, daLato) {
  if (!primaDellaPortaA3(stanza, daLato)) return;
  entraInStanzaBaseA3(stanza, daLato);
  if (stanza) dopoIngressoA3(stanza);
};

const verificaStanzaPulitaBaseA3 = verificaStanzaPulita;
verificaStanzaPulita = function verificaStanzaPulitaA3() {
  const st = statoRun.stanzaCorrente;
  const S = st && st.tipo === 'sfida' ? st.sfidaA3 : null;
  if (S && S.attiva && !st.pulita) {
    if (!st.nemici.every((n) => n.hp <= 0)) return;
    if (S.ondata < S.ondateTot) {
      if (!S.attesa) S.attesa = ticksDaMs(STANZE_SPECIALI_A3.sfida.pausaFraOndateMs);
      return;
    }
  }
  const eraPulita = !st || st.pulita;
  verificaStanzaPulitaBaseA3();
  if (eraPulita || !st.pulita) return;
  if (S && S.attiva) chiudiSfidaA3(st);
  else if (st.tipo === 'maledetta') premioCustodiA3(st);
};

const interagisciStanzaBaseA3 = interagisciStanza;
interagisciStanza = function interagisciStanzaA3() {
  if (!statoRun.scambioPendente && !statoRun.pannelloB && !statoRun.siparioAttivo && interagisciA3(statoRun.stanzaCorrente)) return;
  interagisciStanzaBaseA3();
};

const passoLogicoBaseA3 = passoLogico;
passoLogico = function passoLogicoA3() {
  passoLogicoBaseA3();
  passoStanzeSpecialiA3();
};

// click sul banco o sulla cartomante quando sei vicino: come il tasto E
canvas.addEventListener('mousedown', (e) => {
  const st = statoRun.stanzaCorrente;
  if (statoRun.fase !== 'in_gioco' || !st || st.tipo !== 'bisca') return;
  const r = canvas.getBoundingClientRect();
  const mx = (e.clientX - r.left) * (W / r.width), my = (e.clientY - r.top) * (H / r.height);
  const T = STANZE_SPECIALI_A3.bisca;
  for (const c of [T.banco, T.cartomante]) {
    if (Math.hypot(mx - c.x, my - c.y) < 26 && Math.hypot(player.x - c.x, player.y - c.y) < c.raggioUso) {
      interagisciStanza();
      player.targetX = null; player.targetY = null;
      return;
    }
  }
});

// ===========================================================================
// RESA (avvolge disegnaStanzaPixelArt e disegnaHUDPixelArt)
// ===========================================================================

const PORTE_A3 = Object.freeze({
  N: { x: 320, y: 61, w: 36, h: 18 }, S: { x: 320, y: 313, w: 36, h: 18 },
  W: { x: 59, y: 187, w: 18, h: 36 }, E: { x: 581, y: 187, w: 18, h: 36 },
});

/** Spine dei rovi attorno a una porta. */
function disegnaRoviA3(p, tick) {
  const A = STANZE_SPECIALI_A3.aspetto.maledetta;
  ctx.save();
  ctx.strokeStyle = A.cornice; ctx.lineWidth = 2;
  ctx.strokeRect(p.x - p.w / 2 - 4, p.y - p.h / 2 - 4, p.w + 8, p.h + 8);
  ctx.fillStyle = A.spine;
  const orizz = p.w > p.h;
  const n = 6;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const vib = Math.sin(tick * 0.05 + i) * 0.6;
    for (const lato of [-1, 1]) {
      ctx.beginPath();
      if (orizz) {
        const x = p.x - p.w / 2 - 4 + t * (p.w + 8), y = p.y + lato * (p.h / 2 + 4);
        ctx.moveTo(x - 3, y); ctx.lineTo(x + 3, y); ctx.lineTo(x + vib, y + lato * 5);
      } else {
        const y = p.y - p.h / 2 - 4 + t * (p.h + 8), x = p.x + lato * (p.w / 2 + 4);
        ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3); ctx.lineTo(x + lato * 5, y + vib);
      }
      ctx.closePath(); ctx.fill();
    }
  }
  ctx.restore();
}

/** Segno sulla porta verso una stanza nuova (e i rovi su tutte le porte della Stanza dei Rovi). */
function disegnaPorteA3(st, tick) {
  if (!statoRun.mappa) return;
  const chiuse = !st.pulita;
  for (const [lato, id] of Object.entries(st.porte)) {
    const dest = statoRun.mappa.perId.get(id);
    const p = PORTE_A3[lato];
    if (!p) continue;
    if (dest && TIPI_A3.has(dest.tipo)) {
      const A = STANZE_SPECIALI_A3.aspetto[dest.tipo];
      ctx.fillStyle = A.cornice;
      ctx.fillRect(p.x - p.w / 2, p.y - p.h / 2, p.w, 3);
      ctx.fillRect(p.x - p.w / 2, p.y + p.h / 2 - 3, p.w, 3);
      ctx.fillRect(p.x - p.w / 2, p.y - p.h / 2, 3, p.h);
      ctx.fillRect(p.x + p.w / 2 - 3, p.y - p.h / 2, 3, p.h);
      const sbarrata = dest.tipo === 'sfida' && STANZE_SPECIALI_A3.sfida.soloSalutePiena && !dest.sfidaA3?.finita
        && statoRun.hpHalf < statoRun.maxHpHalf;
      if (sbarrata && !chiuse) {
        ctx.fillStyle = A.cornice;
        ctx.fillRect(p.x - 6, p.y - p.h / 2 + 3, 2, p.h - 6);
        ctx.fillRect(p.x + 4, p.y - p.h / 2 + 3, 2, p.h - 6);
      } else if (!chiuse) {
        drawTextFit(A.icona, p.x, p.y + 3, p.w - 4, { size: 9, color: '#ffffff' });
      }
      if (dest.tipo === 'maledetta') disegnaRoviA3(p, tick);
    }
    if (st.tipo === 'maledetta') disegnaRoviA3(p, tick);
  }
}

/** Fondo e arredi delle stanze nuove (sotto le entità). */
function disegnaArrediA3(st, tick) {
  const T = STANZE_SPECIALI_A3;
  const A = T.aspetto[st.tipo];
  ctx.save();
  ctx.fillStyle = A.fondo;
  ctx.globalAlpha = 0.85;
  ctx.fillRect(170, 128, 300, 118);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = A.cornice; ctx.lineWidth = 2;
  ctx.strokeRect(172, 130, 296, 114);
  ctx.restore();

  if (st.tipo === 'sfida') {
    const S = st.sfidaA3;
    const { x, y } = T.sfida.piedistallo;
    if (!S.finita) {
      drawPixelSprite(S.premio.forteGratis ? SPRITE_SCENA.piedistalloOro : SPRITE_SCENA.piedistallo, x, y + 8, 2);
      const floatY = Math.round(Math.sin(tick * 0.08) * 3);
      drawPixelSprite(spriteD(S.premio), x, y - 12 + floatY, 2);
      drawPillLabel(S.attiva ? `⚔ ONDATA ${S.ondata} DI ${S.ondateTot}` : '⚔ SFIDA: TOCCA IL PIEDISTALLO', x, y - 30, 220, {
        size: 8, color: '#e2e8f0', border: '#94a3b8',
      });
    }
  } else if (st.tipo === 'sacrificio') {
    const S = st.sacrificioA3;
    const { x, y } = T.sacrificio.ceppo;
    if (typeof arredoImmagineB9 !== 'function' || !arredoImmagineB9('ceppo', x, y, S, tick)) { // --- b9: immagine dell'autore, se c'è (b9-immagini.js) ---
    ctx.fillStyle = 'rgba(8,5,3,0.6)';
    ctx.beginPath(); ctx.ellipse(x, y + 10, 24, 7, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#4a2c17'; ctx.strokeStyle = '#1c0f07'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(x, y + 4, 20, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillRect(x - 20, y - 6, 40, 10); ctx.strokeRect(x - 20, y - 6, 40, 10);
    ctx.fillStyle = '#7c4a26';
    ctx.beginPath(); ctx.ellipse(x, y - 6, 20, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
    // macchie di sangue, una per sacrificio
    ctx.fillStyle = '#7f1d1d';
    for (let i = 0; i < S.fatti; i++) {
      ctx.beginPath(); ctx.arc(x - 12 + (i * 37) % 24, y - 7 + ((i * 13) % 6) - 3, 2.5, 0, TAU); ctx.fill();
    }
    // chiodi
    for (const [cx, cy] of [[-10, -8], [0, -10], [10, -7], [-4, -4], [6, -3]]) {
      ctx.fillStyle = '#9ca3af'; ctx.fillRect(x + cx - 1, y + cy - 6, 2, 6);
      ctx.fillStyle = '#d1d5db'; ctx.fillRect(x + cx - 2, y + cy - 7, 4, 2);
    }
    } // --- b9: fine del disegno a codice del ceppo ---
    drawPillLabel(S.fatti >= T.sacrificio.maxSacrifici ? '† IL CEPPO È SAZIO' : '† SALI SUL CEPPO: -½ ❤️', x, y - 30, 180, {
      size: 8, color: '#fca5a5', border: '#b91c1c',
    });
  } else if (st.tipo === 'bisca') {
    const B = st.biscaA3;
    const { x, y } = T.bisca.banco;
    // banco di legno con l'urna dei numeri
    if (typeof arredoImmagineB9 !== 'function' || !arredoImmagineB9('banco', x, y, B, tick)) { // --- b9: immagine dell'autore, se c'è (b9-immagini.js) ---
    ctx.fillStyle = 'rgba(8,5,3,0.6)';
    ctx.beginPath(); ctx.ellipse(x, y + 14, 26, 7, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5b3416'; ctx.strokeStyle = '#1c0f07'; ctx.lineWidth = 1.5;
    ctx.fillRect(x - 24, y - 4, 48, 18); ctx.strokeRect(x - 24, y - 4, 48, 18);
    ctx.fillStyle = '#14532d'; ctx.fillRect(x - 22, y - 6, 44, 4);
    const rot = B.chiuso ? 0 : Math.sin(tick * 0.05) * 0.25;
    drawPixelSprite(SPRITE_SCENA.urna, x, y - 14, 1.6, false, false, rot);
    drawPixelSprite(SPRITE_OGGETTI.dado, x + 16, y - 8, 1);
    if (B.ultimo) drawTextFit(String(B.ultimo.numero), x - 14, y + 6, 20, { size: 8, color: '#fde68a' });
    } // --- b9: fine del disegno a codice del banco ---
    drawPillLabel(B.chiuso ? '🎲 BANCO CHIUSO' : `🎲 LOTTO: ${T.bisca.costo}🪙 [E]`, x, y - 34, 130, {
      size: 7.5, color: B.chiuso ? '#9ca3af' : '#86efac', border: B.chiuso ? '#4b5563' : '#16a34a',
    });
    const C = B.cartomante;
    if (C && !C.andata) {
      const c = T.bisca.cartomante;
      if (typeof arredoImmagineB9 !== 'function' || !arredoImmagineB9('cartomante', c.x, c.y, c, tick)) { // --- b9: immagine dell'autore, se c'è (b9-immagini.js) ---
      ctx.fillStyle = 'rgba(8,5,3,0.6)';
      ctx.beginPath(); ctx.ellipse(c.x, c.y + 14, 16, 5, 0, 0, TAU); ctx.fill();
      // sagoma d'ombra: scialle a campana, testa velata, candela
      const osc = Math.sin(tick * 0.04) * 1.2;
      ctx.fillStyle = '#120a10';
      ctx.beginPath();
      ctx.moveTo(c.x - 13, c.y + 14); ctx.quadraticCurveTo(c.x - 9, c.y - 10, c.x + osc, c.y - 14);
      ctx.quadraticCurveTo(c.x + 9, c.y - 10, c.x + 13, c.y + 14); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(c.x + osc, c.y - 18, 6, 0, TAU); ctx.fill();
      ctx.fillStyle = '#6b2142';
      ctx.fillRect(c.x - 10, c.y + 2, 20, 2);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(c.x + 12, c.y - 2 + Math.sin(tick * 0.3), 1.8, 0, TAU); ctx.fill();
      } // --- b9: fine del disegno a codice della cartomante ---
      drawPillLabel(`🔮 CARTOMANTE: ${c.costo}🪙 [E]`, c.x, c.y - 34, 130, { size: 7.5, color: '#f5d0fe', border: '#a21caf' });
    }
  } else if (st.tipo === 'maledetta') {
    // rovi lungo il fondo della stanza
    ctx.save();
    ctx.strokeStyle = '#3f6212'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 9; i++) {
      const bx = 180 + i * 35;
      ctx.beginPath();
      ctx.moveTo(bx, 244); ctx.quadraticCurveTo(bx + 10, 226 + Math.sin(i) * 6, bx + 22, 240); ctx.stroke();
      ctx.fillStyle = STANZE_SPECIALI_A3.aspetto.maledetta.spine;
      ctx.fillRect(bx + 9, 233 + Math.sin(i) * 3, 2, 3);
    }
    ctx.restore();
  }
}

const disegnaStanzaPixelArtBaseA3 = disegnaStanzaPixelArt;
disegnaStanzaPixelArt = function disegnaStanzaPixelArtA3(tickR, st) {
  disegnaStanzaPixelArtBaseA3(tickR, st);
  if (!st) return;
  try {
    if (TIPI_A3.has(st.tipo)) disegnaArrediA3(st, tickR);
    disegnaPorteA3(st, tickR);
  } catch (err) { console.error('[A3] resa stanza', err); }
};

/** Icone sulla minimappa (stessa geometria della minimappa di disegnaHUDPixelArt). */
function disegnaMinimappaA3(st) {
  const m = statoRun.mappa;
  if (!m || !st || maledizioneD('mappa')) return;
  const cell = 12, x0 = W - 118, y0 = 24, mw = 114, mh = 92;
  ctx.save();
  ctx.beginPath(); ctx.rect(x0 - 5, y0 - 15, mw - 2, mh - 2); ctx.clip();
  for (const s of m.stanze) {
    if (!s.visitata || !TIPI_A3.has(s.tipo)) continue;
    const A = STANZE_SPECIALI_A3.aspetto[s.tipo];
    const px = x0 + (s.cx - 1) * cell, py = y0 + (s.cy - 1) * cell;
    const corr = st.id === s.id;
    ctx.fillStyle = corr ? '#f9cb40' : A.minimappa;
    ctx.fillRect(px + 1, py + 1, cell - 2, cell - 2);
    drawTextFit(A.icona, px + cell / 2, py + cell - 3, cell - 2, { size: 6.5, color: corr ? '#0a0604' : '#ffffff', shadow: false });
  }
  ctx.restore();
}

const disegnaHUDPixelArtBaseA3 = disegnaHUDPixelArt;
disegnaHUDPixelArt = function disegnaHUDPixelArtA3(st, ...resto) {
  const r = disegnaHUDPixelArtBaseA3(st, ...resto);
  try { disegnaMinimappaA3(st); } catch (err) { console.error('[A3] minimappa', err); }
  return r;
};

// --- sonda QA (tools/qa-teatro-stanze-speciali.js) ---
if (window.__teatro && window.__teatro.interni) {
  Object.assign(window.__teatro.interni, {
    STANZE_SPECIALI_A3, probStanzaA3, aggiungiStanzeSpecialiA3, passoStanzeSpecialiA3, sacrificaA3,
    giocaLottoA3, pagaCartomanteA3, avviaSfidaA3,
    // gli interni di 80-ciclo.js puntano alle funzioni di base: qui le versioni avvolte (stesso comportamento del gioco)
    entraInStanza: (...a) => entraInStanza(...a), interagisciStanza: (...a) => interagisciStanza(...a),
    verificaStanzaPulita: () => verificaStanzaPulita(),
    disegnaStanzaPixelArt: (...a) => disegnaStanzaPixelArt(...a),
  });
}
