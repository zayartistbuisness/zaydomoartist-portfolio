import { useState } from 'react'
import { ArrowRight } from 'lucide-react'

/**
 * MOSS lead capture — investor-deck request / waitlist. Posts to the
 * Worker (/api/moss-lead). Styled to the MOSS forest-gold identity.
 */
export default function MossLeadForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | submitting | success | error

  const submit = async (e) => {
    e.preventDefault()
    if (!email || status === 'submitting') return
    setStatus('submitting')
    try {
      const res = await fetch('/api/moss-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'moss-invest' }),
      })
      if (!res.ok) throw new Error('bad status')
      setStatus('success')
      setEmail('')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return <p className="font-serif italic text-lg" style={{ color: '#C7B06E' }}>Received — we'll be in touch shortly.</p>
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={submit} className="flex items-center gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email for the investor deck"
          className="flex-1 bg-transparent border-b py-3 text-[#EFE8D4] placeholder-[#EFE8D4]/40 outline-none transition-colors text-sm"
          style={{ borderColor: 'rgba(199,176,110,0.3)' }}
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="moss-cta-button inline-flex items-center gap-2 px-6 py-3 rounded-full text-[10px] tracking-[0.25em] uppercase font-medium shrink-0 disabled:opacity-60"
        >
          {status === 'submitting' ? '…' : 'Request'}
          <ArrowRight size={12} />
        </button>
      </form>
      {status === 'error' && (
        <p className="text-[11px] mt-3 font-mono tracking-wide" style={{ color: '#d98a7a' }}>
          Couldn't send — email contact@zaydomoartist.com directly, or try again.
        </p>
      )}
    </div>
  )
}
