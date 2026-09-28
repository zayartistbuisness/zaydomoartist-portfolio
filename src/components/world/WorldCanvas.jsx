import { useEffect, useRef } from 'react'
import { useWorldMotion } from './WorldMotion'
import { vertexShader, fragmentShader } from './worldShaders'

const MOBILE_QUERY = '(max-width: 900px)'
const FRAME_INTERVAL = 1000 / 30
const MAX_DIMENSION = 1600
const MAX_PIXELS = 1_600_000
const clamp = (value, low, high) => Math.max(low, Math.min(high, value))

/**
 * One WebGL compositor per visible scene. The picture underneath is also the
 * no-WebGL, initial reduced-motion, loading, and context-loss fallback.
 */
export default function WorldCanvas({ hero = true, sceneRef }) {
  const ref = useRef(null)
  const { still } = useWorldMotion()
  const stillRef = useRef(still)
  const syncRef = useRef(null)
  useEffect(() => {
    stillRef.current = still
    syncRef.current?.()
  }, [still])

  useEffect(() => {
    const canvas = ref.current
    const scene = sceneRef?.current
    if (!canvas || !scene) return

    const media = typeof window.matchMedia === 'function' ? window.matchMedia(MOBILE_QUERY) : null
    let mobile = media?.matches ?? window.innerWidth <= 900
    let gl = null
    let renderer = null
    let disposed = false
    let failed = false
    let contextLost = false
    let visible = false
    let observer = null
    let resizer = null
    let raf = 0
    let elapsed = 0
    let last = null
    let assetVersion = 0
    let geometryDirty = true
    let sizeDirty = true
    let rect = null
    let cssWidth = 0
    let cssHeight = 0
    let scroll = 0
    let pointerClient = null
    const imageCache = new Map()
    const pendingImages = new Set()

    const hide = () => {
      canvas.dataset.ready = 'false'
      canvas.style.visibility = 'hidden'
    }
    const stop = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      last = null
    }
    const active = () => !disposed && !failed && !contextLost &&
      visible && !document.hidden && !stillRef.current
    const release = (resources) => {
      if (!gl || !resources || gl.isContextLost()) return
      resources.textures.forEach((texture) => gl.deleteTexture(texture))
      resources.shaders.forEach((shader) => gl.deleteShader(shader))
      if (resources.buffer) gl.deleteBuffer(resources.buffer)
      if (resources.program) gl.deleteProgram(resources.program)
    }
    const fail = () => {
      failed = true
      assetVersion += 1
      stop()
      hide()
      release(renderer)
      renderer = null
    }
    const loadImage = (url) => {
      if (imageCache.has(url)) return imageCache.get(url)
      const request = new Promise((resolve, reject) => {
        const image = new Image()
        const finish = (error, cancelled = false) => {
          image.onload = null
          image.onerror = null
          pendingImages.delete(cancel)
          if (error) reject(error)
          else resolve(cancelled ? null : image)
        }
        const cancel = () => finish(null, true)
        pendingImages.add(cancel)
        image.onload = () => finish()
        image.onerror = () => finish(new Error('World image failed to load.'))
        image.decoding = 'async'
        image.src = url
      })
      imageCache.set(url, request)
      // Failed requests may be attempted again after a genuine context restore.
      request.catch(() => imageCache.delete(url))
      return request
    }
    const upload = (resources, image, slot, name) => {
      if (resources.images[slot] === image) return
      gl.activeTexture(gl.TEXTURE0 + slot)
      gl.bindTexture(gl.TEXTURE_2D, resources.textures[slot])
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
      if (gl.getError() !== gl.NO_ERROR) throw new Error('World texture upload failed.')
      resources.images[slot] = image
      if (name === 'portrait') {
        gl.uniform2f(resources.uniforms.imageSize, image.naturalWidth, image.naturalHeight)
      } else if (name === 'birds') {
        gl.uniform2f(resources.uniforms.birdTexel, 1 / image.naturalWidth, 1 / image.naturalHeight)
      }
    }
    const loadAssets = (resources) => {
      const version = ++assetVersion
      const requestedMobile = mobile
      resources.requestedMobile = requestedMobile
      resources.ready = false
      hide()
      Promise.all([
        hero ? loadImage(requestedMobile ? '/world/portrait-world-mobile.webp' : '/world/portrait-world.webp') : null,
        loadImage('/world/clouds.webp'),
        loadImage('/world/swift-atlas.webp'),
      ]).then(([photo, clouds, birds]) => {
        if (disposed || contextLost || renderer !== resources || version !== assetVersion) return
        try {
          if (gl.isContextLost()) return
          gl.useProgram(resources.program)
          if (photo) upload(resources, photo, 0, 'portrait')
          upload(resources, clouds, 1, 'clouds')
          upload(resources, birds, 2, 'birds')
          gl.uniform1f(resources.uniforms.mobile, requestedMobile ? 1 : 0)
          resources.ready = true
          geometryDirty = true
          sizeDirty = true
          sync()
        } catch {
          fail()
        }
      }).catch(() => {
        if (!disposed && renderer === resources && version === assetVersion) fail()
      })
    }
    const initialize = () => {
      const resources = { textures: [], shaders: [], images: [], uniforms: {}, ready: false }
      renderer = resources
      try {
        gl ??= canvas.getContext('webgl', {
          alpha: true, antialias: false, depth: false, stencil: false,
          premultipliedAlpha: false, powerPreference: 'low-power',
        })
        if (!gl) throw new Error('WebGL unavailable.')
        if (gl.isContextLost()) return
        const compile = (type, source) => {
          const shader = gl.createShader(type)
          if (!shader) throw new Error('World shader allocation failed.')
          resources.shaders.push(shader)
          gl.shaderSource(shader, source)
          gl.compileShader(shader)
          if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('World shader compilation failed.')
          return shader
        }
        resources.program = gl.createProgram()
        if (!resources.program) throw new Error('World program allocation failed.')
        gl.attachShader(resources.program, compile(gl.VERTEX_SHADER, vertexShader))
        gl.attachShader(resources.program, compile(gl.FRAGMENT_SHADER, fragmentShader))
        gl.linkProgram(resources.program)
        if (!gl.getProgramParameter(resources.program, gl.LINK_STATUS)) throw new Error('World shader link failed.')
        gl.useProgram(resources.program)
        resources.buffer = gl.createBuffer()
        if (!resources.buffer) throw new Error('World buffer allocation failed.')
        gl.bindBuffer(gl.ARRAY_BUFFER, resources.buffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
        const position = gl.getAttribLocation(resources.program, 'a_position')
        if (position < 0) throw new Error('World position attribute missing.')
        gl.enableVertexAttribArray(position)
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
        resources.uniforms = Object.fromEntries(
          ['portrait', 'clouds', 'birds', 'resolution', 'imageSize', 'birdTexel', 'pointer', 'time', 'scroll', 'hero', 'mobile']
            .map((name) => [name, gl.getUniformLocation(resources.program, `u_${name}`)])
        )
        gl.disable(gl.BLEND)
        gl.disable(gl.DEPTH_TEST)
        gl.disable(gl.SCISSOR_TEST)
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
        gl.uniform1f(resources.uniforms.hero, hero ? 1 : 0)
        gl.uniform2f(resources.uniforms.imageSize, 1, 1)
        gl.uniform2f(resources.uniforms.birdTexel, 1 / 1024, 1 / 1024)
        // Every sampler is complete, including the unused secondary portrait.
        ;['portrait', 'clouds', 'birds'].forEach((name, slot) => {
          const texture = gl.createTexture()
          if (!texture) throw new Error('World texture allocation failed.')
          resources.textures.push(texture)
          gl.activeTexture(gl.TEXTURE0 + slot)
          gl.bindTexture(gl.TEXTURE_2D, texture)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4))
          gl.uniform1i(resources.uniforms[name], slot)
        })
        const viewport = gl.getParameter(gl.MAX_VIEWPORT_DIMS)
        const bufferLimit = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)
        resources.maxWidth = Math.min(MAX_DIMENSION, viewport[0], bufferLimit)
        resources.maxHeight = Math.min(MAX_DIMENSION, viewport[1], bufferLimit)
        if (gl.getError() !== gl.NO_ERROR) throw new Error('World initialization failed.')
        loadAssets(resources)
      } catch {
        fail()
      }
    }
    const measure = () => {
      rect = canvas.getBoundingClientRect()
      cssWidth = rect.width
      cssHeight = rect.height
      const r = scene.getBoundingClientRect()
      scroll = hero
        ? clamp(-r.top / Math.max(1, r.height - window.innerHeight), 0, 1)
        : clamp((window.innerHeight - r.top) / Math.max(1, r.height + window.innerHeight), 0, 1)
      geometryDirty = false
    }
    const resizeBuffer = () => {
      const scale = Math.min(1, renderer.maxWidth / cssWidth, renderer.maxHeight / cssHeight,
        Math.sqrt(MAX_PIXELS / (cssWidth * cssHeight)))
      // No DPR multiplier; both dimensions AND total pixel work are bounded.
      const width = Math.max(1, Math.floor(cssWidth * scale))
      const height = Math.max(1, Math.floor(cssHeight * scale))
      if (canvas.width !== width) canvas.width = width
      if (canvas.height !== height) canvas.height = height
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
      gl.uniform2f(renderer.uniforms.resolution, cssWidth, cssHeight)
      sizeDirty = false
    }
    const draw = () => {
      try {
        if (gl.isContextLost()) {
          stop()
          hide()
          return false
        }
        if (geometryDirty) measure()
        if (cssWidth <= 0 || cssHeight <= 0) {
          hide()
          return false
        }
        if (sizeDirty) resizeBuffer()
        const uniforms = renderer.uniforms
        gl.uniform2f(uniforms.pointer,
          pointerClient ? clamp((pointerClient[0] - rect.left) / cssWidth - .5, -.5, .5) : 0,
          pointerClient ? clamp((pointerClient[1] - rect.top) / cssHeight - .5, -.5, .5) : 0)
        gl.uniform1f(uniforms.time, elapsed)
        gl.uniform1f(uniforms.scroll, scroll)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
        // Validate and touch the DOM only when presenting a new ready surface.
        if (canvas.dataset.ready !== 'true') {
          if (gl.getError() !== gl.NO_ERROR) throw new Error('World draw failed.')
          canvas.dataset.ready = 'true'
          canvas.style.removeProperty('visibility')
        }
        return true
      } catch {
        fail()
        return false
      }
    }
    const tick = (now) => {
      raf = 0
      if (!active() || !renderer?.ready) {
        last = null
        return
      }
      if (last === null || now - last >= FRAME_INTERVAL - .5) {
        if (last !== null) elapsed += Math.min((now - last) / 1000, .12)
        last = now
        if (!draw()) {
          last = null
          return
        }
      }
      raf = requestAnimationFrame(tick)
    }
    function sync() {
      if (!active()) {
        stop()
        return
      }
      if (last === null) geometryDirty = true
      if (!renderer) {
        measure()
        if (cssWidth <= 0 || cssHeight <= 0) return
        initialize()
      } else if (hero && renderer.requestedMobile !== mobile) {
        loadAssets(renderer)
      }
      if (renderer?.ready && !raf) raf = requestAnimationFrame(tick)
    }
    const fallbackVisibility = () => {
      const r = canvas.getBoundingClientRect()
      visible = r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 &&
        r.top < window.innerHeight && r.left < window.innerWidth
    }
    const onScroll = () => {
      geometryDirty = true
      if (!observer) fallbackVisibility()
      sync()
    }
    const onResize = () => {
      geometryDirty = true
      sizeDirty = true
      if (!observer) fallbackVisibility()
      // Do not clear/draw the backing buffer while still or hidden. Let the
      // responsive picture handle the new crop until live rendering resumes.
      if (!active()) hide()
      sync()
    }
    const onBreakpoint = () => {
      const nextMobile = media?.matches ?? window.innerWidth <= 900
      if (nextMobile !== mobile) {
        mobile = nextMobile
        if (hero) {
          assetVersion += 1
          if (renderer) {
            renderer.ready = false
            renderer.requestedMobile = null
          }
          hide()
        }
      }
      onResize()
    }
    const move = (event) => {
      if (active() && event.pointerType !== 'touch') pointerClient = [event.clientX, event.clientY]
    }
    const leave = () => { pointerClient = null }
    const lost = (event) => {
      event.preventDefault()
      contextLost = true
      assetVersion += 1
      stop()
      hide()
      // All WebGL handles are invalid after loss; never reuse them on restore.
      renderer = null
    }
    const restored = () => {
      contextLost = false
      failed = false
      geometryDirty = true
      sizeDirty = true
      sync()
    }

    hide()
    syncRef.current = sync
    canvas.addEventListener('webglcontextlost', lost)
    canvas.addEventListener('webglcontextrestored', restored)
    scene.addEventListener('pointermove', move, { passive: true })
    scene.addEventListener('pointerleave', leave)
    document.addEventListener('visibilitychange', sync)
    window.addEventListener('scroll', onScroll, { passive: true, capture: true })
    window.addEventListener('resize', onBreakpoint, { passive: true })
    if (media?.addEventListener) media.addEventListener('change', onBreakpoint)
    else media?.addListener(onBreakpoint)
    if (typeof IntersectionObserver === 'function') {
      observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting && entry.intersectionRatio > 0
        geometryDirty = true
        sync()
      })
      observer.observe(canvas)
    } else fallbackVisibility()
    if (typeof ResizeObserver === 'function') {
      resizer = new ResizeObserver(onResize)
      resizer.observe(canvas)
      if (scene !== canvas) resizer.observe(scene)
    }
    sync()

    return () => {
      disposed = true
      assetVersion += 1
      syncRef.current = null
      stop()
      hide()
      observer?.disconnect()
      resizer?.disconnect()
      scene.removeEventListener('pointermove', move)
      scene.removeEventListener('pointerleave', leave)
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onBreakpoint)
      canvas.removeEventListener('webglcontextlost', lost)
      canvas.removeEventListener('webglcontextrestored', restored)
      if (media?.removeEventListener) media.removeEventListener('change', onBreakpoint)
      else media?.removeListener(onBreakpoint)
      pendingImages.forEach((cancel) => cancel())
      imageCache.clear()
      release(renderer)
    }
  }, [hero, sceneRef])

  return <canvas ref={ref} className="world-canvas" aria-hidden="true" data-ready="false" />
}
