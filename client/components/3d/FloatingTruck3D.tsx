'use client'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

function TruckMesh() {
  const truck = useRef<THREE.Group>(null)
  const w0 = useRef<THREE.Mesh>(null)
  const w1 = useRef<THREE.Mesh>(null)
  const w2 = useRef<THREE.Mesh>(null)
  const w3 = useRef<THREE.Mesh>(null)
  const wheels = [w0, w1, w2, w3]

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (truck.current) {
      truck.current.position.y = Math.sin(t * 1.2) * 0.06
      truck.current.rotation.y = Math.sin(t * 0.3) * 0.18
    }
    wheels.forEach((w) => {
      if (w.current) w.current.rotation.x = t * 4
    })
  })

  const wheelPositions: [number, number, number][] = [
    [0.42, -0.22, 0.32],
    [0.42, -0.22, -0.32],
    [-0.38, -0.22, 0.32],
    [-0.38, -0.22, -0.32],
  ]

  return (
    <group ref={truck}>
      <mesh position={[-0.25, 0.05, 0]}>
        <boxGeometry args={[0.9, 0.52, 0.6]} />
        <meshStandardMaterial color="white" roughness={0.15} metalness={0.3} />
      </mesh>
      <mesh position={[-0.25, 0.05, 0.305]}>
        <boxGeometry args={[0.9, 0.12, 0.005]} />
        <meshStandardMaterial color="#FF6B2B" emissive="#FF6B2B" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[0.46, 0.06, 0]}>
        <boxGeometry args={[0.46, 0.5, 0.58]} />
        <meshStandardMaterial color="#FF6B2B" roughness={0.2} metalness={0.3} />
      </mesh>
      <mesh position={[0.7, 0.12, 0]}>
        <boxGeometry args={[0.01, 0.28, 0.42]} />
        <meshPhysicalMaterial
          color="#BFEFFF"
          transmission={0.8}
          roughness={0}
          metalness={0}
          transparent
          opacity={0.7}
        />
      </mesh>
      <mesh position={[0.7, -0.02, 0.2]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color="#FFFDE7" emissive="#FFFDE7" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0.7, -0.02, -0.2]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color="#FFFDE7" emissive="#FFFDE7" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0.05, -0.18, 0]}>
        <boxGeometry args={[1.5, 0.07, 0.52]} />
        <meshStandardMaterial color="#374151" metalness={0.7} roughness={0.2} />
      </mesh>
      {wheelPositions.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh ref={wheels[i]} rotation={[0, Math.PI / 2, 0]}>
            <cylinderGeometry args={[0.13, 0.13, 0.09, 20]} />
            <meshStandardMaterial color="#1A1916" roughness={0.4} metalness={0.3} />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.095, 12]} />
            <meshStandardMaterial color="#C0C0C0" metalness={0.9} roughness={0.05} />
          </mesh>
        </group>
      ))}
      <mesh position={[-0.7, 0.25, 0.28]}>
        <cylinderGeometry args={[0.025, 0.02, 0.3, 8]} />
        <meshStandardMaterial color="#374151" metalness={0.7} />
      </mesh>
      <pointLight position={[0.8, 0, 0.25]} color="#FFFDE7" intensity={0.4} distance={0.8} />
      <pointLight position={[0.8, 0, -0.25]} color="#FFFDE7" intensity={0.4} distance={0.8} />
    </group>
  )
}

export default function FloatingTruck3D() {
  return (
    <Canvas
      camera={{ position: [0, 0.3, 2.5], fov: 48 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent', width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 3]} intensity={1.6} color="#FFF5EE" />
      <pointLight position={[-2, 2, 2]} intensity={0.5} color="#FF6B2B" />
      <Environment preset="city" />
      <TruckMesh />
    </Canvas>
  )
}
