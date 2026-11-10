/*
 * teatro/a1-bombe-chiavi.js — Miglioramento 1: bombe, chiavi, forzieri e porte chiuse a lucchetto.
 * Nomi e testi sono del Teatro, Caserta 1845.
 *
 * Script classico caricato dopo t4-hub-storia.js. Costruisce sopra il gioco senza duplicarlo:
 * - avvolge (riassegnando le `function` globali) generaMappaPiano, avviaPiano, entraInStanza,
 *   verificaStanzaPulita, interagisciStanza, passoLogico, disegnaStanzaPixelArt;
 * - i raccoglibili bomba/chiave stanno in st.oggettiATerra (disegnati dal ciclo esistente con
 *   SPRITE_OGGETTI.bombaA1 / chiaveA1), i forzieri in st.forzieriA1, le bombe accese in statoRun.bombeA1;
 * - l'inventario è statoRun.bombe / statoRun.chiavi (azzerato a ogni run nuova, valori in tabella).
 * Unici agganci nei file di base: il contatore nell'HUD (60-resa.js, testoInventarioA1) e lo <script> nell'HTML.
 *
 * Tasto: E piazza una bomba quando non c'è niente con cui interagire vicino;
 * con un piedistallo, uno slot della Fucina/del Patto o l'uscita del boss vicini E fa quello che faceva prima.
 */

// ===========================================================================
// TABELLA DEI VALORI (data-driven: si tara da qui)
// ===========================================================================
const BOMBE_CHIAVI_A1 = Object.freeze({
  inizio: Object.freeze({ bombe: 1, chiavi: 1 }),     // dotazione a inizio run
  massimo: Object.freeze({ bombe: 99, chiavi: 99 }),
  bomba: Object.freeze({
    miccaMs: 1500,            // miccia
    raggio: 56,               // px: nemici, colonne, bracieri
    raggioGiocatore: 40,      // px: la propria bomba ferisce anche te
    raggioMuroSegreto: 95,    // px dal centro della porta murata
    dannoBase: 30,            // al piano 1 (colpi base ~3,5): un Bozzo o una Vespa muoiono, una Guardia quasi
    dannoPerPiano: 6,
    dannoGiocatoreHalf: 2,    // mezze maschere
    cooldownMs: 450,          // fra due bombe (anche col tasto tenuto premuto)
    rompeColonne: true,
    ritardoCatenaTick: 6,     // un'altra bomba nel raggio esplode quasi subito
  }),
  raccolta: Object.freeze({ raggio: 20 }),
  forziere: Object.freeze({ raggioTocco: 20, spargimentoPx: 22 }),
  // Una sola estrazione a stanza di combattimento ripulita (oltre a monete/cure già esistenti).
  // Probabilità cumulate in quest'ordine; il resto (0,60) è niente.
  // (bilancio 7) chiave 0,09 → 0,16: con 2 lucchetti a piano (tesoro e Fucina) dal piano 2 un piano su 4-5 lasciava
  // una delle due porte chiusa (21-31%); ora 7-13% (tools/sim-bilancio-teatro.js, production/bilancio-teatro.md).
  drop: Object.freeze({ bomba: 0.12, chiave: 0.16, forziereComune: 0.08, forziereChiuso: 0.04 }),
  posizioneDrop: Object.freeze({ x: 360, y: 214 }),
  contenuto: Object.freeze({
    comune: Object.freeze({ pezziMin: 1, pezziMax: 2, probOggetto: 0,
      pesi: Object.freeze({ moneta: 40, mezzaCura: 20, bomba: 20, chiave: 20 }) }),
    chiuso: Object.freeze({ pezziMin: 2, pezziMax: 3, probOggetto: 0.25,
      pesi: Object.freeze({ monetaTripla: 30, moneta: 15, curaIntera: 20, bomba: 18, chiave: 17 }) }),
  }),
  lucchetti: Object.freeze({
    pianoMin: 2,                                   // dal piano 2 in poi
    tipi: Object.freeze(['tesoro', 'fucina']),      // stanze foglia con la porta chiusa a chiave
    spintaPx: 16,                                  // senza chiave la porta ti respinge di tanto
  }),
  chiaveGarantita: Object.freeze({ attiva: true, posizione: Object.freeze({ x: 290, y: 214 }) }),
  avvisoTick: 100,            // un avviso uguale non si ripete prima di tanti tick
});

