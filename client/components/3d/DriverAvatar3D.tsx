'use client'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Environment } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

function DriverFigure() {
  const group = useRef<THREE.Group>(null)
  const wheel = useRef<THREE.Group>(null)
  const crystal = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.35) * 0.28
      group.current.position.y = Math.sin(t * 0.5) * 0.03
    }
    if (wheel.current) wheel.current.rotation.z = t * 0.9
    if (crystal.current) crystal.current.rotation.y = t * 1.1
  })

  return (
    <group ref={group}>
      <mesh position={[-0.1, -0.68, 0]}>
        <boxGeometry args={[0.12, 0.42, 0.13]} />
        <meshStandardMaterial color="#374151" roughness={0.4} />
      </mesh>
      <mesh position={[0.1, -0.68, 0]}>
        <boxGeometry args={[0.12, 0.42, 0.13]} />
        <meshStandardMaterial color="#374151" roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.18, 0]}>
        <boxGeometry args={[0.44, 0.52, 0.23]} />
        <meshStandardMaterial color="#FF6B2B" roughness={0.3} metalness={0.15} />
      </mesh>
      <mesh position={[0, -0.08, 0.118]}>
        <boxGeometry args={[0.44, 0.035, 0.005]} />
        <meshStandardMaterial color="#F59E0B" metalness={0.8} roughness={0.1} />
      </mesh>
      <mesh position={[0, -0.26, 0.118]}>
        <boxGeometry args={[0.44, 0.035, 0.005]} />
        <meshStandardMaterial color="#F59E0B" metalness={0.8} roughness={0.1} />
      </mesh>
      <mesh position={[-0.3, -0.2, 0]} rotation={[0.2, 0, 0.2]}>
        <capsuleGeometry args={[0.068, 0.34, 8, 16]} />
        <meshStandardMaterial color="#FF6B2B" roughness={0.3} />
      </mesh>
      <mesh position={[0.3, -0.2, 0]} rotation={[0.2, 0, -0.2]}>
        <capsuleGeometry args={[0.068, 0.34, 8, 16]} />
        <meshStandardMaterial color="#FF6B2B" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.058, 0.068, 0.1, 16]} />
        <meshStandardMaterial color="#CD853F" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.19, 32, 32]} />
        <meshStandardMaterial color="#CD853F" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.53, 0]}>
        <cylinderGeometry args={[0.2, 0.21, 0.1, 32]} />
        <meshStandardMaterial color="#1A1916" roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.49, 0.14]} rotation={[-0.05, 0, 0]}>
        <boxGeometry args={[0.26, 0.04, 0.2]} />
        <meshStandardMaterial color="#1A1916" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.53, 0.19]}>
        <boxGeometry args={[0.24, 0.025, 0.01]} />
        <meshStandardMaterial color="#FF6B2B" emissive="#FF6B2B" emissiveIntensity={0.2} />
      </mesh>

      <group ref={wheel} position={[0, -0.1, 0.55]}>
        <mesh>
          <torusGeometry args={[0.2, 0.025, 12, 48]} />
          <meshStandardMaterial color="#C0C0C0" metalness={0.95} roughness={0.05} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
            <cylinderGeometry args={[0.012, 0.012, 0.4, 8]} />
            <meshStandardMaterial color="#C0C0C0" metalness={0.9} roughness={0.1} />
          </mesh>
        ))}
        <mesh>
          <cylinderGeometry args={[0.04, 0.04, 0.04, 16]} />
          <meshStandardMaterial color="#FF6B2B" metalness={0.7} roughness={0.1} />
        </mesh>
      </group>

      <Float speed={2} floatIntensity={0.5} rotationIntensity={0.5}>
        <mesh ref={crystal} position={[-0.72, 0.45, 0.2]}>
          <octahedronGeometry args={[0.1, 0]} />
          <meshPhysicalMaterial
            color="#FF6B2B"
            transmission={0.5}
            thickness={0.4}
            roughness={0}
            metalness={0.2}
            ior={2.0}
          />
        </mesh>
      </Float>
      <Float speed={1.6} floatIntensity={0.4}>
        <mesh position={[0.68, 0.3, 0.15]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#FF8047" emissive="#FF8047" emissiveIntensity={0.5} />
        </mesh>
      </Float>
    </group>
  )
}

export default function DriverAvatar3D() {
  return (
    <Canvas
      camera={{ position: [0, 0.15, 2.9], fov: 42 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 3]} intensity={1.5} color="#FFF5EE" />
      <pointLight position={[-2, 2, 2]} intensity={0.7} color="#FF6B2B" />
      <pointLight position={[2, -1, 1]} intensity={0.4} color="#FFF0E9" />
      <Environment preset="warehouse" />
      <DriverFigure />
    </Canvas>
  )
}
