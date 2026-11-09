/*
 * teatro/a2-consumabili.js — Consumabili con effetto sconosciuto (miglioramento 2): AMPOLLE di speziale e
 * carte NAPOLETANE. Ispirazione: pillole e carte di un noto roguelike a stanze (solo ispirazione, nessun nome).
 *
 * - Uno slot consumabile nell'HUD (a sinistra dell'oggetto attivo), tasto d'uso CONS_A2.tasto (F) o click.
 * - Ampolle: il colore è visibile, l'effetto no. La corrispondenza colore → effetto si rimescola a ogni run
 *   con un generatore derivato dal seme della run (non consuma lo stream rng() della mappa).
 * - Carte: il nome è visibile, l'effetto è ignoto finché non la usi la prima volta.
 * - Identificazione: al primo uso cartiglio «Scoperto» (statoRun.cartiglioD) e banner; l'ampolla resta nota
 *   per la run, la carta per sempre. La conoscenza sta nel flag oggettiConosciuti dello slot di salvataggio
 *   (ids con prefisso «a2:»), accanto agli oggetti del catalogo; pagina «Consumabili» nel Diario (tasto C).
 * - Raccolta camminandoci sopra; con lo slot pieno il vecchio resta a terra (va scavalcato per riprenderlo).
 * - Drop alla pulizia di una stanza (CONS_A2.drop); nella Fucina prende lo slot «consumabile» (½ Maschera),
 *   allo stesso prezzo ECONOMIA_T3.prezzi.consumabile.
 * Deviazione dal GDD economia.md §5 (consumabile applicato all'acquisto, niente tasti nuovi): richiesta
 * esplicita del miglioramento 2, da riallineare nel GDD.
 *
 * Script classico: avvolge funzioni globali di primo livello (passoLogico, disegnaHUDPixelArt, ...) senza
 * toccare i file di base, salvo tre agganci di una riga per la scala di Ferruccio (vedi LEGGIMI.md).
 */

// ===========================================================================
// TABELLA DEI VALORI (data-driven)
// ===========================================================================
const CONS_A2 = Object.freeze({
  tasto: 'KeyF',              // tasto d'uso (Q è l'oggetto attivo, E interagisci, Space attacco)
  tastoDiario: 'KeyC',        // nel Diario: pagina oggetti ↔ pagina consumabili
  raggioRaccolta: 20,         // px, come le monete
  raggioSblocco: 30,          // px: il consumabile appena lasciato si riprende solo dopo essersene allontanati
  durataStanze: 3,            // effetti a tempo delle ampolle: stanze di combattimento ripulite
  drop: Object.freeze({
    probPulizia: 0.16,        // probabilità di un consumabile a terra quando ripulisci una stanza di combattimento
    probAmpolla: 0.55,        // altrimenti carta
    tipiEsclusi: Object.freeze(['boss', 'segreta']),
    x: 344, y: 168,
  }),
  fucina: Object.freeze({ sostituisce: 'mezzaMaschera' }), // sprite dello slot «consumabile» di base che prende il posto
  hud: Object.freeze({ x: 141, lato: 26 }),
  effettiStanza: Object.freeze({ dannoForza: 2 }),
});

/**
 * AMPOLLE: effetti (12 per run, su CONS_A2_COLORI). polarita: positivo | negativo | neutro.
 * mod: voci di ricalcolaStatisticheIsaac sommate finché l'effetto dura (CONS_A2.durataStanze stanze ripulite).
 * Testi: da approvare dall'autore.
 */
const CONS_A2_AMPOLLE = Object.freeze([
  { id: 'passo', nome: 'Passo di Tarantella', polarita: 'positivo', mod: { speedUp: 0.3 }, desc: '+Velocità per 3 stanze' },
  { id: 'piombo', nome: 'Piedi di Piombo', polarita: 'negativo', mod: { speedUp: -0.25 }, desc: '−Velocità per 3 stanze' },
  { id: 'sangue', nome: 'Sangue Caldo', polarita: 'positivo', mod: { flatDmg: 1.0 }, desc: '+1 Danno per 3 stanze' },
  { id: 'polso', nome: 'Polso Molle', polarita: 'negativo', mod: { flatDmg: -0.8 }, desc: '−0,8 Danno per 3 stanze' },
  { id: 'occhio', nome: 'Occhio Lungo', polarita: 'positivo', mod: { rangeUp: 60 }, desc: '+Gittata per 3 stanze' },
  { id: 'vista', nome: 'Vista Corta', polarita: 'negativo', mod: { rangeUp: -50 }, desc: '−Gittata per 3 stanze' },
  { id: 'lesta', nome: 'Mano Lesta', polarita: 'positivo', mod: { tearsUp: 0.7 }, desc: '+Cadenza per 3 stanze' },
  { id: 'fiato', nome: 'Fiato Corto', polarita: 'negativo', mod: { tearsUp: -0.5 }, desc: '−Cadenza per 3 stanze' },
  { id: 'sanita', nome: 'Acqua della Sanità', polarita: 'positivo', curaHalf: 2, desc: 'Rigenera 1 Maschera' },
  { id: 'veleno', nome: 'Veleno di Speziale', polarita: 'negativo', ferisciHalf: 1, desc: '−½ Maschera (mai l\'ultima)' },
  { id: 'capogiro', nome: 'Capogiro', polarita: 'negativo', confusioneMs: 6000, desc: 'Comandi invertiti per 6 s' },
  { id: 'gigante', nome: 'Elisir del Gigante', polarita: 'misto', scala: 1.35, mod: { flatDmg: 0.6 }, desc: 'Più grande (bersaglio più largo), +0,6 Danno, 3 stanze' },
  { id: 'pulce', nome: 'Elisir della Pulce', polarita: 'misto', scala: 0.7, mod: { speedUp: 0.15, flatDmg: -0.3 }, desc: 'Più piccolo (bersaglio più stretto), +Velocità, −0,3 Danno, 3 stanze' },
  { id: 'fontana', nome: 'Acqua di Fontana', polarita: 'neutro', desc: 'Sa di pozzo. Nient\'altro.' },
]);

