/*
 * teatro/a6-progressione.js — Miglioramento 6: progressione fra una run e l'altra, legata alla storia.
 *
 *   - SBLOCCHI: Agnese, Taddeo e Pulcinella d'Ombra partono bloccati (silhouette nel menu con la condizione
 *     scritta) e si sbloccano con eventi della storia o del gioco; alcuni oggetti entrano nel pool della run
 *     solo dopo il loro sblocco. Ferruccio è sempre disponibile.
 *   - Notifica «SBLOCCATO: …» in un cartiglio di pergamena (stesso aspetto del cartiglio del primo raccolto, D).
 *   - SEGNI DI COMPLETAMENTO: per ogni boss battuto con un personaggio un piccolo segno nella sua scheda.
 *   - Salvataggio per slot nei flag di T3 (window.__teatroT3.salvataggi, chiave CONFIG_A6.chiaveFlag).
 *   - Migrazione: uno slot che ha già giocato con un personaggio lo considera sbloccato.
 *   - QA/sviluppo: window.__teatro.interni.sbloccaTutto() e azzeraSblocchi().
 *
 * Nessun gancio nei file di base: si avvolgono le function di primo livello disegnaMenuSelezionePersonaggio,
 * disegnaFrame, selezionaPersonaggio, avviaPartitaConPersonaggio, nuovaRun, inizializzaPoolRunB e t4Gancio.
 * Script classico caricato dopo teatro/t4-hub-storia.js. Regole: teatro/LEGGIMI.md.
 * Ispirazione: gli sblocchi dei personaggi e i segni di completamento di un roguelike a stanze (nomi nostri).
 */

// ===========================================================================
// CONFIGURAZIONE (numeri e testi del miglioramento 6)
// ===========================================================================
const CONFIG_A6 = Object.freeze({
  chiaveFlag: 'progressione6',              // flag dello slot T3 che contiene lo stato della progressione
  chiaveTutto: 'ferruccio.teatro.sbloccaTutto', // localStorage: '1' = tutto sbloccato in ogni slot (QA/sviluppo)
  versione: 1,
  controlloOgniMs: 200,                     // ogni quanto si valutano le condizioni (nell'hub e in gioco)
  notifica: Object.freeze({ durataMs: 4200, entrataMs: 250, uscitaMs: 400, w: 400, h: 44, yGioco: 268, yHub: 270 }),
  // geometria delle schede del menu (60-resa.js › disegnaMenuSelezionePersonaggio)
  scheda: Object.freeze({ ids: ['ferruccio', 'agnese', 'taddeo', 'ombra'], w: 132, h: 226, y: 56, gap: 14, x0: 35 }),
  segni: Object.freeze({ y: 186, passo: 16, scala: 1, spento: 0.18 }),
  avvisoBloccatoMs: 1800,
});

/**
 * Segni di completamento: uno per boss, con l'icona (sprite di SPRITE_OGGETTI) e il nome breve.
 * L'ordine è quello in cui compaiono nella scheda.
 */
const SEGNI_A6 = Object.freeze([
  Object.freeze({ boss: 're-gatto', sprite: 'gatto', nome: 'Gatto dei Quattro Canti' }),
  Object.freeze({ boss: 'capitano-guardia', sprite: 'chiave', nome: 'Capitano di Piombo' }),
  Object.freeze({ boss: 'regina-vespa', sprite: 'ago', nome: 'Regina delle Vespe' }),
  Object.freeze({ boss: 'colosso-statua', sprite: 'campana', nome: 'Custode di Marmo' }),
  Object.freeze({ boss: 'maestro-fucina', sprite: 'forbici', nome: 'Spezzafili d\'Ottone' }),
  Object.freeze({ boss: 'donna-luciana', sprite: 'cuoio', nome: 'Donna Luciana' }),
]);

/**
 * SBLOCCHI. Condizione: lista di alternative (basta una), ciascuna di tipo
 *   { boss: id }            boss sconfitto in questo slot (con qualunque personaggio)
 *   { piano: n }            piano n raggiunto in questo slot
 *   { notte: n }            notte n raggiunta (contatore delle notti del file principale)
 *   { parla: npc }          parlato con il personaggio nell'hub in questo slot
 *   { flag, valore }        flag della trama (T4); valore '*' = qualunque decisione presa
 *   { sblocco: id }         un altro sblocco già ottenuto
 * cosa: { personaggio: id } oppure { oggetto: id } (entra nel pool della run).
 * TESTI DA APPROVARE DALL'AUTORE: condizione (scritta nella silhouette) e testo (nel cartiglio).
 */
