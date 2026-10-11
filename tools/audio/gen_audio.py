#!/usr/bin/env python3
"""Sintesi procedurale degli audio di Ferruccio (CC0, autore: progetto Ferruccio).
Solo numpy + ffmpeg (libvorbis). Musiche e ambienti: rendering circolare (riverbero e code
avvolte sull'inizio) quindi loop senza giunture. Livelli normalizzati per categoria.
Uso: python3 gen_audio.py OUTDIR
"""
import sys, os, subprocess, json
import numpy as np

SR = 44100
rng = np.random.default_rng(1845)
OUT = sys.argv[1] if len(sys.argv) > 1 else "out"

def t_(d): return np.arange(int(d * SR)) / SR

def fft_band(x, lo=0.0, hi=None, slope=1.0):
    """Filtro passa-banda morbido nel dominio della frequenza (circolare)."""
    n = x.shape[-1]
    X = np.fft.rfft(x, axis=-1)
    f = np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(f)
    if lo > 0: g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (4 * slope))
    if hi: g *= 1 / np.sqrt(1 + (f / hi) ** (4 * slope))
    return np.fft.irfft(X * g, n, axis=-1)

def env_adsr(n, a, d, s, r, sus_len=None):
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    sus = max(0, n - a - d - r)
    e = np.concatenate([np.linspace(0, 1, max(a, 1)), np.linspace(1, s, max(d, 1)), np.full(sus, s), np.linspace(s, 0, max(r, 1))])
    return np.pad(e, (0, max(0, n - len(e))))[:n]

def midi(m): return 440.0 * 2 ** ((m - 69) / 12)

# --- strumenti -------------------------------------------------------------
def pluck(f, d, bright=1.0):
    """Mandolino/pizzicato: armoniche con smorzamento crescente e leggero battimento delle corde doppie."""
    t = t_(d); y = np.zeros_like(t)
    for k in range(1, 16):
        if f * k > 9000: break
        amp = (1 / k ** 1.1) * (np.sin(np.pi * k * 0.18) ** 2 + 0.05) * bright ** (k / 6)
        dec = 2.5 + 1.6 * k
        for det in (1.0, 1.0025):
            y += amp * np.sin(2 * np.pi * f * k * det * t + rng.uniform(0, 6.28)) * np.exp(-dec * t)
    y += 0.1 * rng.standard_normal(len(t)) * np.exp(-t * 400)  # plettro
    return y * env_adsr(len(t), 0.002, 0.01, 1, 0.03)

def tremolo_mand(f, d, rate=13.0):
    """Mandolino a tremolo (plettrata ripetuta), tipico napoletano."""
    y = np.zeros(int(d * SR)); step = int(SR / rate); i = 0; k = 0
    while i < len(y):
        p = pluck(f, min(0.35, (len(y) - i) / SR + 0.001), 0.8 + 0.2 * (k % 2)) * (0.75 + 0.25 * (k % 2))
        y[i:i + len(p)] += p[:len(y) - i]; i += step; k += 1
    return y * env_adsr(len(y), 0.01, 0.05, 0.9, 0.08)

def strings(f, d, n_h=12, vib=5.2, att=0.25):
    t = t_(d); ph = 2 * np.pi * f * (t + 0.003 / vib * np.sin(2 * np.pi * vib * t) * np.clip(t / 0.6, 0, 1))
    y = sum((1 / k) * np.sin(k * ph + rng.uniform(0, 6.28)) for k in range(1, n_h) if f * k < 10000)
    bow = 1 + 0.03 * fft_band(rng.standard_normal(len(t)), 2, 12)
    return y * bow * env_adsr(len(t), att, 0.1, 0.85, min(0.3, d * 0.3))

def reed(f, d, vib=5.0):
    """Fiato ad ancia (oboe/clarinetto): armoniche dispari dominanti, vibrato ritardato."""
    t = t_(d); ph = 2 * np.pi * f * (t + 0.002 / vib * np.sin(2 * np.pi * vib * t) * np.clip((t - 0.2) / 0.5, 0, 1))
    y = sum(((1 / k) if k % 2 else 0.35 / k) * np.sin(k * ph) for k in range(1, 12) if f * k < 9000)
    y += 0.01 * rng.standard_normal(len(t))
    return y * env_adsr(len(t), 0.06, 0.08, 0.8, min(0.15, d * 0.3))

