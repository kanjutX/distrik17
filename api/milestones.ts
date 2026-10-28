import type { VercelRequest, VercelResponse } from '@vercel/node'
import list from './_lib/routes/milestones-list.js'
import remove from './_lib/routes/milestones-remove.js'

// /api/milestones and /api/milestones/:id in one function.
export default function handler(req: VercelRequest, res: VercelResponse) {
  return req.query.id ? remove(req, res) : list(req, res)
}