/** Pezzi che possono uscire da un forziere: come entrano in st.oggettiATerra. */
const PEZZI_A1 = Object.freeze({
  moneta: { tipo: 'moneta', valore: 1, sprite: 'moneta1' },
  monetaTripla: { tipo: 'moneta', valore: 3, sprite: 'moneta3' },
  mezzaCura: { tipo: 'cura', valore: 1, sprite: 'mezzaMaschera' },
  curaIntera: { tipo: 'cura', valore: 2, sprite: 'cuore' },
  bomba: { tipo: 'bomba', valore: 1, sprite: 'bombaA1' },
  chiave: { tipo: 'chiave', valore: 1, sprite: 'chiaveA1' },
});

// Sprite dei raccoglibili (12×12, palette di 00-config.js)
Object.assign(SPRITE_OGGETTI, {
  bombaA1: [
    '........y...', '.......yo...', '......kk....', '....kkkkkk..', '...kddddddk.', '..kddwdddddk',
    '..kdwddddddk', '..kdddddddDk', '..kddddddDDk', '...kddDDDDk.', '....kkkkkk..', '............'],
  chiaveA1: [
    '............', '............', '.kkkk.......', 'kyyyyk......', 'kykkykkkkkk.', 'kyk.kyyyyyyk',
    'kykkykkykyk.', 'kyyyyk.kk.k.', '.kkkk.......', '............', '............', '............'],
});

// ===========================================================================
// INVENTARIO
// ===========================================================================
let inventarioRunA1 = null; // numeroRun per cui l'inventario è già stato preparato
let ultimoAvvisoA1 = { testo: '', tick: -Infinity };
let prossimaBombaTickA1 = 0;
/** Altri controlli «c'è qualcosa con cui interagire qui?» (stanze nuove di altre squadre). */
const interazioniVicineA1 = [];

function preparaInventarioA1() {
  statoRun.bombe = BOMBE_CHIAVI_A1.inizio.bombe;
  statoRun.chiavi = BOMBE_CHIAVI_A1.inizio.chiavi;
  statoRun.bombeA1 = [];
  inventarioRunA1 = statoRun.numeroRun;
}

/** Aggiunge (o toglie, se negativo) n bombe; ritorna il nuovo totale. */
function aggiungiBombe(n = 1) {
  statoRun.bombe = Math.max(0, Math.min(BOMBE_CHIAVI_A1.massimo.bombe, (statoRun.bombe || 0) + Math.trunc(n)));
  return statoRun.bombe;
}

/** Aggiunge (o toglie, se negativo) n chiavi; ritorna il nuovo totale. */
function aggiungiChiavi(n = 1) {
  statoRun.chiavi = Math.max(0, Math.min(BOMBE_CHIAVI_A1.massimo.chiavi, (statoRun.chiavi || 0) + Math.trunc(n)));
  return statoRun.chiavi;
}

/** Testo dell'HUD accanto alle monete (agganciato in 60-resa.js). */
function testoInventarioA1() {
  return ` 💣${statoRun.bombe || 0} 🗝${statoRun.chiavi || 0}`;
}

function avvisoA1(testo, durata = 140) {
  if (ultimoAvvisoA1.testo === testo && tick - ultimoAvvisoA1.tick < BOMBE_CHIAVI_A1.avvisoTick) return;
  ultimoAvvisoA1 = { testo, tick };
  mostraBanner(testo, durata);
}

// ===========================================================================
// FORZIERI E RACCOGLIBILI
// ===========================================================================
const limitaArenaA1 = (x, y, m = 20) => ({
  x: Math.max(ARENA.x1 + m, Math.min(ARENA.x2 - m, x)),
  y: Math.max(ARENA.y1 + m, Math.min(ARENA.y2 - m, y)),
});

