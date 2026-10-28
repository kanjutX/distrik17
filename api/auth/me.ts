import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureSchema } from '../_lib/db.js'
import { getUserFromRequest } from '../_lib/auth.js'
import { withErrors } from '../_lib/http.js'

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  await ensureSchema()

  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Belum login' })
  return res.status(200).json({ user })
}

export default withErrors(handler)
