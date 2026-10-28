import { useEffect, useState } from 'react'
import { settingsApi } from '../lib/api'
import type { SiteSettings } from '../lib/types'
import SectionHeading from './SectionHeading'
import { Hourglass, PartyPopper } from 'lucide-react'

type Remaining = { d: number; h: number; m: number; s: number } | null

function computeRemaining(targetIso: string | null, now: number): Remaining {
  if (!targetIso) return null
  const diff = new Date(targetIso).getTime() - now
  if (Number.isNaN(diff)) return null // garbage date in settings -> treat as "belum diumumkan" instead of showing NaN
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 }
  const s = Math.floor(diff / 1000) % 60
  const m = Math.floor(diff / 60000) % 60
  const h = Math.floor(diff / 3600000) % 24
  const d = Math.floor(diff / 86400000)
  return { d, h, m, s }
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export default function CountdownRelease() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    settingsApi.get().then((r) => setSettings(r.settings)).catch(() => setSettings({ release_phase: null, release_date: null, donate_link: null }))
  }, [])

  useEffect(() => {
    if (!settings?.release_date) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [settings?.release_date])

  if (!settings) return null

  const remaining = computeRemaining(settings.release_date, now)
  const isReleased = !!remaining && new Date(settings.release_date!).getTime() <= now

  const blocks = remaining
    ? [
        { label: 'Hari', value: remaining.d },
        { label: 'Jam', value: remaining.h },
        { label: 'Menit', value: remaining.m },
        { label: 'Detik', value: remaining.s },
      ]
    : [
        { label: 'Hari', value: 0 },
        { label: 'Jam', value: 0 },
        { label: 'Menit', value: 0 },
        { label: 'Detik', value: 0 },
      ]

  return (
    <section id="rilis" className="relative py-20 px-4">
      <div className="mx-auto max-w-3xl text-center">
        <SectionHeading eyebrow="FASE PENGEMBANGAN" title="Countdown Rilis" />

        {settings.release_phase && (
          <p className="font-display text-xl tracking-[0.2em] text-blood mb-6">{settings.release_phase}</p>
        )}

        {isReleased ? (
          <div className="card-grime rounded-lg py-10 px-6 flex flex-col items-center gap-3">
            <PartyPopper className="text-blood" size={36} />
            <p className="font-display text-3xl tracking-wide">RILIS SEKARANG!</p>
            <p className="text-bone-dim text-sm">Game-nya udah bisa dimainkan. Gas gabung sekarang.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-md mx-auto">
              {blocks.map((b) => (
                <div key={b.label} className="card-grime rounded-lg py-4">
                  <p className="font-display text-3xl sm:text-4xl tabular-nums">{pad(b.value)}</p>
                  <p className="text-[11px] uppercase tracking-wide text-bone-dim mt-1">{b.label}</p>
                </div>
              ))}
            </div>
            {!remaining && (
              <p className="flex items-center justify-center gap-2 text-bone-dim text-sm mt-5">
                <Hourglass size={15} /> Tanggal rilis belum diumumkan owner.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  )
}
