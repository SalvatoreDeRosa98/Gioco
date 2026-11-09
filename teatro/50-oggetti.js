/*
 * teatro/50-oggetti.js — Oggetti attivi, pool della run, estrazioni, effetti, conoscenza degli oggetti e diario.
 * Script classico (niente moduli ES): le dichiarazioni di primo livello stanno nello scope globale
 * condiviso con gli altri file di teatro/. Ordine di caricamento e regole: teatro/LEGGIMI.md.
 */

/** Oggetto del catalogo per id (null se non c'è). */
function trovaOggettoB(id) {
  return CATALOGO_OGGETTI.find((o) => o.id === id) || null;
}

/** Ricompensa «cuore» dopo il cap: rigenera OGGETTI_B.dopoCap.curaCuoreHalf mezze maschere, non occupa l'HUD. */
function creaCuoreB() {
  return {
    id: 'cuore_cera_b', sprite: 'cuore', nome: 'Cuore di Cera', tier: 'cura', cuoreB: true,
    statsDesc: `Rigenera +${OGGETTI_B.dopoCap.curaCuoreHalf / 2} ❤️ Maschera`,
    lore: 'Il pool della notte è esaurito: il Teatro ti offre un po\' di vita.',
    prezzo: ECONOMIA_T3.prezzi.cuore, mod: {},
  };
}

/**
 * Estrae il pool della run: OGGETTI_B.dimensionePool oggetti diversi del catalogo, escluso il dono iniziale.
 * @param {string|null} escludiId id del passivo iniziale del personaggio
 */

function inizializzaPoolRunB(escludiId) {
  // --- D: inizio --- pool pesato: round(20 × pesoNegativi) = 3 negativi, il resto positivi/misti
  const candD = CATALOGO_OGGETTI.filter((o) => o.id !== escludiId);
  const negD = shuffle(candD.filter((o) => o.polarita === 'negativo')).slice(0, Math.round(OGGETTI_B.dimensionePool * OGGETTI_D.pool.pesoNegativi));
  const posD = shuffle(candD.filter((o) => o.polarita !== 'negativo')).slice(0, OGGETTI_B.dimensionePool - negD.length);
  const scelti = posD.concat(negD);
  // --- D: fine ---
  statoRun.poolRunB = { ids: scelti.map((o) => o.id), rimasti: scelti.map((o) => o.id), estrazioni: 0 };
}

/**
 * Una ricompensa dal pool della run. Finché restano oggetti non usciti ne esce uno (del tier chiesto se
 * c'è, altrimenti di qualunque tier) e non esce più; a pool esaurito: Cuore di Cera con probabilità
 * OGGETTI_B.dopoCap.probCuore, altrimenti uno dei 20 a caso (anche già preso).
 * @param {'base'|'forte'} tier
 */

function estraiDaPoolRunB(tier) {
  if (!statoRun.poolRunB) inizializzaPoolRunB(null);
  const P = statoRun.poolRunB;
  P.estrazioni++;
  // --- D: inizio --- le ricompense normali non pescano mai i negativi (escono solo come trappole, vedi D)
  const rimastiD = P.rimasti.filter((id) => trovaOggettoB(id)?.polarita !== 'negativo');
  if (rimastiD.length) {
    const delTier = rimastiD.filter((id) => trovaOggettoB(id)?.tier === tier);
    const lista = delTier.length ? delTier : rimastiD;
    // --- D: fine ---
    const id = lista[Math.floor(rng() * lista.length)];
    P.rimasti.splice(P.rimasti.indexOf(id), 1);
    return { ...trovaOggettoB(id) };
  }
  if (rng() < OGGETTI_B.dopoCap.probCuore) return creaCuoreB();
  const idsD = P.ids.filter((id) => trovaOggettoB(id)?.polarita !== 'negativo'); // --- D ---
  return { ...trovaOggettoB(idsD[Math.floor(rng() * idsD.length)]) };
}

/**
 * Versione da equipaggiare: l'oggetto com'è se è nuovo; se lo hai già, un doppione che somma solo le voci
 * additive (OGGETTI_B.stack) o, se non ne ha, il bonus generico.
 */

