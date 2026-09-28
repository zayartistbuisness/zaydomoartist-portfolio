import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from 'react'

// A scene outside its provider should stay usable and still, not throw.
const WorldMotionContext = createContext({ still: true, reduced: true, toggle: () => undefined })
const query = '(prefers-reduced-motion: reduce)'
let media
const getMedia = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null
  media ??= window.matchMedia(query)
  return media
}
const subscribe = (callback) => {
  const preference = getMedia()
  if (!preference) return () => undefined
  if (preference.addEventListener) {
    preference.addEventListener('change', callback)
    return () => preference.removeEventListener('change', callback)
  }
  preference.addListener(callback)
  return () => preference.removeListener(callback)
}
const getSnapshot = () => getMedia()?.matches ?? true
const getServerSnapshot = () => true

export function WorldMotionProvider({ children }) {
  const systemReduced = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  // Respect the system on entry, then allow a deliberate per-visit choice.
  // This controls only our artwork, not the system's global motion preference.
  const [choice, setChoice] = useState(null)
  const still = choice === null ? systemReduced : choice === 'still'
  const reduced = systemReduced && choice !== 'live'
  const toggle = useCallback(() => setChoice(still ? 'live' : 'still'), [still])
  const value = useMemo(() => ({ still, reduced, systemReduced, toggle }), [still, reduced, systemReduced, toggle])
  return (
    <WorldMotionContext.Provider value={value}>
      <div className="world-portfolio" data-world-motion={still ? 'still' : 'live'}>
        {children}
      </div>
    </WorldMotionContext.Provider>
  )
}

// Kept with its provider to make the animation contract explicit.
// eslint-disable-next-line react-refresh/only-export-components
export function useWorldMotion() {
  return useContext(WorldMotionContext)
}
