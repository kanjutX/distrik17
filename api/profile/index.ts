import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql, ensureSchema } from '../_lib/db.js'
import { getUserFromRequest, rowToUser } from '../_lib/auth.js'
import { withErrors } from '../_lib/http.js'

const MAX_AVATAR_BYTES = 350_000 // ~350KB — uploads are resized/compressed client-side before this is hit

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' })
  await ensureSchema()

  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Belum login' })

  const { gang_title, avatar_url } = req.body || {}

  if (gang_title !== undefined && (typeof gang_title !== 'string' || !gang_title.trim() || gang_title.length > 128)) {
    return res.status(400).json({ error: 'Title tidak valid (wajib diisi, maks 128 karakter)' })
  }
  if (avatar_url !== undefined && avatar_url !== null) {
    if (typeof avatar_url !== 'string') return res.status(400).json({ error: 'Avatar tidak valid' })
    const isDataUrl = avatar_url.startsWith('data:image/')
    const isHttpUrl = avatar_url.startsWith('https://') || avatar_url.startsWith('http://')
    if (!isDataUrl && !isHttpUrl) return res.status(400).json({ error: 'Avatar harus berupa gambar upload atau link preset' })
    if (isDataUrl && avatar_url.length > MAX_AVATAR_BYTES) {
      return res.status(400).json({ error: 'Ukuran foto profil kegedean, coba gambar yang lebih kecil' })
    }
    if (isDataUrl && !/^data:image\/(png|jpeg|jpg|webp);base64,/.test(avatar_url)) {
      return res.status(400).json({ error: 'Format gambar harus PNG atau JPG' })
    }
  }

  const { rows } = await sql`
    UPDATE users
    SET gang_title = COALESCE(${typeof gang_title === 'string' ? gang_title.trim() : null}, gang_title),
        avatar_url = ${avatar_url === undefined ? user.avatar_url : avatar_url}
    WHERE id = ${user.id}
    RETURNING *
  `
  return res.status(200).json({ user: rowToUser(rows[0]) })
}

export default withErrors(handler)
