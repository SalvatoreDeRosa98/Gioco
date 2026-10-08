"""Nucleo DSP per l'audio procedurale di Ferruccio.

Cosa contiene: conversione note/frequenze, inviluppi, oscillatori a tabella
band-limited, filtri (causali e "periodici"), panning, riverbero a convoluzione
con risposta all'impulso generata da noi, mastering (compressione, limiter,
loudness) e scrittura WAV/OGG.

Idea chiave per i loop senza scatti: ogni brano/ambiente è un buffer CIRCOLARE
di lunghezza L. Le note che sforano la fine vengono avvolte all'inizio, il
riverbero è una convoluzione circolare e i processori con memoria (filtri IIR,
compressore, limiter) girano con un preriscaldamento preso dalla coda del loop.
Il risultato è periodico per costruzione: l'ultimo campione si collega al primo.

Non si lancia da solo: lo usano music.py, ambience.py, sfx.py (vedi build_all.py).
"""
from __future__ import annotations

import os
import re
import subprocess
import tempfile
import zlib

import numpy as np
import scipy.fft as sfft
import scipy.signal as ss

SR = 44100
TWO_PI = 2.0 * np.pi

# ----------------------------------------------------------------- note

_NOTE_RE = re.compile(r"^([A-Ga-g])([#b]?)(-?\d)$")
_PC = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def midi(n) -> float:
	"""Nota ("D4", "Bb3", "C#5") o numero MIDI -> numero MIDI."""
	if isinstance(n, (int, float, np.integer, np.floating)):
		return float(n)
	m = _NOTE_RE.match(n.strip())
	if not m:
		raise ValueError(f"nota non valida: {n}")
	pc = _PC[m.group(1).upper()] + {"#": 1, "b": -1, "": 0}[m.group(2)]
	return float(12 * (int(m.group(3)) + 1) + pc)


def hz(n) -> float:
	return 440.0 * 2.0 ** ((midi(n) - 69.0) / 12.0)


def transpose(n, semis: float) -> float:
	return midi(n) + semis


def rng_for(name: str, salt: int = 0) -> np.random.Generator:
	"""Generatore deterministico: stesso nome -> stessi numeri a ogni build."""
	return np.random.default_rng(zlib.crc32(name.encode("utf-8")) + 7919 * salt)


def smooth_len(n: float) -> int:
	"""Intero vicino a n con fattori primi piccoli (FFT veloci sul loop)."""
	return int(sfft.next_fast_len(int(round(n)), real=True))


def db(x: float) -> float:
	return 10.0 ** (x / 20.0)


# ----------------------------------------------------------------- inviluppi

def ramp_cos(n: int) -> np.ndarray:
	"""Rampa 0->1 a coseno rialzato (niente spigoli = niente click)."""
	if n <= 0:
		return np.zeros(0)
	return 0.5 - 0.5 * np.cos(np.linspace(0.0, np.pi, n))


def env_asr(n: int, attack: float, hold: float, release: float) -> np.ndarray:
	"""Attacco a coseno, sostegno fino a `hold` secondi, rilascio a coseno."""
	e = np.ones(n)
	a = min(n, max(1, int(attack * SR)))
	e[:a] = ramp_cos(a)
	h = int(hold * SR)
	r = max(1, int(release * SR))
	if h < n:
		seg = e[h:h + r].copy()
		e[h:h + r] = seg * ramp_cos(len(seg))[::-1]
		e[h + r:] = 0.0
	return e


def env_perc(n: int, attack: float, t60: float) -> np.ndarray:
	"""Attacco breve e decadimento esponenziale (T60 in secondi)."""
	t = np.arange(n) / SR
	e = np.exp(-6.91 * t / max(1e-3, t60))
	a = min(n, max(1, int(attack * SR)))
	e[:a] *= ramp_cos(a)
	return e


def smooth_noise(n: int, rate_hz: float, rng: np.random.Generator) -> np.ndarray:
	"""Rumore lento (deriva) in [-1, 1] interpolando punti casuali."""
	k = max(2, int(n / SR * rate_hz) + 2)
	pts = rng.uniform(-1.0, 1.0, k)
	x = np.linspace(0, k - 1, n)
	i = np.floor(x).astype(int)
	i = np.minimum(i, k - 2)
	f = x - i
	f = f * f * (3 - 2 * f)
	return pts[i] * (1 - f) + pts[i + 1] * f


# ----------------------------------------------------------------- oscillatori

