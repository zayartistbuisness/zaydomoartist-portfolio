import { useEffect, useId, useRef, useState } from 'react'
import './contact-panel.css'

const INQUIRY_TYPES = ['Creative strategy', 'Acting', 'Press', 'General']
const EMPTY_FORM = { name: '', email: '', type: 'General', message: '', company: '' }
const REPRESENTATIVES = [
  { role: 'Management', name: 'Schuller Talent', email: 'schullertalent@gmail.com' },
  { role: 'Theatrical', name: 'Coast to Coast Talent', email: 'coastyouth@ctctalent.com' },
  { role: 'Press', name: 'Lisa — Lynk PR', email: 'lisa@lynkpr.com' },
]
const SEND_ERROR =
  'We couldn’t confirm your message was received. Your text is still here. Try again, or email a contact listed here.'

function Arrow({ className = '' }) {
  return (
    <svg
      className={`experience-contact__icon ${className}`}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <use href="/strategy/brand/icons/sprite.svg#zda-arrow-diagonal" />
    </svg>
  )
}

function validate(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = 'Please enter your name.'
  else if (values.name.length > 200) errors.name = 'Use 200 characters or fewer.'

  if (!values.email.trim()) errors.email = 'Please enter your email address.'
  else if (
    values.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
  ) {
    errors.email = 'Enter a valid email address, such as name@example.com.'
  }

  if (!INQUIRY_TYPES.includes(values.type)) errors.type = 'Please choose an inquiry type.'
  if (!values.message.trim()) errors.message = 'Please write a short message.'
  else if (values.message.length > 5000) errors.message = 'Use 5,000 characters or fewer.'
  return errors
}

function FieldError({ id, children }) {
  return children ? <p id={id} className="experience-contact__field-error">{children}</p> : null
}

function responseError(response, data) {
  if (response.status === 429) return 'Too many attempts. Please wait a moment before trying again.'
  if (data?.error === 'verification') {
    return 'The form couldn’t verify your request. Please try again, or email a contact listed here.'
  }
  if (data?.error === 'invalid' || response.status === 422) {
    return 'Please check your name, email and message, then try again. Your text is still here.'
  }
  return SEND_ERROR
}

