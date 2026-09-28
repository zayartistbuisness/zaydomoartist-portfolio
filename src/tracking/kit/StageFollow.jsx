import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { getChapter } from './chapterStore'
import { stageShift } from './space'

/**
 * Makes viewport-anchored 3D travel with its chapter's pinned stage: it
 * rises into view with the section and scrolls away when the pin releases,
 * instead of hanging on screen over the next chapter's ground.
 * Wrap everything except GroundPlane / LinePlate (those track rects already).
 */
export default function StageFollow({ id, z = 0, children }) {
  const ref = useRef()
  const camera = useThree((s) => s.camera)
  useFrame((state) => {
    if (ref.current) ref.current.position.y = stageShift(getChapter(id), state, camera, z)
  })
  return <group ref={ref}>{children}</group>
}
