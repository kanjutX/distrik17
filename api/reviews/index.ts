import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql, ensureSchema, genId } from '../_lib/db.js'
import { getUserFromRequest } from '../_lib/auth.js'
import { withErrors } from '../_lib/http.js'

const CATEGORIES = ['Gameplay', 'Map & Lokasi', 'Combat', 'Voice Acting', 'Bug Report', 'Saran Fitur']

async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema()

  if (req.method === 'GET') {
    const user = await getUserFromRequest(req)
    // Avatars uploaded from the profile modal are base64 data URLs (up to ~350KB each).
    // Inlining them into every review blew the response past Vercel's 4.5MB limit once a
    // few reviews piled up, so uploaded avatars are served from /api/users/:id/avatar
    // instead, and title/avatar are read from the user's *current* profile.
    const { rows } = await sql`
      SELECT r.id, r.user_id, r.username, r.rating, r.category, r.content, r.likes, r.created_at,
        COALESCE(u.gang_title, r.gang_title) AS gang_title,
        CASE
          WHEN u.id IS NULL THEN CASE WHEN r.avatar_url LIKE 'data:%' THEN NULL ELSE r.avatar_url END
          WHEN u.avatar_url LIKE 'data:%' THEN '/api/users/' || u.id || '/avatar?v=' || substr(md5(u.avatar_url), 1, 8)
          ELSE u.avatar_url
        END AS avatar_url
      FROM reviews r
      LEFT JOIN users u ON u.id = r.user_id
      ORDER BY r.created_at DESC
      LIMIT 100
    `
    let likedIds = new Set<string>()
    if (user) {
      const liked = await sql`SELECT review_id FROM review_likes WHERE user_id = ${user.id}`
      likedIds = new Set(liked.rows.map((r) => r.review_id))
    }
    const reviews = rows.map((r) => ({ ...r, liked_by_me: likedIds.has(r.id) }))
    return res.status(200).json({ reviews })
  }

  if (req.method === 'POST') {
    const user = await getUserFromRequest(req)
    if (!user) return res.status(401).json({ error: 'Harus login dulu buat review' })

    const rating = Number(req.body?.rating)
    const category = String(req.body?.category ?? '')
    const content = String(req.body?.content ?? '').trim()

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating 1-5' })
    if (!CATEGORIES.includes(category)) return res.status(400).json({ error: 'Kategori tidak valid' })
    if (content.length < 5) return res.status(400).json({ error: 'Isi review minimal 5 karakter' })
    if (content.length > 2000) return res.status(400).json({ error: 'Isi review maksimal 2000 karakter' })

    const id = genId('rev')
    const avatar = user.avatar_url?.startsWith('data:') ? null : user.avatar_url
    const { rows } = await sql`
      INSERT INTO reviews (id, user_id, username, gang_title, avatar_url, rating, category, content)
      VALUES (${id}, ${user.id}, ${user.username}, ${user.gang_title}, ${avatar}, ${rating}, ${category}, ${content})
      RETURNING id, user_id, username, gang_title, avatar_url, rating, category, content, likes, created_at
    `
    return res.status(201).json({ review: { ...rows[0], liked_by_me: false } })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default withErrors(handler)
