import type { VercelRequest, VercelResponse } from '@vercel/node'
import list from './_lib/routes/announcements-list.js'
import item from './_lib/routes/announcements-item.js'

// /api/announcements and /api/announcements/:id in one function.
export default function handler(req: VercelRequest, res: VercelResponse) {
  return req.query.id ? item(req, res) : list(req, res)
}
