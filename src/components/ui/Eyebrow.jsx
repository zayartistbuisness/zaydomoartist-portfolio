/**
 * Gallery placard — the quiet chapter marker.
 * A hairline, an editorial roman-ish numeral, and a finely-tracked label.
 * Deliberately NOT monospace: this should read like a museum wall label,
 * not a terminal readout.
 */
export default function Eyebrow({ index, children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-3.5 text-silver ${className}`}>
      <span className="w-8 h-px bg-gold/40" />
      {index != null && <span className="font-editorial italic text-gold text-base leading-none">{index}</span>}
      <span className="text-[10.5px] tracking-[0.34em] uppercase font-light text-bone/70">{children}</span>
    </span>
  )
}
