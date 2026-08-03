"""
Recolecta TODAS las URLs de imagenes (postimg) desde la tabla Product de Supabase,
las une con las del codigo, y descarga+convierte a WebP las que aun no esten en
scripts/optimized/. Idempotente: reusa lo ya convertido.

Uso:
    python scripts/collect_db_images.py
"""
import io
import json
import re
import sys
import urllib.request
import urllib.error
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = Path(__file__).resolve().parent / "optimized"
OUT_DIR.mkdir(exist_ok=True)
SRC_FILES = [ROOT / "src" / "constants.ts", ROOT / "src" / "components" / "HeroCarousel.tsx"]

MAX_SIDE = 800
QUALITY = 80
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"

# code + resto del path (nombre con cualquier caracter menos comillas/espacio/parentesis de cierre de la url)
URL_RE = re.compile(r"https?://i\.postimg\.cc/([A-Za-z0-9]+)/([^\"'\s\\]+\.(?:png|jpe?g|webp))", re.IGNORECASE)
TPL_RE = re.compile(r"\$\{IMG\}/([A-Za-z0-9]+)/([A-Za-z0-9._()-]+\.(?:png|jpe?g|webp))", re.IGNORECASE)


def load_env():
    env = {}
    for line in (ROOT / ".env.local").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env


def fetch_all_products(base, key):
    """Trae id,images de todos los productos (paginado)."""
    out = []
    step = 200
    start = 0
    while True:
        req = urllib.request.Request(
            f"{base}/rest/v1/Product?select=id,images&order=id",
            headers={
                "apikey": key, "Authorization": f"Bearer {key}",
                "Range-Unit": "items", "Range": f"{start}-{start+step-1}",
            },
        )
        with urllib.request.urlopen(req, timeout=40) as r:
            rows = json.loads(r.read())
        out.extend(rows)
        if len(rows) < step:
            break
        start += step
    return out


def collect_codes():
    """Devuelve dict code -> url_original a partir de codigo + DB."""
    found = {}

    # Desde el codigo
    for f in SRC_FILES:
        text = f.read_text(encoding="utf-8")
        for code, name in URL_RE.findall(text):
            found.setdefault(code, f"https://i.postimg.cc/{code}/{name}")
        for code, name in TPL_RE.findall(text):
            found.setdefault(code, f"https://i.postimg.cc/{code}/{name}")

    # Desde la DB
    env = load_env()
    base, key = env.get("VITE_SUPABASE_URL"), env.get("SUPABASE_SERVICE_ROLE_KEY")
    products = fetch_all_products(base, key)
    print(f"Productos en DB: {len(products)}")
    for p in products:
        for url in (p.get("images") or []):
            m = URL_RE.match(url)
            if m:
                found.setdefault(m.group(1), url)
    return found


def download(url, retries=3):
    # Codificar caracteres no-ASCII del path (ñ, á, ...) preservando / ( )
    from urllib.parse import quote, urlsplit, urlunsplit
    parts = urlsplit(url)
    safe_path = quote(parts.path, safe="/()")
    url = urlunsplit((parts.scheme, parts.netloc, safe_path, parts.query, parts.fragment))
    last = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read()
        except Exception as e:  # noqa: BLE001
            last = e
    raise last


def convert(code, url):
    out_path = OUT_DIR / f"{code}.webp"
    if out_path.exists():
        return "skip", out_path.stat().st_size
    raw = download(url)
    im = Image.open(io.BytesIO(raw)); im.load()
    has_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
    im = im.convert("RGBA" if has_alpha else "RGB")
    w, h = im.size
    scale = min(1.0, MAX_SIDE / max(w, h))
    if scale < 1.0:
        im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    im.save(out_path, "WEBP", quality=QUALITY, method=6)
    return "new", out_path.stat().st_size


def main():
    codes = collect_codes()
    print(f"Codes unicos (codigo + DB): {len(codes)}")
    new = skip = fail = 0
    failed = []
    for i, (code, url) in enumerate(sorted(codes.items()), 1):
        try:
            status, _ = convert(code, url)
            if status == "new":
                new += 1
                print(f"  [{i}/{len(codes)}] NUEVA {code}")
            else:
                skip += 1
        except Exception as e:  # noqa: BLE001
            fail += 1
            failed.append((code, url, str(e)))
            print(f"  [{i}/{len(codes)}] FALLO {code}: {e}")
    print(f"\nNuevas: {new} | Ya existentes: {skip} | Fallidas: {fail}")
    total = len(list(OUT_DIR.glob('*.webp')))
    print(f"Total webp en optimized/: {total}")
    if failed:
        print("Fallidas:")
        for code, url, err in failed:
            print(f"  {code}  {url}  ({err})")


if __name__ == "__main__":
    sys.exit(main())