function versioneStackB(item) {
  const copie = statoRun.oggettiEquipaggiati.filter((o) => o && o.id === item.id).length;
  if (!copie) return item;
  const S = OGGETTI_B.stack;
  const mod = {};
  for (const k of S.chiaviSommabili) if (item.mod && item.mod[k]) mod[k] = item.mod[k] * S.fattore;
  const generico = !Object.keys(mod).length;
  return {
    ...item, doppioneB: copie + 1, mod: generico ? { ...S.bonusGenerico } : mod,
    statsDesc: `[DOPPIONE ×${copie + 1}] ${generico ? S.descGenerico : 'si sommano le statistiche additive'}`,
  };
}

// Usa l'Oggetto Attivo [Q] (Proposta 5)
function usaOggettoAttivo() {
  // --- B: inizio ---
  if (statoRun.scambioPendente || statoRun.pannelloB || statoRun.siparioAttivo) return;
  const att = statoRun.oggettoAttivo;
  // --- B: fine ---
  if (!att) return;
  if (statoRun.caricaAttivo < att.maxCarica) {
    mostraBanner(`⚡ ${att.nome}: carica ${statoRun.caricaAttivo}/${att.maxCarica} (pulisci stanze per ricaricare!)`, 130);
    return;
  }
  const st = statoRun.stanzaCorrente;
  statoRun.caricaAttivo = 0;
  scuoti(FEEL.scossa.evento);

  if (att.id === 'forbici') {
    statoRun.ondeEsplosione.push({ x: player.x, y: player.y, r: 8, maxR: 180, color: '#67e8f9' });
    if (st) {
      for (const n of st.nemici) {
        if (n.hp > 0) {
          n.stunTicks = 120; // 2 secondi immobilizzato coi fili tagliati (era 4 s: troppo lungo, autore 2026-11-09)
          danneggiaNemico(n, statoRun.dmg * 1.4, 0, 0);
        }
      }
    }
    mostraBanner('✂️ FORBICI DI GAETANO! Fili d\'oro recisi: tutti i nemici sono immobilizzati per 2s!', 180);
  } else if (att.id === 'tamburello') {
    statoRun.ondeEsplosione.push({ x: player.x, y: player.y, r: 8, maxR: 160, color: '#f9cb40' });
    statoRun.proiettiliNemici = [];
    if (st) {
      for (const n of st.nemici) {
        if (n.hp > 0) {
          const a = Math.atan2(n.y - player.y, n.x - player.x);
          danneggiaNemico(n, statoRun.dmg * 0.9, Math.cos(a) * 4, Math.sin(a) * 4);
        }
      }
    }
    mostraBanner('🥁 TAMBURELLO DI PIAZZA DANTE! Onda sonora: proiettili spazzati via e mostri respinti!', 180);
  } else if (att.id === 'ampolla') {
    statoRun.ondeEsplosione.push({ x: player.x, y: player.y, r: 8, maxR: 90, color: '#ef4444' });
    statoRun.hpHalf = Math.min(statoRun.maxHpHalf, statoRun.hpHalf + 2);
    mostraBanner('🩸 AMPOLLA DI SAN GENNARO! Rigenerata +1 ❤️ Maschera intera!', 180);
  }
}

