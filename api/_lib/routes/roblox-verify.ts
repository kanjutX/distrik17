import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql, ensureSchema } from '../db.js'
import { getUserFromRequest, rowToUser } from '../auth.js'
import { withErrors } from '../http.js'

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  await ensureSchema()

  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Belum login' })

  const roblox_username = String(req.body?.roblox_username ?? '').trim()
  if (!roblox_username || roblox_username.length > 40) {
    return res.status(400).json({ error: 'Username Roblox wajib diisi' })
  }

  const { rows: meRows } = await sql`
    SELECT roblox_verify_code, (roblox_verify_expires_at IS NULL OR roblox_verify_expires_at > CURRENT_TIMESTAMP) AS still_valid
    FROM users WHERE id = ${user.id}
  `
  const pendingCode = meRows[0]?.roblox_verify_code
  if (!pendingCode) {
    return res.status(400).json({ error: 'Belum ada kode verifikasi aktif — klik "Generate Kode" dulu' })
  }
  if (!meRows[0].still_valid) {
    return res.status(400).json({ error: 'Kode sudah kedaluwarsa (15 menit) — generate kode baru dulu' })
  }

  // Roblox's public user-lookup API — no auth, no app registration, so
  // nothing here ever touches the person's Roblox password. Ownership is
  // proven purely by them being able to edit their own public bio.
  let lookup: { id: number; name: string } | null = null
  try {
    const lookupRes = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [roblox_username], excludeBannedUsers: true }),
      signal: AbortSignal.timeout(8000),
    })
    // A 429/5xx from Roblox used to fall through as "username tidak ditemukan".
    if (!lookupRes.ok) throw new Error(`roblox lookup ${lookupRes.status}`)
    const lookupJson: any = await lookupRes.json()
    const match = lookupJson?.data?.[0]
    if (match) lookup = { id: match.id, name: match.name }
  } catch {
    return res.status(502).json({ error: 'Gagal menghubungi Roblox, coba lagi sebentar lagi' })
  }

  if (!lookup) return res.status(404).json({ error: 'Username Roblox tidak ditemukan' })

  const { rows: dupeRows } = await sql`
    SELECT id FROM users WHERE roblox_id = ${String(lookup.id)} AND id != ${user.id}
  `
  if (dupeRows[0]) return res.status(409).json({ error: 'Akun Roblox ini sudah dikaitkan ke akun lain' })

  let description = ''
  try {
    const profileRes = await fetch(`https://users.roblox.com/v1/users/${lookup.id}`, { signal: AbortSignal.timeout(8000) })
    if (!profileRes.ok) throw new Error(`roblox profile ${profileRes.status}`)
    const profileJson: any = await profileRes.json()
    description = String(profileJson?.description || '')
  } catch {
    return res.status(502).json({ error: 'Gagal membaca profil Roblox, coba lagi sebentar lagi' })
  }

  if (!description.includes(pendingCode)) {
    return res.status(400).json({ error: 'Kode belum ketemu di bio Roblox kamu — pastikan sudah disimpan di sana' })
  }

  const { rows } = await sql`
    UPDATE users
    SET roblox_id = ${String(lookup.id)}, roblox_username = ${lookup.name},
        roblox_verified = TRUE, roblox_verify_code = NULL, roblox_verify_expires_at = NULL
    WHERE id = ${user.id}
    RETURNING *
  `
  return res.status(200).json({ user: rowToUser(rows[0]) })
}

export default withErrors(handler)
