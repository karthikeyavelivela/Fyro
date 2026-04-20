'use client'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Environment } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

function Card3D() {
  const card = useRef<THREE.Group>(null)
  const shine = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (card.current) {
      card.current.rotation.y = Math.sin(t * 0.5) * 0.45
      card.current.rotation.x = Math.sin(t * 0.35) * 0.12
      card.current.position.y = Math.sin(t * 0.7) * 0.07
    }
    if (shine.current) {
      shine.current.rotation.z = t * 0.8
    }
  })

  return (
    <group ref={card}>
      <mesh>
        <boxGeometry args={[1.7, 1.05, 0.045]} />
        <meshPhysicalMaterial color="#1A1916" metalness={0.9} roughness={0.05} />
      </mesh>
      <mesh ref={shine} position={[0, 0, 0.024]}>
        <planeGeometry args={[1.68, 1.03]} />
        <meshPhysicalMaterial
          color="#FF6B2B"
          transmission={0.85}
          roughness={0}
          metalness={0.5}
          transparent
          opacity={0.08}
        />
      </mesh>
      <group position={[-0.5, 0.2, 0.025]}>
        <mesh>
          <boxGeometry args={[0.22, 0.17, 0.008]} />
          <meshStandardMaterial color="#D97706" metalness={0.95} roughness={0.05} />
        </mesh>
        {[-0.05, 0, 0.05].map((x, i) => (
          <mesh key={i} position={[x, 0, 0.005]}>
            <boxGeometry args={[0.01, 0.14, 0.003]} />
            <meshStandardMaterial color="#92400E" metalness={0.8} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, -0.38, 0.025]}>
        <boxGeometry args={[1.7, 0.1, 0.003]} />
        <meshStandardMaterial
          color="#FF6B2B"
          emissive="#FF6B2B"
          emissiveIntensity={0.3}
          metalness={0.4}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0.55, 0.2, 0.025]}>
        <torusGeometry args={[0.06, 0.007, 8, 24, Math.PI * 1.2]} />
        <meshStandardMaterial color="#FF8047" metalness={0.6} />
      </mesh>
      <mesh position={[0.55, 0.2, 0.025]}>
        <torusGeometry args={[0.1, 0.007, 8, 24, Math.PI * 1.2]} />
        <meshStandardMaterial color="#FF8047" metalness={0.6} />
      </mesh>
      {[
        [-0.5, -0.1],
        [-0.2, -0.1],
        [0.1, -0.1],
        [0.4, -0.1],
      ].map(([x, y], gi) => (
        <group key={gi} position={[x, y, 0.025]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[i * 0.035 - 0.052, 0, 0]}>
              <sphereGeometry args={[0.009, 8, 8]} />
              <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.2} />
            </mesh>
          ))}
        </group>
      ))}
      <Float speed={3} floatIntensity={0.4}>
        <mesh position={[1.1, 0.7, 0.2]}>
          <sphereGeometry args={[0.065, 16, 16]} />
          <meshStandardMaterial
            color="#FF6B2B"
            emissive="#FF6B2B"
            emissiveIntensity={0.7}
            metalness={0.2}
            roughness={0.1}
          />
        </mesh>
      </Float>
      <Float speed={2} floatIntensity={0.3}>
        <mesh position={[-1.1, -0.6, 0.1]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial color="#D97706" emissive="#D97706" emissiveIntensity={0.5} />
        </mesh>
      </Float>
    </group>
  )
}

export default function CreditCard3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 3.5], fov: 42 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent', width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 6, 4]} intensity={1.8} color="#FFF5EE" />
      <pointLight position={[-3, 2, 2]} intensity={0.8} color="#FF6B2B" />
      <pointLight position={[3, -2, 1]} intensity={0.4} color="#FFF0E9" />
      <Environment preset="city" />
      <Card3D />
    </Canvas>
  )
}
