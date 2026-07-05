import { Suspense, useRef, useMemo, useEffect, Component } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Environment, Float } from '@react-three/drei'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import Eyebrow from './ui/Eyebrow'
import Reveal from './ui/Reveal'
import LuxButton from './ui/LuxButton'
import { inView, stagger, fadeUp } from '../lib/motion'

const facts = [
  { n: '15,000+', l: 'Members' },
  { n: '#1', l: 'On Whop' },
  { n: 'Every', l: 'Major US sportsbook' },
]

function MossLeaf() {
  const { scene } = useGLTF('/models/moss-logo-rotating-opt.glb')
  const ref = useRef()
  const cloned = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((o) => {
      if (o.isMesh) {
        o.material = new THREE.MeshStandardMaterial({ color: '#c8a24c', metalness: 1, roughness: 0.18, envMapIntensity: 1.7 })
      }
    })
    return c
  }, [scene])
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.4 })
  return (
    <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
      <primitive ref={ref} object={cloned} scale={3} />
    </Float>
  )
}

function AutoFit() {
  const { camera, scene } = useThree()
  useEffect(() => {
    const t = setTimeout(() => {
      const box = new THREE.Box3().setFromObject(scene)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      if (!maxDim) return
      const fov = camera.fov * (Math.PI / 180)
      const dist = (maxDim / (2 * Math.tan(fov / 2))) * 1.5
      camera.position.set(center.x, center.y, center.z + dist)
      camera.lookAt(center)
      camera.updateProjectionMatrix()
    }, 120)
    return () => clearTimeout(t)
  }, [camera, scene])
  return null
}

class LeafBoundary extends Component {
  state = { err: false }
  static getDerivedStateFromError() { return { err: true } }
  render() {
    return this.state.err
      ? <div className="absolute inset-0 flex items-center justify-center"><img src="/moss/leaf-gold.png" alt="MOSS" className="w-1/2 opacity-80" /></div>
      : this.props.children
  }
}

/**
 * MOSS Algorithm — the venture beyond the screen. A single 3D gold mark,
 * the facts, and a door into the full page.
 */
export default function Business() {
  return (
    <section id="business" className="relative py-28 md:py-48 px-6 md:px-16 overflow-hidden bg-onyx">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-16 md:mb-24">
          <Reveal y={20}><Eyebrow index="IV">Venture</Eyebrow></Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-7 font-serif font-light text-ivory leading-[0.9] text-[clamp(2.6rem,6vw,5.5rem)]">
              MOSS <span className="italic text-gold-metallic">Algorithm</span>
            </h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-12 gap-10 md:gap-16 items-center">
          {/* 3D mark */}
          <div className="col-span-12 md:col-span-6 order-2 md:order-1">
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(200,162,76,0.1), transparent 62%)' }} />
              <LeafBoundary>
                <Canvas camera={{ position: [0, 0, 6], fov: 40 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
                  <ambientLight intensity={0.4} />
                  <directionalLight position={[4, 5, 5]} intensity={2} color="#fff2d0" />
                  <Suspense fallback={null}>
                    <MossLeaf />
                    <AutoFit />
                    <Environment preset="sunset" />
                  </Suspense>
                </Canvas>
              </LeafBoundary>
            </div>
          </div>

          {/* Copy */}
          <div className="col-span-12 md:col-span-6 order-1 md:order-2">
            <Reveal>
              <p className="font-editorial italic text-2xl md:text-3xl text-bone/90 leading-snug mb-8">
                One of the largest sports-analysis communities on the market — founded by Zay.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-bone/70 text-[15px] md:text-[17px] leading-relaxed font-light max-w-lg mb-10">
                A members' community built around a proprietary model, integrated across every major
                US sportsbook and recognized with Whop Creator Awards at its 5,000 and 10,000-member
                milestones.
              </p>
            </Reveal>

            <motion.div {...inView} variants={stagger(0.1)} className="grid grid-cols-3 gap-4 border-y border-ivory/[0.08] py-8 mb-10 max-w-lg">
              {facts.map((f) => (
                <motion.div key={f.l} variants={fadeUp}>
                  <p className="font-serif font-light text-ivory text-3xl md:text-4xl leading-none">{f.n}</p>
                  <p className="text-[10px] tracking-[0.24em] uppercase text-silver mt-2">{f.l}</p>
                </motion.div>
              ))}
            </motion.div>

            <Reveal delay={0.15}>
              <LuxButton to="/moss" cursor="ENTER" variant="outline">Enter MOSS</LuxButton>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}

useGLTF.preload('/models/moss-logo-rotating-opt.glb')
