/*
 * teatro/c2-tocco.js — (c2) COMANDI A TOCCO per il telefono.
 *
 * L'idea portante è un GAMEPAD VIRTUALE: le levette e i bottoni disegnati sullo schermo (DOM/CSS sopra il canvas)
 * riempiono un gamepad finto a layout standard (`padC2`) che b3-comandi-opzioni.js legge come uno vero. Così
 * movimento, sparo nelle 4 direzioni con isteresi, azioni, pausa e la navigazione di TUTTI i menu funzionano
 * senza che nessun altro file sappia che esiste il tocco. Per b3 il dispositivo in uso diventa «tocco»: le
 * scritte dei comandi mostrano i nomi dei bottoni a schermo (AZIONE, OGGETTO, CONFERMA…) e nel menu Opzioni
 * compare la pagina «Comandi a tocco».
 *
 * Su PC non cambia niente: lo strato si crea al PRIMO dito sullo schermo (pointerdown di tipo «touch») e si
 * nasconde appena arrivano una tastiera, un mouse o un gamepad veri. Fino al primo tocco di questo file gira
 * un solo ascoltatore (pointerdown) e nessun elemento è nella pagina.
 *
 *   - VERTICALE (telefono in piedi): il gioco in alto a tutta larghezza, i comandi nella fascia nera sotto.
 *   - ORIZZONTALE: il gioco al centro, i comandi nelle due gronde ai lati (e, dove non ci stanno, sopra i bordi).
 *   - levette «dove tocchi»: quella della mano che muove è analogica (direzione e intensità), quella della mano
 *     che spara sceglie la direzione dominante e continua a sparare finché si tiene premuto;
 *   - un tocco breve sul palco resta un click del gioco (porte, piedistalli, banchi, minimappa, bottoni), ma non
 *     fa più «cammina fin lì e spara»: con le levette sotto i pollici confonderebbe;
 *   - sui dispositivi a tocco la risoluzione interna ha un tetto più basso e, solo al primo avvio senza opzioni
 *     salvate, partono spenti gli effetti più pesanti (tabelle RISOLUZIONE_C2 e AVVIO_LEGGERO_C2).
 *
 * Agganci nei file di base (una o due righe l'uno): 70-input.js (`toccoSulPalcoC2`), 40-combattimento.js e
 * t4-hub-storia.js (`levaToccoC2`: levetta analogica), 60-resa.js (`tettoScalaC2`), b3-comandi-opzioni.js
 * (`b3.tocco`: il gamepad virtuale, il dispositivo «tocco», la pagina delle opzioni). Il resto avvolge funzioni
 * globali (loop, scuoti, gestisciClickMenuPausa, cambiaSchermoInteroB3) solo dopo il primo tocco.
 * Script classico, caricato per ultimo (dopo b9-immagini.js). QA: tools/qa-teatro-tocco.js.
 */

// ===========================================================================
// TABELLE (tutti i numeri e i testi di questo file)
// ===========================================================================

/** Levette, tocchi, grandezze, disposizione dei bottoni (misure in px CSS con la grandezza «medi»). */
const TOCCO_C2 = Object.freeze({
  leva: Object.freeze({
    raggio: 46,          // corsa della levetta: oltre questa distanza l'anello segue il pollice
    mortaMovimento: 0.16, // frazione del raggio sotto cui il burattino sta fermo
    mortaSparo: 0.24,    // … e sotto cui non si spara
    pieno: 0.7,          // frazione della corsa utile oltre cui si cammina a piena velocità
    forzaMinima: 0.38,   // velocità minima appena fuori dalla zona morta (frazione della piena)
    asseMinMovimento: 0.34, // valore minimo mandato agli assi del gamepad (b3: zona morta 0.30)
    asseMinSparo: 0.42,  // (b3: zona morta della levetta destra 0.38)
    pomello: 0.56,       // quanto si sposta il pomello disegnato rispetto alla corsa
  }),
  tocco: Object.freeze({ brevissimoMs: 260, fermoPx: 9 }), // un tocco più corto e più fermo di così è un click del gioco
  grandezze: Object.freeze({ piccoli: 0.85, medi: 1, grandi: 1.18 }),
  opacitaMinima: 0.25,   // i comandi non spariscono mai del tutto
  diametri: Object.freeze({ azione: 66, oggetto: 54, consuma: 54, piccolo: 40, conferma: 88, indietro: 66, freccia: 52, pagina: 54 }),
  // il gamepad finto: bottone a schermo → indice del layout standard (gli stessi di PAD_B3.bottoni)
  bottoni: Object.freeze({ conferma: 0, indietro: 1, pagina: 3, consuma: 4, azione: 5, oggetto: 6, diario: 8, pausa: 9, su: 12, giu: 13, sinistra: 14, destra: 15 }),
  quantiBottoni: 17,
  // VERTICALE: distanze dal bordo della mano che spara (dx) e dal fondo (frazione dell'altezza utile della fascia)
  verticale: Object.freeze({
    fasciaMinima: 220,   // sotto questa altezza di fascia nera si usa la disposizione orizzontale
    striscia: 48,        // in cima alla fascia: bottoni piccoli e invito a girare il telefono
    utileMassima: 400,
    azione: Object.freeze({ dx: 62, su: 0.66 }),
    oggetto: Object.freeze({ dx: 142, su: 0.57 }),
    consuma: Object.freeze({ dx: 206, su: 0.40 }),
    riposoSparo: Object.freeze({ dx: 96, su: 0.30 }),
    riposoMovimento: Object.freeze({ dx: 92, su: 0.32 }),
    invito: Object.freeze({ versoMovimento: 54, versoSparo: 102 }), // margini della scritta: fra i bottoni piccoli
    conferma: Object.freeze({ dx: 72, su: 0.35 }),
    indietro: Object.freeze({ dx: 60, su: 0.68 }),
    pagina: Object.freeze({ dx: 150, su: 0.62 }),
    frecce: Object.freeze({ dx: 104, su: 0.37, braccio: 56 }),
  }),
  // ORIZZONTALE: una colonna nella gronda della mano che spara; distanze dal fondo in frazione dell'altezza
  orizzontale: Object.freeze({
    gronda: 72,          // spazio minimo lasciato ai lati del palco (anche sugli schermi 16:9)
    altezzaPiena: 380,   // sotto questa altezza i bottoni si rimpiccioliscono in proporzione
    utileMassima: 420,
    colonna: Object.freeze({ min: 36, max: 62 }),
    azione: 0.50, oggetto: 0.69, consuma: 0.855,
    riposoSparo: Object.freeze({ dxMin: 70, giu: 76 }),
    riposoMovimento: Object.freeze({ dxMin: 74, giu: 84 }),
    piccoli: Object.freeze({ y: 25, passo: 44, affiancati: 96 }),
    conferma: Object.freeze({ dxMin: 52, giu: 64, d: 84 }),
    indietro: Object.freeze({ dxMin: 52, giu: 152, d: 62 }),
    pagina: Object.freeze({ giu: 224, d: 50 }),
    frecce: Object.freeze({ dxMin: 60, giu: 80, braccio: 39, d: 38 }),
  }),
  invitoMs: 12000,       // per quanto resta l'invito a girare il telefono
  vibra: Object.freeze({ bottone: 8, colpo: 55, esplosione: Object.freeze([70, 40, 90]) }), // ms (navigator.vibrate)
  padVero: Object.freeze({ bottoniMinimi: 10, sogliaAsse: 0.6 }),
});

/**
 * Sui dispositivi a tocco la risoluzione interna si ferma a questa scala (2 = 1280×720). Misura della QA
 * (tools/qa-teatro-tocco.js, «Pixel 7» orizzontale a densità 2,6, CPU rallentata ×4, stanza con nemici): senza
 * tetto il buffer è 1920×1080 e un fotogramma costa ~32 ms, col tetto ~16 ms; a schermo la differenza non si nota
 * (il palco è largo 620-640 px CSS: 1280 px di buffer sono già il doppio).
 */
