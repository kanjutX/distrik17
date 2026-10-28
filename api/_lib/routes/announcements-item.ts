import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql, ensureSchema } from '../db.js'
import { getUserFromRequest } from '../auth.js'
import { withErrors } from '../http.js'

async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema()

  const user = await getUserFromRequest(req)
  if (!user || user.role !== 'owner') return res.status(403).json({ error: 'Cuma owner yang bisa ubah pengumuman' })

  const id = req.query.id as string

  if (req.method === 'PATCH') {
    const { title, body, level, pinned } = req.body || {}
    if (level && !['info', 'warning', 'event'].includes(level)) {
      return res.status(400).json({ error: 'Level tidak valid' })
    }
    const { rows: existingRows } = await sql`SELECT * FROM announcements WHERE id = ${id}`
    const existing = existingRows[0]
    if (!existing) return res.status(404).json({ error: 'Pengumuman tidak ditemukan' })

    const { rows } = await sql`
      UPDATE announcements
      SET title = ${title ?? existing.title},
          body = ${body ?? existing.body},
          level = ${level ?? existing.level},
          pinned = ${pinned ?? existing.pinned}
      WHERE id = ${id}
      RETURNING *
    `
    return res.status(200).json({ announcement: rows[0] })
  }

  if (req.method === 'DELETE') {
    const { rows } = await sql`DELETE FROM announcements WHERE id = ${id} RETURNING id`
    if (!rows[0]) return res.status(404).json({ error: 'Pengumuman tidak ditemukan' })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default withErrors(handler)