/** Mette a terra un pezzo di PEZZI_A1 (niente filtro del piano 1: è un drop già deciso). */
function spargiPezzoA1(st, chiave, x, y) {
  const base = PEZZI_A1[chiave];
  if (!st || !base) return null;
  const p = limitaArenaA1(x, y);
  const pk = { ...base, x: p.x, y: p.y };
  st.oggettiATerra.push(pk);
  return pk;
}

/**
 * Crea un forziere nella stanza (corrente, se non indicata).
 * @param {'comune'|'chiuso'} tipo @param {number} x @param {number} y @param {object} [stanza]
 */
function generaForziere(tipo = 'comune', x = 320, y = 200, stanza = statoRun.stanzaCorrente) {
  if (!stanza) return null;
  const t = tipo === 'chiuso' ? 'chiuso' : 'comune';
  if (!stanza.forzieriA1) stanza.forzieriA1 = [];
  const p = limitaArenaA1(x, y, 24);
  const f = { tipo: t, x: p.x, y: p.y, aperto: false, oggetto: false };
  stanza.forzieriA1.push(f);
  return f;
}

function estraiPesatoA1(pesi) {
  const voci = Object.entries(pesi);
  const tot = voci.reduce((s, [, w]) => s + w, 0);
  let r = rng() * tot;
  for (const [k, w] of voci) { r -= w; if (r < 0) return k; }
  return voci[voci.length - 1][0];
}

/** Apre un forziere: un oggetto sul piedistallo (solo chiuso, a volte) oppure qualche pezzo sparso. */
function apriForziereA1(st, f) {
  if (!f || f.aperto) return;
  f.aperto = true;
  const C = BOMBE_CHIAVI_A1.contenuto[f.tipo];
  AudioSys.playMoneta();
  scuoti(FEEL.scossa.colpo);
  const pedLibero = !st.oggettoPiedistallo || st.oggettoPiedistallo.preso;
  if (C.probOggetto > 0 && pedLibero && rng() < C.probOggetto) {
    const obj = estraiOggettoBase();
    if (obj) {
      st.oggettoPiedistallo = { ...obj, x: f.x, y: f.y, preso: false };
      f.oggetto = true;
      mostraBanner(`Il forziere custodiva un oggetto: ${nomeD(st.oggettoPiedistallo)} [Click/E]`, 200);
      return;
    }
  }
  const n = C.pezziMin + Math.floor(rng() * (C.pezziMax - C.pezziMin + 1));
  const R = BOMBE_CHIAVI_A1.forziere.spargimentoPx;
  for (let k = 0; k < n; k++) {
    const a = (TAU * k) / n + 0.6;
    spargiPezzoA1(st, estraiPesatoA1(C.pesi), f.x + Math.cos(a) * R, f.y + 8 + Math.sin(a) * R * 0.6);
  }
}

/** Drop alla pulizia di una stanza di combattimento (chiave garantita, poi una estrazione dalla tabella). */
function dropPuliziaA1(st) {
  const T = BOMBE_CHIAVI_A1;
  if (st.chiaveGarantitaA1) {
    st.chiaveGarantitaA1 = false;
    spargiPezzoA1(st, 'chiave', T.chiaveGarantita.posizione.x, T.chiaveGarantita.posizione.y);
  }
  const r = rng();
  const { x, y } = T.posizioneDrop;
  let soglia = 0;
  if (r < (soglia += T.drop.bomba)) spargiPezzoA1(st, 'bomba', x, y);
  else if (r < (soglia += T.drop.chiave)) spargiPezzoA1(st, 'chiave', x, y);
  else if (r < (soglia += T.drop.forziereComune)) generaForziere('comune', x, y, st);
  else if (r < (soglia += T.drop.forziereChiuso)) generaForziere('chiuso', x, y, st);
}