const RISOLUZIONE_C2 = Object.freeze({ scalaMax: 2 });

/**
 * Impostazioni più leggere proposte SOLO al primo avvio su un dispositivo a tocco senza opzioni salvate (poi
 * comanda il menu Opzioni). Stessa misura di sopra, col tetto: ombre lunghe spente −3 ms su 16 (−20%); grana e
 * vignetta non costano niente di misurabile (restano accese: sono il carattere del gioco); il pubblico è l'effetto
 * più caro (−7 ms) ma è parte del gioco: resta acceso, ed è il primo da spegnere dalle Opzioni se il telefono arranca.
 */
const AVVIO_LEGGERO_C2 = Object.freeze({ ombre: false });

/** Opzioni aggiunte a OPZIONI da questo file (compaiono nel menu Opzioni solo quando il tocco è in uso). */
const OPZIONI_C2_PREDEFINITE = Object.freeze({ toccoGrandezza: 'medi', toccoOpacita: 0.7, toccoMancino: false, toccoVibrazione: true });

const TESTI_C2 = Object.freeze({
  bottoni: Object.freeze({
    azione: 'AZIONE', oggetto: 'OGGETTO', consuma: 'CONSUMA', conferma: 'CONFERMA', indietro: 'INDIETRO', pagina: 'PAGINA',
    pausa: 'Pausa', diario: 'Diario', schermo: 'Schermo intero', su: 'Su', giu: 'Giù', sinistra: 'Sinistra', destra: 'Destra',
  }),
  invito: '⟳ gira il telefono per giocare in largo',
  // nomi dei comandi nelle scritte del gioco quando si usa il tocco (al posto di «E», «Q», «Ⓐ», «RB»…)
  simboli: Object.freeze({
    su: 'levetta', giu: 'levetta', sinistra: 'levetta', destra: 'levetta',
    sparaSu: 'levetta di sparo', sparaGiu: 'levetta di sparo', sparaSinistra: 'levetta di sparo', sparaDestra: 'levetta di sparo',
    attivo: 'OGGETTO', interagisci: 'AZIONE', consumabile: 'CONSUMA', pausa: 'PAUSA', diario: 'DIARIO',
    conferma: 'CONFERMA', indietro: 'INDIETRO', slotAttivo: '', slotConsumabile: '',
  }),
  // scritte dei file di base che col tocco cambiano per intero
  interi: Object.freeze({
    'Frecce/WASD o click: scorri · Esc/O: torna al menu': 'Tocca o frecce: scorri · INDIETRO: torna al menu',
    'C: consumabili': 'PAGINA: consumabili',
    'C: oggetti · Esc/O: torna al menu': 'PAGINA: oggetti · INDIETRO: torna al menu',
    'X: esporta il registro (JSON) · Esc / L: torna al menu': 'INDIETRO: torna al menu',
    'Frecce/WASD o click: scegli · E/Invio (o secondo click): prendi · Esc: chiudi · ▪ azzurro = fuori dal pool della notte':
      'Tocca: scegli · tocca ancora o CONFERMA: prendi · INDIETRO: chiudi · ▪ azzurro = fuori dal pool della notte',
    'Clicca qui o premi [SPAZIO / INVIO] per entrare nel Teatro': 'Tocca qui per entrare nel Teatro',
  }),
  // scritte di b3 (menu di pausa, menu principale, Opzioni)
  b3: Object.freeze({
    aiutoPausa: 'Tocca una voce · frecce e CONFERMA: scegli · INDIETRO: riprendi',
    bottoneMenu: 'tocca qui',
    piede: 'Tocca una riga per cambiarla · frecce: scegli e regola · INDIETRO: chiudi',
    piedePagina: 'Tocca una riga per cambiarla · frecce: scegli e regola · INDIETRO: torna alle opzioni',
    linguetta: 'COMANDI A TOCCO',
    vaiTocco: 'Comandi a tocco ▸',
    notaVaiTocco: 'Grandezza, opacità, mano e vibrazione dei comandi sullo schermo.',
  }),
  righe: Object.freeze({
    grandezza: 'Grandezza dei comandi', notaGrandezza: 'Quanto sono grandi levette e bottoni sullo schermo.',
    piccoli: 'PICCOLI', medi: 'MEDI', grandi: 'GRANDI',
    opacita: 'Opacità dei comandi', notaOpacita: 'Quanto si vedono i comandi sopra la scena (non spariscono mai del tutto).',
    mano: 'Levetta di movimento', notaMano: 'Da che parte sta il pollice che muove Ferruccio. Sparo e bottoni passano dall\'altra.',
    aSinistra: 'A SINISTRA', aDestra: 'A DESTRA',
    vibrazione: 'Vibrazione al tocco', notaVibrazione: 'Un colpetto quando premi un bottone e quando sei colpito, dove il telefono lo permette.',
    schermo: 'Schermo intero', notaSchermo: 'Il teatro a tutto schermo, senza le barre del telefono (dove il browser lo permette).',
    indietro: '◂ Torna alle opzioni',
  }),
});

/** Righe della pagina «Comandi a tocco» del menu Opzioni di b3 (tipi: scelta, barra, spunta, azione). */
const RIGHE_C2 = Object.freeze([
  { id: 'toccoGrandezza', tipo: 'scelta', nome: TESTI_C2.righe.grandezza, nota: TESTI_C2.righe.notaGrandezza,
    scelte: Object.freeze([['piccoli', TESTI_C2.righe.piccoli], ['medi', TESTI_C2.righe.medi], ['grandi', TESTI_C2.righe.grandi]]) },
  { id: 'toccoOpacita', tipo: 'barra', nome: TESTI_C2.righe.opacita, nota: TESTI_C2.righe.notaOpacita },
  { id: 'toccoMancino', tipo: 'scelta', nome: TESTI_C2.righe.mano, nota: TESTI_C2.righe.notaMano,
    scelte: Object.freeze([[false, TESTI_C2.righe.aSinistra], [true, TESTI_C2.righe.aDestra]]) },
  { id: 'toccoVibrazione', tipo: 'spunta', nome: TESTI_C2.righe.vibrazione, nota: TESTI_C2.righe.notaVibrazione },
  { id: 'schermoIntero', tipo: 'spunta', nome: TESTI_C2.righe.schermo, nota: TESTI_C2.righe.notaSchermo },
  { id: 'indietro', tipo: 'azione', nome: TESTI_C2.righe.indietro, nota: '' },
].map((r) => Object.freeze(r)));

/** Disegni dei bottoni (SVG in linea, tratto oro: nessuna immagine esterna). */
const ICONE_C2 = Object.freeze({
  azione: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none"/>',
  oggetto: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.3l6.1-.7z"/>',
  consuma: '<path d="M9.5 3h5M10.5 3v5.2L6 17.5A2.5 2.5 0 0 0 8.3 21h7.4a2.5 2.5 0 0 0 2.3-3.5L13.5 8.2V3M8 15h8"/>',
  pausa: '<path d="M8.5 5v14M15.5 5v14" stroke-width="3.2"/>',
  diario: '<path d="M5 4.5h11a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11M9 8.5h6"/>',
  schermo: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>',
  conferma: '<path d="M5 12.5l4.5 4.5L19 7.5" stroke-width="3"/>',
  indietro: '<path d="M11 5l-7 7 7 7M4 12h16" stroke-width="2.6"/>',
  pagina: '<path d="M6 4h9l4 4v12H6zM15 4v4h4"/>',
  freccia: '<path d="M12 5l7.5 13h-15z" fill="currentColor" stroke="none"/>',
});

