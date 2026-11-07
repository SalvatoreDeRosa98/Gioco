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
 * Storie 014-017 (opzionali `notte` e `camera`): la stanza è disegnata dentro la trasformazione della
 * camera (scala per le doppie, scorrimento della transizione); porte colorate per stato (soglia
 * d'oro aperta, pannello d'inchiostro chiuso, pannello parziale in corsa), finestre accese, piedi e
 * cerchi tratteggiati dei bracieri, contenuti, segnalini di nascita, punti di spawn; in un angolo la
 * pianta del piano (celle con la lettera del tipo, stanza corrente piena, porte come segmenti,
 * finestre come tacche) e una riga di stato della stanza.
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
 *   contaTick?: () => number,
 *   notte?: (() => object | null) | null,
 *   camera?: object | null
 * }} opzioni `scena` è la risoluzione logica (il contesto è già trasformato dal canvas)
 */
export function creaResaDebug({
  canvas, campo, ferruccio, combattimento, bersagli, proiettili = () => [], token, scena, contaTick = () => 0, notte = null, camera = null,
}) {
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
    ctx.lineWidth = 2;
    for (const s of campo.solidi) {
      if (s.id === 'porta') {
        disegnaPorta(c, s);
        continue;
      }
      if (s.id === 'finestra') {
        ctx.fillStyle = c.oro;
        ctx.fillRect(s.x + s.w * 0.25, s.y + s.h * 0.25, s.w * 0.5, s.h * 0.5);
        ctx.strokeStyle = c.muro;
        ctx.strokeRect(s.x, s.y, s.w, s.h);
        continue;
      }
      ctx.strokeStyle = s.ferma_colpi === false ? c.griglia : c.muro;
      ctx.setLineDash(s.ferma_passo === false ? [3, 3] : []);
      ctx.strokeRect(s.x, s.y, s.w, s.h);
      ctx.setLineDash([]);
      if (s.id !== 'muro') {
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + s.w, s.y + s.h);
        if (s.ferma_colpi !== false) {
          ctx.moveTo(s.x + s.w, s.y);
          ctx.lineTo(s.x, s.y + s.h);
        }
        ctx.stroke();
        ctx.fillStyle = c.testo;
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(s.id, s.x + s.w / 2, s.y + 2);
      }
    }
  }

  /** Porta: soglia d'oro se passabile, pannello d'inchiostro se chiusa, pannello parziale in corsa. */
  function disegnaPorta(c, s) {
    const porta = notte?.()?.stanza?.portaIn(s.slot);
    const stato = porta?.stato ?? 'aperta';
    const prog = porta?.progresso() ?? 1;
    const quota = stato === 'chiusa' ? 1 : stato === 'chiudendo' ? prog : stato === 'aprendo' ? 1 - prog : 0;
    ctx.strokeStyle = c.muro;
    ctx.setLineDash([2, 2]);
    ctx.strokeRect(s.x, s.y, s.w, s.h);
    ctx.setLineDash([]);
    if (quota > 0) {
      ctx.fillStyle = c.nemico;
      if (s.lato === 'N' || s.lato === 'S') ctx.fillRect(s.x, s.y, s.w, s.h * quota);
      else ctx.fillRect(s.x, s.y, s.w * quota, s.h);
    }
    if (quota < 1) {
      ctx.strokeStyle = c.oro;
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (s.lato === 'N') { ctx.moveTo(s.x, s.y + s.h); ctx.lineTo(s.x + s.w, s.y + s.h); }
      else if (s.lato === 'S') { ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + s.w, s.y); }
      else if (s.lato === 'W') { ctx.moveTo(s.x + s.w, s.y); ctx.lineTo(s.x + s.w, s.y + s.h); }
      else { ctx.moveTo(s.x, s.y); ctx.lineTo(s.x, s.y + s.h); }
      ctx.stroke();
      ctx.lineWidth = 2;
    }
    ctx.fillStyle = c.testo;
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${s.slot} ${stato}`, s.x + s.w / 2, s.y + s.h / 2);
  }

  /** Pericoli, contenuti, segnalini e punti di nascita della stanza corrente. */
  function disegnaStanza(c) {
    const st = notte?.()?.stanza;
    if (!st) return;
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    for (const p of st.spawnPunti) {
      ctx.fillStyle = c.griglia;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    for (const p of st.pericoli) {
      ctx.strokeStyle = c.nemico;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.rFiamma, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = c.testo;
      ctx.textBaseline = 'top';
      ctx.fillText(p.id, p.x, p.y + p.rFiamma + 2);
    }
    for (const k of st.contenuti) {
      ctx.strokeStyle = c.parata;
      ctx.lineWidth = 2;
      ctx.strokeRect(k.x - 10, k.y - 10, 20, 20);
      ctx.fillStyle = c.testo;
      ctx.textBaseline = 'bottom';
      ctx.fillText(k.tipo, k.x, k.y - 12);
    }
    for (const sg of st.segnalini) {
      ctx.strokeStyle = c.nemico;
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(sg.x, sg.y, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = c.testo;
      ctx.textBaseline = 'top';
      ctx.fillText(sg.archetipo, sg.x, sg.y + 16);
    }
  }

  /** Pianta del piano in un angolo (storia 016): celle con la lettera del tipo, stanza corrente piena. */
  function disegnaPianta(c) {
    const n = notte?.();
    if (!n) return;
    const lettere = { ingresso: 'I', normale: 'N', tesoro: 'T', banchetto: 'Q', boss: 'B', segreta: 'S', ricordo: 'M' };
    const lato = 20;
    const x0 = scena.larghezza - n.pianta.griglia.w * lato - 16;
    const y0 = 16;
    const centro = (cella) => ({ x: x0 + (cella[0] + 0.5) * lato, y: y0 + (cella[1] + 0.5) * lato });
    ctx.fillStyle = c.fondo;
    ctx.fillRect(x0 - 4, y0 - 4, n.pianta.griglia.w * lato + 8, n.pianta.griglia.h * lato + 8);
    ctx.strokeStyle = c.griglia;
    ctx.lineWidth = 1;
    ctx.strokeRect(x0 - 4, y0 - 4, n.pianta.griglia.w * lato + 8, n.pianta.griglia.h * lato + 8);
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const s of n.pianta.stanze) {
      const corrente = n.stanza?.id === s.id;
      const stato = n.statoDi(s.id)?.stato;
      for (const cella of s.celle) {
        const p = centro(cella);
        ctx.fillStyle = corrente ? c.oro : stato === 'pulita' ? c.pavimento : c.fondo;
        ctx.fillRect(p.x - lato / 2 + 1, p.y - lato / 2 + 1, lato - 2, lato - 2);
        ctx.strokeStyle = s.tipo === 'segreta' ? c.oro : c.muro;
        ctx.strokeRect(p.x - lato / 2 + 1, p.y - lato / 2 + 1, lato - 2, lato - 2);
        ctx.fillStyle = corrente ? c.fondo : c.testo;
        ctx.fillText(lettere[s.tipo] ?? '?', p.x, p.y);
      }
      // porte: segmento tra i centri delle celle collegate; finestre: tacca d'oro
      ctx.strokeStyle = c.testo;
      for (const verso of Object.values(s.porte)) {
        const altra = n.pianta.stanze.find((t) => t.id === verso);
        if (!altra || altra.id < s.id) continue;
        const a = centro(s.celle[0]);
        const b = centro(altra.celle[0]);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.fillStyle = c.oro;
      for (const slot of s.finestre ?? []) {
        const meta = slot.length > 1 ? Number(slot[1]) : 0;
        const p = centro(s.celle[Math.min(meta, s.celle.length - 1)]);
        const l = slot[0];
        const dx = l === 'E' ? lato / 2 - 2 : l === 'W' ? -lato / 2 : 0;
        const dy = l === 'S' ? lato / 2 - 2 : l === 'N' ? -lato / 2 : 0;
        ctx.fillRect(p.x + dx - (dx === 0 ? 3 : 0), p.y + dy - (dy === 0 ? 3 : 0), dx === 0 ? 6 : 2, dy === 0 ? 6 : 2);
      }
    }
    ctx.fillStyle = c.testo;
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`piano ${n.piano} · seme ${n.seme} · Q ${n.pianta.Q}${n.pianta.riserva ? ' · RISERVA' : ''}`, x0 + n.pianta.griglia.w * lato + 4, y0 + n.pianta.griglia.h * lato + 8);
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
      ctx.fillText(`${b.archetipo ? `${b.archetipo} ` : ''}${b.stato}${b.imparabile ? ' !' : ''}${b.peso >= 3 ? ' ■' : ''}`, b.x, b.y + b.r + 3);
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
    const n = notte?.();
    if (n?.stanza) {
      const st = n.stanza;
      const riga2 = [
        `stanza ${st.id} ${st.tipo} ${st.modello.id} ${st.modello.dim}`,
        `stato ${st.stato}${st.combatte ? ` ondata ${st.ondata}/${st.quote.length} (${st.quote.join('+')})` : ''}`,
        `vivi ${st.vivi()}`,
        `porte ${st.porte.map((p) => `${p.slot}:${p.stato}`).join(' ')}`,
        `camera ×${camera ? camera.scala.toFixed(3) : '1'}${camera?.inTransizione ? ` transizione ${camera.lato} ${(camera.progresso() * 100).toFixed(0)}%` : ''}`,
      ].join('   ');
      ctx.fillText(riga2, 16, 56);
    }
  }

  return {
    disegna() {
      const c = colori();
      ctx.fillStyle = c.fondo;
      ctx.fillRect(0, 0, scena.larghezza, scena.altezza);
      ctx.save();
      if (camera) camera.applica(ctx);
      disegnaCampo(c);
      disegnaStanza(c);
      disegnaHitbox(c);
      disegnaBersagli(c);
      disegnaFerruccio(c);
      ctx.restore();
      disegnaRiga(c);
      disegnaPianta(c);
    },
  };
}
