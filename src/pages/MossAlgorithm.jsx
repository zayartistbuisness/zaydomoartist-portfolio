import { useState, useEffect, useRef, useMemo, Suspense, Component } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Float, Environment } from '@react-three/drei'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import {
  ArrowLeft, ArrowRight, ArrowUpRight, TrendingUp, Shield, Brain, BarChart3,
  Users, Trophy, Zap, Target, Activity, Leaf, Cpu, BookOpen,
  Landmark, Radio, Globe, Layers, Award, ChevronDown,
} from 'lucide-react'

/* ══════════════════════════════════════════════
   3D COMPONENTS
   ══════════════════════════════════════════════ */

class CanvasErrorBoundary extends Component {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    return this.state.hasError ? (this.props.fallback || null) : this.props.children
  }
}

function MossLogo3D({ scale = 3, spinSpeed = 0.008 }) {
  const { scene } = useGLTF('/models/moss-logo-rotating-opt.glb')
  const ref = useRef()
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#D4BC6E'),
          metalness: 1,
          roughness: 0.08,
          clearcoat: 1,
          clearcoatRoughness: 0.02,
          emissive: new THREE.Color('#5a4620'),
          emissiveIntensity: 0.18,
          side: THREE.DoubleSide,
          envMapIntensity: 1.6,
        })
      }
    })
    return clone
  }, [scene])

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += spinSpeed
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.1
    }
  })

  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.3}>
      <primitive ref={ref} object={clonedScene} scale={scale} />
    </Float>
  )
}

function AutoCamera() {
  const { camera, scene } = useThree()
  useEffect(() => {
    const t = setTimeout(() => {
      const box = new THREE.Box3().setFromObject(scene)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      if (maxDim === 0) return
      const fov = camera.fov * (Math.PI / 180)
      let dist = (maxDim / (2 * Math.tan(fov / 2))) * 1.6
      camera.position.set(center.x, center.y, center.z + dist)
      camera.lookAt(center)
      camera.updateProjectionMatrix()
    }, 100)
    return () => clearTimeout(t)
  }, [camera, scene])
  return null
}

function LogoCanvas({ scale = 3, spinSpeed = 0.008, dpr = [1, 2] }) {
  return (
    <CanvasErrorBoundary fallback={
      <div className="w-full h-full flex items-center justify-center">
        <img src="/moss/leaf-gold.png" alt="MOSS" className="w-2/3 max-w-[300px]" />
      </div>
    }>
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 0, 6], fov: 40 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1.4} color="#fff5d6" />
        <directionalLight position={[-3, 2, 3]} intensity={0.6} color="#C7B06E" />
        <pointLight position={[0, 0, 3]} intensity={0.5} color="#1A472A" />
        <Suspense fallback={null}>
          <Environment preset="sunset" />
          <MossLogo3D scale={scale} spinSpeed={spinSpeed} />
          <AutoCamera />
        </Suspense>
      </Canvas>
    </CanvasErrorBoundary>
  )
}

/* ══════════════════════════════════════════════
   COUNTERS + TYPEWRITER
   ══════════════════════════════════════════════ */
function Counter({ target, suffix = '', prefix = '', duration = 2 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const [started, setStarted] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) setStarted(true) }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [started])
  useEffect(() => {
    if (!started) return
    const steps = 60, inc = target / steps
    let cur = 0
    const timer = setInterval(() => {
      cur += inc
      if (cur >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(cur))
    }, (duration * 1000) / steps)
    return () => clearInterval(timer)
  }, [started, target, duration])
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>
}

/* ══════════════════════════════════════════════
   AMBIENT LEAF PARTICLES
   ══════════════════════════════════════════════ */
