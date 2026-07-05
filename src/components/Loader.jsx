import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const BOOT_LINES = [
  '> INITIALIZING TRANSMISSION...',
  '> LOCATING SIGNAL ORIGIN: 28.5383° N, 81.3792° W',
  '> ORLANDO · FLORIDA · DECODING',
  '> AUTHENTICATING SUBJECT: Z.DOMO',
  '> FILMOGRAPHY: 47 CREDITS LOADED',
  '> FREQUENCY RANGE: 20HZ — 20kHZ',
  '> CHANNEL OPEN. STANDBY.',
]

export default function Loader({ onComplete }) {
  const [lines, setLines] = useState([])
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState('boot')

  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      if (i < BOOT_LINES.length) {
        setLines(prev => [...prev, BOOT_LINES[i]])
        i++
      } else {
        clearInterval(id)
        setTimeout(() => setPhase('name'), 300)
      }
    }, 220)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setProgress(p => {
        const next = Math.min(p + Math.random() * 8 + 2, 100)
        if (next >= 100) clearInterval(id)
        return next
      })
    }, 80)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (phase === 'name') {
      const t = setTimeout(() => setPhase('done'), 1600)
      return () => clearTimeout(t)
    }
    if (phase === 'done') {
      const t = setTimeout(() => onComplete && onComplete(), 800)
      return () => clearTimeout(t)
    }
  }, [phase, onComplete])

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-obsidian flex flex-col overflow-hidden"
      exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] } }}
    >
      {/* scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(201,168,76,0.05) 3px, rgba(201,168,76,0.05) 4px)'
        }}
      />

      {/* Corner brackets */}
      {['top-6 left-6 border-t border-l', 'top-6 right-6 border-t border-r', 'bottom-6 left-6 border-b border-l', 'bottom-6 right-6 border-b border-r'].map((c, i) => (
        <div key={i} className={`absolute w-10 h-10 border-gold/40 ${c}`} />
      ))}

      {/* Top HUD */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-blood animate-pulse-glow" />
        <span className="font-mono-hud text-ivory">TRANSMISSION INCOMING</span>
      </div>

      {/* Terminal boot */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-2xl">
          {phase === 'boot' && (
            <div className="font-mono text-xs md:text-sm space-y-2 text-bone">
              {lines.map((line, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <span className={i === lines.length - 1 ? 'terminal-cursor' : ''}>
                    {line}
                  </span>
                </motion.p>
              ))}
            </div>
          )}

          {phase === 'name' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <motion.p
                initial={{ opacity: 0, letterSpacing: '0.2em' }}
                animate={{ opacity: 1, letterSpacing: '0.5em' }}
                transition={{ duration: 0.8 }}
                className="font-mono-hud text-gold mb-8"
              >
                SUBJECT · AUTHENTICATED
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
                className="font-serif text-5xl md:text-7xl lg:text-8xl font-light tracking-tight leading-none text-ivory"
              >
                <span className="block">ZAY</span>
                <span className="block italic text-gold">"DOMO"</span>
                <span className="block">ARTIST</span>
              </motion.h1>
            </motion.div>
          )}

          {phase === 'done' && (
            <motion.div
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 0, scale: 1.4 }}
              transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
              className="text-center"
            >
              <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-light tracking-tight leading-none text-ivory">
                <span className="block">ZAY</span>
                <span className="block italic text-gold">"DOMO"</span>
                <span className="block">ARTIST</span>
              </h1>
            </motion.div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[min(90vw,500px)]">
        <div className="flex justify-between items-center font-mono-hud mb-2">
          <span className="text-silver">LOADING SIGNAL</span>
          <span className="text-ivory">{progress.toFixed(0).padStart(3, '0')}%</span>
        </div>
        <div className="h-[1px] bg-silver/20 relative overflow-hidden">
          <motion.div
            className="h-full bg-gold"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>
    </motion.div>
  )
}
