import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Magnetic from './Magnetic'

/**
 * Luxury CTA. Outline variant fills with gold on hover (wipe from left);
 * solid variant is gold. Polymorphic: href (anchor), to (router), or button.
 */
export default function LuxButton({
  children,
  href,
  to,
  onClick,
  type = 'button',
  variant = 'outline',
  icon = true,
  cursor = '',
  target,
  className = '',
}) {
  const base =
    'group relative inline-flex items-center gap-3 px-7 py-3.5 text-[11px] tracking-[0.28em] uppercase font-medium overflow-hidden select-none'
  const styles =
    variant === 'solid'
      ? 'bg-gold text-obsidian hover:text-obsidian'
      : 'border border-gold/40 text-ivory hover:text-obsidian transition-colors duration-500'

  const inner = (
    <>
      {variant === 'outline' && (
        <span className="absolute inset-0 bg-gold origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]" />
      )}
      <span className="relative z-10">{children}</span>
      {icon && (
        <ArrowUpRight
          size={14}
          className="relative z-10 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      )}
    </>
  )

  const cls = `${base} ${styles} ${className}`
  let el
  if (to) {
    el = <Link to={to} data-cursor={cursor} className={cls}>{inner}</Link>
  } else if (href) {
    el = (
      <a href={href} target={target} rel={target === '_blank' ? 'noopener noreferrer' : undefined} data-cursor={cursor} className={cls}>
        {inner}
      </a>
    )
  } else {
    el = <button type={type} onClick={onClick} data-cursor={cursor} className={cls}>{inner}</button>
  }

  return <Magnetic strength={0.28}>{el}</Magnetic>
}
