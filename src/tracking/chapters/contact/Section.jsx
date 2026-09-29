import { useId, useRef, useState } from 'react'
import { useChapterSection } from '../../kit/chapterStore'
import { INQUIRY_TYPES, profile, reps, press } from '../../content/profile'
import { setContactSlot } from './store'
import { credits } from '../../content/credits'
import './contact.css'

const ID = 'contact'
const EMPTY = { name: '', email: '', type: 'Casting', message: '', company: '' }

export default function Section() {
  const ref = useRef()
  const uid = useId()
  const [form, setForm] = useState(EMPTY)
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  useChapterSection(ID, ref)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) throw new Error(data.error || 'failed')
      setStatus('sent')
      setForm(EMPTY)
    } catch {
      setStatus('error')
    }
  }

  return (
    <section ref={ref} className="c-contact" aria-labelledby="c-contact-title">
      <header className="c-contact-head">
        <p>Contact</p>
      </header>

      <div className="c-contact-top">
        <h2 id="c-contact-title" className="c-contact-title">Let&rsquo;s make <em>something.</em></h2>
        <div ref={setContactSlot} className="c-contact-slot" aria-hidden="true" />
      </div>

      <div className="c-contact-grid">
        <div className="c-contact-reps" id="representation">
          <p className="c-contact-label">Representation</p>
          <ul>
            {reps.map((r) => (
              <li key={r.role}>
                <span className="c-contact-role">{r.role}</span>
                <span className="c-contact-name">{r.name}</span>
                <a href={`mailto:${r.email}`}>{r.email}</a>
              </li>
            ))}
          </ul>
          <p className="c-contact-label">Elsewhere</p>
          <ul className="c-contact-else">
            {profile.social.map((l) => (
              <li key={l.label}><a href={l.url} target="_blank" rel="noreferrer me">{l.label} ↗</a></li>
            ))}
            {press.map((p) => (
              <li key={p.outlet}><a href={p.url} target="_blank" rel="noreferrer">{p.outlet} <span>{p.label}, {p.year}</span> ↗</a></li>
            ))}
          </ul>
        </div>

        <form className="c-contact-form" onSubmit={submit} noValidate={false}>
          <p className="c-contact-label">Send a note</p>
          <div className="c-contact-row">
            <label htmlFor={`${uid}-name`}>Name</label>
            <input id={`${uid}-name`} name="name" required autoComplete="name" value={form.name} onChange={set('name')} />
          </div>
          <div className="c-contact-row">
            <label htmlFor={`${uid}-email`}>Email</label>
            <input id={`${uid}-email`} name="email" type="email" required autoComplete="email" value={form.email} onChange={set('email')} />
          </div>
          <fieldset className="c-contact-types">
            <legend>Regarding</legend>
            {INQUIRY_TYPES.map((t) => (
              <label key={t} className={form.type === t ? 'is-on' : ''}>
                <input type="radio" name="type" value={t} checked={form.type === t} onChange={set('type')} />
                {t}
              </label>
            ))}
          </fieldset>
          <div className="c-contact-row">
            <label htmlFor={`${uid}-msg`}>Message</label>
            <textarea id={`${uid}-msg`} name="message" rows={5} required value={form.message} onChange={set('message')} placeholder="The project, the role, dates — whatever helps." />
          </div>
          {/* Honeypot the worker checks; humans never see it. */}
          <div className="c-contact-hp" aria-hidden="true">
            <label htmlFor={`${uid}-company`}>Leave this field empty</label>
            <input id={`${uid}-company`} name="company" tabIndex={-1} autoComplete="off" value={form.company} onChange={set('company')} />
          </div>
          <button type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending…' : 'Send message ↗'}
          </button>
          <p className="c-contact-status" role="status" aria-live="polite">
            {status === 'sent' && 'Sent. Thank you — you’ll hear back from the team.'}
            {status === 'error' && 'That didn’t go through. Email the team directly above.'}
          </p>
        </form>
      </div>

      <footer className="c-contact-foot">
        <span className="c-contact-sign"><span className="tlab-sigil" aria-hidden="true" />© 2026 {profile.name}</span>
        <details className="c-contact-credits">
          <summary>Image credits</summary>
          {credits.map((c) => (
            <div key={c.chapter}>
              <p className="c-contact-credits-h">{c.chapter}</p>
              <ul>
                {c.items.map((it, i) => (
                  <li key={`${i}-${it.label}`}>
                    {it.label} — {it.url ? <a href={it.url} target="_blank" rel="noreferrer">{it.source}</a> : it.source}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </details>
      </footer>
    </section>
  )
}
