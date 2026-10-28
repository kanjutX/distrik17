import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureSchema, getSettings, setSetting } from '../_lib/db.js'
import { getUserFromRequest } from '../_lib/auth.js'
import { isHttpUrl, withErrors } from '../_lib/http.js'

const KEYS = ['release_phase', 'release_date', 'donate_link']

async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema()

  if (req.method === 'GET') {
    const settings = await getSettings(KEYS)
    return res.status(200).json({ settings })
  }

  if (req.method === 'PUT') {
    const user = await getUserFromRequest(req)
    if (!user || user.role !== 'owner') return res.status(403).json({ error: 'Cuma owner yang bisa ubah settings' })

    const body = req.body || {}
    const updates: Record<string, string | null> = {}
    for (const key of KEYS) {
      if (!(key in body)) continue
      const raw = body[key]
      updates[key] = raw === null || raw === undefined || raw === '' ? null : String(raw).trim()
    }

    // Validate before writing anything so a bad field doesn't leave a half-saved update.
    // donate_link ends up as an <a href>, so only real http(s) links are allowed (no javascript:).
    if (updates.donate_link && !isHttpUrl(updates.donate_link)) {
      return res.status(400).json({ error: 'Link donasi harus diawali http:// atau https://' })
    }
    if (updates.release_date && Number.isNaN(new Date(updates.release_date).getTime())) {
      return res.status(400).json({ error: 'Format tanggal rilis tidak valid' })
    }
    if (updates.release_phase && updates.release_phase.length > 64) {
      return res.status(400).json({ error: 'Fase rilis maksimal 64 karakter' })
    }

    for (const [key, value] of Object.entries(updates)) await setSetting(key, value)
    const settings = await getSettings(KEYS)
    return res.status(200).json({ settings })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default withErrors(handler)