/** Colori delle ampolle: X = vetro chiaro, Y = fondo scuro (caratteri di PALETTE). */
const CONS_A2_COLORI = Object.freeze([
  { id: 'rossa', X: 'r', Y: 'R' }, { id: 'blu', X: 'b', Y: 'B' }, { id: 'celeste', X: 'a', Y: 'A' },
  { id: 'gialla', X: 'y', Y: 'o' }, { id: 'aranciata', X: 'o', Y: 'O' }, { id: 'viola', X: 'p', Y: 'P' },
  { id: 'verde', X: 'v', Y: 'V' }, { id: 'grigia', X: 'g', Y: 'G' }, { id: 'lattea', X: 'c', Y: 's' },
  { id: 'nera', X: 'D', Y: 'k' }, { id: 'bruna', X: 'm', Y: 'M' }, { id: 'ambrata', X: 'e', Y: 'm' },
]);

/** CARTE NAPOLETANE: nome visibile, effetto ignoto fino al primo uso. Testi: da approvare dall'autore. */
const CONS_A2_CARTE = Object.freeze([
  { id: 'cavallo_bastoni', nome: 'Cavallo di Bastoni', seme: 'bastoni', effetto: 'teletrasporto', desc: 'Ti porta in una stanza a caso del piano' },
  { id: 're_coppe', nome: 'Re di Coppe', seme: 'coppe', effetto: 'mappa', desc: 'Rivela la mappa del piano' },
  { id: 'fante_spade', nome: 'Fante di Spade', seme: 'spade', effetto: 'segreta', desc: 'Apre il passaggio della Stanza Segreta' },
  { id: 'asso_coppe', nome: 'Asso di Coppe', seme: 'coppe', effetto: 'curaTutto', desc: 'Rigenera tutte le Maschere' },
  { id: 'tre_denari', nome: 'Tre di Denari', seme: 'denari', effetto: 'monete', monete: 3, desc: '+3 monete' },
  { id: 're_spade', nome: 'Re di Spade', seme: 'spade', effetto: 'dannoTutti', dannoMult: 2.5, dannoMin: 8, desc: 'Ferisce tutti i nemici della stanza' },
  { id: 'asso_bastoni', nome: 'Asso di Bastoni', seme: 'bastoni', effetto: 'scudo', scudoMs: 5000, desc: 'Intoccabile per 5 s' },
  { id: 'cavallo_denari', nome: 'Cavallo di Denari', seme: 'denari', effetto: 'fucina', desc: 'Ti porta alla Fucina' },
  { id: 're_bastoni', nome: 'Re di Bastoni', seme: 'bastoni', effetto: 'forza', desc: '+2 Danno finché resti nella stanza' },
  { id: 'asso_spade', nome: 'Asso di Spade', seme: 'spade', effetto: 'stordisci', stordisciMs: 3000, desc: 'Spazza i colpi nemici e stordisce tutti per 3 s' },
  { id: 'fante_coppe', nome: 'Fante di Coppe', seme: 'coppe', effetto: 'ricarica', desc: 'Ricarica del tutto l\'oggetto attivo' },
  { id: 'fante_denari', nome: 'Fante di Denari', seme: 'denari', effetto: 'scorte', monete: 2, desc: '+1 chiave e +1 bomba (o +2 monete)' },
  { id: 'matta', nome: 'La Matta', seme: 'matta', effetto: 'matta', desc: 'Fa da un\'altra carta a caso' },
]);

/** Testi brevi per il giocatore (da approvare dall'autore). */
const CONS_A2_TESTI = Object.freeze({
  scoperto: 'Scoperto',
  loreAmpolla: 'Boccetta di speziale di Toledo: il colore cambia da una notte all\'altra.',
  loreCarta: 'Carta napoletana del mazzo di Mastro Peppe: una volta letta, non la scordi.',
  slotVuoto: 'nessuno',
  raccolta: (n) => `Raccolto: ${n} [F per usarlo]`,
  lasciato: (n) => `${n} resta a terra.`,
  nienteSegreta: 'Il Fante di Spade non trova passaggi da aprire.',
  nienteFucina: 'Il Cavallo di Denari non trova la Fucina.',
  nienteStanza: 'Il Cavallo di Bastoni scalpita, ma non c\'è dove andare.',
  diarioTitolo: 'DIARIO DEI CONSUMABILI',
  diarioPiede: 'C: oggetti · Esc/O: torna al menu',
  diarioAmpolle: 'Ampolle (il colore cambia ogni notte)',
  diarioCarte: 'Carte napoletane',
});

