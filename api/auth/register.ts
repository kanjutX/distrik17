import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql, ensureSchema, genId } from '../_lib/db.js'
import { hashPassword, signToken, rowToUser } from '../_lib/auth.js'
import { withErrors } from '../_lib/http.js'

const USERNAME_RE = /^[A-Za-z0-9_.]{3,24}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  await ensureSchema()

  const body = req.body || {}
  const username = String(body.username ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, dan password wajib diisi' })
  }
  if (!USERNAME_RE.test(username)) {
    return res.status(400).json({ error: 'Username 3-24 karakter, hanya huruf, angka, titik, dan underscore' })
  }
  if (email.length > 128 || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Format email tidak valid' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password minimal 6 karakter' })
  }
  if (password.length > 72) {
    // bcrypt silently ignores everything after 72 bytes
    return res.status(400).json({ error: 'Password maksimal 72 karakter' })
  }

  const existing = await sql`
    SELECT id FROM users WHERE LOWER(email) = ${email} OR LOWER(username) = LOWER(${username})
  `
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Username atau email sudah dipakai' })
  }

  const id = genId('user')
  const password_hash = await hashPassword(password)
  const { rows } = await sql`
    INSERT INTO users (id, username, email, password_hash, role, gang_title)
    VALUES (${id}, ${username}, ${email}, ${password_hash}, 'member', 'Siswa Berandal Baru')
    RETURNING *
  `
  const user = rowToUser(rows[0])
  return res.status(201).json({ user, token: signToken(user.id) })
}

export default withErrors(handler)
