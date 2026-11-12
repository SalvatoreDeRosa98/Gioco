/*
 * teatro/000-errori.js — Rete di sicurezza: raccoglie gli errori e li mostra a schermo (primo file caricato).
 * Script classico: le dichiarazioni di primo livello stanno nello scope globale condiviso (vedi teatro/LEGGIMI.md).
 *
 * Perché esiste: un errore in un fotogramma fermava il gioco senza dire niente (schermo fermo). Ora:
 *  - ogni errore (di caricamento, di logica, di disegno) finisce in ERRORI_TEATRO e in un riquadro in basso,
 *    con il testo da copiare e mandare a chi sviluppa;
 *  - il ciclo di gioco (80-ciclo.js) chiama segnalaErroreTeatro() e va avanti col fotogramma dopo;
 *  - se il disegno sbaglia più volte di fila, fusibileScenaTeatro() spegne uno alla volta gli effetti di scena
 *    (ombre lunghe, grana, vignetta, pubblico) solo per questa sessione, per provare a far ripartire il palco.
 */

/** Numeri della rete di sicurezza. */
const RETE_ERRORI = Object.freeze({
  massimoInLista: 12,          // errori diversi tenuti in memoria
  righeTraccia: 7,             // righe della traccia mostrate per errore
  disegniDiFilaPerFusibile: 3, // errori di disegno consecutivi prima di spegnere un effetto
  effettiDaSpegnere: Object.freeze(['ombre', 'grana', 'vignetta', 'pubblico', 'lampi']),
});

/** Errori raccolti in questa sessione: { dove, testo, traccia, volte }. */
const ERRORI_TEATRO = [];

/**
 * Note di diagnosi: cose strane che il gioco ha rimediato da solo (un danno non numerico, una stanza del boss rimasta
 * chiusa senza nessuno in piedi). Non si mostrano al giocatore: finiscono nel file di diagnosi (tasto F8).
 */
const NOTE_DIAGNOSI = [];
const DIAGNOSI = Object.freeze({ massimoNote: 40, tasto: 'F8', ultimeNotti: 3 });
function notaDiagnosi(cosa, dati) {
  try {
    if (NOTE_DIAGNOSI.length >= DIAGNOSI.massimoNote) return;
    NOTE_DIAGNOSI.push({ cosa, dati: dati === undefined ? null : dati, tick: typeof tick === 'number' ? tick : null });
    try { console.warn('[Teatro] nota di diagnosi:', cosa, dati); } catch (_) {}
  } catch (_) { /* mai un errore da qui */ }
}

/**
 * Fotografia dello stato del gioco per chi lo prova: notte, piano, personaggio, vita, oggetti, la stanza coi suoi nemici,
 * le scelte dello slot, gli errori e le note. Serve all'autore per capire «che cosa era successo».
 * @returns {object}
 */
function diagnosiTeatro() {
  const prova = (f, ripiego = null) => { try { const v = f(); return v === undefined ? ripiego : v; } catch (_) { return ripiego; } };
  const R = prova(() => statoRun, {}) || {};
  const st = R.stanzaCorrente || null;
  const num = (v) => (typeof v === 'number' ? (Number.isFinite(v) ? Math.round(v * 100) / 100 : String(v)) : v === undefined ? null : v);
  return {
    quando: new Date().toISOString(),
    versione: prova(() => window.__teatroVersione, null) || `pagina del ${document.lastModified}`,
    schermo: `${window.innerWidth}×${window.innerHeight}`, browser: navigator.userAgent,
    fase: R.fase, notte: prova(() => getNumeroNotte()), piano: R.piano, ciclo: R.ciclo, run: R.numeroRun,
    personaggio: R.personaggioId || null,
    vita: [num(R.hpHalf), num(R.maxHpHalf)], danno: num(R.dmg), colpiAlSecondo: num(R.colpiAlSec), passo: num(R.speed),
    monete: R.monete, chiavi: R.chiavi, bombe: R.bombe, viteExtra: R.viteExtra,
    oggetti: prova(() => R.oggettiEquipaggiati.map((o) => o.id), []), attivo: prova(() => R.oggettoAttivo && R.oggettoAttivo.id),
    pausa: Boolean(R.pausa), sipario: prova(() => R.siparioAttivo && R.siparioAttivo.titolo), banner: R.banner || null,
    dialogoAperto: prova(() => Boolean(window.__teatro.t4qa.dialogo), null), zonaP3: R.zonaP3 || null,
    stanza: st && {
      id: st.id, tipo: st.tipo, pulita: Boolean(st.pulita), uscitaAperta: Boolean(st.uscitaAperta),
      campi: Object.keys(st).filter((k) => /[A-Z][0-9]$/.test(k)),
      nemici: (st.nemici || []).map((n) => ({ tipo: n.tipo, boss: Boolean(n.boss), bossId: n.bossId || null, vita: num(n.hp), vitaMax: num(n.maxHp),
        x: num(n.x), y: num(n.y), quota: num(n.airZ || 0), stato: n.state || n.statoD6 || n.statoH3 || n.statoH6 || n.statoH7 || null })),
      oggettiATerra: (st.oggettiATerra || []).length, proiettiliNemici: prova(() => R.proiettiliNemici.length), colpiMiei: prova(() => R.proiettili.length),
    },
    mappa: prova(() => R.mappa.stanze.map((s) => `${s.tipo}${s.pulita ? '✓' : ''}${s === st ? '←' : ''}`).join(' ')),
    scelte: prova(() => window.__teatro.t4qa.flag, null),
    bottega: prova(() => { const s = statoB8(); return { ferri: s.ferri, finaleVisto: s.finaleVisto, portaAperta: s.portaAperta, senzaFine: s.senzaFine }; }),
    ultimeNotti: prova(() => window.__teatro.interni.registroRun().slice(-DIAGNOSI.ultimeNotti), []),
    errori: ERRORI_TEATRO.slice(), note: NOTE_DIAGNOSI.slice(),
  };
}

