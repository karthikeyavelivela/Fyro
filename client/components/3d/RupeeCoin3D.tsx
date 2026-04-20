'use client'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Environment } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

function Coin({ innerRef, accent, gold }: { innerRef?: any; accent: string; gold: string }) {
  return (
    <group ref={innerRef}>
      <mesh>
        <cylinderGeometry args={[0.38, 0.38, 0.055, 40]} />
        <meshPhysicalMaterial color={gold} metalness={0.95} roughness={0.05} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.34, 40]} />
        <meshStandardMaterial color={accent} metalness={0.8} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.08, 0.18, 40, 1, 0, Math.PI]} />
        <meshStandardMaterial color={accent} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.03, 0.06]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.22, 0.03]} />
        <meshStandardMaterial color={accent} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.03, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.22, 0.03]} />
        <meshStandardMaterial color={accent} metalness={0.8} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.4, 0.4, 0.03, 40]} />
        <meshStandardMaterial color={gold} metalness={0.9} roughness={0.08} />
      </mesh>
    </group>
  )
}

function CoinStack({ teal = false }: { teal?: boolean }) {
  const coin1 = useRef<THREE.Group>(null)
  const coin2 = useRef<THREE.Group>(null)
  const coin3 = useRef<THREE.Group>(null)
  const accent = teal ? '#0D9488' : '#FF6B2B'
  const gold = teal ? '#0F766E' : '#D97706'

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (coin1.current) {
      coin1.current.rotation.y = t * 1.1
      coin1.current.position.y = Math.sin(t * 0.8) * 0.08
    }
    if (coin2.current) {
      coin2.current.rotation.y = t * 0.8 + 1
      coin2.current.position.y = 0.38 + Math.sin(t * 1.0 + 2) * 0.06
    }
    if (coin3.current) {
      coin3.current.rotation.y = t * -0.6 + 2
      coin3.current.position.y = -0.35 + Math.sin(t * 1.2) * 0.05
    }
  })

  return (
    <group>
      <group ref={coin1} position={[0, 0, 0]}>
        <Coin accent={accent} gold={gold} />
      </group>
      <group ref={coin2} position={[0.32, 0.38, 0.1]} scale={0.62}>
        <Coin accent={accent} gold={gold} />
      </group>
      <group ref={coin3} position={[-0.28, -0.35, -0.05]} scale={0.45}>
        <Coin accent={accent} gold={gold} />
      </group>
      {[0, 1, 2, 3, 4].map((i) => (
        <Float key={i} speed={1.5 + i * 0.4} floatIntensity={0.8}>
          <mesh
            position={[
              Math.cos((i * Math.PI * 2) / 5) * 0.75,
              Math.sin((i * Math.PI * 2) / 5) * 0.4,
              0.1,
            ]}
          >
            <octahedronGeometry args={[0.028, 0]} />
            <meshStandardMaterial
              color={gold}
              emissive={gold}
              emissiveIntensity={0.8}
              metalness={0.9}
            />
          </mesh>
        </Float>
      ))}
    </group>
  )
}

export default function RupeeCoin3D({ teal = false }: { teal?: boolean }) {
  return (
    <Canvas
      camera={{ position: [0, 0.2, 2.8], fov: 44 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent', width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[4, 6, 4]}
        intensity={1.8}
        color={teal ? '#F0FFFC' : '#FFF5EE'}
      />
      <pointLight position={[-2, 2, 2]} intensity={0.8} color={teal ? '#0D9488' : '#FF6B2B'} />
      <Environment preset="sunset" />
      <CoinStack teal={teal} />
    </Canvas>
  )
}
