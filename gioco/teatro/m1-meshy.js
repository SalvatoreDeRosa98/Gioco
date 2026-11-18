/*
 * teatro/m1-meshy.js — (m1) FIGURE DA MODELLO 3D.
 *
 * I personaggi giocabili che hanno un foglio reso da un modello 3D (assets/sprite_teatro/<nome>_meshy.png: una riga
 * per posa — fermo, cammina, corre) si disegnano da quello, al posto della figura dipinta di 10-sprite.js.
 * Avvolge `disegnaFerruccioPittorico`: stessa posizione, stesse ombre a terra, stesso verso e stessa scala; il
 * fotogramma viene dalla strada fatta (CAMMINATA_T1 / faseCamminataT1 di 10-sprite.js), così i piedi non scivolano.
 * Se il foglio manca, non è ancora carico o è spento (`attivo: false`, oppure window.__figureM1 = false), resta la
 * figura dipinta: niente si rompe.
 *
 * Prove dell'autore (2026-11-18): Taddeo (assets/taddeo.jpg) e Ferruccio (assets/ferruccio.jpg). Dopo averle viste l'autore
 * ha preferito per il Teatro lo stile 2D di prima: qui tutto è SPENTO (`attivo: false`), i disegni restano e si provano
 * nel motore modulare (gioco/motore/, variante «meshy» di contenuti/sprite.json). Per riaccenderli qui: `attivo: true` nelle tabelle (o window.__figureM1 / __scenaM1 = true per prova). Modelli, costi e come si rifà il foglio:
 * production/arte/meshy-modelli.md (tools/meshy-foglio.js).
 */

/**
 * Le figure rese da un modello 3D. Misure del foglio (celle, righe, dove stanno testa e piedi nella cella) e valori
 * di resa: altezza a schermo, strada per un ciclo completo di camminata e di corsa, velocità da cui si corre.
 */
const FIGURE_M1 = Object.freeze({
  ferruccio: Object.freeze({
    attivo: false, // l'autore (2026-11-18): nel Teatro lo stile 2D di prima è più bello; il foglio resta, per il motore modulare
    foglio: 'ferruccio_meshy',
    cellaL: 224, cellaA: 256,
    testa: 19 / 256, piedi: 240 / 256, // i piedi: come Taddeo (nel foglio il punto più basso è la punta dello spadino)
    asseX: 0.5,
    righe: Object.freeze({ fermo: Object.freeze([0, 2]), cammina: Object.freeze([1, 8]), corre: Object.freeze([2, 8]) }),
    altezza: 56,
    piediY: 9.5,
    ombra: 15,
    cicloCamminaPx: 38,
    cicloCorrePx: 58,
    correDa: 1.7,
    fermoTick: 40,
    respiro: 0.012,
    stocco: true,                       // con la spada di Gaetano in mano la disegna 10-sprite.js (disegnaStoccoT1)
  }),
  taddeo: Object.freeze({
    attivo: false,
    foglio: 'taddeo_meshy',
    cellaL: 224, cellaA: 256,
    testa: 23 / 256, piedi: 240 / 256, // righe dei pixel misurate alla resa (tools/meshy-foglio.js le stampa)
    asseX: 0.5,                         // dove sta l'asse della figura nella cella
    righe: Object.freeze({ fermo: Object.freeze([0, 2]), cammina: Object.freeze([1, 8]), corre: Object.freeze([2, 8]) }),
    altezza: 54,                        // px del palco dalla testa ai piedi (come la figura dipinta)
    piediY: 9.5,                        // i piedi stanno a py + piediY, sopra l'ombra di contatto
    ombra: 18,                          // raggio dell'ombra morbida a terra
    cicloCamminaPx: 40,                 // strada per un ciclo di camminata (8 fotogrammi)
    cicloCorrePx: 62,                   // strada per un ciclo di corsa
    correDa: 1.7,                       // px per tick: da questa velocità del giocatore in su, corre
    fermoTick: 40,                      // tick per fotogramma da fermo
    respiro: 0.012,                     // da fermo si allunga appena, coi piedi fermi
  }),
});

/**
 * Gli oggetti di scena resi dai modelli 3D, in stile cupo: stessi nomi, stessa tela e stesso ingombro dei disegni
 * dell'autore (tools/meshy-oggetti.js), in un'altra cartella. `attivo: false` (o window.__scenaM1 = false) riporta
 * i disegni dell'autore; un file che manca torna da solo al disegno.
 */
const SCENA_M1 = Object.freeze({
  attivo: false, // l'autore (2026-11-18): nel Teatro restano i suoi disegni; questi si provano nel motore modulare
  cartella: 'assets/sprite_teatro_meshy/scena/',
  nomi: Object.freeze(['ostacolo-lampione', 'ostacolo-botte', 'ostacolo-fontanella', 'ostacolo-statua', 'ostacolo-carretto', 'ostacolo-albero',
    'ostacolo-telaio', 'ostacolo-colonna', 'ostacolo-panchina', 'ostacolo-braciere', 'ostacolo-candelabro', 'ostacolo-arcolaio',
    'ostacolo-balla-seta', 'ostacolo-aiuola', 'ostacolo-sacco', 'ostacolo-cassa-polvere']),
});
/** La cartella da cui b9 carica l'immagine di scena `nome`: quella dei modelli 3D se è nell'elenco, altrimenti ''. */
function cartellaScenaM1(nome) {
  const acceso = window.__scenaM1 === true || (SCENA_M1.attivo && window.__scenaM1 !== false); // true/false: prove
  return acceso && SCENA_M1.nomi.includes(nome) ? SCENA_M1.cartella : '';
}

