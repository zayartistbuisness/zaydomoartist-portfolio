import { useEffect, useRef, useState } from 'react'
import { useWorldMotion } from './WorldMotion'

const REST_X = -0.075
const REST_Y = 0.1
const TURNS = [0, 0.34, -0.34]

function disposeModel(gltf) {
  const resources = new Set()
  const images = new Set()
  for (const scene of gltf?.scenes ?? []) {
    scene.traverse((object) => {
      if (object.geometry) resources.add(object.geometry)
      if (object.skeleton) resources.add(object.skeleton)
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      for (const material of materials) {
        if (!material) continue
        resources.add(material)
        for (const value of Object.values(material)) {
          if (!value?.isTexture) continue
          resources.add(value)
          const image = value.source?.data
          if (typeof image?.close === 'function') images.add(image)
        }
      }
    })
  }
  resources.forEach((resource) => resource.dispose())
  images.forEach((image) => image.close())
}

/**
 * The image remains the accessible content. Three is fetched near the viewport;
 * GPU setup waits until visible, and rendering runs only until a pose settles.
 */
export default function EmblemSculpture() {
  const { still, reduced } = useWorldMotion()
  const rootRef = useRef(null)
  const canvasRef = useRef(null)
  const controlsRef = useRef(null)
  const motionStopped = useRef(still || reduced)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    motionStopped.current = still || reduced
    controlsRef.current?.syncMotion()
  }, [still, reduced])

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    // Older browsers retain the image rather than downloading an eager viewer.
    if (!root || !canvas || typeof IntersectionObserver === 'undefined') return

    const abort = new AbortController()
    const target = { x: REST_X, y: REST_Y }
    let disposed = false
    let failed = false
    let started = false
    let nearby = false
    let visible = false
    let hasDrawn = false
    let frame = 0
    let lastTime = 0
    let turn = 0
    let width = 0
    let height = 0
    let pixelRatio = 0
    let gltf
    let renderer
    let scene
    let camera
    let pivot
    let environment
    let prepareScene
    let nearObserver
    let visibilityObserver
    let resizeObserver

    function stop() {
      cancelAnimationFrame(frame)
      frame = 0
      lastTime = 0
    }

    function release() {
      prepareScene = null
      disposeModel(gltf)
      gltf = null
      if (scene) {
        scene.environment = null
        scene.clear()
      }
      environment?.dispose()
      environment = null
      if (renderer) {
        renderer.dispose()
        if (!renderer.getContext().isContextLost()) renderer.forceContextLoss()
      }
      renderer = scene = camera = pivot = null
    }

    function fail() {
      if (disposed || failed) return
      failed = true
      setReady(false)
      stop()
      abort.abort()
      nearObserver?.disconnect()
      visibilityObserver?.disconnect()
      resizeObserver?.disconnect()
      canvas.removeEventListener('webglcontextlost', contextLost)
      release()
    }

    function requestDraw() {
      if (!disposed && !failed && renderer && visible && !document.hidden && !frame) {
        frame = requestAnimationFrame(draw)
      }
    }

    function draw(time) {
      frame = 0
      if (disposed || failed || !renderer || !visible || document.hidden) return
      try {
        const nextWidth = root.clientWidth
        const nextHeight = root.clientHeight
        if (!nextWidth || !nextHeight) return
        const nextRatio = Math.min(window.devicePixelRatio || 1, 1.5)
        if (width !== nextWidth || height !== nextHeight || pixelRatio !== nextRatio) {
          width = nextWidth
          height = nextHeight
          pixelRatio = nextRatio
          renderer.setPixelRatio(pixelRatio)
          renderer.setSize(width, height, false)
          camera.aspect = width / height
          camera.zoom = Math.min(1, camera.aspect)
          camera.updateProjectionMatrix()
        }

        let moving = false
        if (!motionStopped.current) {
          const seconds = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 1 / 60
          const ease = 1 - Math.exp(-5 * seconds)
          for (const axis of ['x', 'y']) {
            const difference = target[axis] - pivot.rotation[axis]
            if (Math.abs(difference) > 0.0002) {
              pivot.rotation[axis] += difference * ease
              moving = true
            } else {
              pivot.rotation[axis] = target[axis]
            }
          }
        }

        renderer.render(scene, camera)
        if (renderer.getContext().isContextLost()) {
          fail()
          return
        }
        if (!hasDrawn) {
          hasDrawn = true
          setReady(true)
        }
        lastTime = moving ? time : 0
        if (moving) requestDraw()
      } catch {
        fail()
      }
    }

    async function load() {
      if (disposed || failed || started || !nearby || document.hidden) return
      started = true
      nearObserver?.disconnect()
      try {
        const [THREE, { GLTFLoader }, { RoomEnvironment }, response] = await Promise.all([
          import('three'),
          import('three/addons/loaders/GLTFLoader.js'),
          import('three/addons/environments/RoomEnvironment.js'),
          fetch('/world/aperture.glb', { signal: abort.signal }),
        ])
        if (disposed || failed) return
        if (!response.ok) throw new Error('Emblem could not be loaded.')
        const loaded = await new GLTFLoader().parseAsync(await response.arrayBuffer(), '/world/')
        if (disposed || failed) {
          disposeModel(loaded)
          return
        }
        gltf = loaded

        prepareScene = () => {
          renderer = new THREE.WebGLRenderer({
            canvas, alpha: true, antialias: true, powerPreference: 'low-power',
          })
          renderer.setClearColor(0x000000, 0)
          renderer.outputColorSpace = THREE.SRGBColorSpace
          renderer.toneMapping = THREE.ACESFilmicToneMapping
          renderer.toneMappingExposure = 1.1
          renderer.debug.onShaderError = () => {
            throw new Error('Emblem shader could not compile.')
          }
          scene = new THREE.Scene()
          camera = new THREE.PerspectiveCamera(44, 1, 0.1, 20)
          camera.position.set(0.16, 0.12, 5)
          camera.lookAt(0, 0, 0)

          // Blender's glTF axis conversion can put the thin axis on Y.
          // Orient a wrapper, preserving the authored meshes and materials.
          const oriented = new THREE.Group()
          oriented.add(gltf.scene)
          const bounds = new THREE.Box3().setFromObject(oriented)
          const size = bounds.getSize(new THREE.Vector3())
          if (size.y < Math.min(size.x, size.z) * 0.25) {
            oriented.rotation.x = Math.PI / 2
          }
          bounds.setFromObject(oriented)
          bounds.getSize(size)
          const span = Math.max(size.x, size.y)
          if (bounds.isEmpty() || !Number.isFinite(span) || span <= 0) {
            throw new Error('Emblem has no visible geometry.')
          }
          oriented.position.sub(bounds.getCenter(new THREE.Vector3()))
          pivot = new THREE.Group()
          pivot.add(oriented)
          pivot.scale.setScalar(3.2 / span)
          pivot.rotation.set(REST_X, REST_Y, 0)
          scene.add(pivot)

          // Small, local studio reflections let the original metal read as metal.
          const room = new RoomEnvironment()
          let pmrem
          try {
            pmrem = new THREE.PMREMGenerator(renderer)
            environment = pmrem.fromScene(room, 0.04, 0.1, 100, { size: 128 })
            scene.environment = environment.texture
            scene.environmentIntensity = 0.8
          } finally {
            pmrem?.dispose()
            room.dispose()
          }
          scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 1.1))
          const key = new THREE.DirectionalLight(0xffffff, 2.5)
          key.position.set(-3, 4, 5)
          const fill = new THREE.DirectionalLight(0xffffff, 1)
          fill.position.set(4, -1, 3)
          scene.add(key, fill)
        }
        syncVisibility()
      } catch {
        fail()
      }
    }

    function syncVisibility() {
      if (disposed || failed) return
      void load()
      if (!visible || document.hidden) {
        stop()
        return
      }
      if (prepareScene) {
        const prepare = prepareScene
        prepareScene = null
        try {
          prepare()
        } catch {
          fail()
          return
        }
      }
      requestDraw()
    }

    function canInteract() {
      return hasDrawn && !disposed && !failed && visible && !document.hidden && !motionStopped.current
    }

    function move(event) {
      if (!canInteract() || event.pointerType === 'touch' || event.isPrimary === false) return
      const bounds = root.getBoundingClientRect()
      if (!bounds.width || !bounds.height) return
      const x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1))
      const y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1))
      target.x = REST_X + y * 0.1
      target.y = REST_Y + TURNS[turn] + x * 0.16
      requestDraw()
    }

    function leave() {
      if (!canInteract()) return
      target.x = REST_X
      target.y = REST_Y + TURNS[turn]
      requestDraw()
    }

    function contextLost(event) {
      event.preventDefault()
      // Remain on the fallback; do not retry a failing GPU/context automatically.
      fail()
    }

    const controls = {
      turn() {
        if (!canInteract()) return
        turn = (turn + 1) % TURNS.length
        target.x = REST_X
        target.y = REST_Y + TURNS[turn]
        requestDraw()
      },
      syncMotion() {
        stop()
        if (motionStopped.current && pivot) {
          target.x = pivot.rotation.x
          target.y = pivot.rotation.y
        }
        requestDraw()
      },
    }
    controlsRef.current = controls

    nearObserver = new IntersectionObserver(([entry]) => {
      nearby = entry.isIntersecting
      if (nearby) void load()
    }, { rootMargin: '240px 0px', threshold: 0 })
    visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio > 0
      if (visible) nearby = true
      syncVisibility()
    }, { threshold: 0 })
    nearObserver.observe(root)
    visibilityObserver.observe(root)

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(requestDraw)
      resizeObserver.observe(root)
    }
    root.addEventListener('pointermove', move, { passive: true })
    root.addEventListener('pointerleave', leave, { passive: true })
    document.addEventListener('visibilitychange', syncVisibility)
    window.addEventListener('resize', requestDraw, { passive: true })
    canvas.addEventListener('webglcontextlost', contextLost)

    return () => {
      disposed = true
      stop()
      abort.abort()
      nearObserver.disconnect()
      visibilityObserver.disconnect()
      resizeObserver?.disconnect()
      root.removeEventListener('pointermove', move)
      root.removeEventListener('pointerleave', leave)
      document.removeEventListener('visibilitychange', syncVisibility)
      window.removeEventListener('resize', requestDraw)
      canvas.removeEventListener('webglcontextlost', contextLost)
      if (controlsRef.current === controls) controlsRef.current = null
      release()
    }
  }, [])

  return (
    <div ref={rootRef} className="world-sculpture" data-ready={ready ? 'true' : 'false'}>
      <img
        className="world-sculpture__fallback"
        src="/world/aperture-render.webp"
        alt="Original folded-aperture emblem in brushed metal"
        width="640"
        height="640"
        loading="lazy"
        decoding="async"
        style={{ opacity: ready ? 0 : 1 }}
      />
      <canvas
        ref={canvasRef}
        className="world-sculpture__canvas"
        aria-hidden="true"
        style={{ opacity: ready ? 1 : 0, pointerEvents: 'none' }}
      />
      <button
        type="button"
        className="world-sculpture__turn"
        hidden={!ready}
        disabled={!ready || still || reduced}
        onClick={() => controlsRef.current?.turn()}
      >
        Turn the emblem
      </button>
    </div>
  )
}
