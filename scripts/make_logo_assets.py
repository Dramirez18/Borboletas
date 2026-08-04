"""
Genera los assets del logo a partir de Logo-completo.png:
  - logo-full.webp : logo completo optimizado (footer / pantalla de carga / compartir)
  - logo-icon.webp : SOLO el corazon (antenas + gafas), recortado y con fondo
                     transparente (navbar circular + favicon)

Aisla el corazon por COMPONENTE CONEXO (flood-fill desde el centro del corazon),
para no capturar los vestidos rosados de las muñecas laterales.
Salida en scripts/optimized/. Genera _preview-logo-icon.png para revisar.
"""
import numpy as np
from PIL import Image, ImageDraw
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(__file__).resolve().parent / "optimized"
OUT.mkdir(exist_ok=True)
SRC = ROOT / "Logo-completo.png"

im = Image.open(SRC).convert("RGB")
w, h = im.size
arr = np.asarray(im).astype(np.int16)
R, G, B = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]

# Mascara de "rosa fuerte" (corazon + vestidos de muñecas)
pink = (R > 190) & (G > 70) & (G < 190) & (B > 110) & (B < 205) & ((R - G) > 55) & ((R - B) > 25)
mask = (pink.astype(np.uint8)) * 255

# Semilla = punto rosa SOLIDO en la parte baja del corazon (debajo de las gafas)
seed = None
for fy in (0.80, 0.76, 0.72, 0.84, 0.68):
    for fx in (0.50, 0.48, 0.52, 0.46, 0.54):
        yy, xx = int(h * fy), int(w * fx)
        if pink[yy, xx]:
            seed = (xx, yy); break
    if seed:
        break
if seed is None:
    raise SystemExit("No se encontro semilla rosa en el corazon")
sx, sy = seed
print(f"Semilla corazon: ({sx},{sy})  es_rosa={bool(pink[sy, sx])}")

# Aislar el componente conexo del corazon a partir de la semilla
try:
    from scipy import ndimage
    # Las gafas cortan el corazon en horizontal -> cerrar el gap VERTICAL para unir
    # las mitades arriba/abajo, sin unir en horizontal a las muñecas laterales
    closed = ndimage.binary_closing(pink, structure=np.ones((61, 1)))
    closed = ndimage.binary_fill_holes(closed)
    lbl, _ = ndimage.label(closed)
    heart = lbl == lbl[sy, sx]
    print("Componente via scipy.ndimage (closing vertical)")
except Exception:
    from collections import deque
    H, W = pink.shape
    heart = np.zeros_like(pink)
    seen = np.zeros_like(pink)
    dq = deque([(sy, sx)]); seen[sy, sx] = True
    while dq:
        y, x = dq.popleft()
        heart[y, x] = True
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < H and 0 <= nx < W and not seen[ny, nx] and pink[ny, nx]:
                seen[ny, nx] = True; dq.append((ny, nx))
    print("Componente via BFS manual")
hy, hx = np.where(heart)
xmin, xmax, ymin, ymax = hx.min(), hx.max(), hy.min(), hy.max()
print(f"BBox corazon aislado: x {xmin}-{xmax}  y {ymin}-{ymax}  ({(xmax-xmin)}x{(ymax-ymin)})")

# Recorte CUADRADO centrado con margen
cx, cy = (xmin + xmax) // 2, (ymin + ymax) // 2
side = int(max(xmax - xmin, ymax - ymin) * 1.14)
half = side // 2
L, T = max(0, cx - half), max(0, cy - half)
Rr, Bb = min(w, cx + half), min(h, cy + half)
icon = im.crop((L, T, Rr, Bb)).convert("RGBA")
iw, ih = icon.size
print(f"Recorte icono: {iw}x{ih}")

# Alpha = silueta del corazon (cerrada y rellena): fondo exterior transparente y exacto
from PIL import ImageFilter
alpha_full = Image.fromarray((heart.astype(np.uint8) * 255), "L")
alpha_crop = alpha_full.crop((L, T, Rr, Bb)).filter(ImageFilter.GaussianBlur(1.1))
icon_arr = np.asarray(icon).copy()
icon_arr[:, :, 3] = np.asarray(alpha_crop)
icon = Image.fromarray(icon_arr, "RGBA")
print(f"Alpha desde silueta. Opaco: {int((np.asarray(alpha_crop) > 128).mean() * 100)}%")

# Recortar al contenido y encuadrar cuadrado
bbox = icon.getbbox()
if bbox:
    icon = icon.crop(bbox)
s = max(icon.size)
canvas = Image.new("RGBA", (s, s), (0, 0, 0, 0))
canvas.paste(icon, ((s - icon.size[0]) // 2, (s - icon.size[1]) // 2), icon)
canvas = canvas.resize((320, 320), Image.LANCZOS)
canvas.save(OUT / "logo-icon.webp", "WEBP", quality=90, method=6)
canvas.save(ROOT / "_preview-logo-icon.png", "PNG")
print(f"logo-icon.webp -> {(OUT/'logo-icon.webp').stat().st_size//1024} KB")

# Logo completo optimizado
fw = 900
full = im.resize((fw, round(h * fw / w)), Image.LANCZOS)
full.save(OUT / "logo-full.webp", "WEBP", quality=86, method=6)
print(f"logo-full.webp -> {full.size}  {(OUT/'logo-full.webp').stat().st_size//1024} KB")
