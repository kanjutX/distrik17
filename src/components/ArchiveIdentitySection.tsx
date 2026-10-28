import { useEffect, useState } from 'react'
import { gachaApi } from '../lib/api'
import { useAuth } from '../lib/auth-context'
import type { GachaItem, GachaPull, GachaRarity } from '../lib/types'
import SectionHeading from './SectionHeading'
import { Shuffle, Sparkles, ShieldAlert } from 'lucide-react'

const FACES = ['😠', '😤', '🙂', '😎', '🥵', '😑']
const HAIRS = ['💇', '🧑‍🦱', '🧑‍🦰', '🧑‍🦲', '🎩', '🧢']
const OUTFITS = ['🧥', '👕', '🦺', '🧣', '👔', '🥼']
const ACCESSORIES = ['⛓️', '🕶️', '💍', '🎒', '🔑', '—']

const RARITY_STYLE: Record<GachaRarity, string> = {
  common: 'border-bone/25 bg-bone/5 text-bone-dim',
  uncommon: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  rare: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  epic: 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300',
  legendary: 'border-amber-400/50 bg-amber-400/10 text-amber-300',
}
const RARITY_LABEL: Record<GachaRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
}

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function AvatarBuilder() {
  const [face, setFace] = useState(FACES[0])
  const [hair, setHair] = useState(HAIRS[0])
  const [outfit, setOutfit] = useState(OUTFITS[0])
  const [accessory, setAccessory] = useState(ACCESSORIES[0])

  function cycle(arr: string[], current: string, setter: (v: string) => void) {
    const next = arr[(arr.indexOf(current) + 1) % arr.length]
    setter(next)
  }

  function randomizeAll() {
    setFace(pick(FACES))
    setHair(pick(HAIRS))
    setOutfit(pick(OUTFITS))
    setAccessory(pick(ACCESSORIES))
  }

  const rows: [string, string, string[], (v: string) => void][] = [
    ['Ekspresi', face, FACES, setFace],
    ['Gaya Rambut', hair, HAIRS, setHair],
    ['Outfit', outfit, OUTFITS, setOutfit],
    ['Aksesoris', accessory, ACCESSORIES, setAccessory],
  ]

  return (
    <div className="card-grime rounded-lg p-6 flex flex-col items-center gap-5">
      <div className="relative w-36 h-36 rounded-full bg-black/40 border border-bone/15 flex items-center justify-center text-6xl shadow-[0_0_40px_-10px_rgba(224,20,31,0.5)]">
        <span>{face}</span>
        <span className="absolute -top-2 -right-1 text-3xl">{hair}</span>
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-3xl">{outfit}</span>
        {accessory !== '—' && <span className="absolute -bottom-1 -right-2 text-2xl">{accessory}</span>}
      </div>

      <div className="w-full space-y-2.5">
        {rows.map(([label, current, arr, setter]) => (
          <div key={label} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-bone-dim w-24 shrink-0">{label}</span>
            <button
              type="button"
              onClick={() => cycle(arr, current, setter)}
              className="flex-1 flex items-center justify-between px-3 py-1.5 rounded-md border border-bone/15 hover:border-blood/50 transition-colors"
            >
              <span>{current}</span>
              <span className="text-bone-dim text-xs">ganti »</span>
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={randomizeAll}
        className="inline-flex items-center gap-2 font-display text-lg tracking-wide px-5 py-2 bg-blood hover:bg-blood-dark rounded-sm"
      >
        <Shuffle size={17} /> Acak Semua
      </button>
      <p className="text-[11px] text-bone-dim text-center">
        Persona iseng buat arsip — bukan avatar in-game beneran, cuma hiburan sambil nunggu rilis.
      </p>
    </div>
  )
}

function GachaBox() {
  const { user } = useAuth()
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState<GachaItem | null>(null)
  const [history, setHistory] = useState<GachaPull[]>([])
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (user) gachaApi.history().then((r) => setHistory(r.pulls)).catch(() => {})
  }, [user])

  async function roll() {
    setRolling(true)
    setErr(null)
    try {
      const r = await gachaApi.roll()
      setResult(r.item)
      if (r.saved && user) {
        gachaApi.history().then((h) => setHistory(h.pulls)).catch(() => {})
      }
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setRolling(false)
    }
  }

  return (
    <div className="card-grime rounded-lg p-6 flex flex-col items-center gap-4">
      <h3 className="font-display text-2xl tracking-wide flex items-center gap-2">
        <Sparkles size={20} className="text-blood" /> Gacha Arsip
      </h3>
      <p className="text-xs text-bone-dim text-center">
        Roll item kosmetik buat persona arsip kamu. Common sampai legendary — murni iseng, gratis.
      </p>

      {result && (
        <div className={`w-full rounded-lg border p-4 text-center ${RARITY_STYLE[result.rarity]}`}>
          <p className="text-4xl">{result.emoji}</p>
          <p className="font-display text-xl mt-1">{result.name}</p>
          <p className="text-[11px] uppercase tracking-wide mt-0.5">{RARITY_LABEL[result.rarity]}</p>
        </div>
      )}

      {err && <p className="text-blood text-sm">{err}</p>}

      <button
        type="button"
        onClick={roll}
        disabled={rolling}
        className="font-display text-lg tracking-wide px-6 py-2 bg-blood hover:bg-blood-dark rounded-sm disabled:opacity-50"
      >
        {rolling ? 'Rolling...' : 'Roll Sekarang'}
      </button>

      {!user && <p className="text-[11px] text-bone-dim text-center">Login biar hasil roll-mu kesimpen permanen.</p>}

      {user && history.length > 0 && (
        <div className="w-full">
          <p className="text-[11px] uppercase tracking-wide text-bone-dim mb-1.5">Koleksi terakhir</p>
          <div className="flex flex-wrap gap-1.5">
            {history.slice(0, 12).map((p) => (
              <span
                key={p.id}
                title={p.item_name}
                className={`text-[11px] px-2 py-1 rounded border ${RARITY_STYLE[p.rarity]}`}
              >
                {p.item_name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ArchiveIdentitySection() {
  return (
    <section id="arsip" className="relative py-24 px-4">
      <div className="mx-auto max-w-4xl">
        <SectionHeading eyebrow="ARSIP TONGKRONGAN" title="Identitas & Arsip" />

        <p className="flex items-start gap-2 text-sm text-bone-dim max-w-xl mx-auto text-center justify-center mb-10">
          <ShieldAlert size={16} className="shrink-0 mt-0.5 text-blood" />
          Nggak ada cuplikan gameplay di sini — biar nggak spoiler. Sambil nunggu rilis, bikin persona arsip
          sendiri dan coba gacha di bawah.
        </p>

        <div className="grid sm:grid-cols-2 gap-6 items-start">
          <AvatarBuilder />
          <GachaBox />
        </div>
      </div>
    </section>
  )
}
