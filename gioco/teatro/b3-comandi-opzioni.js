/*
 * teatro/b3-comandi-opzioni.js — (b3) Comandi e Opzioni.
 *   - GAMEPAD (Gamepad API, layout standard; va bene su Steam Deck): levetta sinistra/croce = movimento,
 *     levetta destra e A/B/X/Y = sparo nelle 4 direzioni (direzione dominante con isteresi, niente mira a 360°),
 *     dorsali e grilletti = oggetto attivo, interazione/bomba, consumabile; Start = pausa; Select = Diario.
 *   - MENU SENZA MOUSE: cursore nel menu di pausa, tasto del Diario in scena, gamepad in tutti i menu.
 *   - SIMBOLI dei comandi secondo l'ultimo dispositivo usato (tastiera o gamepad).
 *   - MENU OPZIONI (dal menu principale [O] e dal menu di pausa): volumi, scossa, effetti scenici, schermo
 *     intero, vibrazione, testo grande, rimappatura dei tasti con conflitti e «ripristina predefiniti».
 *
 * Come funziona: il resto del gioco legge sempre gli stessi codici «canonici» (KeyW, ArrowUp, KeyQ, KeyE, KeyF,
 * Escape, KeyO…). Questo file traduce verso quei codici sia i tasti rimappati sia il gamepad, inviando eventi
 * di tastiera sintetici: nessun altro file deve sapere che esistono.
 *
 * Agganci nei file di base: 70-input.js (il filtro `filtroIngressiB3` registrato per primo, in cattura) e
 * a8-musica.js (il volume della musica segue OPZIONI.volumeMusica). Tutto il resto avvolge funzioni globali
 * (loop, scuoti, offsetScossa, drawTextFit, drawPillLabel, disegnaMenuPausa, disegnaMenuSelezionePersonaggio,
 * disegnaCartiglioD) chiamando sempre la base.
 * Script classico, caricato dopo a7-registro-bilancio.js. QA: tools/qa-teatro-comandi.js.
 */

// ===========================================================================
// TABELLE (tutti i numeri e i testi di questo file)
// ===========================================================================

/** Azioni rimappabili: `canonico` è il codice che il resto del gioco legge (ed è anche il tasto predefinito). */
const COMANDI_B3 = Object.freeze({
  azioni: Object.freeze([
    { id: 'su', nome: 'Muovi su', canonico: 'KeyW' },
    { id: 'giu', nome: 'Muovi giù', canonico: 'KeyS' },
    { id: 'sinistra', nome: 'Muovi a sinistra', canonico: 'KeyA' },
    { id: 'destra', nome: 'Muovi a destra', canonico: 'KeyD' },
    { id: 'sparaSu', nome: 'Spara in su', canonico: 'ArrowUp' },
    { id: 'sparaGiu', nome: 'Spara in giù', canonico: 'ArrowDown' },
    { id: 'sparaSinistra', nome: 'Spara a sinistra', canonico: 'ArrowLeft' },
    { id: 'sparaDestra', nome: 'Spara a destra', canonico: 'ArrowRight' },
    { id: 'attivo', nome: 'Oggetto attivo', canonico: 'KeyQ' },
    { id: 'interagisci', nome: 'Interagisci / bomba', canonico: 'KeyE' },
    { id: 'consumabile', nome: 'Consumabile', canonico: 'KeyF' },
    { id: 'pausa', nome: 'Pausa', canonico: 'Escape' },
    { id: 'diario', nome: 'Diario degli oggetti', canonico: 'KeyO' },
  ].map((a) => Object.freeze(a))),
  // Tasti che non si assegnano: Invio conferma sempre nei menu, Esc mette sempre in pausa (ed è solo della Pausa),
  // gli altri appartengono al browser o al sistema.
  riservati: Object.freeze(['Enter', 'NumpadEnter', 'Escape', 'Tab', 'CapsLock', 'NumLock', 'ScrollLock', 'PrintScreen',
    'Pause', 'ContextMenu', 'MetaLeft', 'MetaRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight',
    'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12']),
  nomiTasti: Object.freeze({
    ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Space: 'Spazio', Escape: 'Esc', Enter: 'Invio',
    ShiftLeft: 'Maiusc sx', ShiftRight: 'Maiusc dx', Backspace: 'Backspace', Delete: 'Canc', Insert: 'Ins',
    Home: 'Inizio', End: 'Fine', PageUp: 'Pag↑', PageDown: 'Pag↓', Comma: ',', Period: '.', Minus: '-', Equal: '=',
    Semicolon: ';', Quote: '\'', BracketLeft: '[', BracketRight: ']', Backslash: '\\', Slash: '/', Backquote: '`',
    IntlBackslash: '<',
  }),
  tastoOpzioniMenu: 'KeyO', // nel menu principale apre le Opzioni (tasto fisico, non rimappabile)
});

/** Gamepad: zone morte, isteresi, soglie, ripetizione nei menu, bottoni (indici del layout standard), vibrazione. */
const PAD_B3 = Object.freeze({
  zonaMortaSinistra: 0.30,   // levetta sinistra: sotto questa ampiezza il burattino sta fermo
  rilascioSinistra: 0.22,    // isteresi: per fermarsi la levetta deve tornare sotto questo valore
  isteresiSettoreRad: 0.14,  // la levetta sinistra cambia direzione (8 settori) solo superato il confine di ~8°
  zonaMortaDestra: 0.38,     // levetta destra: sotto questa ampiezza non si spara
  rilascioDestra: 0.26,
  dominanza: 1.3,            // lo sparo cambia asse solo se il nuovo asse supera il vecchio di questo fattore
  sogliaGrilletto: 0.35,     // LT/RT analogici: premuti oltre questo valore
  sogliaBottone: 0.5,
  ripetiPrimoMs: 340,        // nei menu: tenendo una direzione, primo ritardo…
  ripetiPoiMs: 120,          // …e passo della ripetizione
  bottoni: Object.freeze({ A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, select: 8, start: 9, su: 12, giu: 13, sinistra: 14, destra: 15 }),
  quanti: 17,
  // in scena: bottone → azione (un colpo per pressione)
  tocchi: Object.freeze({ 4: 'consumabile', 5: 'interagisci', 6: 'attivo', 7: 'interagisci', 8: 'diario', 9: 'pausa' }),
  // in scena: bottone tenuto → sparo in quella direzione (A giù, B destra, X sinistra, Y su: come sono messi sul pad)
  sparo: Object.freeze({ 0: 'sparaGiu', 1: 'sparaDestra', 2: 'sparaSinistra', 3: 'sparaSu' }),
  vibrazione: Object.freeze({ // leggera: [durata ms, motore debole 0..1, motore forte 0..1], moltiplicati per OPZIONI.vibrazione
    colpo: Object.freeze({ ms: 130, debole: 0.45, forte: 0.20 }),
    esplosione: Object.freeze({ ms: 190, debole: 0.60, forte: 0.45 }),
  }),
  simboli: Object.freeze({
    su: 'Levetta S', giu: 'Levetta S', sinistra: 'Levetta S', destra: 'Levetta S',
    sparaSu: 'Levetta D', sparaGiu: 'Levetta D', sparaSinistra: 'Levetta D', sparaDestra: 'Levetta D',
    attivo: 'LT', interagisci: 'RB', consumabile: 'LB', pausa: 'Start', diario: 'Select',
  }),
});

/** Nei menu: cosa invia ogni bottone del gamepad, contesto per contesto ('@opzioni' apre le Opzioni). */
const PAD_MENU_B3 = Object.freeze({
  principale: Object.freeze({ A: 'Enter', B: 'Escape', X: 'Delete', Y: '@opzioni', start: 'Enter', nav: true }),
  conferma: Object.freeze({ A: 'Enter', B: 'Escape', nav: false }),
  pausa: Object.freeze({ A: 'Enter', B: 'Escape', start: 'Escape', select: 'KeyO', nav: true }),
  diario: Object.freeze({ A: 'Enter', B: 'Escape', Y: 'KeyC', start: 'Escape', select: 'KeyO', nav: true }),
  registro: Object.freeze({ A: 'Enter', B: 'Escape', X: 'KeyX', start: 'Escape', nav: false }),
  pergamena: Object.freeze({ A: 'Enter', B: 'Enter', start: 'Enter', nav: false }),
  pannello: Object.freeze({ A: 'Enter', B: 'Escape', nav: true }),
  sipario: Object.freeze({ A: 'Enter', B: 'Enter', start: 'Enter', nav: false }),
  dialogo: Object.freeze({ A: 'Enter', start: 'Escape', nav: true }),
  morte: Object.freeze({ nav: false }),
  menu: Object.freeze({ A: 'Enter', B: 'Escape', start: 'Escape', nav: true }),
});

/** Opzioni aggiunte da questo file a OPZIONI (00-config.js), con i loro predefiniti. */
const OPZIONI_B3_PREDEFINITE = Object.freeze({ vibrazione: 1, testoGrande: false });

/** «Testo grande»: di quanto crescono banner, cartiglio degli oggetti ed etichette (l'auto-fit li tiene nei riquadri). */
const TESTO_GRANDE_B3 = Object.freeze({ fattore: 1.3 });

