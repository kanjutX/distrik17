export type Role = 'member' | 'owner'

export interface User {
  id: string
  username: string
  email: string
  role: Role
  gang_title: string
  avatar_url: string | null
  created_at: string
  kills: number
  deaths: number
  roblox_username: string | null
  roblox_verified: boolean
}

export interface Announcement {
  id: string
  title: string
  body: string
  level: 'info' | 'warning' | 'event'
  pinned: boolean
  created_at: string
}

export interface SiteSettings {
  release_phase: string | null
  release_date: string | null
  donate_link: string | null
}

export type GachaRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface GachaItem {
  key: string
  name: string
  rarity: GachaRarity
  emoji: string
}

export interface GachaPull {
  id: string
  item_key: string
  item_name: string
  rarity: GachaRarity
  created_at: string
}

export interface Review {
  id: string
  user_id: string | null
  username: string
  gang_title: string | null
  avatar_url: string | null
  rating: number
  category: string
  content: string
  likes: number
  created_at: string
  liked_by_me?: boolean
}

export interface ChangeEntry {
  type: 'add' | 'fix' | 'change' | 'remove'
  text: string
}

export interface Changelog {
  id: string
  version: string
  title: string
  author: string
  tag: string
  summary: string
  changes: ChangeEntry[]
  banner_url: string | null
  pinned: boolean
  created_at: string
}

export type MilestoneStatus = 'dalam_pengerjaan' | 'selesai' | 'direncanakan' | 'tertunda'

export interface Milestone {
  id: string
  title: string
  description: string | null
  progress: number
  status: MilestoneStatus
  target_date: string | null
  category: string
}

export interface Supporter {
  id: string
  name: string
  tier_name: string
  amount: number
  message: string | null
  roblox_user: string | null
  created_at: string
}
