import { useState } from 'react'
import { Menu, X, LogOut, ShieldCheck, UserCog } from 'lucide-react'
import { useAuth } from '../lib/auth-context'

const LINKS = [
  { href: '#rilis', label: 'Rilis' },
  { href: '#roadmap', label: 'Roadmap' },
  { href: '#devlog', label: 'Devlog' },
  { href: '#arsip', label: 'Arsip' },
  { href: '#review', label: 'Review' },
  { href: '#kas', label: 'Kas Tongkrongan' },
]

export default function Navbar({ onAuthClick, onProfileClick }: { onAuthClick: () => void; onProfileClick: () => void }) {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()

  return (
    <header className="sticky z-40 top-[var(--safe-t)]">
      <nav className="backdrop-blur-md bg-ink/70 border-b border-bone/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex items-center justify-between h-16">
          <a href="#top" className="flex items-center gap-2 shrink-0">
            <img src="/logo-distrik17.png" alt="Distrik 17" className="h-9 w-auto select-none" draggable={false} />
          </a>

          <ul className="hidden md:flex items-center gap-6 font-display text-lg tracking-wide text-bone-dim">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="hover:text-blood transition-colors duration-150">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {user.role === 'owner' && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blood/15 text-blood border border-blood/30">
                    <ShieldCheck size={13} /> OWNER
                  </span>
                )}
                <button
                  onClick={onProfileClick}
                  className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border border-bone/15 hover:border-blood/50 hover:text-blood transition-colors"
                >
                  <img
                    src={user.avatar_url || `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(user.username)}`}
                    alt=""
                    className="w-5 h-5 rounded-full bg-black/40"
                  />
                  {user.gang_title}
                </button>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-bone/15 hover:border-blood/50 hover:text-blood transition-colors"
                >
                  <LogOut size={14} /> Keluar
                </button>
              </>
            ) : (
              <button
                onClick={onAuthClick}
                className="font-display text-lg tracking-wide px-5 py-1.5 bg-blood hover:bg-blood-dark text-bone rounded-sm shadow-[0_0_20px_-4px_rgba(224,20,31,0.7)] transition-colors"
              >
                Gabung Geng
              </button>
            )}
          </div>

          <button className="md:hidden text-bone" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>

        {open && (
          <div className="md:hidden px-4 pb-4 flex flex-col gap-3 border-t border-bone/10 pt-3">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="font-display text-xl text-bone-dim">
                {l.label}
              </a>
            ))}
            {user ? (
              <>
                <button
                  onClick={() => {
                    setOpen(false)
                    onProfileClick()
                  }}
                  className="flex items-center gap-2 text-left text-sm text-bone-dim"
                >
                  <UserCog size={16} /> Profil ({user.username})
                </button>
                <button onClick={logout} className="text-left text-sm text-blood">
                  Keluar
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setOpen(false)
                  onAuthClick()
                }}
                className="font-display text-lg px-4 py-2 bg-blood rounded-sm w-fit"
              >
                Gabung Geng
              </button>
            )}
          </div>
        )}
      </nav>
    </header>
  )
}
