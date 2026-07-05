import { useEffect, useRef, useState, Suspense, Component } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshDistortMaterial, Environment, Lightformer, Float } from '@react-three/drei'
import { motion } from 'framer-motion'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import * as THREE from 'three'
import Eyebrow from './ui/Eyebrow'
import Reveal from './ui/Reveal'

const tracks = [
  { id: 1, title: 'Queen St', artist: 'Prod. Artist', file: '/music/queen-st.mp3' },
  { id: 2, title: 'Withdrawals', artist: 'Artist', file: '/music/withdrawals.mp3' },
  { id: 3, title: 'Who U Callin?', artist: 'Amani', file: '/music/who-u-callin.mp3' },
  { id: 4, title: 'Town', artist: 'Amani', file: '/music/town.mp3' },
  { id: 5, title: 'Peace Of Mind', artist: 'Westin', file: '/music/peace-of-mind.mp3' },
  { id: 6, title: 'Options (I Got)', artist: 'Westin', file: '/music/options.mp3' },
  { id: 7, title: 'Faded', artist: 'Artist', file: '/music/faded.mp3' },
  { id: 8, title: "I'm Gone Be Good", artist: 'Artist', file: '/music/im-gone-be-good.mp3' },
]

/* The molten-gold sound sculpture — a distorted sphere that swells and
   morphs with the music's amplitude. Calm when idle, alive when playing. */
function SoundOrb({ analyserRef, dataRef }) {
  const mesh = useRef()
  const mat = useRef()
  useFrame((state) => {
    let amp = 0
    if (analyserRef.current && dataRef.current) {
      analyserRef.current.getByteFrequencyData(dataRef.current)
      let s = 0
      for (let i = 0; i < dataRef.current.length; i++) s += dataRef.current[i]
      amp = s / dataRef.current.length / 255
    }
    const t = state.clock.elapsedTime
    if (mesh.current) {
      mesh.current.rotation.y = t * 0.12
      const target = 1 + amp * 0.4
      mesh.current.scale.setScalar(THREE.MathUtils.lerp(mesh.current.scale.x || 1, target, 0.08))
    }
    if (mat.current) {
      mat.current.distort = THREE.MathUtils.lerp(mat.current.distort, 0.22 + amp * 0.65, 0.08)
      mat.current.speed = 1.2 + amp * 3.5
    }
  })
  return (
    <Float speed={1.1} rotationIntensity={0.25} floatIntensity={0.5}>
      <mesh ref={mesh}>
        <sphereGeometry args={[1.35, 160, 160]} />
        <MeshDistortMaterial
          ref={mat}
          color="#c29a3f"
          metalness={1}
          roughness={0.16}
          clearcoat={1}
          clearcoatRoughness={0.1}
          distort={0.22}
          speed={1.2}
          envMapIntensity={1.6}
        />
      </mesh>
    </Float>
  )
}

class OrbBoundary extends Component {
  state = { err: false }
  static getDerivedStateFromError() { return { err: true } }
  render() {
    return this.state.err ? (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2/3 aspect-square rounded-full" style={{ background: 'radial-gradient(circle at 40% 35%, #ecd7a0, #c8a24c 45%, #7c5f2a 100%)', filter: 'blur(2px)' }} />
      </div>
    ) : this.props.children
  }
}

