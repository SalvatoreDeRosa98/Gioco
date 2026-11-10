'use strict';
/*
 * lanciatore/macchina.js — che macchina è questa: CPU, regolatore di frequenza, memoria (Linux; altrove «?»).
 * Serve nei log della console: un regolatore che non è «performance» o una frequenza bassa spiegano da soli
 * metà della lentezza.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const leggiFile = (f) => { try { return fs.readFileSync(f, 'utf8').trim(); } catch (_) { return ''; } };
const DIR_FREQ = ['/sys/devices/system/cpu/cpu0/cpufreq', '/sys/devices/system/cpu/cpufreq/policy0'].find((d) => fs.existsSync(d)) || '';
const mhz = (file) => { const v = Number(leggiFile(path.join(DIR_FREQ, file))); return v ? Math.round(v / 1000) : 0; };

/** Frequenza attuale del primo core in MHz (0 se il sistema non la dice). */
function frequenzaMHz() { return DIR_FREQ ? mhz('scaling_cur_freq') : 0; }

/** Una riga che descrive la macchina. */
function macchina() {
  const info = leggiFile('/proc/cpuinfo');
  const campo = (nome) => { const m = new RegExp('^' + nome + '\\s*:\\s*(.+)$', 'mi').exec(info); return m ? m[1].trim() : ''; };
  const cpu = campo('model name') || campo('Hardware') || [campo('CPU implementer'), campo('CPU part')].filter(Boolean).join(' parte ') || '?';
  const mem = leggiFile('/proc/meminfo');
  const mb = (nome) => { const m = new RegExp('^' + nome + ':\\s*(\\d+)', 'm').exec(mem); return m ? Math.round(Number(m[1]) / 1024) : 0; };
  const regolatore = DIR_FREQ ? leggiFile(path.join(DIR_FREQ, 'scaling_governor')) : '';
  return `CPU «${cpu}» × ${os.cpus().length} · regolatore «${regolatore || '?'}» · ora ${frequenzaMHz() || '?'} MHz (min ${mhz('scaling_min_freq') || '?'}, max ${mhz('scaling_max_freq') || '?'}) · memoria ${mb('MemTotal')} MB, libera ${mb('MemAvailable')} MB`;
}

module.exports = { macchina, frequenzaMHz };
