"""
Sube las imagenes WebP de scripts/optimized/ a un bucket publico de Supabase Storage.

Requisitos (.env.local):
    VITE_SUPABASE_URL=...
    SUPABASE_SERVICE_ROLE_KEY=...   <- necesaria para crear bucket y subir

Uso:
    python scripts/upload_to_supabase.py

Idempotente: usa upsert, se puede correr varias veces.
"""
import json
import sys
import urllib.request
import urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OPT_DIR = Path(__file__).resolve().parent / "optimized"
BUCKET = "productos"


def load_env():
    env = {}
    f = ROOT / ".env.local"
    for line in f.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip()
    return env


def api(method, path, key, data=None, ctype="application/json"):
    url = f"{BASE}{path}"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": ctype,
    }
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()


def main():
    global BASE
    env = load_env()
    url = env.get("VITE_SUPABASE_URL")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("ERROR: falta VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local")
        return 1
    BASE = f"{url}/storage/v1"

    # 1) Crear bucket publico (si ya existe, seguimos)
    status, body = api(
        "POST", "/bucket", key,
        data=json.dumps({"id": BUCKET, "name": BUCKET, "public": True}).encode(),
    )
    txt = body.decode("utf-8", "replace")
    if status in (200, 201):
        print(f"Bucket '{BUCKET}' creado (publico).")
    elif "already exists" in txt.lower() or status == 409:
        print(f"Bucket '{BUCKET}' ya existia. Asegurando que sea publico...")
        api("PUT", f"/bucket/{BUCKET}", key,
            data=json.dumps({"public": True}).encode())
    else:
        print(f"ERROR creando bucket [{status}]: {txt}")
        return 1

    # 2) Subir cada webp con upsert
    files = sorted(OPT_DIR.glob("*.webp"))
    print(f"Subiendo {len(files)} archivos...")
    ok = 0
    for i, fp in enumerate(files, 1):
        blob = fp.read_bytes()
        headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "image/webp",
            "x-upsert": "true",
            "cache-control": "public, max-age=31536000, immutable",
        }
        req = urllib.request.Request(
            f"{BASE}/object/{BUCKET}/{fp.name}", data=blob, headers=headers, method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                if r.status in (200, 201):
                    ok += 1
                    if i % 10 == 0 or i == len(files):
                        print(f"  {i}/{len(files)}")
        except urllib.error.HTTPError as e:
            print(f"  FALLO {fp.name} [{e.code}]: {e.read().decode('utf-8','replace')[:160]}")

    print(f"\nSubidas OK: {ok}/{len(files)}")
    sample = files[0].name if files else "<none>"
    print(f"URL publica de ejemplo:\n  {url}/storage/v1/object/public/{BUCKET}/{sample}")
    return 0 if ok == len(files) else 1


if __name__ == "__main__":
    sys.exit(main())