/**
 * Il foglio di `charId`, se c'è, è acceso ed è già carico; altrimenti null (allora si disegna la figura dipinta).
 * @param {string} charId @returns {{F: object, img: HTMLImageElement}|null}
 */
function figuraM1(charId) {
  const F = FIGURE_M1[charId];
  // window.__figureM1: true le accende tutte (prove), false le spegne tutte; altrimenti decide `attivo` della tabella
  if (!F || window.__figureM1 === false || !(F.attivo || window.__figureM1 === true)) return null;
  const img = getSpriteTeatro(F.foglio);
  return img ? { F, img } : null;
}

/**
 * Riga e fotogramma del foglio per lo stato dato.
 * @param {object} F voce di FIGURE_M1 @param {boolean} moving @param {number} strada px percorsi @param {number} velocita px per tick
 * @param {number} tick @returns {{riga: number, f: number, posa: string}}
 */
function fotogrammaM1(F, moving, strada, velocita, tick) {
  if (!moving) { const [riga, n] = F.righe.fermo; return { riga, f: Math.floor(tick / F.fermoTick) % n, posa: 'fermo' }; }
  const corre = velocita >= F.correDa;
  const [riga, n] = corre ? F.righe.corre : F.righe.cammina;
  const passo = (corre ? F.cicloCorrePx : F.cicloCamminaPx) / n;
  return { riga, f: ((Math.floor(strada / passo) % n) + n) % n, posa: corre ? 'corre' : 'cammina' };
}

/** Per la QA: l'ultimo fotogramma disegnato ({ charId, posa, riga, f }). */
const ultimoM1 = { charId: '', posa: '', riga: 0, f: 0, disegni: 0 };

const disegnaFerruccioPittoricoBaseM1 = disegnaFerruccioPittorico;
// eslint-disable-next-line no-func-assign
disegnaFerruccioPittorico = function () {
  // stessi argomenti dell'originale: (ctx?, px, py, opts)
  const conCtx = arguments[0] && typeof arguments[0].save === 'function';
  const px = conCtx ? arguments[1] : arguments[0], py = conCtx ? arguments[2] : arguments[1];
  const o = (conCtx ? arguments[3] : arguments[2]) || {};
  const charId = o.charId || (o.charInfo && o.charInfo.id) || statoRun.personaggioId || 'ferruccio';
  const M = figuraM1(charId);
  if (!M) return disegnaFerruccioPittoricoBaseM1.apply(this, arguments);
  const { F, img } = M;
  const tick = o.tick || 0, moving = Boolean(o.moving);
  // la strada del giocatore (contata una volta per tick da 10-sprite.js); le figure fuori dal gioco vanno a tempo
  const strada = (faseCamminataT1(px, py, tick, moving) / Math.PI) * CAMMINATA_T1.passoPx;
  const giocatore = px === player.x && py === player.y;
  const { riga, f, posa } = fotogrammaM1(F, moving, strada, giocatore ? statoRun.speed : 0, tick);
  ultimoM1.charId = charId; ultimoM1.posa = posa; ultimoM1.riga = riga; ultimoM1.f = f; ultimoM1.disegni++;

  ctx.save();
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  // ombra morbida e ombra di contatto, come per la figura dipinta
  const sh = ctx.createRadialGradient(px, py + 9, 1, px, py + 9, F.ombra);
  sh.addColorStop(0, 'rgba(8, 5, 3, 0.72)'); sh.addColorStop(1, 'rgba(8, 5, 3, 0)');
  ctx.fillStyle = sh;
  ctx.save(); ctx.translate(px, py + 9); ctx.scale(1, 0.42); ctx.beginPath(); ctx.arc(0, 0, F.ombra, 0, TAU); ctx.fill(); ctx.restore();
  ctx.fillStyle = 'rgba(4, 2, 6, 0.5)';
  ctx.beginPath(); ctx.ellipse(px, py + 9.6, F.ombra * 0.6, 2.3, 0, 0, TAU); ctx.fill();

  ctx.translate(px, py);
  if (o.scalaA2 && o.scalaA2 !== 1) ctx.scale(o.scalaA2, o.scalaA2); // A2: elisir del Gigante e della Pulce
  if (o.flipX) ctx.scale(-1, 1);
  ctx.save();
  ctx.translate(0, F.piediY);
  if (!moving) ctx.scale(1, 1 + F.respiro * Math.sin(tick * 0.09)); // respira coi piedi fermi
  const s = F.altezza / (F.cellaA * (F.piedi - F.testa)), dw = F.cellaL * s, dh = F.cellaA * s;
  if (o.flash) ctx.filter = 'brightness(2.4) saturate(0.2)';
  ctx.drawImage(img, f * F.cellaL, riga * F.cellaA, F.cellaL, F.cellaA, -dw * F.asseX, -dh * F.piedi, dw, dh);
  ctx.restore();
  // la spada di Gaetano in mano (e il suo fendente breve), come per la figura dipinta
  if (F.stocco && o.haSpada) disegnaStoccoT1(o.swordAnimTick === undefined ? -1 : o.swordAnimTick, o.swordAngle || 0);
  ctx.restore();
};

// il foglio si carica all'avvio, così la prima stanza non mostra per un attimo la figura dipinta
for (const F of Object.values(FIGURE_M1)) if (F.attivo) getSpriteTeatro(F.foglio); // solo quelli accesi

if (window.__teatro && !Object.isFrozen(window.__teatro)) window.__teatro.m1 = { FIGURE_M1, SCENA_M1, figuraM1, fotogrammaM1, cartellaScenaM1, ultimo: ultimoM1 };
