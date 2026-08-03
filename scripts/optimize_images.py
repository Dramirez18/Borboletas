"""
Descarga las imagenes de postimg.cc referenciadas en el codigo, las convierte a
WebP redimensionado y deja un manifiesto con el ahorro de peso.

Uso:
    python scripts/optimize_images.py

Salida:
    scripts/optimized/<code>.webp   -- una por cada imagen viva
    scripts/optimized/manifest.json -- mapeo code -> {url_original, bytes_antes, bytes_despues}
"""
import io
import json
import re
import sys
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC_FILES = [
    ROOT / "src" / "constants.ts",
    ROOT / "src" / "components" / "HeroCarousel.tsx",
]
OUT_DIR = Path(__file__).resolve().parent / "optimized"
OUT_DIR.mkdir(exist_ok=True)

MAX_SIDE = 800      # lado mayor en px (cubre cards ~320 y hero ~320 con margen retina 2x)
QUALITY = 80        # calidad WebP
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"

# Captura CODE/FILE tanto en `${IMG}/CODE/file.png` como en `i.postimg.cc/CODE/file.png`
PATTERN = re.compile(r"(?:\$\{IMG\}|i\.postimg\.cc)/([A-Za-z0-9]+)/([A-Za-z0-9._-]+\.(?:png|jpg|jpeg|webp))")


def collect_images():
    """Devuelve dict code -> url_original (unico por code)."""
    found = {}
    for f in SRC_FILES:
        text = f.read_text(encoding="utf-8")
        for code, name in PATTERN.findall(text):
            found[code] = f"https://i.postimg.cc/{code}/{name}"
    return found


def download(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def main():
    images = collect_images()
    print(f"Imagenes referenciadas: {len(images)}")

    manifest = {}
    total_before = 0
    total_after = 0
    failed = []

    for i, (code, url) in enumerate(sorted(images.items()), 1):
        try:
            raw = download(url)
        except Exception as e:  # noqa: BLE001
            print(f"  [{i}/{len(images)}] FALLO descarga {code}: {e}")
            failed.append((code, url, str(e)))
            continue

        before = len(raw)
        try:
            im = Image.open(io.BytesIO(raw))
            im.load()
        except Exception as e:  # noqa: BLE001
            print(f"  [{i}/{len(images)}] FALLO abrir {code}: {e}")
            failed.append((code, url, str(e)))
            continue

        # Preservar transparencia si la hay; si no, aplanar a RGB
        has_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
        im = im.convert("RGBA" if has_alpha else "RGB")

        # Redimensionar manteniendo aspecto si excede MAX_SIDE
        w, h = im.size
        scale = min(1.0, MAX_SIDE / max(w, h))
        if scale < 1.0:
            im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)

        out_path = OUT_DIR / f"{code}.webp"
        im.save(out_path, "WEBP", quality=QUALITY, method=6)
        after = out_path.stat().st_size

        total_before += before
        total_after += after
        manifest[code] = {
            "url_original": url,
            "bytes_antes": before,
            "bytes_despues": after,
            "dim": im.size,
        }
        print(f"  [{i}/{len(images)}] {code}: {before//1024} KB -> {after//1024} KB  {im.size}")

    (OUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    ok = len(manifest)
    print("\n=== RESUMEN ===")
    print(f"Convertidas: {ok} | Fallidas: {len(failed)}")
    if ok:
        print(f"Peso antes:   {total_before/1024/1024:.2f} MB")
        print(f"Peso despues: {total_after/1024/1024:.2f} MB")
        print(f"Reduccion:    {100*(1-total_after/total_before):.1f}%")
    if failed:
        print("\nFallidas:")
        for code, url, err in failed:
            print(f"  {code}  {url}  ({err})")


if __name__ == "__main__":
    sys.exit(main())
