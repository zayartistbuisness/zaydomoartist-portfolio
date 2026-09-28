import { useFrame, useThree } from '@react-three/fiber'
import { inkGlobals, inkSettings } from './inkGlobals'

/** Writes the shared ink uniforms once per frame. Mount once inside <Canvas>. */
export function InkDriver() {
  const gl = useThree((s) => s.gl)

  useFrame((state) => {
    const dpr = gl.getPixelRatio()
    const canvas = gl.domElement
    inkGlobals.uInkRes.value.set(canvas.width, canvas.height)
    inkGlobals.uInkDpr.value = dpr
    inkGlobals.uInkTime.value = state.clock.elapsedTime
    inkGlobals.uInkPitch.value = Math.max(3, Math.round(inkSettings.pitchCss * dpr))
    inkGlobals.uLensRadius.value = inkSettings.lensRadiusCss * dpr
    inkGlobals.uTracking.value = inkSettings.tracking

    // No cursor reveal: images resolve through scroll, not the pointer.
    inkGlobals.uLensStrength.value = 0
  })
  return null
}
