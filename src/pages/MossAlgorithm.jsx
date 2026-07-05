import { useState, useEffect, useRef, useMemo, Suspense, Component } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Float, Environment } from '@react-three/drei'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import { ArrowLeft, ArrowRight, Users, TrendingUp, ShieldCheck, Radio, ChevronDown } from 'lucide-react'
import MossLeadForm from '../components/MossLeadForm'

/* ══════════════ 3D LEAF ══════════════ */
class CanvasErrorBoundary extends Component {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() { return this.state.hasError ? (this.props.fallback || null) : this.props.children }
}

function MossLogo3D({ scale = 3, spinSpeed = 0.008 }) {
  const { scene } = useGLTF('/models/moss-logo-rotating-opt.glb')
  const ref = useRef()
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#D4BC6E'), metalness: 1, roughness: 0.08,
          clearcoat: 1, clearcoatRoughness: 0.02,
          emissive: new THREE.Color('#5a4620'), emissiveIntensity: 0.2,
          side: THREE.DoubleSide, envMapIntensity: 1.7,
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
      const dist = (maxDim / (2 * Math.tan(fov / 2))) * 1.6
      camera.position.set(center.x, center.y, center.z + dist)
      camera.lookAt(center)
      camera.updateProjectionMatrix()
    }, 100)
    return () => clearTimeout(t)
  }, [camera, scene])
  return null
}

function LogoCanvas({ scale = 3.4 }) {
  return (
    <CanvasErrorBoundary fallback={<div className="w-full h-full flex items-center justify-center"><img src="/moss/leaf-gold.png" alt="MOSS" className="w-2/3 max-w-[300px]" /></div>}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 6], fov: 40 }} gl={{ antialias: true, alpha: true }} style={{ background: 'transparent' }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1.4} color="#fff5d6" />
        <directionalLight position={[-3, 2, 3]} intensity={0.6} color="#C7B06E" />
        <pointLight position={[0, 0, 3]} intensity={0.5} color="#1A472A" />
        <Suspense fallback={null}>
          <Environment preset="sunset" />
          <MossLogo3D scale={scale} />
          <AutoCamera />
        </Suspense>
      </Canvas>
    </CanvasErrorBoundary>
  )
}

/* ══════════════ COUNTER ══════════════ */
function Counter({ target, suffix = '' }) {
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
    const timer = setInterval(() => { cur += inc; if (cur >= target) { setCount(target); clearInterval(timer) } else setCount(Math.floor(cur)) }, 2000 / steps)
    return () => clearInterval(timer)
  }, [started, target])
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

/* ══════════════ AMBIENT PARTICLES ══════════════ */
function LeafParticles() {
  const particles = useMemo(() => Array.from({ length: 16 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 3 + 1,
    dur: Math.random() * 25 + 15, delay: Math.random() * 8, op: Math.random() * 0.1 + 0.03,
  })), [])
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div key={p.id} className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, backgroundColor: '#C7B06E' }}
          animate={{ y: [0, -40, 0], x: [0, 15, -10, 0], opacity: [0, p.op, 0] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }} />
      ))}
    </div>
  )
}

/* ══════════════ NAV ══════════════ */
function MossNav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <motion.nav initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${scrolled ? 'bg-[#0a1a0e]/80 backdrop-blur-md border-b moss-border-gold-soft' : ''}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 md:h-20 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase text-[#EFE8D4]/70 hover:text-[#C7B06E] transition-colors font-mono">
          <ArrowLeft size={13} />zaydomoartist.com
        </Link>
        <div className="flex items-center gap-2">
          <img src="/moss/leaf-gold.png" alt="MOSS" className="w-6 h-6 md:w-7 md:h-7 object-contain" />
          <span className="font-serif text-lg md:text-xl tracking-[0.2em] text-[#EFE8D4]">MOSS</span>
        </div>
        <a href="https://whop.com/moss-algorithm" target="_blank" rel="noopener noreferrer"
          className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] tracking-[0.25em] uppercase font-medium moss-cta-button">
          Join Community<ArrowRight size={12} />
        </a>
      </div>
    </motion.nav>
  )
}

/* ══════════════ PAGE ══════════════ */
const benefits = [
  { icon: TrendingUp, title: 'Data-driven', desc: 'Every play is grounded in data and discipline — not hunches or hype.' },
  { icon: Users, title: 'An active room', desc: '15,000+ members sharing insight every day — one of the largest on Whop.' },
  { icon: ShieldCheck, title: 'Every major book', desc: 'Built to work across every major US sportsbook, wherever you play.' },
  { icon: Radio, title: 'Always live', desc: 'A steady feed of analysis and discussion as the slate moves.' },
]

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
}

