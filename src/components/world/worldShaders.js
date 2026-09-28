// Original shader. Portrait + atmosphere + Blender sprite animation share a
// single screen-space ink grid; nothing is copied from the reference site.
export const vertexShader = `
attribute vec2 a_position;
#ifdef GL_FRAGMENT_PRECISION_HIGH
varying highp vec2 v_uv;
#else
varying mediump vec2 v_uv;
#endif
void main() {
  v_uv = a_position * .5 + .5;
  gl_Position = vec4(a_position, 0., 1.);
}
`

export const fragmentShader = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v_uv;
uniform sampler2D u_portrait;
uniform sampler2D u_clouds;
uniform sampler2D u_birds;
uniform vec2 u_resolution;
uniform vec2 u_imageSize;
uniform vec2 u_birdTexel;
uniform vec2 u_pointer;
uniform float u_time;
uniform float u_scroll;
uniform float u_hero;
uniform float u_mobile;

const vec3 paper = vec3(.906, .886, .847);
const vec3 ink = vec3(.135, .17, .145);

float hash(vec2 p) {
#ifdef GL_FRAGMENT_PRECISION_HIGH
  return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453);
#else
  // A small ordered matrix avoids overflow on mediump-only fragment hardware.
  vec2 a = mod(floor(p), 2.);
  vec2 b = mod(floor(p / 2.), 2.);
  return (4. * (2. * a.x + 3. * a.y - 4. * a.x * a.y)
    + 2. * b.x + 3. * b.y - 4. * b.x * b.y + .5) / 16.;
