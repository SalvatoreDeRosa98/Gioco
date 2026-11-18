#!/usr/bin/env node
/*
 * tools/meshy-lotto.js — manda a Meshy un lotto di disegni (image-to-3d con colore) e scarica i modelli.
 *
 * Uso: NODE_USE_ENV_PROXY=1 node tools/meshy-lotto.js <lotto.json> [nome nome …]
 * Il lotto: { stile: "<guida al colore, max 600 caratteri>", lavori: [{ nome, ingresso (immagine), stile? }] }.
 * Il registro production/arte/meshy/lavori.json ricorda per ogni nome l'ID del lavoro, lo stato e i crediti spesi:
 * un lavoro che ha già un ID NON viene mai rimandato (si riprende ad aspettarlo e a scaricarlo). Ogni invio costa
 * crediti dell'autore: il lotto va lanciato solo su ciò che l'autore ha approvato.
 * I modelli finiscono in meshy_output/<nome>/<nome>.glb (cartella ignorata dal repository), con l'anteprima.
 * Si ferma subito se Meshy risponde che i crediti non bastano.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const RADICE = path.resolve(__dirname, '..');
const REGISTRO = path.join(RADICE, 'production', 'arte', 'meshy', 'lavori.json');
const FUORI = path.join(RADICE, 'meshy_output');
const lotto = JSON.parse(fs.readFileSync(path.resolve(process.argv[2]), 'utf8'));
const soli = process.argv.slice(3);
const registro = fs.existsSync(REGISTRO) ? JSON.parse(fs.readFileSync(REGISTRO, 'utf8')) : {};
const salva = () => fs.writeFileSync(REGISTRO, JSON.stringify(registro, null, 1) + '\n');

/** Lancia il programma di Meshy e rende la busta JSON (o { ok: false, error }). */
function meshy(args, attesaS) {
  const r = spawnSync('npm', ['exec', '--yes', '--package=meshy-cli@0.4.0', '--', 'meshy', ...args, '--output-schema', 'v1', '--format', 'json', '--no-update-check'],
    { cwd: RADICE, encoding: 'utf8', env: Object.assign({}, process.env, { NODE_USE_ENV_PROXY: '1' }), timeout: (attesaS || 120) * 1000, maxBuffer: 64 * 1024 * 1024 });
  const t = r.stdout || ''; const i = t.indexOf('{');
  try { return JSON.parse(t.slice(i)); } catch (e) { return { ok: false, error: { code: 'non_json', message: (r.stderr || t).slice(0, 300) } }; }
}

const lavori = lotto.lavori.filter((l) => !soli.length || soli.includes(l.nome));
let fermo = false;
// 1) invii (una volta sola per nome)
for (const l of lavori) {
  const v = registro[l.nome] || (registro[l.nome] = { ingresso: l.ingresso });
  if (v.task_id || fermo) continue;
  const d = meshy(['image-to-3d', 'create', '--image-url', l.ingresso, '--model-type', 'standard', '--should-texture', 'true', '--enable-pbr', 'false',
    '--texture-resolution', '2k', '--pose-mode', 'auto', '--remove-lighting', 'false', '--texture-prompt', l.stile || lotto.stile, '--target-formats', 'glb',
    '--operation-id', `lotto-${l.nome}-1`, '--async'], 180);
  const id = d.ok && d.result && d.result.submission && d.result.submission.task_id;
  if (id) { v.task_id = id; v.stato = 'INVIATO'; console.log('inviato', l.nome, id); }
  else { v.errore = d.error; console.log('NON inviato', l.nome, JSON.stringify(d.error).slice(0, 200)); if (d.error && d.error.code === 'credit') fermo = true; }
  salva();
}
// 2) attesa e scarico
for (const l of lavori) {
  const v = registro[l.nome]; if (!v || !v.task_id) continue;
  const dir = path.join(FUORI, l.nome); fs.mkdirSync(dir, { recursive: true });
  const glb = path.join(dir, l.nome + '.glb');
  if (v.stato !== 'SUCCEEDED') {
    const d = meshy(['image-to-3d', 'wait', v.task_id, '--timeout', '900'], 960);
    const k = (d.result && (d.result.task || d.result)) || {};
    v.stato = k.status || (d.error && d.error.code) || 'IGNOTO'; if (k.consumed_credits !== undefined) v.crediti = k.consumed_credits;
    if (d.error) v.errore = d.error; salva();
    console.log('finito', l.nome, v.stato, 'crediti', v.crediti);
  }
  if (v.stato === 'SUCCEEDED' && !fs.existsSync(glb)) {
    const d = meshy(['download', '--resource', 'image-to-3d', '--task-id', v.task_id, '--model-format', 'glb', '--output', glb, '--workspace', FUORI], 600);
    meshy(['download', '--resource', 'image-to-3d', '--task-id', v.task_id, '--asset', 'thumbnail.primary', '--output', path.join(dir, 'anteprima.png'), '--workspace', FUORI], 120);
    console.log('scaricato', l.nome, d.ok ? Math.round(fs.statSync(glb).size / 1e6) + ' MB' : JSON.stringify(d.error).slice(0, 200));
  }
}
const tot = Object.values(registro).reduce((s, v) => s + (v.crediti || 0), 0);
console.log(`registro: ${Object.keys(registro).length} lavori, ${Object.values(registro).filter((v) => v.stato === 'SUCCEEDED').length} riusciti, ${tot} crediti in tutto`);
