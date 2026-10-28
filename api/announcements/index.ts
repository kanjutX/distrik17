import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql, ensureSchema, genId } from '../_lib/db.js'
import { getUserFromRequest } from '../_lib/auth.js'
import { withErrors } from '../_lib/http.js'

async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema()

  if (req.method === 'GET') {
    const { rows } = await sql`
      SELECT * FROM announcements ORDER BY pinned DESC, created_at DESC LIMIT 50
    `
    return res.status(200).json({ announcements: rows })
  }

  if (req.method === 'POST') {
    const user = await getUserFromRequest(req)
    if (!user || user.role !== 'owner') return res.status(403).json({ error: 'Cuma owner yang bisa post pengumuman' })

    const { title, body, level, pinned } = req.body || {}
    if (!title || !body) return res.status(400).json({ error: 'Judul dan isi pengumuman wajib diisi' })
    if (level && !['info', 'warning', 'event'].includes(level)) {
      return res.status(400).json({ error: 'Level tidak valid' })
    }

    const id = genId('ann')
    const { rows } = await sql`
      INSERT INTO announcements (id, title, body, level, pinned)
      VALUES (${id}, ${title}, ${body}, ${level || 'info'}, ${!!pinned})
      RETURNING *
    `
    return res.status(201).json({ announcement: rows[0] })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default withErrors(handler)