export default function MossAlgorithm() {
  const [showSplash, setShowSplash] = useState(true)
  useEffect(() => {
    window.scrollTo(0, 0)
    const t = setTimeout(() => setShowSplash(false), 1500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="moss-page min-h-screen overflow-x-hidden relative">
      <LeafParticles />

      {/* Splash */}
      <AnimatePresence>
        {showSplash && (
          <motion.div key="splash" className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a1a0e]"
            exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
              <img src="/moss/leaf-gold.png" alt="" className="w-14 h-14 mx-auto mb-5 opacity-90" />
              <h1 className="font-serif text-5xl md:text-6xl text-[#EFE8D4] tracking-[0.25em]">MOSS</h1>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MossNav />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20 md:pt-24">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-0 w-[900px] h-[900px] opacity-40 blur-3xl" style={{ background: 'radial-gradient(circle, rgba(199,176,110,0.15), transparent 60%)' }} />
          <div className="absolute bottom-0 left-0 w-[800px] h-[800px] opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle, rgba(26,71,42,0.4), transparent 60%)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 md:px-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 relative z-10">
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6, duration: 0.7 }}
              className="font-mono text-[10px] tracking-[0.5em] uppercase moss-text-gold mb-6 flex items-center gap-3">
              <span className="inline-block w-6 h-[1px] bg-[#C7B06E]" />Founded by Zay “Domo” Artist
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.7, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-light leading-[0.98] tracking-tight text-[#EFE8D4]">
              Bet smarter,<span className="block italic moss-text-gold-gradient">together.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 0.9 }}
              className="text-[#EFE8D4]/60 text-base md:text-lg font-light leading-relaxed max-w-xl mt-8">
              MOSS is a members' community for data-driven sports-betting analysis — 15,000+ members strong, and ranked #1 on Whop.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.2, duration: 0.8 }}
              className="mt-12 flex flex-wrap items-center gap-4">
              <a href="https://whop.com/moss-algorithm" target="_blank" rel="noopener noreferrer"
                className="moss-cta-button inline-flex items-center gap-3 px-8 py-4 rounded-full text-xs tracking-[0.25em] uppercase font-medium">
                Join the Community<ArrowRight size={14} />
              </a>
              <a href="#about" className="inline-flex items-center gap-3 px-6 py-4 rounded-full border moss-border-gold text-[10px] tracking-[0.25em] uppercase text-[#EFE8D4]/80 hover:text-[#C7B06E] hover:border-[#C7B06E] transition-all font-mono">
                Learn more
              </a>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5, duration: 1 }}
              className="mt-14 pt-8 border-t moss-border-gold-soft grid grid-cols-2 gap-4 max-w-md">
              {[{ k: '15K+', v: 'Members' }, { k: '#1', v: 'On Whop' }].map((s) => (
                <div key={s.v}>
                  <p className="font-serif text-3xl md:text-4xl moss-text-gold-gradient font-light">{s.k}</p>
                  <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#EFE8D4]/40 mt-1">{s.v}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="lg:col-span-5 relative h-[420px] md:h-[560px] w-full">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute w-[320px] h-[320px] md:w-[440px] md:h-[440px] rounded-full opacity-60 blur-3xl" style={{ background: 'radial-gradient(circle, rgba(199,176,110,0.25), transparent 60%)' }} />
              <div className="absolute inset-0 flex items-center justify-center"><LogoCanvas scale={3.4} /></div>
            </div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, y: [0, 6, 0] }}
          transition={{ opacity: { delay: 2.8, duration: 1 }, y: { delay: 2.8, duration: 2, repeat: Infinity } }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-[#EFE8D4]/40">Scroll</span>
          <ChevronDown size={14} className="text-[#EFE8D4]/40" />
        </motion.div>
      </section>

      {/* WHAT MOSS IS */}
      <section id="about" className="relative py-28 md:py-40 px-6 md:px-12 z-10">
        <div className="max-w-6xl mx-auto">
          <motion.p initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} className="font-mono text-[10px] tracking-[0.5em] uppercase moss-text-gold mb-6">01 — What MOSS is</motion.p>
          <motion.h2 initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            className="font-serif text-4xl md:text-6xl font-light text-[#EFE8D4] leading-[1.05] mb-10 max-w-3xl">
            More than picks — <span className="italic moss-text-gold-gradient">a community with an edge.</span>
          </motion.h2>
          <motion.p initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            className="text-[#EFE8D4]/70 text-lg font-light leading-relaxed max-w-2xl mb-16">
            MOSS is a members' community built around a disciplined, data-driven approach to sports markets.
            Members share analysis, follow the plays, and learn together in one of the most active rooms on Whop.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {benefits.map((b, i) => (
              <motion.div key={b.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="p-8 md:p-10 border moss-border-gold-soft rounded-2xl" style={{ backgroundColor: 'rgba(14,28,18,0.4)' }}>
                <b.icon size={22} className="moss-text-gold mb-5 opacity-80" />
                <h3 className="font-serif text-2xl italic text-[#EFE8D4] font-light mb-3">{b.title}</h3>
                <p className="text-[#EFE8D4]/55 text-sm leading-relaxed font-light">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* RECOGNITION */}
      <section className="relative py-28 md:py-40 px-6 md:px-12 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.p initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} className="font-mono text-[10px] tracking-[0.5em] uppercase moss-text-gold mb-6">02 — Recognition</motion.p>
          <motion.h2 initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            className="font-serif text-4xl md:text-6xl font-light text-[#EFE8D4] leading-[1] mb-16">Proven where it counts.</motion.h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="relative aspect-[4/5] max-w-md overflow-hidden rounded-2xl border moss-border-gold-soft">
              <img src="/headshots/whop-trophy.jpg" alt="Whop Creator Awards" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,26,14,0.85), transparent 55%)' }} />
              <div className="absolute bottom-5 left-5 right-5">
                <p className="font-mono text-[10px] tracking-[0.3em] uppercase moss-text-gold">Whop Creator Awards</p>
                <p className="text-[#EFE8D4]/80 text-sm mt-1">5,000 & 10,000-member milestones</p>
              </div>
            </motion.div>

            <div>
              <div className="grid grid-cols-2 gap-8 border-y moss-border-gold-soft py-10 mb-10">
                <div>
                  <p className="font-serif text-5xl md:text-6xl moss-text-gold-gradient font-light"><Counter target={15000} suffix="+" /></p>
                  <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#EFE8D4]/50 mt-2">Members</p>
                </div>
                <div>
                  <p className="font-serif text-5xl md:text-6xl moss-text-gold-gradient font-light">#1</p>
                  <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#EFE8D4]/50 mt-2">Ranked on Whop</p>
                </div>
              </div>
              <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#EFE8D4]/40 mb-6">Works across every major US sportsbook</p>
              <div className="grid grid-cols-4 gap-5 items-center">
                {['draftkings.svg', 'fanduel.png', 'betmgm.webp', 'fanatics.png'].map((b) => (
                  <img key={b} src={`/brands/${b}`} alt="" className="h-7 md:h-8 w-auto object-contain mx-auto opacity-60" style={{ filter: 'brightness(0) invert(1)' }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOUNDER */}
      <section className="relative py-28 md:py-40 px-6 md:px-12 z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.p initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} className="font-mono text-[10px] tracking-[0.5em] uppercase moss-text-gold mb-8">03 — Founder</motion.p>
          <motion.blockquote initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9 }}
            className="font-serif text-2xl md:text-4xl lg:text-[2.6rem] italic text-[#EFE8D4] leading-[1.28] font-light">
            “I started MOSS to turn a personal edge into something bigger — a community. It grew into one of the largest on Whop, and we're just getting started.”
          </motion.blockquote>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-10 inline-flex items-center gap-4">
            <div className="w-14 h-[1px] bg-[#C7B06E]/40" />
            <div className="text-left">
              <p className="font-serif italic text-xl text-[#EFE8D4]">Zay “Domo” Artist</p>
              <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#EFE8D4]/40 mt-1">Founder</p>
            </div>
            <div className="w-14 h-[1px] bg-[#C7B06E]/40" />
          </motion.div>
        </div>
      </section>

      {/* JOIN / CTA */}
      <section className="relative py-28 md:py-44 px-6 md:px-12 z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.9 }}
            className="relative p-12 md:p-20 rounded-3xl overflow-hidden moss-glow text-center"
            style={{ border: '1px solid rgba(199,176,110,0.22)', background: 'linear-gradient(to bottom, rgba(26,71,42,0.18), rgba(10,26,14,0.4))' }}>
            <img src="/moss/leaf-gold.png" alt="" className="w-12 h-12 mx-auto mb-8 moss-breathe" />
            <h2 className="font-serif text-4xl md:text-6xl font-light mb-6 leading-[1] text-[#EFE8D4]">Join <span className="italic moss-text-gold-gradient">MOSS.</span></h2>
            <p className="text-[#EFE8D4]/55 text-base md:text-lg font-light max-w-xl mx-auto mb-10 leading-relaxed">
              Get inside the community — or request the investor deck.
            </p>
            <div className="flex flex-col items-center gap-10">
              <a href="https://whop.com/moss-algorithm" target="_blank" rel="noopener noreferrer"
                className="moss-cta-button inline-flex items-center gap-3 px-8 py-4 rounded-full text-xs tracking-[0.25em] uppercase font-medium">
                Join the Community<ArrowRight size={14} />
              </a>
              <div className="w-full">
                <p className="font-mono text-[10px] tracking-[0.4em] uppercase moss-text-tan mb-5">Request the investor deck</p>
                <MossLeadForm />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 pt-12 pb-8 px-6 md:px-12 border-t moss-border-gold-soft">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/moss/leaf-gold.png" alt="" className="w-5 h-5 opacity-80" />
            <span className="font-serif text-lg tracking-[0.15em] text-[#EFE8D4]">MOSS</span>
          </div>
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#EFE8D4]/30">© {new Date().getFullYear()} MOSS · All rights reserved</p>
          <Link to="/" className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#EFE8D4]/40 hover:text-[#C7B06E] transition-colors inline-flex items-center gap-2">
            <ArrowLeft size={11} />zaydomoartist.com
          </Link>
        </div>
      </footer>
    </div>
  )
}

useGLTF.preload('/models/moss-logo-rotating-opt.glb')
