/**
 * motore/mondo/fisica.js — Geometria e collisioni (Core, architettura §2-3).
 *
 * Funzioni pure, senza stato e senza DOM: la stanza è una lista di rettangoli (mura e ostacoli)
 * con i flag di stanze-porte.md regola 13 (`ferma_passo`, `ferma_colpi`); i corpi sono cerchi.
 * Qui si risolvono:
 *  - il movimento di un cerchio contro i rettangoli, asse per asse, con scivolamento lungo le
 *    pareti (controllo-ferruccio.md regola 3 ed edge case «input diagonale su muro»);
 *  - le hitbox del combattimento: settore circolare (`area_fendente`) e rettangolo spazzato
 *    lungo un segmento (affondo) contro cerchi (combattimento.md regole 1 e 4);
 *  - la linea di colpo: il segmento centro-centro non deve attraversare un ostacolo `ferma_colpi`
 *    (stanze-porte.md regola 14);
 *  - la separazione di due cerchi che si toccano (controllo-ferruccio.md regola 6).
 * Nessun numero di gioco: dimensioni e raggi arrivano dai parametri attraverso chi chiama.
 */

/**
 * @typedef {object} Rettangolo
 * @property {number} x bordo sinistro
 * @property {number} y bordo superiore
 * @property {number} w larghezza
 * @property {number} h altezza
 * @property {boolean} [ferma_passo] blocca i corpi (default true)
 * @property {boolean} [ferma_colpi] blocca la linea di colpo (default true)
 * @property {string} [id] etichetta (es. 'muro', 'colonna')
 */

/**
 * @typedef {object} Campo
 * @property {number} x bordo sinistro dell'area calpestabile
 * @property {number} y bordo superiore dell'area calpestabile
 * @property {number} larghezza area calpestabile in px
 * @property {number} altezza area calpestabile in px
 * @property {number} cella lato della cella in px
 * @property {number} colonne
 * @property {number} righe
 * @property {Rettangolo[]} solidi mura e ostacoli
 */

/**
 * Costruisce il campo di una stanza a griglia centrata in una scena, con le quattro mura come
 * rettangoli spessi una cella e gli ostacoli dati per cella.
 * @param {{
 *   colonne: number, righe: number, cella: number,
 *   scenaLarghezza: number, scenaAltezza: number,
 *   ostacoli?: { colonna: number, riga: number, ferma_passo?: boolean, ferma_colpi?: boolean, id?: string }[]
 * }} opzioni
 * @returns {Campo}
 */
export function creaCampo({ colonne, righe, cella, scenaLarghezza, scenaAltezza, ostacoli = [] }) {
  const larghezza = colonne * cella;
  const altezza = righe * cella;
  const x = (scenaLarghezza - larghezza) / 2;
  const y = (scenaAltezza - altezza) / 2;
  const solidi = [
    { id: 'muro', x: x - cella, y: y - cella, w: larghezza + 2 * cella, h: cella, ferma_passo: true, ferma_colpi: true },
    { id: 'muro', x: x - cella, y: y + altezza, w: larghezza + 2 * cella, h: cella, ferma_passo: true, ferma_colpi: true },
    { id: 'muro', x: x - cella, y, w: cella, h: altezza, ferma_passo: true, ferma_colpi: true },
    { id: 'muro', x: x + larghezza, y, w: cella, h: altezza, ferma_passo: true, ferma_colpi: true },
  ];
  for (const o of ostacoli) {
    solidi.push({
      id: o.id ?? 'ostacolo',
      x: x + o.colonna * cella,
      y: y + o.riga * cella,
      w: cella,
      h: cella,
      ferma_passo: o.ferma_passo ?? true,
      ferma_colpi: o.ferma_colpi ?? true,
    });
  }
  return { x, y, larghezza, altezza, cella, colonne, righe, solidi };
}

/**
 * Vero se il cerchio interseca il rettangolo.
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 * @param {Rettangolo} rett
 */
export function cerchioInRettangolo(cx, cy, r, rett) {
  const px = Math.max(rett.x, Math.min(cx, rett.x + rett.w));
  const py = Math.max(rett.y, Math.min(cy, rett.y + rett.h));
  const dx = cx - px;
  const dy = cy - py;
  return dx * dx + dy * dy < r * r;
}

/**
 * Sposta un cerchio di (dx, dy) dentro il campo risolvendo le collisioni con i solidi
 * `ferma_passo`, un asse alla volta: la componente bloccata si annulla, l'altra prosegue
 * (scivolamento lungo le pareti).
 * @param {Campo} campo
 * @param {number} x
 * @param {number} y
 * @param {number} r
 * @param {number} dx
 * @param {number} dy
 * @returns {{ x: number, y: number, urtoX: boolean, urtoY: boolean, urto: boolean }}
 */
