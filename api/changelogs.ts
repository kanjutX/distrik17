import type { VercelRequest, VercelResponse } from '@vercel/node'
import list from './_lib/routes/changelogs-list.js'
import remove from './_lib/routes/changelogs-remove.js'

// /api/changelogs and /api/changelogs/:id in one function.
export default function handler(req: VercelRequest, res: VercelResponse) {
  return req.query.id ? remove(req, res) : list(req, res)
}
