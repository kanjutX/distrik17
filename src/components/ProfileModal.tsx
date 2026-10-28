import { useRef, useState } from 'react'
import { X, Upload, ShieldCheck, Unlink, Skull, Crosshair, Info } from 'lucide-react'
import { useAuth } from '../lib/auth-context'
import { profileApi, robloxApi } from '../lib/api'

const PRESET_AVATARS = [
  'bottts/Geng-01', 'bottts/Geng-02', 'bottts/Geng-03', 'bottts/Geng-04',
  'adventurer/Geng-05', 'adventurer/Geng-06', 'adventurer/Geng-07', 'adventurer/Geng-08',
].map((seed) => {
  const [style, s] = seed.split('/')
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(s)}&backgroundColor=0a0908`
})

const MAX_UPLOAD_BYTES = 350_000

function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.onload = () => {
      img.onerror = () => reject(new Error('File bukan gambar yang valid'))
      img.onload = () => {
        const size = 256
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')!
        const scale = Math.max(size / img.width, size / img.height)
        const w = img.width * scale
        const h = img.height * scale
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export default function ProfileModal({ onClose }: { onClose: () => void }) {
  const { user, setUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(user?.gang_title ?? '')
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url ?? null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const [robloxUsername, setRobloxUsername] = useState('')
  const [verifyCode, setVerifyCode] = useState<string | null>(null)
  const [robloxBusy, setRobloxBusy] = useState(false)
  const [robloxErr, setRobloxErr] = useState<string | null>(null)

  if (!user) return null

  async function saveProfile(patch: { gang_title?: string; avatar_url?: string | null }): Promise<boolean> {
    setBusy(true)
    setErr(null)
    setOk(null)
    try {
      const r = await profileApi.update(patch)
      setUser(r.user)
      setOk('Tersimpan.')
      return true
    } catch (e: any) {
      setErr(e.message)
      return false
    } finally {
      setBusy(false)
    }
  }

  async function saveAvatar(url: string) {
    const previous = avatarPreview
    setAvatarPreview(url)
    // if the server rejects it, don't keep showing an avatar that was never saved
    if (!(await saveProfile({ avatar_url: url }))) setAvatarPreview(previous)
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // lets the same file be picked again after an error
    if (!file) return
    if (!/^image\/(png|jpe?g)$/.test(file.type)) {
      setErr('Format harus PNG atau JPG')
      return
    }
    try {
      const dataUrl = await resizeToDataUrl(file)
      if (dataUrl.length > MAX_UPLOAD_BYTES) {
        setErr('Ukuran gambar masih kegedean setelah dikompres, coba foto lain')
        return
      }
      await saveAvatar(dataUrl)
    } catch (e: any) {
      setErr(e.message)
    }
  }

  async function requestCode() {
    setRobloxBusy(true)
    setRobloxErr(null)
    try {
      const r = await robloxApi.requestCode()
      setVerifyCode(r.code)
    } catch (e: any) {
      setRobloxErr(e.message)
    } finally {
      setRobloxBusy(false)
    }
  }

  async function verify() {
    setRobloxBusy(true)
    setRobloxErr(null)
    try {
      const r = await robloxApi.verify(robloxUsername)
      setUser(r.user)
      setVerifyCode(null)
      setRobloxUsername('')
    } catch (e: any) {
      setRobloxErr(e.message)
    } finally {
      setRobloxBusy(false)
    }
  }

  async function unlink() {
    setRobloxBusy(true)
    setRobloxErr(null)
    try {
      const r = await robloxApi.unlink()
      setUser(r.user)
    } catch (e: any) {
      setRobloxErr(e.message)
    } finally {
      setRobloxBusy(false)
    }
  }

  const kd = user.deaths > 0 ? (user.kills / user.deaths).toFixed(2) : user.kills.toFixed(2)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="card-grime rounded-lg p-6 w-full max-w-lg relative my-8" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 text-bone-dim hover:text-bone">
          <X size={18} />
        </button>
        <h2 className="font-display text-3xl mb-1">Profil Geng</h2>
        <p className="text-xs text-bone-dim mb-5">@{user.username}</p>

        {err && <p className="text-blood text-sm mb-3">{err}</p>}
        {ok && <p className="text-emerald-400 text-sm mb-3">{ok}</p>}

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <img
            src={avatarPreview || `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(user.username)}`}
            alt=""
            className="w-16 h-16 rounded-full bg-black/40 border border-bone/15"
          />
          <div className="flex-1">
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={onFileChange} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-bone/15 hover:border-blood/50"
            >
              <Upload size={14} /> Upload PNG/JPG
            </button>
          </div>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-6">
          {PRESET_AVATARS.map((url) => (
            <button
              key={url}
              type="button"
              onClick={() => saveAvatar(url)}
              className={`rounded-full overflow-hidden border-2 ${avatarPreview === url ? 'border-blood' : 'border-transparent'}`}
            >
              <img src={url} alt="" className="w-full aspect-square bg-black/40" />
            </button>
          ))}
        </div>

        {/* Title */}
        <label className="block text-xs uppercase tracking-wide text-bone-dim mb-1.5">Title</label>
        <div className="flex gap-2 mb-6">
          <input
            value={title}
            maxLength={128}
            onChange={(e) => setTitle(e.target.value)}
            className="input flex-1"
            placeholder="cth. Siswa Berandal Baru"
          />
          <button
            disabled={busy || title === user.gang_title}
            onClick={() => saveProfile({ gang_title: title })}
            className="font-display text-sm px-4 py-2 bg-blood hover:bg-blood-dark rounded-sm disabled:opacity-40"
          >
            Simpan
          </button>
        </div>

        {/* Roblox link */}
        <div className="border-t border-bone/10 pt-5 mb-6">
          <p className="text-xs uppercase tracking-wide text-bone-dim mb-2">Akun Roblox</p>
          {user.roblox_verified ? (
            <div className="flex items-center justify-between gap-2 card-grime rounded-md p-3">
              <span className="flex items-center gap-2 text-sm">
                <ShieldCheck size={16} className="text-emerald-400" /> @{user.roblox_username}{' '}
                <span className="text-[10px] text-emerald-400 uppercase">terverifikasi</span>
              </span>
              <button onClick={unlink} disabled={robloxBusy} className="text-bone-dim hover:text-blood flex items-center gap-1 text-xs">
                <Unlink size={13} /> Putuskan
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="flex items-start gap-1.5 text-[11px] text-bone-dim">
                <Info size={13} className="shrink-0 mt-0.5" />
                Verifikasi aman: nggak perlu password Roblox kamu. Kami cuma cek kode unik yang kamu taruh di bio
                publik Roblox-mu sendiri.
              </p>
              {robloxErr && <p className="text-blood text-sm">{robloxErr}</p>}
              {!verifyCode ? (
                <button
                  onClick={requestCode}
                  disabled={robloxBusy}
                  className="text-sm px-4 py-1.5 rounded-md border border-bone/15 hover:border-blood/50"
                >
                  Generate Kode Verifikasi
                </button>
              ) : (
                <div className="card-grime rounded-md p-3 space-y-2">
                  <p className="text-sm">
                    Tempel kode ini ke <span className="text-blood font-semibold">About/Description</span> profil
                    Roblox kamu:
                  </p>
                  <p className="font-mono text-lg text-blood text-center bg-black/40 rounded py-1.5">{verifyCode}</p>
                  <input
                    placeholder="Username Roblox kamu"
                    value={robloxUsername}
                    onChange={(e) => setRobloxUsername(e.target.value)}
                    className="input w-full"
                  />
                  <button
                    onClick={verify}
                    disabled={robloxBusy || !robloxUsername}
                    className="w-full font-display text-lg px-4 py-2 bg-blood hover:bg-blood-dark rounded-sm disabled:opacity-50"
                  >
                    {robloxBusy ? 'Mengecek...' : 'Saya Sudah Taruh Kodenya, Verifikasi'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="border-t border-bone/10 pt-5">
          <p className="text-xs uppercase tracking-wide text-bone-dim mb-2">Statistik Tempur</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="card-grime rounded-md py-3 text-center">
              <Crosshair size={16} className="mx-auto text-blood mb-1" />
              <p className="font-display text-xl">{user.kills}</p>
              <p className="text-[10px] text-bone-dim uppercase">Kills</p>
            </div>
            <div className="card-grime rounded-md py-3 text-center">
              <Skull size={16} className="mx-auto text-bone-dim mb-1" />
              <p className="font-display text-xl">{user.deaths}</p>
              <p className="text-[10px] text-bone-dim uppercase">Deaths</p>
            </div>
            <div className="card-grime rounded-md py-3 text-center">
              <p className="font-display text-xl mt-[22px]">{kd}</p>
              <p className="text-[10px] text-bone-dim uppercase">K/D</p>
            </div>
          </div>
          <p className="text-[11px] text-bone-dim mt-2">Belum tersambung ke game — tampilannya disiapin duluan.</p>
        </div>
      </div>
    </div>
  )
}
