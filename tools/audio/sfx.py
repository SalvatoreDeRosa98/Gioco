"""Effetti sonori brevi (WAV 16 bit, 44.1 kHz) sintetizzati da zero.

Lancio:  python3 tools/audio/sfx.py [nome ...]   (default: tutti)
Uscita:  src/assets/audio/sfx/<nome>.wav

Ogni effetto è una funzione che restituisce il segnale (mono o stereo). render()
taglia la coda sotto soglia, passa per master_oneshot (passa-alto, niente DC,
sfumature) e porta il file alla loudness indicata nella tabella SFX (misurata come
la sente il gioco, true peak sotto -1 dBTP): i volumi di base sono già bilanciati
tra loro e in data/audio.json si ritocca solo di qualche dB.
Le varianti (passo_1..3, fendente_1..3, dialogo_1..2) usano seed diversi.
vespa_ronzio è un loop esatto di 1 s (frequenze e modulazioni con un numero
intero di cicli nel secondo), da importare con loop attivo.
"""
from __future__ import annotations

import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import instruments as I  # noqa: E402
from dsp import (SR, TWO_PI, bp, db, env_perc, filt, hz, limiter, lp, lufs, make_ir, master_oneshot,  # noqa: E402
				 pan_mono, ramp_cos, reverb_lin, rng_for, trim_tail, true_peak_db, write_wav)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "src", "assets", "audio", "sfx")

_IR: dict = {}


def ir(kind: str) -> np.ndarray:
	if kind not in _IR:
		_IR[kind] = {
			"room": lambda: make_ir(0.9, 0.6, 0.25, predelay=0.006, seed=41),
			"hall": lambda: make_ir(2.8, 2.2, 0.8, predelay=0.02, seed=42),
			"magic": lambda: make_ir(3.5, 3.0, 1.4, predelay=0.03, seed=43, tone_hz=6000),
		}[kind]()
	return _IR[kind]


def T(sec: float) -> np.ndarray:
	return np.arange(int(sec * SR)) / SR


def noise(rng, sec: float) -> np.ndarray:
	return rng.standard_normal(int(sec * SR))