const SBLOCCHI_A6 = Object.freeze([
  Object.freeze({
    id: 'agnese', cosa: { personaggio: 'agnese' },
    quando: [{ flag: 'tonino_ricordo', valore: 'restituito' }, { piano: 3 }],
    condizione: 'Restituisci a Tonino il ricordo di Rosa, oppure arriva al Piano 3',
    testo: 'Agnese, la Tessitrice di San Leucio. Una lettera ritrovata porta il suo nome.',
  }),
  Object.freeze({
    id: 'taddeo', cosa: { personaggio: 'taddeo' },
    quando: [{ boss: 'capitano-guardia' }],
    condizione: 'Sconfiggi il Capitano di Piombo',
    testo: 'Taddeo, la Guardia Pentita. Sotto il piombo delle guardie batte ancora un cuore.',
  }),
  Object.freeze({
    id: 'ombra', cosa: { personaggio: 'ombra' },
    quando: [{ boss: 'donna-luciana' }],
    condizione: 'Sconfiggi Donna Luciana, la Burattinaia del Velo',
    testo: 'Pulcinella d\'Ombra. Spezzati i fili, la tua ombra cammina da sola.',
  }),
  Object.freeze({
    id: 'ogg-burattino-tonino', cosa: { oggetto: 'bobby' },
    quando: [{ parla: 'tonino' }],
    condizione: 'Parla con Tonino in Piazza Dante',
    testo: 'Burattino di Tonino. Ora può comparire nel Teatro.',
  }),
  Object.freeze({
    id: 'ogg-gatto-vico', cosa: { oggetto: 'gatto' },
    quando: [{ boss: 're-gatto' }],
    condizione: 'Sconfiggi il Gatto dei Quattro Canti',
    testo: 'Gatto di Vico Lungo. Ora può comparire nel Teatro.',
  }),
  Object.freeze({
    id: 'ogg-astrolabio', cosa: { oggetto: 'astrolabio' },
    quando: [{ notte: 3 }],
    condizione: 'Arriva alla Notte 3',
    testo: 'Astrolabio della Specola. La luna cammina: ora può comparire nel Teatro.',
  }),
  Object.freeze({
    id: 'ogg-sciarpa-agnese', cosa: { oggetto: 'stivali' },
    quando: [{ sblocco: 'agnese' }],
    condizione: 'Sblocca Agnese',
    testo: 'Sciarpa Rossa di Agnese. «Dicono che il rosso protegga dal malocchio.»',
  }),
  Object.freeze({
    id: 'ogg-ostia', cosa: { oggetto: 'ostia' },
    quando: [{ piano: 4 }],
    condizione: 'Arriva al Piano 4',
    testo: 'Ostia della Cappella Palatina. Ora può comparire nel Teatro.',
  }),
]);

const TESTI_A6 = Object.freeze({
  sbloccato: 'SBLOCCATO',
  bloccato: 'DIETRO LE QUINTE',
  silhouetteNome: (nome) => nome.toUpperCase(),
  bottoneBloccato: (nome) => `🔒 ${nome.toUpperCase()} È ANCORA DIETRO LE QUINTE`,
  bottoneAiuto: 'Scegli un burattino già in scena per iniziare',
  avvisoBloccato: (nome, cond) => `${nome} non è ancora in scena: ${cond}`,
  segni: 'Segni:',
});

// ===========================================================================
// STATO PER SLOT (flag T3)
// ===========================================================================
const a6 = {
  ultimoSlot: null,
  ultimoControlloMs: 0,
  coda: [],            // notifiche in attesa: { testo, nome }
  notifica: null,      // { testo, nome, ms }
  avviso: null,        // { testo, finoMs } nel menu
  oggettiAppenaFiltrati: 0,
};

function salvataggiA6() {
  return (window.__teatroT3 && window.__teatroT3.salvataggi) || null;
}

