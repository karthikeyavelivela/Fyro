'use client'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

function BoxesMesh() {
  const b1 = useRef<THREE.Mesh>(null)
  const b2 = useRef<THREE.Mesh>(null)
  const b3 = useRef<THREE.Mesh>(null)
  const arrow = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (b1.current) {
      b1.current.rotation.y = t * 0.4
      b1.current.rotation.x = Math.sin(t * 0.5) * 0.08
    }
    if (b2.current) {
      b2.current.position.y = 0.32 + Math.sin(t * 1.1) * 0.06
      b2.current.rotation.y = t * -0.35
    }
    if (b3.current) {
      b3.current.position.y = 0.64 + Math.sin(t * 0.9 + 1.5) * 0.07
      b3.current.rotation.y = t * 0.5
    }
    if (arrow.current) {
      arrow.current.position.y = 0.5 + Math.sin(t * 2) * 0.1
    }
  })

  return (
    <group>
      <mesh ref={b1} position={[0, 0, 0]}>
        <boxGeometry args={[0.58, 0.28, 0.48]} />
        <meshStandardMaterial color="#0D9488" roughness={0.2} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.142, 0]}>
        <boxGeometry args={[0.6, 0.018, 0.06]} />
        <meshStandardMaterial color="#F59E0B" metalness={0.7} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.142, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.5, 0.018, 0.06]} />
        <meshStandardMaterial color="#F59E0B" metalness={0.7} roughness={0.1} />
      </mesh>
      <mesh ref={b2} position={[0.06, 0.32, 0]}>
        <boxGeometry args={[0.44, 0.22, 0.38]} />
        <meshStandardMaterial color="#0F766E" roughness={0.2} metalness={0.2} />
      </mesh>
      <mesh position={[0.06, 0.32, 0.192]}>
        <boxGeometry args={[0.2, 0.08, 0.005]} />
        <meshStandardMaterial color="white" roughness={0.4} />
      </mesh>
      <mesh ref={b3} position={[-0.04, 0.64, 0]}>
        <boxGeometry args={[0.3, 0.18, 0.25]} />
        <meshStandardMaterial color="#14B8A6" roughness={0.18} metalness={0.22} />
      </mesh>
      <mesh ref={arrow} position={[0.55, 0.5, 0]}>
        <coneGeometry args={[0.06, 0.22, 12]} />
        <meshStandardMaterial
          color="white"
          emissive="white"
          emissiveIntensity={0.3}
          transparent
          opacity={0.85}
        />
      </mesh>
      <mesh position={[0.55, 0.34, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.18, 8]} />
        <meshStandardMaterial color="white" transparent opacity={0.7} />
      </mesh>
    </group>
  )
}

export default function FloatingBoxes3D() {
  return (
    <Canvas
      camera={{ position: [0, 0.4, 2.4], fov: 50 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent', width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 3]} intensity={1.5} color="#F0FFFC" />
      <pointLight position={[-2, 2, 2]} intensity={0.6} color="#0D9488" />
      <Environment preset="dawn" />
      <BoxesMesh />
    </Canvas>
  )
}