function LeafParticles() {
  const particles = useMemo(() => Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    dur: Math.random() * 25 + 15,
    delay: Math.random() * 8,
    op: Math.random() * 0.14 + 0.04,
  })), [])
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, backgroundColor: '#C7B06E' }}
          animate={{ y: [0, -40, 0], x: [0, 15, -10, 0], opacity: [0, p.op, 0] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════
   LIVE PORTFOLIO PHONE MOCK
   ══════════════════════════════════════════════ */
function PhoneDashboard() {
  const [balance, setBalance] = useState(133329.36)
  const [delta, setDelta] = useState(4.28)

  useEffect(() => {
    const id = setInterval(() => {
      setBalance(prev => {
        const swing = (Math.random() - 0.45) * 350
        return Math.max(prev + swing, 100000)
      })
      setDelta(prev => Math.max(-2, Math.min(12, prev + (Math.random() - 0.5) * 0.6)))
    }, 1400)
    return () => clearInterval(id)
  }, [])

  const positions = [
    { m: 'Pistons +11.5',   depth: 'Bedrock', status: 'LIVE',  roi: '+182%' },
    { m: 'Under 218.5 · HOU', depth: 'Bedrock', status: 'CLOSED', roi: '+214%' },
    { m: 'DEN +7 · 2.5u',    depth: 'Author',  status: 'CLOSED', roi: '+156%' },
    { m: 'NYK -2 · 3.2u',    depth: 'Bedrock', status: 'CLOSED', roi: '+198%' },
  ]

  return (
    <div className="relative mx-auto w-[280px] md:w-[320px] aspect-[9/19] rounded-[40px] p-[8px] moss-glow" style={{
      background: 'linear-gradient(145deg, #2a2a2c, #101012)',
      boxShadow: '0 0 0 1px rgba(199,176,110,0.08), 0 40px 80px rgba(0,0,0,0.6), 0 0 60px rgba(199,176,110,0.08)',
    }}>
      {/* screen */}
      <div className="relative w-full h-full rounded-[32px] overflow-hidden" style={{
        background: 'linear-gradient(180deg, #0a1a0e 0%, #14331d 60%, #0a1a0e 100%)',
      }}>
        {/* notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-10" />

        {/* status bar */}
        <div className="relative px-5 pt-3 pb-2 flex items-center justify-between text-[9px] text-[#EFE8D4]/80 font-mono">
          <span>9:41</span>
          <span>●●●</span>
        </div>

        {/* header */}
        <div className="px-5 pt-6">
          <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#C7B06E] mb-1">WELCOME · INTERNET MONEY PIONEER</p>
          <p className="text-[11px] text-[#EFE8D4]/60 mb-3">Your Nature-Backed Portfolio</p>

          {/* balance */}
          <div className="mb-5">
            <p className="text-[10px] text-[#EFE8D4]/50 mb-1">Balance</p>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl md:text-3xl text-[#D4BC6E] tabular-nums">
                ${balance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </span>
            </div>
            <div className={`flex items-center gap-1 mt-1 text-[10px] ${delta >= 0 ? 'text-[#4ade80]' : 'text-[#ff6b6b]'}`}>
              <TrendingUp size={9} />
              <span className="tabular-nums">{delta >= 0 ? '+' : ''}{delta.toFixed(2)}%</span>
              <span className="text-[#EFE8D4]/30">· today</span>
            </div>
          </div>

          {/* sparkline */}
          <div className="h-16 mb-5 relative">
            <svg viewBox="0 0 280 64" className="w-full h-full">
              <defs>
                <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C7B06E" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#C7B06E" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 40 Q 30 48 60 36 T 120 28 Q 150 30 180 20 T 240 12 L 280 16 L 280 64 L 0 64 Z"
                fill="url(#sparkGrad)"
              />
              <path
                d="M0 40 Q 30 48 60 36 T 120 28 Q 150 30 180 20 T 240 12 L 280 16"
                stroke="#C7B06E"
                strokeWidth="1.5"
                fill="none"
              />
              <circle cx="280" cy="16" r="3" fill="#C7B06E" className="moss-breathe" />
            </svg>
          </div>

          {/* positions list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#EFE8D4]/50">Positions · Live</p>
              <span className="block w-1.5 h-1.5 rounded-full bg-[#C7B06E] moss-pulse-ring" />
            </div>
            <div className="space-y-2">
              {positions.map((p, i) => (
                <motion.div
                  key={p.m + i}
                  animate={{ opacity: i === 0 ? [0.7, 1, 0.7] : 1 }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.4 }}
                  className="flex items-center justify-between py-1.5 border-b border-[#C7B06E]/10"
                >
                  <div>
                    <p className="text-[11px] text-[#EFE8D4]">{p.m}</p>
                    <p className="font-mono text-[8px] tracking-[0.15em] uppercase text-[#A3926C] mt-0.5">
                      {p.depth} · {p.status}
                    </p>
                  </div>
                  <span className="text-[10px] text-[#4ade80] tabular-nums">{p.roi}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* bottom navigation bar */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-8">
          {[Leaf, BarChart3, Cpu, Trophy].map((Icon, i) => (
            <Icon key={i} size={13} className={i === 0 ? 'text-[#C7B06E]' : 'text-[#EFE8D4]/30'} />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   LIVE TERMINAL — Conventional vs MOSS
   ══════════════════════════════════════════════ */
function ComparisonTerminals() {
  const [phase, setPhase] = useState(0)
  const [inView, setInView] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting && !inView) setInView(true) }, { threshold: 0.2 })
    if (containerRef.current) obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [inView])

  useEffect(() => {
    if (!inView) return
    const t1 = setTimeout(() => setPhase(1), 2200)
    const t2 = setTimeout(() => setPhase(2), 6500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [inView])

  return (
    <div ref={containerRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Conventional */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="rounded-2xl overflow-hidden border"
        style={{ borderColor: 'rgba(200,60,60,0.18)', backgroundColor: 'rgba(12,14,12,0.88)' }}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/40" />
          <div className="w-3 h-3 rounded-full bg-green-500/40" />
          <span className="ml-3 text-[10px] tracking-[0.2em] uppercase text-[#EFE8D4]/30 font-mono">conventional_model.py</span>
        </div>
        <div className="p-5 md:p-6 font-mono text-xs md:text-sm leading-relaxed min-h-[380px]">
          {inView && (
            <>
              <p className="text-[#EFE8D4]/50 mb-4">
                <span className="text-[#EFE8D4]/25">$</span> analyze <span className="text-[#EFE8D4]/70">--matchup</span> "Pistons vs Celtics" <span className="text-[#EFE8D4]/25">--line</span> CEL -11.5
              </p>
              {phase >= 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                  <p className="text-[#EFE8D4]/20 mb-1">{'>'} Loading season averages...</p>
                  <p className="text-[#EFE8D4]/20 mb-1">{'>'} Processing power ratings...</p>
                  <p className="text-[#EFE8D4]/20 mb-3">{'>'} Calculating +EV...</p>
                  <div className="border-t border-[#EFE8D4]/10 pt-3 mt-3">
                    <p className="mb-2"><span style={{ color: 'rgba(200,100,100,0.7)' }}>RESULT:</span></p>
                    <p className="text-[#EFE8D4]/40 mb-1">Celtics ranked #3 offense (118.2 ORTG)</p>
                    <p className="text-[#EFE8D4]/40 mb-1">Pistons ranked #28 defense (114.8 DRTG)</p>
                    <p className="text-[#EFE8D4]/40 mb-1">Celtics 8-2 ATS as home favorites</p>
                    <p className="text-[#EFE8D4]/40 mb-1">Historical trend: 72% cover rate</p>
                    <p className="text-[#EFE8D4]/40 mb-3">Model spread: CEL -12.3</p>
                    <p className="mb-1">
                      <span style={{ color: 'rgba(200,100,100,0.85)' }}>VERDICT: </span>
                      Celtics -11.5 <span className="text-[#EFE8D4]/30">(+0.8 EV)</span>
                    </p>
                    <p className="text-[#EFE8D4]/25 text-[10px] mt-2">Confidence: 54.2% | Based on aggregates</p>
                    <p className="text-[#EFE8D4]/15 text-[10px] mt-1">// Betting on labels. Betting on ghosts.</p>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* MOSS */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="rounded-2xl overflow-hidden border"
        style={{ borderColor: 'rgba(199,176,110,0.2)', backgroundColor: 'rgba(14,22,16,0.9)' }}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'rgba(199,176,110,0.1)', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(199,176,110,0.6)' }} />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(199,176,110,0.35)' }} />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(199,176,110,0.2)' }} />
          <span className="ml-3 text-[10px] tracking-[0.2em] uppercase font-mono moss-text-gold opacity-50">moss_algorithm.sys</span>
        </div>
        <div className="p-5 md:p-6 font-mono text-xs md:text-sm leading-relaxed min-h-[380px]">
          {inView && (
            <>
              <p className="mb-4" style={{ color: 'rgba(199,176,110,0.55)' }}>
                <span className="text-[#EFE8D4]/25">$</span> moss <span className="moss-text-tan">--sovereign</span> "Pistons vs Celtics" <span className="text-[#EFE8D4]/25">--depth</span> bedrock
              </p>
              {phase >= 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                  <p className="text-[#EFE8D4]/20 mb-1">{'>'} Decomposing to physical collision...</p>
                  <p className="text-[#EFE8D4]/20 mb-1">{'>'} Identifying mechanism divergences...</p>
                  <p className="text-[#EFE8D4]/20 mb-1">{'>'} Tracing to bedrock...</p>
                  <p className="text-[#EFE8D4]/20 mb-3">{'>'} Constructing steel man counter-thesis...</p>
                  <div className="border-t pt-3 mt-3" style={{ borderColor: 'rgba(199,176,110,0.1)' }}>
                    <p className="mb-2"><span className="moss-text-gold">AUTHOR IDENTIFIED:</span></p>
                    <p className="text-[#EFE8D4]/55 mb-1">Cunningham adjusted pull-up release point</p>
                    <p className="text-[#EFE8D4]/55 mb-1">→ Creates trajectory D.White (6'4" WS) cannot</p>
                    <p className="text-[#EFE8D4]/55 mb-1">&nbsp;&nbsp;contest without fouling on closeout</p>
                    <p className="text-[#EFE8D4]/55 mb-1">→ BOS help rotation opens corner 3s</p>
                    <p className="text-[#EFE8D4]/55 mb-1">→ DET corners: 39.2% from those spots</p>
                    <p className="text-[#EFE8D4]/55 mb-3">→ Mechanism compresses margin below 11.5</p>
                    <p className="text-[#EFE8D4]/25 mb-2 text-[10px]">COUNTER-THESIS [STEEL MAN]: BOS switch scheme adapts</p>
                    <p className="text-[#EFE8D4]/25 mb-3 text-[10px]">→ Dismissed: secondary options too slow laterally</p>
                    <p className="mb-1">
                      <span className="moss-text-gold">VERDICT: </span>
                      <span className="text-[#EFE8D4]/80">Pistons +11.5</span> <span className="moss-text-tan">(MECHANISM: INEVITABLE)</span>
                    </p>
                    <p className="text-[#EFE8D4]/25 text-[10px] mt-2">Depth: Bedrock | Author: Cunningham release geometry</p>
                    <p className="text-[10px] mt-1" style={{ color: 'rgba(199,176,110,0.4)' }}>// Physics. Not probability.</p>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   LIVE TICKER
   ══════════════════════════════════════════════ */
function LiveTicker() {
  const items = [
    { type: 'alert',  text: 'AUTHOR IDENTIFIED — MIL vs PHI → PHI +4.5 (MECHANISM: INEVITABLE)' },
    { type: 'win',    text: 'POSITION DEPLOYED: 3.2u → NYK -2 | Depth: Bedrock | Status: WIN' },
    { type: 'reject', text: 'MARKET REJECTED: LAL vs GSW — Counter-thesis unresolved. NO BET.' },
    { type: 'alert',  text: 'MECHANISM DIVERGENCE — BUF vs MIA → BUF -3 (AUTHOR: Interior twist stunts)' },
    { type: 'win',    text: 'POSITION CLOSED: 2.5u → DEN +7 | Author: Altitude fatigue cascade | WIN' },
    { type: 'reject', text: 'TRAP DETECTED: CHI vs CLE — Line suspiciously attractive. PASS.' },
    { type: 'alert',  text: 'BEDROCK VERIFIED — HOU vs DAL → Under 218.5 (Scheme collision)' },
    { type: 'win',    text: 'POSITION DEPLOYED: 4.0u → TB +3 | Depth: Bedrock | Status: WIN' },
  ]
  const doubled = [...items, ...items]
  return (
    <div className="relative overflow-hidden py-4 border-y" style={{ borderColor: 'rgba(199,176,110,0.1)', backgroundColor: 'rgba(0,0,0,0.35)' }}>
      <div className="flex animate-marquee" style={{ width: 'max-content', animationDuration: '60s' }}>
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-3 mx-8 whitespace-nowrap">
            <div
              className={`w-1.5 h-1.5 rounded-full ${item.type === 'win' ? 'bg-green-500' : item.type === 'reject' ? 'bg-red-400/60' : 'moss-pulse-ring'}`}
              style={item.type === 'alert' ? { backgroundColor: '#C7B06E' } : {}}
            />
            <span
              className="font-mono text-[10px] md:text-xs tracking-wide"
              style={{
                color: item.type === 'win' ? 'rgba(74,222,128,0.7)'
                  : item.type === 'reject' ? 'rgba(220,120,120,0.45)'
                  : 'rgba(199,176,110,0.6)',
              }}
            >{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MOSS ECOSYSTEM CARDS
   ══════════════════════════════════════════════ */
function Ecosystem() {
  const products = [
    {
      name: 'MOSS Algorithm', status: 'LIVE', statusColor: '#4ade80', icon: Cpu,
      desc: 'The sovereign intelligence. Mechanism-based sports market analysis that sees what aggregate models structurally cannot.', glow: true,
    },
    {
      name: 'MOSS Analytics', status: 'COMING SOON', statusColor: '#C7B06E', icon: BarChart3,
      desc: 'Real-time data visualization. The trading floor for sports markets — live mechanism tracking, Author identification feeds, and position management.',
    },
    {
      name: 'MOSS Academy', status: 'IN DEVELOPMENT', statusColor: '#A3926C', icon: BookOpen,
      desc: 'Master the methodology. From aggregate thinking to sovereign analysis. Transforming how the next generation understands sports markets.',
    },
    {
      name: 'MOSS Capital', status: 'FUTURE', statusColor: 'rgba(199,176,110,0.4)', icon: Landmark,
      desc: 'The investment vehicle. Deploying institutional capital through the inevitability framework. Fund structure for accredited investors.',
    },
  ]
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {products.map((p, i) => (
        <motion.div
          key={p.name}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -6, transition: { duration: 0.3 } }}
          className="relative p-8 md:p-10 rounded-2xl border overflow-hidden"
          style={{
            borderColor: p.glow ? 'rgba(199,176,110,0.28)' : 'rgba(199,176,110,0.08)',
            backgroundColor: 'rgba(15,28,18,0.6)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="absolute top-0 left-0 w-full h-[1px]" style={{
            background: `linear-gradient(to right, transparent, ${p.statusColor}70, transparent)`,
          }} />
          {p.glow && (
            <div className="absolute top-0 right-0 w-32 h-32" style={{
              background: 'radial-gradient(circle at top right, rgba(74,222,128,0.08), transparent 70%)',
            }} />
          )}
          <div className="flex items-center justify-between mb-6">
            <p.icon size={24} className="moss-text-gold opacity-80" />
            <div className="flex items-center gap-2">
              {p.glow && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase" style={{ color: p.statusColor }}>
                {p.status}
              </span>
            </div>
          </div>
          <h3 className="font-serif text-2xl md:text-3xl italic font-light mb-3 text-[#EFE8D4]">{p.name}</h3>
          <p className="text-[#EFE8D4]/50 text-sm leading-relaxed font-light">{p.desc}</p>
        </motion.div>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════
   TOP NAVIGATION
   ══════════════════════════════════════════════ */
function MossNav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.8 }}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
        scrolled ? 'bg-[#0a1a0e]/80 backdrop-blur-md border-b moss-border-gold-soft' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 md:h-20 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase text-[#EFE8D4]/70 hover:text-[#C7B06E] transition-colors font-mono">
          <ArrowLeft size={13} />
          zaydomo.com
        </Link>

        <div className="flex items-center gap-2">
          <img src="/moss/leaf-gold.png" alt="MOSS" className="w-6 h-6 md:w-7 md:h-7 object-contain" />
          <span className="font-serif text-lg md:text-xl tracking-[0.2em] text-[#EFE8D4]">MOSS</span>
        </div>

        <a
          href="https://whop.com/moss-algorithm"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] tracking-[0.25em] uppercase font-medium moss-cta-button"
        >
          Join Community
          <ArrowRight size={12} />
        </a>
      </div>
    </motion.nav>
  )
}

/* ══════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════ */
export default function MossAlgorithm() {
  const [splashPhase, setSplashPhase] = useState('iris')
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.12], [1, 0.96])

  useEffect(() => {
    window.scrollTo(0, 0)
    const t1 = setTimeout(() => setSplashPhase('text'), 1600)
    const t2 = setTimeout(() => setSplashPhase('done'), 3400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const pillars = [
    {
      num: '01',
      icon: Target,
      title: 'The Law of Bedrock',
      desc: 'Traditional models deal in abstractions — "elite defense," "strong offense." MOSS translates every matchup to irreducible physical reality: release points, wingspan geometries, velocity degradation, scheme collisions. We do not bet on labels. We bet on measurable physics.',
    },
    {
      num: '02',
      icon: Brain,
      title: 'Identifying The Author',
      desc: 'Games are not decided by who wins the most statistical categories. They are decided by a single dominant mechanism that writes the script. MOSS strips away noise to identify The Author — a pass-rush mismatch, a scheme collision, a fatigue cascade the market failed to capture.',
    },
    {
      num: '03',
      icon: Shield,
      title: 'Adversarial Architecture',
      desc: 'Before any capital is deployed, MOSS generates the strongest possible counter-thesis — a Steel Man argument for the opposing side. It rigorously attempts to destroy its own thesis. Only when a mechanical thesis survives does MOSS issue a deployment directive.',
    },
    {
      num: '04',
      icon: Activity,
      title: 'The No-Bet Default',
      desc: 'Vegas wins on volume. MOSS inverts this — its default state is inaction. It analyzes thousands of market lines and rejects 99%. It only fires when an irrefutable mechanism divergence is identified.',
    },
  ]

  const opportunities = [
    { icon: Globe,  title: '$150B+ Global Sports Betting Market', desc: 'Growing 10%+ annually. Every participant uses the same aggregate tools. MOSS is the only mechanism-level intelligence operating at scale.' },
    { icon: Layers, title: 'Algorithm Proven. Now Scaling the Ecosystem.', desc: 'MOSS Algorithm established the methodology and the returns. Analytics, Academy, and Capital represent the platform expansion — each multiplying the value of the core intelligence.' },
    { icon: Zap,    title: 'First-Mover in Mechanism-Based Analysis', desc: 'Competitors build better calculators. Better aggregate models. Nobody else is building a deeper lens. MOSS owns the category it created.' },
    { icon: Radio,  title: 'Analytics Platform Entering Beta', desc: 'The real-time visualization layer is in development. Early investors are getting in at the ground floor — before the platform launch transforms MOSS from an algorithm into a trading terminal.' },
  ]

  return (
    <div className="moss-page min-h-screen overflow-x-hidden relative">
      <LeafParticles />

      {/* ═══ SPLASH — IRIS REVEAL ═══ */}
      <AnimatePresence>
        {splashPhase !== 'done' && (
          <motion.div
            key="splash"
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none moss-iris-mask"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1] } }}
            style={{
              background: splashPhase === 'iris'
                ? 'radial-gradient(circle at center, transparent 0%, #0a1a0e 8%, #0a1a0e 100%)'
                : 'radial-gradient(circle at center, transparent 0%, transparent 30%, #0a1a0e 100%)',
            }}
          >
            <AnimatePresence>
              {splashPhase === 'text' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center"
                >
                  <img src="/moss/leaf-gold.png" alt="" className="w-14 h-14 mx-auto mb-6 opacity-90" />
                  <p className="font-mono text-[10px] tracking-[0.5em] uppercase moss-text-tan mb-3">NATURE · BACKED · INTELLIGENCE</p>
                  <h1 className="font-serif text-5xl md:text-7xl text-[#EFE8D4] italic font-light tracking-tight">
                    MOSS
                  </h1>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ NAVIGATION ═══ */}
      <MossNav />

      {/* ═══ HERO ═══ */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center overflow-hidden pt-20 md:pt-24"
      >
        {/* ambient bg glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/4 right-0 w-[900px] h-[900px] opacity-40 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(199,176,110,0.15), transparent 60%)' }}
          />
          <div
            className="absolute bottom-0 left-0 w-[800px] h-[800px] opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(26,71,42,0.4), transparent 60%)' }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 md:px-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left copy */}
          <div className="lg:col-span-7 relative z-10">
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.8, duration: 0.8 }}
              className="font-mono text-[10px] tracking-[0.5em] uppercase moss-text-gold mb-6 flex items-center gap-3"
            >
              <span className="inline-block w-6 h-[1px] bg-[#C7B06E]" />
              Founded by Zay "Domo" Artist
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 4, duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
              className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-[6.5rem] font-light leading-[0.95] tracking-tight text-[#EFE8D4]"
            >
              Nature-backed
              <span className="block italic moss-text-gold-gradient">wealth intelligence.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 4.4, duration: 0.9 }}
              className="text-[#EFE8D4]/60 text-base md:text-lg font-light leading-relaxed max-w-xl mt-8"
            >
              MOSS is the sovereign intelligence behind the largest mechanism-based sports analysis community on the market. Not a calculator. Not a tip service. A deeper lens — pricing physics while everyone else prices probability.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 4.8, duration: 0.8 }}
              className="mt-12 flex flex-wrap items-center gap-4"
            >
              <a
                href="https://whop.com/moss-algorithm"
                target="_blank"
                rel="noopener noreferrer"
                className="moss-cta-button inline-flex items-center gap-3 px-8 py-4 rounded-full text-xs tracking-[0.25em] uppercase font-medium"
              >
                Join the Community
                <ArrowRight size={14} />
              </a>
              <a
                href="#manifesto"
                className="inline-flex items-center gap-3 px-6 py-4 rounded-full border moss-border-gold text-[10px] tracking-[0.25em] uppercase text-[#EFE8D4]/80 hover:text-[#C7B06E] hover:border-[#C7B06E] transition-all font-mono"
              >
                Read the Manifesto
              </a>
            </motion.div>

            {/* Credentials row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 5.4, duration: 1 }}
              className="mt-14 pt-8 border-t moss-border-gold-soft grid grid-cols-3 gap-4 max-w-xl"
            >
              {[
                { k: '450%', v: 'Annual ROI' },
                { k: '15K+',  v: 'Members' },
                { k: '#1',   v: 'On Whop' },
              ].map((s) => (
                <div key={s.v}>
                  <p className="font-serif text-3xl md:text-4xl moss-text-gold-gradient font-light">{s.k}</p>
                  <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#EFE8D4]/40 mt-1">{s.v}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — 3D leaf */}
          <div className="lg:col-span-5 relative h-[420px] md:h-[560px] w-full">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute w-[320px] h-[320px] md:w-[440px] md:h-[440px] rounded-full opacity-60 blur-3xl" style={{
                background: 'radial-gradient(circle, rgba(199,176,110,0.25), transparent 60%)',
              }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <LogoCanvas scale={3.4} />
              </div>
              {/* Orbit rings */}
              <svg className="absolute inset-0 w-full h-full animate-spin-slow pointer-events-none" viewBox="0 0 400 400" style={{ animationDuration: '80s' }}>
                <circle cx="200" cy="200" r="160" stroke="rgba(199,176,110,0.12)" strokeWidth="1" fill="none" strokeDasharray="4 8" />
                <circle cx="200" cy="200" r="120" stroke="rgba(199,176,110,0.08)" strokeWidth="1" fill="none" />
              </svg>
              {/* Orbit ticks with labels */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 font-mono text-[9px] tracking-[0.4em] uppercase moss-text-tan opacity-60">MOSS · CORE</div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-[9px] tracking-[0.4em] uppercase moss-text-tan opacity-60">BEDROCK · LIVE</div>
            </div>
          </div>
        </div>

        {/* scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 6, 0] }}
          transition={{ opacity: { delay: 6, duration: 1 }, y: { delay: 6, duration: 2, repeat: Infinity } }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-[#EFE8D4]/40">SCROLL</span>
          <ChevronDown size={14} className="text-[#EFE8D4]/40" />
        </motion.div>
      </motion.section>

      {/* ═══ LIVE TICKER ═══ */}
      <LiveTicker />

      {/* ═══ MANIFESTO ═══ */}
      <section id="manifesto" className="relative py-28 md:py-40 px-6 md:px-12 z-10">
        <div className="max-w-5xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="font-mono text-[10px] tracking-[0.5em] uppercase moss-text-gold mb-8 flex items-center gap-3"
          >
            <span className="inline-block w-8 h-[1px] bg-[#C7B06E]" />
            01 — Manifesto
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.9 }}
            className="font-serif text-4xl md:text-6xl lg:text-7xl text-[#EFE8D4] leading-[1.05] font-light mb-16"
          >
            We do not ask <span className="italic moss-text-gold-gradient">what is probable.</span><br/>
            We ask what is <span className="italic moss-text-gold-gradient">inevitable.</span>
          </motion.h2>

          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16"
          >
            <p className="text-[#EFE8D4]/75 text-base md:text-lg leading-relaxed font-light moss-dropcap">
              Conventional models assume a team in Week 10 is the same organism as Week 3. They apply rolling averages. They smooth variance. They price historical profiles rather than the specific physical realities of the humans playing tonight. When they lose, they blame variance.
            </p>
            <p className="text-[#EFE8D4]/75 text-base md:text-lg leading-relaxed font-light">
              MOSS sees what they cannot. We ask: what specific physical or schematic mechanism makes the outcome <em className="moss-text-leaf">inevitable</em>? We wait for the collisions where the market is blind to physical reality, and we strike with precision. This is not gambling. It is the surgical extraction of capital from a market that prices averages.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        <div className="h-[1px] w-full" style={{ background: 'linear-gradient(to right, transparent, rgba(199,176,110,0.25), transparent)' }} />
      </div>

      {/* ═══ PILLARS ═══ */}
      <section id="pillars" className="relative py-28 md:py-40 px-6 md:px-12 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 md:mb-28 grid grid-cols-12 items-end gap-8">
            <div className="col-span-12 md:col-span-4">
              <p className="font-mono text-[10px] tracking-[0.5em] uppercase moss-text-gold mb-4">02 — Methodology</p>
              <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#EFE8D4]/40">Four pillars · one lens</p>
            </div>
            <h2 className="col-span-12 md:col-span-8 font-serif text-4xl md:text-6xl font-light text-[#EFE8D4] leading-[0.98]">
              A different <span className="italic moss-text-gold-gradient">depth</span> of understanding.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {pillars.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.8 }}
                className="relative p-8 md:p-10 border moss-border-gold-soft rounded-2xl group hover:border-[#C7B06E]/40 transition-all duration-500"
                style={{ backgroundColor: 'rgba(14,28,18,0.4)' }}
              >
                <div className="flex items-start justify-between mb-6">
                  <span className="font-mono text-[10px] tracking-[0.4em] uppercase moss-text-tan">{p.num}</span>
                  <p.icon size={22} className="moss-text-gold opacity-70 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="font-serif text-2xl md:text-3xl italic text-[#EFE8D4] font-light mb-4">{p.title}</h3>
                <p className="text-[#EFE8D4]/55 text-sm md:text-[15px] font-light leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PHONE DASHBOARD ═══ */}
      <section id="dashboard" className="relative py-28 md:py-40 px-6 md:px-12 z-10 overflow-hidden">
        {/* Growth hero backdrop */}
        <div className="absolute inset-0 opacity-[0.12] pointer-events-none">
          <img src="/moss/growth-hero.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a1a0e] via-transparent to-[#0a1a0e]" />
        </div>

        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <p className="font-mono text-[10px] tracking-[0.5em] uppercase moss-text-gold mb-4">03 — Platform</p>
            <h2 className="font-serif text-4xl md:text-6xl font-light text-[#EFE8D4] leading-[0.98] mb-6">
              Your nature-backed<br/>
              <span className="italic moss-text-gold-gradient">portfolio.</span>
            </h2>
            <p className="text-[#EFE8D4]/65 text-base md:text-lg font-light leading-relaxed max-w-xl mb-8">
              A clean, monastic interface for a brutal intelligence. Live-ticking balance, mechanism-verified positions, and Author identification feeds — all in a calm, intentional design that makes the work visible.
            </p>
            <ul className="space-y-4 mb-10">
              {[
                'Live mechanism feeds · positions update in real time',
                'Bedrock-depth analysis on every active line',
                'Steel-man counter-thesis displayed beside every verdict',
                'Position history · WIN / CLOSED / PASS color-coded',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[#EFE8D4]/70 text-[15px] font-light">
                  <Leaf size={14} className="mt-1 moss-text-gold shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <a
              href="https://whop.com/moss-algorithm"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 text-[#C7B06E] hover:text-[#EFE8D4] font-mono text-[11px] tracking-[0.3em] uppercase transition-colors"
            >
              Access the platform
              <ArrowUpRight size={14} />
            </a>
          </div>
          <div className="lg:col-span-6 order-1 lg:order-2 flex justify-center">
            <PhoneDashboard />
          </div>
        </div>
      </section>

      {/* ═══ COMPARISON TERMINALS ═══ */}
      <section id="difference" className="relative py-28 md:py-40 px-6 md:px-12 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 md:mb-24">
            <p className="font-mono text-[10px] tracking-[0.5em] uppercase moss-text-gold mb-4">04 — Difference</p>
            <h2 className="font-serif text-4xl md:text-6xl font-light text-[#EFE8D4] leading-[0.98] mb-5">
              Same game. Same data.<br/>
              Two <span className="italic moss-text-gold-gradient">depths.</span>
            </h2>
            <p className="text-[#EFE8D4]/50 text-sm md:text-base font-light max-w-2xl">
              Watch the conventional model apply aggregate statistics to ghosts. Watch MOSS decompose the same matchup to bedrock-level physics.
            </p>
          </div>
          <ComparisonTerminals />
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how" className="relative py-28 md:py-40 px-6 md:px-12 z-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-20">
            <p className="font-mono text-[10px] tracking-[0.5em] uppercase moss-text-gold mb-4">05 — Process</p>
            <h2 className="font-serif text-4xl md:text-6xl font-light text-[#EFE8D4] leading-[0.98] mb-5">
              How <span className="italic moss-text-gold-gradient">it works.</span>
            </h2>
            <p className="text-[#EFE8D4]/50 text-sm md:text-base font-light max-w-2xl">
              While conventional models process thousands of data points to find tiny inefficiencies, MOSS operates at the mechanism level — where the market is structurally blind.
            </p>
          </div>
          <div className="relative">
            <div className="absolute left-6 md:left-8 top-0 bottom-0 w-[1px]" style={{
              background: 'linear-gradient(to bottom, rgba(199,176,110,0.35), rgba(199,176,110,0.05), transparent)',
            }} />
            {[
              { step: '01', title: 'Mechanism Investigation', desc: 'MOSS does not see "Team A vs Team B." It sees a physical collision between specific humans in a specific environment under specific constraints. Every matchup is decomposed to irreducible physical and psychological realities.', icon: Zap },
              { step: '02', title: 'Author Identification', desc: 'Every game has a single dominant mechanism that writes the script. MOSS strips noise — rankings, narratives, season averages — to isolate The Author. If The Author cannot be identified with certainty, the game is a pass.', icon: Target },
              { step: '03', title: 'Counter-Thesis Destruction', desc: 'MOSS constructs the strongest possible Steel Man argument for the opposing side. It rigorously attempts to kill its own thesis. Only when the mechanical thesis survives — when the outcome feels inevitable — does capital deploy.', icon: Shield },
              { step: '04', title: 'Precision Deployment', desc: 'MOSS rejects 99% of lines. It denies sportsbooks their volume, starving the vig. When it fires, it strikes at the exact market that most purely isolates the identified mechanism — with conviction born from depth, not hope.', icon: Brain },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.7 }}
                className="relative pl-16 md:pl-20 mb-16 last:mb-0"
              >
                <div
                  className="absolute left-3 md:left-5 top-1 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(26,71,42,0.35)', border: '1px solid rgba(199,176,110,0.35)' }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#C7B06E', boxShadow: '0 0 10px rgba(199,176,110,0.5)' }} />
                </div>
                <p className="font-mono text-[10px] tracking-[0.5em] uppercase moss-text-tan mb-3">{item.step}</p>
                <div className="flex items-center gap-3 mb-3">
                  <item.icon size={18} className="moss-text-gold" />
                  <h3 className="font-serif text-xl md:text-2xl italic text-[#EFE8D4] font-light">{item.title}</h3>
                </div>
                <p className="text-[#EFE8D4]/50 text-[15px] leading-relaxed font-light max-w-2xl">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ STATS WALL ═══ */}
      <section id="stats" className="relative py-28 md:py-40 px-6 md:px-12 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <p className="font-mono text-[10px] tracking-[0.5em] uppercase moss-text-gold mb-4">06 — Track Record</p>
            <h2 className="font-serif text-4xl md:text-6xl font-light text-[#EFE8D4] leading-[0.98]">
              Numbers do not <span className="italic moss-text-gold-gradient">lie.</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 border-y moss-border-gold-soft">
            {[
              { value: 450, suffix: '%',  label: 'Annual ROI',        icon: TrendingUp },
              { value: 70,  suffix: '%',  label: 'Verified Win Rate', icon: Target },
              { value: 15000, suffix: '+', label: 'Active Members',    icon: Users },
              { value: 1,   prefix: '#',  label: 'Ranked on Whop',    icon: Trophy },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.8 }}
                className={`py-14 md:py-20 px-6 md:px-8 ${i !== 3 ? 'md:border-r moss-border-gold-soft' : ''} ${i % 2 === 0 && i !== 2 ? 'border-r md:border-r moss-border-gold-soft' : ''}`}
              >
                <s.icon size={18} className="moss-text-gold mb-4 opacity-80" />
                <p className="font-serif text-4xl md:text-6xl font-light moss-text-gold-gradient leading-none">
                  <Counter target={s.value} suffix={s.suffix || ''} prefix={s.prefix || ''} />
                </p>
                <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#EFE8D4]/50 mt-3">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ECOSYSTEM ═══ */}
      <section id="ecosystem" className="relative py-28 md:py-40 px-6 md:px-12 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-20">
            <p className="font-mono text-[10px] tracking-[0.5em] uppercase moss-text-gold mb-4">07 — Ecosystem</p>
            <h2 className="font-serif text-4xl md:text-6xl font-light text-[#EFE8D4] leading-[0.98] mb-5">
              Not a product. <span className="italic moss-text-gold-gradient">A platform.</span>
            </h2>
            <p className="text-[#EFE8D4]/50 text-sm md:text-base font-light max-w-2xl">
              MOSS is an expanding platform — tools, education, and capital deployment, all built on the same mechanism-level intelligence.
            </p>
          </div>
          <Ecosystem />
        </div>
      </section>

      {/* ═══ WHY NOW ═══ */}
      <section id="why-now" className="relative py-28 md:py-40 px-6 md:px-12 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-20">
            <p className="font-mono text-[10px] tracking-[0.5em] uppercase moss-text-gold mb-4">08 — Inflection</p>
            <h2 className="font-serif text-4xl md:text-6xl font-light text-[#EFE8D4] leading-[0.98] mb-5">
              Why <span className="italic moss-text-gold-gradient">now.</span>
            </h2>
            <p className="text-[#EFE8D4]/50 text-sm md:text-base font-light max-w-2xl">
              The algorithm is proven. The returns are documented. The ecosystem is expanding. This is the ground floor.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {opportunities.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.7 }}
                className="flex gap-5 p-6 border moss-border-gold-soft rounded-xl hover:border-[#C7B06E]/30 transition-all duration-500"
                style={{ backgroundColor: 'rgba(14,28,18,0.4)' }}
              >
                <div
                  className="flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(26,71,42,0.35)', border: '1px solid rgba(199,176,110,0.2)' }}
                >
                  <item.icon size={18} className="moss-text-gold" />
                </div>
                <div>
                  <h4 className="font-serif text-xl italic text-[#EFE8D4] mb-2 font-light">{item.title}</h4>
                  <p className="text-[#EFE8D4]/55 text-sm leading-relaxed font-light">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOUNDER'S NOTE ═══ */}
      <section id="founder" className="relative py-28 md:py-40 px-6 md:px-12 z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="font-mono text-[10px] tracking-[0.5em] uppercase moss-text-gold mb-6"
          >
            09 — Founder's Note
          </motion.p>
          <motion.blockquote
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
            className="font-serif text-2xl md:text-4xl lg:text-5xl italic text-[#EFE8D4] leading-[1.2] font-light"
          >
            "I built MOSS because the market was pricing averages and I was seeing specifics. One mechanism. One collision. One inevitable outcome. <span className="moss-text-gold-gradient">The edge was always there</span> — the world just needed a deeper lens."
          </motion.blockquote>
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-12 inline-flex items-center gap-4"
          >
            <div className="w-14 h-[1px] bg-[#C7B06E]/40" />
            <div className="text-left">
              <p className="font-serif italic text-2xl text-[#EFE8D4]">Zay "Domo" Artist</p>
              <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#EFE8D4]/40 mt-1">Founder · MOSS Algorithm</p>
            </div>
            <div className="w-14 h-[1px] bg-[#C7B06E]/40" />
          </motion.div>
        </div>
      </section>

      {/* ═══ INVESTOR / SOVEREIGN CTA ═══ */}
      <section id="invest" className="relative py-36 md:py-48 px-6 md:px-12 z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
            className="relative p-12 md:p-20 rounded-3xl overflow-hidden moss-glow"
            style={{
              border: '1px solid rgba(199,176,110,0.22)',
              background: 'linear-gradient(to bottom, rgba(26,71,42,0.18), rgba(10,26,14,0.4))',
            }}
          >
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[1px]"
              style={{ background: 'linear-gradient(to right, transparent, rgba(199,176,110,0.5), transparent)' }}
            />
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[250px] h-[80px] blur-3xl"
              style={{ backgroundColor: 'rgba(199,176,110,0.1)' }}
            />

            <img src="/moss/leaf-gold.png" alt="" className="w-12 h-12 mx-auto mb-8 moss-breathe" />
            <p className="font-mono text-[10px] tracking-[0.5em] uppercase moss-text-tan mb-8">Sovereign Access</p>
            <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl font-light mb-6 leading-[1] text-[#EFE8D4]">
              Invest in<br/><span className="italic moss-text-gold-gradient">inevitability.</span>
            </h2>
            <p className="text-[#EFE8D4]/55 text-base md:text-lg font-light max-w-xl mx-auto mb-12 leading-relaxed">
              MOSS is the surgical extraction of capital from a market that prices averages — built by an intelligence that prices specifics. Not a better calculator. A deeper lens.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="https://whop.com/moss-algorithm"
                target="_blank"
                rel="noopener noreferrer"
                className="moss-cta-button inline-flex items-center gap-3 px-8 py-4 rounded-full text-xs tracking-[0.25em] uppercase font-medium"
              >
                <Award size={14} />
                Join the Community
              </a>
              <a
                href="mailto:contact@zaydomo.com"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full border moss-border-gold text-[10px] tracking-[0.25em] uppercase text-[#EFE8D4]/80 hover:text-[#C7B06E] hover:border-[#C7B06E] transition-all font-mono"
              >
                Request Investor Deck
                <ArrowUpRight size={12} />
              </a>
            </div>
            <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#EFE8D4]/25 mt-10">
              Accredited investors only · Past performance does not guarantee future results.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 pt-12 pb-8 px-6 md:px-12 border-t moss-border-gold-soft">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/moss/leaf-gold.png" alt="" className="w-5 h-5 opacity-80" />
            <span className="font-serif text-lg tracking-[0.15em] text-[#EFE8D4]">MOSS</span>
          </div>
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#EFE8D4]/30">
            © {new Date().getFullYear()} MOSS Algorithm · All rights reserved
          </p>
          <Link
            to="/"
            className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#EFE8D4]/40 hover:text-[#C7B06E] transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft size={11} />
            zaydomo.com
          </Link>
        </div>
      </footer>
    </div>
  )
}

useGLTF.preload('/models/moss-logo-rotating-opt.glb')
