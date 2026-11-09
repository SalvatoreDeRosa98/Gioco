/**
 * motore/attori/proiettili-nemici.js — I proiettili dei nemici (storia P05, Teatro
 * `statoRun.proiettiliNemici` ~4398-4416 e ~4341).
 *
 * Un proiettile nemico è un cerchio `{x, y, r}` che vola dritto a `velocita` px/s per `gittata` px.
 * Regole (fonte: il Teatro, trascritte in `nemici.json › proiettili_nemici`):
 *  - ferisce Ferruccio al contatto con `danno` maschere (comune ai piani 1-2, intero dal 3, dei boss sempre
 *    `danno_boss`), SOLO attraverso la facciata `comeBersaglio` del combattimento (`bersaglio.colpisci`):
 *    se Ferruccio è invulnerabile (`'ignorato'`) il proiettile continua a volare come nel Teatro;
 *  - è **parabile**: la parata lo riflette (`rifletti`, chiamata dal combattimento con `danno_riflesso` e
 *    `v_riflesso`) e il proiettile riflesso ferisce il primo nemico vivo che tocca (`nemici()`), poi si spegne;
 *  - il **fendente attivo** lo cancella (Teatro: la spada distrugge i proiettili nel suo raggio): il gancio
 *    `spada()` ritorna la hitbox corrente del combattimento (settore) o null;
 *  - si spegne su muri, porte chiuse e ostacoli che fermano i colpi (`ferma_colpi !== false`), e a fine gittata.
 * Eventi (verso l'alto): `proiettile.spento` {id, x, y, motivo: 'gittata' | 'ostacolo' | 'bersaglio' | 'nemico' | 'spada' | 'cancellato'}.
 * `cancellaInRaggio` è per il Tamburello (oggetto attivo: distrugge i proiettili nemici); `potaSpenti` toglie
 * dalla lista condivisa i proiettili spenti. Nessun numero di gioco e nessuna casualità qui.
 */

import { cerchiSiToccano, cerchioInRettangolo, settoreColpisceCerchio } from '../mondo/fisica.js';

let contatore = 0;

/**
 * Crea un proiettile nemico.
 * @param {{
 *   x: number, y: number, direzione: { x: number, y: number }, velocita: number, r: number, gittata: number, danno: number,
 *   campo: { solidi: { x: number, y: number, larghezza: number, altezza: number, ferma_colpi?: boolean }[] },
 *   bersaglio?: { x: number, y: number, r: number, stato: string, colpisci: Function } | null,
 *   nemici?: () => object[], origine?: object | null, spada?: (() => object | null) | null,
 *   eventi?: { emit: Function } | null, boss?: boolean, id?: string
 * }} o `nemici` ritorna i bersagli vivi che un proiettile riflesso può ferire; `origine` è il nemico che ha sparato (escluso finché il proiettile non è riflesso)
 */
