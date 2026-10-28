import type { VercelRequest, VercelResponse } from '@vercel/node'
import list from './_lib/routes/reviews-list.js'
import remove from './_lib/routes/reviews-remove.js'
import like from './_lib/routes/reviews-like.js'

// /api/reviews, /api/reviews/:id, /api/reviews/:id/like in one function.
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!req.query.id) return list(req, res)
  if (req.query.action === 'like') return like(req, res)
  return remove(req, res)
}
