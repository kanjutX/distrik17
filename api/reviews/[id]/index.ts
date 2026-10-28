import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql, ensureSchema } from '../../_lib/db.js'
import { getUserFromRequest } from '../../_lib/auth.js'
import { withErrors } from '../../_lib/http.js'

// DELETE /api/reviews/:id — the review's author or the owner (moderation).
async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' })
  await ensureSchema()

  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Belum login' })

  const id = String(req.query.id)
  const { rows } = await sql`SELECT user_id FROM reviews WHERE id = ${id}`
  if (!rows[0]) return res.status(404).json({ error: 'Review tidak ditemukan' })
  if (user.role !== 'owner' && rows[0].user_id !== user.id) {
    return res.status(403).json({ error: 'Cuma owner atau penulis review yang bisa menghapus' })
  }

  await sql`DELETE FROM reviews WHERE id = ${id}`
  return res.status(200).json({ ok: true })
}

export default withErrors(handler)
