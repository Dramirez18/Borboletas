// Función de Vercel que mantiene activo el proyecto gratuito de Supabase.
// La llama el cron diario definido en vercel.json. Solo lee una fila de SiteStats, que es
// de lectura pública, y devuelve el código de respuesta de Supabase sin exponer claves.
//
// Opcional: si en Vercel existe la variable CRON_SECRET, solo se acepta la llamada que
// Vercel envía con "Authorization: Bearer <CRON_SECRET>".
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return res.status(500).json({ ok: false, error: 'faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY' });
  }

  try {
    const r = await fetch(`${url}/rest/v1/SiteStats?select=id&limit=1`, {
      headers: { apikey: key },
      signal: AbortSignal.timeout(10000),
    });
    return res.status(r.ok ? 200 : 502).json({ ok: r.ok, supabase: r.status });
  } catch {
    return res.status(502).json({ ok: false, error: 'sin respuesta de Supabase' });
  }
}
