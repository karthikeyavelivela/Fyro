'use client'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Environment } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

function BusinessFigure() {
  const group = useRef<THREE.Group>(null)
  const crystal = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.4) * 0.25
      group.current.position.y = Math.sin(t * 0.6) * 0.04
    }
    if (crystal.current) {
      crystal.current.rotation.y = t * 0.8
      crystal.current.rotation.x = Math.sin(t * 0.5) * 0.3
    }
  })

  return (
    <group ref={group}>
      <mesh position={[-0.12, -0.7, 0]}>
        <boxGeometry args={[0.13, 0.45, 0.12]} />
        <meshStandardMaterial color="#2D2926" roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[0.12, -0.7, 0]}>
        <boxGeometry args={[0.13, 0.45, 0.12]} />
        <meshStandardMaterial color="#2D2926" roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[0, -0.18, 0]}>
        <boxGeometry args={[0.42, 0.52, 0.22]} />
        <meshStandardMaterial color="#1A1916" roughness={0.2} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.05, 0.12]}>
        <boxGeometry args={[0.14, 0.12, 0.01]} />
        <meshStandardMaterial color="#F5F3EF" roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.05, 0.12]}>
        <boxGeometry args={[0.055, 0.28, 0.01]} />
        <meshStandardMaterial color="#FF6B2B" roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[-0.1, 0.02, 0.1]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.08, 0.18, 0.015]} />
        <meshStandardMaterial color="#2D2926" roughness={0.2} metalness={0.4} />
      </mesh>
      <mesh position={[0.1, 0.02, 0.1]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.08, 0.18, 0.015]} />
        <meshStandardMaterial color="#2D2926" roughness={0.2} metalness={0.4} />
      </mesh>
      <mesh position={[-0.28, -0.22, 0]} rotation={[0, 0, 0.15]}>
        <capsuleGeometry args={[0.065, 0.35, 8, 16]} />
        <meshStandardMaterial color="#1A1916" roughness={0.2} metalness={0.4} />
      </mesh>
      <mesh position={[0.28, -0.22, 0]} rotation={[0, 0, -0.15]}>
        <capsuleGeometry args={[0.065, 0.35, 8, 16]} />
        <meshStandardMaterial color="#1A1916" roughness={0.2} metalness={0.4} />
      </mesh>
      <group position={[0.42, -0.52, 0]}>
        <mesh>
          <boxGeometry args={[0.22, 0.16, 0.08]} />
          <meshStandardMaterial color="#FF6B2B" roughness={0.15} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <torusGeometry args={[0.05, 0.008, 8, 20, Math.PI]} />
          <meshStandardMaterial color="#C94A10" metalness={0.8} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0, 0.042]}>
          <boxGeometry args={[0.04, 0.025, 0.01]} />
          <meshStandardMaterial color="#D97706" metalness={0.9} roughness={0.05} />
        </mesh>
      </group>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.055, 0.065, 0.1, 16]} />
        <meshStandardMaterial color="#E8946A" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.18, 32, 32]} />
        <meshStandardMaterial color="#E8946A" roughness={0.4} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.52, 0]}>
        <sphereGeometry args={[0.165, 32, 32]} />
        <meshStandardMaterial color="#1A1208" roughness={0.6} />
      </mesh>
      <group position={[0, 0.41, 0.17]}>
        <mesh position={[-0.065, 0, 0]}>
          <torusGeometry args={[0.038, 0.005, 8, 24]} />
          <meshStandardMaterial color="#1A1916" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0.065, 0, 0]}>
          <torusGeometry args={[0.038, 0.005, 8, 24]} />
          <meshStandardMaterial color="#1A1916" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.04, 0.005, 0.005]} />
          <meshStandardMaterial color="#1A1916" metalness={0.9} />
        </mesh>
      </group>

      <Float speed={2.5} floatIntensity={0.6} rotationIntensity={0.4}>
        <mesh ref={crystal} position={[0.7, 0.5, 0.2]}>
          <octahedronGeometry args={[0.12, 0]} />
          <meshPhysicalMaterial
            color="#FF6B2B"
            transmission={0.6}
            thickness={0.5}
            roughness={0}
            metalness={0.1}
            ior={1.8}
            transparent
            opacity={0.9}
          />
        </mesh>
      </Float>

      <Float speed={1.8} floatIntensity={0.4}>
        <mesh position={[-0.65, 0.3, 0.1]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshPhysicalMaterial
            color="#FF6B2B"
            emissive="#FF6B2B"
            emissiveIntensity={0.4}
            metalness={0.3}
            roughness={0.1}
          />
        </mesh>
      </Float>
      <Float speed={3} floatIntensity={0.3}>
        <mesh position={[0.5, -0.2, 0.3]}>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshStandardMaterial color="#FF8047" emissive="#FF8047" emissiveIntensity={0.6} />
        </mesh>
      </Float>
    </group>
  )
}

export default function CustomerAvatar3D() {
  return (
    <Canvas
      camera={{ position: [0, 0.1, 2.8], fov: 42 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 3]} intensity={1.4} color="#FFF5EE" castShadow />
      <pointLight position={[-2, 2, 2]} intensity={0.6} color="#FF6B2B" />
      <pointLight position={[2, -1, 2]} intensity={0.3} color="#FFF0E9" />
      <Environment preset="city" />
      <BusinessFigure />
    </Canvas>
  )
}
