#!/usr/bin/env node
/**
 * tools/teatro-t4-estrai.mjs — Passo T4 della roadmap «Novità nel Teatro».
 * Estrae dai file di trama/contenuti i dati narrativi dell'hub di Piazza Dante e li incorpora in
 * gioco/teatro/t4-hub-storia.js fra i marcatori T4-DATI (così il Teatro resta giocabile da file://,
 * senza fetch). I testi NON si riscrivono a mano: si rigenerano con
 *   node tools/teatro-t4-estrai.mjs
 * Fonti: trama/storia.json (scene piazza-dante.*, personaggi, flag, scelta), gioco/contenuti/ancoraggi.json
 * (dove parte ogni scena), gioco/contenuti/ripetizioni.json (battute di ripetizione), gioco/contenuti/
 * interfaccia.json (hub, incontri), gioco/contenuti/modelli-stanza/hub/piazza-dante.json (presenze),
 * gioco/contenuti/parametri/ricordi.json (Medaglione di Rosa), trama/decisione-narratrice-donna-luciana.md
 * (battute della Voce narrante).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const radice = join(dirname(fileURLToPath(import.meta.url)), '..');
const leggi = (p) => readFileSync(join(radice, p), 'utf8');
const json = (p) => JSON.parse(leggi(p));

const storia = json('trama/storia.json');
const ancoraggi = json('gioco/contenuti/ancoraggi.json').scene;
const ripetizioni = json('gioco/contenuti/ripetizioni.json');
const interfaccia = json('gioco/contenuti/interfaccia.json');
const modello = json('gioco/contenuti/modelli-stanza/hub/piazza-dante.json');
const ricordi = json('gioco/contenuti/parametri/ricordi.json').ricordi;
const narratriceMd = leggi('trama/decisione-narratrice-donna-luciana.md');

const scene = storia.scene
  .filter((s) => s.capitolo === 'piazza-dante')
  .map((s) => ({
    id: s.id,
    tipo: s.tipo,
    ordine: s.ordine,
    quando: s.quando || {},
    ancoraggio: ancoraggi[s.id]?.ancoraggio || null,
    tableau: Boolean(ancoraggi[s.id]?.tableau),
    battute: s.battute.map((b) => ({ chi: b.chi, testo: b.testo })),
    ...(s.scelta ? { scelta: s.scelta } : {}),
  }));
const senzaAncoraggio = scene.filter((s) => !s.ancoraggio).map((s) => s.id);
if (senzaAncoraggio.length) throw new Error(`scene senza ancoraggio: ${senzaAncoraggio.join(', ')}`);

const personaggi = Object.fromEntries(Object.entries(storia.personaggi).map(([k, v]) => [k, v.nome]));
const flag = Object.fromEntries(Object.entries(storia.flag).map(([k, v]) => [k, v.valori || null]));
const medaglione = storia.oggetti.find((o) => o.id === 'medaglione-di-rosa');
const ricordo = { id: 'medaglione-di-rosa', nome: medaglione.nome, ...ricordi['medaglione-di-rosa'] };

// Battute della Voce narrante (decisione dell'autore): tabella degli Atti, rivelazione, copione strappato.
const atti = {};
for (const riga of narratriceMd.split('\n')) {
  const m = riga.match(/^\|\s*\*\*Atto (I{1,3}|IV)\*\*\s*\|[^|]*\|\s*«([^»]+)»/);
  if (m) atti[{ I: 1, II: 2, III: 3, IV: 4 }[m[1]]] = m[2].trim();
}
const righeRivelazione = [];
let dentro = false;
for (const riga of narratriceMd.split('\n')) {
  if (/^>\s*\*«Credevi/.test(riga)) dentro = true;
  if (dentro) {
    if (!riga.startsWith('>')) break;
    righeRivelazione.push(riga.replace(/^>\s*/, '').replace(/[*«»]/g, '').trim());
  }
}
const strappato = (narratriceMd.match(/«(\[Il copione[^\]]*\])»/) || [])[1];
if (Object.keys(atti).length !== 4 || !righeRivelazione.length || !strappato) throw new Error('battute della narratrice non trovate');

const dati = {
  fonte: 'generato da tools/teatro-t4-estrai.mjs: non modificare a mano',
  scene,
  personaggi,
  flag,
  ripetizioni: { npc_per_ancoraggio: ripetizioni.npc_per_ancoraggio, npc: ripetizioni.npc },
  interfaccia: { hub: interfaccia.hub, luogoHub: interfaccia.hud.hub, incontri: interfaccia.incontri, morte: interfaccia.morte },
  modelloHub: { griglia: modello.griglia, arrivo: modello.arrivo, ingresso: modello.ingresso, automatiche: modello.automatiche, presenze: modello.presenze },
  ricordo,
  narratrice: { atti, rivelazione: righeRivelazione.join(' '), strappato },
};

const destinazione = join(radice, 'gioco/teatro/t4-hub-storia.js');
const sorgente = readFileSync(destinazione, 'utf8');
const inizio = '/* T4-DATI: inizio */';
const fine = '/* T4-DATI: fine */';
const a = sorgente.indexOf(inizio), b = sorgente.indexOf(fine);
if (a < 0 || b < a) throw new Error('marcatori T4-DATI mancanti in gioco/teatro/t4-hub-storia.js');
const blocco = `${inizio}\n  const DATI = ${JSON.stringify(dati, null, 1).replace(/\n/g, '\n  ')};\n  ${fine}`;
writeFileSync(destinazione, sorgente.slice(0, a) + blocco + sorgente.slice(b + fine.length));
console.log(`T4: ${scene.length} scene, ${Object.keys(atti).length} battute della Voce → gioco/teatro/t4-hub-storia.js`);
