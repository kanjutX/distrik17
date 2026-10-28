import type { VercelRequest, VercelResponse } from '@vercel/node'
import register from './_lib/routes/auth-register.js'
import login from './_lib/routes/auth-login.js'
import me from './_lib/routes/auth-me.js'

// One serverless function for /api/auth/{register,login,me} (see rewrites in vercel.json).
export default function handler(req: VercelRequest, res: VercelResponse) {
  switch (String(req.query.action ?? '')) {
    case 'register': return register(req, res)
    case 'login': return login(req, res)
    case 'me': return me(req, res)
    default: return res.status(404).json({ error: 'Endpoint tidak ditemukan' })
  }
}
