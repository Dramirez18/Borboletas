import type { SupabaseClient } from '@supabase/supabase-js';

/** Bucket público de Supabase Storage donde viven las fotos de los productos. */
const BUCKET = 'productos';
/** Lado mayor de la foto ya reducida, en píxeles. */
const MAX_SIDE = 1400;
/** Peso objetivo tras comprimir. Si se pasa, se baja la calidad de a poco. */
const TARGET_BYTES = 450 * 1024;
/** Foto original más pesada que se acepta. Las de celular rara vez pasan de 15 MB. */
const MAX_INPUT_BYTES = 30 * 1024 * 1024;

/** Error con un mensaje ya listo para mostrarle a quien administra la tienda. */
export class PhotoError extends Error {}

export interface PreparedPhoto {
  blob: Blob;
  contentType: 'image/webp' | 'image/jpeg';
  ext: 'webp' | 'jpg';
  width: number;
  height: number;
}

interface DecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
}

const isHeic = (file: File) => /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);

async function decode(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      // 'from-image' aplica la orientación EXIF: las fotos verticales no salen acostadas.
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch {
      // Navegador antiguo o formato que createImageBitmap no abre: se intenta con <img>.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => {} };
  } catch {
    throw new PhotoError(
      isHeic(file)
        ? 'Esta foto está en formato HEIC y el navegador no puede abrirla. Elige otra o cámbiala a JPG.'
        : 'No se pudo abrir la foto. Prueba con otra o tómala de nuevo.',
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

/**
 * Reduce la foto a un tamaño razonable para la tienda y la convierte a WebP
 * (o a JPEG si el navegador no sabe generar WebP). No amplía fotos pequeñas.
 */
export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  const looksLikeImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|hei[cf])$/i.test(file.name);
  if (!looksLikeImage) throw new PhotoError('El archivo elegido no es una foto.');
  if (file.size > MAX_INPUT_BYTES) throw new PhotoError('La foto pesa demasiado. Elige otra más liviana.');

  const img = await decode(file);
  try {
    if (!img.width || !img.height) throw new PhotoError('No se pudo abrir la foto. Prueba con otra.');
    const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new PhotoError('Este navegador no puede preparar la foto.');
    // Fondo blanco: evita zonas negras si la imagen trae transparencia y se exporta a JPEG.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img.source, 0, 0, width, height);

    let contentType: PreparedPhoto['contentType'] = 'image/webp';
    let quality = 0.82;
    let blob = await toBlob(canvas, contentType, quality);
    if (!blob || blob.type !== 'image/webp') {
      // Safari antiguo ignora WebP y devuelve PNG: se usa JPEG, que todos soportan.
      contentType = 'image/jpeg';
      blob = await toBlob(canvas, contentType, quality);
    }
    if (!blob) throw new PhotoError('No se pudo preparar la foto. Prueba con otra.');
    while (blob.size > TARGET_BYTES && quality > 0.5) {
      quality = Math.round((quality - 0.08) * 100) / 100;
      const smaller = await toBlob(canvas, contentType, quality);
      if (!smaller) break;
      blob = smaller;
    }
    return { blob, contentType, ext: contentType === 'image/webp' ? 'webp' : 'jpg', width, height };
  } finally {
    img.release();
  }
}

function randomName(length = 10): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

/** Traduce el error de Storage a un mensaje claro en español. */
export function explainUploadError(error: unknown): string {
  const e = error as { message?: string; statusCode?: string | number; status?: number } | null;
  const msg = (e?.message ?? '').toLowerCase();
  const code = Number(e?.statusCode ?? e?.status ?? 0);
  if (code === 401 || code === 403 || /row-level security|unauthori[sz]ed|not authori[sz]ed|jwt/.test(msg)) {
    return 'No tienes permiso para subir fotos. Cierra sesión y vuelve a entrar como administrador.';
  }
  if (code === 413 || /exceeded|too large|maximum allowed size|payload/.test(msg)) {
    return 'La foto pesa demasiado para subirla. Prueba con otra.';
  }
  if (/mime|not supported|not allowed|invalid.*type/.test(msg)) {
    return 'El formato de la foto no es válido.';
  }
  if (/fetch|network|timeout|offline/.test(msg)) {
    return 'No se pudo subir por la conexión. Revisa tu internet e inténtalo de nuevo.';
  }
  return 'No se pudo subir la foto. Inténtalo de nuevo.';
}

/**
 * Prepara la foto, la sube al bucket público de productos con un nombre único
 * y devuelve su URL pública. Solo funciona con una sesión de administrador.
 */
export async function uploadProductPhoto(client: SupabaseClient, file: File): Promise<string> {
  const photo = await preparePhoto(file);
  const path = `${randomName()}.${photo.ext}`;
  const { error } = await client.storage.from(BUCKET).upload(path, photo.blob, {
    contentType: photo.contentType,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw new PhotoError(explainUploadError(error), { cause: error });
  return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