/** Raccolta di bombe/chiavi a terra e tocco dei forzieri (un tick di logica). */
function raccoltaA1(st) {
  const R = BOMBE_CHIAVI_A1.raccolta.raggio;
  for (let i = st.oggettiATerra.length - 1; i >= 0; i--) {
    const pk = st.oggettiATerra[i];
    if (pk.tipo !== 'bomba' && pk.tipo !== 'chiave') continue;
    if (Math.hypot(player.x - pk.x, player.y - pk.y) >= R) continue;
    if (pk.tipo === 'bomba') aggiungiBombe(pk.valore || 1); else aggiungiChiavi(pk.valore || 1);
    AudioSys.playMoneta();
    st.oggettiATerra.splice(i, 1);
  }
  for (const f of st.forzieriA1 || []) {
    if (f.aperto || Math.hypot(player.x - f.x, player.y - f.y) >= BOMBE_CHIAVI_A1.forziere.raggioTocco) continue;
    if (f.tipo === 'comune') apriForziereA1(st, f);
    else if ((statoRun.chiavi || 0) > 0) { aggiungiChiavi(-1); apriForziereA1(st, f); }
    else avvisoA1('🔒 Forziere chiuso: serve una chiave 🗝');
  }
}

// ===========================================================================
// BOMBE
// ===========================================================================
/** Piazza una bomba ai piedi del giocatore. Ritorna true se l'ha piazzata. */
function piazzaBombaA1() {
  const st = statoRun.stanzaCorrente;
  if (statoRun.fase !== 'in_gioco' || !st || statoRun.pausa || statoRun.siparioAttivo) return false;
  if (tick < prossimaBombaTickA1) return false;
  if ((statoRun.bombe || 0) <= 0) { avvisoA1('Niente bombe 💣'); return false; }
  const B = BOMBE_CHIAVI_A1.bomba;
  aggiungiBombe(-1);
  prossimaBombaTickA1 = tick + ticksDaMs(B.cooldownMs);
  if (!statoRun.bombeA1) statoRun.bombeA1 = [];
  const tot = ticksDaMs(B.miccaMs);
  statoRun.bombeA1.push({ x: player.x, y: player.y + 4, miccia: tot, tot });
  AudioSys.playPasso();
  return true;
}

/** Centro della porta murata della stanza segreta (come in innescaEsplosioneBomba). */
function posMuroSegretoA1(lato) {
  return { N: [320, ARENA.y1], S: [320, ARENA.y2], W: [ARENA.x1, 188], E: [ARENA.x2, 188] }[lato] || null;
}

