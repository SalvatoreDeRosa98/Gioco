/**
 * motore/resa/debug.js — Disegno DIAGNOSTICO in fil di ferro (storie 007-011).
 *
 * Non è il renderer del gioco (quello arriva con le storie 005/006/013 dopo l'approvazione della
 * tavola di qualità visiva): serve a verificare la logica a occhio e con Playwright. Attivo SOLO con
 * `?debug=1&wire=1`. Disegna: il pavimento a celle e le mura/ostacoli come rettangoli, il cerchio del
 * corpo di Ferruccio con la freccia del verso, il settore del fendente e il rettangolo dell'affondo
 * quando attivi, l'alone della finestra di parata, i cerchi dei bersagli con la vita in numero e lo
 * stato scritto in piccolo, i proiettili, e una riga di stato (stato del corpo, stato dell'attacco,
 * maschere, cariche).
 *
 * I colori vengono dai token CSS (unico posto con i colori); i testi sono etichette diagnostiche,
 * non testi di gioco. Nessun numero di gioco: geometrie e raggi arrivano dai moduli di logica.
 */

/**
 * @param {{
 *   canvas: HTMLCanvasElement,
 *   campo: import('../mondo/fisica.js').Campo,
 *   ferruccio: ReturnType<import('../attori/ferruccio.js').creaFerruccio>,
 *   combattimento: ReturnType<import('../attori/combattimento.js').creaCombattimento>,
 *   bersagli: () => object[],
 *   proiettili?: () => object[],
 *   token: (nome: string) => string,
 *   scena: { larghezza: number, altezza: number },
 *   contaTick?: () => number
 * }} opzioni `scena` è la risoluzione logica (il contesto è già trasformato dal canvas)
 */