// ===========================================================================
// SPRITE (registrati in SPRITE_OGGETTI: pavimento, Fucina, HUD e cartiglio li disegnano già)
// ===========================================================================
const SAGOMA_AMPOLLA_A2 = ['....kkkk....', '....kmmk....', '....kkkk....', '...kwccwk...', '..kwXXXXwk..',
  '.kwXXXXXXwk.', '.kXXwXXXXXk.', '.kXXXXXXXYk.', '..kYYYYYYk..', '...kkkkkk...', '............', '............'];
const SAGOMA_CARTA_A2 = ['..kkkkkkkk..', '..kccccccsk.', '..kcZZZZcsk.', '..kcZccZcsk.', '..kccZZccsk.', '..kcZccZcsk.',
  '..kcZZZZcsk.', '..kccccccsk.', '..kcyccycsk.', '..ksssssssk.', '..kkkkkkkk..', '............'];
const SEMI_A2 = Object.freeze({ coppe: 'r', denari: 'y', spade: 'B', bastoni: 'V', matta: 'P' });

for (const c of CONS_A2_COLORI) {
  SPRITE_OGGETTI[`ampollaA2_${c.id}`] = SAGOMA_AMPOLLA_A2.map((r) => r.replace(/X/g, c.X).replace(/Y/g, c.Y));
}
for (const [seme, ch] of Object.entries(SEMI_A2)) {
  SPRITE_OGGETTI[`cartaA2_${seme}`] = SAGOMA_CARTA_A2.map((r) => r.replace(/Z/g, ch));
}