/** Menu di pausa dell'autore (60-resa.js): posizione dei bottoni per il cursore, e bottone delle Opzioni. */
const MENU_PAUSA_B3 = Object.freeze({
  x: 202, w: 236, h: 26,
  voci: Object.freeze([['riprendi', 90], ['audio', 124], ['schermo', 158], ['ricomincia', 192], ['menu', 226], ['diario', 260]]),
  copri: Object.freeze({ x: 179, y: 294, w: 282, h: 37 }), // il riquadro «comandi» dell'autore: lo sostituisce il bottone
  opzioni: Object.freeze({ x: 202, y: 296, w: 236, h: 19 }),
  aiutoY: 327,
  fondo: '#140c08',
});

/** Bottone «Opzioni» del menu principale (a destra di «Inizia la commedia»). */
const BOTTONE_MENU_B3 = Object.freeze({ x: 494, y: 305, w: 118, h: 28 });

/** Cartiglio delle Opzioni: geometria e colori (oro su scuro, come il menu di pausa e i cartigli). */
const PANNELLO_B3 = Object.freeze({
  x: 96, y: 8, w: 448, h: 344,
  righeY: 50, rigaH: 15, rigaHTasti: 15.5, // 15 righe nella pagina «Suono e scena»
  margine: 18, etichettaX: 34, controlloX: 232, tacche: 10, taccaL: 12, taccaPasso: 14, taccaA: 8,
  colori: Object.freeze({
    velo: 'rgba(5, 3, 2, 0.9)', fondo: '#140c08', oro: '#f9cb40', bordoInterno: '#5a3818', rotolo: '#5c110b',
    scelta: '#63150d', testo: '#e6d2aa', testoScelto: '#ffffff', spento: '#8a6a3f', vuoto: '#2a1b10',
    pergamena: '#e6d2aa', inchiostro: '#2a1d14', nota: '#c9a679', piede: '#a8a29e',
  }),
});

const TESTI_B3 = Object.freeze({
  titolo: '✦ OPZIONI ✦',
  linguettaScena: 'SUONO E SCENA',
  linguettaTasti: 'COMANDI',
  acceso: 'ACCESO',
  spento: 'SPENTO',
  premiTasto: 'premi un tasto…',
  predefinito: (n) => `pred. ${n}`,
  bottoneMenu: '✦ OPZIONI',
  bottonePausa: '✦ OPZIONI E COMANDI',
  aiutoPausa: '↑↓ scegli · Invio: conferma · Esc: riprendi',
  aiutoPausaPad: '✥ scegli · Ⓐ conferma · Ⓑ riprendi · Select: diario',
  barraMenuPad: '✥ burattino e slot · Ⓐ inizia la commedia · Ⓧ cancella lo slot · Ⓨ opzioni',
  pattoPad: 'Ⓐ sì, stringo il patto · Ⓑ no',
  piedeScena: '↑↓ scegli · ←→ regola · Invio: cambia · Tab: comandi · Esc: chiudi',
  piedeScenaPad: '✥ scegli e regola · Ⓐ cambia · LB/RB: comandi · Ⓑ chiudi',
  piedeTasti: '↑↓ scegli · Invio: cambia il tasto · Backspace: predefinito · Esc: indietro',
  piedeTastiPad: '✥ scegli · Ⓐ cambia (poi premi il tasto sulla tastiera) · Ⓧ predefinito · Ⓑ indietro',
  piedeCattura: (az) => `Premi il nuovo tasto per «${az}» · Esc: annulla`,
  piedeConflitto: 'Invio: scambia i due tasti · Esc: annulla',
  conflitto: (tasto, altra) => `«${tasto}» è già il tasto di «${altra}». Li scambio?`,
  scambiati: (a, b) => `Scambiati i tasti di «${a}» e «${b}».`,
  assegnato: (az, tasto) => `«${az}» ora è «${tasto}».`,
  riservato: (tasto) => `«${tasto}» non si può assegnare: scegline un altro.`,
  tastiRipristinati: 'Tasti riportati ai predefiniti.',
  opzioniRipristinate: 'Opzioni riportate ai valori di partenza.',
  schermoNegato: 'Lo schermo intero vuole un tasto o un click: riprova con Invio.',
  notaPausa: 'Esc mette sempre in pausa, qualunque tasto tu scelga.',
  muto: 'L\'audio è muto: chiudi le opzioni e premi M per riaccenderlo.',
  legendaPad1: 'Gamepad: levetta sin. o croce muovi · levetta des. o Ⓐ Ⓑ Ⓧ Ⓨ spara nelle 4 direzioni',
  legendaPad2: 'LT attivo · RB / RT interagisci e bomba · LB consumabile · Start pausa · Select diario',
  // con il gamepad queste scritte dei file di base cambiano per intero
  interiPad: Object.freeze({
    'Frecce/WASD o click: scorri · Esc/O: torna al menu': '✥ scorri · Ⓑ torna al menu',
    'C: consumabili': 'Ⓨ consumabili',
    'C: oggetti · Esc/O: torna al menu': 'Ⓨ oggetti · Ⓑ torna al menu',
    'X: esporta il registro (JSON) · Esc / L: torna al menu': 'Ⓧ esporta il registro (JSON) · Ⓑ torna al menu',
    'Frecce/WASD o click: scegli · E/Invio (o secondo click): prendi · Esc: chiudi · ▪ azzurro = fuori dal pool della notte':
      '✥ scegli · Ⓐ prendi · Ⓑ chiudi · ▪ azzurro = fuori dal pool della notte',
    'Clicca qui o premi [SPAZIO / INVIO] per entrare nel Teatro': 'Premi Ⓐ per entrare nel Teatro',
  }),
});

/** Righe delle due pagine del menu Opzioni. tipo: barra (0..1 a decimi), spunta (sì/no), azione, tasto. */
const RIGHE_B3 = Object.freeze({
  scena: Object.freeze([
    { id: 'volumeEffetti', tipo: 'barra', nome: 'Volume degli effetti', nota: 'Colpi, passi, campane e tutti i rumori di scena.' },
    { id: 'volumeMusica', tipo: 'barra', nome: 'Volume della musica', nota: 'Mandolino, organetto e tammorra che accompagnano la notte.' },
    { id: 'scossa', tipo: 'barra', nome: 'Scossa dello schermo', nota: 'Quanto trema il palco sui colpi e sulle esplosioni. A zero resta fermo.' },
    { id: 'vibrazione', tipo: 'barra', nome: 'Vibrazione del gamepad', nota: 'Il gamepad vibra piano quando sei colpito e sulle esplosioni.' },
    { id: 'grana', tipo: 'spunta', nome: 'Grana', nota: 'La grana sottile sopra la scena.' },
    { id: 'vignetta', tipo: 'spunta', nome: 'Vignetta', nota: 'Il buio ai bordi del palco, come alla luce di una lanterna.' },
    { id: 'pubblico', tipo: 'spunta', nome: 'Pubblico', nota: 'Le ombre del pubblico in sala, davanti al palco.' },
    { id: 'lampi', tipo: 'spunta', nome: 'Lampi', nota: 'I lampi bianchi sui colpi. Spegnili se danno fastidio agli occhi.' },
    { id: 'ombre', tipo: 'spunta', nome: 'Ombre lunghe', nota: 'Le ombre delle marionette alla luce della ribalta. Spegnile se il gioco rallenta.' },
    { id: 'voce', tipo: 'spunta', nome: 'Voce del Burattinaio', nota: 'Le didascalie che presentano i boss e commentano la notte.' },
    { id: 'schermoIntero', tipo: 'spunta', nome: 'Schermo intero', nota: 'Il teatro a tutto schermo.' },
    { id: 'testoGrande', tipo: 'spunta', nome: 'Testo grande', nota: 'Scritte più grandi per avvisi, cartiglio degli oggetti ed etichette.' },
    { id: 'vaiTasti', tipo: 'azione', nome: 'Comandi della tastiera ▸', nota: 'Scegli i tasti di movimento, sparo, oggetti, pausa e diario.' },
    { id: 'predefiniti', tipo: 'azione', nome: 'Ripristina i predefiniti', nota: 'Riporta volumi ed effetti ai valori di partenza (i tasti non cambiano).' },
    { id: 'chiudi', tipo: 'azione', nome: 'Chiudi', nota: '' },
  ].map((r) => Object.freeze(r))),
  tasti: Object.freeze(COMANDI_B3.azioni.map((a) => Object.freeze({ id: a.id, tipo: 'tasto', nome: a.nome })).concat([
    Object.freeze({ id: 'predefinitiTasti', tipo: 'azione', nome: 'Ripristina i tasti predefiniti' }),
    Object.freeze({ id: 'indietro', tipo: 'azione', nome: '◂ Torna alle opzioni' }),
  ])),
});

// ===========================================================================
// STATO
// ===========================================================================
const CANONICO_B3 = Object.freeze(Object.fromEntries(COMANDI_B3.azioni.map((a) => [a.id, a.canonico])));
const NOME_AZIONE_B3 = Object.freeze(Object.fromEntries(COMANDI_B3.azioni.map((a) => [a.id, a.nome])));
const RISERVATI_B3 = new Set(COMANDI_B3.riservati);
const DIR_B3 = Object.freeze({ su: 1, giu: 2, sinistra: 4, destra: 8 });
// settori della levetta sinistra (atan2 con y verso il basso), da -4 a 4: maschera delle direzioni
const SETTORI_B3 = Object.freeze({ 0: 8, 1: 10, 2: 2, 3: 6, 4: 4, '-4': 4, '-3': 5, '-2': 1, '-1': 9 });