#endif
}
vec2 coverUV(vec2 uv) {
  float imageAspect = u_imageSize.x / u_imageSize.y;
  float screenAspect = u_resolution.x / u_resolution.y;
  vec2 size = vec2(1.);
  if (screenAspect > imageAspect) size.y = imageAspect / screenAspect;
  else size.x = screenAspect / imageAspect;
  return (uv - .5) * size + .5;
}
float inBounds(vec2 p) {
  return step(0.,p.x)*step(p.x,1.)*step(0.,p.y)*step(p.y,1.);
}
// Ink width is brightness-driven, with a coarse repeating matrix rather than
// a blur filter. Clusters retain the silhouette of the source animation.
float engraving(vec2 uv, float density, float pitch) {
  vec2 grid = uv * u_resolution / vec2(pitch, pitch*1.7);
  vec2 cell = floor(grid);
  vec2 local = fract(grid);
  float threshold = hash(cell);
  // A zero-density cell must stay empty even when its hash happens to be zero.
  float stipple = step(threshold, density) * step(.0001, density);
  float line = step(abs(local.x-.5), mix(.075,.45,density));
  return stipple * line * step(.06,local.y);
}
float cloud(vec2 uv, vec2 center, vec2 size, float time) {
  vec2 p = (uv-center) / size + .5;
  p.x += sin(time*.08)*.035;
  p.y += sin(p.x*5.+time*.13)*.014;
  if (inBounds(p) < .5) return 0.;
  vec4 tex = texture2D(u_clouds, p);
  // The generated cloud spans its side edges; taper rather than reveal a
  // rectangular texture boundary while its layer travels across the page.
  float edge = smoothstep(0.,.075,p.x) * (1.-smoothstep(.925,1.,p.x));
  edge *= smoothstep(0.,.045,p.y) * (1.-smoothstep(.955,1.,p.y));
  return dot(tex.rgb,vec3(.3333))*tex.a*edge;
}
float bird(vec2 uv, vec2 center, float size, float angle, float phase) {
  vec2 p = (uv-center) * vec2(u_resolution.x/u_resolution.y,1.);
  p = mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*p/size+.5;
  if (inBounds(p) < .5) return 0.;
  float frame = mod(floor(u_time*12.+phase),16.);
  vec2 cell = vec2(mod(frame,4.),3.-floor(frame/4.));
  // Keep bilinear taps inside the current 256px atlas frame.
  vec2 low = cell / 4. + u_birdTexel * .5;
  vec2 high = (cell + 1.) / 4. - u_birdTexel * .5;
  vec4 tex = texture2D(u_birds, mix(low, high, p));
  return tex.a;
}
void main() {
  vec2 uv = v_uv;
  vec2 gridUV = (floor(uv*u_resolution/4.)+.5)*4./u_resolution;
  float t = u_time;
  float scroll = clamp(u_scroll,0.,1.);
  // Straight-alpha output, matching the canvas context. Both translucent
  // layers are ink: do not pre-mix with paper before the browser composites.
  vec3 color = ink;
  float alpha = 0.;
  if (u_hero > .5) {
    vec2 photoUV = coverUV(uv);
    photoUV += vec2(u_pointer.x*.003,u_pointer.y*.002);
    vec3 photo = texture2D(u_portrait,photoUV).rgb;
    vec2 coarseUV = coverUV(gridUV) + vec2(u_pointer.x*.003,u_pointer.y*.002);
    vec3 coarse = texture2D(u_portrait,coarseUV).rgb;
    float lum = dot(coarse,vec3(.299,.587,.114));
    float bottom = 1.-smoothstep(.04,.42,uv.y);
    float side = smoothstep(.52,.92,uv.x)*(1.-smoothstep(.32,.57,uv.y));
    float faceX = mix(.71,.57,u_mobile);
    float face = 1.-smoothstep(.75,1.25,length((photoUV-vec2(faceX,.67))/vec2(.17,.30)));
    float dissolve = smoothstep(.34,.96,scroll)*(1.-face*.85);
    float treatment = clamp(bottom*.68+side*.28+dissolve,0.,1.);
    float density = clamp((.90-lum)*1.8,0.,1.);
    vec3 etched = mix(paper,ink,engraving(uv,density,3.2));
    color = mix(photo,etched,treatment);
    // Seamless paper at the lower edge, not a rectangular photograph.
    color = mix(paper,color,smoothstep(0.,.13,uv.y));
    alpha = 1.;
  }
  float cloudY = mix(.15,.48,1.-u_hero);
  float drift = sin(t*.055)*.07 + scroll*.12;
  float c = cloud(gridUV,vec2(.55+drift,cloudY+scroll*.19),vec2(1.7,.57),t);
  float c2 = cloud(gridUV,vec2(.10-drift*.6,cloudY-.16),vec2(1.05,.40),t+20.);
  float density = clamp(c*.78+c2*.37,0.,.9);
  float cloudInk = engraving(uv,density,4.3);
  // Leave the left copy/CTA untouched, except at the actual bottom transition.
  // UV Y runs from bottom to top; protection is complete at x < .39, y > .10.
  float copyClearance = max(smoothstep(.39,.49,uv.x),1.-smoothstep(.06,.10,uv.y));
  float cloudMix = cloudInk * mix(.28,.62,1.-u_hero) * mix(1.,copyClearance,u_hero);
  color = mix(color,ink,cloudMix);
  alpha = cloudMix + alpha * (1. - cloudMix);
  // Four independently phased flights. Their wingbeats are rendered Blender
  // frames; scroll controls travel while time controls the wing cycle.
  float baseY = mix(.23,.55,1.-u_hero);
  float flight = mod(t*.012+scroll*.39,1.);
  float birds = 0.;
  birds = max(birds,bird(gridUV,vec2(.49+sin(t*.19)*.025+scroll*.20,baseY+.13+sin(t*.16)*.025),.12,.8,0.));
  birds = max(birds,bird(gridUV,vec2(.33+flight*.30,baseY-.045+sin(t*.13)*.018),.085,.48,5.));
  birds = max(birds,bird(gridUV,vec2(.16+flight*.22,baseY+.09+sin(t*.17+2.)*.025),.057,.6,10.));
  birds = max(birds,bird(gridUV,vec2(.78+sin(t*.12)*.07,baseY-.08+scroll*.12),.073,-.65,3.));
  float b = birds * mix(.7,1.,engraving(uv,.82,2.0));
  color = mix(color,ink,b);
  alpha = b + alpha * (1. - b);
  // A tiny, stable paper grain, not time-varying noise or flashing pixels.
  color += (hash(floor(uv*u_resolution))-.5)*.012*u_hero;
  gl_FragColor = vec4(color,alpha);
}
`
