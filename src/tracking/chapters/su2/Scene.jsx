import { useEffect, useMemo, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import GroundPlane from '../../kit/GroundPlane'
import LinePlate from '../../kit/LinePlate'
import VoxelMark from '../../three/VoxelMark'
import { getChapter } from '../../kit/chapterStore'
import { viewportAt, range, stageShift } from '../../kit/space'
import { assetExists } from '../../kit/assets'
import { scrollToY } from '../../kit/scroller'
import { pointer } from '../../ink/pointer'
import YearbookModel, { HOLDS } from './YearbookModel'
import StageFollow from '../../kit/StageFollow'

export const ID = 'su2'
const PLATE = '/tracking/chapters/su2/plate_campus_facade.webp'

// The voxel monogram owns the first 30% of the chapter.
const voxelProgress = () => range(0, 0.3, getChapter(ID).progress)

function Yearbook() {
  const model = useMemo(() => new YearbookModel(), [])
  const camera = useThree((s) => s.camera)

  useEffect(() => {
    const stop = model.load()
    return () => { stop(); model.dispose() }
  }, [model])

  useFrame((state, dt) => {
    const c = getChapter(ID)
    model.update({
      q: c.progress,
      visible: c.visible,
      vp: viewportAt(state, camera, 0),
      pointer,
      size: state.size,
      dt,
      shift: stageShift(c, state, camera, 0),
    })
  })

  // Click the book to turn to the next spread (scrolls the page there).
  const advance = (e) => {
    e.stopPropagation()
    const c = getChapter(ID)
    if (!c.rect) return
    const next = HOLDS.find((h) => h > c.progress + 0.01)
    if (next === undefined) return
    const top = c.rect.top + window.scrollY
    scrollToY(top + next * (c.rect.height - window.innerHeight))
  }

  return (
    <primitive
      object={model.group}
      onClick={advance}
      onPointerOver={() => { document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = '' }}
    />
  )
}

export default function Scene() {
  const [plate, setPlate] = useState(false)
  useEffect(() => {
    let live = true
    assetExists(PLATE).then((ok) => live && setPlate(ok))
    return () => { live = false }
  }, [])

  return (
    <>
      <GroundPlane id={ID} color="#e4ddcf" />
      {plate && <LinePlate id={ID} src={PLATE} drift={0.8} black={0.05} white={0.55} opacity={0.28} />}
      <StageFollow id={ID}>
        <VoxelMark src="/tracking/chapters/su2/su2-mark.png" cell={6} getProgress={voxelProgress} invert={0} />
      </StageFollow>
      <Yearbook />
    </>
  )
}