def horn(f, d):
    """Ottone (corno/tromba naturale): armoniche che si aprono con l'attacco."""
    t = t_(d); y = np.zeros_like(t); open_ = np.clip(t / 0.08, 0, 1)
    for k in range(1, 14):
        if f * k > 8000: break
        y += (1 / k ** (1.6 - 0.7 * open_)) * np.sin(2 * np.pi * f * k * t)
    return np.tanh(1.4 * y) * env_adsr(len(t), 0.04, 0.12, 0.75, min(0.2, d * 0.3))

def timpani(f, d=1.4):
    t = t_(d); fr = f * (1 + 0.04 * np.exp(-t * 20))
    y = sum(a * np.sin(2 * np.pi * fr * m * t) * np.exp(-t * dc) for m, a, dc in [(1, 1, 3), (1.5, .5, 4), (1.98, .3, 5), (2.44, .2, 7)])
    return y + 0.4 * fft_band(rng.standard_normal(len(t)), 60, 900) * np.exp(-t * 40)

def frame_drum(d=0.25, accent=1.0):
    """Tamburello: pelle + sonagli."""
    t = t_(d); skin = np.sin(2 * np.pi * 180 * t * (1 + 0.3 * np.exp(-t * 40))) * np.exp(-t * 25)
    jingle = fft_band(rng.standard_normal(len(t)), 5000, 11000) * np.exp(-t * 22) * 0.18
    return accent * (skin + jingle)

def snare(d=0.2):
    t = t_(d)
    return fft_band(rng.standard_normal(len(t)), 900, 7000) * np.exp(-t * 22) * 0.7 + np.sin(2 * np.pi * 200 * t) * np.exp(-t * 30) * 0.4

# --- strumenti di mixaggio --------------------------------------------------
class Track:
    def __init__(self, dur):
        self.n = int(dur * SR); self.buf = np.zeros((2, self.n))
    def add(self, sig, at, gain=1.0, pan=0.0):
        i = int(at * SR) % self.n; L = len(sig)
        g = np.array([np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)]) * gain * 1.414
        idx = (np.arange(L) + i) % self.n  # le code si avvolgono sull'inizio: loop senza giuntura
        np.add.at(self.buf[0], idx, sig * g[0]); np.add.at(self.buf[1], idx, sig * g[1])

def reverb_circ(x, rt=2.2, mix=0.3, lo=200, hi=6000):
    """Riverbero a convoluzione circolare con risposta sintetica (coda di rumore esponenziale)."""
    n = x.shape[-1]; L = min(n, int(rt * 1.5 * SR))
    out = np.empty_like(x)
    for c in range(x.shape[0]):
        ir = np.zeros(n); tt = np.arange(L) / SR
        ir[:L] = rng.standard_normal(L) * np.exp(-6.9 * tt / rt)
        ir = fft_band(ir, lo, hi); ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
        out[c] = np.fft.irfft(np.fft.rfft(x[c]) * np.fft.rfft(ir), n)
    return x * (1 - mix) + out * mix * 1.6

def norm_rms(x, target_db, peak_db=-2.0):
    rms = np.sqrt(np.mean(x ** 2)) + 1e-12
    x = x * (10 ** (target_db / 20) / rms)
    pk = np.max(np.abs(x)); lim = 10 ** (peak_db / 20)
    if pk > lim:  # limitatore morbido
        if pk > lim * 1.6: x = np.tanh(x / lim * 0.9) * lim / np.tanh(0.9)
        pk = np.max(np.abs(x))
        if pk > lim: x = x * (lim / pk)
    return x

def write_ogg(path, x, q=6):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    x = np.atleast_2d(x); raw = (np.clip(x.T, -1, 1) * 32767).astype("<i2").tobytes()
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", str(SR), "-ac", str(x.shape[0]), "-i", "-",
                    "-c:a", "libvorbis", "-q:a", str(q), path], input=raw, check=True)

REPORT = {}
def save(rel, x, target, loop=False):
    x = norm_rms(x, target)
    write_ogg(os.path.join(OUT, rel), x)
    REPORT[rel] = {"seconds": round(x.shape[-1] / SR, 2), "rms_db": target, "loop": loop}

# --- musiche ---------------------------------------------------------------
def scale_note(root, degree, mode):
    steps = {"minor": [0, 2, 3, 5, 7, 8, 10], "harm": [0, 2, 3, 5, 7, 8, 11], "major": [0, 2, 4, 5, 7, 9, 11]}[mode]
    o, d = divmod(degree, 7); return root + 12 * o + steps[d]