function esplodiBombaA1(st, b) {
  const B = BOMBE_CHIAVI_A1.bomba;
  scuoti(FEEL.scossa.bomba);
  congela(FEEL.hitstop.uccisioneMs);
  AudioSys.playEsplosione();
  statoRun.ondeEsplosione.push({ x: b.x, y: b.y, r: 6, maxR: B.raggio, color: '#fb923c' });
  if (!st.macchie) st.macchie = [];
  const rm = rngMacchia(Math.round(b.x) * 73856093 ^ Math.round(b.y) * 19349663);
  for (let k = 0; k < 8; k++) {
    st.macchie.push({ x: b.x + (rm() - 0.5) * 40, y: b.y + (rm() - 0.5) * 28, r: 3.5 + rm() * 4.5,
      col: rm() < 0.7 ? '#050302' : '#450a0a', tipo: 'bruciatura' });
  }
  // Nemici: il danno passa anche la maschera chiusa
  const danno = B.dannoBase + (statoRun.piano - 1) * B.dannoPerPiano;
  for (const nem of st.nemici) {
    if (nem.hp <= 0 || (nem.airZ || 0) > 16) continue;
    const dx = nem.x - b.x, dy = nem.y - b.y, d = Math.hypot(dx, dy);
    if (d >= B.raggio + (nem.r || 0)) continue;
    const eraChiusa = (nem.patternMob || nem.tipo) === 'maschera' && !nem.maskOpen;
    if (eraChiusa) nem.maskOpen = true;
    danneggiaNemico(nem, danno, d > 0 ? dx / d : 0, d > 0 ? dy / d : 0);
    if (eraChiusa && nem.hp > 0) nem.maskOpen = false;
  }
  // Ostacoli: le colonne crollano, i bracieri si rovesciano (come col fendente)
  for (let i = st.ostacoli.length - 1; i >= 0; i--) {
    const o = st.ostacoli[i];
    if (Math.hypot(o.x - b.x, o.y - b.y) >= B.raggio + (o.r || 0)) continue;
    if (o.tipo === 'colonna' && B.rompeColonne) {
      st.ostacoli.splice(i, 1);
      for (let k = 0; k < 5; k++) {
        st.macchie.push({ x: o.x + (rm() - 0.5) * 30, y: o.y + (rm() - 0.5) * 18, r: 2 + rm() * 3, col: '#64748b', tipo: 'scheggia' });
      }
      statoRun.effettiSplash.push({ x: o.x, y: o.y - 8, tick: 0 });
    } else if (o.tipo === 'braciere' && o.acceso) {
      o.acceso = false;
      if (!st.pozzanghereFuoco) st.pozzanghereFuoco = [];
      st.pozzanghereFuoco.push({ x: o.x, y: o.y, r: 26, tick: 360 });
      statoRun.ondeEsplosione.push({ x: o.x, y: o.y, r: 6, maxR: 32, color: '#f97316' });
    }
  }
  // Muro della stanza segreta
  if (st.muroSegreto && !st.muroSegreto.aperto) {
    const pm = posMuroSegretoA1(st.muroSegreto.lato);
    if (pm && Math.hypot(b.x - pm[0], b.y - pm[1]) < B.raggioMuroSegreto) apriMuroSegreto(st);
  }
  // Altre bombe nel raggio: esplosione a catena
  for (const altra of statoRun.bombeA1 || []) {
    if (altra !== b && Math.hypot(altra.x - b.x, altra.y - b.y) < B.raggio) altra.miccia = Math.min(altra.miccia, B.ritardoCatenaTick);
  }
  // La propria bomba ferisce anche Ferruccio (subisciColpoGiocatore rispetta i-frames e grazia)
  if (Math.hypot(player.x - b.x, player.y - b.y) < B.raggioGiocatore) {
    subisciColpoGiocatore(B.dannoGiocatoreHalf, 'la tua bomba', b.x, b.y);
  }
}

function aggiornaBombeA1(st) {
  const lista = statoRun.bombeA1;
  if (!lista || !lista.length) return;
  for (let i = lista.length - 1; i >= 0; i--) {
    const b = lista[i];
    if (--b.miccia > 0) continue;
    lista.splice(i, 1);
    esplodiBombaA1(st, b);
  }
}

// ===========================================================================
// PORTE CHIUSE A CHIAVE
// ===========================================================================
/** Id delle stanze sul percorso più breve ingresso → boss (BFS sulle porte). */
function percorsoBossA1(m) {
  const ing = m.stanze.find((s) => s.tipo === 'ingresso');
  const boss = m.stanze.find((s) => s.tipo === 'boss');
  const sul = new Set();
  if (!ing || !boss) return sul;
  const prec = new Map([[ing.id, null]]);
  const coda = [ing];
  while (coda.length) {
    const s = coda.shift();
    for (const id of Object.values(s.porte)) {
      if (prec.has(id)) continue;
      prec.set(id, s.id);
      coda.push(m.perId.get(id));
    }
  }
  for (let id = boss.id; id; id = prec.get(id)) sul.add(id);
  return sul;
}

/**
 * Chiude a chiave tesoro e Fucina dal piano L.pianoMin: solo se sono foglie (una porta) e fuori dal
 * percorso per il boss, così una porta chiusa non blocca mai la run.
 */
function applicaLucchettiA1(m, piano) {
  const L = BOMBE_CHIAVI_A1.lucchetti;
  if (!m || piano < L.pianoMin) return m;
  const percorso = percorsoBossA1(m);
  for (const s of m.stanze) {
    if (!L.tipi.includes(s.tipo)) continue;
    if (Object.keys(s.porte).length !== 1 || percorso.has(s.id)) continue;
    s.chiusaA1 = true;
  }
  return m;
}

