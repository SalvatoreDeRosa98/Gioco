/**
 * motore/mondo/segreta.js — La Stanza Segreta e la Crepa Dorata (storia P04/P09; Teatro apriMuroSegreto ~3089,
 * verificaStanzaPulita ~3700, popolaStanzaIsaac 'segreta' ~3290).
 *
 * Il generatore (storia 016) posa una segreta per piano con una `finestra` nelle stanze confinanti (regola 12, H6). Qui la
 * finestra diventa la CREPA DORATA del Teatro: a stanza `pulita`, la finestra verso la segreta è visibile (`crepa()`) e si
 * apre quando un proiettile di Ferruccio la colpisce (`ferruccio.colpo_muro` con solido `finestra`, emesso dal
 * combattimento) o quando il settore del fendente la tocca. Aprire = la finestra diventa porta su entrambi i record della
 * pianta (`porte[slot] = segreta`, `segreta.porte[opposto] = stanza`), la stanza è rimontata senza muovere Ferruccio
 * (`notte.vaiA` + `posiziona`), evento `segreta.aperta` {stanza, segreta, slot}. Storia P15 (Teatro `innescaEsplosioneBomba`
 * ~3604): anche l'**esplosione della Bomba Ferma** (`nemico.esplosione` {x, y, rCrepa}) apre la crepa se il suo centro è
 * entro `rCrepa` dal rettangolo della finestra; se la stanza sta ancora combattendo (porte chiuse) l'apertura resta `inAttesa`
 * e scatta al primo tick in cui la stanza è pulita. La segreta COMBATTE (storia P15, `TIPI_COMBATTIMENTO` di stanza.js: una
 * ondata di predoni dorati, `stanze.segreta`) e, alla sua prima pulizia, lascia a terra `economia.monete_segreta` monete
 * piccole attorno al centro come fa il Teatro (`verificaStanzaPulita` ~3718: `spawnaMonetaATerra(st, 320, 165, 3)` oltre al
 * bottino dorato dei predoni).
 * Nessun numero e nessuna stringa di gioco; nessuna casualità. Dipendenze verso il basso (notte, combattimento, economia).
 */

import { LATO_OPPOSTO } from './modelli.js';
import { settoreColpisceCerchio } from './fisica.js';

/** Id del solido della finestra (stanza.js) e tipo della segreta. */
export const ID_FINESTRA = 'finestra';
export const TIPO_SEGRETA = 'segreta';

/**
 * @param {{
 *   eventi: { on: Function, emit: Function },
 *   notte: () => ({ stanza: object | null, pianta: object, vaiA: Function } | null),
 *   combattimento: { proiettiliFerruccio: () => object[], hitboxCorrente: () => object | null },
 *   ferruccio: { x: number, y: number, posiziona: Function },
 *   parametri: { get: Function },
 *   economia?: { lascia: Function } | null
 * }} o
 */
