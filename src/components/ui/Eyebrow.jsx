/**
 * Gallery placard — the quiet chapter marker.
 * A hairline, an editorial roman-ish numeral, and a finely-tracked label.
 * Deliberately NOT monospace: this should read like a museum wall label,
 * not a terminal readout. `light` flips it for ivory rooms.
 */
export default function Eyebrow({ index, children, light = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-3.5 ${light ? 'text-obsidian/60' : 'text-silver'} ${className}`}>
      <span className={`w-8 h-px ${light ? 'bg-gold-deep/50' : 'bg-gold/40'}`} />
      {index != null && (
        <span className={`font-editorial italic text-base leading-none ${light ? 'text-gold-deep' : 'text-gold'}`}>
          {index}
        </span>
      )}
      <span className={`text-[10.5px] tracking-[0.34em] uppercase font-light ${light ? 'text-obsidian/65' : 'text-bone/70'}`}>
        {children}
      </span>
    </span>
  )
}