const b3 = {
  dispositivo: 'tastiera', // ultimo dispositivo usato: 'tastiera' (anche mouse) o 'pad'
  inviando: false,         // true mentre si invia un tasto sintetico (il filtro lo lascia passare)
  inverso: new Map(),      // tasto fisico → azione
  orfani: new Set(),       // codici canonici rimasti senza azione (il loro tasto è stato spostato)
  identita: true,          // tutti i tasti sono quelli predefiniti: il filtro non tocca niente
  adatta: false,           // le scritte dei comandi vanno adattate (gamepad o tasti rimappati)
  cacheTesti: new Map(),
  ambitoGrande: 0,         // >0 mentre si disegna qualcosa che «testo grande» ingrandisce
  dentroPillola: false,
  cursorePausa: 0,
  diarioDiretto: false,    // il Diario è stato aperto dalla scena: chiudendolo si torna a giocare
  opz: null,               // menu Opzioni aperto: { pagina, sel, cattura, conflitto, origine }
  avviso: null,            // { testo, finoMs }
  ultimaVibrazione: null,
  menuAperti: [],          // altri file: funzioni () => true se hanno un loro riquadro aperto (il pad lo tratta da menu)
  vociPausa: [],           // altri file: { id, rett() } bottoni in più del menu di pausa, per il cursore
  pad: {
    presente: false, contesto: '', prima: new Array(PAD_B3.quanti).fill(false), adesso: new Array(PAD_B3.quanti).fill(false),
    premutoIn: new Array(PAD_B3.quanti).fill(''), ordine: new Array(PAD_B3.quanti).fill(0), contatore: 0,
    settore: null, mascheraPrima: 0, asseSparo: null, miraPrima: null, navDir: null, navProssimo: 0,
    tenuti: new Set(), voluti: new Set(),
  },
};

const clamp01B3 = (v, pred = 1) => { const n = Number(v); return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : pred; };
const dentroB3 = (mx, my, r) => mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
function bloccaB3(e) { e.preventDefault(); e.stopImmediatePropagation(); }
function suonoB3(nome) { try { if (AudioSys && typeof AudioSys[nome] === 'function') AudioSys[nome](); } catch (_) { /* audio facoltativo */ } }

// ===========================================================================
// TASTI: assegnazioni, nomi, traduzione verso i codici canonici
// ===========================================================================

/** true se `code` non si può assegnare all'azione (Esc resta solo della Pausa). */
function riservatoB3(code, azione) {
  return !code || (RISERVATI_B3.has(code) && !(code === 'Escape' && azione === 'pausa'));
}

/** Mappa completa azione → tasto a partire da quella salvata; se è rotta o ha doppioni, i predefiniti. */
function tastiValidiB3(salvati) {
  const t = Object.assign({}, CANONICO_B3);
  if (!salvati || typeof salvati !== 'object') return t;
  for (const a of COMANDI_B3.azioni) {
    const c = salvati[a.id];
    if (typeof c === 'string' && !riservatoB3(c, a.id)) t[a.id] = c;
  }
  return new Set(Object.values(t)).size === COMANDI_B3.azioni.length ? t : Object.assign({}, CANONICO_B3);
}

/** Da chiamare dopo ogni cambio di OPZIONI.tasti: ricalcola la traduzione e rilascia i tasti tenuti. */
function ricostruisciTastiB3() {
  b3.inverso.clear();
  b3.orfani.clear();
  b3.identita = true;
  for (const a of COMANDI_B3.azioni) {
    b3.inverso.set(OPZIONI.tasti[a.id], a.id);
    if (OPZIONI.tasti[a.id] !== a.canonico) b3.identita = false;
  }
  for (const a of COMANDI_B3.azioni) if (!b3.inverso.has(a.canonico)) b3.orfani.add(a.canonico);
  aggiornaAdattaB3();
  rilasciaTuttoB3();
}

function rilasciaTuttoB3() {
  for (const k in keys) keys[k] = false;
  b3.pad.tenuti.clear();
}

/** Nome leggibile di un tasto (codice fisico): quello visto alla rimappatura, o uno ricavato dal codice. */
function etichettaTastoB3(code) {
  const E = OPZIONI.tastiEtichette;
  if (E && typeof E[code] === 'string' && E[code]) return E[code];
  if (COMANDI_B3.nomiTasti[code]) return COMANDI_B3.nomiTasti[code];
  let m = /^Key([A-Z])$/.exec(code);
  if (m) return m[1];
  m = /^Digit(\d)$/.exec(code);
  if (m) return m[1];
  m = /^Numpad(.+)$/.exec(code);
  if (m) return `Tn ${m[1]}`;
  return code;
}

/** Simbolo del comando di un'azione per l'ultimo dispositivo usato (es. «E» o «RB»). */
function simboloB3(azione) {
  if (b3.dispositivo === 'pad') return PAD_B3.simboli[azione] || '';
  return etichettaTastoB3(OPZIONI.tasti[azione] || CANONICO_B3[azione]);
}

/**
 * Codice canonico da inviare per un tasto fisico: lo stesso codice (nessuna traduzione), un altro codice, o
 * null (il tasto era di un'azione spostata altrove: in scena non fa più niente; nei menu resta com'è).
 */
function traduciTastoB3(code, inMenu) {
  if (b3.identita) return code;
  const az = b3.inverso.get(code);
  if (az) return CANONICO_B3[az];
  if (b3.orfani.has(code)) return (inMenu || code === 'Escape') ? code : null;
  return code;
}

function inviaTastoB3(tipo, code, ripetuto) {
  const prima = b3.inviando;
  b3.inviando = true;
  try {
    (document.body || document).dispatchEvent(new KeyboardEvent(tipo, { code, key: '', bubbles: true, cancelable: true, repeat: Boolean(ripetuto) }));
  } finally { b3.inviando = prima; }
}

function toccoB3(code) { inviaTastoB3('keydown', code); inviaTastoB3('keyup', code); }

function segnaDispositivoB3(d) {
  if (b3.dispositivo === d) return;
  b3.dispositivo = d;
  aggiornaAdattaB3();
}

function aggiornaAdattaB3() {
  b3.adatta = b3.dispositivo === 'pad' || !b3.identita;
  b3.cacheTesti.clear();
}

/** Assegna un tasto a un'azione; se era di un'altra azione i due tasti si scambiano. Salva e applica subito. */
function assegnaTastoB3(azione, code, etichetta) {
  if (!CANONICO_B3[azione] || riservatoB3(code, azione)) return false;
  const altra = b3.inverso.get(code);
  if (altra && altra !== azione) OPZIONI.tasti[altra] = OPZIONI.tasti[azione];
  OPZIONI.tasti[azione] = code;
  if (etichetta) OPZIONI.tastiEtichette[code] = etichetta;
  salvaOpzioni();
  ricostruisciTastiB3();
  return true;
}

/** Riporta tutti i tasti ai predefiniti. */
function ripristinaTastiB3() {
  OPZIONI.tasti = Object.assign({}, CANONICO_B3);
  OPZIONI.tastiEtichette = {};
  salvaOpzioni();
  ricostruisciTastiB3();
}

// ===========================================================================
// CONTESTO (chi riceve i comandi adesso)
// ===========================================================================

/**
 * Contesto dei comandi: 'gioco' e 'hub' (ci si muove), 'opzioni', oppure un menu ('principale', 'conferma',
 * 'pausa', 'diario', 'registro', 'pergamena', 'pannello', 'sipario', 'dialogo', 'morte', 'menu').
 */
function contestoB3() {
  if (b3.opz) return 'opzioni';
  const f = statoRun.fase;
  if (f === 'menu_selezione') return 'principale';
  const t3 = window.__teatroT3;
  if (t3 && t3.confermaPattoAperta) return 'conferma';
  if (statoRun.diarioD) return 'diario';
  const reg = window.__teatro.interni.registroA7;
  if (reg && reg.aperto) return 'registro';
  if (statoRun.pausa) return 'pausa';
  if (f === 'morte') return 'morte';
  if (reg && reg.pergamena) return 'pergamena';
  if (statoRun.pannelloB) return 'pannello';
  if (statoRun.siparioAttivo) return 'sipario';
  if (statoRun.scambioPendente) return 'menu';
  for (const fn of b3.menuAperti) { try { if (fn()) return 'menu'; } catch (_) { /* un altro file: non blocca i comandi */ } }
  try { const qa = window.__teatro.t4qa; if (qa && qa.dialogo) return 'dialogo'; } catch (_) { /* cartiglio a metà: come nessuno */ }
  if (f === 'hub') return 'hub';
  if (f === 'in_gioco') return 'gioco';
  return 'menu';
}

const liberoB3 = (c) => c === 'gioco' || c === 'hub';

/** true se sopra il menu di pausa c'è un altro riquadro (Diario, Registro, Opzioni, quelli di altri file). */
function sovrapposizionePausaB3() {
  if (statoRun.diarioD || b3.opz) return true;
  const reg = window.__teatro.interni.registroA7;
  if (reg && reg.aperto) return true;
  for (const fn of b3.menuAperti) { try { if (fn()) return true; } catch (_) { /* vedi sopra */ } }
  return false;
}

// ===========================================================================
// FILTRO DEGLI INGRESSI (registrato per primo, in cattura, da 70-input.js)
// ===========================================================================

/**
 * Vede ogni keydown/keyup/mousedown prima di tutti gli altri gestori: traduce i tasti rimappati, serve il menu
 * Opzioni, il cursore del menu di pausa e il tasto del Diario. Con i tasti predefiniti e nessun menu di questo
 * file aperto non tocca gli eventi.
 */
function filtroIngressiB3(e) {
  try {
    if (e.type === 'mousedown') mouseB3(e);
    else tastieraB3(e);
  } catch (err) { console.error('[b3] ingressi', err); }
}

