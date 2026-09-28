export default function Icon({ name = 'arrow-diagonal', size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <use href={`/strategy/brand/icons/sprite.svg#zda-${name}`} />
    </svg>
  )
}
