import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql, ensureSchema } from '../../_lib/db.js'
import { withErrors } from '../../_lib/http.js'

// Serves an uploaded (base64) avatar as a real image so lists don't have to inline it.
async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  await ensureSchema()

  const { rows } = await sql`SELECT avatar_url FROM users WHERE id = ${String(req.query.id)}`
  const m = /^data:(image\/(?:png|jpeg|jpg|webp));base64,([\s\S]+)$/.exec(rows[0]?.avatar_url ?? '')
  if (!m) return res.status(404).json({ error: 'Avatar tidak ditemukan' })

  res.setHeader('Content-Type', m[1])
  res.setHeader('X-Content-Type-Options', 'nosniff')
  // The URL carries a content hash (?v=...), so it is safe to cache hard.
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400')
  return res.status(200).send(Buffer.from(m[2], 'base64'))
}

export default withErrors(handler)
