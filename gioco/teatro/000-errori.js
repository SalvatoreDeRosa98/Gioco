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