/** Senza chiavi a inizio piano e con porte chiuse: la prima stanza di combattimento lascia una chiave. */
function garantisciChiaveA1(m) {
  if (!BOMBE_CHIAVI_A1.chiaveGarantita.attiva || !m) return;
  if ((statoRun.chiavi || 0) > 0 || !m.stanze.some((s) => s.chiusaA1)) return;
  const s = m.stanze.find((x) => x.tipo === 'normale' && !x.pulita);
  if (s) s.chiaveGarantitaA1 = true;
}

function latoVersoA1(da, idDest) {
  return Object.keys(da?.porte || {}).find((l) => da.porte[l] === idDest) || null;
}

function respingiDallaPortaA1(lato) {
  const s = BOMBE_CHIAVI_A1.lucchetti.spintaPx;
  if (lato === 'N') player.y = Math.max(player.y, ARENA.y1 + 5 + s);
  else if (lato === 'S') player.y = Math.min(player.y, ARENA.y2 - 5 - s);
  else if (lato === 'W') player.x = Math.max(player.x, ARENA.x1 + 5 + s);
  else if (lato === 'E') player.x = Math.min(player.x, ARENA.x2 - 5 - s);
  player.targetX = null;
  player.targetY = null;
  player.kbx = 0; player.kby = 0;
}

// ===========================================================================
// DISEGNO
// ===========================================================================
function disegnaLucchettoA1(x, y, t) {
  ctx.save();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.beginPath(); // catene incrociate sulla porta
  ctx.moveTo(x - 12, y - 7); ctx.lineTo(x + 12, y + 7);
  ctx.moveTo(x + 12, y - 7); ctx.lineTo(x - 12, y + 7);
  ctx.stroke();
  const dy = Math.round(Math.sin(t * 0.08) * 0.8);
  ctx.strokeStyle = '#0a0604';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y - 3 + dy, 4.5, Math.PI, 0); ctx.stroke();
  ctx.strokeStyle = '#f9cb40';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x, y - 3 + dy, 4.5, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = '#0a0604';
  ctx.fillRect(x - 7, y - 4 + dy, 14, 11);
  ctx.fillStyle = '#d4a017';
  ctx.fillRect(x - 6, y - 3 + dy, 12, 9);
  ctx.fillStyle = '#f9cb40';
  ctx.fillRect(x - 6, y - 3 + dy, 12, 2);
  ctx.fillStyle = '#0a0604';
  ctx.beginPath(); ctx.arc(x, y + 1 + dy, 1.6, 0, TAU); ctx.fill();
  ctx.fillRect(x - 0.8, y + 1 + dy, 1.6, 3.5);
  ctx.restore();
}

function disegnaForziereA1(f) {
  if (f.aperto && f.oggetto) return; // al suo posto c'è il piedistallo
  const chiuso = f.tipo === 'chiuso';
  const x = Math.round(f.x), y = Math.round(f.y);
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath(); ctx.ellipse(x, y + 7, 14, 4, 0, 0, TAU); ctx.fill();
  const legno = chiuso ? '#475569' : '#8b5a2b';
  const scuro = chiuso ? '#1e293b' : '#4a2c12';
  const bordo = chiuso ? '#cbd5e1' : '#f9cb40';
  ctx.fillStyle = '#0a0604';
  ctx.fillRect(x - 12, y - 6, 24, 13);
  ctx.fillStyle = legno;
  ctx.fillRect(x - 11, y - 5, 22, 11);
  ctx.fillStyle = scuro;
  ctx.fillRect(x - 11, y + 2, 22, 4);
  ctx.fillStyle = bordo;
  ctx.fillRect(x - 11, y - 5, 2, 11);
  ctx.fillRect(x + 9, y - 5, 2, 11);
  if (f.aperto) {
    ctx.fillStyle = '#050302'; // coperchio alzato, interno vuoto
    ctx.fillRect(x - 10, y - 5, 20, 3);
    ctx.fillStyle = '#0a0604';
    ctx.fillRect(x - 12, y - 15, 24, 9);
    ctx.fillStyle = legno;
    ctx.fillRect(x - 11, y - 14, 22, 7);
  } else {
    ctx.fillStyle = '#0a0604';
    ctx.fillRect(x - 12, y - 12, 24, 7);
    ctx.fillStyle = legno;
    ctx.fillRect(x - 11, y - 11, 22, 5);
    ctx.fillStyle = bordo;
    ctx.fillRect(x - 11, y - 11, 22, 1);
    ctx.fillRect(x - 2, y - 7, 4, 5); // borchia / serratura
    if (chiuso) { ctx.fillStyle = '#0a0604'; ctx.fillRect(x - 0.5, y - 6, 1, 3); }
  }
  ctx.restore();
}

