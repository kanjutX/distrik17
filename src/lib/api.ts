import type {
  Announcement,
  Changelog,
  GachaItem,
  GachaPull,
  Milestone,
  Review,
  SiteSettings,
  Supporter,
  User,
} from './types'

const TOKEN_KEY = 'd17_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`/api${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  })
  const isJson = res.headers.get('content-type')?.includes('application/json')
  const body = isJson ? await res.json() : null
  if (!res.ok) {
    throw new ApiError(body?.error || `Request gagal (${res.status})`, res.status)
  }
  return body as T
}

// ---- Auth ----
export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    request<{ user: User; token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<{ user: User; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request<{ user: User }>('/auth/me'),
}

// ---- Reviews ----
export const reviewsApi = {
  list: () => request<{ reviews: Review[] }>('/reviews'),
  create: (data: { rating: number; category: string; content: string }) =>
    request<{ review: Review }>('/reviews', { method: 'POST', body: JSON.stringify(data) }),
  like: (id: string) => request<{ likes: number }>(`/reviews/${id}/like`, { method: 'POST' }),
  remove: (id: string) => request<{ ok: true }>(`/reviews/${id}`, { method: 'DELETE' }),
}

// ---- Changelogs ----
export const changelogsApi = {
  list: () => request<{ changelogs: Changelog[] }>('/changelogs'),
  create: (data: Omit<Changelog, 'id' | 'created_at'>) =>
    request<{ changelog: Changelog }>('/changelogs', { method: 'POST', body: JSON.stringify(data) }),
  remove: (id: string) => request<{ ok: true }>(`/changelogs/${id}`, { method: 'DELETE' }),
}

// ---- Milestones ----
export const milestonesApi = {
  list: () => request<{ milestones: Milestone[] }>('/milestones'),
  upsert: (data: Partial<Milestone> & { title: string; category: string }) =>
    request<{ milestone: Milestone }>('/milestones', { method: 'POST', body: JSON.stringify(data) }),
  remove: (id: string) => request<{ ok: true }>(`/milestones/${id}`, { method: 'DELETE' }),
}

// ---- Supporters ----
export const supportersApi = {
  list: () => request<{ supporters: Supporter[]; total: number }>('/supporters'),
  create: (data: { name: string; tier_name: string; amount: number; message?: string; roblox_user?: string }) =>
    request<{ supporter: Supporter }>('/supporters', { method: 'POST', body: JSON.stringify(data) }),
}

// ---- Site settings (owner-configurable) ----
export const settingsApi = {
  get: () => request<{ settings: SiteSettings }>('/settings'),
  update: (data: Partial<SiteSettings>) =>
    request<{ settings: SiteSettings }>('/settings', { method: 'PUT', body: JSON.stringify(data) }),
}

// ---- Announcements ----
export const announcementsApi = {
  list: () => request<{ announcements: Announcement[] }>('/announcements'),
  create: (data: { title: string; body: string; level: Announcement['level']; pinned: boolean }) =>
    request<{ announcement: Announcement }>('/announcements', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Pick<Announcement, 'title' | 'body' | 'level' | 'pinned'>>) =>
    request<{ announcement: Announcement }>(`/announcements/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => request<{ ok: true }>(`/announcements/${id}`, { method: 'DELETE' }),
}

// ---- Profile ----
export const profileApi = {
  update: (data: { gang_title?: string; avatar_url?: string | null }) =>
    request<{ user: User }>('/profile', { method: 'PATCH', body: JSON.stringify(data) }),
}

// ---- Roblox account linking ----
export const robloxApi = {
  requestCode: () => request<{ code: string; instructions: string }>('/profile/roblox/request-code', { method: 'POST' }),
  verify: (roblox_username: string) =>
    request<{ user: User }>('/profile/roblox/verify', { method: 'POST', body: JSON.stringify({ roblox_username }) }),
  unlink: () => request<{ user: User }>('/profile/roblox/unlink', { method: 'POST' }),
}

// ---- Gacha minigame (Identitas & Arsip) ----
export const gachaApi = {
  roll: () => request<{ item: GachaItem; saved: boolean }>('/gacha', { method: 'POST' }),
  history: () => request<{ pulls: GachaPull[] }>('/gacha'),
}

export { ApiError }
