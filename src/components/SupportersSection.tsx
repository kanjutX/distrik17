import { useEffect, useState } from 'react'
import { settingsApi, supportersApi } from '../lib/api'
import type { Supporter } from '../lib/types'
import SectionHeading from './SectionHeading'
import { Crown, Loader2, HeartHandshake } from 'lucide-react'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export default function SupportersSection() {
  const [data, setData] = useState<{ supporters: Supporter[]; total: number } | null>(null)
  const [donateLink, setDonateLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supportersApi
      .list()
      .then(setData)
      .catch((e) => setError(e.message))
    settingsApi.get().then((r) => setDonateLink(r.settings.donate_link)).catch(() => {})
  }, [])

  const top3 = data?.supporters.slice(0, 3) || []
  const rest = data?.supporters.slice(3) || []

  return (
    <section id="kas" className="relative py-24 px-4">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="DUKUNGAN KAS" title="Tongkrongan Supporters" />

        {donateLink && (
          <div className="text-center mb-8">
            <a
              href={donateLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 font-display text-xl tracking-wide px-6 py-2.5 bg-blood hover:bg-blood-dark rounded-sm shadow-[0_0_30px_-6px_rgba(224,20,31,0.8)] transition-colors"
            >
              <HeartHandshake size={20} /> Donasi Sekarang
            </a>
          </div>
        )}

        {error && <p className="text-center text-blood text-sm">{error}</p>}
        {!data && !error && (
          <div className="flex justify-center py-10 text-bone-dim">
            <Loader2 className="animate-spin" />
          </div>
        )}

        {data && (
          <>
            <p className="text-center font-display text-3xl text-blood mb-10">
              Total terkumpul: {formatRupiah(data.total)}
            </p>

            {top3.length > 0 && (
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                {top3.map((s, i) => (
                  <div key={s.id} className="card-grime rounded-lg p-4 text-center relative">
                    {i === 0 && <Crown className="mx-auto mb-1 text-blood" size={20} />}
                    <p className="font-display text-xl truncate">{s.name}</p>
                    <p className="text-xs text-bone-dim">{s.tier_name}</p>
                    <p className="font-semibold text-blood mt-1">{formatRupiah(s.amount)}</p>
                    {s.message && <p className="text-xs text-bone-dim mt-2 italic">“{s.message}”</p>}
                  </div>
                ))}
              </div>
            )}

            {data.supporters.length === 0 && (
              <p className="text-center text-bone-dim">Belum ada supporter. Jadilah yang pertama bantu kas tongkrongan.</p>
            )}

            {rest.length > 0 && (
              <ul className="divide-y divide-bone/10 card-grime rounded-lg overflow-hidden">
                {rest.map((s) => (
                  <li key={s.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span>
                      {s.name} <span className="text-bone-dim text-xs">· {s.tier_name}</span>
                    </span>
                    <span className="text-blood font-semibold">{formatRupiah(s.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  )
}