function tuttoSbloccatoA6() {
  try { return localStorage.getItem(CONFIG_A6.chiaveTutto) === '1'; } catch (_) { return false; }
}

function vuotoA6() {
  return { versione: CONFIG_A6.versione, migrato: false, sbloccati: {}, segni: {}, boss: [], parlato: {}, pianoMax: 1 };
}

/** Stato della progressione dello slot attivo (copia normalizzata). */
function statoA6() {
  const sv = salvataggiA6();
  let d = null;
  try { d = sv ? sv.leggiFlag(CONFIG_A6.chiaveFlag) : null; } catch (_) { d = null; }
  const s = vuotoA6();
  if (d && typeof d === 'object') {
    s.migrato = Boolean(d.migrato);
    if (d.sbloccati && typeof d.sbloccati === 'object') s.sbloccati = { ...d.sbloccati };
    if (d.segni && typeof d.segni === 'object') {
      for (const [k, v] of Object.entries(d.segni)) if (Array.isArray(v)) s.segni[k] = v.slice();
    }
    if (Array.isArray(d.boss)) s.boss = d.boss.slice();
    if (d.parlato && typeof d.parlato === 'object') s.parlato = { ...d.parlato };
    s.pianoMax = Math.max(1, Math.floor(Number(d.pianoMax) || 1));
  }
  return s;
}

function scriviA6(s) {
  const sv = salvataggiA6();
  if (sv) { try { sv.impostaFlag(CONFIG_A6.chiaveFlag, JSON.parse(JSON.stringify(s))); } catch (err) { console.warn('[A6] salvataggio', err); } }
}

function sbloccoPersonaggioA6(charId) {
  return SBLOCCHI_A6.find((s) => s.cosa.personaggio === charId) || null;
}

/** true se il personaggio si può giocare nello slot attivo. Ferruccio sempre. */
function personaggioSbloccatoA6(charId) {
  if (charId === 'ferruccio' || tuttoSbloccatoA6()) return true;
  const sb = sbloccoPersonaggioA6(charId);
  if (!sb) return true; // personaggio senza regola di sblocco: libero
  return Boolean(statoA6().sbloccati[sb.id]);
}

function oggettoSbloccatoA6(idOgg) {
  const sb = SBLOCCHI_A6.find((s) => s.cosa.oggetto === idOgg);
  if (!sb || tuttoSbloccatoA6()) return true;
  return Boolean(statoA6().sbloccati[sb.id]);
}

// ===========================================================================
// MIGRAZIONE: chi ha già giocato con un personaggio lo ritrova sbloccato
// ===========================================================================
function migraSlotA6() {
  const sv = salvataggiA6();
  if (!sv) return;
  const dati = sv.leggi(sv.slotAttivo);
  if (!dati) return; // slot vuoto: niente da migrare (si parte puliti)
  const s = statoA6();
  if (s.migrato) return;
  s.migrato = true;
  const sb = sbloccoPersonaggioA6(dati.personaggio);
  if (sb) s.sbloccati[sb.id] = true;
  s.pianoMax = Math.max(s.pianoMax, dati.pianoMassimo || 1);
  scriviA6(s);
}

// ===========================================================================
// CONDIZIONI E SBLOCCO
// ===========================================================================
function flagTramaA6() {
  try { return (window.__teatro.t4qa && window.__teatro.t4qa.flag) || {}; } catch (_) { return {}; }
}

function alternativaVeraA6(c, s, ft) {
  if (c.boss) return s.boss.includes(c.boss);
  if (c.piano) return s.pianoMax >= c.piano;
  if (c.notte) return getNumeroNotte() >= c.notte;
  if (c.parla) return Boolean(s.parlato[c.parla]);
  if (c.sblocco) return Boolean(s.sbloccati[c.sblocco]);
  if (c.flag) {
    const v = ft[c.flag];
    if (c.valore === '*') return v !== null && v !== undefined;
    return v === c.valore;
  }
  return false;
}

