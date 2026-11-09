/**
 * gioco/qa/sprite.test.mjs — Test (node:test) della storia P14: fogli di sprite veri (`resa/sprite.js`) e manifesto
 * `contenuti/sprite.json` ↔ PNG in `assets/sprite/`.
 *
 * Esecuzione: `node gioco/qa/sprite.test.mjs` dalla radice del repository.
 *  - ogni voce del manifesto ha il file su disco, e il PNG misura esattamente larghezza×colonne per altezza×righe del layout;
 *  - il layout è coerente (riga < righe, da < colonne, almeno un fotogramma disponibile) e l'ancora è tra quelle ammesse;
 *  - `fondali` cita voci del manifesto; `resa.json › sprite` ha le cadenze {base,min,max} dei TIPI_CADENZA;
 *  - `fotogramma()` ritaglia per posa/indice con clamp (indice oltre, negativo, posa sulla stessa riga con `da`, foglio a 1 colonna
 *    con 4 fotogrammi dichiarati), posa di ripiego, voce sconosciuta → null;
 *  - `indiceAnimazione` cicla o si ferma sull'ultimo; `indice()` usa le cadenze dei parametri;
 *  - caricamento con cache e stati (caricamento → caricato / errore), `disegna` torna false finché il foglio non è pronto e
 *    disegna con smoothing spento, ancora ai piedi/centro, ribaltamento con `verso`; `disegnaPattern` ripete il tile;
 *  - senza `creaImmagine` niente si carica e tutto ripiega.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, openSync, readSync, closeSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { creaSprite, trovaPosa, fotogrammiDisponibili, indiceAnimazione, ANCORE, TIPI_CADENZA, STATI_FOGLIO } from '../motore/resa/sprite.js';

const QUI = dirname(fileURLToPath(import.meta.url));
const RADICE = resolve(QUI, '..');
const MANIFESTO = JSON.parse(readFileSync(join(RADICE, 'contenuti', 'sprite.json'), 'utf8'));
const RESA = JSON.parse(readFileSync(join(RADICE, 'contenuti', 'parametri', 'resa.json'), 'utf8'));

/** Larghezza e altezza di un PNG dall'intestazione IHDR. */
function dimensioniPng(percorso) {
  const fd = openSync(percorso, 'r');
  const b = Buffer.alloc(24);
  readSync(fd, b, 0, 24, 0);
  closeSync(fd);
  assert.equal(b.toString('ascii', 1, 4), 'PNG', `${percorso} non è un PNG`);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

/** Immagine finta: `carica()` la fa arrivare (naturalWidth > 0, onload), `fallisci()` la manda in errore. */
class ImmagineFinta {
  constructor() { this.src = ''; this.complete = false; this.naturalWidth = 0; this.onload = null; this.onerror = null; }
  carica(w = 64) { this.complete = true; this.naturalWidth = w; this.onload?.(); }
  fallisci() { this.complete = true; this.naturalWidth = 0; this.onerror?.(); }
}

/** Contesto finto che registra le chiamate. */
function contestoFinto() {
  const chiamate = [];
  return {
    chiamate,
    imageSmoothingEnabled: true,
    globalAlpha: 1,
    fillStyle: null,
    save() { chiamate.push(['save']); },
    restore() { chiamate.push(['restore']); },
    translate(x, y) { chiamate.push(['translate', x, y]); },
    rotate(a) { chiamate.push(['rotate', a]); },
    scale(x, y) { chiamate.push(['scale', x, y]); },
    drawImage(...a) { chiamate.push(['drawImage', ...a.slice(1)]); chiamate.smoothing = this.imageSmoothingEnabled; },
    createPattern(img, rip) { chiamate.push(['createPattern', rip]); return { pattern: true, img }; },
    fillRect(x, y, w, h) { chiamate.push(['fillRect', x, y, w, h]); },
  };
}

test('manifesto ↔ disco: ogni voce ha il PNG e il foglio misura colonne×larghezza per righe×altezza', () => {
  assert.ok(MANIFESTO.voci.length >= 91, `voci: ${MANIFESTO.voci.length}`);
  for (const v of MANIFESTO.voci) {
    const percorso = join(RADICE, v.file);
    assert.ok(existsSync(percorso), `${v.nome}: manca ${v.file}`);
    const { w, h } = dimensioniPng(percorso);
    const L = v.layout;
    assert.ok(L && Number.isInteger(L.colonne) && Number.isInteger(L.righe), `${v.nome}: layout senza colonne/righe`);
    assert.equal(w, v.larghezza * L.colonne, `${v.nome}: larghezza del foglio`);
    assert.equal(h, v.altezza * L.righe, `${v.nome}: altezza del foglio`);
    assert.ok(ANCORE.includes(v.ancora), `${v.nome}: ancora '${v.ancora}'`);
    assert.ok(Array.isArray(L.pose) && L.pose.length >= 1, `${v.nome}: nessuna posa`);
    for (const p of L.pose) {
      assert.ok(p.riga >= 0 && p.riga < L.righe, `${v.nome}/${p.posa}: riga ${p.riga} fuori dal foglio`);
      assert.ok((p.da ?? 0) >= 0 && (p.da ?? 0) < L.colonne, `${v.nome}/${p.posa}: da ${p.da} fuori dal foglio`);
      assert.ok(fotogrammiDisponibili(v, trovaPosa(v, p.posa)) >= 1);
    }
  }
  const nomi = new Set(MANIFESTO.voci.map((v) => v.nome));
  assert.equal(nomi.size, MANIFESTO.voci.length, 'nomi duplicati nel manifesto');
  assert.ok(nomi.has(MANIFESTO.fondali.menu), 'fondali.menu non è una voce');
  for (const [piano, nome] of Object.entries(MANIFESTO.fondali.atti)) assert.ok(nomi.has(nome), `fondali.atti[${piano}] = ${nome} non è una voce`);
  for (const tipo of TIPI_CADENZA) {
    const voce = RESA.sprite[`ticks_${tipo}`];
    assert.ok(voce && voce.min <= voce.base && voce.base <= voce.max, `resa.sprite.ticks_${tipo} deve essere {base,min,max}`);
  }
});

test('fotogramma(): posa, indice con clamp, `da` sulla stessa riga, foglio a 1 colonna, ripiego e voce sconosciuta', () => {
  const S = creaSprite({ manifesto: MANIFESTO, creaImmagine: () => new ImmagineFinta() });
  const gatto = MANIFESTO.voci.find((v) => v.nome === 'gatto');
  const f0 = S.fotogramma('gatto', 'morte', 2);
  assert.deepEqual([f0.sx, f0.sy, f0.sw, f0.sh], [2 * 48, 5 * 48, 48, 48]);
  assert.equal(f0.pronta, false, 'non ancora caricato');
  assert.equal(f0.img, null);
  assert.equal(f0.ancora, gatto.ancora);
  assert.equal(S.fotogramma('gatto', 'fermo', 7).indice, 1, 'indice oltre → ultimo della posa (2 fotogrammi)');
  assert.equal(S.fotogramma('gatto', 'fermo', -3).indice, 0, 'indice negativo → 0');
  assert.equal(S.fotogramma('gatto', 'fermo', NaN).indice, 0);
  // proiettili: due pose sulla stessa riga (volo da 0, impatto da 2)
  const imp = S.fotogramma('proiettile-base', 'impatto', 1);
  assert.deepEqual([imp.sx, imp.sy], [3 * 16, 0]);
  assert.equal(S.fotogramma('proiettile-base', 'impatto', 9).sx, 4 * 16, 'impatto ha 3 fotogrammi: 2+2 = colonna 4');
  // raccoglibile-cuore-pieno: brillio×4 dichiarati su un foglio a 1 colonna → sempre la colonna 0
  assert.equal(S.conta('raccoglibile-cuore-pieno', 'brillio'), 1);
  assert.equal(S.fotogramma('raccoglibile-cuore-pieno', 'brillio', 3).sx, 0);
  assert.equal(S.conta('raccoglibile-moneta', 'brillio'), 4);
  // posa sconosciuta → prima posa del layout (ripiego)
  const rip = S.fotogramma('gatto', 'inesistente', 1);
  assert.equal(rip.posa, 'fermo');
  assert.equal(rip.sy, 0);
  assert.equal(S.fotogramma('non-nel-manifesto', 'fermo', 0), null);
  assert.equal(S.conta('non-nel-manifesto', 'fermo'), 1);
  assert.equal(S.voce('gatto').file, 'assets/sprite/gatto.png');
  assert.equal(S.nomi().length, MANIFESTO.voci.length);
});

test('indiceAnimazione cicla o si ferma; indice() usa le cadenze di resa.sprite', () => {
  assert.equal(indiceAnimazione(0, 8, 4), 0);
  assert.equal(indiceAnimazione(8, 8, 4), 1);
  assert.equal(indiceAnimazione(33, 8, 4), 0, '33/8 = 4 → 4 % 4 = 0');
  assert.equal(indiceAnimazione(100, 8, 4, { ferma: true }), 3, 'ferma sull\'ultimo');
  assert.equal(indiceAnimazione(20, 8, 4, { da: 16 }), 0, 'conta dal tick d\'inizio');
  assert.equal(indiceAnimazione(5, 0, 4), 1, 'cadenza 0 → 1 tick per fotogramma');
  assert.equal(indiceAnimazione(99, 8, 1), 0);
  const parametri = { get: (k) => RESA.sprite[k.replace('resa.sprite.', '')].base };
  const S = creaSprite({ manifesto: MANIFESTO, parametri, creaImmagine: () => new ImmagineFinta() });
  assert.equal(S.cadenza('muove'), RESA.sprite.ticks_muove.base);
  assert.equal(S.cadenza('tipo-ignoto'), RESA.sprite.ticks_fermo.base, 'tipo sconosciuto → fermo');
  assert.equal(S.indice('gatto', 'muove', RESA.sprite.ticks_muove.base * 2 + 1, 'muove'), 2);
  assert.equal(S.indice('gatto', 'morte', RESA.sprite.ticks_morte.base * 50, 'morte', { ferma: true }), 3);
  const senza = creaSprite({ manifesto: MANIFESTO });
  assert.equal(senza.cadenza('muove'), 1, 'senza parametri la cadenza è 1');
});

test('caricamento con cache e stati; disegna ripiega finché il foglio non è pronto, poi disegna ancorato e ribaltato', () => {
  const create = [];
  const S = creaSprite({ manifesto: MANIFESTO, percorso: (f) => `data:${f}`, creaImmagine: () => { const i = new ImmagineFinta(); create.push(i); return i; } });
  const ctx = contestoFinto();
  assert.equal(S.disegna(ctx, 'gatto', 'fermo', 0, 100, 200), false, 'non pronto → false');
  assert.equal(ctx.chiamate.length, 0, 'il contesto non è stato toccato');
  assert.equal(create.length, 1, 'una sola Image per nome');
  assert.equal(create[0].src, 'data:assets/sprite/gatto.png', 'src risolto da `percorso`');
  assert.equal(S.carica('gatto').stato, STATI_FOGLIO.caricamento);
  S.pronto('gatto'); S.fotogramma('gatto', 'fermo', 0);
  assert.equal(create.length, 1, 'cache per nome');
  create[0].carica(192);
  assert.equal(S.pronto('gatto'), true);
  assert.equal(S.carica('gatto').stato, STATI_FOGLIO.caricato);
  assert.equal(S.disegna(ctx, 'gatto', 'muove', 1, 100, 200, { verso: -1, alpha: 0.5 }), true);
  const draw = ctx.chiamate.find((c) => c[0] === 'drawImage');
  assert.deepEqual(draw.slice(1), [48, 48, 48, 48, -24, -48, 48, 48], 'fotogramma (1, riga 1) ancorato ai piedi: dx = −sw/2, dy = −sh');
  assert.equal(ctx.chiamate.smoothing, false, 'imageSmoothingEnabled spento');
  assert.ok(ctx.chiamate.some((c) => c[0] === 'translate' && c[1] === 100 && c[2] === 200));
  assert.ok(ctx.chiamate.some((c) => c[0] === 'scale' && c[1] === -1 && c[2] === 1), 'verso −1 ribalta');
  // ancora al centro e rotazione
  ctx.chiamate.length = 0;
  S.carica('scena-porta-aperta'); create[1].carica(96);
  assert.equal(S.disegna(ctx, 'scena-porta-aperta', 'tutto', 0, 10, 20, { ancora: 'centro', rotazione: Math.PI / 2 }), true);
  assert.deepEqual(ctx.chiamate.find((c) => c[0] === 'drawImage').slice(5, 7), [-48, -48], 'centro: dx = −sw/2, dy = −sh/2');
  assert.ok(ctx.chiamate.some((c) => c[0] === 'rotate' && Math.abs(c[1] - Math.PI / 2) < 1e-9));
  // ancora `angolo` del manifesto (sipario)
  ctx.chiamate.length = 0;
  S.carica('sipario-menu'); create[2].carica(1280);
  S.disegna(ctx, 'sipario-menu', 'tutto', 0, 0, 0);
  assert.deepEqual(ctx.chiamate.find((c) => c[0] === 'drawImage').slice(5, 7), [0, 0]);
  // errore di rete → stato errore, disegna false, nessuna nuova Image
  S.carica('vespa-cieca'); create[3].fallisci();
  assert.equal(S.carica('vespa-cieca').stato, STATI_FOGLIO.errore);
  assert.equal(S.disegna(ctx, 'vespa-cieca', 'vola', 0, 0, 0), false);
  assert.equal(create.length, 4);
  const st = S.stato();
  assert.equal(st.voci, MANIFESTO.voci.length);
  assert.deepEqual([st.richiesti, st.caricati, st.errori, st.inErrore], [4, 3, 1, ['vespa-cieca']]);
  // pattern: tile ripetuto a partire dall'angolo del rettangolo
  ctx.chiamate.length = 0;
  S.carica('scena-pavimento-tile'); create[4].carica(64);
  assert.equal(S.disegnaPattern(ctx, 'scena-pavimento-tile', 5, 7, 300, 200), true);
  assert.ok(ctx.chiamate.some((c) => c[0] === 'createPattern' && c[1] === 'repeat'));
  assert.ok(ctx.chiamate.some((c) => c[0] === 'translate' && c[1] === 5 && c[2] === 7));
  assert.ok(ctx.chiamate.some((c) => c[0] === 'fillRect' && c[3] === 300 && c[4] === 200));
  assert.equal(S.disegnaPattern(ctx, 'scena-muro-tile', 0, 0, 10, 10), false, 'tile non caricato → false');
  // precarica tutto il manifesto
  S.precarica();
  assert.equal(S.stato().richiesti, MANIFESTO.voci.length);
});

test('senza creaImmagine (nessun DOM) nulla si carica e ogni disegno ripiega', () => {
  const S = creaSprite({ manifesto: MANIFESTO });
  const ctx = contestoFinto();
  assert.equal(S.pronto('gatto'), false);
  assert.equal(S.disegna(ctx, 'gatto', 'fermo', 0, 0, 0), false);
  assert.equal(S.disegnaPattern(ctx, 'scena-pavimento-tile', 0, 0, 10, 10), false);
  assert.equal(S.carica('gatto').stato, STATI_FOGLIO.errore);
  assert.equal(S.carica('sconosciuto'), null);
  assert.equal(S.fotogramma('gatto', 'fermo', 0).pronta, false, 'il ritaglio resta calcolabile');
  assert.equal(ctx.chiamate.length, 0);
  const vuoto = creaSprite({ manifesto: { voci: [] } });
  assert.equal(vuoto.fotogramma('gatto', 'fermo', 0), null);
  assert.deepEqual(vuoto.stato(), { voci: 0, richiesti: 0, caricati: 0, caricamento: 0, errori: 0, inErrore: [] });
});
