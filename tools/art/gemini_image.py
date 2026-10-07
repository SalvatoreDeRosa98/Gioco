#!/usr/bin/env python3
"""Genera o ridipinge immagini con l'API Gemini e le salva come PNG pronti per Godot.

La chiave si legge dalla variabile d'ambiente GEMINI_API_KEY (mai da riga di comando).

Esempi:
  # elenca i modelli che generano immagini
  python3 tools/art/gemini_image.py --list-models

  # ridipinge una foto nello stile del gioco
  python3 tools/art/gemini_image.py --prompt "..." --input foto.jpg --out src/assets/art/piazza/mid.png

  # genera tutto ciò che è descritto nel piano (salta i file già esistenti)
  python3 tools/art/gemini_image.py --plan tools/art/plan.json
"""

import argparse
import base64
import json
import mimetypes
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

API = "https://generativelanguage.googleapis.com/v1beta"
ROOT = Path(__file__).resolve().parents[2]


def api_key() -> str:
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key:
        sys.exit("GEMINI_API_KEY non impostata: aggiungila ai segreti dell'ambiente e apri una nuova sessione.")
    return key


def request(method: str, path: str, body: dict | None = None) -> dict:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(f"{API}/{path}", data=data, method=method)
    req.add_header("x-goog-api-key", api_key())
    req.add_header("Content-Type", "application/json")
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=300) as resp:
                return json.loads(resp.read())
        except urllib.error.HTTPError as e:
            detail = e.read().decode(errors="replace")[:600]
            if e.code in (429, 500, 503) and attempt < 3:
                wait = 2 ** (attempt + 2)
                print(f"  errore {e.code}, riprovo tra {wait}s...", file=sys.stderr)
                time.sleep(wait)
                continue
            sys.exit(f"Errore API {e.code}: {detail}")
    sys.exit("Troppi tentativi falliti.")


def image_models() -> list[str]:
    out = []
    page = ""
    while True:
        res = request("GET", "models?pageSize=200" + (f"&pageToken={page}" if page else ""))
        for m in res.get("models", []):
            name = m["name"].removeprefix("models/")
            if "image" in name and "generateContent" in m.get("supportedGenerationMethods", []):
                out.append(name)
        page = res.get("nextPageToken", "")
        if not page:
            return out


def pick_model(preferred: str | None) -> str:
    if preferred:
        return preferred
    env = os.environ.get("GEMINI_IMAGE_MODEL")
    if env:
        return env
    models = image_models()
    if not models:
        sys.exit("Nessun modello di immagini disponibile per questa chiave.")
    # Preferisce i modelli "pro", poi i più recenti (ordine alfabetico inverso come approssimazione).
    models.sort(key=lambda n: ("pro" not in n, "preview" in n, n), reverse=False)
    return models[0]


def inline(path: Path) -> dict:
    mime = mimetypes.guess_type(path.name)[0] or "image/png"
    return {"inline_data": {"mime_type": mime, "data": base64.b64encode(path.read_bytes()).decode()}}


def generate(model: str, prompt: str, images: list[Path], aspect: str | None) -> tuple[bytes, str]:
    parts = [inline(p) for p in images] + [{"text": prompt}]
    body: dict = {"contents": [{"role": "user", "parts": parts}], "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]}}
    if aspect:
        body["generationConfig"]["imageConfig"] = {"aspectRatio": aspect}
    res = request("POST", f"models/{model}:generateContent", body)
    text = []
    for cand in res.get("candidates", []):
        for part in cand.get("content", {}).get("parts", []):
            blob = part.get("inline_data") or part.get("inlineData")
            if blob:
                return base64.b64decode(blob["data"]), " ".join(text)
            if "text" in part:
                text.append(part["text"])
    sys.exit(f"Nessuna immagine nella risposta. Testo: {' '.join(text)[:400] or json.dumps(res)[:400]}")


def key_green(png: Path) -> None:
    """Rende trasparente lo sfondo verde croma e ammorbidisce il bordo verde residuo."""
    from PIL import Image

    img = Image.open(png).convert("RGBA")
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            dominance = g - max(r, b)
            if dominance > 90:
                px[x, y] = (r, g, b, 0)
            elif dominance > 30:
                alpha = int(255 * (1 - (dominance - 30) / 60))
                px[x, y] = (r, min(g, max(r, b)), b, min(a, alpha))
    img.save(png)


def save(data: bytes, out: Path, meta: dict, chroma: bool) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(data)
    from PIL import Image

    Image.open(out).save(out, "PNG")  # normalizza il formato (l'API può restituire JPEG)
    if chroma:
        key_green(out)
    meta["generated_at"] = datetime.now(timezone.utc).isoformat()
    out.with_suffix(".json").write_text(json.dumps(meta, indent=2, ensure_ascii=False))
    print(f"  salvato {out.relative_to(ROOT) if out.is_relative_to(ROOT) else out}")


def run_plan(plan_path: Path, model: str, only: str | None, force: bool) -> None:
    plan = json.loads(plan_path.read_text())
    style = plan["STYLE"]
    for asset in plan["assets"]:
        if only and only not in asset["out"]:
            continue
        out = ROOT / asset["out"]
        if out.exists() and not force:
            print(f"- {asset['out']}: esiste già, salto")
            continue
        refs = [ROOT / r for r in asset.get("refs", []) if (ROOT / r).exists()]
        missing = [r for r in asset.get("refs", []) if not (ROOT / r).exists()]
        if missing:
            print(f"- {asset['out']}: riferimenti mancanti {missing}, genero senza")
        prompt = f"{style}\n\n{asset['prompt']}"
        if asset.get("chroma"):
            prompt += "\n\nSfondo: verde croma piatto e uniforme (#00FF00), senza ombre né sfumature sullo sfondo."
        print(f"- {asset['out']} ({model})")
        data, text = generate(model, prompt, refs, asset.get("aspect"))
        save(data, out, {"model": model, "prompt": prompt, "refs": asset.get("refs", []), "note": text}, asset.get("chroma", False))


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--list-models", action="store_true")
    ap.add_argument("--model")
    ap.add_argument("--prompt")
    ap.add_argument("--input", action="append", default=[], help="immagini di riferimento (foto, stile)")
    ap.add_argument("--out")
    ap.add_argument("--aspect", help="es. 16:9, 21:9, 1:1")
    ap.add_argument("--key-green", action="store_true", help="scontorna lo sfondo verde croma")
    ap.add_argument("--plan", help="file JSON con l'elenco degli asset da generare")
    ap.add_argument("--only", help="con --plan: genera solo gli asset il cui percorso contiene questo testo")
    ap.add_argument("--force", action="store_true", help="con --plan: rigenera anche i file esistenti")
    args = ap.parse_args()

    if args.list_models:
        for m in image_models():
            print(m)
        return
    model = pick_model(args.model)
    if args.plan:
        run_plan(Path(args.plan), model, args.only, args.force)
        return
    if not (args.prompt and args.out):
        ap.error("servono --prompt e --out (oppure --plan)")
    data, text = generate(model, args.prompt, [Path(p) for p in args.input], args.aspect)
    save(data, Path(args.out), {"model": model, "prompt": args.prompt, "refs": args.input, "note": text}, args.key_green)


if __name__ == "__main__":
    main()