/** Valuta tutte le condizioni; sblocca e accoda le notifiche. Rende la lista degli id sbloccati ora. */
function valutaSblocchiA6(s = statoA6()) {
  const ft = flagTramaA6();
  const nuovi = [];
  let cambiato = true;
  while (cambiato) { // più passate: uno sblocco può dipendere da un altro (Sciarpa ← Agnese)
    cambiato = false;
    for (const sb of SBLOCCHI_A6) {
      if (s.sbloccati[sb.id]) continue;
      if (sb.quando.some((c) => alternativaVeraA6(c, s, ft))) {
        s.sbloccati[sb.id] = true;
        nuovi.push(sb.id);
        cambiato = true;
      }
    }
  }
  return nuovi;
}

function notificaA6(sb) {
  const nome = sb.cosa.personaggio ? (PERSONAGGI_GIOCABILI[sb.cosa.personaggio] || {}).nome
    : (trovaOggettoB(sb.cosa.oggetto) || {}).nome;
  a6.coda.push({ testo: sb.testo, nome: nome || sb.id, sprite: sb.cosa.oggetto ? (trovaOggettoB(sb.cosa.oggetto) || {}).sprite : null, personaggio: sb.cosa.personaggio || null });
}

/** Osserva la partita (hub e run): piano raggiunto, parlato con un NPC, poi valuta gli sblocchi. */
function controllaA6(forza = false) {
  const sv = salvataggiA6();
  if (!sv) return [];
  if (a6.ultimoSlot !== sv.slotAttivo) { a6.ultimoSlot = sv.slotAttivo; migraSlotA6(); }
  const ora = performance.now();
  if (!forza && ora - a6.ultimoControlloMs < CONFIG_A6.controlloOgniMs) return [];
  a6.ultimoControlloMs = ora;
  if (statoRun.fase !== 'in_gioco' && statoRun.fase !== 'hub') return [];
  const s = statoA6();
  let cambiato = false;
  if (statoRun.fase === 'in_gioco' && statoRun.piano > s.pianoMax) { s.pianoMax = statoRun.piano; cambiato = true; }
  // chi gioca un personaggio in una run lo ha in scena (vale anche per sbloccaTutto/QA)
  const sbP = sbloccoPersonaggioA6(statoRun.personaggioId);
  if (statoRun.fase === 'in_gioco' && sbP && !s.sbloccati[sbP.id]) { s.sbloccati[sbP.id] = true; cambiato = true; }
  if (statoRun.fase === 'hub') {
    const d = window.__teatro.t4qa && window.__teatro.t4qa.dialogo;
    if (d && d.chi && d.chi !== 'didascalia' && d.chi !== 'voce' && d.chi !== 'luciana' && !s.parlato[d.chi]) {
      s.parlato[d.chi] = true; cambiato = true;
    }
  }
  const nuovi = valutaSblocchiA6(s);
  if (nuovi.length || cambiato) scriviA6(s);
  for (const id of nuovi) notificaA6(SBLOCCHI_A6.find((x) => x.id === id));
  return nuovi;
}

/** Boss sconfitto (dal gancio T4 'bossSconfitto'): segno per il personaggio e fatto dello slot. */
function bossSconfittoA6(st) {
  const b = st && st.nemici && (st.nemici.find((n) => n.boss) || st.nemici[0]);
  if (!b || !b.bossId) return;
  const s = statoA6();
  const pid = statoRun.personaggioId || 'ferruccio';
  if (!s.boss.includes(b.bossId)) s.boss.push(b.bossId);
  const segni = s.segni[pid] || (s.segni[pid] = []);
  if (!segni.includes(b.bossId)) segni.push(b.bossId);
  const nuovi = valutaSblocchiA6(s);
  scriviA6(s);
  for (const id of nuovi) notificaA6(SBLOCCHI_A6.find((x) => x.id === id));
}

// ===========================================================================
// AVVOLGIMENTI DELLE FUNZIONI DI BASE
// ===========================================================================
const t4GancioBaseA6 = t4Gancio;
t4Gancio = function (nome, ...args) {
  if (nome === 'bossSconfitto') { try { bossSconfittoA6(args[0]); } catch (err) { console.error('[A6] boss', err); } }
  return t4GancioBaseA6(nome, ...args);
};

