'use client'
import Image from 'next/image'

interface Props {
  src?: string
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const SIZES = { sm: 32, md: 48, lg: 64, xl: 80 }

function hashColor(name: string): string {
  const colors = ['#FF6B2B', '#0D9488', '#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6']
  let hash = 0
  for (let i = 0; i < name.length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash) }
  return colors[Math.abs(hash) % colors.length]
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

export default function Avatar({ src, name, size = 'md' }: Props) {
  const px = SIZES[size]

  if (src) {
    return (
      <div style={{ width: px, height: px, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
        <Image src={src} alt={name} width={px} height={px} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
      </div>
    )
  }

  return (
    <div style={{
      width: px, height: px, borderRadius: '50%', flexShrink: 0,
      background: hashColor(name), display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontFamily: 'Syne, sans-serif', fontWeight: 700,
      fontSize: px * 0.35
    }}>
      {initials(name)}
    </div>
  )
}