export function creaProiettileNemico({
  x, y, direzione, velocita, r, gittata, danno, campo, bersaglio = null, nemici = () => [], origine = null, spada = null, eventi = null, boss = false,
  id = `pn${contatore++}`,
}) {
  if (!campo || !direzione) throw new TypeError('creaProiettileNemico: campo e direzione sono obbligatori');
  const l = Math.hypot(direzione.x, direzione.y) || 1;
  const p = { x, y, dx: direzione.x / l, dy: direzione.y / l, velocita, r, danno, gittata, percorso: 0, riflesso: false, vivo: true, motivo: null };

  function spegni(motivo) {
    if (!p.vivo) return;
    p.vivo = false;
    p.motivo = motivo;
    eventi?.emit('proiettile.spento', { id, x: p.x, y: p.y, motivo, riflesso: p.riflesso });
  }

  /** Vero se il cerchio del proiettile tocca un solido che ferma i colpi. */
  function suOstacolo() {
    for (const s of campo.solidi) {
      if (s.ferma_colpi === false) continue;
      if (cerchioInRettangolo(p.x, p.y, p.r, s)) return true;
    }
    return false;
  }

  /**
   * Riflesso dalla parata (combattimento.md regola 11): torna da dove è venuto.
   * @param {number} nuovoDanno
   * @param {number} nuovaVelocita
   */
  function rifletti(nuovoDanno, nuovaVelocita) {
    p.dx = -p.dx;
    p.dy = -p.dy;
    p.danno = nuovoDanno;
    p.velocita = nuovaVelocita;
    p.riflesso = true;
    p.percorso = 0;
  }

  /**
   * Avanza di un passo fisso.
   * @param {number} dt secondi
   */
  function tick(dt) {
    if (!p.vivo) return;
    const passo = p.velocita * dt;
    p.x += p.dx * passo;
    p.y += p.dy * passo;
    p.percorso += passo;
    if (p.percorso > p.gittata) return spegni('gittata');
    if (suOstacolo()) return spegni('ostacolo');
    if (!p.riflesso) {
      const h = spada ? spada() : null;
      if (h && h.tipo === 'settore' && (h.fase === undefined || h.fase === 'attivo') && settoreColpisceCerchio(h, p)) return spegni('spada');
      if (bersaglio && bersaglio.stato !== 'morto' && cerchiSiToccano(p, bersaglio)) {
        const esito = bersaglio.colpisci({ danno: p.danno, pesante: false, x: p.x, y: p.y, imparabile: false, proiettile: facciata, boss });
        if (esito === 'danno') return spegni('bersaglio');
        // 'parata' → riflesso (rifletti è già stata chiamata); 'ignorato' (invulnerabile) → continua come nel Teatro
      }
      return undefined;
    }
    for (const n of nemici()) {
      if (!n || n.stato === 'morto' || n.stato === 'emersione' || typeof n.colpisci !== 'function') continue;
      if (cerchiSiToccano(p, n)) {
        n.colpisci(p.danno, null);
        return spegni('nemico');
      }
    }
    return undefined;
  }

  const facciata = {
    get id() { return id; },
    get x() { return p.x; },
    get y() { return p.y; },
    get r() { return p.r; },
    get danno() { return p.danno; },
    get velocita() { return p.velocita; },
    get direzione() { return { x: p.dx, y: p.dy }; },
    get riflesso() { return p.riflesso; },
    get vivo() { return p.vivo; },
    get percorso() { return p.percorso; },
    /** Perché si è spento (null da vivo). */
    get motivo() { return p.motivo; },
    get stato() { return p.vivo ? (p.riflesso ? 'riflesso' : 'in_volo') : 'spento'; },
    /** Marca per renderer e debug: è un proiettile nemico. */
    nemico: true,
    get origine() { return origine; },
    tick,
    rifletti,
    /** Cancellazione esterna (Tamburello). */
    cancella: () => spegni('cancellato'),
  };
  return facciata;
}

/**
 * Cancella i proiettili nemici vivi entro `raggio` da (x, y) (effetto del Tamburello); ritorna quanti.
 * @param {object[]} lista
 * @param {{ x: number, y: number, raggio: number }} o
 */
export function cancellaInRaggio(lista, { x, y, raggio }) {
  let n = 0;
  for (const p of lista) {
    if (!p?.nemico || !p.vivo) continue;
    if (Math.hypot(p.x - x, p.y - y) <= raggio + p.r) {
      p.cancella();
      n += 1;
    }
  }
  return n;
}

/**
 * Toglie dalla lista condivisa i proiettili spenti (ogni tipo con `vivo === false`); ritorna quanti ha tolto.
 * @param {object[]} lista
 */
export function potaSpenti(lista) {
  let n = 0;
  for (let i = lista.length - 1; i >= 0; i--) {
    if (lista[i] && lista[i].vivo === false) {
      lista.splice(i, 1);
      n += 1;
    }
  }
  return n;
}