function disegnaBombaAccesaA1(b, t) {
  const fine = b.miccia / b.tot < 0.4;
  const lampo = fine ? Math.floor(t / 3) % 2 === 0 : Math.floor(t / 10) % 2 === 0 && b.miccia / b.tot < 0.7;
  const gonfia = fine ? 1.8 + 0.15 * Math.sin(t * 0.9) : 1.8;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath(); ctx.ellipse(b.x, b.y + 9, 10, 3.5, 0, 0, TAU); ctx.fill();
  ctx.restore();
  drawPixelSprite(SPRITE_OGGETTI.bombaA1, b.x, b.y, gonfia, false, lampo);
  ctx.save();
  ctx.fillStyle = t % 4 < 2 ? '#fef08a' : '#f97316'; // scintilla della miccia
  ctx.beginPath(); ctx.arc(b.x + 4, b.y - 11, 1.5 + (t % 3) * 0.5, 0, TAU); ctx.fill();
  ctx.restore();
}

function disegnaA1(t, st) {
  const porte = PORTE_C;
  for (const [lato, idDest] of Object.entries(st.porte || {})) {
    const dest = statoRun.mappa?.perId.get(idDest);
    if (dest?.chiusaA1 && porte[lato]) disegnaLucchettoA1(porte[lato].x, porte[lato].y, t);
  }
  for (const f of st.forzieriA1 || []) disegnaForziereA1(f);
  for (const b of statoRun.bombeA1 || []) disegnaBombaAccesaA1(b, t);
}

// ===========================================================================
// INTERAZIONE CONTESTUALE (E): interagire se c'è qualcosa vicino, altrimenti bomba
// ===========================================================================
/** Stesse distanze di interagisciStanza (40-combattimento.js). */
function interazioneVicinaA1(st) {
  if (!st) return false;
  const d = (x, y) => Math.hypot(player.x - x, player.y - y);
  if (st.tipo === 'sviluppatore') return true;
  const o = st.oggettoPiedistallo;
  if (st.pulita && o && !o.preso && d(o.x, o.y) < 52) return true;
  if (st.tipo === 'patto') {
    if ((st.slotPatto || []).some((sl) => !sl.comprato && d(sl.x, sl.y) < 44)) return true;
    if (d(320, 252) < 46) return true;
  }
  if (st.tipo === 'fucina' && (st.slotFucina || []).some((sl) => !sl.comprato && d(sl.x, sl.y) < 42)) return true;
  if (st.tipo === 'boss' && ((st.portaPattoAperta && d(430, 190) < 42) || st.uscitaAperta)) return true;
  return interazioniVicineA1.some((fn) => { try { return Boolean(fn(st, player)); } catch (_) { return false; } });
}

// ===========================================================================
// AGGANCI (funzioni globali avvolte)
// ===========================================================================
const origGeneraMappaA1 = generaMappaPiano;
generaMappaPiano = function (piano, ...resto) {
  return applicaLucchettiA1(origGeneraMappaA1.call(this, piano, ...resto), piano);
};

