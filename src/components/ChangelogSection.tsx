import { useEffect, useState } from 'react'
import { changelogsApi } from '../lib/api'
import { useAuth } from '../lib/auth-context'
import type { ChangeEntry, Changelog } from '../lib/types'
import SectionHeading from './SectionHeading'
import { Pin, Plus, Loader2, Trash2 } from 'lucide-react'

const TAG_COLOR: Record<string, string> = {
  major: 'bg-blood/20 text-blood border-blood/40',
  minor: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
  hotfix: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
}

export default function ChangelogSection() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<Changelog[] | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = () =>
    changelogsApi
      .list()
      .then((r) => {
        setLogs(r.changelogs)
        setError(null)
      })
      .catch((e) => {
        setError(e.message)
        setLogs((cur) => cur ?? [])
      })

  async function remove(id: string) {
    if (!confirm('Hapus devlog ini?')) return
    try {
      await changelogsApi.remove(id)
    } catch (e: any) {
      alert(e.message)
    }
    refresh()
  }
  useEffect(() => {
    refresh()
  }, [])

  return (
    <section id="devlog" className="relative py-24 px-4">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="OWNER DEVLOG" title="Changelog" />

        {user?.role === 'owner' && (
          <div className="mb-8 text-center">
            <button
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center gap-2 font-display text-lg tracking-wide px-5 py-2 bg-blood hover:bg-blood-dark rounded-sm"
            >
              <Plus size={18} /> {showForm ? 'Tutup Form' : 'Post Update Baru'}
            </button>
            {showForm && <ChangelogForm onPosted={() => { setShowForm(false); refresh() }} />}
          </div>
        )}

        {!logs && (
          <div className="flex justify-center py-10 text-bone-dim">
            <Loader2 className="animate-spin" />
          </div>
        )}
        {error && <p className="text-center text-blood text-sm mb-4">{error}</p>}
        {logs?.length === 0 && !error && <p className="text-center text-bone-dim">Belum ada devlog.</p>}

        <div className="space-y-6">
          {logs
            ?.slice()
            .sort((a, b) => Number(b.pinned) - Number(a.pinned))
            .map((log) => (
              <article key={log.id} className="card-grime rounded-lg p-5">
                {log.banner_url && (
                  <img src={log.banner_url} alt="" className="w-full h-40 object-cover rounded-md mb-4" />
                )}
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {log.pinned && <Pin size={14} className="text-blood" />}
                      <span className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded border ${TAG_COLOR[log.tag] || 'border-bone/30 text-bone-dim'}`}>
                        {log.tag}
                      </span>
                      <span className="text-xs text-bone-dim">v{log.version}</span>
                    </div>
                    <h3 className="font-display text-2xl tracking-wide mt-1">{log.title}</h3>
                  </div>
                  <span className="flex items-center gap-2 text-xs text-bone-dim shrink-0">
                    {new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {user?.role === 'owner' && (
                      <button onClick={() => remove(log.id)} className="hover:text-blood" aria-label="Hapus devlog">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </span>
                </div>
                <p className="text-sm text-bone-dim mt-2">{log.summary}</p>
                {log.changes?.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm">
                    {log.changes.map((c: ChangeEntry, i) => (
                      <li key={i} className="flex gap-2">
                        <span className={`shrink-0 font-semibold text-xs uppercase ${
                          c.type === 'add' ? 'text-emerald-400' : c.type === 'fix' ? 'text-amber-400' : c.type === 'remove' ? 'text-blood' : 'text-sky-400'
                        }`}>
                          {c.type}
                        </span>
                        <span className="text-bone-dim">{c.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-right text-xs text-bone-dim mt-3">— {log.author}</p>
              </article>
            ))}
        </div>
      </div>
    </section>
  )
}

function ChangelogForm({ onPosted }: { onPosted: () => void }) {
  const { user } = useAuth()
  const [version, setVersion] = useState('')
  const [title, setTitle] = useState('')
  const [tag, setTag] = useState('minor')
  const [summary, setSummary] = useState('')
  const [changesRaw, setChangesRaw] = useState('')
  const [pinned, setPinned] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    try {
      const changes: ChangeEntry[] = changesRaw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const m = line.match(/^(add|fix|change|remove)\s*:\s*(.+)$/i)
          return m ? { type: m[1].toLowerCase() as ChangeEntry['type'], text: m[2] } : { type: 'change' as const, text: line }
        })
      await changelogsApi.create({
        version,
        title,
        author: user?.username || 'Owner',
        tag,
        summary,
        changes,
        banner_url: null,
        pinned,
      })
      onPosted()
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="card-grime rounded-lg p-5 mt-4 text-left space-y-3">
      {err && <p className="text-blood text-sm">{err}</p>}
      <div className="grid sm:grid-cols-2 gap-3">
        <input required placeholder="Versi (0.4.2)" value={version} onChange={(e) => setVersion(e.target.value)} className="input" />
        <select value={tag} onChange={(e) => setTag(e.target.value)} className="input">
          <option value="major">Major</option>
          <option value="minor">Minor</option>
          <option value="hotfix">Hotfix</option>
        </select>
      </div>
      <input required placeholder="Judul update" value={title} onChange={(e) => setTitle(e.target.value)} className="input w-full" />
      <textarea required placeholder="Ringkasan singkat" value={summary} onChange={(e) => setSummary(e.target.value)} className="input w-full h-20" />
      <textarea
        placeholder={'Daftar perubahan, satu baris satu item:\nadd: sistem inventory\nfix: bug crash saat tawuran'}
        value={changesRaw}
        onChange={(e) => setChangesRaw(e.target.value)}
        className="input w-full h-24 font-mono text-xs"
      />
      <label className="flex items-center gap-2 text-sm text-bone-dim">
        <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} /> Pin update ini
      </label>
      <button disabled={busy} className="font-display text-lg px-5 py-2 bg-blood hover:bg-blood-dark rounded-sm disabled:opacity-50">
        {busy ? 'Posting...' : 'Post Devlog'}
      </button>
    </form>
  )
}
