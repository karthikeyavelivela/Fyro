'use client'
import Image from 'next/image'

interface Props {
  src?: string
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  role?: 'customer' | 'driver' | 'hamali' | 'admin'
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

function getRoleColor(role?: string): string {
  if (role === 'hamali') return '#0D9488'  // teal
  if (role === 'admin') return '#6B6860'   // gray
  return '#FF6B2B'  // orange for customer, driver, and fallback
}

export default function Avatar({ src, name, size = 'md', role }: Props) {
  const px = SIZES[size]
  const safeName = (name || '').trim()
  const label = safeName ? initials(safeName) : '?'
  const bg = role ? getRoleColor(role) : (safeName ? hashColor(safeName) : '#FF6B2B')

  if (src) {
    return (
      <div style={{ width: px, height: px, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
        <Image src={src} alt={safeName || 'avatar'} width={px} height={px} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
      </div>
    )
  }

  return (
    <div style={{
      width: px, height: px, borderRadius: '50%', flexShrink: 0,
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontFamily: 'var(--font-display)', fontWeight: 700,
      fontSize: px * 0.35
    }}>
      {label}
    </div>
  )
}