const origAvviaPianoA1 = avviaPiano;
avviaPiano = function (...args) {
  if (inventarioRunA1 !== statoRun.numeroRun) preparaInventarioA1();
  statoRun.bombeA1 = [];
  const r = origAvviaPianoA1.apply(this, args);
  garantisciChiaveA1(statoRun.mappa);
  return r;
};

const origEntraInStanzaA1 = entraInStanza;
entraInStanza = function (stanza, daLato, ...resto) {
  const da = statoRun.stanzaCorrente;
  if (stanza && stanza.chiusaA1) {
    const lato = latoVersoA1(da, stanza.id);
    if (daLato != null && lato && statoRun.fase === 'in_gioco') {
      if ((statoRun.chiavi || 0) <= 0) {
        respingiDallaPortaA1(lato);
        avvisoA1('🔒 La porta è chiusa a chiave: serve una chiave 🗝');
        return undefined;
      }
      aggiungiChiavi(-1);
      AudioSys.playMoneta();
      scuoti(FEEL.scossa.colpo);
      mostraBanner('🗝 Lucchetto aperto!', 110);
    }
    stanza.chiusaA1 = false; // aperta con la chiave, o raggiunta da un pulsante di prova
  }
  statoRun.bombeA1 = [];
  return origEntraInStanzaA1.call(this, stanza, daLato, ...resto);
};

const origVerificaPulitaA1 = verificaStanzaPulita;
verificaStanzaPulita = function (...args) {
  const st = statoRun.stanzaCorrente;
  const prima = Boolean(st && st.pulita);
  const r = origVerificaPulitaA1.apply(this, args);
  if (st && !prima && st.pulita && st.tipo === 'normale') dropPuliziaA1(st);
  return r;
};

const origInteragisciA1 = interagisciStanza;
interagisciStanza = function (...args) {
  if (statoRun.scambioPendente || statoRun.pannelloB || statoRun.siparioAttivo) return origInteragisciA1.apply(this, args);
  if (statoRun.fase !== 'in_gioco' || interazioneVicinaA1(statoRun.stanzaCorrente)) return origInteragisciA1.apply(this, args);
  piazzaBombaA1();
  return undefined;
};

const origPassoLogicoA1 = passoLogico;
passoLogico = function (...args) {
  // stesse condizioni del passo originale: niente bombe durante hit-stop, pause, pannelli, hub e morte
  const congelato = ticksCongelati > 0;
  const r = origPassoLogicoA1.apply(this, args);
  const st = statoRun.stanzaCorrente;
  const inPausa = Boolean(statoRun.scambioPendente || statoRun.pannelloB || statoRun.siparioAttivo || statoRun.pausa);
  if (!congelato && !inPausa && st && statoRun.fase === 'in_gioco' && statoRun.hpHalf > 0) {
    raccoltaA1(st);
    aggiornaBombeA1(st);
  }
  return r;
};

const origDisegnaStanzaA1 = disegnaStanzaPixelArt;
disegnaStanzaPixelArt = function (t, st, ...resto) {
  const r = origDisegnaStanzaA1.call(this, t, st, ...resto);
  if (st && statoRun.fase === 'in_gioco') disegnaA1(t, st);
  return r;
};

// ===========================================================================
// ESPOSIZIONE (altre squadre e QA)
// ===========================================================================
if (window.__teatro && !Object.isFrozen(window.__teatro)) {
  Object.assign(window.__teatro.interni, {
    BOMBE_CHIAVI_A1, aggiungiChiavi, aggiungiBombe, generaForziere,
    piazzaBombaA1, esplodiBombaA1, apriForziereA1, applicaLucchettiA1, garantisciChiaveA1, percorsoBossA1,
    interazioniVicineA1, testoInventarioA1,
    // le versioni avvolte sostituiscono quelle catturate da 80-ciclo.js (superinsieme: stessi effetti + A1)
    avviaPiano, entraInStanza,
    entraInStanzaA1: entraInStanza, verificaStanzaPulitaA1: verificaStanzaPulita, interagisciStanzaA1: interagisciStanza,
  });
}