def sweep_noise(rng, sec: float, f_from: float, f_to: float, q: float = 2.0, steps: int = 24) -> np.ndarray:
	"""Rumore con un passa-banda che scorre: blocchi filtrati a frequenze crescenti,
	sovrapposti con finestre di Hann (nessun click tra un blocco e l'altro)."""
	n = int(sec * SR)
	x = rng.standard_normal(n)
	hop = max(1, n // steps)
	win = np.hanning(2 * hop + 1)[:-1]
	out = np.zeros(n)
	norm = np.zeros(n)
	for i in range(steps + 2):
		c = f_from * (f_to / f_from) ** min(1.0, i / steps)
		bw = c / q
		y = filt(bp(max(30, c - bw / 2), min(0.45 * SR, c + bw / 2), 2), x)
		lo_, hi_ = i * hop - hop, i * hop + hop
		a, b = max(0, lo_), min(n, hi_)
		if b <= a:
			continue
		out[a:b] += y[a:b] * win[a - lo_:b - lo_]
		norm[a:b] += win[a - lo_:b - lo_]
	out /= np.maximum(norm, 1e-3)
	return out / (np.abs(out).max() + 1e-9)


def thump(f0: float, sec: float, drop: float = 0.5, tau: float = 0.05) -> np.ndarray:
	t = T(max(sec, 7 * tau))  # lunga abbastanza da spegnersi (-60 dB)
	f = f0 * (1 - drop * (1 - np.exp(-t / 0.04)))
	y = np.sin(TWO_PI * np.cumsum(f) / SR) * np.exp(-t / tau)
	y[:24] *= ramp_cos(24)
	return y


def partials(f0: float, sec: float, parts, rng) -> np.ndarray:
	t = T(max(sec, 7 * max(p[2] for p in parts)))
	y = np.zeros_like(t)
	for r, a, tau in parts:
		y += a * np.sin(TWO_PI * f0 * r * t + rng.uniform(0, 6)) * np.exp(-t / tau)
	y[:16] *= ramp_cos(16)
	return y


def mix(*items) -> np.ndarray:
	"""items: (segnale, offset_s, guadagno) -> somma (mono o stereo)."""
	stereo = any(x.ndim == 2 for x, _, _ in items)
	n = max(int(o * SR) + x.shape[-1] for x, o, _ in items)
	out = np.zeros((2, n)) if stereo else np.zeros(n)
	for x, o, g in items:
		s = int(o * SR)
		if stereo and x.ndim == 1:
			x = pan_mono(x, 0.0)
		x = x.copy()
		f = min(x.shape[-1], int(0.004 * SR))
		x[..., -f:] *= ramp_cos(f)[::-1]
		out[..., s:s + x.shape[-1]] += x * g
	return out


def wet(x: np.ndarray, kind: str, amount: float) -> np.ndarray:
	y = reverb_lin(x, ir(kind))
	d = pan_mono(x, 0.0) if x.ndim == 1 else x
	out = y * amount
	out[:, :d.shape[-1]] += d
	return out


def env_ar(n: int, a: float, r: float) -> np.ndarray:
	"""Sale per una frazione a del tempo, poi scende (forme a goccia)."""
	t = np.linspace(0, 1, n)
	return np.where(t < a, np.sin(np.pi / 2 * t / max(a, 1e-6)) ** 2, ((1 - t) / (1 - a + 1e-9)) ** r)


# ------------------------------------------------------------------ Ferruccio

def passo(seed: int):
	rng = rng_for("passo", seed)
	heel = thump(rng.uniform(85, 115), 0.12, 0.35, 0.03)
	scuff = filt(bp(rng.uniform(250, 400), rng.uniform(1800, 2800)), noise(rng, 0.12)) * env_perc(int(0.12 * SR), 0.002,
																									  0.06)
	grit = np.zeros(int(0.12 * SR))
	for _ in range(rng.integers(3, 7)):
		k = int(rng.uniform(0.0, 0.05) * SR)
		g = filt(bp(1500, 5000), noise(rng, 0.004)) * env_perc(int(0.004 * SR), 0.0002, 0.003)
		grit[k:k + len(g)] += g * rng.uniform(0.2, 0.5)
	x = mix((heel, 0, 0.9), (scuff, 0.004, 0.35), (grit, 0.006, 0.4))
	return filt(lp(5000), x)


def salto():
	rng = rng_for("salto")
	w = sweep_noise(rng, 0.26, 420, 1500, q=1.5) * env_ar(int(0.26 * SR), 0.35, 1.6)
	push = thump(90, 0.08, 0.3, 0.025)
	cloth = filt(bp(200, 900), noise(rng, 0.2)) * (0.5 + 0.5 * np.sin(TWO_PI * 22 * T(0.2))) * env_ar(int(0.2 * SR),
																									  0.2, 2)
	return filt(lp(5500), mix((push, 0, 0.6), (w, 0.01, 0.55), (cloth, 0.02, 0.25)))


def doppio_salto():
	rng = rng_for("doppio_salto")
	n = int(0.42 * SR)
	w = sweep_noise(rng, 0.42, 700, 2600, q=1.8) * env_ar(n, 0.3, 1.8)
	flutter = filt(bp(300, 1400), noise(rng, 0.3)) * (0.5 + 0.5 * np.sin(TWO_PI * 28 * T(0.3))) * env_ar(
		int(0.3 * SR), 0.15, 2)
	t = T(0.5)
	sh = np.zeros_like(t)
	for k, note in enumerate(("D5", "A5", "D6")):
		f = hz(note) * (1 + 0.02 * t / 0.5)
		sh += np.sin(TWO_PI * np.cumsum(f) / SR) * np.exp(-t / 0.18) * np.clip((t - 0.03 * k) / 0.01, 0, 1) * (
			0.8 - 0.2 * k)
	x = mix((w, 0, 0.5), (flutter, 0, 0.3), (sh * 0.25, 0.02, 1.0))
	return wet(filt(lp(7000), x), "magic", 0.2)


def atterraggio():
	rng = rng_for("atterraggio")
	body = thump(72, 0.25, 0.4, 0.07)
	low = filt(lp(600), noise(rng, 0.1)) * env_perc(int(0.1 * SR), 0.001, 0.05)
	scuff = filt(bp(700, 3200), noise(rng, 0.14)) * env_perc(int(0.14 * SR), 0.003, 0.08)
	return filt(lp(5000), mix((body, 0, 1.0), (low, 0, 0.5), (scuff, 0.005, 0.25)))


def scatto():
	rng = rng_for("scatto")
	n = int(0.3 * SR)
	w = sweep_noise(rng, 0.3, 2400, 450, q=1.4) * env_ar(n, 0.12, 1.4)
	whoomp = thump(110, 0.2, 0.5, 0.06)
	cloth = filt(bp(250, 1200), noise(rng, 0.22)) * (0.5 + 0.5 * np.sin(TWO_PI * 35 * T(0.22))) * env_ar(
		int(0.22 * SR), 0.1, 2)
	x = mix((w, 0, 0.7), (whoomp, 0, 0.35), (cloth, 0.01, 0.25))
	return wet(filt(lp(6500), x), "room", 0.15)


def fendente(seed: int):
	rng = rng_for("fendente", seed)
	d = rng.uniform(0.13, 0.18)
	n = int(d * SR)
	sw = sweep_noise(rng, d, rng.uniform(1900, 2500), rng.uniform(450, 650), q=2.5) * env_ar(n, 0.3, 1.2)
	ring = partials(rng.uniform(1900, 2300), 0.25, [(1.0, 1.0, 0.08), (1.58, 0.5, 0.05), (2.41, 0.3, 0.03)], rng)
	air = filt(lp(1200), noise(rng, d)) * env_ar(n, 0.4, 2)
	x = mix((sw, 0, 0.8), (air, 0, 0.25), (ring, d * 0.35, 0.07))
	return filt(lp(7000), x)


def colpo():
	rng = rng_for("colpo")
	body = thump(120, 0.22, 0.5, 0.05)
	crack = filt(bp(900, 4000), noise(rng, 0.03)) * env_perc(int(0.03 * SR), 0.0005, 0.015)
	slap = filt(bp(300, 1500), noise(rng, 0.08)) * env_perc(int(0.08 * SR), 0.001, 0.04)
	snap = partials(1450, 0.15, [(1.0, 1.0, 0.03), (2.7, 0.4, 0.015)], rng)
	x = mix((body, 0, 1.0), (crack, 0, 0.45), (slap, 0, 0.5), (snap, 0.002, 0.12))
	return wet(filt(lp(7000), x), "room", 0.12)


def nemico_ucciso():
	rng = rng_for("nemico_ucciso")
	hit = colpo()
	hit = hit.mean(axis=0) * np.sqrt(2) if hit.ndim == 2 else hit
	t = T(1.6)
	soul = np.zeros_like(t)
	for k, note in enumerate(("D5", "F5", "A5", "D6", "E6")):
		f = hz(note) * 2 ** (t / 1.6 * 0.9)
		e = np.clip((t - 0.06 * k) / 0.15, 0, 1) * np.exp(-t / 0.55)
		trem = 0.7 + 0.3 * np.sin(TWO_PI * (7 + k) * t)
		soul += np.sin(TWO_PI * np.cumsum(f) / SR) * e * trem * (1 - 0.12 * k)
	breath = sweep_noise(rng, 1.2, 500, 3800, q=2.5) * env_ar(int(1.2 * SR), 0.2, 2.5)
	x = mix((hit, 0, 0.8), (soul, 0.04, 0.16), (breath, 0.05, 0.12))
	return wet(filt(lp(7500), x), "magic", 0.5)


def ferito():
	rng = rng_for("ferito")
	body = thump(85, 0.3, 0.45, 0.09)
	thud = filt(lp(900), noise(rng, 0.12)) * env_perc(int(0.12 * SR), 0.001, 0.06)
	t = T(0.4)
	tone = np.zeros_like(t)
	for f0 in (392.0, 415.3):
		f = f0 * (1 - 0.3 * t / 0.4)
		tone += np.sin(TWO_PI * np.cumsum(f) / SR) * np.exp(-t / 0.12)
	x = mix((body, 0, 1.0), (thud, 0, 0.6), (tone, 0.01, 0.18))
	return wet(filt(lp(3500), x), "room", 0.2)


def moneta():
	rng = rng_for("moneta")
	f0 = 1480.0
	parts = [(1.0, 1.0, 0.2), (2.32, 0.45, 0.11), (4.25, 0.18, 0.05), (6.63, 0.06, 0.025)]
	a = partials(f0, 0.6, parts, rng)
	b = partials(f0 * 1.003, 0.5, parts, rng)
	click = filt(bp(2000, 6000), noise(rng, 0.005)) * env_perc(int(0.005 * SR), 0.0002, 0.003)
	x = mix((a, 0, 0.8), (click, 0, 0.3), (b, 0.07, 0.5), (click, 0.07, 0.2))
	return wet(filt(lp(8000), x), "room", 0.15)


def mozzarella():
	rng = rng_for("mozzarella")
	items = []
	for k, note in enumerate(("D5", "F#5", "A5", "D6")):
		items.append((I.harp(hz(note), 0.6, 0.6, rng, ring=1.6), 0.07 * k, 0.9))
		items.append((I.celesta(hz(note) * 2, 0.4, 0.4, rng, ring=1.2), 0.07 * k + 0.01, 0.35))
	t = T(1.2)
	pad = sum(np.sin(TWO_PI * hz(n) * t) for n in ("D4", "A4", "F#5")) * np.sin(np.pi * t / 1.2) ** 2
	items.append((pad, 0, 0.06))
	x = mix(*items)
	return wet(filt(lp(8000), x), "magic", 0.45)


def portale():
	rng = rng_for("portale")
	d = 2.4
	t = T(d)
	n = len(t)
	swell = np.clip(t / 1.1, 0, 1) ** 2 * np.exp(-np.maximum(0, t - 1.1) / 0.5)
	low = (np.sin(TWO_PI * 55 * t) + 0.5 * np.sin(TWO_PI * 110 * (1 + 0.05 * t) * t)) * swell
	whoosh = sweep_noise(rng, d, 200, 2500, q=1.6) * swell
	bloom = np.zeros(n)
	for k, note in enumerate(("D4", "A4", "E5", "F5", "A5", "D6")):
		y = I.celesta(hz(note), 1.2, 0.6, rng, ring=2.0, damp=False)
		s = int((1.05 + 0.05 * k) * SR)
		m = min(len(y), n - s)
		bloom[s:s + m] += y[:m] * (1 - 0.08 * k)
	x = mix((low, 0, 0.35), (whoosh, 0, 0.25), (bloom, 0, 1.2))
	return wet(filt(lp(7500), x), "magic", 0.6)


# ------------------------------------------------------------------ nemici

def gatto_soffio():
	rng = rng_for("gatto_soffio")
	d = 0.75
	n = int(d * SR)
	h = filt(bp(1400, 4200, 2), noise(rng, d))
	h = h * env_ar(n, 0.06, 0.8) * (0.85 + 0.15 * np.sin(TWO_PI * 19 * T(d)))
	spit = filt(bp(800, 3500), noise(rng, 0.03)) * env_perc(int(0.03 * SR), 0.0005, 0.015)
	growl = np.sin(TWO_PI * 95 * T(d)) * (0.5 + 0.5 * np.sin(TWO_PI * 23 * T(d))) * env_ar(n, 0.1, 1.5)
	return filt(lp(4800), mix((h, 0, 0.6), (spit, 0, 0.4), (growl, 0, 0.1)))


def gatto_miao():
	"""Miagolio: sorgente glottale additiva, formanti che passano da 'i' ad 'a' ad 'u'."""
	rng = rng_for("gatto_miao")
	d = 0.8
	t = T(d)
	x = t / d
	f0 = 520 + 260 * np.sin(np.pi * np.clip(x * 1.15, 0, 1)) - 120 * x
	f0 *= 1 + 0.01 * np.sin(TWO_PI * 6 * t)
	F1 = np.interp(x, [0, 0.35, 1], [350, 850, 380])
	F2 = np.interp(x, [0, 0.35, 1], [2300, 1350, 800])
	F3 = 2900.0
	ph = TWO_PI * np.cumsum(f0) / SR
	y = np.zeros_like(t)
	for k in range(1, 16):
		fk = k * f0
		amp = (1 / k ** 1.2) * (1 / (1 + ((fk - F1) / 160) ** 2) + 0.7 / (1 + ((fk - F2) / 220) ** 2) +
								0.25 / (1 + ((fk - F3) / 300) ** 2))
		y += amp * np.sin(k * ph)
	e = env_ar(len(t), 0.12, 1.3)
	y = y * e
	breath = filt(bp(1500, 5000), noise(rng, d)) * e * 0.03
	return filt(lp(6000), y + breath)


def vespa_ronzio():
	"""Ronzio d'ala, loop esatto di 1 s: tutte le frequenze hanno cicli interi nel secondo."""
	d = 1.0
	t = T(d)
	f0 = 184.0
	# vibrato di 3 Hz di ampiezza a 3 cicli/s, integrato in forma chiusa: la fase torna identica dopo 1 s
	ph = TWO_PI * f0 * t + (3.0 / 3.0) * (1 - np.cos(TWO_PI * 3 * t))
	y = np.zeros_like(t)
	for k in range(1, 30):
		if k * f0 > 9000:
			break
		y += np.sin(k * ph + 0.3 * k) / k ** 0.9
	am = 0.8 + 0.2 * np.sin(TWO_PI * 7 * t) + 0.08 * np.sin(TWO_PI * 23 * t)
	y = y * am
	# filtro circolare (FFT) per non rompere il loop
	from dsp import eq_curve_fft
	y = eq_curve_fft(y, lambda f: 1 / np.sqrt(1 + (220 / np.maximum(f, 1)) ** 4) / np.sqrt(1 + (f / 2800) ** 4)
					 * (1 + 1.5 / (1 + ((f - 1100) / 300) ** 2)))
	y = y / np.abs(y).max() * db(-16)
	return y


def statua_carica():
	rng = rng_for("statua_carica")
	d = 1.0
	t = T(d)
	grind = filt(lp(700), noise(rng, d)) * (0.6 + 0.4 * np.abs(np.sin(TWO_PI * 13 * t)))
	ticks = np.zeros_like(t)
	for _ in range(60):
		k = int(rng.uniform(0, d - 0.01) * SR)
		g = filt(bp(600, 2500), noise(rng, 0.006)) * env_perc(int(0.006 * SR), 0.0003, 0.004)
		ticks[k:k + len(g)] += g * rng.uniform(0.2, 0.7)
	f = 90 * 2 ** (2.2 * (t / d) ** 1.5)
	ph = TWO_PI * np.cumsum(f) / SR
	tone = (np.sin(ph) + 0.4 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)) * (t / d) ** 2
	x = (grind * 0.35 + ticks * 0.3) * env_ar(len(t), 0.3, 0.5) + tone * 0.35
	x[-int(0.02 * SR):] *= ramp_cos(int(0.02 * SR))[::-1]
	return filt(lp(5000), x)