def table_from_harmonics(amps: np.ndarray, phases: np.ndarray, size: int = 4096) -> np.ndarray:
	"""Un ciclo di forma d'onda con le armoniche date (band-limited per costruzione)."""
	spec = np.zeros(size // 2 + 1, dtype=complex)
	h = min(len(amps), size // 2 - 1)
	spec[1:h + 1] = amps[:h] * np.exp(1j * phases[:h])
	t = np.fft.irfft(spec, size) * size / 2.0
	return t


def osc_table(table: np.ndarray, phase_cycles: np.ndarray) -> np.ndarray:
	"""Legge la tabella con fase in cicli (interpolazione lineare)."""
	n = len(table)
	p = np.mod(phase_cycles, 1.0) * n
	i = p.astype(np.int64)
	f = p - i
	t2 = np.append(table, table[0])
	return t2[i] + f * (t2[i + 1] - t2[i])


def phase_from_freq(freq: np.ndarray | float, n: int, phase0: float = 0.0) -> np.ndarray:
	if np.isscalar(freq):
		return phase0 + np.arange(n) * (float(freq) / SR)
	return phase0 + np.cumsum(freq) / SR


# ----------------------------------------------------------------- filtri

def _sos(b, a):
	return ss.tf2sos(b, a)


def biquad_peak(f0: float, gain_db: float, q: float = 1.0) -> np.ndarray:
	A = 10 ** (gain_db / 40)
	w = TWO_PI * f0 / SR
	al = np.sin(w) / (2 * q)
	b = [1 + al * A, -2 * np.cos(w), 1 - al * A]
	a = [1 + al / A, -2 * np.cos(w), 1 - al / A]
	return _sos(b, a)


def biquad_shelf(f0: float, gain_db: float, high: bool, s: float = 0.8) -> np.ndarray:
	A = 10 ** (gain_db / 40)
	w = TWO_PI * f0 / SR
	al = np.sin(w) / 2 * np.sqrt((A + 1 / A) * (1 / s - 1) + 2)
	c = np.cos(w)
	sq = 2 * np.sqrt(A) * al
	if high:
		b = [A * ((A + 1) + (A - 1) * c + sq), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - sq)]
		a = [(A + 1) - (A - 1) * c + sq, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - sq]
	else:
		b = [A * ((A + 1) - (A - 1) * c + sq), 2 * A * ((A - 1) - (A + 1) * c), A * ((A + 1) - (A - 1) * c - sq)]
		a = [(A + 1) + (A - 1) * c + sq, -2 * ((A - 1) + (A + 1) * c), (A + 1) + (A - 1) * c - sq]
	return _sos(b, a)


def lp(fc: float, order: int = 2) -> np.ndarray:
	return ss.butter(order, min(fc, 0.45 * SR), "low", fs=SR, output="sos")


def hp(fc: float, order: int = 2) -> np.ndarray:
	return ss.butter(order, fc, "high", fs=SR, output="sos")


def bp(f_lo: float, f_hi: float, order: int = 2) -> np.ndarray:
	return ss.butter(order, [f_lo, min(f_hi, 0.45 * SR)], "band", fs=SR, output="sos")


def chain(*soss) -> np.ndarray:
	return np.vstack(soss)


def filt(sos: np.ndarray, x: np.ndarray) -> np.ndarray:
	"""Filtro causale (one-shot)."""
	return ss.sosfilt(sos, x, axis=-1)


def filt_periodic(sos: np.ndarray, x: np.ndarray, warm_s: float = 1.5) -> np.ndarray:
	"""Filtro causale su segnale periodico: lo stato iniziale viene dalla coda del loop."""
	w = min(x.shape[-1], int(warm_s * SR))
	xx = np.concatenate([x[..., -w:], x], axis=-1)
	return ss.sosfilt(sos, xx, axis=-1)[..., w:]


def eq_curve_fft(x: np.ndarray, gain_fn) -> np.ndarray:
	"""EQ a fase zero nel dominio della frequenza (circolare: perfetto per i loop).
	gain_fn(freq_array) -> guadagno lineare."""
	n = x.shape[-1]
	X = sfft.rfft(x, axis=-1, workers=-1)
	f = sfft.rfftfreq(n, 1.0 / SR)
	X *= gain_fn(f)
	return sfft.irfft(X, n, axis=-1, workers=-1)


def curve(points_db: list[tuple[float, float]]):
	"""Curva EQ da punti (Hz, dB) interpolati in scala logaritmica."""
	fs = np.array([p[0] for p in points_db], float)
	gs = np.array([p[1] for p in points_db], float)

	def g(f):
		lf = np.log2(np.maximum(f, 1.0))
		return 10 ** (np.interp(lf, np.log2(fs), gs) / 20)
	return g


def formant_curve(formants: list[tuple[float, float, float]], floor_db: float = -24.0):
	"""Curva di formanti (freq, larghezza, dB) per voci/corpi risonanti."""
	def g(f):
		acc = np.full_like(f, 10 ** (floor_db / 20), dtype=float)
		for f0, bw, gdb in formants:
			acc += 10 ** (gdb / 20) / (1.0 + ((f - f0) / (bw / 2)) ** 2)
		return acc
	return g


# ----------------------------------------------------------------- spazio

def pan_mono(x: np.ndarray, pan: float) -> np.ndarray:
	"""Panning a potenza costante, pan in [-1, 1]."""
	th = (np.clip(pan, -1, 1) + 1) * np.pi / 4
	return np.vstack([x * np.cos(th), x * np.sin(th)])


def as_stereo(x: np.ndarray, pan: float = 0.0) -> np.ndarray:
	if x.ndim == 1:
		return pan_mono(x, pan)
	if pan == 0.0:
		return x
	# bilanciamento di un segnale già stereo
	th = (np.clip(pan, -1, 1) + 1) * np.pi / 4
	return np.vstack([x[0] * np.cos(th) * np.sqrt(2), x[1] * np.sin(th) * np.sqrt(2)])


def add_circ(buf: np.ndarray, x: np.ndarray, start: int) -> None:
	"""Somma x (2, n) nel buffer circolare (2, L) a partire da `start`."""
	L = buf.shape[-1]
	n = x.shape[-1]
	s = start % L
	pos = 0
	while pos < n:
		k = min(n - pos, L - s)
		buf[:, s:s + k] += x[:, pos:pos + k]
		pos += k
		s = 0


def add_lin(buf: np.ndarray, x: np.ndarray, start: int) -> None:
	"""Somma x nel buffer lineare (tronca alla fine)."""
	L = buf.shape[-1]
	if start >= L:
		return
	k = min(x.shape[-1], L - start)
	buf[..., start:start + k] += x[..., :k]


def make_ir(length: float = 4.0, t60_low: float = 3.2, t60_high: float = 1.1, predelay: float = 0.025,
			diffusion: float = 0.04, early: int = 14, tone_hz: float = 7500.0, seed: int = 1,
			width: float = 1.0) -> np.ndarray:
	"""Risposta all'impulso stereo sintetica: rumore decorrelato con decadimento
	dipendente dalla frequenza (gli acuti muoiono prima, come in una sala vera),
	riflessioni precoci sparse e pre-delay. Restituisce (2, n), energia ~1 per canale."""
	rng = np.random.default_rng(seed)
	n = int(length * SR)
	t = np.arange(n) / SR
	edges = [0, 120, 250, 500, 1000, 2000, 4000, 8000, SR / 2]
	f = np.fft.rfftfreq(n, 1 / SR)
	out = np.zeros((2, n))
	for ch in range(2):
		N = np.fft.rfft(rng.standard_normal(n))
		acc = np.zeros(n)
		for i in range(len(edges) - 1):
			lo, hi = edges[i], edges[i + 1]
			mask = ((f >= lo) & (f < hi)).astype(float)
			# raccordo morbido tra bande
			mask = np.convolve(mask, np.hanning(31) / np.hanning(31).sum(), "same")
			fc = np.sqrt(max(lo, 60) * hi)
			a = np.clip((np.log2(fc) - np.log2(150)) / (np.log2(8000) - np.log2(150)), 0, 1)
			t60 = t60_low * (1 - a) + t60_high * a
			acc += np.fft.irfft(N * mask, n) * np.exp(-6.91 * t / t60)
		acc *= 1 - np.exp(-t / max(1e-3, diffusion))
		# riflessioni precoci
		for _ in range(early):
			tt = rng.uniform(0.004, 0.09)
			k = int(tt * SR)
			if k < n:
				acc[k] += rng.choice([-1, 1]) * rng.uniform(0.6, 1.4) * np.exp(-tt / 0.05) * 3.0 * acc.std()
		# colore: assorbimento dell'aria
		A = np.fft.rfft(acc)
		A *= 1 / np.sqrt(1 + (f / tone_hz) ** 4)
		A *= 1 / np.sqrt(1 + (60 / np.maximum(f, 1)) ** 4)
		acc = np.fft.irfft(A, n)
		pd = int(predelay * SR)
		acc = np.concatenate([np.zeros(pd), acc[:n - pd]])
		fade = int(0.2 * SR)
		acc[-fade:] *= ramp_cos(fade)[::-1]
		out[ch] = acc / np.sqrt(np.sum(acc ** 2))
	if width < 1.0:
		m = 0.5 * (out[0] + out[1])
		out = m + width * (out - m)
	return out


def reverb_circ(x: np.ndarray, ir: np.ndarray, cross: float = 0.25) -> np.ndarray:
	"""Riverbero come convoluzione CIRCOLARE (il loop resta perfetto)."""
	L = x.shape[-1]
	m = min(ir.shape[-1], L)
	inL = (1 - cross) * x[0] + cross * x[1]
	inR = (1 - cross) * x[1] + cross * x[0]
	out = np.zeros_like(x)
	for ch, sig in enumerate((inL, inR)):
		h = np.zeros(L)
		h[:m] = ir[ch, :m]
		out[ch] = sfft.irfft(sfft.rfft(sig, workers=-1) * sfft.rfft(h, workers=-1), L, workers=-1)
	return out


def reverb_lin(x: np.ndarray, ir: np.ndarray, cross: float = 0.25) -> np.ndarray:
	"""Riverbero lineare per effetti one-shot: l'uscita si allunga della coda."""
	x = as_stereo(x)
	inL = (1 - cross) * x[0] + cross * x[1]
	inR = (1 - cross) * x[1] + cross * x[0]
	return np.vstack([ss.fftconvolve(inL, ir[0]), ss.fftconvolve(inR, ir[1])])


# ----------------------------------------------------------------- dinamica e loudness

def _pb_run(board, x: np.ndarray) -> np.ndarray:
	y = board(x.astype(np.float32), SR, reset=True)
	return y.astype(np.float64)


def pb_periodic(board, x: np.ndarray, warm_s: float = 4.0) -> np.ndarray:
	"""Processore pedalboard con memoria su segnale periodico (preriscaldato con la coda)."""
	w = min(x.shape[-1], int(warm_s * SR))
	xx = np.concatenate([x[..., -w:], x], axis=-1)
	y = _pb_run(board, xx)
	return y[..., w:w + x.shape[-1]]


def lufs(x: np.ndarray) -> float:
	import pyloudnorm as pyln
	meter = pyln.Meter(SR)
	x = as_stereo(x) if x.ndim == 1 else x
	if x.shape[-1] < SR // 2:
		x = np.concatenate([x, np.zeros((2, SR // 2))], axis=-1)
	return float(meter.integrated_loudness(x.T))


def true_peak_db(x: np.ndarray) -> float:
	up = ss.resample_poly(x, 4, 1, axis=-1)
	return 20 * np.log10(np.max(np.abs(up)) + 1e-12)


def limiter(x: np.ndarray, ceiling_db: float = -1.5, look_ms: float = 6.0, rel_ms: float = 60.0,
			wrap: bool = True) -> np.ndarray:
	"""Limiter a guadagno anticipato, tutto vettoriale. Il guadagno non supera mai quello
	richiesto (filtro di minimo su 2 finestre, poi media mobile su una finestra).
	wrap=True: il segnale è un loop e la finestra si avvolge (resta periodico)."""
	from scipy.ndimage import minimum_filter1d, uniform_filter1d
	mode = "wrap" if wrap else "nearest"
	ceil = db(ceiling_db)
	a = np.max(np.abs(x), axis=0) + 1e-12
	g = np.minimum(1.0, ceil / a)
	w = max(3, int(look_ms * SR / 1000))
	g = minimum_filter1d(g, 2 * w + 1, mode=mode)
	g = uniform_filter1d(g, w, mode=mode)
	r = max(3, int(rel_ms * SR / 1000))
	g2 = minimum_filter1d(g, r, mode=mode, origin=(r - 1) // 2)  # minimo sul passato: rilascio
	g = np.minimum(g, uniform_filter1d(g2, r, mode=mode))
	return x * g


def compressor(x: np.ndarray, thresh_db: float, ratio: float = 1.6, win_ms: float = 250.0,
			   wrap: bool = True) -> np.ndarray:
	"""Compressore RMS morbido (colla), vettoriale e periodico se wrap=True."""
	from scipy.ndimage import uniform_filter1d
	mode = "wrap" if wrap else "nearest"
	w = max(3, int(win_ms * SR / 1000))
	env = np.sqrt(uniform_filter1d(np.mean(x ** 2, axis=0), w, mode=mode) + 1e-14)
	lvl = 20 * np.log10(env)
	over = np.maximum(0.0, lvl - thresh_db)
	gdb = -over * (1 - 1 / ratio)
	gdb = uniform_filter1d(gdb, w, mode=mode)
	return x * 10 ** (gdb / 20)


def master_loop(x: np.ndarray, target_lufs: float, ceiling_db: float = -1.2, comp: bool = True,
				hp_hz: float = 28.0) -> np.ndarray:
	"""Mastering di un loop: passa-alto, colla leggera, loudness, limiter, tetto true-peak."""
	x = filt_periodic(hp(hp_hz, 2), x)
	x = x - x.mean(axis=-1, keepdims=True)
	x *= db(target_lufs - lufs(x))
	if comp:
		x = compressor(x, target_lufs + 4.0, 1.6)
	for _ in range(4):
		x *= db(target_lufs - lufs(x))
		x = limiter(x, ceiling_db - 0.5)
	tp = true_peak_db(x)
	if tp > ceiling_db:
		x *= db(ceiling_db - tp)
	return x


def master_oneshot(x: np.ndarray, peak_db: float = -3.0, hp_hz: float = 35.0, fade_out: float = 0.02) -> np.ndarray:
	"""Effetti brevi: passa-alto, niente DC, coda sfumata, normalizzazione di picco (true peak)."""
	x = filt(hp(hp_hz, 2), x)
	n = x.shape[-1]
	f = min(n, int(fade_out * SR))
	if f > 0:
		x[..., -f:] *= ramp_cos(f)[::-1]
	a = min(n, 32)
	x[..., :a] *= ramp_cos(a)
	tp = true_peak_db(x)
	return x * db(peak_db - tp)


def trim_tail(x: np.ndarray, thresh_db: float = -70.0, min_len: float = 0.05) -> np.ndarray:
	"""Taglia il silenzio finale di un effetto (con sfumatura breve)."""
	a = np.abs(x) if x.ndim == 1 else np.max(np.abs(x), axis=0)
	peak = a.max() + 1e-12
	idx = np.where(a > peak * db(thresh_db))[0]
	end = int(idx[-1]) + int(0.01 * SR) if len(idx) else len(a)
	end = max(end, int(min_len * SR))
	end = min(end, x.shape[-1])
	y = x[..., :end].copy()
	f = min(end, int(0.015 * SR))
	y[..., -f:] *= ramp_cos(f)[::-1]
	return y


# ----------------------------------------------------------------- uscita

def write_wav(path: str, x: np.ndarray, rng: np.random.Generator | None = None) -> None:
	"""WAV PCM 16 bit con dither TPDF."""
	import soundfile as sf
	rng = rng or np.random.default_rng(0)
	d = (rng.random(x.shape) - rng.random(x.shape)) / 32768.0
	y = np.clip(x + d, -1.0, 32767 / 32768)
	data = y.T if y.ndim == 2 else y
	os.makedirs(os.path.dirname(path), exist_ok=True)
	sf.write(path, data, SR, subtype="PCM_16")


def write_ogg(path: str, x: np.ndarray, quality: float = 5.0) -> None:
	"""OGG Vorbis via ffmpeg/libvorbis (ingresso float: niente dither necessario)."""
	import soundfile as sf
	os.makedirs(os.path.dirname(path), exist_ok=True)
	with tempfile.TemporaryDirectory() as td:
		tmp = os.path.join(td, "in.wav")
		data = x.T if x.ndim == 2 else x
		sf.write(tmp, np.clip(data, -1, 1).astype(np.float32), SR, subtype="FLOAT")
		subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-map_metadata", "-1",
						"-c:a", "libvorbis", "-q:a", str(quality), path], check=True)


def read_audio(path: str) -> np.ndarray:
	"""Decodifica qualunque file (anche OGG) a float (2, n) via ffmpeg."""
	out = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
						 check=True, capture_output=True).stdout
	a = np.frombuffer(out, dtype=np.float32).reshape(-1, 2).T
	return a.astype(np.float64)
