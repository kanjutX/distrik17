import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql, ensureSchema, genId } from '../_lib/db.js'
import { getUserFromRequest } from '../_lib/auth.js'
import { withErrors } from '../_lib/http.js'

function normalize(row: any) {
  // BIGINT comes back from pg as a string; the frontend type says number.
  return { ...row, amount: Number(row.amount) }
}

async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema()

  if (req.method === 'GET') {
    const { rows } = await sql`SELECT * FROM supporters ORDER BY amount DESC, created_at DESC LIMIT 200`
    const { rows: totalRows } = await sql`SELECT COALESCE(SUM(amount), 0) AS total FROM supporters`
    return res.status(200).json({ supporters: rows.map(normalize), total: Number(totalRows[0].total) })
  }

  if (req.method === 'POST') {
    // Donations are logged manually (no payment gateway yet) — anyone being able to POST
    // here meant anyone could fake entries on the public leaderboard.
    const user = await getUserFromRequest(req)
    if (!user || user.role !== 'owner') return res.status(403).json({ error: 'Cuma owner yang bisa mencatat supporter' })

    const { name, tier_name, message, roblox_user } = req.body || {}
    const amount = Number(req.body?.amount)
    if (!name || !tier_name || !Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Nama, tier, dan jumlah donasi (bilangan bulat) wajib diisi' })
    }

    const id = genId('sup')
    const { rows } = await sql`
      INSERT INTO supporters (id, name, tier_name, amount, message, roblox_user)
      VALUES (${id}, ${String(name).trim()}, ${String(tier_name).trim()}, ${amount}, ${message || null}, ${roblox_user || null})
      RETURNING *
    `
    return res.status(201).json({ supporter: normalize(rows[0]) })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default withErrors(handler)
