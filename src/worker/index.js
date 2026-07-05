import { Hono } from 'hono'

/**
 * Zay "Domo" Artist — API Worker.
 * Handles the three forms (contact, subscribe, MOSS lead): validates input,
 * blocks bots (honeypot + optional Turnstile), stores to D1, and — once a
 * Resend key is configured — emails a notification to the right inbox.
 * Everything else falls through to the static SPA via the ASSETS binding.
 *
 * Email routing: main-site inquiries → schullertalent@gmail.com (manager);
 * MOSS leads → zayartistbusiness@gmail.com. (Override via CONTACT_EMAIL /
 * MOSS_EMAIL vars.)
 *
 * Bindings: DB (D1), ASSETS (static site)
 * Secrets (optional, added later): RESEND_API_KEY, TURNSTILE_SECRET
 * Vars (optional): CONTACT_EMAIL, MOSS_EMAIL, FROM_EMAIL
 */

const app = new Hono()

const isEmail = (s) => typeof s === 'string' && s.length < 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
const clean = (s, max = 4000) => (typeof s === 'string' ? s.trim().slice(0, max) : '')
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]))

async function verifyTurnstile(env, token, ip) {
  if (!env.TURNSTILE_SECRET) return true // not configured yet → allow (honeypot still applies)
  if (!token) return false
  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token })
  if (ip) body.set('remoteip', ip)
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body })
    const data = await res.json()
    return !!data.success
  } catch {
    return false
  }
}

async function notify(env, { to, subject, html, replyTo }) {
  if (!env.RESEND_API_KEY || !to) return // email delivery not configured yet
  const from = env.FROM_EMAIL || 'Zay Domo Artist <noreply@zaydomoartist.com>'
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html, reply_to: replyTo }),
    })
  } catch {
    /* swallow — submission is already stored */
  }
}

app.get('/api/health', (c) => c.json({ ok: true, ts: Date.now() }))

app.post('/api/contact', async (c) => {
  const b = await c.req.json().catch(() => null)
  if (!b) return c.json({ ok: false, error: 'bad_request' }, 400)
  if (clean(b.company)) return c.json({ ok: true }) // honeypot tripped → look successful

  const name = clean(b.name, 200)
  const email = clean(b.email, 254)
  const type = clean(b.type, 60) || 'General'
  const message = clean(b.message, 5000)
  if (!name || !isEmail(email) || !message) return c.json({ ok: false, error: 'invalid' }, 422)

  const ip = c.req.header('cf-connecting-ip') || ''
  if (!(await verifyTurnstile(c.env, b.token, ip))) return c.json({ ok: false, error: 'verification' }, 403)

  await c.env.DB.prepare(
    'INSERT INTO contact_submissions (name, email, type, message, ip) VALUES (?, ?, ?, ?, ?)'
  ).bind(name, email, type, message, ip).run()

  await notify(c.env, {
    to: c.env.CONTACT_EMAIL || 'schullertalent@gmail.com',
    subject: `New inquiry — ${type} — ${name}`,
    replyTo: email,
    html: `<p><strong>${esc(name)}</strong> &lt;${esc(email)}&gt;<br/>Regarding: ${esc(type)}</p><p>${esc(message).replace(/\n/g, '<br/>')}</p>`,
  })

  return c.json({ ok: true })
})

app.post('/api/subscribe', async (c) => {
  const b = await c.req.json().catch(() => null)
  if (!b) return c.json({ ok: false, error: 'bad_request' }, 400)
  if (clean(b.company)) return c.json({ ok: true })

  const email = clean(b.email, 254)
  if (!isEmail(email)) return c.json({ ok: false, error: 'invalid_email' }, 422)

  await c.env.DB.prepare('INSERT OR IGNORE INTO subscribers (email, source) VALUES (?, ?)')
    .bind(email, clean(b.source, 60) || 'site').run()

  return c.json({ ok: true })
})

app.post('/api/moss-lead', async (c) => {
  const b = await c.req.json().catch(() => null)
  if (!b) return c.json({ ok: false, error: 'bad_request' }, 400)
  if (clean(b.company)) return c.json({ ok: true })

  const email = clean(b.email, 254)
  if (!isEmail(email)) return c.json({ ok: false, error: 'invalid_email' }, 422)

  const ip = c.req.header('cf-connecting-ip') || ''
  const source = clean(b.source, 60) || 'moss'
  await c.env.DB.prepare('INSERT INTO moss_leads (email, source, message, ip) VALUES (?, ?, ?, ?)')
    .bind(email, source, clean(b.message, 5000), ip).run()

  await notify(c.env, {
    to: c.env.MOSS_EMAIL || 'zayartistbusiness@gmail.com',
    subject: `New MOSS lead — ${email}`,
    replyTo: email,
    html: `<p>MOSS investor-deck request from <strong>${esc(email)}</strong> (source: ${esc(source)}).</p>`,
  })

  return c.json({ ok: true })
})

// Any non-API route → the static single-page app.
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
