import { useEffect, useState } from 'react'
import { reviewsApi } from '../lib/api'
import { useAuth } from '../lib/auth-context'
import type { Review } from '../lib/types'
import SectionHeading from './SectionHeading'
import { Star, ThumbsUp, Loader2, Trash2 } from 'lucide-react'

const CATEGORIES = ['Gameplay', 'Map & Lokasi', 'Combat', 'Voice Acting', 'Bug Report', 'Saran Fitur']

export default function ReviewsSection() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[] | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = () =>
    reviewsApi
      .list()
      .then((r) => {
        setReviews(r.reviews)
        setError(null)
      })
      .catch((e) => {
        setError(e.message)
        setReviews((cur) => cur ?? [])
      })
  // re-fetch on login/logout so "liked_by_me" matches who is actually signed in
  useEffect(() => {
    refresh()
  }, [user?.id])

  async function remove(id: string) {
    if (!confirm('Hapus review ini?')) return
    try {
      await reviewsApi.remove(id)
    } catch (e: any) {
      alert(e.message)
    }
    refresh()
  }
  async function like(id: string) {
    if (!reviews || !user) return
    setReviews(reviews.map((r) => (r.id === id ? { ...r, likes: r.likes + 1, liked_by_me: true } : r)))
    try {
      await reviewsApi.like(id)
    } catch {
      refresh()
    }
  }

  return (
    <section id="review" className="relative py-24 px-4">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="SUARA TONGKRONGAN" title="Review & Feedback" />

        <div className="text-center mb-8">
          {user ? (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="font-display text-lg tracking-wide px-5 py-2 bg-blood hover:bg-blood-dark rounded-sm"
            >
              {showForm ? 'Tutup Form' : 'Tulis Review'}
            </button>
          ) : (
            <p className="text-bone-dim text-sm">Gabung geng dulu buat kasih review, boss.</p>
          )}
          {showForm && user && <ReviewForm onPosted={() => { setShowForm(false); refresh() }} />}
        </div>

        {!reviews && (
          <div className="flex justify-center py-10 text-bone-dim">
            <Loader2 className="animate-spin" />
          </div>
        )}
        {error && <p className="text-center text-blood text-sm mb-4">{error}</p>}
        {reviews?.length === 0 && !error && <p className="text-center text-bone-dim">Belum ada review. Jadi yang pertama.</p>}

        <div className="space-y-4">
          {reviews?.map((r) => (
            <article key={r.id} className="card-grime rounded-lg p-4 flex gap-3">
              <img
                src={r.avatar_url || `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(r.username)}`}
                alt=""
                className="w-10 h-10 rounded-full shrink-0 bg-black/40"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <div>
                    <span className="font-semibold text-sm">{r.username}</span>
                    {r.gang_title && <span className="text-xs text-bone-dim ml-2">{r.gang_title}</span>}
                  </div>
                  <span className="text-[11px] text-bone-dim">
                    {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < r.rating ? 'fill-blood text-blood' : 'text-bone/20'} />
                  ))}
                  <span className="text-[11px] uppercase tracking-wide text-bone-dim ml-2 px-1.5 py-0.5 border border-bone/15 rounded">
                    {r.category}
                  </span>
                </div>
                <p className="text-sm text-bone-dim mt-2">{r.content}</p>
                <div className="mt-2 flex items-center gap-4">
                  <button
                    onClick={() => like(r.id)}
                    disabled={r.liked_by_me || !user}
                    title={user ? undefined : 'Login dulu buat like'}
                    className="flex items-center gap-1.5 text-xs text-bone-dim hover:text-blood disabled:text-blood disabled:cursor-not-allowed transition-colors"
                  >
                    <ThumbsUp size={13} className={r.liked_by_me ? 'fill-blood' : ''} /> {r.likes}
                  </button>
                  {user && (user.role === 'owner' || user.id === r.user_id) && (
                    <button onClick={() => remove(r.id)} className="flex items-center gap-1 text-xs text-bone-dim hover:text-blood">
                      <Trash2 size={13} /> Hapus
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function ReviewForm({ onPosted }: { onPosted: () => void }) {
  const [rating, setRating] = useState(5)
  const [category, setCategory] = useState(CATEGORIES[0])
  const [content, setContent] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    try {
      await reviewsApi.create({ rating, category, content })
      onPosted()
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="card-grime rounded-lg p-5 mt-4 text-left space-y-3 max-w-md mx-auto">
      {err && <p className="text-blood text-sm">{err}</p>}
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <button type="button" key={i} onClick={() => setRating(i + 1)}>
            <Star size={22} className={i < rating ? 'fill-blood text-blood' : 'text-bone/20'} />
          </button>
        ))}
      </div>
      <select value={category} onChange={(e) => setCategory(e.target.value)} className="input w-full">
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <textarea
        required
        minLength={5}
        placeholder="Kasih tau pendapat lo soal game ini..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="input w-full h-24"
      />
      <button disabled={busy} className="font-display text-lg px-5 py-2 bg-blood hover:bg-blood-dark rounded-sm disabled:opacity-50">
        {busy ? 'Mengirim...' : 'Kirim Review'}
      </button>
    </form>
  )
}
