import type { VercelRequest, VercelResponse } from '@vercel/node'
import avatar from './_lib/routes/users-avatar.js'

// /api/users/:id/avatar
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.query.action === 'avatar' && req.query.id) return avatar(req, res)
  return res.status(404).json({ error: 'Endpoint tidak ditemukan' })
}
