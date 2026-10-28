import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'
import { sql, ensureSchema } from '../db.js'
import { getUserFromRequest } from '../auth.js'
import { withErrors } from '../http.js'

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  await ensureSchema()

  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Belum login' })

  // Short, readable, hard to collide by accident — pasted into a public bio
  // for a few minutes, so it doesn't need to be cryptographically secret,
  // just unique enough that nobody else's bio already contains it.
  const code = `D17-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

  await sql`
    UPDATE users
    SET roblox_verify_code = ${code}, roblox_verify_expires_at = CURRENT_TIMESTAMP + INTERVAL '15 minutes'
    WHERE id = ${user.id}
  `

  return res.status(200).json({
    code,
    instructions:
      'Kode berlaku 15 menit. Tempel kode ini di bagian "About/Description" profil Roblox kamu, lalu klik Verifikasi. Setelah berhasil, kodenya boleh dihapus lagi dari bio.',
  })
}

export default withErrors(handler)
