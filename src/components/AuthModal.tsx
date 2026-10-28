import { useState } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../lib/auth-context'

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    try {
      if (mode === 'login') await login(email, password)
      else await register(username, email, password)
      onClose()
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="card-grime rounded-lg p-6 w-full max-w-sm relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 text-bone-dim hover:text-bone">
          <X size={18} />
        </button>
        <h2 className="font-display text-3xl text-center mb-1">
          {mode === 'login' ? 'Masuk Geng' : 'Gabung Geng'}
        </h2>
        <p className="text-center text-xs text-bone-dim mb-5">Distrik 17 — anggota tongkrongan</p>

        <form onSubmit={submit} className="space-y-3">
          {err && <p className="text-blood text-sm text-center">{err}</p>}
          {mode === 'register' && (
            <input required placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="input w-full" />
          )}
          <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="input w-full" />
          <input
            required
            minLength={6}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input w-full"
          />
          <button disabled={busy} className="w-full font-display text-xl tracking-wide px-5 py-2 bg-blood hover:bg-blood-dark rounded-sm disabled:opacity-50">
            {busy ? 'Tunggu...' : mode === 'login' ? 'Masuk' : 'Daftar'}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          className="mt-4 text-xs text-bone-dim hover:text-blood w-full text-center"
        >
          {mode === 'login' ? 'Belum punya akun? Daftar' : 'Udah punya akun? Masuk'}
        </button>
      </div>
    </div>
  )
}