const STILE_BASE_C2 = `
html.c2-tocco body, html.c2-tocco .game-card { height: 100vh; height: 100dvh; }
html.c2-tocco.c2-vert body, html.c2-tocco.c2-vert .game-card { align-items: flex-start; }
html.c2-tocco.c2-vert .palco-wrap { width: 100vw; height: calc(100vw * 9 / 16); margin-top: env(safe-area-inset-top, 0px);
  border-width: 0 0 2px 0; border-radius: 0; box-shadow: none; }
html.c2-tocco.c2-oriz .palco-wrap { --c2-g: calc(${TOCCO_C2.orizzontale.gronda * 2}px + env(safe-area-inset-left, 0px) + env(safe-area-inset-right, 0px));
  width: min(calc(100vw - var(--c2-g)), calc(100vh * 16 / 9)); height: min(100vh, calc((100vw - var(--c2-g)) * 9 / 16));
  width: min(calc(100vw - var(--c2-g)), calc(100dvh * 16 / 9)); height: min(100dvh, calc((100vw - var(--c2-g)) * 9 / 16));
  border-width: 1px; border-radius: 0; }
`;

const STILE_STRATO_C2 = `
#c2-strato { position: fixed; z-index: 40; top: env(safe-area-inset-top, 0px); right: env(safe-area-inset-right, 0px);
  bottom: env(safe-area-inset-bottom, 0px); left: env(safe-area-inset-left, 0px); pointer-events: none; touch-action: none;
  -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; opacity: var(--c2-opacita, 0.7);
  font-family: ui-monospace, "Cascadia Mono", "Segoe UI Mono", monospace; }
#c2-strato[hidden], #c2-strato [hidden] { display: none !important; }
#c2-strato .c2-b { position: absolute; width: var(--d, 54px); height: var(--d, 54px); margin: calc(var(--d, 54px) / -2) 0 0 calc(var(--d, 54px) / -2);
  border-radius: 50%; pointer-events: auto; touch-action: none; display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: #f9cb40; background: radial-gradient(circle at 50% 32%, #3a2412 0%, #140c08 72%); border: 2px solid #f9cb40;
  box-shadow: 0 0 0 2px #140c08, inset 0 0 0 1px #5a3818, 0 3px 9px rgba(0, 0, 0, 0.7); -webkit-tap-highlight-color: transparent; }
#c2-strato .c2-b svg { width: 44%; height: 44%; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; pointer-events: none; }
#c2-strato .c2-b b { font-size: calc(var(--d, 54px) * 0.155); line-height: 1; margin-top: 2px; letter-spacing: 0.4px; pointer-events: none; }
#c2-strato .c2-b.c2-solo svg { width: 54%; height: 54%; }
#c2-strato .c2-b.c2-premuto { background: radial-gradient(circle at 50% 40%, #8a2014 0%, #63150d 75%); border-color: #fff3c4; color: #fff; transform: scale(0.94); }
#c2-strato .c2-b.c2-spento { color: #8a6a3f; border-color: #7c5227; }
#c2-strato .c2-b.c2-pronto { box-shadow: 0 0 0 2px #140c08, inset 0 0 0 1px #5a3818, 0 0 12px 2px rgba(249, 203, 64, 0.75); }
#c2-strato .c2-b i { position: absolute; right: -4px; top: -4px; min-width: 20px; height: 20px; padding: 0 4px; border-radius: 10px; background: #140c08;
  border: 1px solid #f9cb40; color: #f6e7c4; font: bold 11px/18px ui-monospace, monospace; text-align: center; pointer-events: none; }
#c2-strato .c2-b i:empty { display: none; }
#c2-strato .c2-su svg { transform: rotate(0deg); } #c2-strato .c2-destra svg { transform: rotate(90deg); }
#c2-strato .c2-giu svg { transform: rotate(180deg); } #c2-strato .c2-sinistra svg { transform: rotate(270deg); }
#c2-strato .c2-leva { position: absolute; width: var(--d, 92px); height: var(--d, 92px); margin: calc(var(--d, 92px) / -2) 0 0 calc(var(--d, 92px) / -2);
  border-radius: 50%; border: 2px solid #f9cb40; background: radial-gradient(circle, rgba(58, 36, 18, 0.55) 0%, rgba(20, 12, 8, 0.72) 70%);
  box-shadow: 0 0 0 2px rgba(20, 12, 8, 0.8), inset 0 0 0 1px #5a3818; pointer-events: none; }
#c2-strato .c2-leva u { position: absolute; left: 50%; top: 50%; width: 46%; height: 46%; border-radius: 50%; border: 2px solid #140c08;
  background: radial-gradient(circle at 50% 35%, #ffe08a 0%, #f9cb40 45%, #a8791f 100%); box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
  transform: translate(calc(-50% + var(--kx, 0px)), calc(-50% + var(--ky, 0px))); }
#c2-strato .c2-leva.c2-riposo { opacity: 0.42; border-style: dashed; }
#c2-strato .c2-leva.c2-riposo u { width: 34%; height: 34%; }
#c2-strato .c2-leva[data-dir="su"] { border-top-color: #fff; } #c2-strato .c2-leva[data-dir="giu"] { border-bottom-color: #fff; }
#c2-strato .c2-leva[data-dir="sinistra"] { border-left-color: #fff; } #c2-strato .c2-leva[data-dir="destra"] { border-right-color: #fff; }
#c2-strato .c2-invito { position: absolute; left: 0; right: 0; text-align: center; color: #c9a679; font-size: 10px; line-height: 14px; pointer-events: none;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0.85; transition: opacity 1.2s; }
#c2-strato .c2-invito.c2-via { opacity: 0; }
`;

// ===========================================================================
// STATO E GAMEPAD VIRTUALE
// ===========================================================================

/** Il gamepad finto (layout standard, 17 bottoni, 4 assi) che b3 legge al posto di uno vero quando si usa il tocco. */
const padC2 = {
  id: 'Comandi a tocco (c2)', index: -1, connected: true, mapping: 'standard', timestamp: 0, tocco: true,
  axes: [0, 0, 0, 0],
  buttons: Array.from({ length: TOCCO_C2.quantiBottoni }, () => ({ pressed: false, touched: false, value: 0 })),
  vibrationActuator: null,
};

const c2 = {
  dispositivo: false,     // lo schermo principale è a tocco (telefono, tavoletta): disposizione e risoluzione da telefono
  installato: false,      // strato, ascoltatori e avvolgimenti creati (al primo tocco)
  attivo: false,          // il tocco è in uso: lo strato si vede e il gamepad virtuale è quello che b3 legge
  radice: null, el: {}, leveEl: {}, invito: null,
  tenuti: new Array(TOCCO_C2.quantiBottoni).fill(0),   // dita su ogni bottone
  lampo: new Array(TOCCO_C2.quantiBottoni).fill(false), // toccato dall'ultimo fotogramma (anche se già rilasciato)
  puntatori: new Map(),   // pointerId → bottone premuto
  leve: {
    movimento: { id: null, ox: 0, oy: 0, x: 0, y: 0, t0: 0, corsa: 0, px0: 0, py0: 0, vx: 0, vy: 0, forza: 0 },
    sparo: { id: null, ox: 0, oy: 0, x: 0, y: 0, t0: 0, corsa: 0, px0: 0, py0: 0, vx: 0, vy: 0, forza: 0 },
  },
  riposo: { movimento: { x: 0, y: 0 }, sparo: { x: 0, y: 0 } },
  raggio: TOCCO_C2.leva.raggio,
  ultimoPuntatore: '',    // tipo dell'ultimo pointerdown: i click che seguono un «touch» vengono dal dito
  clickSintetico: false,
  firma: '', firmaDisposizione: '',
  padVeroPrima: new Map(),
  veglia: null,           // WakeLockSentinel (schermo acceso), 'attesa' mentre si chiede
  schermoNegato: false,
  tettoSpento: false,     // (QA) toglie il tetto di risoluzione per misurare
  avvioLeggero: false,
  haToccato: false,       // almeno un dito è stato rilasciato: da qui navigator.vibrate non viene più rifiutato
  invitoFinoMs: 0,
  ultimaVibrazione: null,
  vettore: { x: 0, y: 0 },
};