const selezionaPersonaggioBaseA6 = selezionaPersonaggio;
/** Nel menu si può scegliere anche una scheda bloccata (per leggerne la condizione); fuori dal menu no. */
selezionaPersonaggio = function (charId) {
  if (statoRun.fase !== 'menu_selezione' && !personaggioSbloccatoA6(charId)) { avvisaBloccatoA6(charId); return; }
  return selezionaPersonaggioBaseA6(charId);
};

const avviaPartitaConPersonaggioBaseA6 = avviaPartitaConPersonaggio;
avviaPartitaConPersonaggio = function (charId) {
  const id = charId || statoRun.personaggioId;
  if (!personaggioSbloccatoA6(id)) { avvisaBloccatoA6(id); return; }
  return avviaPartitaConPersonaggioBaseA6(charId);
};

const nuovaRunBaseA6 = nuovaRun;
/** Rete di sicurezza: una run non parte mai con un personaggio bloccato (si torna a Ferruccio). */
nuovaRun = function (...args) {
  if (!personaggioSbloccatoA6(statoRun.personaggioId)) selezionaPersonaggioBaseA6('ferruccio');
  return nuovaRunBaseA6(...args);
};

const inizializzaPoolRunBBaseA6 = inizializzaPoolRunB;
/** Gli oggetti bloccati non entrano nel pool: al loro posto uno sbloccato della stessa polarità non scelto. */
inizializzaPoolRunB = function (escludiId) {
  inizializzaPoolRunBBaseA6(escludiId);
  const P = statoRun.poolRunB;
  if (!P || tuttoSbloccatoA6()) return;
  const neg = (o) => o && o.polarita === 'negativo';
  let tolti = 0;
  for (let i = 0; i < P.ids.length; i++) {
    const id = P.ids[i];
    if (oggettoSbloccatoA6(id)) continue;
    const o = trovaOggettoB(id);
    const cand = CATALOGO_OGGETTI.filter((c) => c.id !== escludiId && !P.ids.includes(c.id) && neg(c) === neg(o) && oggettoSbloccatoA6(c.id));
    const nuovo = cand.length ? cand[Math.floor(rng() * cand.length)].id : null;
    const j = P.rimasti.indexOf(id);
    if (nuovo) { P.ids[i] = nuovo; if (j >= 0) P.rimasti[j] = nuovo; } else { P.ids.splice(i, 1); if (j >= 0) P.rimasti.splice(j, 1); i--; }
    tolti++;
  }
  a6.oggettiAppenaFiltrati = tolti;
};

function avvisaBloccatoA6(charId) {
  const p = PERSONAGGI_GIOCABILI[charId];
  const sb = sbloccoPersonaggioA6(charId);
  const testo = TESTI_A6.avvisoBloccato(p ? p.nome : charId, sb ? sb.condizione : '');
  a6.avviso = { testo, finoMs: performance.now() + CONFIG_A6.avvisoBloccatoMs };
  if (statoRun.fase !== 'menu_selezione') mostraBanner(testo, 150);
}

// ===========================================================================
// MENU: silhouette, condizione, segni di completamento, bottone
// ===========================================================================
function disegnaSegniA6(cx, charId, s) {
  const S = CONFIG_A6.scheda;
  const G = CONFIG_A6.segni;
  const avuti = s.segni[charId] || [];
  const y = S.y + G.y;
  const largh = (SEGNI_A6.length - 1) * G.passo;
  const x0 = cx + S.w / 2 - largh / 2;
  ctx.save();
  for (let i = 0; i < SEGNI_A6.length; i++) {
    const sg = SEGNI_A6[i];
    const x = x0 + i * G.passo;
    const preso = avuti.includes(sg.boss);
    ctx.globalAlpha = preso ? 1 : G.spento;
    if (preso) {
      ctx.fillStyle = 'rgba(249, 203, 64, 0.22)';
      ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill();
    }
    drawPixelSprite(SPRITE_OGGETTI[sg.sprite] || SPRITE_OGGETTI.spada, x, y, G.scala);
  }
  ctx.restore();
}

function aCapoA6(testo, maxW, size) {
  ctx.save();
  ctx.font = `bold ${size}px Georgia, serif`;
  const righe = [];
  let riga = '';
  for (const parola of testo.split(' ')) {
    const prova = riga ? `${riga} ${parola}` : parola;
    if (ctx.measureText(prova).width > maxW && riga) { righe.push(riga); riga = parola; } else riga = prova;
  }
  if (riga) righe.push(riga);
  ctx.restore();
  return righe;
}