def statua_sparo():
	rng = rng_for("statua_sparo")
	boom = thump(95, 0.4, 0.55, 0.09)
	wh = sweep_noise(rng, 0.45, 2000, 300, q=1.5) * env_ar(int(0.45 * SR), 0.05, 1.5)
	t = T(0.25)
	pew = np.sin(TWO_PI * np.cumsum(900 * 2 ** (-1.6 * t / 0.25)) / SR) * np.exp(-t / 0.08)
	x = mix((boom, 0, 1.0), (wh, 0, 0.45), (pew, 0, 0.15))
	return wet(filt(lp(6000), x), "room", 0.2)


def custode_passo():
	rng = rng_for("custode_passo")
	boom = thump(55, 0.5, 0.35, 0.14)
	dust = filt(lp(1200), noise(rng, 0.25)) * env_perc(int(0.25 * SR), 0.002, 0.12)
	clank = partials(220, 0.6, [(1.0, 1.0, 0.18), (2.76, 0.6, 0.1), (5.4, 0.25, 0.05), (1.47, 0.5, 0.14)], rng)
	x = mix((boom, 0, 1.0), (dust, 0, 0.4), (clank, 0.015, 0.18))
	return wet(filt(lp(5000), x), "hall", 0.25)


def custode_urto():
	rng = rng_for("custode_urto")
	lead = sweep_noise(rng, 0.4, 300, 1400, q=1.4) * env_ar(int(0.4 * SR), 0.85, 0.5)
	boom = thump(46, 1.0, 0.4, 0.3)
	crash = filt(lp(2200), noise(rng, 0.5)) * env_perc(int(0.5 * SR), 0.001, 0.22)
	debris = np.zeros(int(0.9 * SR))
	for _ in range(40):
		k = int(rng.uniform(0.02, 0.8) * SR)
		g = filt(bp(500, 3000), noise(rng, 0.01)) * env_perc(int(0.01 * SR), 0.0005, 0.006)
		debris[k:k + len(g)] += g * rng.uniform(0.1, 0.5) * (1 - k / len(debris))
	ring = partials(140, 1.2, [(1.0, 1.0, 0.5), (2.76, 0.5, 0.25), (5.4, 0.2, 0.1)], rng)
	x = mix((lead, 0, 0.3), (boom, 0.38, 1.0), (crash, 0.38, 0.5), (debris, 0.4, 0.5), (ring, 0.39, 0.12))
	return wet(filt(lp(6000), x), "hall", 0.3)


