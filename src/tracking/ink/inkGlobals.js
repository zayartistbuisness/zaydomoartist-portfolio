import * as THREE from 'three'

// sRGB components straight into the shader: the ink pass runs after three's
// colorspace conversion, so these are compared against display-space colors.
const srgb = (hex) => {
  const c = new THREE.Color()
  c.setHex(hex, THREE.NoColorSpace)
  return new THREE.Vector3(c.r, c.g, c.b)
}

export const PALETTE = {
  paper: 0xe8e4db,
  ink: 0x111110,
  rec: 0xd7331f,
}

// One set of uniform objects shared by every inked material. Materials
// reference these objects directly, so a single write updates the whole scene.
export const inkGlobals = {
  uInkRes: { value: new THREE.Vector2(1, 1) },
  uInkPitch: { value: 6 },
  uInkTime: { value: 0 },
  uInkDpr: { value: 1 },
  uLensPos: { value: new THREE.Vector2(-1e4, -1e4) },
  uLensRadius: { value: 170 },
  uLensStrength: { value: 0 },
  uTracking: { value: 1 },
  uInkColor: { value: srgb(PALETTE.ink) },
  uPaperColor: { value: srgb(PALETTE.paper) },
}

// Tunables the lab panel writes to; InkDriver converts CSS px → device px.
export const inkSettings = {
  pitchCss: 4,
  lensRadiusCss: 150,
  tracking: 1,
}
