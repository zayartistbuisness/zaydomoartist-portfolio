import { useEffect, useRef } from 'react'
import { useWorldMotion } from '../world/WorldMotion'
import { createPixelSceneRenderer } from './pixelSceneShader'

const DEFAULT_SRC = '/strategy/motion/avian-flight/loop-mobile.mp4'
const DEFAULT_POSTER = '/strategy/motion/avian-flight/poster.webp'

/**
 * Owns only media/GL lifetimes. Layout and any layer movement belong to CSS.
 * A video element is created off-DOM, with no source until the visibility,
 * motion and connection gates have all passed.
 */
function createPixelSceneController(root, canvas, image, src, poster) {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  const subscriptions = []
  let renderer = null
  let video = null
  let videoSubscriptions = []
  let disposed = false
  let visible = false
  let pageActive = true
  let contextLost = false
  let recoveries = 0
  let fallbackOnly = false
  let posterRequested = false
  let posterLoaded = false
  let videoFailed = false
  let playRejected = false
  let wasAllowed = false
  let running = false
  let pendingPlay = false
  let playGeneration = 0
  let frameHandle = null
  let videoCallback = false
  let lastPaint = -Infinity
  let lastMediaTime = -1
  let hadVideoFrame = false
  let dirty = true
  let settings = { still: true, color: '#292d27', threshold: 0.16, grid: 4, opacity: 1 }

  function listen(target, event, handler, options, list = subscriptions) {
    target.addEventListener(event, handler, options)
    list.push(() => target.removeEventListener(event, handler, options))
  }

  function limitedConnection() {
    return Boolean(connection?.saveData || /^(slow-)?2g$/.test(connection?.effectiveType || ''))
  }

  function onScreen() {
    return visible && pageActive && !document.hidden && root.clientWidth > 0 && root.clientHeight > 0
  }

  function canMove() {
    return !disposed && onScreen() && !settings.still && !limitedConnection() &&
      !contextLost && !fallbackOnly && !videoFailed
  }

  function cancelFrame() {
    if (frameHandle === null) return
    if (videoCallback) video?.cancelVideoFrameCallback(frameHandle)
    else window.cancelAnimationFrame(frameHandle)
    frameHandle = null
  }

  function stop() {
    ++playGeneration // Invalidates a play() promise that resolves after a pause/unmount.
    pendingPlay = running = false
    cancelFrame()
    if (video && !video.paused) video.pause()
    root.dataset.playing = 'false'
  }

  function releaseVideo() {
    stop()
    if (!video) return
    videoSubscriptions.forEach((unsubscribe) => unsubscribe())
    videoSubscriptions = []
    video.removeAttribute('src')
    video.load() // Abort pending downloads and release the media decoder.
    video = null
    hadVideoFrame = false
    lastMediaTime = -1
  }

  function showFallback() {
    canvas.style.display = 'none'
    image.style.display = posterRequested ? 'block' : 'none'
    root.dataset.ready = String(posterLoaded)
  }

  function failRenderer() {
    fallbackOnly = true
    releaseVideo()
    renderer?.dispose()
    renderer = null
    showFallback()
  }

  function draw(source) {
    if (!renderer || !onScreen() || disposed) return false
    try {
      if (source && !renderer.upload(source)) return false
      if (!renderer.draw(settings)) return false
      dirty = false
      canvas.style.display = 'block'
      image.style.display = 'none'
      root.dataset.ready = 'true'
      return true
    } catch {
      // Tainted/unsupported media, allocation failures, etc. never reveal raw black video.
      failRenderer()
      return false
    }
  }

  function paintVideo(now, mediaTime = video?.currentTime) {
    if (!canMove() || !video || video.readyState < 2 || !renderer) return
    const fps = root.clientWidth <= 768 || connection?.effectiveType === '3g' ? 20 : 24
    // Allow sub-millisecond timestamp jitter on a native 24fps loop.
    if (now - lastPaint < 1000 / fps - 0.5 || mediaTime === lastMediaTime) return
    if (draw(video)) {
      lastPaint = now
      lastMediaTime = mediaTime
      hadVideoFrame = true
    }
  }

  function scheduleFrame() {
    if (frameHandle !== null || !running || !canMove() || !video) return
    videoCallback = typeof video.requestVideoFrameCallback === 'function' &&
      typeof video.cancelVideoFrameCallback === 'function'
    const tick = (now, metadata) => {
      frameHandle = null
      if (!running || !canMove()) return
      paintVideo(now, metadata?.mediaTime)
      scheduleFrame()
    }
    frameHandle = videoCallback
      ? video.requestVideoFrameCallback(tick)
      : window.requestAnimationFrame(tick)
  }

  function makeVideo() {
    video = document.createElement('video')
    video.muted = true
    video.defaultMuted = true
    video.loop = true
    video.playsInline = true
    video.preload = 'none'
    // Cross-origin media is opt-in via a server CORS header; local assets need none.
    video.crossOrigin = 'anonymous'
    video.setAttribute('muted', '')
    video.setAttribute('playsinline', '')
    video.disablePictureInPicture = true
    const onPlaying = () => {
      if (!canMove()) { stop(); return }
      running = true
      root.dataset.playing = 'true'
      scheduleFrame()
    }
    const onPause = () => {
      if (!video?.paused) return
      running = false
      cancelFrame()
      root.dataset.playing = 'false'
    }
    const onWaiting = () => {
      running = false
      cancelFrame()
      root.dataset.playing = 'false'
    }
    const onError = () => {
      videoFailed = true
      releaseVideo()
      reconcile()
    }
    listen(video, 'playing', onPlaying, undefined, videoSubscriptions)
    listen(video, 'pause', onPause, undefined, videoSubscriptions)
    listen(video, 'waiting', onWaiting, undefined, videoSubscriptions)
    listen(video, 'ended', onPause, undefined, videoSubscriptions)
    listen(video, 'error', onError, undefined, videoSubscriptions)
    // One MP4, not speculative <source> downloads or an unrelated fallback clip.
    video.src = src
  }

  function start() {
    if (!canMove() || pendingPlay || running || playRejected || !src) return
    if (!video) makeVideo()
    const current = video
    const generation = ++playGeneration
    pendingPlay = true
    const rejected = () => {
      if (disposed || generation !== playGeneration || current !== video) return
      playRejected = true
      stop() // Leave the already-rendered poster/last frame visible.
    }
    try {
      Promise.resolve(current.play()).then(() => {
        if (disposed || generation !== playGeneration || current !== video) return
        pendingPlay = false
        if (!canMove()) { stop(); return }
        if (!current.paused) {
          running = true
          root.dataset.playing = 'true'
          scheduleFrame()
        }
      }, rejected)
    } catch {
      rejected()
    }
  }

  function reconcile() {
    if (disposed) return
    const allowed = canMove()
    if (allowed && !wasAllowed) playRejected = false
    wasAllowed = allowed
    if (!allowed) stop()
    // A connection-policy change also aborts an already-started download.
    if (limitedConnection() && video) releaseVideo()
    if (!onScreen()) return

    if (!posterRequested && poster) {
      posterRequested = true
      image.src = poster
    }
    if (contextLost || fallbackOnly) { showFallback(); return }
    if (!renderer) {
      renderer = createPixelSceneRenderer(canvas)
      if (!renderer) { failRenderer(); return }
      dirty = true
    }
    try {
      dirty = renderer.resize(root.clientWidth, root.clientHeight, window.devicePixelRatio || 1) || dirty
    } catch {
      failRenderer()
      return
    }
    if (!renderer.hasFrame) {
      // Context restoration can reuse the paused decoder, otherwise the poster.
      if (hadVideoFrame && video?.readyState >= 2) draw(video)
      else if (posterLoaded) draw(image)
    } else if (dirty) {
      draw() // Re-style/resize the retained texture, without decoding another frame.
    }
    start()
  }

  function onResize() {
    dirty = true
    if (!intersectionObserver) checkVisibility()
    else reconcile()
  }

  function checkVisibility() {
    const rect = root.getBoundingClientRect()
    visible = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 &&
      rect.top < window.innerHeight && rect.left < window.innerWidth
    reconcile()
  }

  function onContextLost(event) {
    if (disposed || fallbackOnly) return
    contextLost = true
    stop()
    renderer?.dispose()
    renderer = null
    if (recoveries === 0) {
      ++recoveries
      event.preventDefault() // Permit exactly one browser-driven restoration.
      showFallback()
    } else {
      failRenderer()
    }
  }

  function onContextRestored() {
    if (disposed || fallbackOnly || !contextLost) return
    contextLost = false
    dirty = true
    lastPaint = -Infinity
    lastMediaTime = -1
    reconcile()
  }

  root.dataset.ready = 'false'
  root.dataset.playing = 'false'
  canvas.style.display = 'block'
  image.style.display = 'none'
  image.crossOrigin = 'anonymous'
  listen(image, 'load', () => {
    posterLoaded = image.naturalWidth > 0
    reconcile()
  })
  listen(image, 'error', () => {
    posterLoaded = false
    if (fallbackOnly || contextLost) showFallback()
  })
  listen(canvas, 'webglcontextlost', onContextLost)
  listen(canvas, 'webglcontextrestored', onContextRestored)
  listen(document, 'visibilitychange', reconcile)
  listen(window, 'pagehide', () => { pageActive = false; reconcile() })
  listen(window, 'pageshow', () => { pageActive = true; reconcile() })
  listen(window, 'resize', onResize, { passive: true })
  if (connection?.addEventListener) listen(connection, 'change', reconcile)

  const intersectionObserver = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio > 0
      reconcile()
    }, { threshold: 0, rootMargin: '0px' })
    : null
  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(onResize) : null
  if (intersectionObserver) intersectionObserver.observe(root)
  else {
    listen(window, 'scroll', checkVisibility, { passive: true, capture: true })
    checkVisibility()
  }
  resizeObserver?.observe(root)

  return {
    update(next) {
      settings = next
      // Main CSS can override these custom properties for a masked fallback.
      const alpha = Number.isFinite(Number(next.opacity)) ? Math.min(1, Math.max(0, Number(next.opacity))) : 1
      image.style.setProperty('--pixel-scene-opacity', String(alpha))
      dirty = true
      reconcile()
    },
    dispose() {
      if (disposed) return
      disposed = true
      intersectionObserver?.disconnect()
      resizeObserver?.disconnect()
      subscriptions.forEach((unsubscribe) => unsubscribe())
      releaseVideo()
      image.removeAttribute('src')
      renderer?.dispose()
      renderer = null
      root.dataset.ready = 'false'
    },
  }
}