def custode_raffica():
	rng = rng_for("custode_raffica")
	items = []
	for k in range(4):
		t = T(0.25)
		f = (720 - 40 * k) * 2 ** (-1.4 * t / 0.25)
		chirp = np.sin(TWO_PI * np.cumsum(f) / SR) * np.exp(-t / 0.07)
		fw = sweep_noise(rng, 0.2, 1800, 400, q=2.0) * env_ar(int(0.2 * SR), 0.05, 1.6)
		pulse = thump(110, 0.12, 0.5, 0.03)
		items += [(chirp, 0.09 * k, 0.2), (fw, 0.09 * k, 0.45), (pulse, 0.09 * k, 0.5)]
	return wet(filt(lp(6500), mix(*items)), "hall", 0.2)


# ------------------------------------------------------------------ interfaccia

def menu_click():
	rng = rng_for("menu_click")
	x = partials(1250, 0.08, [(1.0, 1.0, 0.018), (2.1, 0.4, 0.008)], rng)
	x[:int(0.003 * SR)] += filt(bp(1500, 5000), noise(rng, 0.003)) * 0.2
	return filt(lp(7000), x)


def dialogo(seed: int):
	rng = rng_for("dialogo", seed)
	f0 = (520.0, 587.0)[seed % 2]
	t = T(0.07)
	y = (np.sin(TWO_PI * f0 * t) + 0.25 * np.sin(TWO_PI * 2 * f0 * t) + 0.08 * np.sin(TWO_PI * 3.01 * f0 * t))
	y *= np.exp(-t / 0.022)
	y[:int(0.003 * SR)] *= ramp_cos(int(0.003 * SR))
	return filt(lp(4000), y)


