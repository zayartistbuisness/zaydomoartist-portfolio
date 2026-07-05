import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import * as THREE from 'three'

/**
 * Cinematic hero:
 *  - Three.js particle-portrait built from headshot-3.jpg (re-sampled from its luminance)
 *  - Cursor-reactive push force that ripples the point cloud
 *  - Giant broken typography overlay
 *  - No nav; scroll-reveal at bottom
 */
export default function Hero() {
  const mountRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let width = mount.clientWidth
    let height = mount.clientHeight

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x050506, 0.0015)

    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 2000)
    camera.position.set(0, 0, 420)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const mouse = new THREE.Vector2(0, 0)
    const worldMouse = new THREE.Vector3(0, 0, 0)
    const raycaster = new THREE.Raycaster()
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)

    const pointsGroup = new THREE.Group()
    scene.add(pointsGroup)

    // Starfield behind portrait
    const starGeo = new THREE.BufferGeometry()
    const starCount = 800
    const starPositions = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 1200
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 800
      starPositions[i * 3 + 2] = -400 - Math.random() * 400
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
    const starMat = new THREE.PointsMaterial({
      color: 0xf2ebda,
      size: 0.9,
      transparent: true,
      opacity: 0.5,
    })
    const stars = new THREE.Points(starGeo, starMat)
    scene.add(stars)

    let portrait = null
    let basePositions = null

    // Load portrait and build particle cloud
    const loader = new THREE.TextureLoader()
    loader.load('/headshots/headshot-3.jpg', (texture) => {
      const img = texture.image
      const canvas = document.createElement('canvas')
      const targetW = 180
      const aspect = img.height / img.width
      canvas.width = targetW
      canvas.height = Math.round(targetW * aspect)
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data

      const step = 1
      const positions = []
      const colors = []
      const origins = []
      const scale = 3.2
      for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
          const idx = (y * canvas.width + x) * 4
          const r = data[idx] / 255
          const g = data[idx + 1] / 255
          const b = data[idx + 2] / 255
          const lum = 0.299 * r + 0.587 * g + 0.114 * b

          // Keep mostly mid-dark/mid-bright points; skip near-pure white (background)
          if (lum < 0.03 || lum > 0.98) continue
          // Probabilistic density by luminance: darker = denser portrait detail
          const keep = 0.55 + (1 - lum) * 0.45
          if (Math.random() > keep) continue

          const px = (x - canvas.width / 2) * scale
          const py = -(y - canvas.height / 2) * scale
          const pz = (Math.random() - 0.5) * 20
          positions.push(px, py, pz)
          origins.push(px, py, pz)
          // Warm ivory → gold based on luminance
          const c = new THREE.Color().setHSL(0.12, 0.4 + lum * 0.2, 0.3 + lum * 0.55)
          colors.push(c.r, c.g, c.b)
        }
      }

      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
      basePositions = new Float32Array(origins)

      const material = new THREE.PointsMaterial({
        size: 1.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      portrait = new THREE.Points(geometry, material)
      pointsGroup.add(portrait)

      setReady(true)
    })

    // Ambient "ghost" portrait: large sparse particle aura
    const auraGeo = new THREE.BufferGeometry()
    const auraCount = 400
    const auraPositions = new Float32Array(auraCount * 3)
    for (let i = 0; i < auraCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const r = 200 + Math.random() * 300
      auraPositions[i * 3] = Math.cos(theta) * r
      auraPositions[i * 3 + 1] = (Math.random() - 0.5) * 500
      auraPositions[i * 3 + 2] = (Math.random() - 0.5) * 200
    }
    auraGeo.setAttribute('position', new THREE.BufferAttribute(auraPositions, 3))
    const auraMat = new THREE.PointsMaterial({
      color: 0xc9a84c,
      size: 1.4,
      transparent: true,
      opacity: 0.25,
    })
    const aura = new THREE.Points(auraGeo, auraMat)
    scene.add(aura)

    const onMouseMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      raycaster.ray.intersectPlane(plane, worldMouse)
    }
    window.addEventListener('mousemove', onMouseMove)

    const clock = new THREE.Clock()
    let rafId

    const animate = () => {
      const t = clock.getElapsedTime()

      // Gentle breathing rotation on portrait group
      pointsGroup.rotation.y = Math.sin(t * 0.2) * 0.05 + mouse.x * 0.12
      pointsGroup.rotation.x = Math.cos(t * 0.15) * 0.03 - mouse.y * 0.08

      // Ripple effect on portrait by cursor
      if (portrait && basePositions) {
        const pos = portrait.geometry.attributes.position.array
        for (let i = 0; i < pos.length; i += 3) {
          const ox = basePositions[i]
          const oy = basePositions[i + 1]
          const oz = basePositions[i + 2]
          const dx = ox - worldMouse.x
          const dy = oy - worldMouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const push = Math.max(0, 80 - dist) / 80
          const zOffset = push * 60 + Math.sin(t * 2 + ox * 0.01 + oy * 0.01) * 2
          pos[i] = ox + (dx * 0.02) * push
          pos[i + 1] = oy + (dy * 0.02) * push
          pos[i + 2] = oz + zOffset
        }
        portrait.geometry.attributes.position.needsUpdate = true
      }

      // Star drift
      stars.rotation.z = t * 0.01
      aura.rotation.z = -t * 0.03

      renderer.render(scene, camera)
      rafId = requestAnimationFrame(animate)
    }
    animate()

    const onResize = () => {
      width = mount.clientWidth
      height = mount.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
          else obj.material.dispose()
        }
      })
    }
  }, [])

  return (
    <section id="hero" className="relative min-h-screen w-full overflow-hidden bg-obsidian">
      {/* Three.js canvas */}
      <div ref={mountRef} className="absolute inset-0" />

      {/* Dark vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(5,5,6,0.85) 95%)',
      }} />

      {/* Typography overlay — edge-bleeding display type */}
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
        {/* Top meta strip */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: ready ? 1 : 0, y: 0 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="pt-24 md:pt-28 px-6 md:px-16 flex items-start justify-between"
        >
          <div>
            <p className="font-mono-hud text-silver">FILE — 0001</p>
            <p className="font-mono-hud text-ivory mt-1">PORTRAIT / PARTICULATE</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="font-mono-hud text-silver">DOB / 04.01.2004</p>
            <p className="font-mono-hud text-ivory mt-1">EST. 2018</p>
          </div>
        </motion.div>

        {/* Main title block — huge, broken across the frame */}
        <div className="flex-1 flex flex-col justify-center px-6 md:px-16 relative">
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: ready ? 1 : 0, x: 0 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="font-mono-hud text-gold mb-6"
          >
            — ACTOR · PRODUCER · FOUNDER · DIRECTOR —
          </motion.p>

          <div className="relative">
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: ready ? 1 : 0, y: 0 }}
              transition={{ delay: 0.8, duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
              className="font-serif text-fluid-huge font-light tracking-tighter text-ivory leading-[0.85]"
              style={{ textShadow: '0 0 40px rgba(5,5,6,0.9)' }}
            >
              <span className="block">Zay</span>
              <span className="block italic text-gold -mt-2 md:-mt-4" style={{ marginLeft: '8vw' }}>
                "Domo"
              </span>
              <span className="block -mt-2 md:-mt-4">Artist</span>
            </motion.h1>

            {/* vertical ruler accent */}
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: ready ? 1 : 0 }}
              transition={{ delay: 1.2, duration: 1 }}
              className="absolute left-0 top-0 w-[1px] h-full bg-gold/40 origin-top"
            />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: ready ? 1 : 0 }}
            transition={{ delay: 1.6, duration: 1 }}
            className="mt-10 md:mt-16 max-w-lg"
          >
            <p className="font-mono-hud text-silver mb-3">FOSTER CARE → HOLLYWOOD · 2012 — {new Date().getFullYear()}</p>
            <p className="text-bone text-sm md:text-base font-light leading-relaxed">
              Orlando-born. 2,000 films studied. 47 credits logged. One mission —
              build an empire from the rooms nobody watched him in.
            </p>
          </motion.div>
        </div>

        {/* Bottom meta strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: ready ? 1 : 0, y: 0 }}
          transition={{ delay: 2, duration: 1 }}
          className="pb-24 md:pb-28 px-6 md:px-16 flex items-end justify-between gap-8"
        >
          <div className="flex items-center gap-6 pointer-events-auto">
            <a
              href="#signal"
              data-cursor="ENTER"
              className="group flex items-center gap-4"
            >
              <span className="flex items-center justify-center w-12 h-12 rounded-full border border-gold/40 group-hover:border-gold group-hover:bg-gold/5 transition-all">
                <span className="block w-2 h-2 bg-gold rounded-full animate-pulse-glow" />
              </span>
              <span className="font-mono-hud text-ivory group-hover:text-gold transition-colors">
                ENTER TRANSMISSION
              </span>
            </a>
          </div>
          <div className="text-right hidden md:block">
            <p className="font-mono-hud text-silver">LATITUDE · 28.5383° N</p>
            <p className="font-mono-hud text-silver">LONGITUDE · 81.3792° W</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