def music_ratking():
    """Tema di Ratking: tarantella in Re minore armonica, 6/8, mandolino a tremolo, pizzicati, tamburello, fagotto/ancia."""
    bpm = 150; beat = 60 / bpm / 2  # croma in 6/8 (bpm sulla semiminima puntata ~ 100)
    bar = beat * 6; bars = 32; tr = Track(bar * bars); root = 62
    prog = [0, 0, 3, 4, 0, 5, 3, 4] * 4  # i i iv V i VI iv V
    mel = [[4, 3, 2, 3, 4, 7], [6, 4, 3, 2, 1, 2], [3, 5, 7, 8, 7, 5], [4, 6, 8, 7, 6, 4],
           [7, 8, 9, 7, 6, 4], [5, 4, 2, 0, 2, 4], [3, 2, 1, 3, 5, 3], [4, 6, 4, 2, 1, -1]]
    for b in range(bars):
        t0 = b * bar; ch = prog[b]
        for i in range(6):  # tamburello
            tr.add(frame_drum(0.25, 1.0 if i in (0, 3) else 0.45), t0 + i * beat, 0.22, 0.3)
        for i, deg in enumerate([ch, ch + 4, ch + 7, ch + 4, ch, ch + 4]):  # pizzicato/arpeggio
            tr.add(pluck(midi(scale_note(root - 24, deg, "harm")), 0.5, 0.6), t0 + i * beat, 0.5, -0.35)
        tr.add(strings(midi(scale_note(root - 12, ch, "harm")), bar, 8, att=0.4), t0, 0.12, 0.0)  # bordone archi
        phrase = mel[b % 8]
        for i, deg in enumerate(phrase):
            f = midi(scale_note(root, deg + (7 if b >= 8 else 0) * 0, "harm"))
            if (b // 8) % 2 == 1 and i % 3 == 0:
                tr.add(reed(f / 2, beat * 2.8), t0 + i * beat, 0.22, 0.4)  # controcanto d'ancia nella ripresa
            tr.add(tremolo_mand(f, beat * 0.98), t0 + i * beat, 0.42, 0.15)
    return reverb_circ(tr.buf, 1.6, 0.25)

def music_cavaliere():
    """Tema del Cavaliere Borbonico: marcia in Do minore, 4/4, corni e trombe naturali, archi in ostinato, timpani e tamburo."""
    bpm = 104; q = 60 / bpm; bar = q * 4; bars = 16; tr = Track(bar * bars); root = 60
    prog = [0, 0, 5, 4, 0, 3, 4, 4, 0, 0, 5, 4, 3, 4, 0, 4]
    fan = [[0, 0, 2, 4], [4, 3, 2, 0], [5, 4, 5, 7], [4, -1, 1, 4], [7, 7, 9, 7], [5, 3, 5, 3], [4, 2, 1, -1], [4, 4, 4, 4]]
    for b in range(bars):
        t0 = b * bar; ch = prog[b]
        tr.add(timpani(midi(scale_note(36, ch if ch in (0, 4) else 0, "harm")), 1.2), t0, 0.55, -0.1)
        tr.add(timpani(midi(scale_note(36, 4, "harm")), 1.0), t0 + 2 * q, 0.35, -0.1)
        for i in range(8):  # ostinato archi in crome
            deg = ch + (0 if i % 2 == 0 else 4)
            tr.add(strings(midi(scale_note(root - 12, deg, "harm")), q * 0.48, 9, vib=6, att=0.01), t0 + i * q / 2, 0.22, -0.3)
        for s in (0.0, 0.75 * q, q, 2 * q, 2.75 * q, 3 * q):  # tamburo militare
            tr.add(snare(), t0 + s, 0.25 if s % q else 0.35, 0.25)
        line = fan[b % 8]
        for i, deg in enumerate(line):
            f = midi(scale_note(root, deg, "harm"))
            tr.add(horn(f, q * 0.95), t0 + i * q, 0.32, 0.2)
            if b >= 8: tr.add(horn(f * 2, q * 0.9), t0 + i * q, 0.16, 0.45)  # trombe all'ottava nella ripresa
        tr.add(horn(midi(scale_note(root - 12, ch, "harm")), bar * 0.98), t0, 0.14, -0.4)
    return reverb_circ(tr.buf, 2.4, 0.3)

def music_cisterne(root=57, dark=False):
    """Cisterne: lento in La minore, archi tenuti, clarinetto, mandolino rado, gocce."""
    bpm = 66 if not dark else 56; q = 60 / bpm; bar = q * 4; bars = 12; tr = Track(bar * bars)
    prog = [0, 5, 3, 4, 0, 5, 1, 4, 0, 3, 5, 4]
    mel = [4, None, 3, 2, 3, None, 0, None, 2, 4, 5, 4, 2, None, 1, None]
    for b in range(bars):
        t0 = b * bar; ch = prog[b]
        for deg, pan in ((ch, -0.4), (ch + 2, 0.0), (ch + 4, 0.4)):
            tr.add(strings(midi(scale_note(root - 12 - (12 if dark else 0) * (deg == ch), deg, "minor")), bar * 1.05, 10, 4.5, att=1.2), t0, 0.16, pan)
        if not dark or b % 2:
            for i in (0, 3, 6):
                tr.add(pluck(midi(scale_note(root, ch + [0, 2, 4][i // 3], "minor")), 1.2, 0.5), t0 + i * q / 2 + q, 0.18, 0.5)
        if b >= 4:
            for i in range(4):
                deg = mel[(b * 4 + i) % 16]
                if deg is not None:
                    tr.add(reed(midi(scale_note(root - (12 if dark else 0), deg, "minor")), q * 1.6), t0 + i * q, 0.2, -0.15)
    for k in range(int(bars * 3)):  # gocce
        tr.add(drip(), rng.uniform(0, bar * bars), 0.08, rng.uniform(-0.8, 0.8))
    return reverb_circ(tr.buf, 4.5 if dark else 3.5, 0.42, 150, 5000)

# --- ambienti --------------------------------------------------------------
def drip(f=None):
    f = f or rng.uniform(900, 2200); t = t_(0.18)
    return np.sin(2 * np.pi * f * t * (1 + 1.8 * t)) * np.exp(-t * 35)

def loop_noise(dur, lo, hi):
    return fft_band(rng.standard_normal(int(dur * SR)), lo, hi)  # rumore filtrato circolare = gia' in loop

def amb_acqua(dur=40.0, dark=False):
    tr = Track(dur)
    for c, pan in ((0, -0.6), (1, 0.6)):
        flow = loop_noise(dur, 80, 900 if not dark else 400)
        mod = 1 + 0.35 * np.sin(2 * np.pi * (np.arange(len(flow)) / SR) * (1 / dur) * (3 + c))  # moto lento ma periodico sul loop
        tr.add(flow * mod, 0, 0.6, pan)
    tr.add(loop_noise(dur, 25, 90) * 2.0, 0, 0.5)  # rombo della volta
    for _ in range(int(dur * (1.2 if not dark else 0.5))):
        tr.add(drip(rng.uniform(700, 1800) * (0.7 if dark else 1)), rng.uniform(0, dur), rng.uniform(0.15, 0.45), rng.uniform(-0.9, 0.9))
    return reverb_circ(tr.buf, 5.0, 0.5, 120, 4500)

def squeak(d=None):
    d = d or rng.uniform(0.06, 0.14); t = t_(d); f0 = rng.uniform(2800, 4200)
    f = f0 * (1 + 0.25 * np.sin(np.pi * t / d)) ; ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) + 0.3 * np.sin(2 * ph)) * np.sin(np.pi * t / d) ** 2

def scurry(d=0.5):
    y = np.zeros(int(d * SR)); i = 0
    while i < len(y) - 2000:
        tt = t_(0.012); y[i:i + len(tt)] += fft_band(rng.standard_normal(len(tt)), 1500, 7000) * np.exp(-tt * 300) * rng.uniform(.4, 1)
        i += int(rng.uniform(0.02, 0.05) * SR)
    return y

def amb_tana(dur=40.0):
    x = amb_acqua(dur, dark=True); tr = Track(dur); tr.buf = x * 0.8
    for _ in range(14):
        tr.add(squeak(), rng.uniform(0, dur), 0.05, rng.uniform(-1, 1))
    for _ in range(8):
        tr.add(scurry(rng.uniform(0.4, 1.0)), rng.uniform(0, dur), 0.08, rng.uniform(-1, 1))
    return reverb_circ(tr.buf, 2.5, 0.25)

# --- effetti ---------------------------------------------------------------
def pad(x, tail=0.3): return np.concatenate([x, np.zeros(int(tail * SR))])

def sfx_passo(seed):
    r = np.random.default_rng(seed); t = t_(0.22)
    heel = np.sin(2 * np.pi * r.uniform(70, 95) * t) * np.exp(-t * 45)
    grit = fft_band(pad(r.standard_normal(len(t))), r.uniform(300, 500), r.uniform(2500, 4200))[:len(t)] * np.exp(-t * r.uniform(28, 40))
    scrape = fft_band(pad(r.standard_normal(len(t))), 3000, 9000)[:len(t)] * np.exp(-((t - 0.05) / 0.025) ** 2) * 0.15
    return np.concatenate([np.zeros(80), heel * 0.8 + grit + scrape])

def sfx_colpo():
    t = t_(0.35)
    thump = np.sin(2 * np.pi * 110 * t * (1 + 0.8 * np.exp(-t * 30))) * np.exp(-t * 18)
    crack = fft_band(pad(rng.standard_normal(len(t))), 700, 6000)[:len(t)] * np.exp(-t * 35)
    cloth = fft_band(pad(rng.standard_normal(len(t))), 200, 1200)[:len(t)] * np.exp(-t * 12) * 0.3
    return np.tanh(1.8 * (thump + 0.7 * crack + cloth))

def sfx_parata():
    """Lama contro lama: parziali inarmoniche di metallo, transitorio brillante, coda lunga."""
    t = t_(1.1); y = np.zeros_like(t)
    for m, a, dc in [(1, 1, 6), (2.32, .6, 7), (3.87, .5, 9), (5.12, .35, 11), (7.3, .25, 14), (9.6, .18, 18)]:
        y += a * np.sin(2 * np.pi * 820 * m * t * (1 + 0.002 * np.sin(2 * np.pi * 6 * t))) * np.exp(-t * dc)
    hit = fft_band(pad(rng.standard_normal(len(t))), 2500, 12000)[:len(t)] * np.exp(-t * 60)
    sh = fft_band(pad(rng.standard_normal(len(t))), 5000, 12000)[:len(t)] * np.exp(-t * 9) * 0.15
    return reverb_circ(np.atleast_2d(pad(y * 0.5 + hit + sh, 0.6)), 1.2, 0.2)[0]

def sfx_ratti():
    tr = Track(1.4)
    for i in range(5): tr.add(squeak(), 0.05 + i * rng.uniform(0.12, 0.22), 0.5, rng.uniform(-0.6, 0.6))
    tr.add(scurry(1.2), 0.0, 0.7, 0)
    return tr.buf.mean(0)

def sfx_incudine():
    t = t_(2.4); y = np.zeros_like(t)
    for m, a, dc in [(1, 1, 1.6), (2.76, .7, 2.2), (5.4, .45, 3), (8.93, .3, 4.5), (13.3, .15, 6)]:
        y += a * np.sin(2 * np.pi * 620 * m * t) * np.exp(-t * dc)
    hit = fft_band(pad(rng.standard_normal(len(t))), 1500, 9000)[:len(t)] * np.exp(-t * 50)
    return reverb_circ(np.atleast_2d(pad(y * 0.45 + hit, 0.8)), 2.0, 0.25)[0]

def sfx_boss_preavviso():
    t = t_(0.9); f = midi(43)
    swell = horn(f, 0.9) * np.clip(t / 0.5, 0, 1) ** 2
    shing = fft_band(pad(rng.standard_normal(len(t))), 4000, 11000)[:len(t)] * np.exp(-((t - 0.6) / 0.12) ** 2) * 0.4
    return reverb_circ(np.atleast_2d(pad(swell + shing, 0.5)), 1.5, 0.25)[0]

def sfx_ratking_preavviso():
    t = t_(0.7)
    hiss = fft_band(pad(rng.standard_normal(len(t))), 2500, 9000)[:len(t)] * np.clip(t / 0.4, 0, 1) * np.exp(-np.clip(t - 0.45, 0, 1) * 20)
    y = hiss * 0.5; sq = squeak(0.25); i = int(0.42 * SR); y[i:i + len(sq)] += sq[:len(y) - i] * 0.8
    return y

def main():
    save("music/boss_ratking.ogg", music_ratking(), -17, True)
    save("music/boss_cavaliere.ogg", music_cavaliere(), -16, True)
    save("music/cisterne_reali.ogg", music_cisterne(57), -19, True)
    save("music/cisterne_sepolte.ogg", music_cisterne(52, dark=True), -20, True)
    save("ambience/acqua_cisterne.ogg", amb_acqua(), -24, True)
    save("ambience/cisterne_sepolte.ogg", amb_acqua(dark=True), -26, True)
    save("ambience/tana_ratking.ogg", amb_tana(), -25, True)
    for i in range(1, 4): save(f"sfx/passo_pietra_{i}.ogg", sfx_passo(i * 7), -24)
    save("sfx/colpo.ogg", sfx_colpo(), -16)
    save("sfx/parata.ogg", sfx_parata(), -18)
    save("sfx/ratti.ogg", sfx_ratti(), -20)
    save("sfx/incudine_salva.ogg", sfx_incudine(), -20)
    save("sfx/boss_preavviso.ogg", sfx_boss_preavviso(), -18)
    save("sfx/ratking_preavviso.ogg", sfx_ratking_preavviso(), -19)
    json.dump(REPORT, open(os.path.join(OUT, "report.json"), "w"), indent=1)

if __name__ == "__main__":
    main()