export default function ContactPanel() {
  const id = useId()
  const formId = `${id}-contact-form`
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')
  const formRef = useRef(null)
  const requestRef = useRef(null)
  const pending = status === 'submitting'

  useEffect(() => () => {
    const request = requestRef.current
    requestRef.current = null
    if (request) {
      clearTimeout(request.timeout)
      request.controller.abort()
    }
  }, [])

  function updateField(event) {
    const { name, value } = event.target
    if (requestRef.current) return

    const nextForm = { ...form, [name]: value }
    setForm(nextForm)
    // Only revalidate while typing once this field has shown an error.
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: validate(nextForm)[name] }))
    }
    setSubmitError('')
    setStatus('idle')
  }

  function validateField(event) {
    const { name } = event.target
    if (requestRef.current) return
    setErrors((current) => ({ ...current, [name]: validate(form)[name] }))
  }

  function chooseInquiry(event, type) {
    if (requestRef.current) {
      event.preventDefault()
      return
    }
    // Keep the anchor's normal open-in-new-tab behavior for modified clicks.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    setForm((current) => ({ ...current, type }))
    setErrors((current) => ({ ...current, type: undefined }))
    setStatus('idle')
    setSubmitError('')
    formRef.current?.elements.namedItem('name')?.focus()
  }

  async function submit(event) {
    event.preventDefault()
    // The ref also blocks a second submit before React has painted disabled controls.
    if (requestRef.current) return

    const nextErrors = validate(form)
    setErrors(nextErrors)
    setSubmitError('')
    if (Object.keys(nextErrors).length) {
      setStatus('idle')
      setSubmitError('Please check the marked fields, then send again.')
      formRef.current?.elements.namedItem(Object.keys(nextErrors)[0])?.focus()
      return
    }

    const request = { controller: new AbortController(), timeout: null, timedOut: false }
    requestRef.current = request
    setStatus('submitting')
    request.timeout = setTimeout(() => {
      request.timedOut = true
      request.controller.abort()
    }, 20000)

    let failureMessage = SEND_ERROR
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: request.controller.signal,
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          type: form.type,
          message: form.message.trim(),
          company: form.company,
        }),
      })
      const data = await response.json()
      // A completed response may arrive after unmount or cleanup in Strict Mode.
      if (requestRef.current !== request) return
      if (request.controller.signal.aborted) throw new Error('Request aborted')
      if (!response.ok || data?.ok !== true) {
        failureMessage = responseError(response, data)
        throw new Error('Contact request was not accepted')
      }
      setForm(EMPTY_FORM)
      setErrors({})
      setStatus('success')
    } catch {
      if (requestRef.current !== request) return
      setStatus('error')
      setSubmitError(request.timedOut
        ? 'The request timed out, so we couldn’t confirm receipt. Your text is still here. Try again, or email a contact listed here.'
        : failureMessage)
    } finally {
      clearTimeout(request.timeout)
      if (requestRef.current === request) requestRef.current = null
    }
  }

  return (
    <section id="contact" className="experience-contact" aria-labelledby={`${id}-heading`}>
      <div className="experience-contact__inner">
        <header className="experience-contact__header">
          <p className="experience-contact__eyebrow">Contact</p>
          <div className="experience-contact__heading-row">
            <h2 id={`${id}-heading`} className="experience-contact__heading">
              Have something <em>in mind?</em>
            </h2>
            <Arrow className="experience-contact__heading-arrow" />
          </div>
        </header>

        <div className="experience-contact__grid">
          <div className="experience-contact__details">
            <p className="experience-contact__intro">
              Tell me a little about the project or role, and what you need.
            </p>
            <div className="experience-contact__roles" role="group" aria-label="Start an inquiry">
              {INQUIRY_TYPES.slice(0, 2).map((type) => (
                <a
                  key={type}
                  href={`#${formId}`}
                  onClick={(event) => chooseInquiry(event, type)}
                  aria-disabled={pending || undefined}
                  className="experience-contact__role-link"
                >
                  <span>{type}</span>
                  <Arrow />
                </a>
              ))}
            </div>

            <div className="experience-contact__representation">
              <h3 className="experience-contact__eyebrow">Representation &amp; press</h3>
              <dl className="experience-contact__representatives">
                {REPRESENTATIVES.map((representative) => (
                  <div className="experience-contact__representative" key={representative.role}>
                    <dt>{representative.role}</dt>
                    <dd>
                      <span className="experience-contact__representative-name">{representative.name}</span>
                      <a href={`mailto:${representative.email}`} className="experience-contact__email">
                        <span>{representative.email}</span>
                        <Arrow />
                      </a>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="experience-contact__form-column">
            <div className="experience-contact__form-heading">
              <h3 id={`${id}-form-heading`}>Send a note</h3>
              <p id={`${id}-instructions`}>All fields are required.</p>
            </div>
            <form
              id={formId}
              ref={formRef}
              className="experience-contact__form"
              aria-labelledby={`${id}-form-heading`}
              aria-describedby={`${id}-instructions`}
              aria-busy={pending}
              noValidate
              onSubmit={submit}
            >
              <fieldset disabled={pending} className="experience-contact__fieldset">
                <legend className="experience-contact__sr-only">Your contact details and message</legend>
                {/* Keep the existing /api/contact company honeypot in the JSON body. */}
                <div className="experience-contact__honeypot" hidden aria-hidden="true">
                  <label htmlFor={`${id}-company`}>Leave this field empty</label>
                  <input
                    id={`${id}-company`}
                    name="company"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.company}
                    onChange={updateField}
                  />
                </div>

                <div className="experience-contact__field-row">
                  <div className="experience-contact__field">
                    <label htmlFor={`${id}-name`}>Name</label>
                    <input
                      id={`${id}-name`}
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      maxLength={200}
                      placeholder="Your name"
                      value={form.name}
                      onChange={updateField}
                      onBlur={validateField}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? `${id}-name-error` : undefined}
                    />
                    <FieldError id={`${id}-name-error`}>{errors.name}</FieldError>
                  </div>
                  <div className="experience-contact__field">
                    <label htmlFor={`${id}-email`}>Email</label>
                    <input
                      id={`${id}-email`}
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      required
                      maxLength={254}
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={updateField}
                      onBlur={validateField}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? `${id}-email-error` : undefined}
                    />
                    <FieldError id={`${id}-email-error`}>{errors.email}</FieldError>
                  </div>
                </div>

                <div className="experience-contact__field">
                  <label htmlFor={`${id}-type`}>Inquiry type</label>
                  <select
                    id={`${id}-type`}
                    name="type"
                    required
                    value={form.type}
                    onChange={updateField}
                    onBlur={validateField}
                    aria-invalid={Boolean(errors.type)}
                    aria-describedby={errors.type ? `${id}-type-error` : undefined}
                  >
                    {INQUIRY_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                  <FieldError id={`${id}-type-error`}>{errors.type}</FieldError>
                </div>

                <div className="experience-contact__field">
                  <label htmlFor={`${id}-message`}>Message</label>
                  <textarea
                    id={`${id}-message`}
                    name="message"
                    required
                    rows={4}
                    maxLength={5000}
                    placeholder="What do you have in mind?"
                    value={form.message}
                    onChange={updateField}
                    onBlur={validateField}
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={`${id}-message-hint${errors.message ? ` ${id}-message-error` : ''}`}
                  />
                  <p id={`${id}-message-hint`} className="experience-contact__hint">
                    Include a rough timeline if you have one.
                  </p>
                  <FieldError id={`${id}-message-error`}>{errors.message}</FieldError>
                </div>

                <button type="submit" className="experience-contact__send" disabled={pending}>
                  <span>{pending ? 'Sending…' : 'Send message'}</span>
                  <Arrow />
                </button>
              </fieldset>
            </form>

            {/* Keep live regions mounted and outside the busy form for announcements. */}
            <div className="experience-contact__feedback">
              <p className="experience-contact__status" role="status" aria-live="polite" aria-atomic="true">
                {pending && 'Sending your message…'}
                {status === 'success' && 'Message received. Thanks for getting in touch.'}
              </p>
              <p className="experience-contact__submit-error" role="alert" aria-atomic="true">
                {submitError}
              </p>
            </div>
          </div>
        </div>

        <footer className="experience-contact__footer">
          <p className="experience-contact__copyright">
            © {new Date().getFullYear()} Zay “Domo” Artist
          </p>
          <a href="/moss" className="experience-contact__other-work">Other work / MOSS</a>
          <a href="#hero" className="experience-contact__top">
            <span>Back to top</span>
            <Arrow />
          </a>
        </footer>
      </div>
    </section>
  )
}
