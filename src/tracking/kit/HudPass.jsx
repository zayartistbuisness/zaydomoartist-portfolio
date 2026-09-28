import { useState } from 'react'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Pointer from page coordinates. drei's <Hud> computes it from offsetX/Y of
// whatever DOM element is under the cursor, which breaks when the canvas
// listens on the page root (eventSource) — clicks only land near (0,0).
function compute(event, state) {
  state.pointer.set((event.clientX / state.size.width) * 2 - 1, -(event.clientY / state.size.height) * 2 + 1)
  state.raycaster.setFromCamera(state.pointer, state.camera)
}

function Renderer({ defaultScene, defaultCamera, renderPriority }) {
  useFrame(({ gl, scene, camera }) => {
    if (renderPriority === 1) {
      gl.autoClear = true
      gl.render(defaultScene, defaultCamera)
    }
    gl.autoClear = false
    gl.clearDepth()
    gl.render(scene, camera)
  }, renderPriority)
  return null
}

/**
 * A second scene drawn over the main one (after clearing depth), with its own
 * camera and working pointer events. Drop-in replacement for drei's <Hud>.
 */
export default function HudPass({ children, renderPriority = 1 }) {
  const defaultScene = useThree((s) => s.scene)
  const defaultCamera = useThree((s) => s.camera)
  const [scene] = useState(() => new THREE.Scene())
  return createPortal(
    <>
      {children}
      <Renderer defaultScene={defaultScene} defaultCamera={defaultCamera} renderPriority={renderPriority} />
    </>,
    scene,
    { events: { priority: renderPriority + 1, compute } },
  )
}