export default function Music() {
  const audioRef = useRef(null)
  const analyserRef = useRef(null)
  const dataRef = useRef(null)
  const ctxRef = useRef(null)
  const srcRef = useRef(null)

  const [current, setCurrent] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => {
      setElapsed(audio.currentTime)
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100)
    }
    const onLoad = () => setDuration(audio.duration)
    const onEnd = () => {
      const idx = tracks.findIndex((t) => t.id === current)
      if (idx >= 0 && idx < tracks.length - 1) play(tracks[idx + 1].id)
      else setPlaying(false)
    }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onLoad)
    audio.addEventListener('ended', onEnd)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onLoad)
      audio.removeEventListener('ended', onEnd)
    }
  }, [current])

  const ensureAnalyser = () => {
    if (analyserRef.current) return
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
    const src = ctx.createMediaElementSource(audioRef.current)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    src.connect(analyser)
    analyser.connect(ctx.destination)
    ctxRef.current = ctx
    srcRef.current = src
    analyserRef.current = analyser
    dataRef.current = new Uint8Array(analyser.frequencyBinCount)
  }

  const play = (id) => {
    const audio = audioRef.current
    const track = tracks.find((t) => t.id === id)
    if (current === id && playing) {
      audio.pause()
      setPlaying(false)
      return
    }
    if (current === id) {
      audio.play()
      setPlaying(true)
      return
    }
    setCurrent(id)
    setProgress(0)
    setElapsed(0)
    setTimeout(() => {
      audio.src = track.file
      audio.play().then(() => {
        ensureAnalyser()
        if (ctxRef.current?.state === 'suspended') ctxRef.current.resume()
        setPlaying(true)
      }).catch(() => {})
    }, 30)
  }

  const step = (dir) => {
    const idx = tracks.findIndex((t) => t.id === current)
    const next = idx < 0 ? 0 : idx + dir
    if (next >= 0 && next < tracks.length) play(tracks[next].id)
  }

  const seek = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - r.left) / r.width
    if (audioRef.current?.duration) audioRef.current.currentTime = pct * audioRef.current.duration
  }

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00'
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  }

  const cur = tracks.find((t) => t.id === current)

  return (
    <section id="music" className="relative py-28 md:py-48 px-6 md:px-16 overflow-hidden bg-obsidian">
      <audio ref={audioRef} crossOrigin="anonymous" preload="none" />

      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-16 md:mb-24">
          <Reveal y={20}><Eyebrow index="III">Music</Eyebrow></Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-7 font-serif font-light text-ivory leading-[0.9] text-[clamp(2.6rem,6vw,5.5rem)]">Sound</h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-12 gap-10 md:gap-16 items-center">
          {/* Sculpture */}
          <div className="col-span-12 md:col-span-5">
            <div className="relative aspect-square">
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 45%, rgba(200,162,76,0.12), transparent 60%)' }} />
              <OrbBoundary>
                <Canvas camera={{ position: [0, 0, 4], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
                  <ambientLight intensity={0.35} />
                  <directionalLight position={[4, 5, 5]} intensity={2.2} color="#fff2d0" />
                  <directionalLight position={[-4, -2, -3]} intensity={0.8} color="#c8a24c" />
                  <Suspense fallback={null}>
                    <SoundOrb analyserRef={analyserRef} dataRef={dataRef} />
                    <Environment resolution={64}>
                      <Lightformer intensity={2.4} color="#fff2d0" position={[0, 2, 4]} scale={5} />
                      <Lightformer intensity={1.2} color="#c8a24c" position={[-3, -1, -2]} scale={4} />
                      <Lightformer intensity={0.8} color="#ffffff" position={[3, 1, 2]} scale={3} />
                    </Environment>
                  </Suspense>
                </Canvas>
              </OrbBoundary>

              {/* now playing caption */}
              <div className="absolute -bottom-2 left-0 right-0 text-center">
                <p className="text-[10px] tracking-[0.4em] uppercase text-silver">
                  {cur ? (playing ? 'Now Playing' : 'Paused') : 'Select a track'}
                </p>
                {cur && <p className="font-serif italic text-gold mt-1">{cur.title}</p>}
              </div>
            </div>
          </div>

          {/* Track list + controls */}
          <div className="col-span-12 md:col-span-7">
            <ul className="mb-8">
              {tracks.map((track, i) => {
                const active = current === track.id
                return (
                  <li key={track.id}>
                    <button
                      onClick={() => play(track.id)}
                      data-cursor={active && playing ? 'PAUSE' : 'PLAY'}
                      className="group w-full grid grid-cols-12 gap-4 items-center border-b border-ivory/[0.07] py-4 md:py-5 text-left transition-colors duration-500 hover:bg-ivory/[0.015]"
                    >
                      <span className={`col-span-1 text-sm tabular-nums transition-colors ${active ? 'text-gold' : 'text-silver'}`}>
                        {active && playing ? (
                          <span className="flex items-end gap-[2px] h-3">
                            <span className="w-[2px] bg-gold wave-bar" />
                            <span className="w-[2px] bg-gold wave-bar" />
                            <span className="w-[2px] bg-gold wave-bar" />
                          </span>
                        ) : (
                          String(i + 1).padStart(2, '0')
                        )}
                      </span>
                      <span className={`col-span-8 md:col-span-8 font-serif text-lg md:text-2xl font-light transition-colors duration-500 leading-tight ${active ? 'text-gold' : 'text-ivory group-hover:text-gold'}`}>
                        {track.title}
                      </span>
                      <span className="col-span-3 text-right text-[10px] md:text-xs tracking-[0.24em] uppercase text-silver">{track.artist}</span>
                    </button>
                  </li>
                )
              })}
            </ul>

            {/* Player */}
            <div className="flex items-center gap-5 border-t border-ivory/[0.08] pt-6">
              <button onClick={() => step(-1)} data-cursor="PREV" className="text-silver hover:text-gold transition-colors"><SkipBack size={16} /></button>
              <button
                onClick={() => (current ? play(current) : play(tracks[0].id))}
                data-cursor={playing ? 'PAUSE' : 'PLAY'}
                className="w-12 h-12 rounded-full border border-gold/50 flex items-center justify-center text-gold hover:bg-gold hover:text-obsidian transition-all duration-500"
              >
                {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
              </button>
              <button onClick={() => step(1)} data-cursor="NEXT" className="text-silver hover:text-gold transition-colors"><SkipForward size={16} /></button>

              <span className="text-[11px] tabular-nums text-silver w-10 text-right">{fmt(elapsed)}</span>
              <div className="flex-1 h-px bg-ivory/15 relative cursor-none" data-cursor="SEEK" onClick={seek}>
                <div className="absolute inset-y-[-4px] left-0 flex items-center" style={{ width: `${progress}%` }}>
                  <div className="w-full h-px bg-gold" />
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-gold" style={{ left: `calc(${progress}% - 3px)` }} />
              </div>
              <span className="text-[11px] tabular-nums text-silver w-10">{fmt(duration)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