/** Salva la diagnosi in un file (e la copia negli appunti, se il browser lo permette). */
function salvaDiagnosiTeatro() {
  try {
    const testo = JSON.stringify(diagnosiTeatro(), null, 1);
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(testo).catch(() => {}); } catch (_) {}
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([testo], { type: 'application/json' }));
    a.download = `diagnosi-teatro-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => { try { URL.revokeObjectURL(a.href); } catch (_) {} }, 4000);
    try { if (typeof mostraBanner === 'function') mostraBanner('Diagnosi salvata in un file: mandalo a chi ha fatto il gioco.', 260); } catch (_) {}
    return true;
  } catch (err) { try { console.error('[Teatro] diagnosi', err); } catch (_) {} return false; }
}
// in cattura: vale anche quando un menu o un cartiglio si prende i tasti
window.addEventListener('keydown', (e) => { if (e.code === DIAGNOSI.tasto && !e.repeat) { e.preventDefault(); salvaDiagnosiTeatro(); } }, true);
let disegniFallitiDiFila = 0;
let effettiSpentiDalFusibile = 0;
let riquadroErrori = null;
let riquadroChiuso = false;

/** Testo completo degli errori, per copiarlo o fotografarlo. */
function testoErroriTeatro() {
  const righe = ['Ferruccio — Teatro delle Marionette: errore'];
  for (const e of ERRORI_TEATRO) {
    righe.push(`[${e.dove}] ${e.testo}${e.volte > 1 ? ` (×${e.volte})` : ''}`);
    if (e.traccia) righe.push(e.traccia);
  }
  let pad = 0;
  try { pad = Array.from(navigator.getGamepads ? navigator.getGamepads() : []).filter(Boolean).length; } catch (_) { pad = -1; }
  let chiavi = -1;
  try { chiavi = Object.keys(localStorage).filter((k) => k.indexOf('ferruccio') === 0).length; } catch (_) { chiavi = -1; }
  righe.push(`browser: ${navigator.userAgent}`);
  righe.push(`finestra: ${window.innerWidth}×${window.innerHeight} · dpr ${window.devicePixelRatio} · gamepad ${pad} · salvataggi ${chiavi}`
    + (effettiSpentiDalFusibile ? ` · effetti spenti ${effettiSpentiDalFusibile}` : ''));
  return righe.join('\n');
}

function aggiornaRiquadroErrori() {
  if (riquadroChiuso || typeof document === 'undefined' || !document.body) return;
  if (!riquadroErrori) {
    riquadroErrori = document.createElement('div');
    riquadroErrori.id = 'errori-teatro';
    riquadroErrori.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;z-index:9999;max-height:46vh;overflow:auto;'
      + 'background:rgba(20,8,6,0.96);color:#f5e6c8;border:2px solid #f9cb40;border-radius:6px;padding:10px 12px;'
      + 'font:12px/1.45 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap;user-select:text;';
    const barra = document.createElement('div');
    barra.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:6px;font-weight:bold;color:#f9cb40;';
    const titolo = document.createElement('span');
    titolo.textContent = 'Qualcosa è andato storto. Fai una foto a questo riquadro (o premi «Copia») e mandalo a chi sviluppa il gioco.';
    titolo.style.flex = '1';
    const stile = 'background:#63150d;color:#fff;border:1px solid #f9cb40;border-radius:4px;padding:3px 10px;cursor:pointer;font:inherit;';
    const copia = document.createElement('button');
    copia.textContent = 'Copia'; copia.style.cssText = stile;
    copia.addEventListener('click', () => {
      const t = testoErroriTeatro();
      try { navigator.clipboard.writeText(t).then(() => { copia.textContent = 'Copiato'; }, () => { copia.textContent = 'Seleziona e copia a mano'; }); }
      catch (_) { copia.textContent = 'Seleziona e copia a mano'; }
    });
    const chiudi = document.createElement('button');
    chiudi.textContent = 'Chiudi'; chiudi.style.cssText = stile;
    chiudi.addEventListener('click', () => { riquadroChiuso = true; riquadroErrori.remove(); });
    barra.appendChild(titolo); barra.appendChild(copia); barra.appendChild(chiudi);
    const corpo = document.createElement('div');
    corpo.className = 'corpo';
    riquadroErrori.appendChild(barra); riquadroErrori.appendChild(corpo);
    document.body.appendChild(riquadroErrori);
  }
  riquadroErrori.querySelector('.corpo').textContent = testoErroriTeatro();
}

/**
 * Registra un errore e lo mostra nel riquadro. `dove` dice in che momento è successo
 * ('script', 'logica', 'disegno', 'promessa'…). Non rilancia mai.
 */
function segnalaErroreTeatro(dove, err) {
  try {
    const testo = String((err && err.message) || err || 'errore sconosciuto');
    const traccia = err && err.stack
      ? String(err.stack).split('\n').slice(0, RETE_ERRORI.righeTraccia).join('\n').replace(/file:\/\/\/[^\s)]*\//g, '')
      : '';
    const gia = ERRORI_TEATRO.find((e) => e.dove === dove && e.testo === testo);
    if (gia) { gia.volte++; if (gia.volte % 60 !== 0) return; }
    else {
      if (ERRORI_TEATRO.length >= RETE_ERRORI.massimoInLista) return;
      ERRORI_TEATRO.push({ dove, testo, traccia, volte: 1 });
      try { console.error(`[Teatro] errore di ${dove}:`, err); } catch (_) {}
    }
    if (document.body) aggiornaRiquadroErrori();
    else window.addEventListener('DOMContentLoaded', aggiornaRiquadroErrori, { once: true });
  } catch (_) { /* la rete di sicurezza non deve mai rompere il gioco */ }
}

/**
 * Da chiamare dopo ogni fotogramma: `riuscito` dice se il disegno è andato a buon fine. Dopo più fallimenti di
 * fila spegne un effetto di scena (solo in memoria, senza salvare le opzioni) e riprova.
 */
function fusibileScenaTeatro(riuscito) {
  if (riuscito) { disegniFallitiDiFila = 0; return; }
  disegniFallitiDiFila++;
  if (disegniFallitiDiFila < RETE_ERRORI.disegniDiFilaPerFusibile) return;
  disegniFallitiDiFila = 0;
  if (typeof OPZIONI !== 'object' || !OPZIONI) return;
  const prossimo = RETE_ERRORI.effettiDaSpegnere.find((k) => OPZIONI[k] !== false);
  if (!prossimo) return;
  OPZIONI[prossimo] = false; // non si chiama salvaOpzioni(): vale solo per questa sessione
  effettiSpentiDalFusibile++;
  segnalaErroreTeatro('rete di sicurezza', `il disegno falliva: spento l'effetto «${prossimo}» per questa sessione`);
}

/** Rimette il contesto di disegno in uno stato pulito dopo un errore a metà fotogramma. */
function ripulisciContestoTeatro(contesto) {
  try {
    if (!contesto) return;
    if (typeof contesto.reset === 'function') { contesto.reset(); return; }
    for (let i = 0; i < 64; i++) contesto.restore();
    contesto.setTransform(1, 0, 0, 1, 0, 0);
    contesto.globalAlpha = 1; contesto.globalCompositeOperation = 'source-over'; contesto.filter = 'none';
  } catch (_) {}
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    const dove = e && e.error ? 'script' : 'risorsa';
    if (e && (e.error || e.message)) segnalaErroreTeatro(dove, e.error || `${e.message} (${String(e.filename || '').split('/').pop()}:${e.lineno})`);
  });
  window.addEventListener('unhandledrejection', (e) => { segnalaErroreTeatro('promessa', e && e.reason); });
}