/** true se il dispositivo si usa soprattutto col dito (telefono, tavoletta). */
function dispositivoAToccoC2() {
  try {
    return Boolean((navigator.maxTouchPoints || 0) > 0 && window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  } catch (_) { return false; }
}

/** Valore di un'opzione del tocco: quello salvato se è valido, altrimenti il predefinito. */
function opzioneC2(id) {
  const v = OPZIONI[id], p = OPZIONI_C2_PREDEFINITE[id];
  if (typeof v !== typeof p) return p;
  if (id === 'toccoGrandezza' && !TOCCO_C2.grandezze[v]) return p;
  return v;
}

// ===========================================================================
// AGGANCI CHIAMATI DAI FILE DI BASE
// ===========================================================================

/**
 * (60-resa.js › adattaRisoluzione) Scala massima del buffer: sui dispositivi a tocco RISOLUZIONE_C2.scalaMax,
 * altrove nessun tetto in più.
 */
function tettoScalaC2() {
  return c2.dispositivo && !c2.tettoSpento ? RISOLUZIONE_C2.scalaMax : Infinity;
}

/**
 * (70-input.js) true se il click sul palco viene da un dito coi comandi a tocco in uso: in quel caso il gioco
 * non fa «cammina fin lì e spara» (porte, piedistalli, banchi e minimappa sono già stati serviti prima).
 */
function toccoSulPalcoC2() {
  return c2.attivo;
}

/**
 * (40-combattimento.js, t4-hub-storia.js) Levetta analogica: dato il movimento a 8 direzioni letto dai tasti
 * (mx, my ∈ {-1, 0, 1}) restituisce il vettore della levetta a tocco (lunghezza = intensità, al più 1), oppure
 * null se la levetta non è in uso. Se i tasti arrivano rovesciati (il Capogiro di a2) si rovescia come loro.
 */
function levaToccoC2(mx, my) {
  const L = c2.leve.movimento;
  if (!c2.attivo || L.id === null || !(L.forza > 0) || (!mx && !my)) return null;
  const T = b3.pad.tenuti;
  const ex = (T.has('KeyD') ? 1 : 0) - (T.has('KeyA') ? 1 : 0);
  const ey = (T.has('KeyS') ? 1 : 0) - (T.has('KeyW') ? 1 : 0);
  if (!ex && !ey) return null; // i tasti premuti non vengono dalla levetta
  let segno = 0;
  if (mx === ex && my === ey) segno = 1;
  else if (mx === -ex && my === -ey) segno = -1;
  if (!segno) return null;
  const v = c2.vettore;
  v.x = L.vx * L.forza * segno;
  v.y = L.vy * L.forza * segno;
  return v;
}

// ===========================================================================
// REGISTRAZIONE IN b3: gamepad virtuale, dispositivo «tocco», pagina delle opzioni
// ===========================================================================
b3.tocco = Object.freeze({
  /** Il gamepad virtuale, se il tocco è in uso (altrimenti null: b3 legge quelli veri). */
  pad: () => (c2.attivo ? padC2 : null),
  /** true se questo mousedown viene da un dito (click di compatibilità del browser o tocco breve sul palco). */
  daTocco: (e) => c2.attivo && (c2.clickSintetico || c2.ultimoPuntatore === 'touch' || !e || !e.isTrusted),
  simboli: TESTI_C2.simboli,
  interi: TESTI_C2.interi,
  testi: TESTI_C2.b3,
  righe: RIGHE_C2,
});

// ===========================================================================
// STRATO: creazione (al primo tocco), disposizione, vista secondo il contesto
// ===========================================================================
function iniettaStileC2(id, css) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id;
  s.textContent = css;
  document.head.appendChild(s);
}

/** true se i comandi vanno nella fascia sotto il gioco (telefono in piedi). */
function verticaleC2() {
  const l = window.innerWidth, a = window.innerHeight;
  return a > l && a - (l * 9) / 16 >= TOCCO_C2.verticale.fasciaMinima;
}

/** Classi di <html> che spostano il palco: in alto (verticale) o fra due gronde (orizzontale). */
function aggiornaClassiC2() {
  const h = document.documentElement.classList;
  const acceso = c2.dispositivo || c2.attivo;
  const vert = verticaleC2();
  h.toggle('c2-tocco', acceso);
  h.toggle('c2-vert', acceso && vert);
  h.toggle('c2-oriz', acceso && !vert);
}