// ===========================================================================
// STATO DELLA RUN
// ===========================================================================
/** Generatore indipendente (mulberry32) per non spostare lo stream rng() della mappa. */
function creaRngA2(seme) {
  let s = seme >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Stato dei consumabili della run corrente (si azzera quando cambia statoRun.numeroRun).
 * @param {number} [seme] seme forzato (QA); di norma deriva da runSeed al primo accesso della run
 */
function statoA2(seme) {
  let S = statoRun.consumabiliA2;
  if (S && S.run === statoRun.numeroRun && seme === undefined) return S;
  const sm = (seme !== undefined ? seme : (runSeed ^ 0xA2C0FFEE)) >>> 0;
  const r = creaRngA2(sm);
  const eff = CONS_A2_AMPOLLE.map((e) => e.id);
  for (let i = eff.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [eff[i], eff[j]] = [eff[j], eff[i]]; }
  const mappa = {};
  CONS_A2_COLORI.forEach((c, i) => { mappa[c.id] = eff[i]; });
  S = { run: statoRun.numeroRun, seme: sm, rnd: r, mappa, notiRun: {}, slot: null, effetti: [], confusione: 0, forzaStanza: 0, rivelata: null };
  statoRun.consumabiliA2 = S;
  player.scalaA2 = 1;
  return S;
}

const conosciutiMemoriaA2 = [];

/** Id dei consumabili conosciuti (flag oggettiConosciuti dello slot, prefisso «a2:»). */
function conosciutiA2() {
  const sv = window.__teatroT3 && window.__teatroT3.salvataggi;
  if (!sv) return conosciutiMemoriaA2;
  const v = sv.leggiFlag('oggettiConosciuti');
  return Array.isArray(v) ? v : [];
}

function segnaConosciutoA2(chiave) {
  const id = `a2:${chiave}`;
  if (conosciutiA2().includes(id)) return;
  const sv = window.__teatroT3 && window.__teatroT3.salvataggi;
  if (sv) sv.impostaFlag('oggettiConosciuti', conosciutiA2().concat([id]));
  else conosciutiMemoriaA2.push(id);
}

const trovaAmpollaA2 = (id) => CONS_A2_AMPOLLE.find((e) => e.id === id) || null;
const trovaCartaA2 = (id) => CONS_A2_CARTE.find((c) => c.id === id) || null;

/** Crea un consumabile: { fam: 'ampolla', colore } o { fam: 'carta', id }. */
function creaConsumabileA2(fam, chiave) {
  return fam === 'ampolla' ? { fam, colore: chiave } : { fam: 'carta', id: chiave };
}

/** Un consumabile a caso (generatore della run). */
function estraiConsumabileA2() {
  const S = statoA2();
  if (S.rnd() < CONS_A2.drop.probAmpolla) return creaConsumabileA2('ampolla', CONS_A2_COLORI[Math.floor(S.rnd() * CONS_A2_COLORI.length)].id);
  return creaConsumabileA2('carta', CONS_A2_CARTE[Math.floor(S.rnd() * CONS_A2_CARTE.length)].id);
}

/** Effetto (riga di tabella) del consumabile. */
function effettoA2(c) {
  return c.fam === 'ampolla' ? trovaAmpollaA2(statoA2().mappa[c.colore]) : trovaCartaA2(c.id);
}

/** L'effetto è noto al giocatore? Ampolla: identificata in questa run. Carta: usata almeno una volta. */
function notoA2(c) {
  if (c.fam === 'ampolla') return Boolean(statoA2().notiRun[c.colore]);
  return conosciutiA2().includes(`a2:carta:${c.id}`);
}

function nomeA2(c) { return c.fam === 'ampolla' ? `Ampolla ${c.colore}` : trovaCartaA2(c.id).nome; }

function spriteA2(c) { return c.fam === 'ampolla' ? `ampollaA2_${c.colore}` : `cartaA2_${trovaCartaA2(c.id).seme}`; }

/** Riga d'effetto come la vede il giocatore. */
function descA2(c) {
  if (!notoA2(c)) return 'Effetto: ???';
  const e = effettoA2(c);
  return c.fam === 'ampolla' ? `${e.nome}: ${e.desc}` : e.desc;
}

// ===========================================================================
// RACCOLTA E SLOT
// ===========================================================================
/** Mette `c` nello slot; se era pieno il vecchio resta a terra sotto Ferruccio (da scavalcare). */
function prendiConsumabileA2(c) {
  const S = statoA2();
  const vecchio = S.slot;
  S.slot = c;
  const st = statoRun.stanzaCorrente;
  if (vecchio && st) {
    st.oggettiATerra.push({ tipo: 'consumabileA2', cons: vecchio, sprite: spriteA2(vecchio), x: player.x, y: player.y, bloccoA2: true });
    mostraBanner(`${CONS_A2_TESTI.raccolta(nomeA2(c))} · ${CONS_A2_TESTI.lasciato(nomeA2(vecchio))}`, 150);
  } else {
    mostraBanner(CONS_A2_TESTI.raccolta(nomeA2(c)), 130);
  }
}

/** Lascia un consumabile a terra nella stanza. */
function lasciaConsumabileA2(st, c, x, y) {
  st.oggettiATerra.push({ tipo: 'consumabileA2', cons: c, sprite: spriteA2(c), x, y });
}

// ===========================================================================
// USO E IDENTIFICAZIONE
// ===========================================================================
/** Usa il consumabile dello slot. true se usato. */
function usaConsumabileA2() {
  if (statoRun.fase !== 'in_gioco' || statoRun.pausa || statoRun.scambioPendente || statoRun.pannelloB
    || statoRun.siparioAttivo || statoRun.diarioD) return false;
  const S = statoA2();
  const c = S.slot;
  if (!c) return false;
  S.slot = null;
  const primaVolta = !notoA2(c);
  const e = effettoA2(c);
  const esito = c.fam === 'ampolla' ? applicaAmpollaA2(e) : applicaCartaA2(e);
  if (c.fam === 'ampolla') { S.notiRun[c.colore] = true; segnaConosciutoA2(`ampolla:${e.id}`); }
  else segnaConosciutoA2(`carta:${c.id}`);
  const titolo = c.fam === 'ampolla' ? `${nomeA2(c)}: ${e.nome}` : e.nome;
  if (primaVolta) {
    statoRun.cartiglioD = {
      item: { sprite: spriteA2(c), nome: titolo, statsDesc: e.desc, lore: c.fam === 'ampolla' ? CONS_A2_TESTI.loreAmpolla : CONS_A2_TESTI.loreCarta },
      t0: tick,
    };
  }
  mostraBanner(esito || `${titolo} — ${e.desc}`, 170);
  scuoti(FEEL.scossa.evento);
  statoRun.ondeEsplosione.push({ x: player.x, y: player.y, r: 6, maxR: 60, color: e.polarita === 'negativo' ? '#a855f7' : '#f9cb40' });
  return true;
}

/** Effetto di un'ampolla. Ritorna un testo di banner diverso dal default, o null. */
function applicaAmpollaA2(e) {
  const S = statoA2();
  if (e.curaHalf) statoRun.hpHalf = Math.min(statoRun.maxHpHalf, statoRun.hpHalf + e.curaHalf);
  if (e.ferisciHalf) statoRun.hpHalf = Math.max(1, statoRun.hpHalf - e.ferisciHalf); // non uccide mai
  if (e.confusioneMs) S.confusione = ticksDaMs(e.confusioneMs);
  if (e.mod || e.scala) {
    // stesso effetto due volte: la durata si rinnova, non si somma (economia.md §5)
    const gia = S.effetti.find((x) => x.id === e.id);
    if (gia) gia.stanze = CONS_A2.durataStanze;
    else S.effetti.push({ id: e.id, stanze: CONS_A2.durataStanze });
    aggiornaScalaA2();
    ricalcolaStatisticheIsaac();
  }
  return null;
}

function aggiornaScalaA2() {
  const S = statoA2();
  let k = 1;
  for (const x of S.effetti) { const e = trovaAmpollaA2(x.id); if (e && e.scala) k *= e.scala; }
  player.scalaA2 = k;
}

/** Stanza a caso per il teletrasporto: non la corrente, non il patto, non la segreta ancora chiusa. */
function stanzaACasoA2() {
  const m = statoRun.mappa;
  if (!m) return null;
  const segretaAperta = (s) => m.stanze.some((g) => g.muroSegreto && g.muroSegreto.idDest === s.id && g.muroSegreto.aperto);
  const lista = m.stanze.filter((s) => s !== statoRun.stanzaCorrente && s.tipo !== 'patto' && (s.tipo !== 'segreta' || segretaAperta(s)));
  return lista.length ? lista[Math.floor(statoA2().rnd() * lista.length)] : null;
}

/** Aggiunge monete col tetto del gioco (99). */
function moneteA2(n) { statoRun.monete = Math.min(99, statoRun.monete + n); AudioSys.playMoneta(); }

/** Effetto di una carta. Ritorna un testo di banner diverso dal default, o null. */
function applicaCartaA2(e) {
  const S = statoA2();
  const st = statoRun.stanzaCorrente;
  switch (e.effetto) {
    case 'teletrasporto': {
      const s = stanzaACasoA2();
      if (!s) return CONS_A2_TESTI.nienteStanza;
      entraInStanza(s, null);
      return null;
    }
    case 'mappa':
      S.rivelata = statoRun.mappa;
      return null;
    case 'segreta': {
      const gen = statoRun.mappa && statoRun.mappa.stanze.find((g) => g.muroSegreto && !g.muroSegreto.aperto);
      if (!gen) return CONS_A2_TESTI.nienteSegreta;
      apriMuroSegreto(gen);
      S.rivelata = S.rivelata || { soloSegreta: true };
      S.segretaRivelata = gen.muroSegreto.idDest;
      return null;
    }
    case 'curaTutto':
      statoRun.hpHalf = statoRun.maxHpHalf;
      return null;
    case 'monete':
      moneteA2(e.monete);
      return null;
    case 'dannoTutti':
      if (st) for (const n of st.nemici) if (n.hp > 0) danneggiaNemico(n, Math.max(e.dannoMin, statoRun.dmg * e.dannoMult), 0, 0);
      return null;
    case 'scudo':
      player.invuln = Math.max(player.invuln, ticksDaMs(e.scudoMs));
      return null;
    case 'fucina': {
      const f = statoRun.mappa && statoRun.mappa.stanze.find((s) => s.tipo === 'fucina');
      if (!f || f === st) return CONS_A2_TESTI.nienteFucina;
      entraInStanza(f, null);
      return null;
    }
    case 'forza':
      S.forzaStanza = CONS_A2.effettiStanza.dannoForza;
      ricalcolaStatisticheIsaac();
      return null;
    case 'stordisci':
      statoRun.proiettiliNemici = [];
      if (st) for (const n of st.nemici) if (n.hp > 0) n.stunTicks = Math.max(n.stunTicks || 0, ticksDaMs(e.stordisciMs));
      return null;
    case 'ricarica':
      if (statoRun.oggettoAttivo) statoRun.caricaAttivo = statoRun.oggettoAttivo.maxCarica;
      return null;
    case 'scorte': {
      // coordinamento con a1 (bombe/chiavi): solo se le funzioni esistono, altrimenti monete
      const I = window.__teatro && window.__teatro.interni;
      const k = I && typeof I.aggiungiChiavi === 'function';
      const b = I && typeof I.aggiungiBombe === 'function';
      if (k) I.aggiungiChiavi(1);
      if (b) I.aggiungiBombe(1);
      if (!k && !b) { moneteA2(e.monete); return `${e.nome} — +${e.monete} monete`; }
      return null;
    }
    case 'matta': {
      const altre = CONS_A2_CARTE.filter((c) => c.effetto !== 'matta');
      const scelta = altre[Math.floor(S.rnd() * altre.length)];
      const t = applicaCartaA2(scelta);
      return `${e.nome} fa da ${scelta.nome}: ${t || scelta.desc}`;
    }
    default:
      return null;
  }
}

// ===========================================================================
// AGGANCI (funzioni globali avvolte)
// ===========================================================================
/** Statistiche: gli effetti a tempo entrano come un oggetto fittizio, così valgono clamp e formule di base. */
const ricalcolaOrigA2 = ricalcolaStatisticheIsaac;
ricalcolaStatisticheIsaac = function ricalcolaStatisticheIsaacA2(...args) {
  const S = statoRun.fase === 'in_gioco' ? statoA2() : null;
  const mod = {};
  if (S) {
    for (const x of S.effetti) {
      const e = trovaAmpollaA2(x.id);
      for (const [k, v] of Object.entries((e && e.mod) || {})) mod[k] = (mod[k] || 0) + v;
    }
    if (S.forzaStanza) mod.flatDmg = (mod.flatDmg || 0) + S.forzaStanza;
  }
  if (!Object.keys(mod).length) return ricalcolaOrigA2.apply(this, args);
  const lista = statoRun.oggettiEquipaggiati;
  const finto = { id: 'effettiA2', mod };
  lista.push(finto);
  try { return ricalcolaOrigA2.apply(this, args); } finally {
    const i = lista.indexOf(finto);
    if (i >= 0) lista.splice(i, 1);
  }
};

/** Cambio stanza: finisce la forza «finché resti nella stanza». */
const entraInStanzaOrigA2 = entraInStanza;
entraInStanza = function entraInStanzaA2(...args) {
  const r = entraInStanzaOrigA2.apply(this, args);
  const S = statoRun.consumabiliA2;
  if (S && S.forzaStanza) { S.forzaStanza = 0; ricalcolaStatisticheIsaac(); }
  return r;
};

/** Pulizia di una stanza di combattimento: scalano le durate e può cadere un consumabile. */
const verificaOrigA2 = verificaStanzaPulita;
verificaStanzaPulita = function verificaStanzaPulitaA2(...args) {
  const st = statoRun.stanzaCorrente;
  const prima = st ? st.pulita : true;
  const r = verificaOrigA2.apply(this, args);
  if (st && !prima && st.pulita) dopoPuliziaA2(st);
  return r;
};

function dopoPuliziaA2(st) {
  const S = statoA2();
  if (S.effetti.length) {
    for (const x of S.effetti) x.stanze--;
    S.effetti = S.effetti.filter((x) => x.stanze > 0);
    aggiornaScalaA2();
    ricalcolaStatisticheIsaac();
  }
  if (!CONS_A2.drop.tipiEsclusi.includes(st.tipo) && S.rnd() < CONS_A2.drop.probPulizia) {
    lasciaConsumabileA2(st, estraiConsumabileA2(), CONS_A2.drop.x, CONS_A2.drop.y);
  }
}

/**
 * Fucina: lo slot «consumabile» di base (½ Maschera a ECONOMIA_T3.prezzi.consumabile) diventa un consumabile
 * A2 allo stesso prezzo e nella stessa posizione (economia.md §5: dono, cuore, consumabile).
 */
const popolaOrigA2 = popolaStanzaIsaac;
popolaStanzaIsaac = function popolaStanzaIsaacA2(s, ...resto) {
  const r = popolaOrigA2.call(this, s, ...resto);
  if (s.tipo === 'fucina' && Array.isArray(s.slotFucina) && !s.slotFucina.some((x) => x.tipo === 'consumabileA2')) {
    const i = s.slotFucina.findIndex((x) => x.tipo === 'cura' && x.sprite === CONS_A2.fucina.sostituisce);
    const nuovo = creaSlotFucinaA2(estraiConsumabileA2());
    if (i >= 0) { nuovo.x = s.slotFucina[i].x; nuovo.y = s.slotFucina[i].y; s.slotFucina[i] = nuovo; }
  }
  return r;
};

function creaSlotFucinaA2(c) {
  const sl = {
    tipo: 'consumabileA2', cons: c, prezzo: ECONOMIA_T3.prezzi.consumabile, inSaldo: false,
    sprite: spriteA2(c), tier: 'base', x: 158, y: 196, comprato: false,
  };
  Object.defineProperties(sl, {
    nome: { get: () => nomeA2(c), enumerable: true },
    nomeBreve: { get: () => nomeA2(c), enumerable: true },
    statsDesc: { get: () => descA2(c), enumerable: true },
  });
  return sl;
}

/** Interagisci davanti allo slot consumabile della Fucina: compra (il vecchio resta a terra). */
const interagisciOrigA2 = interagisciStanza;
interagisciStanza = function interagisciStanzaA2(...args) {
  const st = statoRun.stanzaCorrente;
  if (st && st.tipo === 'fucina' && !statoRun.scambioPendente && !statoRun.pannelloB && !statoRun.siparioAttivo) {
    const sl = (st.slotFucina || []).find((x) => x.tipo === 'consumabileA2' && !x.comprato
      && Math.hypot(player.x - x.x, player.y - x.y) < 42);
    if (sl) {
      if (statoRun.monete < sl.prezzo) {
        mostraBanner(`Grani insufficienti! Servono ${sl.prezzo}🪙 (hai ${statoRun.monete}🪙).`, 140);
        return undefined;
      }
      statoRun.monete -= sl.prezzo;
      sl.comprato = true;
      prendiConsumabileA2(sl.cons);
      return undefined;
    }
  }
  return interagisciOrigA2.apply(this, args);
};

/** Logica: comandi invertiti durante il Capogiro; raccolta dei consumabili a terra. */
const SCAMBI_A2 = Object.freeze([['KeyA', 'KeyD'], ['KeyW', 'KeyS']]);
const passoOrigA2 = passoLogico;
passoLogico = function passoLogicoA2(...args) {
  const S = statoRun.fase === 'in_gioco' ? statoA2() : null;
  const libero = S && !(statoRun.scambioPendente || statoRun.pannelloB || statoRun.siparioAttivo || statoRun.pausa);
  const confuso = libero && S.confusione > 0;
  const scambia = () => { for (const [a, b] of SCAMBI_A2) { const t = keys[a]; keys[a] = keys[b]; keys[b] = t; } };
  if (confuso) scambia();
  let r;
  try { r = passoOrigA2.apply(this, args); } finally { if (confuso) scambia(); }
  if (confuso) S.confusione--;
  if (libero && statoRun.fase === 'in_gioco') raccogliA2();
  return r;
};

function raccogliA2() {
  const st = statoRun.stanzaCorrente;
  if (!st || !st.oggettiATerra) return;
  for (let i = st.oggettiATerra.length - 1; i >= 0; i--) {
    const pk = st.oggettiATerra[i];
    if (pk.tipo !== 'consumabileA2') continue;
    const d = Math.hypot(player.x - pk.x, player.y - pk.y);
    if (pk.bloccoA2) { if (d > CONS_A2.raggioSblocco) pk.bloccoA2 = false; continue; }
    if (d < CONS_A2.raggioRaccolta) {
      st.oggettiATerra.splice(i, 1);
      prendiConsumabileA2(pk.cons);
      return; // uno per tick: quello lasciato è bloccato
    }
  }
}

/** Nuova run: lo stato si rifà (nuova corrispondenza colori). Copre anche il T4, che chiama interni.nuovaRun. */
const nuovaRunOrigA2 = nuovaRun;
nuovaRun = function nuovaRunA2(...args) {
  const r = nuovaRunOrigA2.apply(this, args);
  statoA2();
  return r;
};

// ===========================================================================
// RESA: slot nell'HUD, effetti attivi, minimappa rivelata, Diario
// ===========================================================================
const hudOrigA2 = disegnaHUDPixelArt;
disegnaHUDPixelArt = function disegnaHUDPixelArtA2(st, ...resto) {
  const r = hudOrigA2.call(this, st, ...resto);
  if (statoRun.fase === 'in_gioco') {
    disegnaMappaRivelataA2(st);
    disegnaSlotA2();
  }
  return r;
};

/** Rettangolo dello slot nell'HUD (anche per il click). */
function rettSlotA2() {
  const L = CONS_A2.hud.lato;
  return { x: CONS_A2.hud.x, y: H - 34, w: L, h: L };
}

function disegnaSlotA2() {
  const S = statoA2();
  const R = rettSlotA2();
  const c = S.slot;
  ctx.save();
  ctx.fillStyle = 'rgba(15, 12, 10, 0.94)';
  ctx.fillRect(R.x, R.y, R.w, R.h);
  ctx.strokeStyle = c ? '#e6d2aa' : '#57534e';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(R.x, R.y, R.w, R.h);
  if (c) drawPixelSprite(SPRITE_OGGETTI[spriteA2(c)], R.x + R.w / 2, R.y + R.h / 2 + 1, 1.55);
  drawTextFit('F', R.x + 3, R.y + 8, 10, { size: 7, color: '#e6d2aa', align: 'left', shadow: false });
  // nome e riga a sinistra dello slot
  const tx = R.x - 4, tw = R.x - 12;
  ctx.fillStyle = 'rgba(10, 6, 4, 0.85)';
  ctx.fillRect(8, R.y, tw, R.h);
  drawTextFit(c ? nomeA2(c) : `Consumabile: ${CONS_A2_TESTI.slotVuoto}`, tx, R.y + 10, tw - 4, { size: 7, color: '#ffffff', align: 'right' });
  if (c) drawTextFit(descA2(c), tx, R.y + 21, tw - 4, { size: 6.5, color: notoA2(c) ? '#4ade80' : '#a8a29e', align: 'right' });
  // effetti a tempo sopra lo slot
  let y = R.y - 6;
  const righe = S.effetti.map((x) => `⏳ ${trovaAmpollaA2(x.id).nome} (${x.stanze})`);
  if (S.confusione > 0) righe.push(`⏳ Capogiro (${Math.ceil(S.confusione * MS_PER_TICK / 1000)} s)`);
  if (S.forzaStanza) righe.push('⏳ Re di Bastoni (stanza)');
  for (const t of righe) {
    drawTextFit(t, 8, y, 160, { size: 6.5, color: '#f9cb40', align: 'left' });
    y -= 9;
  }
  ctx.restore();
}

/** Minimappa: le stanze rivelate da una carta, non ancora visitate, come sagome tenui. */
function disegnaMappaRivelataA2(st) {
  const S = statoA2();
  const m = statoRun.mappa;
  if (!m || !S.rivelata || maledizioneD('mappa')) return;
  const tutta = S.rivelata === m;
  const cell = 12, x0 = W - 118, y0 = 24;
  ctx.save();
  for (const s of m.stanze) {
    if (s.visitata || s.tipo === 'patto') continue;
    if (s.tipo === 'segreta' ? S.segretaRivelata !== s.id : !tutta) continue;
    const px = x0 + (s.cx - 1) * cell;
    const py = y0 + (s.cy - 1) * cell;
    ctx.strokeStyle = s.tipo === 'boss' ? '#b91c1c' : s.tipo === 'fucina' ? '#ea8626' : s.tipo === 'tesoro' ? '#f9cb40' : '#a8a29e';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 1.5, py + 1.5, cell - 3, cell - 3);
  }
  ctx.restore();
}

