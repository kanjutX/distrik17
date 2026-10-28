import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql, ensureSchema } from '../db.js'
import { getUserFromRequest } from '../auth.js'
import { withErrors } from '../http.js'

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  await ensureSchema()

  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Harus login dulu buat like' })

  const id = String(req.query.id)
  const { rows: found } = await sql`SELECT likes FROM reviews WHERE id = ${id}`
  if (!found[0]) return res.status(404).json({ error: 'Review tidak ditemukan' })

  // ON CONFLICT makes a double-click / two tabs race a no-op instead of a PK-violation 500.
  const inserted = await sql`
    INSERT INTO review_likes (review_id, user_id) VALUES (${id}, ${user.id})
    ON CONFLICT DO NOTHING RETURNING review_id
  `
  if (inserted.rows.length === 0) return res.status(200).json({ likes: found[0].likes ?? 0 })

  const { rows } = await sql`UPDATE reviews SET likes = COALESCE(likes, 0) + 1 WHERE id = ${id} RETURNING likes`
  return res.status(200).json({ likes: rows[0].likes })
}

export default withErrors(handler)