export function creaResaDebug({ canvas, campo, ferruccio, combattimento, bersagli, proiettili = () => [], token, scena, contaTick = () => 0 }) {
  const ctx = canvas.getContext('2d');
  const colori = () => ({
    fondo: token('--colore-fondo'),
    pavimento: token('--pavimento'),
    muro: token('--carta'),
    griglia: token('--bruno'),
    corpo: token('--crema'),
    lama: token('--carta-luce'),
    parata: token('--azzurro'),
    nemico: token('--inchiostro'),
    nemicoLampo: token('--rosso'),
    testo: token('--colore-testo'),
    oro: token('--oro'),
  });

  function freccia(x, y, dx, dy, lunghezza) {
    const l = Math.hypot(dx, dy) || 1;
    const ux = dx / l;
    const uy = dy / l;
    const px = x + ux * lunghezza;
    const py = y + uy * lunghezza;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(px, py);
    ctx.lineTo(px - ux * 6 - uy * 4, py - uy * 6 + ux * 4);
    ctx.moveTo(px, py);
    ctx.lineTo(px - ux * 6 + uy * 4, py - uy * 6 - ux * 4);
    ctx.stroke();
  }

  function disegnaCampo(c) {
    ctx.fillStyle = c.pavimento;
    ctx.fillRect(campo.x, campo.y, campo.larghezza, campo.altezza);
    ctx.strokeStyle = c.griglia;
    ctx.lineWidth = 1;
    for (let i = 0; i <= campo.colonne; i++) {
      ctx.beginPath();
      ctx.moveTo(campo.x + i * campo.cella, campo.y);
      ctx.lineTo(campo.x + i * campo.cella, campo.y + campo.altezza);
      ctx.stroke();
    }
    for (let j = 0; j <= campo.righe; j++) {
      ctx.beginPath();
      ctx.moveTo(campo.x, campo.y + j * campo.cella);
      ctx.lineTo(campo.x + campo.larghezza, campo.y + j * campo.cella);
      ctx.stroke();
    }
    ctx.strokeStyle = c.muro;
    ctx.lineWidth = 2;
    for (const s of campo.solidi) {
      ctx.strokeRect(s.x, s.y, s.w, s.h);
      if (s.id !== 'muro') {
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + s.w, s.y + s.h);
        ctx.moveTo(s.x + s.w, s.y);
        ctx.lineTo(s.x, s.y + s.h);
        ctx.stroke();
      }
    }
  }

  function disegnaHitbox(c) {
    const h = combattimento.hitboxCorrente();
    if (!h) return;
    ctx.lineWidth = 2;
    if (h.tipo === 'settore') {
      const mezzo = (h.arcoGradi * Math.PI / 180) / 2;
      ctx.strokeStyle = c.lama;
      ctx.setLineDash(h.fase && h.fase !== 'attivo' ? [4, 4] : []);
      ctx.beginPath();
      ctx.moveTo(h.x, h.y);
      ctx.arc(h.x, h.y, h.portata, h.angolo - mezzo, h.angolo + mezzo);
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (h.tipo === 'rettangolo') {
      const ax = h.x2 - h.x1;
      const ay = h.y2 - h.y1;
      const l = Math.hypot(ax, ay) || 1;
      const nx = (-ay / l) * (h.larghezza / 2);
      const ny = (ax / l) * (h.larghezza / 2);
      ctx.strokeStyle = c.lama;
      ctx.beginPath();
      ctx.moveTo(h.x1 + nx, h.y1 + ny);
      ctx.lineTo(h.x2 + nx, h.y2 + ny);
      ctx.lineTo(h.x2 - nx, h.y2 - ny);
      ctx.lineTo(h.x1 - nx, h.y1 - ny);
      ctx.closePath();
      ctx.stroke();
    } else if (h.tipo === 'parata') {
      ctx.strokeStyle = c.parata;
      ctx.setLineDash(h.fase === 'finestra' ? [] : [3, 5]);
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function disegnaFerruccio(c) {
    ctx.strokeStyle = c.corpo;
    ctx.lineWidth = ferruccio.invulnerabile() ? 1 : 2;
    ctx.setLineDash(ferruccio.invulnerabile() ? [3, 3] : []);
    ctx.beginPath();
    ctx.arc(ferruccio.x, ferruccio.y, ferruccio.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    const mira = ferruccio.direzioneMira();
    freccia(ferruccio.x, ferruccio.y, mira.x, mira.y, ferruccio.r + 10);
    ctx.fillStyle = c.testo;
    ctx.font = '11px monospace';
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'center';
    ctx.fillText(`${ferruccio.stato} · ${combattimento.stato}${combattimento.fase ? `/${combattimento.fase}` : ''}`, ferruccio.x, ferruccio.y - ferruccio.r - 4);
  }

  function disegnaBersagli(c) {
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    for (const b of bersagli()) {
      if (!b) continue;
      const morto = b.stato === 'morto';
      ctx.strokeStyle = b.lampoAcceso ? c.nemicoLampo : c.nemico;
      ctx.lineWidth = b.stato === 'anticipo' || b.stato === 'lampo' || b.stato === 'colpo' ? 3 : 2;
      ctx.setLineDash(morto ? [2, 4] : []);
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = c.testo;
      ctx.textBaseline = 'middle';
      ctx.fillText(String(Math.round(b.vita * 100) / 100), b.x, b.y);
      ctx.textBaseline = 'top';
      ctx.fillText(`${b.stato}${b.imparabile ? ' !' : ''}${b.peso >= 3 ? ' ■' : ''}`, b.x, b.y + b.r + 3);
    }
    for (const p of proiettili()) {
      if (!p?.vivo) continue;
      ctx.strokeStyle = p.riflesso ? c.parata : c.nemicoLampo;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.stroke();
      freccia(p.x, p.y, p.direzione.x, p.direzione.y, p.r + 8);
    }
  }

  function disegnaRiga(c) {
    ctx.fillStyle = c.testo;
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const riga = [
      `tick ${contaTick()}`,
      `corpo ${ferruccio.stato}`,
      `attacco ${combattimento.stato}${combattimento.fase ? `/${combattimento.fase}` : ''}${combattimento.numero ? ` #${combattimento.numero}` : ''}`,
      `maschere ${ferruccio.maschere}`,
      `cariche ${ferruccio.cariche}`,
      `pos ${ferruccio.x.toFixed(0)},${ferruccio.y.toFixed(0)}`,
      combattimento.controcolpoAttivo ? 'CONTROCOLPO' : '',
      combattimento.caricaCompleta ? 'LAMA ACCESA' : '',
    ].filter(Boolean).join('   ');
    ctx.fillText(riga, 16, 16);
    ctx.fillText('wire: diagnostica, non resa (storie 005/006/013 bloccate dalla tavola visiva)', 16, 36);
  }

  return {
    disegna() {
      const c = colori();
      ctx.fillStyle = c.fondo;
      ctx.fillRect(0, 0, scena.larghezza, scena.altezza);
      disegnaCampo(c);
      disegnaHitbox(c);
      disegnaBersagli(c);
      disegnaFerruccio(c);
      disegnaRiga(c);
    },
  };
}