function acquisisciOggettoConLimite5Slot(nuovoItem, origine, refSlot) {
  if (origine === 'patto' && refSlot) {
    const costo = refSlot.costoMaxHpHalf || 2;
    if (statoRun.maxHpHalf <= costo && statoRun.hpHalf <= costo) {
      mostraBanner('⚠ Non hai abbastanza Maschere Massime per stringere questo Patto d\'Ombra!', 160);
      return;
    }
    // --- T3: inizio ---
    if (window.__teatroT3?.chiediConfermaPatto?.(nuovoItem, refSlot)) return; // «−1 maschera massima per sempre»
    // --- T3: fine ---
  }

  // --- B: inizio --- (oggetti infiniti: niente limite di 5 slot né modale di sostituzione)
  if (nuovoItem.cuoreB) {
    if (statoRun.hpHalf >= statoRun.maxHpHalf) {
      mostraBanner('Hai già tutte le Maschere piene: il Cuore di Cera resta qui.', 120);
      return;
    }
    statoRun.hpHalf = Math.min(statoRun.maxHpHalf, statoRun.hpHalf + OGGETTI_B.dopoCap.curaCuoreHalf);
  } else {
    statoRun.oggettiEquipaggiati.push(versioneStackB(nuovoItem));
  }
  if (origine === 'piedistallo' && refSlot) refSlot.preso = true;
  if (origine === 'fucina' && refSlot) {
    statoRun.monete -= refSlot.prezzo;
    refSlot.comprato = true;
  }
  if (origine === 'patto' && refSlot) {
    statoRun.baseMaxHpHalf = Math.max(2, statoRun.baseMaxHpHalf - (refSlot.costoMaxHpHalf || 2));
    refSlot.comprato = true;
  }
  if (nuovoItem.cuoreB) {
    mostraBanner(`❤ ${nuovoItem.nome}: ${nuovoItem.statsDesc}`, 160);
    return;
  }
  ricalcolaStatisticheIsaac();
  dopoRaccoltaD(nuovoItem); // --- D ---
  if (nuovoItem.mod?.healOnEquip) {
    statoRun.hpHalf = Math.min(statoRun.maxHpHalf, statoRun.hpHalf + nuovoItem.mod.healOnEquip);
  }
  player.pickupTimer = 55;
  player.pickupItem = nuovoItem;
  const ultimo = statoRun.oggettiEquipaggiati[statoRun.oggettiEquipaggiati.length - 1];
  mostraBanner(`★ ${nuovoItem.nome} [${statoRun.oggettiEquipaggiati.length} oggetti]: ${ultimo.statsDesc}`, 210);
  // --- B: fine ---
}

// --- B: inizio --- (base e forti pescano dal pool di 20 della run, vedi estraiDaPoolRunB)
function estraiOggettoBase() {
  return estraiDaPoolRunB('base');
}

function estraiOggettoForte() {
  return estraiDaPoolRunB('forte');
}
// --- B: fine ---

function estraiOggettoPatto() {
  if (!statoRun.poolPatto.length) {
    statoRun.poolPatto = shuffle(CATALOGO_PATTO);
  }
  return { ...statoRun.poolPatto.pop() };
}

function tiraOggettoGratisStanza(garantito = false) {
  // --- D: dono ingannevole: un negativo ancora sconosciuto del pool sul piedistallo, prob. 0.5 ---
  if (garantito) { const ing = estraiNegativoD(OGGETTI_D.pool.probDonoIngannevole); if (ing) return { ...ing, forteGratis: false }; }
  const roll = rng();
  if (roll < 0.10 + effettiNotteC().bonusForte) { // C: notte 5+ ricompense un po' migliori
    // --- B: inizio --- (a pool esaurito di forti può uscire un base o un cuore: l'etichetta segue l'oggetto)
    const o = estraiOggettoForte();
    return { ...o, forteGratis: o.tier === 'forte' };
    // --- B: fine ---
  }
  if (garantito || roll < 0.10 + (1 / 3)) {
    return { ...estraiOggettoBase(), forteGratis: false };
  }
  return null;
}

// --- C: inizio ---
/**
 * Un colpo (lacrima, fendente, impulso del raggio) sul muro giusto: al STANZE_C.segreta.colpiMuro-esimo
 * il passaggio si apre. Nessun avviso: solo un po' di polvere sul muro.
 * @param {object} st stanza corrente @param {number} x @param {number} y punto d'impatto
 */

/** Id degli oggetti conosciuti nello slot di salvataggio (flag oggettiConosciuti); senza T3, in memoria. */
const conosciutiMemoriaD = [];

function conosciutiD() {
  const sv = window.__teatroT3 && window.__teatroT3.salvataggi;
  if (!sv) return conosciutiMemoriaD;
  const v = sv.leggiFlag('oggettiConosciuti');
  return Array.isArray(v) ? v : [];
}

function conosciutoD(id) { return conosciutiD().includes(id); }

/**
 * Un negativo SCONOSCIUTO ancora nel pool della run, con probabilità `prob` (dono ingannevole o banco della
 * Fucina). I negativi conosciuti non escono più (§5 Economia: «si ripesca»). null se non esce.
 */

function estraiNegativoD(prob) {
  const P = statoRun.poolRunB;
  if (!P) return null;
  const lista = P.rimasti.filter((id) => trovaOggettoB(id)?.polarita === 'negativo' && !conosciutoD(id));
  if (!lista.length || rng() >= prob) return null;
  const id = lista[Math.floor(rng() * lista.length)];
  P.rimasti.splice(P.rimasti.indexOf(id), 1);
  return { ...trovaOggettoB(id) };
}

