export default function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-10 text-center">
      <p className="font-display text-blood tracking-[0.3em] text-sm">{eyebrow}</p>
      <h2 className="drip-underline inline-block font-display text-4xl sm:text-5xl tracking-wide mt-1">{title}</h2>
    </div>
  )
}
