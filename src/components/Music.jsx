import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react'

const tracks = [
  { id: 1, title: 'Queen St', artist: 'Prod. Artist', file: '/music/queen-st.mp3' },
  { id: 2, title: 'Withdrawals', artist: 'Artist', file: '/music/withdrawals.mp3' },
  { id: 3, title: 'Who U Callin?', artist: 'Amani', file: '/music/who-u-callin.mp3' },
  { id: 4, title: 'Town', artist: 'Amani', file: '/music/town.mp3' },
  { id: 5, title: 'Peace Of Mind', artist: 'Westin', file: '/music/peace-of-mind.mp3' },
  { id: 6, title: 'Options (I Got)', artist: 'Westin', file: '/music/options.mp3' },
  { id: 7, title: 'Faded', artist: 'Artist', file: '/music/faded.mp3' },
  { id: 8, title: "I'm Gone Be Good (Missin You)", artist: 'Artist', file: '/music/im-gone-be-good.mp3' },
]

function WaveformBars({ playing }) {
  return (
    <div className="flex items-end gap-[2px] h-4 w-8">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`w-[2px] bg-gold rounded-full wave-bar ${playing ? '' : '!h-[3px]'}`}
          style={{
            height: playing ? undefined : '3px',
            animation: playing ? undefined : 'none',
            transition: 'height 0.3s ease',
          }}
        />
      ))}
    </div>
  )
}

export default function Music() {
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100)
      }
    }

    const onLoaded = () => setDuration(audio.duration)
    const onEnded = () => {
      setIsPlaying(false)
      const idx = tracks.findIndex(t => t.id === currentTrack)
      if (idx < tracks.length - 1) {
        playTrack(tracks[idx + 1].id)
      }
    }

    audio.addEventListener('timeupdate', updateProgress)
    audio.addEventListener('loadedmetadata', onLoaded)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', updateProgress)
      audio.removeEventListener('loadedmetadata', onLoaded)
      audio.removeEventListener('ended', onEnded)
    }
  }, [currentTrack])

  const playTrack = (id) => {
    const track = tracks.find(t => t.id === id)
    if (currentTrack === id && isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else if (currentTrack === id) {
      audioRef.current.play()
      setIsPlaying(true)
    } else {
      setCurrentTrack(id)
      setProgress(0)
      setTimeout(() => {
        audioRef.current.src = track.file
        audioRef.current.play()
        setIsPlaying(true)
      }, 50)
    }
  }

  const skipNext = () => {
    const idx = tracks.findIndex(t => t.id === currentTrack)
    if (idx < tracks.length - 1) playTrack(tracks[idx + 1].id)
  }

  const skipPrev = () => {
    const idx = tracks.findIndex(t => t.id === currentTrack)
    if (idx > 0) playTrack(tracks[idx - 1].id)
  }

  const seekTo = (e) => {
    const bar = e.currentTarget
    const rect = bar.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = pct * audioRef.current.duration
    }
  }

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const currentTrackData = tracks.find(t => t.id === currentTrack)

  return (
    <section id="music" className="py-24 md:py-36 px-6 md:px-12">
      <audio ref={audioRef} preload="metadata" />

      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <motion.div
          className="mb-16 md:mb-24"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-[10px] tracking-[0.5em] uppercase text-gold mb-4">02</p>
          <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl font-light">
            Music Production
          </h2>
          <p className="text-silver text-sm md:text-base font-light mt-4 max-w-lg">
            A curated selection of produced and co-produced tracks. Every beat crafted with intention.
          </p>
        </motion.div>

        {/* Now playing bar */}
        {currentTrackData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 p-5 md:p-6 bg-smoke/50 border border-white/5 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <WaveformBars playing={isPlaying} />
                <div>
                  <p className="text-sm md:text-base font-medium">{currentTrackData.title}</p>
                  <p className="text-[11px] text-silver">{currentTrackData.artist}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={skipPrev} className="text-silver hover:text-white transition-colors bg-transparent border-none p-1">
                  <SkipBack size={16} />
                </button>
                <button
                  onClick={() => playTrack(currentTrack)}
                  className="w-10 h-10 flex items-center justify-center bg-gold text-black rounded-full hover:bg-gold/80 transition-colors border-none"
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                </button>
                <button onClick={skipNext} className="text-silver hover:text-white transition-colors bg-transparent border-none p-1">
                  <SkipForward size={16} />
                </button>
              </div>
            </div>
            {/* Progress bar */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-silver w-8 text-right">
                {formatTime(audioRef.current?.currentTime)}
              </span>
              <div
                className="flex-1 h-1 bg-white/10 rounded-full cursor-pointer group relative"
                onClick={seekTo}
              >
                <div
                  className="h-full bg-gold rounded-full transition-all duration-100 relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-gold rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <span className="text-[10px] text-silver w-8">
                {formatTime(duration)}
              </span>
            </div>
          </motion.div>
        )}

        {/* Track list */}
        <div className="space-y-[1px]">
          {tracks.map((track, i) => {
            const isActive = currentTrack === track.id
            return (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                onClick={() => playTrack(track.id)}
                className={`group flex items-center justify-between p-4 md:p-5 cursor-pointer transition-all duration-300 hover:bg-white/[0.03] ${
                  isActive ? 'bg-white/[0.05]' : ''
                }`}
              >
                <div className="flex items-center gap-4 md:gap-6">
                  <span className="text-[11px] text-silver w-6 text-right font-mono">
                    {isActive && isPlaying ? (
                      <WaveformBars playing={true} />
                    ) : (
                      String(i + 1).padStart(2, '0')
                    )}
                  </span>
                  <div>
                    <p className={`text-sm md:text-[15px] transition-colors duration-300 ${
                      isActive ? 'text-gold' : 'text-white group-hover:text-gold'
                    }`}>
                      {track.title}
                    </p>
                    <p className="text-[11px] text-silver mt-0.5">{track.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Volume2 size={14} className="text-silver/40 hidden md:block" />
                  <button className="w-8 h-8 flex items-center justify-center bg-transparent border border-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:border-gold hover:text-gold text-white">
                    {isActive && isPlaying ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