function creaBottoneC2(nome, icona, opz = {}) {
  const b = document.createElement('div');
  b.className = `c2-b c2-${nome}${opz.classe ? ` ${opz.classe}` : ''}${opz.scritta ? '' : ' c2-solo'}`;
  b.setAttribute('role', 'button');
  b.setAttribute('aria-label', TESTI_C2.bottoni[nome] || nome);
  b.dataset.nome = nome;
  if (TOCCO_C2.bottoni[nome] !== undefined) b.dataset.b = String(TOCCO_C2.bottoni[nome]);
  b.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icona}</svg>${opz.scritta ? `<b>${TESTI_C2.bottoni[nome]}</b>` : ''}${opz.segno ? '<i></i>' : ''}`;
  c2.radice.appendChild(b);
  c2.el[nome] = b;
  return b;
}

function creaStratoC2() {
  iniettaStileC2('c2-stile-base', STILE_BASE_C2);
  iniettaStileC2('c2-stile-strato', STILE_STRATO_C2);
  const r = document.createElement('div');
  r.id = 'c2-strato';
  r.hidden = true;
  c2.radice = r;
  for (const nome of ['movimento', 'sparo']) {
    const l = document.createElement('div');
    l.className = `c2-leva c2-leva-${nome} c2-riposo`;
    l.innerHTML = '<u></u>';
    r.appendChild(l);
    c2.leveEl[nome] = l;
  }
  creaBottoneC2('azione', ICONE_C2.azione, { scritta: true, segno: true });
  creaBottoneC2('oggetto', ICONE_C2.oggetto, { scritta: true, segno: true });
  creaBottoneC2('consuma', ICONE_C2.consuma, { scritta: true });
  creaBottoneC2('pausa', ICONE_C2.pausa);
  creaBottoneC2('diario', ICONE_C2.diario);
  creaBottoneC2('schermo', ICONE_C2.schermo);
  creaBottoneC2('conferma', ICONE_C2.conferma, { scritta: true });
  creaBottoneC2('indietro', ICONE_C2.indietro, { scritta: true });
  creaBottoneC2('pagina', ICONE_C2.pagina, { scritta: true });
  creaBottoneC2('su', ICONE_C2.freccia);
  creaBottoneC2('giu', ICONE_C2.freccia);
  creaBottoneC2('sinistra', ICONE_C2.freccia);
  creaBottoneC2('destra', ICONE_C2.freccia);
  const inv = document.createElement('div');
  inv.className = 'c2-invito';
  inv.textContent = TESTI_C2.invito;
  r.appendChild(inv);
  c2.invito = inv;
  document.body.appendChild(r);
}

function mettiC2(el, x, y, d) {
  el.style.left = `${Math.round(x)}px`;
  el.style.top = `${Math.round(y)}px`;
  el.style.setProperty('--d', `${Math.round(d)}px`);
}

const limitaC2 = (v, a, b) => Math.max(a, Math.min(b, v));

/** Mette levette e bottoni al loro posto secondo schermo, orientamento, grandezza e mano. */
function disponiC2() {
  if (!c2.radice || c2.radice.hidden) return;
  aggiornaClassiC2();
  const S = c2.radice.getBoundingClientRect(); // rettangolo sicuro: dentro tacche e bordi arrotondati
  const R = canvas.getBoundingClientRect();
  const D = TOCCO_C2.diametri;
  const k = TOCCO_C2.grandezze[opzioneC2('toccoGrandezza')] || 1;
  const manc = Boolean(opzioneC2('toccoMancino'));
  const lato = S.width, alto = S.height;
  const xS = (dx) => (manc ? dx : lato - dx);  // dal bordo della mano che spara
  const xM = (dx) => (manc ? lato - dx : dx);  // dal bordo della mano che muove
  const E = c2.el;
  c2.radice.style.setProperty('--c2-opacita', String(Math.max(TOCCO_C2.opacitaMinima, Math.min(1, Number(opzioneC2('toccoOpacita')) || 0))));
  let kk = k;
  if (verticaleC2()) {
    const V = TOCCO_C2.verticale;
    const cima = Math.max(0, R.bottom - S.top) + 4;
    const utile = Math.min(alto - cima - V.striscia, V.utileMassima);
    const yDa = (su) => alto - utile * su;
    mettiC2(E.azione, xS(V.azione.dx * k), yDa(V.azione.su), D.azione * k);
    mettiC2(E.oggetto, xS(V.oggetto.dx * k), yDa(V.oggetto.su), D.oggetto * k);
    mettiC2(E.consuma, xS(V.consuma.dx * k), yDa(V.consuma.su), D.consuma * k);
    c2.riposo.sparo.x = xS(V.riposoSparo.dx); c2.riposo.sparo.y = yDa(V.riposoSparo.su);
    c2.riposo.movimento.x = xM(V.riposoMovimento.dx); c2.riposo.movimento.y = yDa(V.riposoMovimento.su);
    const ys = cima + V.striscia / 2;
    mettiC2(E.pausa, xS(28), ys, D.piccolo);
    mettiC2(E.diario, xS(76), ys, D.piccolo);
    mettiC2(E.schermo, xM(28), ys, D.piccolo);
    mettiC2(E.conferma, xS(V.conferma.dx * k), yDa(V.conferma.su), D.conferma * k);
    mettiC2(E.indietro, xS(V.indietro.dx * k), yDa(V.indietro.su), D.indietro * k);
    mettiC2(E.pagina, xS(V.pagina.dx * k), yDa(V.pagina.su), D.pagina * k);
    const fx = xM(V.frecce.dx * k), fy = yDa(V.frecce.su), br = V.frecce.braccio * k;
    mettiC2(E.su, fx, fy - br, D.freccia * k); mettiC2(E.giu, fx, fy + br, D.freccia * k);
    mettiC2(E.sinistra, fx - br, fy, D.freccia * k); mettiC2(E.destra, fx + br, fy, D.freccia * k);
    c2.invito.style.top = `${Math.round(ys - 7)}px`;
    c2.invito.style.left = `${manc ? V.invito.versoSparo : V.invito.versoMovimento}px`;
    c2.invito.style.right = `${manc ? V.invito.versoMovimento : V.invito.versoSparo}px`;
    c2.invito.hidden = false;
  } else {
    const O = TOCCO_C2.orizzontale;
    kk = k * Math.min(1, alto / O.altezzaPiena);
    const grS = manc ? R.left - S.left : S.right - R.right;   // gronda dalla parte di chi spara
    const grM = manc ? S.right - R.right : R.left - S.left;   // … e di chi muove
    const cS = limitaC2(grS / 2, O.colonna.min, O.colonna.max);
    const cM = limitaC2(grM / 2, 28, 60);
    const utile = Math.min(alto, O.utileMassima);
    mettiC2(E.azione, xS(cS), alto - utile * O.azione, D.azione * kk);
    mettiC2(E.oggetto, xS(cS), alto - utile * O.oggetto, D.oggetto * kk);
    mettiC2(E.consuma, xS(cS), alto - utile * O.consuma, D.consuma * kk);
    c2.riposo.sparo.x = xS(Math.max(cS, O.riposoSparo.dxMin)); c2.riposo.sparo.y = alto - O.riposoSparo.giu;
    c2.riposo.movimento.x = xM(Math.max(grM * 0.6, O.riposoMovimento.dxMin)); c2.riposo.movimento.y = alto - O.riposoMovimento.giu;
    const P = O.piccoli;
    if (grM >= P.affiancati) {
      mettiC2(E.pausa, xM(cM - P.passo / 2), P.y, D.piccolo);
      mettiC2(E.diario, xM(cM + P.passo / 2), P.y, D.piccolo);
      mettiC2(E.schermo, xM(cM - P.passo / 2), P.y + P.passo, D.piccolo);
    } else {
      mettiC2(E.pausa, xM(cM), P.y, D.piccolo);
      mettiC2(E.diario, xM(cM), P.y + P.passo, D.piccolo);
      mettiC2(E.schermo, xM(cM), P.y + P.passo * 2, D.piccolo);
    }
    mettiC2(E.conferma, xS(Math.max(cS, O.conferma.dxMin)), alto - O.conferma.giu, O.conferma.d * kk);
    mettiC2(E.indietro, xS(Math.max(cS, O.indietro.dxMin)), alto - O.indietro.giu, O.indietro.d * kk);
    mettiC2(E.pagina, xS(cS), alto - O.pagina.giu, O.pagina.d * kk);
    const fx = xM(Math.max(cM, O.frecce.dxMin)), fy = alto - O.frecce.giu, br = O.frecce.braccio * kk;
    mettiC2(E.su, fx, fy - br, O.frecce.d * kk); mettiC2(E.giu, fx, fy + br, O.frecce.d * kk);
    mettiC2(E.sinistra, fx - br, fy, O.frecce.d * kk); mettiC2(E.destra, fx + br, fy, O.frecce.d * kk);
    c2.invito.hidden = true;
  }
  c2.raggio = TOCCO_C2.leva.raggio * kk;
  for (const nome of ['movimento', 'sparo']) disegnaLevaC2(nome);
  c2.firmaDisposizione = firmaDisposizioneC2();
}

function firmaDisposizioneC2() {
  const R = canvas.getBoundingClientRect();
  return [window.innerWidth, window.innerHeight, Math.round(R.left), Math.round(R.bottom), Math.round(R.width),
    opzioneC2('toccoGrandezza'), opzioneC2('toccoOpacita'), opzioneC2('toccoMancino')].join('|');
}

/** Anello e pomello di una levetta: sotto il pollice se è in uso, altrimenti al posto di riposo (tratteggiata). */
function disegnaLevaC2(nome) {
  const el = c2.leveEl[nome], L = c2.leve[nome];
  if (!el) return;
  const d = c2.raggio * 2;
  if (L.id === null) {
    mettiC2(el, c2.riposo[nome].x, c2.riposo[nome].y, d);
    el.classList.add('c2-riposo');
    el.style.setProperty('--kx', '0px');
    el.style.setProperty('--ky', '0px');
    return;
  }
  const S = c2.radice.getBoundingClientRect();
  mettiC2(el, L.ox - S.left, L.oy - S.top, d);
  el.classList.remove('c2-riposo');
  const p = c2.raggio * TOCCO_C2.leva.pomello;
  el.style.setProperty('--kx', `${((L.x - L.ox) / c2.raggio * p).toFixed(1)}px`);
  el.style.setProperty('--ky', `${((L.y - L.oy) / c2.raggio * p).toFixed(1)}px`);
}

/** Cosa si vede in ogni contesto di b3 (in scena le levette e le azioni, nei menu CONFERMA/INDIETRO e le frecce). */
function vistaC2(c) {
  const v = { movimento: false, sparo: false, azione: false, oggetto: false, consuma: false, pausa: false, diario: false,
    conferma: false, indietro: false, pagina: false, frecce: false };
  if (liberoB3(c)) {
    v.movimento = v.azione = v.pausa = v.diario = true;
    if (c === 'gioco') v.sparo = v.oggetto = v.consuma = true;
  } else if (c === 'opzioni') {
    v.conferma = v.indietro = v.frecce = true;
  } else if (c !== 'morte') {
    const T = PAD_MENU_B3[c] || PAD_MENU_B3.menu;
    v.conferma = Boolean(T.A);
    v.indietro = Boolean(T.B) && T.B !== T.A && c !== 'principale';
    v.frecce = Boolean(T.nav);
    v.pagina = c === 'diario' && Boolean(T.Y);
  }
  return v;
}

function schermoInteroAttivoC2() { return Boolean(document.fullscreenElement || document.webkitFullscreenElement); }

function schermoInteroPossibileC2() {
  const el = document.documentElement;
  return !c2.schermoNegato && Boolean(el.requestFullscreen || el.webkitRequestFullscreen) && document.fullscreenEnabled !== false;
}

/** Stato della run che i bottoni mostrano (bombe, carica dell'oggetto attivo, consumabile in mano). */
function statoBottoniC2() {
  let cons = null;
  try { const S = statoRun.consumabiliA2; cons = S && S.run === statoRun.numeroRun && S.slot ? (S.slot.id || S.slot.tipo || 'x') : null; } catch (_) { cons = null; }
  const att = statoRun.oggettoAttivo || null;
  return { bombe: statoRun.bombe || 0, attivo: att ? (att.id || att.nome || 'x') : null, carica: statoRun.caricaAttivo || 0, max: att ? (att.maxCarica || 3) : 0, cons };
}

function aggiornaVistaC2(c) {
  const v = vistaC2(c), E = c2.el;
  for (const nome of ['azione', 'oggetto', 'consuma', 'pausa', 'diario', 'conferma', 'indietro', 'pagina']) E[nome].hidden = !v[nome];
  for (const nome of ['su', 'giu', 'sinistra', 'destra']) E[nome].hidden = !v.frecce;
  E.schermo.hidden = !schermoInteroPossibileC2();
  E.schermo.classList.toggle('c2-pronto', schermoInteroAttivoC2());
  c2.leveEl.movimento.hidden = !v.movimento;
  c2.leveEl.sparo.hidden = !v.sparo;
  const s = statoBottoniC2();
  E.azione.querySelector('i').textContent = c === 'gioco' && s.bombe > 0 ? `💣${s.bombe}` : '';
  E.oggetto.classList.toggle('c2-spento', !s.attivo || s.carica < s.max);
  E.oggetto.classList.toggle('c2-pronto', Boolean(s.attivo) && s.carica >= s.max);
  E.oggetto.querySelector('i').textContent = s.attivo ? `${Math.min(s.carica, s.max)}/${s.max}` : '';
  E.consuma.classList.toggle('c2-spento', !s.cons);
  E.consuma.classList.toggle('c2-pronto', Boolean(s.cons));
  // un bottone che sparisce mentre è premuto si rilascia
  for (const [id, el] of c2.puntatori) if (el.hidden) rilasciaBottoneC2(id);
}

// ===========================================================================
// DITA: levette «dove tocchi», bottoni, tocco breve sul palco
// ===========================================================================
const SFONDI_C2 = new Set(['c', 'wrap']);

/** true se il dito è caduto sul palco o sul nero attorno (non su un riquadro di un altro file). */
function sulloSfondoC2(t) {
  if (!t || t === document.body || t === document.documentElement) return true;
  return SFONDI_C2.has(t.id) || Boolean(t.classList && t.classList.contains('game-card'));
}

function vibraC2(schema) {
  try {
    if (!c2.attivo || !c2.haToccato || !opzioneC2('toccoVibrazione') || typeof navigator.vibrate !== 'function') return false;
    navigator.vibrate(schema);
    c2.ultimaVibrazione = { schema, ms: performance.now() };
    return true;
  } catch (_) { return false; }
}

function bottoneGiuC2(el, e) {
  e.preventDefault();
  try { el.setPointerCapture(e.pointerId); } catch (_) { /* il dito è già «catturato» dal bottone */ }
  if (c2.puntatori.has(e.pointerId)) return;
  c2.puntatori.set(e.pointerId, el);
  el.classList.add('c2-premuto');
  const i = el.dataset.b;
  if (i !== undefined) { c2.tenuti[i]++; c2.lampo[i] = true; }
  vibraC2(TOCCO_C2.vibra.bottone);
}

function rilasciaBottoneC2(pointerId, attiva) {
  const el = c2.puntatori.get(pointerId);
  if (!el) return false;
  c2.puntatori.delete(pointerId);
  const i = el.dataset.b;
  if (i !== undefined) c2.tenuti[i] = Math.max(0, c2.tenuti[i] - 1);
  let ancora = false;
  for (const altro of c2.puntatori.values()) if (altro === el) ancora = true;
  if (!ancora) el.classList.remove('c2-premuto');
  // lo schermo intero vuole un gesto «concluso»: parte al rilascio del dito
  if (attiva && el.dataset.nome === 'schermo') schermoInteroC2();
  return true;
}

function ruoloC2(x) {
  const sinistra = x < window.innerWidth / 2;
  return sinistra === !opzioneC2('toccoMancino') ? 'movimento' : 'sparo';
}

function levaGiuC2(e) {
  const ruolo = ruoloC2(e.clientX);
  const L = c2.leve[ruolo];
  if (L.id !== null) return;
  try { if (e.target && e.target.setPointerCapture) e.target.setPointerCapture(e.pointerId); } catch (_) { /* il tocco è già legato al suo bersaglio */ }
  L.id = e.pointerId;
  L.ox = L.x = L.px0 = e.clientX;
  L.oy = L.y = L.py0 = e.clientY;
  L.t0 = performance.now();
  L.corsa = 0; L.vx = 0; L.vy = 0; L.forza = 0;
  disegnaLevaC2(ruolo);
}

/** Aggiorna una levetta dal dito: l'anello segue il pollice oltre la corsa, gli assi del gamepad virtuale cambiano. */
function levaMuoviC2(ruolo, x, y) {
  const L = c2.leve[ruolo], C = TOCCO_C2.leva, R = c2.raggio;
  L.x = x; L.y = y;
  L.corsa = Math.max(L.corsa, Math.hypot(x - L.px0, y - L.py0));
  let dx = x - L.ox, dy = y - L.oy, d = Math.hypot(dx, dy);
  if (d > R) { // l'anello insegue il dito: la levetta non «finisce» mai sotto il pollice
    L.ox += (dx / d) * (d - R); L.oy += (dy / d) * (d - R);
    dx = x - L.ox; dy = y - L.oy; d = R;
  }
  const morta = (ruolo === 'movimento' ? C.mortaMovimento : C.mortaSparo) * R;
  const base = ruolo === 'movimento' ? 0 : 2;
  if (d <= morta) {
    L.vx = 0; L.vy = 0; L.forza = 0;
    padC2.axes[base] = 0; padC2.axes[base + 1] = 0;
  } else {
    const t = Math.min(1, (d - morta) / (R - morta));
    const minimo = ruolo === 'movimento' ? C.asseMinMovimento : C.asseMinSparo;
    const m = minimo + (1 - minimo) * t;
    L.vx = dx / d; L.vy = dy / d;
    L.forza = t >= C.pieno ? 1 : Math.max(C.forzaMinima, t / C.pieno);
    padC2.axes[base] = L.vx * m; padC2.axes[base + 1] = L.vy * m;
  }
  disegnaLevaC2(ruolo);
}

function levaSuC2(ruolo, tocco) {
  const L = c2.leve[ruolo];
  const breve = tocco && performance.now() - L.t0 < TOCCO_C2.tocco.brevissimoMs && L.corsa < TOCCO_C2.tocco.fermoPx;
  const x = L.px0, y = L.py0;
  L.id = null; L.vx = 0; L.vy = 0; L.forza = 0;
  const base = ruolo === 'movimento' ? 0 : 2;
  padC2.axes[base] = 0; padC2.axes[base + 1] = 0;
  disegnaLevaC2(ruolo);
  if (breve) clickSulPalcoC2(x, y);
}

/**
 * Un tocco breve e fermo sul palco diventa il click del gioco in quel punto (porta, piedistallo, banco,
 * minimappa, slot…): il «cammina fin lì e spara» finale lo ferma `toccoSulPalcoC2` in 70-input.js.
 */
function clickSulPalcoC2(cx, cy) {
  const R = canvas.getBoundingClientRect();
  if (cx < R.left || cx > R.right || cy < R.top || cy > R.bottom) return false;
  const opz = { bubbles: true, cancelable: true, view: window, clientX: cx, clientY: cy, button: 0, buttons: 1 };
  c2.clickSintetico = true;
  try {
    canvas.dispatchEvent(new MouseEvent('mousedown', opz));
    canvas.dispatchEvent(new MouseEvent('mouseup', Object.assign({}, opz, { buttons: 0 })));
  } finally { c2.clickSintetico = false; }
  return true;
}

/** Unico ascoltatore sempre acceso: il primo dito crea lo strato, un mouse vero lo nasconde. */
function suPuntatoreGiuC2(e) {
  if (e.pointerType !== 'touch') {
    if (e.isTrusted) { c2.ultimoPuntatore = e.pointerType || 'mouse'; if (c2.attivo) disattivaC2('mouse'); }
    return;
  }
  c2.ultimoPuntatore = 'touch';
  try {
    if (!c2.attivo) attivaC2();
    const bottone = e.target && e.target.closest ? e.target.closest('.c2-b') : null;
    if (bottone && c2.radice.contains(bottone)) { bottoneGiuC2(bottone, e); return; }
    if (!liberoB3(contestoB3()) || !sulloSfondoC2(e.target)) return; // nei menu il tocco resta un click del gioco
    e.preventDefault(); // in scena niente click di compatibilità: il dito guida una levetta
    levaGiuC2(e);
  } catch (err) { console.error('[c2] tocco', err); }
}

function suPuntatoreMuoviC2(e) {
  if (e.pointerType !== 'touch') return;
  const M = c2.leve.movimento, S = c2.leve.sparo;
  if (e.pointerId === M.id) levaMuoviC2('movimento', e.clientX, e.clientY);
  else if (e.pointerId === S.id) levaMuoviC2('sparo', e.clientX, e.clientY);
}

function suPuntatoreSuC2(e) {
  if (e.pointerType !== 'touch') return;
  c2.haToccato = true;
  const annullato = e.type === 'pointercancel';
  if (rilasciaBottoneC2(e.pointerId, !annullato)) return;
  if (e.pointerId === c2.leve.movimento.id) levaSuC2('movimento', !annullato);
  else if (e.pointerId === c2.leve.sparo.id) levaSuC2('sparo', !annullato);
}

function rilasciaTuttoC2() {
  for (const id of [...c2.puntatori.keys()]) rilasciaBottoneC2(id, false);
  c2.tenuti.fill(0);
  c2.lampo.fill(false);
  for (const nome of ['movimento', 'sparo']) { const L = c2.leve[nome]; L.id = null; L.vx = 0; L.vy = 0; L.forza = 0; }
  padC2.axes.fill(0);
  for (const b of padC2.buttons) { b.pressed = false; b.touched = false; b.value = 0; }
}

// ===========================================================================
// SCHERMO INTERO, SCHERMO ACCESO, VIBRAZIONE (tutto facoltativo: dove manca non succede niente)
// ===========================================================================

/** Schermo intero su tutta la pagina (non sul solo palco: i comandi a tocco stanno fuori dal palco). */
function schermoInteroC2() {
  try {
    const d = document, el = d.documentElement;
    let p = null;
    if (!schermoInteroAttivoC2()) {
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (!req) { c2.schermoNegato = true; return false; }
      p = req.call(el, { navigationUI: 'hide' });
      if (p && typeof p.catch === 'function') p.catch(() => { c2.schermoNegato = true; });
    } else {
      const esci = d.exitFullscreen || d.webkitExitFullscreen;
      p = esci && esci.call(d);
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }
    return true;
  } catch (_) { c2.schermoNegato = true; return false; }
}

/** Chiede di tenere lo schermo acceso (Wake Lock API); senza API, o se è negato, non fa niente. */
function tieniAccesoC2() {
  try {
    if (!c2.attivo || c2.veglia || !navigator.wakeLock || typeof navigator.wakeLock.request !== 'function') return;
    if (document.visibilityState !== 'visible') return;
    c2.veglia = 'attesa';
    navigator.wakeLock.request('screen').then((s) => {
      c2.veglia = s;
      try { s.addEventListener('release', () => { if (c2.veglia === s) c2.veglia = null; }); } catch (_) { /* sentinella senza eventi */ }
      if (!c2.attivo) lasciaSpegnereC2();
    }, () => { c2.veglia = null; });
  } catch (_) { c2.veglia = null; }
}

function lasciaSpegnereC2() {
  const s = c2.veglia;
  c2.veglia = null;
  try { if (s && typeof s.release === 'function') { const p = s.release(); if (p && typeof p.catch === 'function') p.catch(() => {}); } } catch (_) { /* già rilasciata */ }
}

// ===========================================================================
// ACCENSIONE E SPEGNIMENTO
// ===========================================================================

/** Il gamepad vero dà segni di vita (un bottone premuto o una levetta spinta dopo l'ultimo controllo)? */
function padVeroAttivoC2() {
  let lista = null;
  try { lista = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : null; } catch (_) { return false; }
  if (!lista) return false;
  let attivo = false;
  for (let i = 0; i < lista.length; i++) {
    const g = lista[i];
    if (!g || g.connected === false || !g.buttons || g.buttons.length < TOCCO_C2.padVero.bottoniMinimi) continue;
    let maschera = 0;
    for (let j = 0; j < g.buttons.length && j < 30; j++) {
      const b = g.buttons[j];
      if (b && (typeof b === 'object' ? b.pressed || b.value > 0.5 : b > 0.5)) maschera |= 1 << j;
    }
    const ax = g.axes || [];
    for (let j = 0; j < ax.length && j < 4; j++) if (Math.abs(Number(ax[j]) || 0) > TOCCO_C2.padVero.sogliaAsse) maschera |= 1 << 30;
    const prima = c2.padVeroPrima.get(i);
    if (prima !== undefined && (maschera & ~prima) !== 0) attivo = true; // solo ciò che è cambiato: un asse storto non conta
    c2.padVeroPrima.set(i, maschera);
  }
  return attivo;
}

function primaDelFrameC2() {
  const B = padC2.buttons;
  for (let i = 0; i < B.length; i++) {
    const giu = c2.tenuti[i] > 0 || c2.lampo[i]; // un tocco più corto di un fotogramma vale comunque un fotogramma
    c2.lampo[i] = false;
    if (B[i].pressed !== giu) { B[i].pressed = giu; B[i].touched = giu; B[i].value = giu ? 1 : 0; }
  }
  padC2.timestamp = performance.now();
  if (padVeroAttivoC2()) disattivaC2('pad');
}

function dopoIlFrameC2() {
  if (!c2.attivo) return;
  if (firmaDisposizioneC2() !== c2.firmaDisposizione) disponiC2();
  const c = contestoB3();
  const s = statoBottoniC2();
  const firma = [c, s.bombe, s.attivo, s.carica, s.max, s.cons, schermoInteroAttivoC2(), c2.schermoNegato].join('|');
  if (firma !== c2.firma) { c2.firma = firma; aggiornaVistaC2(c); }
  const mira = b3.pad.miraPrima;
  const dir = mira ? mira.slice(5).toLowerCase() : '';
  if (c2.leveEl.sparo.dataset.dir !== dir) c2.leveEl.sparo.dataset.dir = dir;
  if (c2.invitoFinoMs && performance.now() > c2.invitoFinoMs) { c2.invitoFinoMs = 0; c2.invito.classList.add('c2-via'); }
  // i riquadri sopra il gioco tolgono le dita dalle levette: quando si torna in scena si riparte da fermi
  if (!liberoB3(c) && (c2.leve.movimento.id !== null || c2.leve.sparo.id !== null)) {
    for (const nome of ['movimento', 'sparo']) if (c2.leve[nome].id !== null) levaSuC2(nome, false);
  }
}

/** Crea lo strato e aggancia ciò che serve SOLO quando si usa il tocco (mai eseguita su un PC senza dita). */
function installaC2() {
  if (c2.installato) return;
  c2.installato = true;
  for (const k of Object.keys(OPZIONI_C2_PREDEFINITE)) OPZIONI[k] = opzioneC2(k);
  creaStratoC2();

  window.addEventListener('pointermove', suPuntatoreMuoviC2, { capture: true, passive: true });
  window.addEventListener('pointerup', suPuntatoreSuC2, true);
  window.addEventListener('pointercancel', suPuntatoreSuC2, true);
  // una tastiera vera: lo strato si nasconde (i tasti sintetici di b3 non contano)
  window.addEventListener('keydown', (e) => { if (c2.attivo && e.isTrusted && e.code && !b3.inviando) disattivaC2('tastiera'); }, true);
  // niente menu del tasto lungo né «pizzico» mentre si gioca col dito
  window.addEventListener('contextmenu', (e) => { if (c2.attivo) e.preventDefault(); }, true);
  window.addEventListener('gesturestart', (e) => { if (c2.attivo) e.preventDefault(); }, true);
  window.addEventListener('resize', () => { aggiornaClassiC2(); if (c2.attivo) disponiC2(); });
  document.addEventListener('fullscreenchange', () => { c2.firma = ''; });
  document.addEventListener('webkitfullscreenchange', () => { c2.firma = ''; });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') tieniAccesoC2();
    else rilasciaTuttoC2(); // il telefono va in tasca: nessun dito resta «premuto»
  });
  window.addEventListener('blur', rilasciaTuttoC2);

  // il gamepad virtuale si aggiorna prima che b3 lo legga; la vista dei bottoni dopo il disegno
  const loopBaseC2 = loop;
  loop = function loopC2(oraMs) {
    if (c2.attivo) { try { primaDelFrameC2(); } catch (err) { console.error('[c2] gamepad virtuale', err); } }
    const r = loopBaseC2(oraMs);
    try { dopoIlFrameC2(); } catch (err) { console.error('[c2] strato', err); }
    return r;
  };

  // vibrazione del telefono su colpo subito ed esplosione (b3 fa vibrare solo i gamepad veri)
  const scuotiBaseC2 = scuoti;
  scuoti = function scuotiC2(voce, ...resto) {
    try {
      if (c2.attivo) {
        if (voce === FEEL.scossa.ferita) vibraC2(TOCCO_C2.vibra.colpo);
        else if (voce === FEEL.scossa.bomba) vibraC2(TOCCO_C2.vibra.esplosione);
      }
    } catch (_) { /* la vibrazione è facoltativa */ }
    return scuotiBaseC2.call(this, voce, ...resto);
  };
  window.__teatro.interni.scuoti = scuoti;

  // col tocco lo schermo intero è della pagina intera: dentro il solo palco i comandi non si vedrebbero
  const schermoBaseC2 = cambiaSchermoInteroB3;
  cambiaSchermoInteroB3 = function cambiaSchermoInteroC2(...a) {
    if (c2.attivo) return schermoInteroC2();
    return schermoBaseC2.apply(this, a);
  };
  const clickPausaBaseC2 = gestisciClickMenuPausa;
  gestisciClickMenuPausa = function gestisciClickMenuPausaC2(mx, my, ...resto) {
    if (c2.attivo && statoRun.pausa && !statoRun.diarioD) {
      const v = MENU_PAUSA_B3.voci.find((x) => x[0] === 'schermo');
      if (v && mx >= MENU_PAUSA_B3.x && mx <= MENU_PAUSA_B3.x + MENU_PAUSA_B3.w && my >= v[1] && my <= v[1] + MENU_PAUSA_B3.h) { schermoInteroC2(); return true; }
    }
    return clickPausaBaseC2.call(this, mx, my, ...resto);
  };
  window.__teatro.interni.gestisciClickMenuPausa = gestisciClickMenuPausa;
}

/** Il tocco entra in uso: lo strato compare e b3 legge il gamepad virtuale. */
function attivaC2() {
  installaC2();
  if (c2.attivo) return;
  c2.attivo = true;
  c2.radice.hidden = false;
  c2.firma = '';
  c2.padVeroPrima.clear();
  padVeroAttivoC2(); // stato di partenza dei gamepad veri: conta solo ciò che cambia da adesso
  segnaDispositivoB3('tocco');
  c2.invito.classList.remove('c2-via');
  c2.invitoFinoMs = performance.now() + TOCCO_C2.invitoMs;
  disponiC2();
  aggiornaVistaC2(contestoB3());
  tieniAccesoC2();
}

/** Arrivano tastiera, mouse o gamepad veri: lo strato si nasconde (un altro tocco lo riporta). */
function disattivaC2(motivo) {
  if (!c2.attivo) return;
  rilasciaTuttoC2();
  c2.attivo = false;
  c2.ultimoMotivo = motivo || '';
  if (c2.radice) c2.radice.hidden = true;
  lasciaSpegnereC2();
  aggiornaClassiC2();
  try { rilasciaPadB3(); } catch (_) { /* nessun tasto tenuto */ }
  if (b3.dispositivo === 'tocco') segnaDispositivoB3(motivo === 'pad' ? 'pad' : 'tastiera');
  if (b3.opz && b3.opz.pagina === 'tocco') cambiaPaginaB3('scena');
}

// ===========================================================================
// AVVIO
// ===========================================================================
c2.dispositivo = dispositivoAToccoC2();
if (c2.dispositivo) {
  // Telefono o tavoletta: il palco si mette subito al suo posto (in alto se il telefono è in piedi), la
  // risoluzione interna prende il suo tetto, e alla prima volta in assoluto partono le impostazioni leggere.
  try {
    iniettaStileC2('c2-stile-base', STILE_BASE_C2);
    aggiornaClassiC2();
    window.addEventListener('resize', aggiornaClassiC2);
    let salvate = null;
    try { salvate = localStorage.getItem('ferruccio.teatro.opzioni'); } catch (_) { salvate = null; }
    if (salvate === null) {
      Object.assign(OPZIONI, AVVIO_LEGGERO_C2);
      c2.avvioLeggero = true;
      salvaOpzioni();
    }
    adattaRisoluzione();
  } catch (err) { console.error('[c2] avvio', err); }
}
window.addEventListener('pointerdown', suPuntatoreGiuC2, true);

Object.assign(window.__teatro.interni, {
  TOCCO_C2, RISOLUZIONE_C2, AVVIO_LEGGERO_C2, OPZIONI_C2_PREDEFINITE,
  toccoC2: Object.freeze({
    /** Fotografia dello strato a tocco per la QA. */
    get stato() {
      const visibili = [];
      if (c2.attivo) for (const [nome, el] of Object.entries(c2.el)) if (!el.hidden) visibili.push(nome);
      return {
        dispositivo: c2.dispositivo, installato: c2.installato, attivo: c2.attivo, motivo: c2.ultimoMotivo || '', verticale: verticaleC2(),
        contesto: contestoB3(), dispositivoB3: b3.dispositivo, assi: padC2.axes.slice(),
        premuti: padC2.buttons.map((b, i) => (b.pressed ? i : -1)).filter((i) => i >= 0), visibili,
        leve: { movimento: c2.leve.movimento.id !== null, sparo: c2.leve.sparo.id !== null, forza: c2.leve.movimento.forza },
        veglia: Boolean(c2.veglia && c2.veglia !== 'attesa'), avvioLeggero: c2.avvioLeggero, schermoNegato: c2.schermoNegato,
        buffer: [canvas.width, canvas.height], tetto: tettoScalaC2(), ultimaVibrazione: c2.ultimaVibrazione,
      };
    },
    /** Rettangolo a schermo di un bottone o di una levetta (per i tocchi della QA). */
    rett(nome) {
      const el = c2.el[nome] || c2.leveEl[nome];
      if (!el || el.hidden) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    },
    /** (QA) accende o spegne il tetto di risoluzione dei dispositivi a tocco e ridimensiona subito il buffer. */
    tetto(acceso) { c2.tettoSpento = !acceso; adattaRisoluzione(); return [canvas.width, canvas.height]; },
    attiva: attivaC2,
    disattiva: disattivaC2,
    pad: padC2,
  }),
});