/** Diario: con C si passa alla pagina dei consumabili (statoRun.diarioD.paginaA2). */
const tastoDiarioOrigA2 = tastoDiarioD;
tastoDiarioD = function tastoDiarioDA2(code, ...resto) {
  const d = statoRun.diarioD;
  if (d && code === CONS_A2.tastoDiario) { d.paginaA2 = !d.paginaA2; return undefined; }
  if (d && d.paginaA2) {
    if (['Escape', 'KeyO', 'Enter', 'Space'].includes(code)) statoRun.diarioD = null;
    return undefined;
  }
  return tastoDiarioOrigA2.call(this, code, ...resto);
};

const clickDiarioOrigA2 = clickDiarioD;
clickDiarioD = function clickDiarioDA2(mx, my, ...resto) {
  const d = statoRun.diarioD;
  if (d && d.paginaA2) { if (my < 30 || my > H - 20) statoRun.diarioD = null; return undefined; }
  return clickDiarioOrigA2.call(this, mx, my, ...resto);
};

const disegnaDiarioOrigA2 = disegnaDiarioD;
disegnaDiarioD = function disegnaDiarioDA2(...args) {
  const d = statoRun.diarioD;
  if (!d) return undefined;
  if (!d.paginaA2) {
    const r = disegnaDiarioOrigA2.apply(this, args);
    drawTextFit('C: consumabili', W - 40, H - 14, 70, { size: 7, color: '#f9cb40', align: 'right' });
    return r;
  }
  disegnaDiarioConsumabiliA2();
  return undefined;
};

