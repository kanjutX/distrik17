import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql, ensureSchema, genId } from '../db.js'
import { getUserFromRequest } from '../auth.js'
import { withErrors } from '../http.js'

const STATUSES = ['dalam_pengerjaan', 'selesai', 'direncanakan', 'tertunda']

async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema()

  if (req.method === 'GET') {
    const { rows } = await sql`SELECT * FROM milestones ORDER BY category, progress DESC`
    return res.status(200).json({ milestones: rows })
  }

  if (req.method === 'POST') {
    const user = await getUserFromRequest(req)
    if (!user || user.role !== 'owner') return res.status(403).json({ error: 'Cuma owner yang bisa update milestone' })

    const { id, title, description, status, target_date, category } = req.body || {}
    if (!title || !category) return res.status(400).json({ error: 'Judul dan kategori wajib diisi' })

    const progress = Math.round(Number(req.body?.progress ?? 0))
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      return res.status(400).json({ error: 'Progress harus 0-100' })
    }
    const st = status || 'dalam_pengerjaan'
    if (!STATUSES.includes(st)) return res.status(400).json({ error: 'Status tidak valid' })

    if (id) {
      const { rows } = await sql`
        UPDATE milestones
        SET title = ${title}, description = ${description || null}, progress = ${progress},
            status = ${st}, target_date = ${target_date || null}, category = ${category}
        WHERE id = ${id}
        RETURNING *
      `
      if (!rows[0]) return res.status(404).json({ error: 'Milestone tidak ditemukan' })
      return res.status(200).json({ milestone: rows[0] })
    }

    const newId = genId('ms')
    const { rows } = await sql`
      INSERT INTO milestones (id, title, description, progress, status, target_date, category)
      VALUES (${newId}, ${title}, ${description || null}, ${progress}, ${st}, ${target_date || null}, ${category})
      RETURNING *
    `
    return res.status(201).json({ milestone: rows[0] })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default withErrors(handler)
