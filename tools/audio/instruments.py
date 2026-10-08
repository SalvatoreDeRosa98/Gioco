"""Strumenti sintetici (tavolozza alla Christopher Larkin, ma nostra).

Ogni funzione rende UNA nota e restituisce un array mono (n,) o stereo (2, n)
che include la coda di rilascio. Firma comune: f(freq, dur, vel, rng, **opzioni)
  freq  frequenza in Hz        dur  durata tenuta in secondi
  vel   dinamica 0..1          rng  numpy Generator (determinismo)

Tecniche:
- archi / ottoni / coro: oscillatori a tabella band-limited, ensemble di voci
  stonate di pochi cent, vibrato ritardato, deriva lenta; brillantezza che segue
  l'inviluppo (incrocio tra tabella scura e chiara con le stesse fasi).
- pianoforte "di feltro": sintesi additiva con inarmonicità (f_k = k f0 sqrt(1+Bk^2)),
  due corde per nota (battimenti), doppio decadimento, colpo di martelletto.
- celesta / carillon / campane: parziali inarmoniche con decadimenti propri.
- arpa: additiva con spettro di pizzico (posizione p).
- mandolino e pizzicati: Karplus-Strong con ritardo frazionario (allpass)
  risolto come filtro IIR con scipy (veloce); tremolo = più plettrate nella stessa corda.
- percussioni: timpano a modi, gran cassa con caduta di intonazione, tamburello.
"""
from __future__ import annotations

import numpy as np
import scipy.signal as ss

from dsp import (SR, TWO_PI, env_asr, env_perc, filt, hp, lp, bp, osc_table, ramp_cos,
				 smooth_noise, table_from_harmonics, pan_mono, db)


def _n(sec: float) -> int:
	return max(1, int(sec * SR))


# ------------------------------------------------------------------ archi e simili

def _voice_freq(freq: float, n: int, rng, detune_c: float, vib_c: float, vib_delay: float,
				drift_c: float = 3.0, scoop_c: float = 0.0, scoop_t: float = 0.08) -> np.ndarray:
	t = np.arange(n) / SR
	rate = rng.uniform(4.6, 5.8)
	vib_on = np.clip((t - vib_delay) / 0.6, 0, 1)
	vib_on = vib_on * vib_on * (3 - 2 * vib_on)
	rate_wobble = 1 + 0.06 * smooth_noise(n, 0.7, rng)
	vib = vib_c * vib_on * np.sin(TWO_PI * np.cumsum(rate * rate_wobble) / SR + rng.uniform(0, TWO_PI))
	cents = detune_c + vib + drift_c * smooth_noise(n, 0.4, rng)
	if scoop_c:
		cents = cents + scoop_c * np.exp(-t / scoop_t)
	return freq * 2 ** (cents / 1200)


