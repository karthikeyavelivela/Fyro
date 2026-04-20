'use client'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'

function TrafficLightMesh() {
  const group = useRef<THREE.Group>(null)
  const [active, setActive] = useState(2)

  useFrame(({ clock }) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(clock.elapsedTime * 0.25) * 0.3
      group.current.position.y = Math.sin(clock.elapsedTime * 0.6) * 0.04
    }
  })

  useEffect(() => {
    let idx = 2
    const t = setInterval(() => {
      idx = (idx + 1) % 3
      setActive(idx)
    }, 1400)
    return () => clearInterval(t)
  }, [])

  const lightData = [
    { color: '#DC2626', glow: '#FF0000', y: 0.52 },
    { color: '#D97706', glow: '#FF8C00', y: 0 },
    { color: '#16A34A', glow: '#00FF00', y: -0.52 },
  ]

  return (
    <group ref={group}>
      <mesh position={[0, -1.4, 0]}>
        <cylinderGeometry args={[0.045, 0.065, 1.5, 16]} />
        <meshStandardMaterial color="#4B5563" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.38, 1.5, 0.34]} />
        <meshStandardMaterial color="#1F2937" metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.76, 0]}>
        <sphereGeometry args={[0.2, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1F2937" metalness={0.4} roughness={0.3} />
      </mesh>
      {lightData.map(({ y }, i) => (
        <mesh key={i} position={[0, y, 0.2]}>
          <boxGeometry args={[0.28, 0.06, 0.15]} />
          <meshStandardMaterial color="#111827" metalness={0.5} />
        </mesh>
      ))}
      {lightData.map(({ color, glow, y }, i) => (
        <group key={i} position={[0, y, 0.18]}>
          <mesh>
            <sphereGeometry args={[0.1, 24, 24]} />
            <meshStandardMaterial
              color={color}
              emissive={active === i ? glow : color}
              emissiveIntensity={active === i ? 2.5 : 0.04}
              roughness={0.05}
              metalness={0}
            />
          </mesh>
          {active === i && <pointLight color={glow} intensity={0.8} distance={0.6} />}
        </group>
      ))}
      <mesh position={[0, 0.62, 0]}>
        <boxGeometry args={[0.5, 0.06, 0.1]} />
        <meshStandardMaterial color="#374151" metalness={0.6} />
      </mesh>
    </group>
  )
}

export default function TrafficLight3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 3.2], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent', width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 5, 3]} intensity={1.2} color="#FFF5EE" />
      <Environment preset="night" />
      <TrafficLightMesh />
    </Canvas>
  )
}