function disegnaDiarioConsumabiliA2() {
  const noti = conosciutiA2();
  const S = statoRun.fase === 'in_gioco' ? statoA2() : null;
  ctx.save();
  ctx.fillStyle = 'rgba(5, 3, 2, 0.94)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#1c130c';
  ctx.strokeStyle = '#f9cb40';
  ctx.lineWidth = 2;
  ctx.fillRect(24, 14, W - 48, H - 24);
  ctx.strokeRect(24, 14, W - 48, H - 24);
  const nA = CONS_A2_AMPOLLE.filter((e) => noti.includes(`a2:ampolla:${e.id}`)).length;
  const nC = CONS_A2_CARTE.filter((c) => noti.includes(`a2:carta:${c.id}`)).length;
  const tot = CONS_A2_AMPOLLE.length + CONS_A2_CARTE.length;
  drawTextFit(`📖 ${CONS_A2_TESTI.diarioTitolo} — Conosciuti ${nA + nC} / ${tot}`, W / 2, 32, W - 80, { size: 10, color: '#f9cb40' });
  const colonna = (x0, titolo, righe) => {
    drawTextFit(titolo, x0, 48, 280, { size: 8, color: '#67e8f9', align: 'left' });
    righe.forEach((rg, i) => {
      const y = 62 + i * 19;
      if (rg.sprite) drawPixelSprite(SPRITE_OGGETTI[rg.sprite], x0 + 6, y - 2, 1.1);
      drawTextFit(rg.nome, x0 + 16, y - 3, 266, { size: 7.5, color: rg.noto ? '#e6d2aa' : '#a8a29e', align: 'left', shadow: false });
      drawTextFit(rg.desc, x0 + 16, y + 6, 266, { size: 6.5, color: rg.noto ? '#4ade80' : '#78716c', align: 'left', shadow: false });
    });
  };
  colonna(36, CONS_A2_TESTI.diarioAmpolle, CONS_A2_AMPOLLE.map((e) => {
    const noto = noti.includes(`a2:ampolla:${e.id}`);
    const col = S && Object.keys(S.mappa).find((k) => S.mappa[k] === e.id && S.notiRun[k]);
    return {
      noto, sprite: col ? `ampollaA2_${col}` : null,
      nome: noto ? `${e.nome}${col ? ` — stanotte: ${col}` : ''}` : '???', desc: noto ? e.desc : 'Bevila per scoprirla.',
    };
  }));
  colonna(328, CONS_A2_TESTI.diarioCarte, CONS_A2_CARTE.map((c) => {
    const noto = noti.includes(`a2:carta:${c.id}`);
    return { noto, sprite: `cartaA2_${c.seme}`, nome: c.nome, desc: noto ? c.desc : 'Effetto: ??? — giocala per scoprirlo.' };
  }));
  drawTextFit(CONS_A2_TESTI.diarioPiede, W / 2, H - 14, W - 80, { size: 7, color: '#9ca3af' });
  ctx.restore();
}

