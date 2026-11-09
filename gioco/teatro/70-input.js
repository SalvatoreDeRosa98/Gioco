/*
 * teatro/70-input.js — Tastiera, mouse e bottoni della pagina (listener).
 * Script classico (niente moduli ES): le dichiarazioni di primo livello stanno nello scope globale
 * condiviso con gli altri file di teatro/. Ordine di caricamento e regole: teatro/LEGGIMI.md.
 */

const keys = {};

window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  player.targetX = null;
  player.targetY = null;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  // --- D: inizio --- Diario degli oggetti: si apre dal menu ESC con O e prende i tasti finché è aperto
  if (statoRun.diarioD) { tastoDiarioD(e.code); return; }
  if (statoRun.pausa && e.code === 'KeyO') { apriDiarioD(); return; }
  // --- D: fine ---
  // --- T4: inizio ---
  if (t4Gancio('tasto', e)) return;
  // --- T4: fine ---

  if (statoRun.fase === 'menu_selezione') {
    const charIds = ['ferruccio', 'agnese', 'taddeo', 'ombra'];
    let currIdx = charIds.indexOf(statoRun.personaggioId);
    if (currIdx === -1) currIdx = 0;
    if (['ArrowLeft', 'KeyA'].includes(e.code)) {
      currIdx = (currIdx - 1 + charIds.length) % charIds.length;
      selezionaPersonaggio(charIds[currIdx]);
    } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
      currIdx = (currIdx + 1) % charIds.length;
      selezionaPersonaggio(charIds[currIdx]);
    } else if (e.code === 'Digit1') selezionaPersonaggio('ferruccio');
    else if (e.code === 'Digit2') selezionaPersonaggio('agnese');
    else if (e.code === 'Digit3') selezionaPersonaggio('taddeo');
    else if (e.code === 'Digit4') selezionaPersonaggio('ombra');
    else if (['Space', 'Enter'].includes(e.code)) {
      avviaPartitaConPersonaggio(statoRun.personaggioId);
    }
    return;
  }

  // --- B: inizio --- (pannello della Stanza dello Sviluppatore: prende tutti i tasti, Esc compreso)
  if (statoRun.pannelloB && statoRun.fase === 'in_gioco' && !statoRun.pausa) { tastoPannelloB(e.code); return; }
  // --- B: fine ---
  if (e.code === 'Escape') {
    // --- T4: inizio --- (il menu ESC dell'autore vale anche nell'hub di Piazza Dante)
    if (statoRun.fase === 'in_gioco' || statoRun.fase === 'hub') {
    // --- T4: fine ---
      if (statoRun.siparioAttivo) {
        statoRun.siparioAttivo = null;
      } else {
        statoRun.pausa = !statoRun.pausa;
      }
    }
    return;
  }

  if (statoRun.pausa) {
    if (e.code === 'KeyR') {
      ricominciaNotte();
    } else if (e.code === 'KeyM') {
      AudioSys.toggle();
    } else if (['Space', 'Enter'].includes(e.code)) {
      statoRun.pausa = false;
    }
    return;
  }

  if (statoRun.siparioAttivo) {
    statoRun.siparioAttivo = null;
    if (['Space', 'KeyE', 'Enter', 'Escape'].includes(e.code)) {
      return;
    }
    // Se premi WASD o Frecce, il sipario si alza e il movimento prosegue istantaneamente senza freeze!
  }

  if (e.code === 'KeyQ') usaOggettoAttivo();
  if (e.code === 'KeyE') interagisciStanza();
  if (e.code === 'Space') eseguiAttacco4Direzioni(player.dirX, player.dirY);
});

window.addEventListener('keyup', (e) => { keys[e.code] = false; });

wrap.addEventListener('mouseenter', () => {
  try { window.focus(); wrap.focus({ preventScroll: true }); } catch (_) {}
});

