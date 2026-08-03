"""
Reescribe en el codigo fuente la base IMG y las URLs de imagenes:
  const IMG = 'https://i.postimg.cc'  ->  const IMG = '<SUPABASE>/storage/v1/object/public/productos'
  `${IMG}/CODE/nombre.ext`            ->  `${IMG}/CODE.webp`

Aplica a src/constants.ts y src/components/HeroCarousel.tsx.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NEW_BASE = "https://ythsgjjawqzvhewenqex.supabase.co/storage/v1/object/public/productos"
FILES = [ROOT / "src" / "constants.ts", ROOT / "src" / "components" / "HeroCarousel.tsx"]

IMG_DECL = re.compile(r"const IMG = ['\"]https?://i\.postimg\.cc['\"];")
IMG_URL = re.compile(r"\$\{IMG\}/([A-Za-z0-9]+)/[^/`'\"]+?\.(?:png|jpe?g|webp)", re.IGNORECASE)

for f in FILES:
    text = f.read_text(encoding="utf-8")
    n_decl = len(IMG_DECL.findall(text))
    text = IMG_DECL.sub(f"const IMG = '{NEW_BASE}';", text)
    n_url = len(IMG_URL.findall(text))
    text = IMG_URL.sub(r"${IMG}/\1.webp", text)
    f.write_text(text, encoding="utf-8")
    print(f"{f.name}: base reescrita x{n_decl}, URLs reescritas x{n_url}")

print("Listo.")