// ===========================================================================
// INPUT (fase di cattura: prima dei gestori di 70-input.js, dopo quelli del T3)
// ===========================================================================
window.addEventListener('keydown', (e) => {
  if (e.code !== CONS_A2.tasto || e.repeat) return;
  if (usaConsumabileA2()) e.preventDefault();
}, true);

canvas.addEventListener('mousedown', (e) => {
  if (statoRun.fase !== 'in_gioco' || statoRun.pausa || statoRun.siparioAttivo || statoRun.pannelloB) return;
  const r = canvas.getBoundingClientRect();
  const mx = (e.clientX - r.left) * (W / r.width);
  const my = (e.clientY - r.top) * (H / r.height);
  const R = rettSlotA2();
  if (mx >= R.x && mx <= R.x + R.w && my >= R.y && my <= R.y + R.h) {
    usaConsumabileA2();
    e.stopImmediatePropagation();
  }
}, true);

// ===========================================================================
// SONDA QA
// ===========================================================================
Object.assign(window.__teatro.interni, {
  CONS_A2, CONS_A2_AMPOLLE, CONS_A2_CARTE, CONS_A2_COLORI, statoA2, creaConsumabileA2, prendiConsumabileA2,
  usaConsumabileA2, lasciaConsumabileA2, estraiConsumabileA2, effettoA2, notoA2, descA2, nomeA2, conosciutiA2,
  // gli interni esposti in 80-ciclo.js puntano alle versioni non avvolte: si aggiornano
  nuovaRun, entraInStanza, interagisciStanza, ricalcolaStatisticheIsaac, tastoDiarioD,
});
