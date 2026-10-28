import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql, ensureSchema } from '../_lib/db.js'
import { comparePassword, signToken, rowToUser } from '../_lib/auth.js'
import { withErrors } from '../_lib/http.js'

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  await ensureSchema()

  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')
  if (!email || !password) return res.status(400).json({ error: 'Email dan password wajib diisi' })

  const { rows } = await sql`SELECT * FROM users WHERE LOWER(email) = ${email}`
  const row = rows[0]
  if (!row || !(await comparePassword(password, row.password_hash))) {
    return res.status(401).json({ error: 'Email atau password salah' })
  }

  const user = rowToUser(row)
  return res.status(200).json({ user, token: signToken(user.id) })
}

export default withErrors(handler)