def scelta():
	rng = rng_for("scelta")
	a = I.celesta(hz("A5"), 0.3, 0.6, rng, ring=1.4)
	b = I.celesta(hz("D6"), 0.6, 0.65, rng, ring=1.8)
	h = I.harp(hz("D5"), 0.6, 0.4, rng, ring=1.5)
	return wet(mix((a, 0, 1.0), (b, 0.11, 1.0), (h, 0.11, 0.5)), "magic", 0.35)


# nome -> (funzione, loudness LUFS come la sente il gioco, soglia di taglio della coda in dB)
SFX = {
	"passo_1": (lambda: passo(1), -31, -50), "passo_2": (lambda: passo(2), -31, -50),
	"passo_3": (lambda: passo(3), -31, -50),
	"salto": (salto, -27, -50), "doppio_salto": (doppio_salto, -25, -50), "atterraggio": (atterraggio, -26, -50),
	"scatto": (scatto, -24, -50),
	"fendente_1": (lambda: fendente(1), -23, -50), "fendente_2": (lambda: fendente(2), -23, -50),
	"fendente_3": (lambda: fendente(3), -23, -50),
	"colpo": (colpo, -18, -55), "nemico_ucciso": (nemico_ucciso, -21, -55), "ferito": (ferito, -18, -55),
	"moneta": (moneta, -24, -55), "mozzarella": (mozzarella, -22, -55), "portale": (portale, -21, -55),
	"gatto_soffio": (gatto_soffio, -27, -50), "gatto_miao": (gatto_miao, -25, -50),
	"vespa_ronzio": (vespa_ronzio, -29, None),
	"statua_carica": (statua_carica, -24, -50), "statua_sparo": (statua_sparo, -21, -55),
	"custode_passo": (custode_passo, -21, -55), "custode_urto": (custode_urto, -17, -55),
	"custode_raffica": (custode_raffica, -21, -55),
	"menu_click": (menu_click, -30, -50), "dialogo_1": (lambda: dialogo(1), -32, -50),
	"dialogo_2": (lambda: dialogo(2), -32, -50), "scelta": (scelta, -24, -55),
}


def game_lufs(x: np.ndarray) -> float:
	"""Loudness come la sente il gioco: un file mono esce uguale su entrambi i canali."""
	return lufs(np.vstack([x, x]) if x.ndim == 1 else x)


def render(name: str, out_dir: str = OUT) -> str:
	fn, target, trim_db = SFX[name]
	x = fn()
	if trim_db is None:  # loop: nessun taglio né sfumatura, solo il livello
		x = x * db(target - game_lufs(x))
	else:
		x = trim_tail(x, trim_db)
		x = master_oneshot(x, -1.0)
		x = x * db(target - game_lufs(x))
		if true_peak_db(x) > -1.0:
			x = limiter(x, -1.5, wrap=False)
	path = os.path.join(out_dir, f"{name}.wav")
	write_wav(path, x, rng_for("dither_" + name))
	return path


def main(names: list[str]) -> None:
	for n in names or list(SFX):
		p = render(n)
		print(f"  {n:16s} -> {os.path.relpath(p, ROOT)} ({os.path.getsize(p) / 1024:.0f} KB)")


if __name__ == "__main__":
	main(sys.argv[1:])
