/* Run against a local dev/preview server. Never submits contact forms. */
const { chromium } = require('C:/Users/zaydo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const out = path.resolve(__dirname, '../source-assets/world/qa')
fs.mkdirSync(out, { recursive: true })
const base = process.env.WORLD_TEST_URL || 'http://127.0.0.1:5173'
const hash = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex')
const report = { url: base, checks: [], errors: [], screenshots: [] }
const check = (name, passed, details = null) => {
  report.checks.push({ name, passed: Boolean(passed), details })
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`, details ?? '')
}
async function shot(page, name) {
  await page.screenshot({ path: path.join(out, name), fullPage: false })
  report.screenshots.push(name)
}
async function dimensions(page) {
  return page.evaluate(() => ({
    width: innerWidth,
    docWidth: document.documentElement.scrollWidth,
    height: innerHeight,
    canvases: [...document.querySelectorAll('.world-canvas')].map((c) => ({
      ready: c.dataset.ready, pixels: [c.width, c.height], css: [c.clientWidth, c.clientHeight],
    })),
  }))
}
;(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, reducedMotion: 'no-preference' })
  const page = await context.newPage()
  page.on('pageerror', (error) => report.errors.push(error.message))
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.locator('.world-stage .world-canvas[data-ready="true"]').waitFor({ timeout: 15000 })
  await page.waitForTimeout(1200)
  check('desktop has no horizontal overflow', (await dimensions(page)).docWidth === 1440, await dimensions(page))
  check('new hero and existing casting sections present', await page.locator('#hero,#about,#acting,#reel,#music,#contact').count() === 6)
  await shot(page, 'desktop-hero.png')
  const a = await page.locator('.world-stage').screenshot()
  await page.waitForTimeout(700)
  const b = await page.locator('.world-stage').screenshot()
  fs.writeFileSync(path.join(out, 'motion-a.png'), a)
  fs.writeFileSync(path.join(out, 'motion-b.png'), b)
  check('live hero pixels change over time', hash(a) !== hash(b))

  await page.getByRole('button', { name: 'Pause scene animation', exact: true }).click()
  await page.waitForTimeout(300)
  const pausedA = await page.locator('.world-stage').screenshot()
  await page.waitForTimeout(600)
  const pausedB = await page.locator('.world-stage').screenshot()
  check('pause freezes scene pixels', hash(pausedA) === hash(pausedB))
  await page.getByRole('button', { name: 'Resume scene animation', exact: true }).click()

  await page.getByRole('button', { name: /Watch the reel/i }).click()
  await page.locator('.world-reel-dialog[open]').waitFor()
  check('reel opens with native controls', await page.locator('.world-reel-dialog video').evaluate((v) => v.controls))
  await page.waitForTimeout(800)
  check('reel starts from explicit user gesture', await page.locator('.world-reel-dialog video').evaluate((v) => !v.paused || v.readyState < 3))
  await page.keyboard.press('Escape')
  check('Escape closes reel', await page.locator('.world-reel-dialog[open]').count() === 0)
  check('focus returns to reel button', await page.evaluate(() => document.activeElement?.classList.contains('world-reel-button')))

  await page.mouse.wheel(0, 430)
  await page.waitForTimeout(1300)
  await shot(page, 'desktop-scroll-transition.png')
  check('scroll updates scene progress', await page.locator('.world-hero').evaluate((el) => Number(el.style.getPropertyValue('--scene-progress')) > .1))
  await page.locator('#between').scrollIntoViewIfNeeded()
  await page.waitForTimeout(700)
  await page.locator('.world-sculpture').scrollIntoViewIfNeeded()
  await page.locator('.world-sculpture[data-ready="true"]').waitFor({ timeout: 15000 })
  check('Blender emblem WebGL viewer loads', await page.locator('.world-sculpture').getAttribute('data-ready') === 'true')
  const emblemA = await page.locator('.world-sculpture canvas').screenshot()
  await page.getByRole('button', { name: 'Turn the emblem', exact: true }).click()
  await page.waitForTimeout(800)
  const emblemB = await page.locator('.world-sculpture canvas').screenshot()
  check('emblem button changes rendered angle', hash(emblemA) !== hash(emblemB))
  await shot(page, 'desktop-between.png')
  await page.locator('#about').scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)
  await shot(page, 'desktop-story.png')

  for (const width of [390, 768, 320]) {
    await page.setViewportSize({ width, height: width === 768 ? 1024 : 844 })
    await page.goto(base, { waitUntil: 'networkidle' })
    await page.locator('.world-stage .world-canvas[data-ready="true"]').waitFor()
    await page.waitForTimeout(500)
    const d = await dimensions(page)
    check(`${width}px no horizontal overflow`, d.docWidth <= width, d)
    await shot(page, `viewport-${width}.png`)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Index', exact: true }).click()
  await page.locator('.world-menu[open]').waitFor()
  check('mobile index opens', await page.locator('.world-menu[open]').count() === 1)
  await shot(page, 'mobile-index.png')
  await page.locator('.world-menu').getByRole('link', { name: /Acting/ }).click()
  await page.waitForTimeout(1800)
  check('mobile index closes on navigation', await page.locator('.world-menu[open]').count() === 0)
  check('mobile index scrolls to credits', await page.locator('#acting').evaluate((el) => Math.abs(el.getBoundingClientRect().top) < 200))

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(base, { waitUntil: 'networkidle' })
  check('reduced motion state respected', await page.locator('.world-portfolio').getAttribute('data-world-motion') === 'still')
  await shot(page, 'mobile-reduced-motion.png')
  const reducedA = await page.locator('.world-stage').screenshot()
  await page.waitForTimeout(700)
  const reducedB = await page.locator('.world-stage').screenshot()
  check('reduced motion remains static', hash(reducedA) === hash(reducedB))
  check('reduced-motion hero avoids GPU render', await page.locator('.world-stage .world-canvas').getAttribute('data-ready') === 'false')
  await page.getByRole('button', { name: 'Enable scene animation', exact: true }).click()
  await page.locator('.world-stage .world-canvas[data-ready="true"]').waitFor()
  check('reduced-motion users can explicitly opt into artwork', await page.locator('.world-portfolio').getAttribute('data-world-motion') === 'live')

  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.locator('.world-stage .world-canvas[data-ready="true"]').waitFor()
  const lostSupported = await page.locator('.world-stage .world-canvas').evaluate((canvas) => {
    const gl = canvas.getContext('webgl')
    const ext = gl?.getExtension('WEBGL_lose_context')
    if (!ext) return false
    window.__worldTestRestore = () => ext.restoreContext()
    ext.loseContext()
    return true
  })
  if (lostSupported) {
    await page.waitForTimeout(300)
    check('context loss reveals photo fallback', await page.locator('.world-stage .world-canvas').getAttribute('data-ready') === 'false')
    await page.evaluate(() => { window.__worldTestRestore(); delete window.__worldTestRestore })
    await page.locator('.world-stage .world-canvas[data-ready="true"]').waitFor({ timeout: 10000 })
    check('context restore rebuilds animated scene', true)
  }
  await page.goto(`${base}/moss`, { waitUntil: 'networkidle' })
  check('existing MOSS route still renders', await page.locator('h1').count() > 0)

  // A separate page simulates devices without WebGL; it must retain the photo.
  const fallback = await context.newPage()
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type.startsWith('webgl') ? null : original.call(this, type, ...args)
    }
  })
  await fallback.goto(base, { waitUntil: 'networkidle' })
  check('no-WebGL portrait fallback loads', await fallback.locator('.world-portrait img').evaluate((i) => i.complete && i.naturalWidth > 0))
  check('no-WebGL reel action remains accessible', await fallback.getByRole('button', { name: /Watch the reel/i }).isVisible())
  await shot(fallback, 'fallback-no-webgl.png')
  check('no uncaught page errors', report.errors.length === 0, report.errors)
  fs.writeFileSync(path.join(out, 'browser-report.json'), JSON.stringify(report, null, 2))
  await browser.close()
  if (report.checks.some((c) => !c.passed)) process.exitCode = 1
})().catch((error) => {
  report.errors.push(error.stack)
  fs.writeFileSync(path.join(out, 'browser-report.json'), JSON.stringify(report, null, 2))
  console.error(error)
  process.exit(1)
})
