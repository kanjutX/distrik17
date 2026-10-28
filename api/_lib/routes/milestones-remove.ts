import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql, ensureSchema } from '../db.js'
import { getUserFromRequest } from '../auth.js'
import { withErrors } from '../http.js'

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' })
  await ensureSchema()

  const user = await getUserFromRequest(req)
  if (!user || user.role !== 'owner') return res.status(403).json({ error: 'Cuma owner yang bisa hapus milestone' })

  const { rows } = await sql`DELETE FROM milestones WHERE id = ${String(req.query.id)} RETURNING id`
  if (!rows[0]) return res.status(404).json({ error: 'Milestone tidak ditemukan' })
  return res.status(200).json({ ok: true })
}

export default withErrors(handler)
