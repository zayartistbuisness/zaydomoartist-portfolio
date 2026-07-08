import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowRight, Check } from 'lucide-react'
import SectionHeader from './ui/SectionHeader'
import { easeLux } from '../lib/motion'

const reps = [
  { role: 'Management', name: 'Schuller Talent', email: 'schullertalent@gmail.com' },
  { role: 'Theatrical', name: 'Coast to Coast Talent', email: 'coastyouth@ctctalent.com', site: 'https://www.ctctalent.com/' },
  { role: 'Press', name: 'Lisa — Lynk PR', email: 'lisa@lynkpr.com' },
]

const inquiryTypes = ['General', 'Acting / Theatrical', 'Management', 'Press', 'MOSS / Business']

const inputCls =
  'w-full bg-transparent border-b border-ivory/15 focus:border-gold py-3 text-ivory placeholder-silver/40 outline-none transition-colors duration-300 font-light'
const labelCls = 'block text-[10px] tracking-[0.28em] uppercase text-silver mb-1'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', type: 'General', message: '', company: '' })
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [subEmail, setSubEmail] = useState('')
  const [subStatus, setSubStatus] = useState('idle')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('bad status')
      setStatus('success')
      setForm({ name: '', email: '', type: 'General', message: '', company: '' })
    } catch {
      setStatus('error')
    }
  }

  const subscribe = async (e) => {
    e.preventDefault()
    if (!subEmail || subStatus === 'submitting') return
    setSubStatus('submitting')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subEmail }),
      })
      if (!res.ok) throw new Error('bad status')
      setSubStatus('success')
      setSubEmail('')
    } catch {
      setSubStatus('error')
    }
  }

  return (
    <section id="contact" className="relative pt-28 md:pt-48 px-6 md:px-16 overflow-hidden bg-obsidian border-t border-ivory/[0.06]">
      <div className="max-w-[1600px] mx-auto">
        <SectionHeader
          index="VIII"
          label="Contact"
          title={[{ text: 'Get in' }, { text: 'touch', gold: true }]}
          titleClass="text-[clamp(3.4rem,11.5vw,13rem)]"
        />

        <div className="grid grid-cols-12 gap-12 md:gap-20 items-start">
          {/* Form */}
          <div className="col-span-12 md:col-span-7">
            {status === 'success' ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: easeLux }}
                className="flex items-start gap-4 border border-gold/30 p-8"
              >
                <Check size={20} className="text-gold mt-0.5 shrink-0" />
                <div>
                  <p className="font-serif text-2xl text-ivory italic">Message received.</p>
                  <p className="text-bone/60 text-sm mt-2 font-light">Thank you — expect a reply to the right inbox shortly.</p>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={submit} className="space-y-8">
                {/* honeypot */}
                <input type="text" tabIndex={-1} autoComplete="off" value={form.company} onChange={set('company')} className="hidden" aria-hidden />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className={labelCls} htmlFor="c-name">Name</label>
                    <input id="c-name" required value={form.name} onChange={set('name')} className={inputCls} placeholder="Your name" />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="c-email">Email</label>
                    <input id="c-email" type="email" required value={form.email} onChange={set('email')} className={inputCls} placeholder="you@example.com" />
                  </div>
                </div>

                <div>
                  <label className={labelCls} htmlFor="c-type">Regarding</label>
                  <select id="c-type" value={form.type} onChange={set('type')} className={`${inputCls} appearance-none`}>
                    {inquiryTypes.map((t) => (
                      <option key={t} value={t} className="bg-obsidian text-ivory">{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls} htmlFor="c-msg">Message</label>
                  <textarea id="c-msg" required rows={4} value={form.message} onChange={set('message')} className={`${inputCls} resize-none`} placeholder="Tell me about the project, role, or opportunity." />
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    data-cursor="SEND"
                    className="group inline-flex items-center gap-3 px-8 py-3.5 border border-gold/40 text-[11px] tracking-[0.28em] uppercase font-medium text-ivory hover:text-obsidian relative overflow-hidden disabled:opacity-60"
                  >
                    <span className="absolute inset-0 bg-gold origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]" />
                    <span className="relative z-10">{status === 'submitting' ? 'Sending…' : 'Send Inquiry'}</span>
                    <ArrowRight size={14} className="relative z-10 transition-transform group-hover:translate-x-1" />
                  </button>
                  {status === 'error' && (
                    <span className="text-sm text-ember font-light">Couldn't send — email a rep below, or try again.</span>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* Channels */}
          <div className="col-span-12 md:col-span-5 md:pl-8 md:border-l border-ivory/[0.08]">
            <p className="text-[10px] tracking-[0.34em] uppercase text-silver mb-8">Representation</p>
            <div className="space-y-8">
              {reps.map((r) => (
                <div key={r.role}>
                  <p className="text-[10px] tracking-[0.28em] uppercase text-gold mb-2">{r.role}</p>
                  <p className="font-serif text-xl text-ivory">{r.name}</p>
                  <a href={`mailto:${r.email}`} data-cursor="EMAIL" className="inline-flex items-center gap-1.5 text-bone/60 hover:text-gold transition-colors text-sm mt-1 font-light">
                    {r.email}<ArrowUpRight size={12} />
                  </a>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-6 mt-10 pt-8 border-t border-ivory/[0.08]">
              {[
                { label: 'Instagram', href: 'https://www.instagram.com/zaydomoartist/' },
                { label: 'IMDb', href: 'https://www.imdb.com/name/nm14198614/' },
              ].map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" data-cursor={s.label} className="inline-flex items-center gap-1 text-[11px] tracking-[0.2em] uppercase text-bone/70 hover:text-gold transition-colors">
                  {s.label}<ArrowUpRight size={12} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Email capture + footer */}
        <div className="mt-28 md:mt-40 border-t border-ivory/[0.08] pt-10 pb-10">
          <div className="grid grid-cols-12 gap-8 items-center">
            <div className="col-span-12 md:col-span-6">
              <p className="text-[10px] tracking-[0.34em] uppercase text-silver mb-3">Stay Close</p>
              {subStatus === 'success' ? (
                <p className="font-serif italic text-xl text-gold">You're on the list.</p>
              ) : (
                <form onSubmit={subscribe} className="flex items-center gap-3 max-w-sm">
                  <input
                    type="email"
                    required
                    value={subEmail}
                    onChange={(e) => setSubEmail(e.target.value)}
                    placeholder="Email for new work & releases"
                    className="flex-1 bg-transparent border-b border-ivory/15 focus:border-gold py-2.5 text-ivory placeholder-silver/40 outline-none transition-colors text-sm font-light"
                  />
                  <button type="submit" data-cursor="JOIN" className="text-gold hover:text-ivory transition-colors shrink-0" aria-label="Subscribe">
                    <ArrowRight size={18} />
                  </button>
                </form>
              )}
              {subStatus === 'error' && <p className="text-xs text-ember mt-2 font-light">Something went wrong — try again.</p>}
            </div>
            <div className="col-span-12 md:col-span-6 flex md:justify-end items-center gap-8">
              <p className="text-[11px] tracking-[0.2em] uppercase text-silver/60">© {new Date().getFullYear()} Zay “Domo” Artist</p>
              <a href="#hero" data-cursor="TOP" className="text-[11px] tracking-[0.2em] uppercase text-silver hover:text-gold transition-colors">Top ↑</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
