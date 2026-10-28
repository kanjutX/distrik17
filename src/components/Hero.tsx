import { motion } from 'motion/react'
import { ChevronDown, Gamepad2 } from 'lucide-react'

export default function Hero() {
  return (
    <section id="top" className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 text-center overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 glow-pulse"
      >
        <img
          src="/logo-distrik17.png"
          alt="DISTRIK 17"
          className="w-[min(90vw,620px)] h-auto select-none"
          draggable={false}
        />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="relative z-10 mt-6 max-w-xl text-bone-dim font-medium tracking-wide"
      >
        Website resmi pelacakan status pengembangan game Roblox bertema{' '}
        <span className="text-blood font-semibold">tawuran &amp; gelut anak SMA berandal Indonesia</span>.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-3"
      >
        <a
          href="#roadmap"
          className="font-display text-xl tracking-wider px-7 py-2.5 bg-blood hover:bg-blood-dark rounded-sm shadow-[0_0_30px_-6px_rgba(224,20,31,0.8)] transition-colors"
        >
          Lihat Roadmap
        </a>
        <a
          href={import.meta.env.VITE_DISCORD_INVITE || '#'}
          target="_blank"
          rel="noreferrer"
          className="font-display text-xl tracking-wider px-7 py-2.5 border border-bone/20 hover:border-bone/50 rounded-sm flex items-center gap-2 transition-colors"
        >
          <Gamepad2 size={20} /> Join Discord
        </a>
      </motion.div>

      <motion.a
        href="#roadmap"
        aria-label="Scroll ke roadmap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{ delay: 1, duration: 1.6, repeat: Infinity }}
        className="absolute bottom-6 z-10 text-bone-dim"
      >
        <ChevronDown />
      </motion.a>
    </section>
  )
}
