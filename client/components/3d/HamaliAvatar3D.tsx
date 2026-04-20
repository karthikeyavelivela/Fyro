'use client'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Environment } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

function HamaliFigure() {
  const group = useRef<THREE.Group>(null)
  const topBox = useRef<THREE.Mesh>(null)
  const crystal = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.45) * 0.26
      group.current.position.y = Math.sin(t * 0.65) * 0.035
    }
    if (topBox.current) {
      topBox.current.position.y = 0.88 + Math.sin(t * 1.3) * 0.025
    }
    if (crystal.current) crystal.current.rotation.y = t * 1.2
  })

  return (
    <group ref={group}>
      <mesh position={[-0.1, -0.68, 0]}>
        <boxGeometry args={[0.12, 0.44, 0.13]} />
        <meshStandardMaterial color="#1E3A5F" roughness={0.4} />
      </mesh>
      <mesh position={[0.1, -0.68, 0]}>
        <boxGeometry args={[0.12, 0.44, 0.13]} />
        <meshStandardMaterial color="#1E3A5F" roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[0.44, 0.5, 0.22]} />
        <meshStandardMaterial color="#0D9488" roughness={0.3} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.1, 0.112]}>
        <boxGeometry args={[0.18, 0.1, 0.01]} />
        <meshStandardMaterial color="#0F766E" roughness={0.3} />
      </mesh>
      <mesh position={[-0.3, 0.05, 0]} rotation={[0.4, 0, -0.6]}>
        <capsuleGeometry args={[0.065, 0.36, 8, 16]} />
        <meshStandardMaterial color="#0D9488" roughness={0.3} />
      </mesh>
      <mesh position={[0.3, 0.05, 0]} rotation={[0.4, 0, 0.6]}>
        <capsuleGeometry args={[0.065, 0.36, 8, 16]} />
        <meshStandardMaterial color="#0D9488" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.055, 0.065, 0.1, 16]} />
        <meshStandardMaterial color="#8B6914" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.19, 32, 32]} />
        <meshStandardMaterial color="#8B6914" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.175, 32, 32]} />
        <meshStandardMaterial color="#F59E0B" roughness={0.6} />
      </mesh>

      <mesh position={[0, 0.68, 0]}>
        <boxGeometry args={[0.34, 0.22, 0.28]} />
        <meshStandardMaterial color="#0F766E" roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.68, 0.141]}>
        <boxGeometry args={[0.34, 0.025, 0.005]} />
        <meshStandardMaterial color="#F59E0B" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0.04, 0.88, 0]}>
        <boxGeometry args={[0.26, 0.18, 0.22]} />
        <meshStandardMaterial color="#14B8A6" roughness={0.3} metalness={0.15} />
      </mesh>
      <mesh ref={topBox} position={[-0.03, 0.88, 0]}>
        <boxGeometry args={[0.18, 0.14, 0.16]} />
        <meshStandardMaterial color="#2DD4BF" roughness={0.25} metalness={0.2} />
      </mesh>

      <Float speed={2.2} floatIntensity={0.55} rotationIntensity={0.5}>
        <mesh ref={crystal} position={[0.72, 0.5, 0.2]}>
          <octahedronGeometry args={[0.1, 0]} />
          <meshPhysicalMaterial
            color="#0D9488"
            transmission={0.55}
            thickness={0.4}
            roughness={0}
            metalness={0.15}
            ior={1.9}
          />
        </mesh>
      </Float>
      <Float speed={1.7} floatIntensity={0.4}>
        <mesh position={[-0.7, 0.3, 0.15]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#0D9488" emissive="#0D9488" emissiveIntensity={0.5} />
        </mesh>
      </Float>
    </group>
  )
}

export default function HamaliAvatar3D() {
  return (
    <Canvas
      camera={{ position: [0, 0.2, 3.0], fov: 42 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 3]} intensity={1.4} color="#F0FFFC" />
      <pointLight position={[-2, 2, 2]} intensity={0.7} color="#0D9488" />
      <pointLight position={[2, -1, 1]} intensity={0.3} color="#CCFBF1" />
      <Environment preset="dawn" />
      <HamaliFigure />
    </Canvas>
  )
}
