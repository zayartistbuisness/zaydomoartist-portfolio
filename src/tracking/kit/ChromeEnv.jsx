import { Environment, Lightformer } from '@react-three/drei'

// Monochrome studio for chrome: pale room, white softboxes, dark bands so
// the metal carries graphic contrast. Rendered once into a cube map.
// Mount one per scene (the main scene and each HUD pass have their own).
export default function ChromeEnv() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={['#cbc8c1']} />
      <Lightformer form="rect" intensity={2.6} position={[0, 5, -1]} rotation-x={Math.PI / 2} scale={[12, 5, 1]} />
      <Lightformer form="rect" intensity={1.7} position={[-5, 1, 0]} rotation-y={Math.PI / 2} scale={[2.5, 9, 1]} />
      <Lightformer form="rect" intensity={1.4} position={[5, 0.5, 1]} rotation-y={-Math.PI / 2} scale={[1.5, 9, 1]} />
      <Lightformer form="ring" intensity={1.3} position={[2.5, 2, 6]} scale={3} />
      <mesh position={[0, -3, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial color="#171716" />
      </mesh>
      <mesh position={[-1.5, 0, -6]}>
        <planeGeometry args={[2.2, 30]} />
        <meshBasicMaterial color="#0d0d0c" />
      </mesh>
      <mesh position={[3, 0, 6]} rotation-y={Math.PI}>
        <planeGeometry args={[1.2, 30]} />
        <meshBasicMaterial color="#0d0d0c" />
      </mesh>
    </Environment>
  )
}
