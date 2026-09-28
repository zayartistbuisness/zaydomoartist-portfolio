// Original WebGL 1 halftone: the Blender render supplies all of the motion.
// No time/scroll uniforms, procedural replacement animals, or opaque backdrop.
export const pixelSceneVertexShader = `
attribute vec2 a_position;
varying mediump vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

export const pixelSceneFragmentShader = `
precision mediump float;

varying mediump vec2 v_uv;
uniform sampler2D u_frame;
uniform vec2 u_resolution;
uniform vec2 u_display;
uniform vec2 u_content;
uniform vec3 u_ink;
uniform float u_threshold;
uniform float u_grid;
uniform float u_opacity;

void main() {
  vec2 point = v_uv * u_display;
  vec2 cell = vec2(u_grid, u_grid * 1.8);
  vec2 center = (floor(point / cell) + 0.5) * cell;
  vec2 inset = (u_display - u_content) * 0.5;
  vec2 sampleUV = (center - inset) / u_content;
  vec2 imageUV = (point - inset) / u_content;

  // Contain, rather than stretch or crop, the original bird/fox/aperture.
  if (min(min(sampleUV.x, sampleUV.y), min(imageUV.x, imageUV.y)) < 0.0 ||
      max(max(sampleUV.x, sampleUV.y), max(imageUV.x, imageUV.y)) > 1.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  vec4 source = texture2D(u_frame, sampleUV);
  float luma = dot(source.rgb, vec3(0.2126, 0.7152, 0.0722));
  float tone = clamp((luma - u_threshold) / (1.0 - u_threshold), 0.0, 1.0);
  float key = smoothstep(u_threshold, min(1.0, u_threshold + 0.10), luma);

  // Bright surfaces make wider vertical ink strokes, not white rectangles.
  float halfWidth = cell.x * mix(0.055, 0.39, pow(tone, 0.72));
  float halfHeight = cell.y * 0.40;
  vec2 distanceToCenter = abs(point - center);
  float aa = max(u_display.x / u_resolution.x, u_display.y / u_resolution.y) * 0.65;
  float stroke = 1.0 - smoothstep(halfWidth - aa, halfWidth + aa, distanceToCenter.x);
  float ends = 1.0 - smoothstep(halfHeight - aa, halfHeight + aa, distanceToCenter.y);
  float alpha = clamp(stroke * ends * key * source.a * u_opacity, 0.0, 1.0);

  // The context expects premultiplied color. Black source => exactly RGBA 0.
  gl_FragColor = vec4(u_ink * alpha, alpha);
}
`

const MAX_AXIS = 1024
const MAX_PIXELS = 1_000_000
const DEFAULT_INK = [41 / 255, 45 / 255, 39 / 255]

function finite(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function pixelSceneSize(width, height, dpr = 1) {
  const w = Math.max(1, finite(width, 1))
  const h = Math.max(1, finite(height, 1))
  const scale = Math.min(
    Math.max(0.1, finite(dpr, 1)),
    MAX_AXIS / Math.max(w, h),
    Math.sqrt(MAX_PIXELS / (w * h)),
  )
  return [Math.max(1, Math.floor(w * scale)), Math.max(1, Math.floor(h * scale))]
}

export function pixelSceneColor(color) {
  const hex = typeof color === 'string' ? color.trim().replace(/^#/, '') : ''
  const expanded = /^[a-f\d]{3}$/i.test(hex) ? hex.split('').map((digit) => digit + digit).join('') : hex
  if (!/^[a-f\d]{6}$/i.test(expanded)) return DEFAULT_INK
  return [0, 2, 4].map((offset) => parseInt(expanded.slice(offset, offset + 2), 16) / 255)
}

/**
 * One source texture and one full-screen quad; no render loop of its own.
 * preserveDrawingBuffer is intentional: a paused layer must retain its frame
 * without a background RAF or a second snapshot canvas.
 */
export function createPixelSceneRenderer(canvas) {
  const attributes = {
    alpha: true,
    premultipliedAlpha: true,
    preserveDrawingBuffer: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
  }
  let gl
  try {
    gl = canvas.getContext('webgl', attributes) || canvas.getContext('experimental-webgl', attributes)
  } catch {
    return null
  }
  if (!gl) return null

  let program
  let buffer
  let texture
  let staging
  let stagingContext
  let disposed = false
  let hasFrame = false
  let display = [1, 1]
  let sourceSize = [1, 1]
  const shaders = []
  const uniforms = {}

  function dispose() {
    if (disposed) return
    disposed = true
    if (!gl.isContextLost()) {
      if (texture) gl.deleteTexture(texture)
      if (buffer) gl.deleteBuffer(buffer)
      if (program) gl.deleteProgram(program)
      shaders.forEach((shader) => gl.deleteShader(shader))
    }
    // Do not force WEBGL_lose_context here: StrictMode reuses this DOM canvas.
    // Free any downsampling surface too, including its large backing store.
    if (staging) staging.width = staging.height = 1
    staging = stagingContext = texture = buffer = program = null
    shaders.length = 0
    hasFrame = false
  }

  try {
    const compile = (type, source) => {
      const shader = gl.createShader(type)
      if (!shader) throw new Error('PixelScene: shader allocation failed')
      shaders.push(shader)
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('PixelScene: shader compilation failed')
      return shader
    }
    program = gl.createProgram()
    if (!program) throw new Error('PixelScene: program allocation failed')
    gl.attachShader(program, compile(gl.VERTEX_SHADER, pixelSceneVertexShader))
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, pixelSceneFragmentShader))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('PixelScene: program linking failed')
    shaders.forEach((shader) => {
      gl.detachShader(program, shader)
      gl.deleteShader(shader)
    })
    shaders.length = 0

    buffer = gl.createBuffer()
    texture = gl.createTexture()
    if (!buffer || !texture) throw new Error('PixelScene: buffer allocation failed')
    gl.useProgram(program)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.BLEND) // Each fragment replaces the buffer with premultiplied RGBA.
    gl.clearColor(0, 0, 0, 0)
    for (const name of ['frame', 'resolution', 'display', 'content', 'ink', 'threshold', 'grid', 'opacity']) {
      uniforms[name] = gl.getUniformLocation(program, `u_${name}`)
    }
    gl.uniform1i(uniforms.frame, 0)
  } catch {
    dispose()
    return null
  }

  return {
    get hasFrame() { return hasFrame },
    resize(width, height, dpr = 1) {
      if (disposed) return false
      const nextDisplay = [Math.max(1, width), Math.max(1, height)]
      const [w, h] = pixelSceneSize(...nextDisplay, Math.min(2, dpr))
      const changed = canvas.width !== w || canvas.height !== h ||
        display[0] !== nextDisplay[0] || display[1] !== nextDisplay[1]
      display = nextDisplay
      if (canvas.width !== w) canvas.width = w
      if (canvas.height !== h) canvas.height = h
      gl.viewport(0, 0, w, h)
      return changed
    },
    upload(source) {
      if (disposed || gl.isContextLost()) return false
      const width = source.videoWidth || source.naturalWidth || source.width
      const height = source.videoHeight || source.naturalHeight || source.height
      if (!width || !height) return false
      sourceSize = [width, height]
      const [w, h] = pixelSceneSize(width, height)
      let pixels = source
      // The drawing buffer AND upload texture stay within the same budget.
      if (width !== w || height !== h) {
        staging ??= document.createElement('canvas')
        stagingContext ??= staging.getContext('2d', { alpha: true })
        if (!stagingContext) throw new Error('PixelScene: downsampling unavailable')
        if (staging.width !== w) staging.width = w
        if (staging.height !== h) staging.height = h
        stagingContext.clearRect(0, 0, w, h)
        stagingContext.drawImage(source, 0, 0, w, h)
        pixels = staging
      }
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
      hasFrame = true
      return true
    },
    draw({ color = '#292d27', threshold = 0.16, grid = 4, opacity = 1 } = {}) {
      if (disposed || !hasFrame || gl.isContextLost()) return false
      const fit = Math.min(display[0] / sourceSize[0], display[1] / sourceSize[1])
      gl.useProgram(program)
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height)
      gl.uniform2f(uniforms.display, ...display)
      gl.uniform2f(uniforms.content, sourceSize[0] * fit, sourceSize[1] * fit)
      gl.uniform3fv(uniforms.ink, pixelSceneColor(color))
      gl.uniform1f(uniforms.threshold, Math.min(0.95, Math.max(0, finite(threshold, 0.16))))
      gl.uniform1f(uniforms.grid, Math.min(64, Math.max(1, finite(grid, 4))))
      gl.uniform1f(uniforms.opacity, Math.min(1, Math.max(0, finite(opacity, 1))))
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      return true
    },
    dispose,
  }
}
