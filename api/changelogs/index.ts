import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql, ensureSchema, genId } from '../_lib/db.js'
import { getUserFromRequest } from '../_lib/auth.js'
import { isHttpUrl, withErrors } from '../_lib/http.js'

const TAGS = ['major', 'minor', 'hotfix']
const CHANGE_TYPES = ['add', 'fix', 'change', 'remove']

async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema()

  if (req.method === 'GET') {
    const { rows } = await sql`SELECT * FROM changelogs ORDER BY created_at DESC LIMIT 50`
    return res.status(200).json({ changelogs: rows })
  }

  if (req.method === 'POST') {
    const user = await getUserFromRequest(req)
    if (!user || user.role !== 'owner') return res.status(403).json({ error: 'Cuma owner yang bisa post devlog' })

    const { version, title, author, tag, summary, changes, banner_url, pinned } = req.body || {}
    if (!version || !title || !summary) return res.status(400).json({ error: 'Versi, judul, dan ringkasan wajib diisi' })
    if (tag && !TAGS.includes(tag)) return res.status(400).json({ error: 'Tag tidak valid' })
    if (banner_url && !isHttpUrl(banner_url)) return res.status(400).json({ error: 'Banner harus berupa link http(s)' })

    const list = changes ?? []
    if (!Array.isArray(list) || list.some((c) => !c || !CHANGE_TYPES.includes(c.type) || typeof c.text !== 'string')) {
      return res.status(400).json({ error: 'Format daftar perubahan tidak valid' })
    }

    const id = genId('log')
    const { rows } = await sql`
      INSERT INTO changelogs (id, version, title, author, tag, summary, changes, banner_url, pinned)
      VALUES (${id}, ${version}, ${title}, ${author || user.username}, ${tag || 'minor'}, ${summary},
        ${JSON.stringify(list)}::jsonb, ${banner_url || null}, ${!!pinned})
      RETURNING *
    `
    return res.status(201).json({ changelog: rows[0] })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default withErrors(handler)