/** Segna l'oggetto come conosciuto nello slot. true se è la prima volta. */
function segnaConosciutoD(id) {
  if (!trovaOggettoB(id) || conosciutoD(id)) return false;
  const lista = conosciutiD().concat([id]);
  const sv = window.__teatroT3 && window.__teatroT3.salvataggi;
  if (sv) sv.impostaFlag('oggettiConosciuti', lista);
  else conosciutiMemoriaD.push(id);
  return true;
}

/** L'effetto di `o` si vede? Solo se conosciuto e senza la Benedizione del Cieco (che vale per il piano). */
function effettoVisibileD(o) { return Boolean(o) && conosciutoD(o.id) && !maledizioneD('cieco'); }

/** Descrizione come la vede il giocatore: «Effetto: ???» finché non lo raccoglie. */
function descD(o) { return effettoVisibileD(o) ? o.statsDesc : 'Effetto: ???'; }

/** Nome come lo vede il giocatore (con la Benda del Cieco: «???»). */
function nomeD(o) { return maledizioneD('cieco') ? '???' : o.nome; }

/** Lore visibile solo a effetto noto. */
function loreD(o) { return effettoVisibileD(o) ? (o.lore || '') : 'Lo scoprirai solo raccogliendolo.'; }

const sagomeD = new Map();

/** Sprite di `o`; sagoma scura con la Benda del Cieco o se `sagoma` (colore della palette `col`). */
function spriteD(o, sagoma = false, col = 'D') {
  const g = SPRITE_OGGETTI[o.sprite] || SPRITE_OGGETTI.spada;
  if (!sagoma && !maledizioneD('cieco')) return g;
  const k = o.sprite + col;
  if (!sagomeD.has(k)) sagomeD.set(k, g.map((r) => r.replace(/[^.]/g, col)));
  return sagomeD.get(k);
}

// Diario degli oggetti (menu ESC dell'autore): griglia di tutto il catalogo, conosciuti a colori.
function apriDiarioD() { statoRun.diarioD = { sel: 0 }; }

function cellaDiarioD(i) {
  const G = OGGETTI_D.diario;
  const x0 = Math.round((W - G.colonne * G.cellaL) / 2);
  return { x: x0 + (i % G.colonne) * G.cellaL, y: 46 + Math.floor(i / G.colonne) * G.cellaA, w: G.cellaL - 4, h: G.cellaA - 3 };
}

/** Tasti del Diario: frecce/WASD muovono, Esc/O/Invio chiudono (si torna al menu ESC). */
function tastoDiarioD(code) {
  const d = statoRun.diarioD;
  const n = CATALOGO_OGGETTI.length;
  const C = OGGETTI_D.diario.colonne;
  if (['ArrowLeft', 'KeyA'].includes(code)) d.sel = (d.sel - 1 + n) % n;
  else if (['ArrowRight', 'KeyD'].includes(code)) d.sel = (d.sel + 1) % n;
  else if (['ArrowUp', 'KeyW'].includes(code)) d.sel = (d.sel - C + n * C) % n;
  else if (['ArrowDown', 'KeyS'].includes(code)) d.sel = (d.sel + C) % n;
  else if (['Escape', 'KeyO', 'Enter', 'Space'].includes(code)) statoRun.diarioD = null;
}

/** Click nel Diario: una cella la seleziona; fuori dalla griglia chiude. */
function clickDiarioD(mx, my) {
  for (let i = 0; i < CATALOGO_OGGETTI.length; i++) {
    const c = cellaDiarioD(i);
    if (mx >= c.x && mx <= c.x + c.w && my >= c.y && my <= c.y + c.h) { statoRun.diarioD.sel = i; return; }
  }
  if (my < 30 || my > H - 20) statoRun.diarioD = null;
}

/** Dopo ogni raccolta di un oggetto del catalogo: conosciuto (cartiglio al primo), maledizioni (fino a fine piano). */
function dopoRaccoltaD(item) {
  const base = trovaOggettoB(item.id);
  if (base && segnaConosciutoD(base.id)) statoRun.cartiglioD = { item: base, t0: tick };
  const m = base && base.mod;
  if (m && m.maledizione) {
    statoRun.maledizioniD = statoRun.maledizioniD || {};
    statoRun.maledizioniD[m.maledizione] = statoRun.piano;
  }
}
// --- D: fine ---
