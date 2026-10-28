import { useEffect, useMemo, useState } from 'react'
import { milestonesApi } from '../lib/api'
import { useAuth } from '../lib/auth-context'
import type { Milestone, MilestoneStatus } from '../lib/types'
import SectionHeading from './SectionHeading'
import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'

const STATUS_LABEL: Record<MilestoneStatus, string> = {
  dalam_pengerjaan: 'Dalam Pengerjaan',
  selesai: 'Selesai',
  direncanakan: 'Direncanakan',
  tertunda: 'Tertunda',
}

const STATUS_COLOR: Record<MilestoneStatus, string> = {
  dalam_pengerjaan: 'bg-amber-500',
  selesai: 'bg-emerald-500',
  direncanakan: 'bg-sky-500',
  tertunda: 'bg-bone-dim',
}

export default function RoadmapSection() {
  const { user } = useAuth()
  const isOwner = user?.role === 'owner'
  const [milestones, setMilestones] = useState<Milestone[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Milestone | null>(null)

  const refresh = () =>
    milestonesApi
      .list()
      .then((r) => {
        setMilestones(r.milestones)
        setError(null)
      })
      .catch((e) => setError(e.message))

  useEffect(() => {
    refresh()
  }, [])

  async function remove(id: string) {
    if (!confirm('Hapus milestone ini?')) return
    try {
      await milestonesApi.remove(id)
    } catch (e: any) {
      alert(e.message)
    }
    refresh()
  }

  const grouped = useMemo<Record<string, Milestone[]>>(() => {
    if (!milestones) return {}
    return milestones.reduce<Record<string, Milestone[]>>((acc, m) => {
      ;(acc[m.category] ??= []).push(m)
      return acc
    }, {})
  }, [milestones])

  return (
    <section id="roadmap" className="relative py-24 px-4">
      <div className="mx-auto max-w-5xl">
        <SectionHeading eyebrow="STATUS PENGEMBANGAN" title="Roadmap & Milestones" />

        {isOwner && (
          <div className="mb-8 text-center">
            <button
              onClick={() => {
                setEditing(null)
                setShowForm((v) => !v)
              }}
              className="inline-flex items-center gap-2 font-display text-lg tracking-wide px-5 py-2 bg-blood hover:bg-blood-dark rounded-sm"
            >
              <Plus size={18} /> {showForm && !editing ? 'Tutup Form' : 'Milestone Baru'}
            </button>
            {showForm && !editing && (
              <MilestoneForm
                onDone={() => {
                  setShowForm(false)
                  refresh()
                }}
              />
            )}
          </div>
        )}

        {error && <p className="text-center text-blood">{error}</p>}
        {!milestones && !error && (
          <div className="flex justify-center py-10 text-bone-dim">
            <Loader2 className="animate-spin" />
          </div>
        )}

        {milestones && milestones.length === 0 && (
          <p className="text-center text-bone-dim">Belum ada milestone yang diposting owner.</p>
        )}

        <div className="grid sm:grid-cols-2 gap-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="card-grime rounded-lg p-5">
              <h3 className="font-display text-2xl tracking-wide text-bone mb-4">{category}</h3>
              <div className="space-y-5">
                {items.map((m) =>
                  editing?.id === m.id ? (
                    <MilestoneForm
                      key={m.id}
                      existing={m}
                      onDone={() => {
                        setEditing(null)
                        refresh()
                      }}
                      onCancel={() => setEditing(null)}
                    />
                  ) : (
                    <div key={m.id}>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-semibold text-sm">{m.title}</span>
                        <span className="flex items-center gap-2 text-xs text-bone-dim whitespace-nowrap">
                          {m.progress}%
                          {isOwner && (
                            <>
                              <button
                                onClick={() => {
                                  setEditing(m)
                                  setShowForm(false)
                                }}
                                className="hover:text-bone"
                                aria-label="Edit milestone"
                              >
                                <Pencil size={13} />
                              </button>
                              <button onClick={() => remove(m.id)} className="hover:text-blood" aria-label="Hapus milestone">
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </span>
                      </div>
                      {m.description && <p className="text-xs text-bone-dim mb-1.5">{m.description}</p>}
                      <div className="h-2 rounded-full bg-black/40 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${STATUS_COLOR[m.status] ?? 'bg-bone-dim'} transition-all duration-700`}
                          style={{ width: `${Math.min(100, Math.max(0, m.progress))}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[11px] uppercase tracking-wide text-bone-dim">
                          {STATUS_LABEL[m.status] ?? m.status}
                        </span>
                        {m.target_date && <span className="text-[11px] text-bone-dim">Target: {m.target_date}</span>}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function MilestoneForm({
  existing,
  onDone,
  onCancel,
}: {
  existing?: Milestone
  onDone: () => void
  onCancel?: () => void
}) {
  const [title, setTitle] = useState(existing?.title ?? '')
  const [category, setCategory] = useState(existing?.category ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [progress, setProgress] = useState(existing?.progress ?? 0)
  const [status, setStatus] = useState<MilestoneStatus>(existing?.status ?? 'dalam_pengerjaan')
  const [targetDate, setTargetDate] = useState(existing?.target_date ?? '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    try {
      await milestonesApi.upsert({
        id: existing?.id,
        title,
        category,
        description: description || null,
        progress,
        status,
        target_date: targetDate || null,
      })
      onDone()
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="card-grime rounded-lg p-4 mt-4 text-left space-y-3 relative">
      {onCancel && (
        <button type="button" onClick={onCancel} className="absolute top-3 right-3 text-bone-dim hover:text-bone">
          <X size={16} />
        </button>
      )}
      {err && <p className="text-blood text-sm">{err}</p>}
      <input required placeholder="Judul milestone" value={title} onChange={(e) => setTitle(e.target.value)} className="input w-full" />
      <input
        required
        maxLength={64}
        placeholder="Kategori (cth. Combat, Map, Sistem)"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="input w-full"
      />
      <textarea placeholder="Deskripsi singkat (opsional)" value={description} onChange={(e) => setDescription(e.target.value)} className="input w-full h-16" />
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-bone-dim">
          Progress: {progress}%
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full accent-[#e0141f]"
          />
        </label>
        <select value={status} onChange={(e) => setStatus(e.target.value as MilestoneStatus)} className="input">
          {(Object.keys(STATUS_LABEL) as MilestoneStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
      <input maxLength={64} placeholder="Target (cth. Q1 2027)" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="input w-full" />
      <button disabled={busy} className="font-display text-lg px-5 py-2 bg-blood hover:bg-blood-dark rounded-sm disabled:opacity-50">
        {busy ? 'Menyimpan...' : existing ? 'Simpan Perubahan' : 'Tambah Milestone'}
      </button>
    </form>
  )
}