export function creaSegreta({ eventi, notte, combattimento, ferruccio, parametri, economia = null }) {
  if (!eventi || typeof notte !== 'function' || !combattimento || !ferruccio || !parametri) throw new TypeError('creaSegreta: dipendenze mancanti');
  const aperte = new Set();      // id delle stanze la cui crepa è aperta
  const pagate = new Set();      // segrete che hanno già lasciato le monete
  let inAttesa = null;           // storia P15: stanza in cui un'esplosione ha raggiunto la crepa durante il combattimento

  /** La crepa della stanza corrente, o null: {slot, lato, rett, x, y, aperta}. */
  function crepa() {
    const n = notte();
    const st = n?.stanza;
    if (!st || st.record.tipo === TIPO_SEGRETA) return null;
    const seg = n.pianta?.stanze?.find((s) => s.tipo === TIPO_SEGRETA);
    if (!seg) return null;
    const giaAperta = Object.values(st.record.porte ?? {}).includes(seg.id);
    const f = st.finestre?.[0] ?? null;
    if (giaAperta) {
      const slot = Object.entries(st.record.porte).find(([, v]) => v === seg.id)?.[0] ?? null;
      const porta = st.porte.find((p) => p.slot === slot) ?? null;
      return { slot, lato: porta?.lato ?? null, rett: porta?.rett ?? null, x: porta?.centro?.x ?? 0, y: porta?.centro?.y ?? 0, aperta: true, visibile: false };
    }
    if (!f) return null;
    return {
      slot: f.slot, lato: f.lato, rett: { x: f.x, y: f.y, w: f.w, h: f.h }, x: f.x + f.w / 2, y: f.y + f.h / 2, aperta: false,
      visibile: st.stato === 'pulita',
    };
  }

  /** Apre la crepa della stanza corrente (se c'è e la stanza è pulita). */
  function apri() {
    const n = notte();
    const st = n?.stanza;
    const c = crepa();
    if (!st || !c || c.aperta || st.stato !== 'pulita') return false;
    const seg = n.pianta.stanze.find((s) => s.tipo === TIPO_SEGRETA);
    const record = st.record;
    record.porte = { ...(record.porte ?? {}), [c.slot]: seg.id };
    record.finestre = (record.finestre ?? []).filter((s) => s !== c.slot);
    const slotSeg = (seg.finestre ?? []).find((s) => s === LATO_OPPOSTO[c.lato]) ?? (seg.finestre ?? [])[0] ?? LATO_OPPOSTO[c.lato];
    seg.porte = { ...(seg.porte ?? {}), [slotSeg]: record.id };
    seg.finestre = (seg.finestre ?? []).filter((s) => s !== slotSeg);
    aperte.add(record.id);
    const { x, y } = ferruccio;
    n.vaiA(record.id);
    ferruccio.posiziona(x, y);
    eventi.emit('segreta.aperta', { stanza: record.id, segreta: seg.id, slot: c.slot, lato: c.lato });
    return true;
  }

  const dentroRett = (px, py, r, rett) => px + r >= rett.x && px - r <= rett.x + rett.w && py + r >= rett.y && py - r <= rett.y + rett.h;

  /** Distanza di un punto dal rettangolo (0 se dentro). */
  const distanzaRett = (px, py, rett) => Math.hypot(Math.max(rett.x - px, 0, px - (rett.x + rett.w)), Math.max(rett.y - py, 0, py - (rett.y + rett.h)));

  /** Un tick: proiettili di Ferruccio o fendente sulla crepa visibile la aprono; un'esplosione in attesa la apre appena la stanza è pulita. */
  function tick() {
    const c = crepa();
    if (!c || c.aperta) { inAttesa = null; return; }
    if (inAttesa !== null) {
      if (notte()?.stanza?.id !== inAttesa) inAttesa = null; // cambiata stanza: l'esplosione non vale più
      else if (c.visibile && apri()) { inAttesa = null; return; }
    }
    if (!c.visibile) return;
    for (const p of combattimento.proiettiliFerruccio()) {
      if (dentroRett(p.x, p.y, p.r ?? 0, c.rett)) { apri(); return; }
    }
    const h = combattimento.hitboxCorrente?.();
    if (h?.tipo === 'settore' && settoreColpisceCerchio(h, { x: c.x, y: c.y, r: Math.min(c.rett.w, c.rett.h) / 2 })) apri();
  }

  eventi.on('ferruccio.colpo_muro', (p) => {
    if (p?.solido?.id === ID_FINESTRA) { const c = crepa(); if (c && !c.aperta && c.visibile) apri(); }
  });
  // storia P15: l'esplosione della Bomba Ferma (Teatro innescaEsplosioneBomba) apre la crepa se la raggiunge (entro `rCrepa`
  // dal rettangolo della finestra); se la stanza sta ancora combattendo, l'apertura aspetta `pulita` (le porte sono chiuse)
  eventi.on('nemico.esplosione', (p) => {
    const c = crepa();
    const st = notte()?.stanza;
    if (!p || !c || c.aperta || !st || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    const raggio = p.rCrepa ?? p.rNemici ?? 0;
    if (distanzaRett(p.x, p.y, c.rett) > raggio) return;
    if (c.visibile) apri(); else inAttesa = st.id;
  });
  // la segreta ripulita lascia le monete del Teatro (una volta per segreta)
  eventi.on('stanza.pulita', (p) => {
    const st = notte()?.stanza;
    if (!p || p.tipo !== TIPO_SEGRETA || !st || st.id !== p.id || pagate.has(p.id) || !economia) return;
    pagate.add(p.id);
    const n = parametri.get('economia.monete_segreta');
    const v = parametri.get('economia.v_moneta_piccola');
    const cx = st.origine.x + (st.geo.colonne * st.cella) / 2;
    const cy = st.origine.y + (st.geo.righe * st.cella) / 2;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      economia.lascia(p.id, { tipo: 'moneta', valore: v, x: cx + Math.cos(a) * st.cella * 0.6, y: cy + Math.sin(a) * st.cella * 0.6 });
    }
    eventi.emit('segreta.monete', { stanza: p.id, n, valore: v });
  });

  return {
    crepa, apri, tick,
    get aperte() { return Array.from(aperte); },
    /** Storia P15: id della stanza in cui un'esplosione ha raggiunto la crepa e aspetta `pulita`, o null. */
    get inAttesa() { return inAttesa; },
    /** Nuovo piano o nuova run. */
    nuovoPiano() { aperte.clear(); pagate.clear(); inAttesa = null; },
  };
}