def _tables(freq: float, rng, slope: float, dark_fc: float, bright_fc: float, max_hz: float = 11000.0,
			jitter_db: float = 1.5, formant=None):
	h = int(max(1, min(max_hz, 0.44 * SR / 1.03) // freq))
	k = np.arange(1, h + 1)
	fk = k * freq
	base = k ** (-slope) * 10 ** (rng.normal(0, jitter_db, h) / 20)
	if formant is not None:
		base = base * formant(fk)
	ph = rng.uniform(0, TWO_PI, h)
	dark = base / np.sqrt(1 + (fk / dark_fc) ** 4)
	bright = base / np.sqrt(1 + (fk / bright_fc) ** 4)
	return table_from_harmonics(dark, ph), table_from_harmonics(bright, ph)


def ensemble(freq: float, dur: float, vel: float, rng, voices: int = 4, attack: float = 0.35,
			 release: float = 0.9, detune: float = 6.0, vib: float = 11.0, vib_delay: float = 0.35,
			 slope: float = 1.0, dark_fc: float = 900.0, bright_fc: float = 4200.0, brightness: float = 0.6,
			 swell: float = 0.25, tremolo: float = 0.0, trem_rate: float = 12.0, spread: float = 0.5,
			 scoop: float = 0.0, max_hz: float = 11000.0, onset_jit: float = 0.03, formant=None,
			 accent: float = 0.0) -> np.ndarray:
	"""Sezione d'archi (o ottoni/coro) come ensemble di voci. Restituisce stereo."""
	n = _n(dur + release + 0.1)
	out = np.zeros((2, n))
	t = np.arange(n) / SR
	for v in range(voices):
		off = int(rng.uniform(0, onset_jit) * SR)
		m = n - off
		if m <= 0:
			continue
		f = _voice_freq(freq, m, rng, rng.normal(0, detune), vib * rng.uniform(0.7, 1.2),
						vib_delay * rng.uniform(0.7, 1.4), scoop_c=scoop)
		ph = np.cumsum(f) / SR + rng.random()
		dark, bright = _tables(freq, rng, slope, dark_fc, bright_fc, max_hz, formant=formant)
		a = attack * rng.uniform(0.8, 1.25)
		e = env_asr(m, a, max(a, dur - off / SR), release * rng.uniform(0.85, 1.15))
		tt = t[:m]
		if swell and dur > 0.6:
			x = np.clip(tt / max(dur, 1e-3), 0, 1)
			e = e * (1 - swell + swell * np.sin(np.pi * x) ** 0.8 + swell * 0.15)
		if accent:
			e = e * (1 + accent * np.exp(-tt / 0.07))
		mix = np.clip(brightness * (0.45 + 0.55 * vel) * (e / (e.max() + 1e-9)) ** 0.7, 0, 1)
		sig = osc_table(dark, ph)
		sig = sig + mix * (osc_table(bright, ph) - sig)
		if tremolo:
			r = trem_rate * rng.uniform(0.92, 1.08) * (1 + 0.05 * smooth_noise(m, 1.0, rng))
			am = 0.5 + 0.5 * np.sin(TWO_PI * np.cumsum(r) / SR + rng.uniform(0, TWO_PI))
			sig = sig * (1 - tremolo * am)
		# l'arco non è mai perfettamente uniforme: un respiro lento d'ampiezza per voce
		sig = sig * e * rng.uniform(0.85, 1.1) * (1 + 0.05 * smooth_noise(m, 3.0, rng))
		pan = (v / max(1, voices - 1) * 2 - 1) * spread if voices > 1 else 0.0
		out[:, off:] += pan_mono(sig, pan + rng.normal(0, 0.05))
	return out * (vel ** 1.2) / np.sqrt(voices) * 0.35


def strings(freq, dur, vel, rng, **kw):
	"""Sezione d'archi legata (pad o melodia)."""
	return ensemble(freq, dur, vel, rng, **kw)


def strings_flautando(freq, dur, vel, rng, **kw):
	"""Archi sul tasto / armonici: scuri, ariosi, vibrato lieve."""
	o = dict(voices=3, attack=0.9, release=1.5, vib=6.0, slope=1.5, dark_fc=700, bright_fc=2200, brightness=0.35,
			 detune=4.0)
	o.update(kw)
	return ensemble(freq, dur, vel, rng, **o)


def spiccato(freq, dur, vel, rng, **kw):
	"""Note corte d'arco (ostinato del boss)."""
	o = dict(voices=3, attack=0.012, release=0.12, vib=0.0, swell=0.0, brightness=0.75, dark_fc=700, bright_fc=3600,
			 onset_jit=0.008, accent=0.6, detune=5.0)
	o.update(kw)
	return ensemble(freq, dur, vel, rng, **o)


def brass(freq, dur, vel, rng, **kw):
	"""Ottoni gravi sintetici (corni/tromboni morbidi): si schiariscono col fiato."""
	o = dict(voices=3, attack=0.14, release=0.5, vib=4.0, vib_delay=0.6, slope=0.75, dark_fc=420, bright_fc=2300,
			 brightness=0.9, detune=5.0, scoop=-28.0, swell=0.2, max_hz=7000.0, spread=0.35)
	o.update(kw)
	return ensemble(freq, dur, vel, rng, **o)


def choir(freq, dur, vel, rng, **kw):
	"""Sorgente del coro ("ah" vengono dalle formanti applicate allo stem)."""
	o = dict(voices=5, attack=0.8, release=1.6, vib=14.0, vib_delay=0.5, slope=1.6, dark_fc=1800, bright_fc=4000,
			 brightness=0.5, detune=9.0, swell=0.3, spread=0.7)
	o.update(kw)
	return ensemble(freq, dur, vel, rng, **o)


# ------------------------------------------------------------------ pianoforte

def piano(freq, dur, vel, rng, bright: float = 0.45, pedal: float = 0.0, release: float = 0.25,
		  max_len: float = 9.0) -> np.ndarray:
	"""Pianoforte morbido (feltro). pedal: secondi extra di risonanza dopo il rilascio."""
	m = 69 + 12 * np.log2(freq / 440)
	B = float(np.clip(1.1e-4 * 2 ** ((m - 48) / 12), 4e-5, 3e-3))
	t60f = float(np.clip(16.0 * 2 ** (-(m - 33) / 12 * 0.62), 1.6, 18.0))
	held = dur + pedal
	total = min(max_len, held + release * 6, t60f)
	n = _n(total)
	t = np.arange(n) / SR
	kc = 2.0 + 7.0 * vel * bright
	out = np.zeros(n)
	K = int(min(40, 9000 // freq))
	strike = 1.0 / 7.6
	for k in range(1, K + 1):
		fk = k * freq * np.sqrt(1 + B * k * k)
		if fk > 0.44 * SR:
			break
		a = (1.0 / k ** 1.05) * np.exp(-(k - 1) / kc) * (0.25 + abs(np.sin(np.pi * k * strike)))
		if a < 2e-4:
			continue
		tk = t60f / (1 + (fk / 1400.0) ** 1.3 * 1.5)
		env = 0.62 * np.exp(-6.91 * t / (tk * 0.22)) + 0.38 * np.exp(-6.91 * t / tk)
		strings_n = 2 if m > 38 else 1
		for s in range(strings_n):
			det = 2 ** (rng.normal(0, 0.7) / 1200) if strings_n > 1 else 1.0
			out += a * env * np.sin(TWO_PI * fk * det * t + rng.uniform(0, TWO_PI)) / strings_n
	# martelletto: un soffio breve e scuro
	hn = _n(0.03)
	ham = filt(lp(900 + 1600 * vel), rng.standard_normal(hn)) * env_perc(hn, 0.001, 0.02)
	out[:hn] += ham * 0.05 * vel
	att = _n(0.0025 + 0.004 * (1 - vel))
	out[:att] *= ramp_cos(att)
	# smorzatore
	d0 = _n(held)
	if d0 < n:
		tail = np.exp(-(t[d0:] - t[d0]) / max(0.03, release / 3))
		out[d0:] *= tail
	return out * (0.15 + 0.85 * vel ** 1.4) * 0.35


# ------------------------------------------------------------------ percosse intonate

def _partials(freq, n, rng, parts, attack=0.0015):
	t = np.arange(n) / SR
	out = np.zeros(n)
	for ratio, amp, t60 in parts:
		f = freq * ratio
		if f > 0.44 * SR:
			continue
		det = 2 ** (rng.normal(0, 1.0) / 1200)
		out += amp * np.exp(-6.91 * t / t60) * np.sin(TWO_PI * f * det * t + rng.uniform(0, TWO_PI))
	a = _n(attack)
	out[:a] *= ramp_cos(a)
	return out


def celesta(freq, dur, vel, rng, ring: float = 2.6, damp: bool = True) -> np.ndarray:
	"""Celesta: barra metallica con risuonatore, fondamentale dolce."""
	n = _n(min(ring * 1.3, dur + 0.25 + 1.6) if damp else ring * 1.3)
	parts = [(1.0, 1.0, ring), (1.0006, 0.35, ring * 0.8), (2.0, 0.05, ring * 0.35), (2.756, 0.10 * vel, 0.35),
			 (5.404, 0.035 * vel, 0.12)]
	out = _partials(freq, n, rng, parts, attack=0.002)
	if damp:
		d0 = _n(dur + 0.25)
		if d0 < n:
			out[d0:] *= np.exp(-np.arange(n - d0) / (0.22 * SR))  # 1.6 s dopo: -63 dB
	return out * (0.25 + 0.75 * vel) * 0.3


def music_box(freq, dur, vel, rng, ring: float = 3.2) -> np.ndarray:
	"""Carillon: lamella con l'armonico 'tin' rapido (rapporto ~5.9)."""
	n = _n(ring * 1.2)
	parts = [(1.0, 1.0, ring), (1.002, 0.25, ring * 0.7), (2.0, 0.03, ring * 0.3), (5.93, 0.09 * vel, 0.18),
			 (3.0, 0.02, 0.4)]
	out = _partials(freq, n, rng, parts, attack=0.002)
	return out * (0.25 + 0.75 * vel) * 0.3


def bell(freq, dur, vel, rng, ring: float = 7.0) -> np.ndarray:
	"""Campana di chiesa (freq = nota 'prime'); hum, terza minore, quinta, nominale."""
	n = _n(ring * 1.1)
	parts = [(0.5, 0.55, ring), (1.0, 0.5, ring * 0.7), (1.183, 0.42, ring * 0.55), (1.506, 0.25, ring * 0.4),
			 (2.0, 0.5, ring * 0.35), (2.514, 0.18, ring * 0.25), (2.662, 0.15, ring * 0.2),
			 (3.011, 0.10, ring * 0.15), (4.166, 0.05, ring * 0.1)]
	out = _partials(freq, n, rng, parts, attack=0.002)
	k = _n(0.02)
	out[:k] += filt(bp(400, 2500), rng.standard_normal(k)) * env_perc(k, 0.0005, 0.015) * 0.2
	return out * vel * 0.25


def harp(freq, dur, vel, rng, p: float = 0.27, ring: float | None = None, damp: float = 0.0) -> np.ndarray:
	"""Arpa: pizzico additivo, armoniche alte che si spengono prima.
	damp > 0: dopo `dur` la corda viene smorzata con questa costante di tempo (secondi),
	come l'arpista che ferma le corde al cambio d'accordo."""
	m = 69 + 12 * np.log2(freq / 440)
	t60 = ring or float(np.clip(9.0 * 2 ** (-(m - 43) / 12 * 0.55), 1.4, 9.0))
	if damp > 0:
		t60 = min(t60, dur + 7 * damp)
	n = _n(t60)
	t = np.arange(n) / SR
	out = np.zeros(n)
	K = int(min(24, 8000 // freq))
	for k in range(1, K + 1):
		a = abs(np.sin(np.pi * k * p)) / k ** 1.6 * np.exp(-(k - 1) / (3 + 6 * vel))
		tk = t60 / (1 + 0.55 * (k - 1) ** 1.15)
		fk = k * freq * np.sqrt(1 + 2e-5 * k * k)
		out += a * np.exp(-6.91 * t / tk) * np.sin(TWO_PI * fk * t + rng.uniform(0, TWO_PI))
	a = _n(0.0015)
	out[:a] *= ramp_cos(a)
	k = _n(0.012)
	out[:k] += filt(lp(1200), rng.standard_normal(k)) * env_perc(k, 0.0005, 0.01) * 0.04
	if damp > 0:
		d0 = _n(dur)
		if d0 < n:
			out[d0:] *= np.exp(-np.arange(n - d0) / (damp * SR))
	return out * (0.2 + 0.8 * vel) * 0.4


# ------------------------------------------------------------------ corde pizzicate (Karplus-Strong)

def _ks_string(freq: float, excitation: np.ndarray, t60: float, bright: float) -> np.ndarray:
	"""Corda di Karplus-Strong con ritardo frazionario: Y = X(1+cz^-1) / (...)."""
	D = SR / freq
	s = float(np.clip(0.5 - 0.42 * bright, 0.05, 0.5))  # filtro di anello (1-s)+s z^-1, ritardo s
	Dloop = D - s
	Ni = int(np.floor(Dloop - 0.1))
	delta = Dloop - Ni
	c = (1 - delta) / (1 + delta)
	g = 10 ** (-3.0 / (t60 * freq))
	a = np.zeros(Ni + 3)
	a[0] = 1.0
	a[1] = c
	a[Ni] += -g * (1 - s) * c
	a[Ni + 1] += -g * ((1 - s) + s * c)
	a[Ni + 2] += -g * s
	b = np.array([1.0, c])
	return ss.lfilter(b, a, excitation)


def _pick(freq, n_total, at, amp, rng, pick_lp, pos=0.13):
	period = int(SR / freq)
	burst = rng.standard_normal(period) * np.hanning(period) ** 0.5
	burst = filt(lp(pick_lp), burst)
	d = max(1, int(pos * period))
	burst[d:] -= burst[:-d]
	ex = np.zeros(n_total)
	s = int(at * SR)
	k = min(period, n_total - s)
	if k > 0:
		ex[s:s + k] += burst[:k] * amp
	return ex


def pluck(freq, dur, vel, rng, t60: float = 1.2, bright: float = 0.6, pick_lp: float = 4500.0,
		  course: int = 1, detune_c: float = 2.5, tremolo: float = 0.0, damp: float = 0.08,
		  pos: float = 0.13) -> np.ndarray:
	"""Corda pizzicata generica. tremolo>0: plettrate al secondo (mandolino napoletano)."""
	n = _n(dur + max(damp * 7, 0.05) + 0.02)  # dopo lo smorzamento: circa -60 dB
	times = [0.0]
	amps = [1.0]
	if tremolo > 0:
		tt = 0.0
		i = 0
		while True:
			tt += 1.0 / (tremolo * rng.uniform(0.9, 1.1))
			if tt >= dur:
				break
			i += 1
			times.append(tt + rng.normal(0, 0.004))
			amps.append((0.55 if i % 2 else 0.75) * rng.uniform(0.8, 1.15))
	out = np.zeros(n)
	for c in range(course):
		f = freq * 2 ** ((rng.normal(0, 1) * detune_c if course > 1 else 0) / 1200)
		ex = np.zeros(n)
		for at, am in zip(times, amps):
			ex += _pick(f, n, max(0.0, at), am, rng, pick_lp * (0.8 + 0.4 * vel), pos)
		out += _ks_string(f, ex, t60, bright)
	d0 = _n(dur)
	if d0 < n:
		out[d0:] *= np.exp(-np.arange(n - d0) / max(1.0, damp * SR))
	a = _n(0.0008)
	out[:a] *= ramp_cos(a)
	return out * vel * 0.25 / course


def mandolin(freq, dur, vel, rng, tremolo: float = 13.0, **kw):
	"""Mandolino napoletano: corsi doppi, plettro, tremolo."""
	o = dict(t60=1.1, bright=0.72, pick_lp=5200, course=2, detune_c=3.0, tremolo=tremolo, damp=0.06, pos=0.11)
	o.update(kw)
	return pluck(freq, dur, vel, rng, **o)


def pizz(freq, dur, vel, rng, **kw):
	"""Pizzicato d'archi: corda più smorzata, tocco morbido di polpastrello."""
	m = 69 + 12 * np.log2(freq / 440)
	o = dict(t60=float(np.clip(1.5 * 2 ** (-(m - 40) / 12 * 0.5), 0.35, 1.6)), bright=0.25, pick_lp=1800,
			 course=1, damp=0.12, pos=0.22)
	o.update(kw)
	return pluck(freq, max(dur, 0.3), vel, rng, **o)


# ------------------------------------------------------------------ percussioni

def timpani(freq, dur, vel, rng, ring: float = 2.6) -> np.ndarray:
	"""Timpano: modi della membrana caricata, leggera caduta d'intonazione all'attacco."""
	n = _n(ring * 1.2)
	t = np.arange(n) / SR
	glide = 1 + 0.025 * vel * np.exp(-t / 0.05)
	out = np.zeros(n)
	for ratio, amp, t60 in [(1.0, 1.0, ring), (1.504, 0.55, ring * 0.6), (1.742, 0.3, ring * 0.45),
							(2.0, 0.28, ring * 0.4), (2.245, 0.14, ring * 0.3), (2.494, 0.1, ring * 0.25),
							(0.62, 0.35, 0.25)]:
		ph = TWO_PI * np.cumsum(freq * ratio * glide) / SR + rng.uniform(0, TWO_PI)
		out += amp * np.exp(-6.91 * t / t60) * np.sin(ph)
	k = _n(0.05)
	out[:k] += filt(lp(700 + 800 * vel), rng.standard_normal(k)) * env_perc(k, 0.0008, 0.035) * 0.5
	a = _n(0.002)
	out[:a] *= ramp_cos(a)
	return out * (0.15 + 0.85 * vel ** 1.3) * 0.3


def bass_drum(freq, dur, vel, rng, ring: float = 1.4) -> np.ndarray:
	"""Gran cassa profonda: sinusoide che scende, corpo di rumore scuro."""
	n = _n(ring)
	t = np.arange(n) / SR
	f = freq * (1 + 0.9 * np.exp(-t / 0.035))
	ph = TWO_PI * np.cumsum(f) / SR
	body = np.sin(ph) * np.exp(-6.91 * t / ring) + 0.35 * np.sin(ph * 1.58) * np.exp(-6.91 * t / (ring * 0.3))
	k = _n(0.12)
	noise = filt(lp(380), rng.standard_normal(k)) * env_perc(k, 0.001, 0.09) * 1.2
	body[:k] += noise
	a = _n(0.002)
	body[:a] *= ramp_cos(a)
	return body * (0.2 + 0.8 * vel ** 1.4) * 0.45


def frame_drum(freq, dur, vel, rng, jingle: float = 0.25, open_: bool = True) -> np.ndarray:
	"""Tammorra/tamburello: pelle grave + sonagli morbidi (filtrati, niente stridii)."""
	ring = 0.45 if open_ else 0.12
	n = _n(0.6)
	t = np.arange(n) / SR
	out = np.zeros(n)
	for ratio, amp, t60 in [(1.0, 1.0, ring), (1.59, 0.5, ring * 0.6), (2.14, 0.3, ring * 0.4), (2.65, 0.2, ring * 0.3)]:
		out += amp * np.exp(-6.91 * t / t60) * np.sin(TWO_PI * freq * ratio * t + rng.uniform(0, TWO_PI))
	k = _n(0.03)
	out[:k] += filt(bp(150, 1500), rng.standard_normal(k)) * env_perc(k, 0.0005, 0.02) * 0.6
	if jingle > 0:
		js = np.zeros(n)
		for _ in range(6):
			off = int(rng.uniform(0, 0.012) * SR)
			m = n - off
			tt = np.arange(m) / SR
			for f0 in (3100, 4300, 5200):
				js[off:] += np.sin(TWO_PI * f0 * rng.uniform(0.97, 1.03) * tt) * np.exp(-6.91 * tt / 0.09)
		js = filt(lp(5500, 2), js) / 18.0
		out += js * jingle
	a = _n(0.001)
	out[:a] *= ramp_cos(a)
	return out * (0.2 + 0.8 * vel ** 1.3) * 0.35


def sine_pad(freq, dur, vel, rng, attack: float = 1.5, release: float = 2.0) -> np.ndarray:
	"""Bordone sub morbido (sinusoide + una punta di seconda armonica)."""
	n = _n(dur + release)
	t = np.arange(n) / SR
	f = freq * 2 ** (1.5 * smooth_noise(n, 0.3, rng) / 1200)
	ph = TWO_PI * np.cumsum(f) / SR
	x = np.sin(ph) + 0.12 * np.sin(2 * ph)
	return x * env_asr(n, attack, dur, release) * vel * 0.3
