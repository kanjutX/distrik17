export default function Footer() {
  return (
    <footer className="relative border-t border-bone/10 py-10 px-4 text-center">
      <img src="/logo-distrik17.png" alt="Distrik 17" className="h-10 w-auto mx-auto mb-3 opacity-90" />
      <p className="text-xs text-bone-dim">
        © {new Date().getFullYear()} {import.meta.env.VITE_APP_TITLE || 'Distrik 17'}. Fan project komunitas, tidak berafiliasi dengan Roblox Corporation.
      </p>
    </footer>
  )
}
