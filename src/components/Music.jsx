import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react'
import * as THREE from 'three'

const tracks = [
  { id: 1, title: 'Queen St',                  artist: 'Prod. Artist', file: '/music/queen-st.mp3' },
  { id: 2, title: 'Withdrawals',               artist: 'Artist',       file: '/music/withdrawals.mp3' },
  { id: 3, title: 'Who U Callin?',             artist: 'Amani',        file: '/music/who-u-callin.mp3' },
  { id: 4, title: 'Town',                      artist: 'Amani',        file: '/music/town.mp3' },
  { id: 5, title: 'Peace Of Mind',             artist: 'Westin',       file: '/music/peace-of-mind.mp3' },
  { id: 6, title: 'Options (I Got)',           artist: 'Westin',       file: '/music/options.mp3' },
  { id: 7, title: 'Faded',                     artist: 'Artist',       file: '/music/faded.mp3' },
  { id: 8, title: "I'm Gone Be Good (Missin You)", artist: 'Artist',   file: '/music/im-gone-be-good.mp3' },
]

/**
 * The showpiece:
 *  - Web Audio API AnalyserNode → Three.js point-ring + frequency bars
 *  - Vinyl record that spins while playing
 *  - Live frequency-reactive particles and ring geometry
 */
export default function Music() {
  const audioRef = useRef(null)
  const canvasRef = useRef(null)
  const analyserRef = useRef(null)
  const dataArrayRef = useRef(null)
  const audioCtxRef = useRef(null)
  const sourceRef = useRef(null)

  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  // Progress tracker
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => audio.duration && setProgress((audio.currentTime / audio.duration) * 100)
    const onLoad = () => setDuration(audio.duration)
    const onEnd = () => {
      setIsPlaying(false)
      const idx = tracks.findIndex(t => t.id === currentTrack)
      if (idx >= 0 && idx < tracks.length - 1) playTrack(tracks[idx + 1].id)
    }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onLoad)
    audio.addEventListener('ended', onEnd)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onLoad)
      audio.removeEventListener('ended', onEnd)
    }
  }, [currentTrack])

  // Connect audio analyser once on first play
  const ensureAnalyser = () => {
    if (analyserRef.current) return
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const src = ctx.createMediaElementSource(audioRef.current)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    src.connect(analyser)
    analyser.connect(ctx.destination)
    audioCtxRef.current = ctx
    sourceRef.current = src
    analyserRef.current = analyser
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)
  }

  const playTrack = (id) => {
    const track = tracks.find(t => t.id === id)
    const audio = audioRef.current
    if (currentTrack === id && isPlaying) {
      audio.pause()
      setIsPlaying(false)
      return
    }
    if (currentTrack === id) {
      audio.play()
      setIsPlaying(true)
      return
    }
    setCurrentTrack(id)
    setProgress(0)
    setTimeout(() => {
      audio.src = track.file
      audio.play().then(() => {
        ensureAnalyser()
        if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume()
        setIsPlaying(true)
      }).catch(() => {})
    }, 40)
  }

  const skipNext = () => {
    const idx = tracks.findIndex(t => t.id === currentTrack)
    if (idx >= 0 && idx < tracks.length - 1) playTrack(tracks[idx + 1].id)
  }
  const skipPrev = () => {
    const idx = tracks.findIndex(t => t.id === currentTrack)
    if (idx > 0) playTrack(tracks[idx - 1].id)
  }

  const seekTo = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    if (audioRef.current?.duration) {
      audioRef.current.currentTime = pct * audioRef.current.duration
    }
  }

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  // Three.js audio-reactive scene
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const scene = new THREE.Scene()
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    camera.position.z = 5

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height, false)
    renderer.setClearColor(0x000000, 0)

    // Central disc (vinyl face)
    const discGeo = new THREE.CircleGeometry(1.2, 64)
    const discMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0b })
    const disc = new THREE.Mesh(discGeo, discMat)
    scene.add(disc)

    // Vinyl grooves (concentric rings)
    const groovesGroup = new THREE.Group()
    for (let i = 0; i < 12; i++) {
      const r = 0.3 + i * 0.075
      const ring = new THREE.RingGeometry(r, r + 0.003, 128)
      const m = new THREE.MeshBasicMaterial({ color: 0x222228, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
      const mesh = new THREE.Mesh(ring, m)
      groovesGroup.add(mesh)
    }
    scene.add(groovesGroup)

    // Label (center gold)
    const labelGeo = new THREE.CircleGeometry(0.3, 64)
    const labelMat = new THREE.MeshBasicMaterial({ color: 0xc9a84c })
    const label = new THREE.Mesh(labelGeo, labelMat)
    label.position.z = 0.002
    scene.add(label)

    // Spindle hole
    const holeGeo = new THREE.CircleGeometry(0.04, 32)
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x050506 })
    const hole = new THREE.Mesh(holeGeo, holeMat)
    hole.position.z = 0.003
    scene.add(hole)

    // Reactive frequency ring (bars radiating from disc)
    const barCount = 96
    const bars = []
    const barsGroup = new THREE.Group()
    for (let i = 0; i < barCount; i++) {
      const g = new THREE.PlaneGeometry(0.04, 0.3)
      const m = new THREE.MeshBasicMaterial({ color: 0xc9a84c, transparent: true, opacity: 0.9 })
      const mesh = new THREE.Mesh(g, m)
      const angle = (i / barCount) * Math.PI * 2
      mesh.position.set(Math.cos(angle) * 1.5, Math.sin(angle) * 1.5, 0)
      mesh.rotation.z = angle - Math.PI / 2
      barsGroup.add(mesh)
      bars.push({ mesh, angle })
    }
    scene.add(barsGroup)

    // Orbital particles reacting to bass
    const partCount = 300
    const partGeo = new THREE.BufferGeometry()
    const partPos = new Float32Array(partCount * 3)
    const partBase = new Float32Array(partCount * 3)
    for (let i = 0; i < partCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const r = 2 + Math.random() * 2.5
      const x = Math.cos(theta) * r
      const y = Math.sin(theta) * r
      const z = (Math.random() - 0.5) * 0.8
      partPos[i * 3] = x
      partPos[i * 3 + 1] = y
      partPos[i * 3 + 2] = z
      partBase[i * 3] = x
      partBase[i * 3 + 1] = y
      partBase[i * 3 + 2] = z
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3))
    const partMat = new THREE.PointsMaterial({
      color: 0xf2ebda,
      size: 0.025,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const particles = new THREE.Points(partGeo, partMat)
    scene.add(particles)

    const clock = new THREE.Clock()
    let raf

    const render = () => {
      const t = clock.getElapsedTime()
      const analyser = analyserRef.current
      const data = dataArrayRef.current
      let bass = 0
      let mid = 0
      let treble = 0

      if (analyser && data) {
        analyser.getByteFrequencyData(data)
        let s = 0
        for (let i = 0; i < 16; i++) s += data[i]
        bass = s / 16 / 255
        s = 0
        for (let i = 16; i < 64; i++) s += data[i]
        mid = s / 48 / 255
        s = 0
        for (let i = 64; i < data.length; i++) s += data[i]
        treble = s / (data.length - 64) / 255
      }

      // Spin disc + grooves when playing
      const spinSpeed = isPlaying ? 0.6 : 0
      disc.rotation.z -= spinSpeed * 0.016
      groovesGroup.rotation.z -= spinSpeed * 0.016
      label.rotation.z -= spinSpeed * 0.016

      // Reactive bars
      bars.forEach((bar, i) => {
        const freq = data ? data[Math.floor((i / barCount) * data.length)] / 255 : 0
        const targetScale = 1 + (freq * 2.2) + (isPlaying ? 0.1 : 0) + Math.sin(t * 2 + i * 0.3) * 0.05
        bar.mesh.scale.y = THREE.MathUtils.lerp(bar.mesh.scale.y || 1, targetScale, 0.3)
        bar.mesh.position.x = Math.cos(bar.angle) * (1.45 + freq * 0.3)
        bar.mesh.position.y = Math.sin(bar.angle) * (1.45 + freq * 0.3)
        // Color shift based on freq — gold → ember on high
        const color = new THREE.Color().setHSL(0.1 - freq * 0.06, 0.6, 0.4 + freq * 0.3)
        bar.mesh.material.color = color
      })

      // Particles pulse on bass
      const pos = particles.geometry.attributes.position.array
      for (let i = 0; i < partCount; i++) {
        const bx = partBase[i * 3]
        const by = partBase[i * 3 + 1]
        const bz = partBase[i * 3 + 2]
        const pulse = 1 + bass * 0.4 + Math.sin(t * 0.5 + i) * 0.02
        pos[i * 3] = bx * pulse
        pos[i * 3 + 1] = by * pulse
        pos[i * 3 + 2] = bz + Math.sin(t + i * 0.1) * 0.15
      }
      particles.geometry.attributes.position.needsUpdate = true
      particles.rotation.z = t * 0.08 + bass * 0.2

      // Subtle camera sway on mid
      camera.position.x = Math.sin(t * 0.4) * 0.15 + mid * 0.3
      camera.position.y = Math.cos(t * 0.3) * 0.1
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
      raf = requestAnimationFrame(render)
    }
    render()

    const onResize = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
          else obj.material.dispose()
        }
      })
    }
  }, [isPlaying])

  const currentTrackData = tracks.find(t => t.id === currentTrack)

  return (
    <section id="music" className="relative py-28 md:py-44 px-6 md:px-16 overflow-hidden bg-obsidian">
      <audio ref={audioRef} crossOrigin="anonymous" preload="metadata" />

      {/* Watermark */}
      <span className="pointer-events-none absolute -right-10 top-12 font-display text-[22vw] md:text-[16vw] text-ivory/[0.025] leading-none select-none whitespace-nowrap">
        FREQUENCY
      </span>

      <div className="relative max-w-7xl mx-auto">
        {/* Section header */}
        <div className="grid grid-cols-12 items-end gap-8 mb-16 md:mb-24">
          <div className="col-span-12 md:col-span-3">
            <p className="font-mono-hud text-gold mb-3">04 / FREQUENCY</p>
            <p className="font-mono-hud text-silver">MUSIC · PRODUCTION</p>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 className="font-serif text-fluid-big font-light text-ivory leading-none">
              Every beat <span className="italic text-gold">crafted</span> with intention.
            </h2>
          </div>
        </div>

        {/* Main 2-col: 3D visualizer | track list */}
        <div className="grid grid-cols-12 gap-8 md:gap-12 items-start">
          {/* Visualizer + now-playing */}
          <div className="col-span-12 md:col-span-6 space-y-6">
            <div className="relative aspect-square bg-charcoal/40 border border-ivory/10 overflow-hidden">
              <canvas ref={canvasRef} className="w-full h-full block" />

              {/* Center now-playing text */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center px-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentTrackData?.id ?? 'idle'}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.5 }}
                    >
                      <p className="font-mono-hud text-gold mb-2">
                        {currentTrackData ? (isPlaying ? '▶ PLAYING' : '▌ PAUSED') : '○ IDLE'}
                      </p>
                      <p className="font-serif text-lg md:text-2xl italic text-ivory">
                        {currentTrackData?.title || 'Select a track'}
                      </p>
                      <p className="font-mono-hud text-silver mt-2">
                        {currentTrackData?.artist || 'ANALYZER · STANDBY'}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Corner markers */}
              {['top-3 left-3 border-t border-l', 'top-3 right-3 border-t border-r', 'bottom-3 left-3 border-b border-l', 'bottom-3 right-3 border-b border-r'].map((c, i) => (
                <div key={i} className={`absolute w-6 h-6 border-gold/60 ${c}`} />
              ))}

              {/* Top HUD */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 text-center">
                <p className="font-mono-hud text-silver">SPECTRUM · 20Hz — 20kHz</p>
              </div>
            </div>

            {/* Player controls */}
            <div className="p-5 md:p-6 bg-charcoal/60 border border-ivory/10 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="min-w-0">
                  <p className="font-serif text-base md:text-lg text-ivory truncate">
                    {currentTrackData?.title || 'No track selected'}
                  </p>
                  <p className="font-mono-hud text-silver mt-1">
                    {currentTrackData?.artist || '— — — — —'}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={skipPrev}
                    data-cursor="PREV"
                    className="w-9 h-9 flex items-center justify-center border border-ivory/20 text-ivory/70 hover:text-gold hover:border-gold transition-all bg-transparent"
                  >
                    <SkipBack size={14} />
                  </button>
                  <button
                    onClick={() => currentTrack ? playTrack(currentTrack) : playTrack(tracks[0].id)}
                    data-cursor={isPlaying ? 'PAUSE' : 'PLAY'}
                    className="w-11 h-11 flex items-center justify-center bg-gold text-obsidian hover:bg-ivory transition-all border-none rounded-full"
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                  </button>
                  <button
                    onClick={skipNext}
                    data-cursor="NEXT"
                    className="w-9 h-9 flex items-center justify-center border border-ivory/20 text-ivory/70 hover:text-gold hover:border-gold transition-all bg-transparent"
                  >
                    <SkipForward size={14} />
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-3">
                <span className="font-mono-hud text-silver w-10 text-right">
                  {formatTime(audioRef.current?.currentTime)}
                </span>
                <div
                  className="flex-1 h-[2px] bg-ivory/10 relative"
                  data-cursor="SEEK"
                  onClick={seekTo}
                >
                  <div
                    className="h-full bg-gold relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gold" />
                  </div>
                </div>
                <span className="font-mono-hud text-silver w-10">
                  {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>

          {/* Track list */}
          <div className="col-span-12 md:col-span-6">
            <div className="flex items-center justify-between mb-6">
              <p className="font-mono-hud text-silver">CATALOG · {tracks.length} TRACKS</p>
              <p className="font-mono-hud text-silver hidden md:block">CLICK TO PLAY</p>
            </div>
            <ul>
              {tracks.map((track, i) => {
                const active = currentTrack === track.id
                return (
                  <motion.li
                    key={track.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.04 }}
                    onClick={() => playTrack(track.id)}
                    data-cursor={active && isPlaying ? 'PAUSE' : 'PLAY'}
                    className={`group relative grid grid-cols-12 gap-3 items-center border-t border-ivory/10 py-4 md:py-5 transition-colors ${
                      active ? 'bg-gold/[0.05]' : 'hover:bg-ivory/[0.02]'
                    } ${i === tracks.length - 1 ? 'border-b' : ''}`}
                  >
                    <span className={`col-span-2 font-mono-hud transition-colors ${active ? 'text-gold' : 'text-silver group-hover:text-ivory'}`}>
                      {active && isPlaying ? (
                        <span className="flex items-end gap-[2px] h-3 w-6">
                          {[...Array(4)].map((_, k) => (
                            <span key={k} className="w-[2px] bg-gold rounded-full wave-bar" />
                          ))}
                        </span>
                      ) : (
                        String(i + 1).padStart(2, '0')
                      )}
                    </span>
                    <span className={`col-span-7 font-serif text-lg md:text-xl transition-colors leading-tight ${
                      active ? 'text-gold' : 'text-ivory group-hover:text-gold'
                    }`}>
                      {track.title}
                    </span>
                    <span className="col-span-3 font-mono-hud text-silver text-right truncate">
                      {track.artist}
                    </span>
                  </motion.li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