canvas.addEventListener('mousedown', (e) => {
  try { window.focus(); wrap.focus({ preventScroll: true }); } catch (_) {}
  const r = canvas.getBoundingClientRect();
  const mx = (e.clientX - r.left) * (W / r.width);
  const my = (e.clientY - r.top) * (H / r.height);

  if (statoRun.pausa) {
    gestisciClickMenuPausa(mx, my);
    return;
  }
  // --- T4: inizio ---
  if (t4Gancio('click', mx, my)) return;
  // --- T4: fine ---

  if (statoRun.fase === 'menu_selezione') {
    const charIds = ['ferruccio', 'agnese', 'taddeo', 'ombra'];
    const cardW = 132, cardH = 224, cardY = 56, gap = 14, startX = 35;
    for (let i = 0; i < charIds.length; i++) {
      const cx = startX + i * (cardW + gap);
      if (mx >= cx && mx <= cx + cardW && my >= cardY && my <= cardY + cardH) {
        if (statoRun.personaggioId === charIds[i]) {
          avviaPartitaConPersonaggio(charIds[i]);
        } else {
          selezionaPersonaggio(charIds[i]);
        }
        return;
      }
    }
    if (mx >= 150 && mx <= 490 && my >= 298 && my <= 344) {
      avviaPartitaConPersonaggio(statoRun.personaggioId);
      return;
    }
    return;
  }

  if (statoRun.siparioAttivo) {
    statoRun.siparioAttivo = null;
    return;
  }

  // --- B: inizio ---
  if (statoRun.pannelloB) { clickPannelloB(mx, my); return; }
  // --- B: fine ---

  // Click sullo Slot Oggetto Attivo [Q] in basso a sinistra nella dock
  if (mx >= 214 && mx <= 246 && my >= H - 36 && my <= H - 6) {
    usaOggettoAttivo();
    return;
  }

  const st = statoRun.stanzaCorrente;
  if (!st) return;

  if (statoRun.mappa && st.pulita) {
    const cell = 12, x0 = W - 118, y0 = 24;
    for (const s of statoRun.mappa.stanze) {
      if (!s.visitata) continue;
      const px = x0 + (s.cx - 1) * cell;
      const py = y0 + (s.cy - 1) * cell;
      if (mx >= px && mx <= px + cell && my >= py && my <= py + cell) {
        entraInStanza(s, null);
        return;
      }
    }
  }

  if (st.pulita) {
    const porteClick = {
      N: { x: 320, y: 66, rx: 28, ry: 20, opp: 'S' },
      S: { x: 320, y: 310, rx: 28, ry: 20, opp: 'N' },
      W: { x: 62, y: 188, rx: 20, ry: 28, opp: 'E' },
      E: { x: 578, y: 188, rx: 20, ry: 28, opp: 'W' },
    };
    // --- C: la Stanza Segreta non si apre più col click (né con E): solo bomba ferma o 3 colpi ---
    for (const [lato, idDest] of Object.entries(st.porte)) {
      const pc = porteClick[lato];
      if (Math.abs(mx - pc.x) <= pc.rx && Math.abs(my - pc.y) <= pc.ry) {
        entraInStanza(statoRun.mappa.perId.get(idDest), pc.opp);
        return;
      }
    }
  }

  if (st.pulita && st.oggettoPiedistallo && !st.oggettoPiedistallo.preso) {
    const o = st.oggettoPiedistallo;
    if (Math.hypot(mx - o.x, my - o.y) < 36) {
      player.x = o.x;
      player.y = o.y + 12;
      acquisisciOggettoConLimite5Slot({ ...o }, 'piedistallo', o);
      return;
    }
  }

  if (st.tipo === 'fucina' || st.tipo === 'patto') {
    const listaSlot = st.tipo === 'patto' ? st.slotPatto : st.slotFucina;
    for (const sl of listaSlot || []) {
      if (!sl.comprato && Math.hypot(mx - sl.x, my - sl.y) < 32) {
        player.x = sl.x;
        player.y = sl.y + 14;
        interagisciStanza();
        return;
      }
    }
  }

  // Click sulla Porta del Patto d'Ombra (nella stanza del Boss sconfitto) o sulla porta di ritorno dal Patto
  if (st.tipo === 'boss' && st.portaPattoAperta && Math.hypot(mx - 430, my - 190) < 34) {
    const stanzaPatto = statoRun.mappa?.stanze.find((x) => x.tipo === 'patto');
    if (stanzaPatto) entraInStanza(stanzaPatto, null);
    return;
  }
  if (st.tipo === 'patto' && Math.hypot(mx - 320, my - 252) < 36) {
    const bossRoom = statoRun.mappa?.stanze.find((x) => x.tipo === 'boss');
    if (bossRoom) entraInStanza(bossRoom, null);
    return;
  }

  if (st.tipo === 'boss' && st.uscitaAperta && Math.hypot(mx - 320, my - 190) < 34) {
    interagisciStanza();
    return;
  }

  const dx = mx - player.x;
  const dy = my - player.y;
  let dirX = 0, dirY = 0;
  if (Math.abs(dx) >= Math.abs(dy)) dirX = dx >= 0 ? 1 : -1;
  else dirY = dy >= 0 ? 1 : -1;
  player.targetX = Math.max(ARENA.x1, Math.min(ARENA.x2, mx));
  player.targetY = Math.max(ARENA.y1, Math.min(ARENA.y2, my));
  eseguiAttacco4Direzioni(dirX, dirY);
});

function aggiornaBottoniPiano() {
  // Toolbar sviluppatore rimossa: funzione conservata per compatibilità
}

function bLeg(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', fn);
}

bLeg('btn-menu-char', () => { statoRun.fase = 'menu_selezione'; statoRun.siparioAttivo = null; });

bLeg('btn-new-run', () => ricominciaNotte());

for (const charId of ['ferruccio', 'agnese', 'taddeo', 'ombra']) {
  bLeg(`btn-char-${charId}`, () => {
    selezionaPersonaggio(charId);
    if (statoRun.fase === 'in_gioco') avviaPartitaConPersonaggio(charId); // (T4) passa dall'hub
  });
}

for (let p = 1; p <= 4; p++) bLeg(`btn-p${p}`, () => avviaPiano(p, true));

bLeg('btn-p5', () => avviaPiano(statoRun.piano >= 5 ? statoRun.piano + 1 : 5, true));

bLeg('btn-segreta', () => {
  statoRun.siparioAttivo = null;
  const s = statoRun.mappa?.stanze.find((x) => x.tipo === 'segreta');
  if (s) {
    const genitore = statoRun.mappa.stanze.find((g) => g.muroSegreto?.idDest === s.id);
    if (genitore) apriMuroSegreto(genitore);
    entraInStanza(s, null);
  }
});

bLeg('btn-fucina', () => {
  statoRun.siparioAttivo = null;
  const s = statoRun.mappa?.stanze.find((x) => x.tipo === 'fucina');
  if (s) entraInStanza(s, null);
});

bLeg('btn-patto', () => {
  statoRun.siparioAttivo = null;
  const s = statoRun.mappa?.stanze.find((x) => x.tipo === 'patto');
  if (s) entraInStanza(s, null);
});

bLeg('btn-boss', () => {
  statoRun.siparioAttivo = null;
  const s = statoRun.mappa?.stanze.find((x) => x.tipo === 'boss');
  if (s) entraInStanza(s, null);
});

bLeg('btn-storia', () => {
  statoRun.siparioAttivo = getRaccontoAtto(statoRun.piano, statoRun.ciclo);
});

bLeg('btn-audio', () => {
  AudioSys.toggle();
});