export function muoviCerchio(campo, x, y, r, dx, dy) {
  let nx = x + dx;
  let urtoX = false;
  for (const s of campo.solidi) {
    if (s.ferma_passo === false) continue;
    if (cerchioInRettangolo(nx, y, r, s)) {
      urtoX = true;
      nx = dx > 0 ? s.x - r : s.x + s.w + r;
    }
  }
  if (dx === 0) nx = x;
  let ny = y + dy;
  let urtoY = false;
  for (const s of campo.solidi) {
    if (s.ferma_passo === false) continue;
    if (cerchioInRettangolo(nx, ny, r, s)) {
      urtoY = true;
      ny = dy > 0 ? s.y - r : s.y + s.h + r;
    }
  }
  if (dy === 0) ny = y;
  return { x: nx, y: ny, urtoX, urtoY, urto: urtoX || urtoY };
}

/**
 * Differenza tra due angoli riportata in (−π, π].
 * @param {number} a
 * @param {number} b
 */
export function differenzaAngoli(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d <= -Math.PI) d += 2 * Math.PI;
  return d;
}

/**
 * `area_fendente` (combattimento.md): il cerchio bersaglio è nel settore se la distanza dei centri
 * è ≤ portata + r e lo scarto angolare dal centro del settore è ≤ arco/2.
 * @param {{ x: number, y: number, angolo: number, portata: number, arcoGradi: number }} settore angolo in radianti
 * @param {{ x: number, y: number, r: number }} cerchio
 * @returns {boolean}
 */
export function settoreColpisceCerchio(settore, cerchio) {
  const dx = cerchio.x - settore.x;
  const dy = cerchio.y - settore.y;
  const d = Math.hypot(dx, dy);
  if (d > settore.portata + cerchio.r) return false;
  if (d === 0) return true;
  const scarto = Math.abs(differenzaAngoli(Math.atan2(dy, dx), settore.angolo));
  return scarto <= (settore.arcoGradi * Math.PI / 180) / 2;
}

/**
 * Rettangolo spazzato lungo un segmento (hitbox dell'affondo): il cerchio è colpito se la sua
 * proiezione cade in [−r, lunghezza + r] lungo il segmento e la distanza perpendicolare è
 * ≤ larghezza/2 + r.
 * @param {{ x1: number, y1: number, x2: number, y2: number, larghezza: number }} rett
 * @param {{ x: number, y: number, r: number }} cerchio
 * @returns {boolean}
 */
export function rettangoloColpisceCerchio(rett, cerchio) {
  const ax = rett.x2 - rett.x1;
  const ay = rett.y2 - rett.y1;
  const lunghezza = Math.hypot(ax, ay);
  const dx = cerchio.x - rett.x1;
  const dy = cerchio.y - rett.y1;
  if (lunghezza === 0) return Math.hypot(dx, dy) <= rett.larghezza / 2 + cerchio.r;
  const ux = ax / lunghezza;
  const uy = ay / lunghezza;
  const lungo = dx * ux + dy * uy;
  if (lungo < -cerchio.r || lungo > lunghezza + cerchio.r) return false;
  const perp = Math.abs(dx * uy - dy * ux);
  return perp <= rett.larghezza / 2 + cerchio.r;
}

/**
 * Vero se il segmento interseca il rettangolo (metodo degli slab).
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {Rettangolo} rett
 */
export function segmentoInRettangolo(x1, y1, x2, y2, rett) {
  let t0 = 0;
  let t1 = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const assi = [
    [x1, dx, rett.x, rett.x + rett.w],
    [y1, dy, rett.y, rett.y + rett.h],
  ];
  for (const [p, d, min, max] of assi) {
    if (d === 0) {
      if (p < min || p > max) return false;
    } else {
      let ta = (min - p) / d;
      let tb = (max - p) / d;
      if (ta > tb) [ta, tb] = [tb, ta];
      t0 = Math.max(t0, ta);
      t1 = Math.min(t1, tb);
      if (t0 > t1) return false;
    }
  }
  return true;
}

/**
 * Linea di colpo (stanze-porte.md regola 14): vero se nessun solido `ferma_colpi` attraversa il
 * segmento tra i due punti.
 * @param {Campo} campo
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {boolean}
 */
export function lineaLibera(campo, x1, y1, x2, y2) {
  for (const s of campo.solidi) {
    if (s.ferma_colpi === false) continue;
    if (segmentoInRettangolo(x1, y1, x2, y2, s)) return false;
  }
  return true;
}

/**
 * Se due cerchi si sovrappongono restituisce lo spostamento che porta `a` fuori da `b`
 * (vettore da applicare ad `a`); altrimenti `null`. Se i centri coincidono spinge lungo `versoX`.
 * @param {{ x: number, y: number, r: number }} a
 * @param {{ x: number, y: number, r: number }} b
 * @param {number} [versoX=1]
 * @returns {{ x: number, y: number } | null}
 */
export function separazioneCerchi(a, b, versoX = 1) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const d = Math.hypot(dx, dy);
  const minimo = a.r + b.r;
  if (d >= minimo) return null;
  if (d === 0) return { x: versoX * minimo, y: 0 };
  const k = (minimo - d) / d;
  return { x: dx * k, y: dy * k };
}

/**
 * Vero se due cerchi si toccano o si sovrappongono.
 * @param {{ x: number, y: number, r: number }} a
 * @param {{ x: number, y: number, r: number }} b
 */
export function cerchiSiToccano(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const minimo = a.r + b.r;
  return dx * dx + dy * dy <= minimo * minimo;
}
