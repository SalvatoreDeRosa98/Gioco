/**
 * motore/resa/trasformazioni.js — Trasformazioni del contesto Canvas derivate dai numeri dello stato (storia P12, passo F4).
 *
 * Regola «lo stato non disegna, la resa non muta»: `mondo/camera.js` espone solo numeri (`scala`, `scorrimento()`,
 * `progresso()`); è questo modulo di `resa/` a tradurli in `translate`/`scale` sul contesto. Lo usano il renderer del
 * Teatro e il disegno diagnostico in fil di ferro. Chi chiama fa `save`/`restore`.
 */

/**
 * Imposta sul contesto la trasformazione della stanza: scorrimento della transizione, poi scala della camera
 * attorno al centro della scena. Senza camera non fa nulla.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ scala: number, scorrimento: () => { x: number, y: number } } | null} camera
 * @param {{ larghezza: number, altezza: number }} scena risoluzione logica
 */
export function applicaCamera(ctx, camera, scena) {
  if (!camera) return;
  const cx = scena.larghezza / 2;
  const cy = scena.altezza / 2;
  const s = camera.scorrimento();
  ctx.translate(cx + s.x, cy + s.y);
  ctx.scale(camera.scala, camera.scala);
  ctx.translate(-cx, -cy);
}
