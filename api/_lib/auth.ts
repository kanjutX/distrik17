import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { VercelRequest } from '@vercel/node'
import { sql } from './db.js'
import type { User } from '../../src/lib/types'

// No silent fallback in production: a guessable default secret would let anyone forge an owner token.
const JWT_SECRET =
  process.env.JWT_SECRET || (process.env.VERCEL_ENV === 'production' ? '' : 'distrik17-dev-secret-change-me')

export function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10)
}
export function comparePassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash)
}

export function signToken(userId: string) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET belum diset di environment variables')
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '30d' })
}

export function verifyToken(token: string): { sub: string } | null {
  if (!JWT_SECRET) return null
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string }
  } catch {
    return null
  }
}

function rowToUser(row: any): User {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    gang_title: row.gang_title,
    avatar_url: row.avatar_url,
    created_at: row.created_at,
    kills: row.kills ?? 0,
    deaths: row.deaths ?? 0,
    roblox_username: row.roblox_username ?? null,
    roblox_verified: !!row.roblox_verified,
  }
}

export async function getUserFromRequest(req: VercelRequest): Promise<User | null> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  const payload = verifyToken(header.slice(7))
  if (!payload) return null
  const { rows } = await sql`SELECT * FROM users WHERE id = ${payload.sub}`
  if (!rows[0]) return null
  return rowToUser(rows[0])
}

export { rowToUser }