export default function PixelScene({
  src = DEFAULT_SRC,
  poster = DEFAULT_POSTER,
  className = '',
  color = '#292d27',
  threshold = 0.16,
  grid = 4,
  opacity = 1,
}) {
  const rootRef = useRef(null)
  const canvasRef = useRef(null)
  const posterRef = useRef(null)
  const controllerRef = useRef(null)
  const { still, reduced } = useWorldMotion()

  useEffect(() => {
    const controller = createPixelSceneController(rootRef.current, canvasRef.current, posterRef.current, src, poster)
    controllerRef.current = controller
    return () => {
      controller.dispose()
      if (controllerRef.current === controller) controllerRef.current = null
    }
  }, [src, poster])

  useEffect(() => {
    // Use the provider's effective choice; its deliberate "live" override is valid.
    controllerRef.current?.update({ still: Boolean(still || reduced), color, threshold, grid, opacity })
  }, [src, poster, still, reduced, color, threshold, grid, opacity])

  return (
    <div
      ref={rootRef}
      className={`pixel-scene ${className}`.trim()}
      aria-hidden="true"
      data-ready="false"
      data-playing="false"
      style={{ pointerEvents: 'none' }}
    >
      <canvas
        ref={canvasRef}
        className="pixel-scene-canvas"
        width={1}
        height={1}
        aria-hidden="true"
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
      <img
        ref={posterRef}
        className="pixel-scene-fallback"
        alt=""
        aria-hidden="true"
        decoding="async"
        draggable={false}
        style={{
          display: 'none',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          // Inversion turns the black backdrop white; multiply drops that white
          // over photography. Never show an opaque, merely-grayscaled rectangle.
          filter: 'var(--pixel-scene-fallback-filter, grayscale(1) invert(1))',
          mixBlendMode: 'var(--pixel-scene-fallback-blend, multiply)',
          opacity: 'calc(var(--pixel-scene-opacity, 1) * var(--pixel-scene-fallback-opacity, 0.4))',
        }}
      />
    </div>
  )
}
