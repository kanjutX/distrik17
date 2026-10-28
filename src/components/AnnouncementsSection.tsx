import { useEffect, useState } from 'react'
import { announcementsApi } from '../lib/api'
import { useAuth } from '../lib/auth-context'
import type { Announcement } from '../lib/types'
import SectionHeading from './SectionHeading'
import { Megaphone, Pin, Plus, Loader2, Pencil, Trash2, X } from 'lucide-react'

const LEVEL_STYLE: Record<Announcement['level'], string> = {
  info: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  warning: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  event: 'border-blood/40 bg-blood/10 text-blood',
}
const LEVEL_LABEL: Record<Announcement['level'], string> = {
  info: 'Info',
  warning: 'Peringatan',
  event: 'Event',
}

export default function AnnouncementsSection() {
  const { user } = useAuth()
  const [items, setItems] = useState<Announcement[] | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = () =>
    announcementsApi
      .list()
      .then((r) => {
        setItems(r.announcements)
        setError(null)
      })
      .catch((e) => {
        setError(e.message)
        setItems((cur) => cur ?? [])
      })
  useEffect(() => {
    refresh()
  }, [])

  async function remove(id: string) {
    if (!confirm('Hapus pengumuman ini?')) return
    try {
      await announcementsApi.remove(id)
    } catch (e: any) {
      alert(e.message)
    }
    refresh()
  }

  if (items && items.length === 0 && !error && user?.role !== 'owner') return null

  return (
    <section id="pengumuman" className="relative py-20 px-4">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="PAPAN TONGKRONGAN" title="Pengumuman" />

        {user?.role === 'owner' && (
          <div className="mb-8 text-center">
            <button
              onClick={() => {
                setEditing(null)
                setShowForm((v) => !v)
              }}
              className="inline-flex items-center gap-2 font-display text-lg tracking-wide px-5 py-2 bg-blood hover:bg-blood-dark rounded-sm"
            >
              <Plus size={18} /> {showForm && !editing ? 'Tutup Form' : 'Pengumuman Baru'}
            </button>
            {showForm && !editing && (
              <AnnouncementForm
                onDone={() => {
                  setShowForm(false)
                  refresh()
                }}
              />
            )}
          </div>
        )}

        {!items && (
          <div className="flex justify-center py-10 text-bone-dim">
            <Loader2 className="animate-spin" />
          </div>
        )}
        {error && <p className="text-center text-blood text-sm mb-4">{error}</p>}
        {items?.length === 0 && !error && <p className="text-center text-bone-dim">Belum ada pengumuman.</p>}

        <div className="space-y-3">
          {items?.map((a) =>
            editing?.id === a.id ? (
              <AnnouncementForm
                key={a.id}
                existing={a}
                onDone={() => {
                  setEditing(null)
                  refresh()
                }}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <article key={a.id} className={`card-grime rounded-lg p-4 border-l-4 ${LEVEL_STYLE[a.level]}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {a.pinned && <Pin size={13} className="text-blood shrink-0" />}
                    <Megaphone size={15} className="shrink-0" />
                    <span className="font-display text-xl tracking-wide">{a.title}</span>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${LEVEL_STYLE[a.level]}`}>
                      {LEVEL_LABEL[a.level]}
                    </span>
                  </div>
                  {user?.role === 'owner' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => { setEditing(a); setShowForm(false) }} className="text-bone-dim hover:text-bone">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => remove(a.id)} className="text-bone-dim hover:text-blood">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-bone-dim mt-1.5 whitespace-pre-line">{a.body}</p>
                <p className="text-right text-[11px] text-bone-dim mt-2">
                  {new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </article>
            ),
          )}
        </div>
      </div>
    </section>
  )
}

function AnnouncementForm({
  existing,
  onDone,
  onCancel,
}: {
  existing?: Announcement
  onDone: () => void
  onCancel?: () => void
}) {
  const [title, setTitle] = useState(existing?.title ?? '')
  const [body, setBody] = useState(existing?.body ?? '')
  const [level, setLevel] = useState<Announcement['level']>(existing?.level ?? 'info')
  const [pinned, setPinned] = useState(existing?.pinned ?? false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    try {
      if (existing) await announcementsApi.update(existing.id, { title, body, level, pinned })
      else await announcementsApi.create({ title, body, level, pinned })
      onDone()
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="card-grime rounded-lg p-5 mt-4 text-left space-y-3 relative">
      {onCancel && (
        <button type="button" onClick={onCancel} className="absolute top-3 right-3 text-bone-dim hover:text-bone">
          <X size={16} />
        </button>
      )}
      {err && <p className="text-blood text-sm">{err}</p>}
      <input required placeholder="Judul pengumuman" value={title} onChange={(e) => setTitle(e.target.value)} className="input w-full" />
      <textarea required placeholder="Isi pengumuman" value={body} onChange={(e) => setBody(e.target.value)} className="input w-full h-24" />
      <div className="flex flex-wrap items-center gap-3">
        <select value={level} onChange={(e) => setLevel(e.target.value as Announcement['level'])} className="input">
          <option value="info">Info</option>
          <option value="warning">Peringatan</option>
          <option value="event">Event</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-bone-dim">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} /> Pin di atas
        </label>
      </div>
      <button disabled={busy} className="font-display text-lg px-5 py-2 bg-blood hover:bg-blood-dark rounded-sm disabled:opacity-50">
        {busy ? 'Menyimpan...' : existing ? 'Simpan Perubahan' : 'Post Pengumuman'}
      </button>
    </form>
  )
}
