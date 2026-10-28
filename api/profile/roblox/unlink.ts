import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql, ensureSchema } from '../../_lib/db.js'
import { getUserFromRequest, rowToUser } from '../../_lib/auth.js'
import { withErrors } from '../../_lib/http.js'

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  await ensureSchema()

  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Belum login' })

  const { rows } = await sql`
    UPDATE users
    SET roblox_id = NULL, roblox_username = NULL, roblox_verified = FALSE, roblox_verify_code = NULL, roblox_verify_expires_at = NULL
    WHERE id = ${user.id}
    RETURNING *
  `
  return res.status(200).json({ user: rowToUser(rows[0]) })
}

export default withErrors(handler)