function disegnaSchedaBloccataA6(cx, charId, selezionata) {
  const S = CONFIG_A6.scheda;
  const p = PERSONAGGI_GIOCABILI[charId];
  const sb = sbloccoPersonaggioA6(charId);
  const pedX = cx + S.w / 2, pedY = S.y + 68;
  ctx.save();
  // fondale della scheda: carta scura, la lanterna dietro il telo accende un ovale caldo
  ctx.fillStyle = selezionata ? '#1d120a' : '#0f0906';
  ctx.fillRect(cx + 2, S.y + 2, S.w - 4, S.h - 4);
  const g = ctx.createRadialGradient(pedX, pedY - 18, 4, pedX, pedY - 18, 46);
  g.addColorStop(0, 'rgba(240, 196, 120, 0.55)');
  g.addColorStop(1, 'rgba(240, 196, 120, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(cx + 2, S.y + 2, S.w - 4, 100);
  // silhouette: il burattino disegnato in nero (teatro d'ombre)
  ctx.filter = 'brightness(0)';
  ctx.globalAlpha = 0.92;
  try {
    disegnaFerruccioPittorico(pedX, pedY, { charId, charInfo: p, flipX: false, moving: false, tick: 0, haSpada: charId === 'taddeo', sinergie: {} });
  } finally { ctx.filter = 'none'; ctx.globalAlpha = 1; }
  drawPillLabel('🔒', cx + S.w - 16, S.y + 12, 22, { size: 7, color: '#a8a29e', border: '#4b5563' });
  drawTextFit(TESTI_A6.silhouetteNome(p.nome), pedX, S.y + 95, S.w - 10, { size: 8.5, color: '#a8a29e', weight: 'bold' });
  drawTextFit(TESTI_A6.bloccato, pedX, S.y + 109, S.w - 12, { size: 7, color: '#f9cb40' });
  const righe = aCapoA6(sb ? sb.condizione : '', S.w - 18, 7.5);
  righe.slice(0, 5).forEach((r, i) => drawTextFit(r, pedX, S.y + 128 + i * 12, S.w - 14, { size: 7.5, color: '#f3dfc1', weight: '' }));
  ctx.restore();
}

function disegnaBottoneBloccatoA6(charId) {
  const p = PERSONAGGI_GIOCABILI[charId];
  const btnW = 320, btnH = 34, btnX = (W - btnW) / 2, btnY = 302;
  ctx.save();
  ctx.fillStyle = '#1c140e';
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.strokeStyle = '#57534e';
  ctx.lineWidth = 2;
  ctx.strokeRect(btnX, btnY, btnW, btnH);
  drawTextFit(TESTI_A6.bottoneBloccato(p.nome), W / 2, btnY + 16, btnW - 16, { size: 9, color: '#a8a29e', weight: 'bold' });
  drawTextFit(TESTI_A6.bottoneAiuto, W / 2, btnY + 27, btnW - 16, { size: 7.5, color: '#78716c' });
  ctx.restore();
}

const disegnaMenuSelezionePersonaggioBaseA6 = disegnaMenuSelezionePersonaggio;
disegnaMenuSelezionePersonaggio = function (t) {
  disegnaMenuSelezionePersonaggioBaseA6(t);
  try {
    controllaA6(); // cambio di slot → migrazione
    const S = CONFIG_A6.scheda;
    const s = statoA6();
    S.ids.forEach((id, i) => {
      const cx = S.x0 + i * (S.w + S.gap);
      const sel = statoRun.personaggioId === id;
      if (!personaggioSbloccatoA6(id)) disegnaSchedaBloccataA6(cx, id, sel);
      else disegnaSegniA6(cx, id, s);
    });
    if (!personaggioSbloccatoA6(statoRun.personaggioId)) disegnaBottoneBloccatoA6(statoRun.personaggioId);
    if (a6.avviso && performance.now() < a6.avviso.finoMs) drawPillLabel(a6.avviso.testo, W / 2, 50, 460, { size: 7.5 });
    else a6.avviso = null;
  } catch (err) { console.error('[A6] menu', err); }
};

// ===========================================================================
// NOTIFICA «SBLOCCATO: …» (cartiglio di pergamena come quello del primo raccolto)
// ===========================================================================
function disegnaNotificaA6(dtMs) {
  if (statoRun.fase !== 'in_gioco' && statoRun.fase !== 'hub') return;
  const N = CONFIG_A6.notifica;
  if (!a6.notifica) {
    if (!a6.coda.length || statoRun.cartiglioD || statoRun.siparioAttivo) return;
    a6.notifica = { ...a6.coda.shift(), ms: 0 };
    try { AudioSys.playCampana(); } catch (_) { /* audio facoltativo */ }
  }
  const n = a6.notifica;
  if (!statoRun.pausa) n.ms += Math.max(0, Math.min(100, dtMs || 0));
  if (n.ms > N.durataMs) { a6.notifica = null; return; }
  const bw = N.w, bh = N.h, bx = (W - bw) / 2, by = statoRun.fase === 'hub' ? N.yHub : N.yGioco;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, n.ms / N.entrataMs, (N.durataMs - n.ms) / N.uscitaMs));
  ctx.fillStyle = '#e6d2aa';
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = '#5c4024';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx + 3, by + 3, bw - 6, bh - 6);
  if (n.personaggio) {
    ctx.save();
    ctx.filter = 'brightness(0)';
    try { disegnaFerruccioPittorico(bx + 24, by + bh - 8, { charId: n.personaggio, charInfo: PERSONAGGI_GIOCABILI[n.personaggio], tick: 0, scale: 0.5, sinergie: {} }); } catch (_) { /* solo decorazione */ }
    ctx.restore();
  } else if (n.sprite) {
    drawPixelSprite(SPRITE_OGGETTI[n.sprite] || SPRITE_OGGETTI.spada, bx + 24, by + bh / 2, 2);
  }
  drawTextFit(`✦ ${TESTI_A6.sbloccato}: ${n.nome}`, bx + bw / 2 + 16, by + 16, bw - 70, { size: 9, color: '#5c1a0c', shadow: false });
  drawTextFit(n.testo, bx + bw / 2 + 16, by + 32, bw - 70, { size: 7.5, color: '#451a03', weight: '', style: 'italic', shadow: false });
  ctx.restore();
}

