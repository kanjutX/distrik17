import { useEffect, useState } from 'react'
import { settingsApi } from '../lib/api'
import { useAuth } from '../lib/auth-context'
import { Settings2, ChevronDown } from 'lucide-react'

function toLocalInputValue(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

export default function AdminSettingsPanel() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState('')
  const [dateLocal, setDateLocal] = useState('')
  const [unannounced, setUnannounced] = useState(true)
  const [donateLink, setDonateLink] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (user?.role !== 'owner') return
    settingsApi
      .get()
      .then((r) => {
        setPhase(r.settings.release_phase ?? '')
        setDateLocal(toLocalInputValue(r.settings.release_date))
        setUnannounced(!r.settings.release_date)
        setDonateLink(r.settings.donate_link ?? '')
      })
      .catch((e) => setMsg(e.message))
  }, [user?.role])

  if (user?.role !== 'owner') return null

  async function save() {
    setBusy(true)
    setMsg(null)
    try {
      const release_date = unannounced || !dateLocal ? null : new Date(dateLocal).toISOString()
      await settingsApi.update({
        release_phase: phase || null,
        release_date,
        donate_link: donateLink || null,
      })
      setMsg('Settings tersimpan.')
    } catch (e: any) {
      setMsg(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="relative px-4 pt-10">
      <div className="mx-auto max-w-3xl card-grime rounded-lg">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-5 py-4 text-left"
        >
          <span className="flex items-center gap-2 font-display text-xl tracking-wide">
            <Settings2 size={18} className="text-blood" /> Panel Admin — Settings
          </span>
          <ChevronDown size={18} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="px-5 pb-5 space-y-4 border-t border-bone/10 pt-4">
            {msg && <p className="text-sm text-emerald-400">{msg}</p>}

            <div>
              <label className="block text-xs uppercase tracking-wide text-bone-dim mb-1.5">Fase Rilis</label>
              <input
                value={phase}
                onChange={(e) => setPhase(e.target.value)}
                placeholder="cth. Closed Alpha, Open Beta"
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-bone-dim mb-1.5">Tanggal Rilis</label>
              <input
                type="datetime-local"
                value={dateLocal}
                disabled={unannounced}
                onChange={(e) => setDateLocal(e.target.value)}
                className="input w-full disabled:opacity-40"
              />
              <label className="flex items-center gap-2 text-sm text-bone-dim mt-2">
                <input type="checkbox" checked={unannounced} onChange={(e) => setUnannounced(e.target.checked)} />
                Belum diumumkan — countdown tampil 00 00 00 00
              </label>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-bone-dim mb-1.5">Link Donasi</label>
              <input
                value={donateLink}
                onChange={(e) => setDonateLink(e.target.value)}
                placeholder="https://saweria.co/..."
                className="input w-full"
              />
            </div>

            <button
              onClick={save}
              disabled={busy}
              className="font-display text-lg px-5 py-2 bg-blood hover:bg-blood-dark rounded-sm disabled:opacity-50"
            >
              {busy ? 'Menyimpan...' : 'Simpan Settings'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
