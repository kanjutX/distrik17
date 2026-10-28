import type { VercelRequest, VercelResponse } from '@vercel/node'
import update from './_lib/routes/profile-update.js'
import requestCode from './_lib/routes/roblox-request-code.js'
import verify from './_lib/routes/roblox-verify.js'
import unlink from './_lib/routes/roblox-unlink.js'

// /api/profile and /api/profile/roblox/{request-code,verify,unlink} in one function.
export default function handler(req: VercelRequest, res: VercelResponse) {
  switch (String(req.query.sub ?? '')) {
    case '': return update(req, res)
    case 'request-code': return requestCode(req, res)
    case 'verify': return verify(req, res)
    case 'unlink': return unlink(req, res)
    default: return res.status(404).json({ error: 'Endpoint tidak ditemukan' })
  }
}
