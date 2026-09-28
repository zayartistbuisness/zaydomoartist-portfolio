import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import GroundPlane from '../../kit/GroundPlane'
import { makeChrome } from '../../kit/chrome'
import { getChapter } from '../../kit/chapterStore'
import { rectToWorld, range } from '../../kit/space'
import { loadFormGeometry } from '../../three/forms'
import { pointer } from '../../ink/pointer'
import { getContactSlot } from './store'

const ID = 'contact'

// His sigil in chrome, swaying slowly beside the sign-off.
function Emblem() {
  const [geo, setGeo] = useState(null)
  const mat = useMemo(() => makeChrome({ resolve: 0, invert: 1 }), [])
  const ref = useRef()
  const camera = useThree((s) => s.camera)

  useEffect(() => {
    let live = true
    loadFormGeometry('domo_sigil').then((r) => live && setGeo(r.geometry))
    return () => { live = false }
  }, [])

  useFrame((state) => {
    const m = ref.current
    const el = getContactSlot()
    if (!m || !el) return
    const r = el.getBoundingClientRect()
    m.visible = r.bottom > 0 && r.top < state.size.height
    if (!m.visible) return
    const w = rectToWorld(r, state, camera, 0)
    m.position.set(w.x, w.y, 0)
    m.scale.setScalar(w.h * 0.5)
    const t = state.clock.elapsedTime
    const px = pointer.active ? pointer.x / state.size.width - 0.5 : 0
    m.rotation.set(Math.sin(t * 0.4) * 0.06, Math.sin(t * 0.3) * 0.45 + px * 0.5, 0)
    m.material.userData.ink.uResolve.value = range(0.2, 0.7, getChapter(ID).enter)
  })

  if (!geo) return null
  return <mesh ref={ref} geometry={geo} material={mat} />
}

export default function Scene() {
  return (
    <>
      <GroundPlane id={ID} color="#111110" />
      <Emblem />
    </>
  )
}