function tastieraB3(e) {
  const giu = e.type === 'keydown';
  if (!b3.inviando) {
    segnaDispositivoB3('tastiera');
    const o = b3.opz;
    // scorciatoie del browser (Ctrl+R, F5, F11…): non si traducono, non si catturano, non si fermano
    const scorciatoia = e.ctrlKey || e.metaKey || e.altKey || /^F\d+$/.test(e.code);
    if (o && giu) { // le Opzioni prendono tutti i tasti (i rilasci passano: nessun tasto resta «premuto»)
      e.stopImmediatePropagation();
      if (scorciatoia) return;
      e.preventDefault();
      if (o.cattura) catturaTastoB3(e);
      else tastoOpzioniB3(e.code, e.repeat);
      return;
    }
    if (scorciatoia) return;
    if (giu && !e.repeat && statoRun.fase === 'menu_selezione' && e.code === COMANDI_B3.tastoOpzioniMenu) {
      bloccaB3(e);
      apriOpzioniB3('menu');
      return;
    }
    const canonico = traduciTastoB3(e.code, !b3.identita && !liberoB3(contestoB3()));
    if (canonico !== e.code) {
      bloccaB3(e);
      if (canonico) inviaTastoB3(e.type, canonico, e.repeat);
      return;
    }
  } else if (b3.opz && giu) { bloccaB3(e); return; }
  if (giu && tastoLogicoB3(e.code, e.repeat)) bloccaB3(e);
}

/** Tasti «logici» (già canonici): cursore del menu di pausa e Diario dalla scena. true = consumato. */
function tastoLogicoB3(code, ripetuto) {
  const f = statoRun.fase;
  if (f !== 'in_gioco' && f !== 'hub') return false;
  if (statoRun.pausa) {
    if (sovrapposizionePausaB3()) return false;
    if (code === 'ArrowUp' || code === 'KeyW') { muoviCursorePausaB3(-1); return true; }
    if (code === 'ArrowDown' || code === 'KeyS') { muoviCursorePausaB3(1); return true; }
    if (code === 'Enter' || code === 'NumpadEnter' || code === 'Space') { if (!ripetuto) attivaVocePausaB3(); return true; }
    return false;
  }
  if (code === CANONICO_B3.diario && !ripetuto && liberoB3(contestoB3())) { apriDiarioDirettoB3(); return true; }
  return false;
}

function coordB3(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
}

function mouseB3(e) {
  segnaDispositivoB3('tastiera');
  if (e.target !== canvas) return;
  const p = coordB3(e);
  if (b3.opz) { bloccaB3(e); clickOpzioniB3(p.x, p.y); return; }
  if (statoRun.fase === 'menu_selezione') {
    if (dentroB3(p.x, p.y, BOTTONE_MENU_B3)) { bloccaB3(e); apriOpzioniB3('menu'); }
    return;
  }
  if (statoRun.pausa && !sovrapposizionePausaB3()) {
    if (dentroB3(p.x, p.y, MENU_PAUSA_B3.opzioni)) { bloccaB3(e); apriOpzioniB3('pausa'); return; }
    const voci = vociPausaB3();
    for (let i = 0; i < voci.length; i++) if (dentroB3(p.x, p.y, voci[i].rett())) b3.cursorePausa = i; // il click prosegue
  }
}

// ===========================================================================
// MENU DI PAUSA: cursore, bottone delle Opzioni, Diario dalla scena
// ===========================================================================
const VOCI_PAUSA_BASE_B3 = MENU_PAUSA_B3.voci.map(([id, y]) => {
  const r = Object.freeze({ x: MENU_PAUSA_B3.x, y, w: MENU_PAUSA_B3.w, h: MENU_PAUSA_B3.h });
  return Object.freeze({ id, rett: () => r });
});
const VOCE_OPZIONI_B3 = Object.freeze({ id: 'opzioni', rett: () => MENU_PAUSA_B3.opzioni });

/** Bottoni del menu di pausa dall'alto in basso (autore, Opzioni, Registro, quelli aggiunti da altri file). */
function vociPausaB3() {
  const v = VOCI_PAUSA_BASE_B3.concat([VOCE_OPZIONI_B3]);
  if (typeof rettBottonePausaA7 === 'function') v.push({ id: 'registro', rett: rettBottonePausaA7 });
  for (const x of b3.vociPausa) if (x && typeof x.rett === 'function') v.push(x);
  return v.sort((a, b) => a.rett().y - b.rett().y);
}

function muoviCursorePausaB3(d) {
  const n = vociPausaB3().length;
  b3.cursorePausa = (b3.cursorePausa + d + n) % n;
  suonoB3('playPasso');
}

/** Attiva il bottone sotto il cursore: per quelli degli altri file è un click nel loro centro. */
function attivaVocePausaB3() {
  const voci = vociPausaB3();
  const v = voci[Math.min(b3.cursorePausa, voci.length - 1)];
  if (!v) return;
  if (v.id === 'opzioni') { apriOpzioniB3('pausa'); return; }
  const r = v.rett();
  gestisciClickMenuPausa(r.x + r.w / 2, r.y + r.h / 2);
}

/** Apre il Diario direttamente dalla scena (tasto del Diario o Select): chiudendolo si torna a giocare. */
function apriDiarioDirettoB3() {
  statoRun.pausa = true;
  apriDiarioD();
  b3.diarioDiretto = true;
}

