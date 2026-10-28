import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql, ensureSchema, genId } from '../_lib/db.js'
import { getUserFromRequest } from '../_lib/auth.js'
import type { GachaRarity } from '../../src/lib/types'
import { withErrors } from '../_lib/http.js'

// Purely cosmetic flavor pool for the fake avatar's "archive identity" —
// not tied to anything in the actual Roblox game, just a fun client-side
// collectible while people wait for devlogs.
const POOL: { key: string; name: string; rarity: GachaRarity; weight: number }[] = [
  { key: 'jaket_lusuh', name: 'Jaket Lusuh Angkatan Lama', rarity: 'common', weight: 30 },
  { key: 'topi_session', name: 'Topi Nongkrong Session', rarity: 'common', weight: 30 },
  { key: 'stiker_receh', name: 'Stiker Geng Receh', rarity: 'common', weight: 25 },
  { key: 'kacamata_item', name: 'Kacamata Item Angkuh', rarity: 'uncommon', weight: 18 },
  { key: 'rantai_motor', name: 'Rantai Motor Gantungan', rarity: 'uncommon', weight: 16 },
  { key: 'bandana_merah', name: 'Bandana Merah Darah', rarity: 'uncommon', weight: 14 },
  { key: 'jaket_varsity', name: 'Jaket Varsity Langka', rarity: 'rare', weight: 7 },
  { key: 'tato_tongkrongan', name: 'Tato Lambang Tongkrongan', rarity: 'rare', weight: 6 },
  { key: 'sepatu_boots', name: 'Boots Baja Gelut', rarity: 'rare', weight: 5 },
  { key: 'mahkota_duri', name: 'Mahkota Duri Ketua Geng', rarity: 'epic', weight: 2.2 },
  { key: 'jas_hujan_hitam', name: 'Jas Hujan Hitam Legenda Gang', rarity: 'epic', weight: 1.8 },
  { key: 'aura_merah', name: 'Aura Merah Darah Panglima', rarity: 'legendary', weight: 0.6 },
  { key: 'mata_naga', name: 'Mata Naga Berandal Abadi', rarity: 'legendary', weight: 0.4 },
]

const EMOJI: Record<GachaRarity, string> = {
  common: '🧢',
  uncommon: '🕶️',
  rare: '🧥',
  epic: '👑',
  legendary: '🐉',
}

function rollItem() {
  const total = POOL.reduce((s, i) => s + i.weight, 0)
  let r = Math.random() * total
  for (const item of POOL) {
    r -= item.weight
    if (r <= 0) return item
  }
  return POOL[0]
}

async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema()
  const user = await getUserFromRequest(req)

  if (req.method === 'GET') {
    if (!user) return res.status(200).json({ pulls: [] })
    const { rows } = await sql`
      SELECT * FROM gacha_pulls WHERE user_id = ${user.id} ORDER BY created_at DESC LIMIT 50
    `
    return res.status(200).json({ pulls: rows })
  }

  if (req.method === 'POST') {
    const item = rollItem()
    const result = { key: item.key, name: item.name, rarity: item.rarity, emoji: EMOJI[item.rarity] }

    if (!user) {
      // Guests can still play — the roll just isn't saved anywhere.
      return res.status(200).json({ item: result, saved: false })
    }

    // Claim the cooldown slot atomically (3s). The old read-then-write version let two
    // simultaneous requests both pass the check and both get saved.
    const claim = await sql`
      UPDATE users SET last_gacha_roll_at = CURRENT_TIMESTAMP
      WHERE id = ${user.id}
        AND (last_gacha_roll_at IS NULL OR last_gacha_roll_at < CURRENT_TIMESTAMP - INTERVAL '3 seconds')
      RETURNING id
    `
    if (claim.rows.length === 0) {
      return res.status(429).json({ error: 'Pelan-pelan boss, tunggu sebentar sebelum roll lagi' })
    }

    const id = genId('gch')
    await sql`
      INSERT INTO gacha_pulls (id, user_id, item_key, item_name, rarity)
      VALUES (${id}, ${user.id}, ${item.key}, ${item.name}, ${item.rarity})
    `

    return res.status(200).json({ item: result, saved: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default withErrors(handler)
