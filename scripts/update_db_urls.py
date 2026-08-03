"""
Reescribe las URLs de imagenes de la tabla Product: i.postimg.cc/CODE/nombre.ext
-> <SUPABASE>/storage/v1/object/public/productos/CODE.webp

Solo reescribe una URL si su CODE.webp ya existe en scripts/optimized/ (subido).
Idempotente. Hace un PATCH por fila que cambie.

Uso:
    python scripts/update_db_urls.py            # aplica los cambios
    python scripts/update_db_urls.py --dry      # solo muestra que cambiaria
"""
import json
import re
import sys
import urllib.request
import urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OPT_DIR = Path(__file__).resolve().parent / "optimized"
BUCKET = "productos"
URL_RE = re.compile(r"https?://i\.postimg\.cc/([A-Za-z0-9]+)/[^\"'\s\\]+", re.IGNORECASE)

DRY = "--dry" in sys.argv


def load_env():
    env = {}
    for line in (ROOT / ".env.local").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env


def main():
    env = load_env()
    base = env.get("VITE_SUPABASE_URL")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY")
    if not base or not key:
        print("ERROR: faltan credenciales en .env.local")
        return 1
    public_base = f"{base}/storage/v1/object/public/{BUCKET}"
    available = {p.stem for p in OPT_DIR.glob("*.webp")}
    print(f"Codes disponibles en Storage: {len(available)}")

    # Traer todos los productos
    products = []
    start, step = 0, 200
    while True:
        req = urllib.request.Request(
            f"{base}/rest/v1/Product?select=id,images&order=id",
            headers={"apikey": key, "Authorization": f"Bearer {key}",
                     "Range-Unit": "items", "Range": f"{start}-{start+step-1}"},
        )
        with urllib.request.urlopen(req, timeout=40) as r:
            rows = json.loads(r.read())
        products.extend(rows)
        if len(rows) < step:
            break
        start += step
    print(f"Productos: {len(products)}")

    changed = 0
    skipped_missing = set()

    def convert(url):
        m = URL_RE.match(url)
        if not m:
            return url  # no es postimg, dejar igual
        code = m.group(1)
        if code not in available:
            skipped_missing.add(code)
            return url  # no subida -> no tocar
        return f"{public_base}/{code}.webp"

    for p in products:
        imgs = p.get("images") or []
        new_imgs = [convert(u) for u in imgs]
        if new_imgs == imgs:
            continue
        changed += 1
        pid = p["id"]
        print(f"  {pid}: {imgs} -> {new_imgs}")
        if DRY:
            continue
        body = json.dumps({"images": new_imgs}).encode()
        # PATCH por id (id es TEXT)
        from urllib.parse import quote
        req = urllib.request.Request(
            f"{base}/rest/v1/Product?id=eq.{quote(str(pid))}",
            data=body, method="PATCH",
            headers={"apikey": key, "Authorization": f"Bearer {key}",
                     "Content-Type": "application/json", "Prefer": "return=minimal"},
        )
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                if r.status not in (200, 204):
                    print(f"    OJO status {r.status}")
        except urllib.error.HTTPError as e:
            print(f"    FALLO PATCH {pid} [{e.code}]: {e.read().decode('utf-8','replace')[:160]}")

    print(f"\n{'(DRY) ' if DRY else ''}Filas {'que cambiarian' if DRY else 'actualizadas'}: {changed}")
    if skipped_missing:
        print(f"Codes referenciados en DB pero NO subidos (se dejaron intactos): {sorted(skipped_missing)}")


if __name__ == "__main__":
    sys.exit(main())
