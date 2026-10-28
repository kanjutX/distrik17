import type { VercelRequest, VercelResponse } from '@vercel/node'

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<unknown> | unknown

/**
 * Wraps a handler so an unexpected throw (DB down, value too long for a
 * VARCHAR, unique violation race, ...) becomes a clean JSON error instead of
 * an HTML 500 page — the frontend client only knows how to read JSON errors.
 */
export function withErrors(handler: Handler): Handler {
  return async (req, res) => {
    try {
      await handler(req, res)
    } catch (err: any) {
      console.error(`[api] ${req.method} ${req.url}`, err)
      if (res.headersSent) return
      if (err?.code === '22001') return res.status(400).json({ error: 'Isi terlalu panjang' })
      if (err?.code === '23505') return res.status(409).json({ error: 'Data sudah ada' })
      return res.status(500).json({ error: 'Terjadi kesalahan di server, coba lagi sebentar lagi' })
    }
  }
}

export function isHttpUrl(v: unknown): v is string {
  if (typeof v !== 'string' || v.length > 500) return false
  try {
    const u = new URL(v)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}