const disegnaFrameBaseA6 = disegnaFrame;
disegnaFrame = function (dtMs) {
  const r = disegnaFrameBaseA6(dtMs);
  try { controllaA6(); disegnaNotificaA6(dtMs); } catch (err) { console.error('[A6] frame', err); }
  return r;
};

// ===========================================================================
// SONDA QA / SVILUPPO
// ===========================================================================
Object.assign(window.__teatro.interni, {
  SBLOCCHI_A6, SEGNI_A6, CONFIG_A6,
  /** Sviluppo/QA: tutto sbloccato in ogni slot (finché non si chiama azzeraSblocchi). */
  sbloccaTutto() { try { localStorage.setItem(CONFIG_A6.chiaveTutto, '1'); } catch (_) { /* memoria piena o negata */ } },
  /** Sviluppo/QA: toglie il «tutto sbloccato» e azzera la progressione dello slot attivo (Ferruccio resta). */
  azzeraSblocchi() {
    try { localStorage.removeItem(CONFIG_A6.chiaveTutto); } catch (_) { /* idem */ }
    const s = vuotoA6();
    s.migrato = true; // azzerato apposta: nessuna migrazione dal personaggio dello slot
    scriviA6(s);
    a6.coda = []; a6.notifica = null;
    if (!personaggioSbloccatoA6(statoRun.personaggioId)) selezionaPersonaggioBaseA6('ferruccio');
  },
  progressione: Object.freeze({
    get stato() { return statoA6(); },
    get notifica() { return a6.notifica ? { nome: a6.notifica.nome, testo: a6.notifica.testo } : null; },
    get coda() { return a6.coda.map((n) => n.nome); },
    get oggettiFiltrati() { return a6.oggettiAppenaFiltrati; },
    personaggioSbloccato: personaggioSbloccatoA6,
    oggettoSbloccato: oggettoSbloccatoA6,
    controlla: () => controllaA6(true),
    bossSconfitto: bossSconfittoA6,
  }),
});