function disegnaAggiuntePausaB3() {
  if (!statoRun.pausa || statoRun.diarioD) return;
  const M = MENU_PAUSA_B3;
  const pad = b3.dispositivo === 'pad';
  ctx.save();
  ctx.fillStyle = M.fondo;
  ctx.fillRect(M.copri.x, M.copri.y, M.copri.w, M.copri.h);
  const R = M.opzioni;
  ctx.fillStyle = '#22150d';
  ctx.fillRect(R.x, R.y, R.w, R.h);
  ctx.strokeStyle = '#7c5227';
  ctx.lineWidth = 1;
  ctx.strokeRect(R.x, R.y, R.w, R.h);
  drawTextFit(TESTI_B3.bottonePausa, W / 2, R.y + R.h / 2 + 3, R.w - 12, { size: 8.5, color: '#f9cb40', weight: 'bold' });
  drawTextFit(pad ? TESTI_B3.aiutoPausaPad : TESTI_B3.aiutoPausa, W / 2, M.aiutoY, 276, { size: 7, color: '#c9a679', weight: '' });
  if (!b3.opz) {
    const voci = vociPausaB3();
    const v = voci[Math.min(b3.cursorePausa, voci.length - 1)];
    if (v) {
      const r = v.rett();
      if (v.id !== 'riprendi') { // il rosso fisso di «Riprendi» si smorza: l'evidenza in vista è una sola
        const rr = VOCI_PAUSA_BASE_B3[0].rett();
        ctx.fillStyle = 'rgba(20, 12, 8, 0.6)';
        ctx.fillRect(rr.x, rr.y, rr.w, rr.h);
      }
      ctx.fillStyle = 'rgba(249, 203, 64, 0.14)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      const pulsa = 0.8 + 0.2 * Math.sin(performance.now() / 160);
      ctx.strokeStyle = `rgba(249, 203, 64, ${pulsa.toFixed(2)})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x - 1.5, r.y - 1.5, r.w + 3, r.h + 3);
      if (typeof cursoreB9 !== 'function' || !cursoreB9(r.x - 11, r.y + r.h / 2, 1)) drawTextFit('▶', r.x - 10, r.y + r.h / 2 + 3, 14, { size: 9, color: '#f9cb40' }); // --- b9: mano dell'autore, se c'è ---
      if (typeof cursoreB9 !== 'function' || !cursoreB9(r.x + r.w + 11, r.y + r.h / 2, -1)) drawTextFit('◀', r.x + r.w + 10, r.y + r.h / 2 + 3, 14, { size: 9, color: '#f9cb40' });
    }
  }
  ctx.restore();
}

const disegnaMenuPausaBaseB3 = disegnaMenuPausa;
disegnaMenuPausa = function disegnaMenuPausaB3(...args) {
  const r = disegnaMenuPausaBaseB3.apply(this, args);
  try { disegnaAggiuntePausaB3(); } catch (err) { console.error('[b3] pausa', err); }
  return r;
};

// ===========================================================================
// MENU PRINCIPALE: bottone delle Opzioni
// ===========================================================================
const disegnaMenuSelezioneBaseB3 = disegnaMenuSelezionePersonaggio;
disegnaMenuSelezionePersonaggio = function disegnaMenuSelezioneB3(...args) {
  const r = disegnaMenuSelezioneBaseB3.apply(this, args);
  try {
    const B = BOTTONE_MENU_B3;
    ctx.save();
    ctx.fillStyle = '#1c140e';
    ctx.fillRect(B.x, B.y, B.w, B.h);
    ctx.strokeStyle = '#8a5a2b';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(B.x, B.y, B.w, B.h);
    drawTextFit(TESTI_B3.bottoneMenu, B.x + B.w / 2, B.y + 12, B.w - 10, { size: 8.5, color: '#f9cb40' });
    drawTextFit(b3.dispositivo === 'pad' ? 'premi Ⓨ' : `click o [${etichettaTastoB3(COMANDI_B3.tastoOpzioniMenu)}]`, B.x + B.w / 2, B.y + 23, B.w - 10, { size: 7, color: '#c9a679', weight: '' });
    ctx.restore();
  } catch (err) { console.error('[b3] menu', err); }
  return r;
};

// ===========================================================================
// SCRITTE DEI COMANDI (ultimo dispositivo, tasti rimappati) E TESTO GRANDE
// ===========================================================================
const SONDA_TESTI_B3 = /\[|Spazio \/ E/;

/** Adatta una scritta dei file di base al dispositivo e ai tasti correnti (es. «[Click/E]» → «[RB]»). */
function adattaTestoB3(t) {
  if (typeof t !== 'string' || !t) return t;
  const noto = b3.cacheTesti.get(t);
  if (noto !== undefined) return noto;
  const pad = b3.dispositivo === 'pad';
  let r = t;
  if (t === 'Q') r = simboloB3('attivo');
  else if (t === 'F') r = simboloB3('consumabile');
  else if (pad && TESTI_B3.interiPad[t] !== undefined) r = TESTI_B3.interiPad[t];
  else if (SONDA_TESTI_B3.test(t)) {
    const E = simboloB3('interagisci');
    r = t.replace(/\[Click\/E\]/g, pad ? `[${E}]` : `[Click/${E}]`)
      .replace(/\[E\]/g, `[${E}]`)
      .replace(/\[E \/ Invio\]/g, pad ? '[Ⓐ]' : `[${E} / Invio]`)
      .replace(/\[Q\]/g, `[${simboloB3('attivo')}]`)
      .replace(/\[F\]/g, `[${simboloB3('consumabile')}]`)
      .replace(/\[ESC\]/g, `[${simboloB3('pausa').toUpperCase()}]`)
      .replace(/Spazio \/ E$/, pad ? 'Ⓐ' : `Spazio / ${E}`);
    if (pad) {
      r = r.replace(/\[SPAZIO \/ INVIO\]/g, '[Ⓐ]').replace(/\[Click \/ Spazio\]/g, '[Ⓐ]')
        .replace(/ \[[ROLM]\]$/, '');
    }
  }
  if (b3.cacheTesti.size > 500) b3.cacheTesti.clear();
  b3.cacheTesti.set(t, r);
  return r;
}

const drawTextFitBaseB3 = drawTextFit;
drawTextFit = function drawTextFitB3(text, x, y, maxW, opts) {
  const t = b3.adatta ? adattaTestoB3(text) : text;
  if (OPZIONI.testoGrande && !b3.dentroPillola && (b3.ambitoGrande > 0 || (text && text === statoRun.banner))) {
    opts = Object.assign({}, opts, { size: ((opts && opts.size) || 8.5) * TESTO_GRANDE_B3.fattore });
  }
  return drawTextFitBaseB3(t, x, y, maxW, opts);
};

const drawPillLabelBaseB3 = drawPillLabel;
drawPillLabel = function drawPillLabelB3(text, cx, cy, maxW, opts) {
  const t = b3.adatta ? adattaTestoB3(text) : text;
  if (!OPZIONI.testoGrande || b3.opz) return drawPillLabelBaseB3(t, cx, cy, maxW, opts);
  const eraDentro = b3.dentroPillola;
  b3.dentroPillola = true; // la pillola cresce con la scritta: dentro non si ingrandisce due volte
  try {
    return drawPillLabelBaseB3(t, cx, cy, maxW * TESTO_GRANDE_B3.fattore, Object.assign({}, opts, { size: ((opts && opts.size) || 8) * TESTO_GRANDE_B3.fattore }));
  } finally { b3.dentroPillola = eraDentro; }
};

const disegnaCartiglioDBaseB3 = disegnaCartiglioD;
disegnaCartiglioD = function disegnaCartiglioDB3(...args) {
  b3.ambitoGrande++;
  try { return disegnaCartiglioDBaseB3.apply(this, args); } finally { b3.ambitoGrande--; }
};

// ===========================================================================
// SCOSSA DELLO SCHERMO (OPZIONI.scossa) E VIBRAZIONE (OPZIONI.vibrazione)
// ===========================================================================
const offsetScossaBaseB3 = offsetScossa;
/** La scossa calcolata dal gioco, moltiplicata per OPZIONI.scossa (0 = schermo fermo). */
offsetScossa = function offsetScossaB3(dtMs) {
  const o = offsetScossaBaseB3(dtMs);
  const k = clamp01B3(OPZIONI.scossa);
  if (k >= 1 || (!o.x && !o.y)) return o;
  o.x = Math.round(o.x * k);
  o.y = Math.round(o.y * k);
  return o;
};

/** Vibrazione leggera del gamepad ('colpo' o 'esplosione'), se c'è, se è l'ultimo dispositivo usato e se non è a zero. */
function vibraB3(tipo, forza = clamp01B3(OPZIONI.vibrazione)) {
  const V = PAD_B3.vibrazione[tipo];
  if (!V || !(forza > 0) || b3.dispositivo !== 'pad') return false;
  const g = padCorrenteB3();
  const att = g && g.vibrationActuator;
  if (!att || typeof att.playEffect !== 'function') return false;
  try {
    const p = att.playEffect('dual-rumble', { startDelay: 0, duration: V.ms, weakMagnitude: V.debole * forza, strongMagnitude: V.forte * forza });
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch (_) { return false; }
  b3.ultimaVibrazione = { tipo, forza, tick };
  return true;
}

const scuotiBaseB3 = scuoti;
scuoti = function scuotiB3(voce, ...resto) {
  try {
    if (voce === FEEL.scossa.ferita) vibraB3('colpo');
    else if (voce === FEEL.scossa.bomba) vibraB3('esplosione');
  } catch (_) { /* la vibrazione è facoltativa */ }
  return scuotiBaseB3.call(this, voce, ...resto);
};

// ===========================================================================
// GAMEPAD
// ===========================================================================

/** Il gamepad in uso: il primo collegato col layout standard, altrimenti il primo collegato. */
function padCorrenteB3() {
  let lista = null;
  try { lista = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : null; } catch (_) { return null; }
  if (!lista) return null;
  let scelto = null;
  for (let i = 0; i < lista.length; i++) {
    const g = lista[i];
    if (!g || g.connected === false || !g.buttons || g.buttons.length < 10) continue;
    if (g.mapping === 'standard') return g;
    if (!scelto) scelto = g;
  }
  return scelto;
}

function premutoPadB3(g, i) {
  const b = g.buttons[i];
  if (!b) return false;
  if (typeof b !== 'object') return b > PAD_B3.sogliaBottone;
  const soglia = (i === PAD_B3.bottoni.LT || i === PAD_B3.bottoni.RT) ? PAD_B3.sogliaGrilletto : PAD_B3.sogliaBottone;
  return Boolean(b.pressed) || b.value > soglia;
}

/** Levetta sinistra → maschera delle direzioni (8 settori), con zona morta e isteresi. */
function direzioneMovimentoB3(x, y) {
  const P = b3.pad;
  const m = Math.hypot(x, y);
  if (m < (P.settore === null ? PAD_B3.zonaMortaSinistra : PAD_B3.rilascioSinistra)) { P.settore = null; return 0; }
  const ang = Math.atan2(y, x);
  let sett = Math.round(ang / (Math.PI / 4));
  if (P.settore !== null && sett !== P.settore) {
    let diff = ang - P.settore * (Math.PI / 4);
    while (diff > Math.PI) diff -= TAU;
    while (diff < -Math.PI) diff += TAU;
    if (Math.abs(diff) < Math.PI / 8 + PAD_B3.isteresiSettoreRad) sett = P.settore;
  }
  P.settore = sett;
  return SETTORI_B3[sett] || 0;
}

/** Levetta destra → azione di sparo nella direzione dominante (4 direzioni), con zona morta e isteresi. */
function direzioneSparoB3(x, y) {
  const P = b3.pad;
  const m = Math.hypot(x, y);
  if (m < (P.asseSparo === null ? PAD_B3.zonaMortaDestra : PAD_B3.rilascioDestra)) { P.asseSparo = null; return null; }
  const ax = Math.abs(x), ay = Math.abs(y);
  let asse = ax >= ay ? 'x' : 'y';
  if (P.asseSparo !== null && P.asseSparo !== asse) {
    const nuovo = asse === 'x' ? ax : ay, vecchio = asse === 'x' ? ay : ax;
    if (nuovo < vecchio * PAD_B3.dominanza) asse = P.asseSparo;
  }
  P.asseSparo = asse;
  if (asse === 'x') return x >= 0 ? 'sparaDestra' : 'sparaSinistra';
  return y >= 0 ? 'sparaGiu' : 'sparaSu';
}

function rilasciaPadB3() {
  const P = b3.pad;
  for (const c of P.tenuti) inviaTastoB3('keyup', c);
  P.tenuti.clear();
}

/** true quando è ora di muovere il cursore in un menu (prima pressione, poi ripetizione). */
function navRipetiB3(dir, ora) {
  const P = b3.pad;
  if (dir !== P.navDir) {
    P.navDir = dir;
    if (!dir) return false;
    P.navProssimo = ora + PAD_B3.ripetiPrimoMs;
    return true;
  }
  if (dir && ora >= P.navProssimo) { P.navProssimo = ora + PAD_B3.ripetiPoiMs; return true; }
  return false;
}

function direzioneNavB3(maschera) {
  const prima = b3.pad.navDir;
  if (maschera & DIR_B3.su && !(maschera & (DIR_B3.sinistra | DIR_B3.destra))) return 'ArrowUp';
  if (maschera & DIR_B3.giu && !(maschera & (DIR_B3.sinistra | DIR_B3.destra))) return 'ArrowDown';
  if (maschera & DIR_B3.sinistra && !(maschera & (DIR_B3.su | DIR_B3.giu))) return 'ArrowLeft';
  if (maschera & DIR_B3.destra && !(maschera & (DIR_B3.su | DIR_B3.giu))) return 'ArrowRight';
  return maschera ? prima : null; // in diagonale resta la direzione di prima
}

/** Una volta per frame: legge il gamepad e lo traduce nei tasti canonici secondo il contesto. */
function aggiornaPadB3(ora) {
  const P = b3.pad;
  const g = padCorrenteB3();
  if (!g) {
    if (P.presente) { P.presente = false; rilasciaPadB3(); P.prima.fill(false); P.navDir = null; }
    return;
  }
  P.presente = true;
  const B = PAD_B3.bottoni;
  const b = P.adesso;
  let attivita = false;
  for (let i = 0; i < PAD_B3.quanti; i++) {
    b[i] = premutoPadB3(g, i);
    if (b[i] && !P.prima[i]) attivita = true;
  }
  const ax = g.axes || [];
  const maschera = direzioneMovimentoB3(Number(ax[0]) || 0, Number(ax[1]) || 0)
    | (b[B.su] ? DIR_B3.su : 0) | (b[B.giu] ? DIR_B3.giu : 0) | (b[B.sinistra] ? DIR_B3.sinistra : 0) | (b[B.destra] ? DIR_B3.destra : 0);
  const mira = direzioneSparoB3(Number(ax[2]) || 0, Number(ax[3]) || 0);
  if (attivita || (maschera && !P.mascheraPrima) || (mira && !P.miraPrima)) segnaDispositivoB3('pad');

  const c = contestoB3();
  if (c !== P.contesto) {
    if (!liberoB3(c)) rilasciaPadB3();
    P.contesto = c;
  }
  for (let i = 0; i < PAD_B3.quanti; i++) {
    if (b[i] && !P.prima[i]) { P.premutoIn[i] = c; P.ordine[i] = ++P.contatore; }
  }
  if (c === 'opzioni') padOpzioniB3(b, maschera, ora);
  else if (liberoB3(c)) padLiberoB3(c, b, maschera, mira);
  else padMenuB3(c, b, maschera, ora);
  for (let i = 0; i < PAD_B3.quanti; i++) P.prima[i] = b[i];
  P.mascheraPrima = maschera;
  P.miraPrima = mira;
}

/** In scena e nell'hub: direzioni e sparo come tasti tenuti, il resto un colpo per pressione. */
function padLiberoB3(c, b, maschera, mira) {
  const P = b3.pad;
  const V = P.voluti;
  V.clear();
  if (maschera & DIR_B3.su) V.add(CANONICO_B3.su);
  if (maschera & DIR_B3.giu) V.add(CANONICO_B3.giu);
  if (maschera & DIR_B3.sinistra) V.add(CANONICO_B3.sinistra);
  if (maschera & DIR_B3.destra) V.add(CANONICO_B3.destra);
  if (c === 'gioco') {
    let az = mira;
    if (!az) {
      let meglio = 0;
      for (let i = 0; i < 4; i++) {
        if (b[i] && P.premutoIn[i] === 'gioco' && P.ordine[i] > meglio) { meglio = P.ordine[i]; az = PAD_B3.sparo[i]; }
      }
    }
    if (az) V.add(CANONICO_B3[az]);
  }
  for (const k of P.tenuti) if (!V.has(k)) { P.tenuti.delete(k); inviaTastoB3('keyup', k); }
  for (const k of V) if (!P.tenuti.has(k)) { P.tenuti.add(k); inviaTastoB3('keydown', k); }
  for (let i = 4; i < 10; i++) {
    if (b[i] && !P.prima[i] && PAD_B3.tocchi[i]) toccoB3(CANONICO_B3[PAD_B3.tocchi[i]]);
  }
  if (c === 'hub' && b[PAD_B3.bottoni.A] && !P.prima[PAD_B3.bottoni.A]) toccoB3(CANONICO_B3.interagisci);
}

/** Nei menu: croce/levetta = frecce (con ripetizione), i bottoni secondo PAD_MENU_B3. */
function padMenuB3(c, b, maschera, ora) {
  const P = b3.pad;
  const T = PAD_MENU_B3[c] || PAD_MENU_B3.menu;
  const dir = T.nav ? direzioneNavB3(maschera) : null;
  if (navRipetiB3(dir, ora)) toccoB3(dir);
  for (const nome of ['A', 'B', 'X', 'Y', 'start', 'select']) {
    const i = PAD_B3.bottoni[nome];
    if (!b[i] || P.prima[i]) continue;
    const invio = T[nome];
    if (invio === '@opzioni') apriOpzioniB3(c === 'principale' ? 'menu' : 'pausa');
    else if (invio) toccoB3(invio);
    if (contestoB3() !== c) break; // il menu è cambiato: gli altri bottoni di questo frame non contano
  }
}

function padOpzioniB3(b, maschera, ora) {
  const P = b3.pad;
  const B = PAD_B3.bottoni;
  const o = b3.opz;
  const premuto = (i) => b[i] && !P.prima[i];
  const libero = !o.cattura && !o.conflitto;
  const dir = libero ? direzioneNavB3(maschera) : null;
  if (navRipetiB3(dir, ora)) tastoOpzioniB3(dir, false);
  if (premuto(B.B)) tastoOpzioniB3('Escape', false);
  else if (premuto(B.A)) tastoOpzioniB3('Enter', false);
  else if (premuto(B.X) && libero) tastoOpzioniB3('Backspace', false);
  else if ((premuto(B.LB) || premuto(B.RB)) && libero) tastoOpzioniB3('Tab', false);
  else if (premuto(B.start) && libero) chiudiOpzioniB3();
}

// ===========================================================================
// MENU OPZIONI
// ===========================================================================

/** Apre il menu Opzioni ('menu' = dal menu principale, 'pausa' = dal menu di pausa). */
function apriOpzioniB3(origine) {
  if (b3.opz) return;
  rilasciaPadB3();
  rilasciaTuttoB3();
  b3.opz = { pagina: 'scena', sel: 0, cattura: null, conflitto: null, origine: origine || 'menu' };
  b3.avviso = null;
  b3.pad.navDir = null;
  suonoB3('playPasso');
}

/** Chiude il menu Opzioni (le opzioni sono già salvate a ogni modifica). */
function chiudiOpzioniB3() {
  if (!b3.opz) return;
  b3.opz = null;
  b3.avviso = null;
  rilasciaTuttoB3();
}

function avvisoB3(testo, ms = 2600) { b3.avviso = { testo, finoMs: performance.now() + ms }; }

function schermoInteroAttivoB3() { return Boolean(document.fullscreenElement || document.webkitFullscreenElement); }

function cambiaSchermoInteroB3() {
  try {
    if (!schermoInteroAttivoB3()) {
      const el = wrap || document.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      const p = req && req.call(el);
      if (p && typeof p.catch === 'function') p.catch(() => avvisoB3(TESTI_B3.schermoNegato));
    } else {
      const esci = document.exitFullscreen || document.webkitExitFullscreen;
      const p = esci && esci.call(document);
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }
  } catch (_) { avvisoB3(TESTI_B3.schermoNegato); }
}

function valoreOpzioneB3(id) { return id === 'schermoIntero' ? schermoInteroAttivoB3() : OPZIONI[id]; }

/** Cambia un'opzione, la salva e la applica subito. */
function impostaOpzioneB3(id, valore) {
  if (id === 'schermoIntero') { if (Boolean(valore) !== schermoInteroAttivoB3()) cambiaSchermoInteroB3(); return; }
  if (OPZIONI[id] === valore) return;
  OPZIONI[id] = valore;
  salvaOpzioni();
  if (id === 'volumeEffetti') { void AudioSys.uscita; suonoB3('playMoneta'); } // il nodo d'uscita rilegge il volume: un tintinnio di prova
  else if (id === 'vibrazione') vibraB3('colpo');
  else suonoB3('playPasso');
}

function cambiaPaginaB3(pagina) {
  const o = b3.opz;
  if (!o || o.pagina === pagina) return;
  o.pagina = pagina;
  o.sel = pagina === 'tasti' ? 0 : RIGHE_B3.scena.findIndex((r) => r.id === 'vaiTasti');
  suonoB3('playPasso');
}

function regolaRigaB3(r, d) {
  if (r.tipo === 'barra') impostaOpzioneB3(r.id, Math.max(0, Math.min(10, Math.round(clamp01B3(OPZIONI[r.id]) * 10) + d)) / 10);
  else if (r.tipo === 'spunta') impostaOpzioneB3(r.id, d > 0);
}

function attivaRigaB3(r) {
  const o = b3.opz;
  if (r.tipo === 'barra') { const v = Math.round(clamp01B3(OPZIONI[r.id]) * 10); impostaOpzioneB3(r.id, (v >= 10 ? 0 : v + 1) / 10); }
  else if (r.tipo === 'spunta') impostaOpzioneB3(r.id, !valoreOpzioneB3(r.id));
  else if (r.tipo === 'tasto') { o.cattura = r.id; b3.avviso = null; }
  else if (r.id === 'vaiTasti') cambiaPaginaB3('tasti');
  else if (r.id === 'indietro') cambiaPaginaB3('scena');
  else if (r.id === 'chiudi') chiudiOpzioniB3();
  else if (r.id === 'predefiniti') {
    Object.assign(OPZIONI, OPZIONI_PREDEFINITE, OPZIONI_B3_PREDEFINITE);
    salvaOpzioni();
    void AudioSys.uscita;
    avvisoB3(TESTI_B3.opzioniRipristinate);
  } else if (r.id === 'predefinitiTasti') { ripristinaTastiB3(); avvisoB3(TESTI_B3.tastiRipristinati); }
}

/** Tasti del menu Opzioni (fissi: frecce/WASD, Invio/Spazio, Tab, Backspace, Esc). */
function tastoOpzioniB3(code, ripetuto) {
  const o = b3.opz;
  if (!o) return;
  if (o.cattura) { if (code === 'Escape') o.cattura = null; return; }
  if (o.conflitto) {
    const k = o.conflitto;
    if (code === 'Enter' || code === 'NumpadEnter') {
      o.conflitto = null;
      assegnaTastoB3(k.azione, k.code, k.etichetta);
      avvisoB3(TESTI_B3.scambiati(NOME_AZIONE_B3[k.azione], NOME_AZIONE_B3[k.altra]));
    } else if (code === 'Escape' || code === 'Backspace') o.conflitto = null;
    return;
  }
  const righe = RIGHE_B3[o.pagina];
  const n = righe.length;
  const r = righe[o.sel];
  if (code === 'ArrowUp' || code === 'KeyW') { o.sel = (o.sel - 1 + n) % n; suonoB3('playPasso'); }
  else if (code === 'ArrowDown' || code === 'KeyS') { o.sel = (o.sel + 1) % n; suonoB3('playPasso'); }
  else if (code === 'ArrowLeft' || code === 'KeyA') regolaRigaB3(r, -1);
  else if (code === 'ArrowRight' || code === 'KeyD') regolaRigaB3(r, 1);
  else if (ripetuto) return;
  else if (code === 'Enter' || code === 'NumpadEnter' || code === 'Space') attivaRigaB3(r);
  else if (code === 'Tab') cambiaPaginaB3(o.pagina === 'scena' ? 'tasti' : 'scena');
  else if ((code === 'Backspace' || code === 'Delete') && r.tipo === 'tasto') {
    const pred = CANONICO_B3[r.id];
    const altra = b3.inverso.get(pred);
    assegnaTastoB3(r.id, pred, null);
    avvisoB3(altra && altra !== r.id ? TESTI_B3.scambiati(r.nome, NOME_AZIONE_B3[altra]) : TESTI_B3.assegnato(r.nome, etichettaTastoB3(pred)));
  } else if (code === 'Escape') { if (o.pagina === 'tasti') cambiaPaginaB3('scena'); else chiudiOpzioniB3(); }
}

/** Rimappatura: il prossimo tasto fisico premuto diventa il tasto dell'azione in cattura. */
function catturaTastoB3(e) {
  const o = b3.opz;
  if (e.repeat) return;
  const code = e.code;
  if (code === 'Escape') { o.cattura = null; return; }
  const azione = o.cattura;
  const visto = typeof e.key === 'string' && e.key.length === 1 && e.key !== ' ' ? e.key.toUpperCase() : null;
  const etichetta = visto && visto !== etichettaTastoB3(code) && !COMANDI_B3.nomiTasti[code] ? visto : null;
  if (riservatoB3(code, azione)) { avvisoB3(TESTI_B3.riservato(etichetta || etichettaTastoB3(code))); return; }
  o.cattura = null;
  const altra = b3.inverso.get(code);
  if (altra && altra !== azione) { o.conflitto = { azione, code, altra, etichetta }; return; }
  assegnaTastoB3(azione, code, etichetta);
  avvisoB3(TESTI_B3.assegnato(NOME_AZIONE_B3[azione], etichetta || etichettaTastoB3(code)));
}

const altezzaRigaB3 = (pagina) => (pagina === 'tasti' ? PANNELLO_B3.rigaHTasti : PANNELLO_B3.rigaH);

function clickOpzioniB3(mx, my) {
  const o = b3.opz;
  if (!o) return;
  if (o.cattura) { o.cattura = null; return; }
  if (o.conflitto) { o.conflitto = null; return; }
  const P = PANNELLO_B3;
  if (mx < P.x || mx > P.x + P.w || my < P.y || my > P.y + P.h) { tastoOpzioniB3('Escape', false); return; }
  if (my >= P.y + 27 && my <= P.y + 44) { cambiaPaginaB3(mx < W / 2 ? 'scena' : 'tasti'); return; }
  const righe = RIGHE_B3[o.pagina];
  const i = Math.floor((my - (P.y + P.righeY)) / altezzaRigaB3(o.pagina));
  if (i < 0 || i >= righe.length || mx < P.x + P.margine || mx > P.x + P.w - P.margine) return;
  o.sel = i;
  const r = righe[i];
  const cx = P.x + P.margine + P.controlloX;
  if (r.tipo === 'barra') {
    if (mx >= cx - 12) impostaOpzioneB3(r.id, Math.max(0, Math.min(P.tacche, Math.floor((mx - cx) / P.taccaPasso) + 1)) / P.tacche);
  } else attivaRigaB3(r);
}

function disegnaRigaOpzioniB3(r, y, h, scelta) {
  const P = PANNELLO_B3, C = P.colori;
  const o = b3.opz;
  const x0 = P.x + P.margine, w0 = P.w - P.margine * 2;
  const yT = y + h / 2 + 2.5;
  if (scelta) {
    ctx.fillStyle = C.scelta;
    ctx.fillRect(x0, y, w0, h - 2);
    ctx.strokeStyle = C.oro;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x0, y, w0, h - 2);
    if (typeof cursoreB9 !== 'function' || !cursoreB9(x0 + 9, yT - 3, 1)) drawTextFitBaseB3('▶', x0 + 9, yT, 12, { size: 8, color: C.oro }); // --- b9: mano dell'autore, se c'è ---
  }
  const colore = scelta ? C.testoScelto : C.testo;
  if (r.tipo === 'azione') {
    drawTextFitBaseB3(r.nome, W / 2, yT, w0 - 60, { size: 8.5, color: scelta ? C.oro : C.testo });
    return;
  }
  drawTextFitBaseB3(r.nome, x0 + P.etichettaX - 14, yT, P.controlloX - P.etichettaX, { size: 8.5, color: colore, align: 'left' });
  const cx = x0 + P.controlloX;
  if (r.tipo === 'barra') {
    const piene = Math.round(clamp01B3(OPZIONI[r.id]) * P.tacche);
    for (let i = 0; i < P.tacche; i++) {
      ctx.fillStyle = i < piene ? (scelta ? C.oro : '#c9a23a') : C.vuoto;
      ctx.fillRect(cx + i * P.taccaPasso, y + (h - 2 - P.taccaA) / 2, P.taccaL, P.taccaA);
      ctx.strokeStyle = C.bordoInterno;
      ctx.lineWidth = 1;
      ctx.strokeRect(cx + i * P.taccaPasso + 0.5, y + (h - 2 - P.taccaA) / 2 + 0.5, P.taccaL - 1, P.taccaA - 1);
    }
    drawTextFitBaseB3(`${piene * 10}%`, x0 + w0 - 8, yT, 30, { size: 8, color: colore, align: 'right' });
  } else if (r.tipo === 'spunta') {
    const si = Boolean(valoreOpzioneB3(r.id));
    const ly = y + (h - 2 - 9) / 2;
    if (typeof interruttoreB9 !== 'function' || !interruttoreB9(cx, ly, si)) { // --- b9: lanterna dell'autore, se c'è (b9-immagini.js) ---
    ctx.fillStyle = si ? '#7a1c12' : C.vuoto;
    ctx.fillRect(cx, ly, 28, 9);
    ctx.strokeStyle = si ? C.oro : C.bordoInterno;
    ctx.lineWidth = 1;
    ctx.strokeRect(cx + 0.5, ly + 0.5, 27, 8);
    ctx.fillStyle = si ? C.oro : C.spento;
    ctx.fillRect(si ? cx + 16 : cx + 2, ly + 2, 10, 5);
    } // --- b9: fine dell'interruttore a codice ---
    drawTextFitBaseB3(si ? TESTI_B3.acceso : TESTI_B3.spento, cx + 38, yT, 80, { size: 8, color: si ? C.oro : C.spento, align: 'left' });
  } else if (r.tipo === 'tasto') {
    if (o.cattura === r.id) {
      // in attesa del tasto: casella vuota bordata d'oro e scritta che pulsa fra oro e bianco (sempre leggibile)
      const acceso = Math.floor(performance.now() / 350) % 2 === 0;
      ctx.strokeStyle = C.oro;
      ctx.lineWidth = 1;
      ctx.strokeRect(cx + 0.5, y + 1.5, 21, h - 5);
      drawTextFitBaseB3('?', cx + 11, yT, 18, { size: 8, color: C.oro });
      drawTextFitBaseB3(TESTI_B3.premiTasto, cx + 30, yT, 140, { size: 8.5, color: acceso ? C.oro : C.testoScelto, align: 'left' });
      return;
    }
    const nome = etichettaTastoB3(OPZIONI.tasti[r.id]);
    ctx.font = 'bold 8px ui-monospace, monospace';
    const kw = Math.max(22, Math.ceil(ctx.measureText(nome).width) + 12);
    if (typeof tastoPergamenaB9 !== 'function' || !tastoPergamenaB9(cx, y + 1, kw, h - 4)) { // --- b9: tasto di pergamena dell'autore, se c'è (b9-immagini.js) ---
    ctx.fillStyle = C.pergamena;
    ctx.fillRect(cx, y + 1, kw, h - 4);
    ctx.strokeStyle = scelta ? C.oro : '#5c4024';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx + 0.5, y + 1.5, kw - 1, h - 5);
    } // --- b9: fine del tasto a codice ---
    drawTextFitBaseB3(nome, cx + kw / 2, yT, kw - 4, { size: 8, color: C.inchiostro, shadow: false });
    if (OPZIONI.tasti[r.id] !== CANONICO_B3[r.id]) {
      drawTextFitBaseB3(TESTI_B3.predefinito(etichettaTastoB3(CANONICO_B3[r.id])), x0 + w0 - 8, yT, 70, { size: 7, color: C.spento, align: 'right', weight: '' });
    }
  }
}

function disegnaOpzioniB3() {
  const o = b3.opz;
  if (!o) return;
  const P = PANNELLO_B3, C = P.colori;
  const pad = b3.dispositivo === 'pad';
  const righe = RIGHE_B3[o.pagina];
  const hR = altezzaRigaB3(o.pagina);
  ctx.save();
  ctx.fillStyle = C.velo;
  ctx.fillRect(0, 0, W, H);
  // cartiglio: fondo scuro, doppio bordo d'oro, i due rotoli ai lati
  if (typeof cartiglioOpzioniB9 !== 'function' || !cartiglioOpzioniB9(P)) { // --- b9: cornice dell'autore, se c'è (b9-immagini.js) ---
  ctx.fillStyle = C.fondo;
  ctx.fillRect(P.x, P.y, P.w, P.h);
  ctx.strokeStyle = C.oro;
  ctx.lineWidth = 2;
  ctx.strokeRect(P.x, P.y, P.w, P.h);
  ctx.strokeStyle = C.bordoInterno;
  ctx.lineWidth = 1;
  ctx.strokeRect(P.x + 4, P.y + 4, P.w - 8, P.h - 8);
  ctx.fillStyle = C.rotolo;
  ctx.fillRect(P.x - 9, P.y - 2, 8, P.h + 4);
  ctx.fillRect(P.x + P.w + 1, P.y - 2, 8, P.h + 4);
  ctx.strokeStyle = C.oro;
  ctx.strokeRect(P.x - 8.5, P.y - 1.5, 7, P.h + 3);
  ctx.strokeRect(P.x + P.w + 1.5, P.y - 1.5, 7, P.h + 3);
  } // --- b9: fine del cartiglio a codice ---
  drawTextFitBaseB3(TESTI_B3.titolo, W / 2, P.y + 20, P.w - 40, { size: 12, color: C.oro });
  // linguette delle due pagine
  const lx = [P.x + P.w * 0.3, P.x + P.w * 0.7];
  [['scena', TESTI_B3.linguettaScena], ['tasti', TESTI_B3.linguettaTasti]].forEach(([id, nome], i) => {
    const att = o.pagina === id;
    drawTextFitBaseB3(nome, lx[i], P.y + 38, 150, { size: 8.5, color: att ? C.oro : C.spento });
    if (att) { ctx.fillStyle = C.oro; ctx.fillRect(lx[i] - 50, P.y + 42, 100, 1.5); }
  });
  ctx.fillStyle = C.bordoInterno;
  ctx.fillRect(P.x + 16, P.y + 45, P.w - 32, 1);
  for (let i = 0; i < righe.length; i++) disegnaRigaOpzioniB3(righe[i], P.y + P.righeY + i * hR, hR, i === o.sel);

  const r = righe[o.sel];
  const yNote = P.y + P.righeY + righe.length * hR;
  if (o.pagina === 'scena') {
    const muto = !AudioSys.attivo && (r.id === 'volumeEffetti' || r.id === 'volumeMusica');
    const nota = muto ? TESTI_B3.muto : r.nota;
    if (nota) drawTextFitBaseB3(nota, W / 2, yNote + 16, P.w - 44, { size: 8, color: muto ? '#fca5a5' : C.nota, weight: '', style: 'italic' });
  } else {
    drawTextFitBaseB3(TESTI_B3.legendaPad1, W / 2, yNote + 10, P.w - 36, { size: 6.5, color: C.nota, weight: '' });
    drawTextFitBaseB3(TESTI_B3.legendaPad2, W / 2, yNote + 19, P.w - 36, { size: 6.5, color: C.nota, weight: '' });
  }
  let piede;
  if (o.cattura) piede = TESTI_B3.piedeCattura(NOME_AZIONE_B3[o.cattura]);
  else if (o.conflitto) piede = TESTI_B3.piedeConflitto;
  else if (o.pagina === 'scena') piede = pad ? TESTI_B3.piedeScenaPad : TESTI_B3.piedeScena;
  else piede = r.id === 'pausa' ? TESTI_B3.notaPausa : (pad ? TESTI_B3.piedeTastiPad : TESTI_B3.piedeTasti);
  drawTextFitBaseB3(piede, W / 2, P.y + P.h - 9, P.w - 28, { size: 7, color: o.cattura || o.conflitto ? C.oro : C.piede, weight: '' });
  if (o.conflitto) {
    const k = o.conflitto;
    drawPillLabelBaseB3(TESTI_B3.conflitto(k.etichetta || etichettaTastoB3(k.code), NOME_AZIONE_B3[k.altra]), W / 2, P.y + P.h - 22, P.w - 40, { size: 8, color: '#fca5a5', border: '#ef4444' });
  } else if (b3.avviso) {
    if (performance.now() > b3.avviso.finoMs) b3.avviso = null;
    else drawPillLabelBaseB3(b3.avviso.testo, W / 2, P.y + P.h - 22, P.w - 40, { size: 8 });
  }
  ctx.restore();
}

// ===========================================================================
// CICLO: il gamepad prima della logica, i riquadri di questo file sopra tutto
// ===========================================================================
function dopoIlFrameB3() {
  if (!statoRun.pausa) b3.cursorePausa = 0;
  if (b3.diarioDiretto && !statoRun.diarioD) {
    b3.diarioDiretto = false;
    statoRun.pausa = false;
  }
  if (b3.opz) { disegnaOpzioniB3(); return; }
  if (b3.dispositivo !== 'pad') return;
  if (statoRun.fase === 'menu_selezione') {
    drawPillLabelBaseB3(TESTI_B3.barraMenuPad, W / 2, 357, 560, { size: 7, color: '#e6d2aa' });
  } else if (window.__teatroT3 && window.__teatroT3.confermaPattoAperta) {
    drawPillLabelBaseB3(TESTI_B3.pattoPad, W / 2, 282, 320, { size: 8 });
  }
}

const loopBaseB3 = loop;
loop = function loopB3(oraMs) {
  try { aggiornaPadB3(Number.isFinite(oraMs) ? oraMs : performance.now()); } catch (err) { console.error('[b3] gamepad', err); }
  const r = loopBaseB3(oraMs);
  try { dopoIlFrameB3(); } catch (err) { console.error('[b3] disegno', err); }
  return r;
};

// ===========================================================================
// AVVIO: opzioni di questo file, tasti salvati, sonda QA
// ===========================================================================
for (const k of Object.keys(OPZIONI_B3_PREDEFINITE)) {
  if (typeof OPZIONI[k] !== typeof OPZIONI_B3_PREDEFINITE[k]) OPZIONI[k] = OPZIONI_B3_PREDEFINITE[k];
}
OPZIONI.tasti = tastiValidiB3(OPZIONI.tasti);
if (!OPZIONI.tastiEtichette || typeof OPZIONI.tastiEtichette !== 'object') OPZIONI.tastiEtichette = {};
ricostruisciTastiB3();

Object.assign(window.__teatro.interni, {
  COMANDI_B3, PAD_B3, OPZIONI, OPZIONI_PREDEFINITE, salvaOpzioni,
  // gli interni esposti in 80-ciclo.js puntano alle versioni non avvolte: si aggiornano (il T4 disegna da qui)
  drawTextFit, drawPillLabel, disegnaMenuPausa, scuoti,
  comandiB3: Object.freeze({
    get stato() {
      const o = b3.opz;
      return {
        dispositivo: b3.dispositivo, contesto: contestoB3(), cursorePausa: b3.cursorePausa,
        voci: vociPausaB3().map((v) => v.id), tenuti: [...b3.pad.tenuti], padPresente: b3.pad.presente,
        opzioni: o ? { pagina: o.pagina, riga: RIGHE_B3[o.pagina][o.sel].id, cattura: o.cattura, conflitto: o.conflitto ? { ...o.conflitto } : null } : null,
        avviso: b3.avviso ? b3.avviso.testo : null, ultimaVibrazione: b3.ultimaVibrazione ? { ...b3.ultimaVibrazione } : null,
      };
    },
    /** Tasti correnti: azione → codice fisico (copia). */
    tasti: () => ({ ...OPZIONI.tasti }),
    apriOpzioni: apriOpzioniB3,
    chiudiOpzioni: chiudiOpzioniB3,
    assegnaTasto: assegnaTastoB3,
    ripristinaTasti: ripristinaTastiB3,
    simbolo: simboloB3,
    adattaTesto: adattaTestoB3,
    offsetScossa: (dt) => offsetScossa(dt),
    vibra: vibraB3,
    /** Altri file: funzioni () => true quando hanno un loro riquadro aperto (il gamepad lo tratta da menu). */
    menuAperti: b3.menuAperti,
    /** Altri file: { id, rett() } per i bottoni che aggiungono al menu di pausa (li raggiunge il cursore). */
    vociPausa: b3.vociPausa,
  }),
});
