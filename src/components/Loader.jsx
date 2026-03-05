import { motion } from 'framer-motion'

export default function Loader() {
  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-midnight flex items-center justify-center"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="text-center">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '120px' }}
          transition={{ duration: 1.8, ease: [0.76, 0, 0.24, 1] }}
          className="h-[1px] bg-white mx-auto mb-8"
        />
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-xs tracking-[0.4em] uppercase text-silver font-light"
        >
          Zay "Domo" Artist
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="text-[10px] tracking-[0.3em] uppercase text-silver mt-3"
        >
          Loading Experience
        </motion.p>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '60px' }}
          transition={{ delay: 0.6, duration: 2, ease: 'linear' }}
          className="h-[1px] bg-gold/40 mx-auto mt-6"
        />
      </div>
    </motion.div>
  )
}
