import React from 'react'
import Link from 'next/link'

interface AvatarProps {
  name?: string
  role?: 'customer' | 'driver' | 'hamali' | 'admin' | string
  size?: number
  onClick?: () => void
  href?: string
}

const Avatar = ({ name, role, size = 48, onClick, href }: AvatarProps) => {
  const initials = name
    ? name.trim().split(' ')
        .filter(Boolean)
        .map(n => n[0].toUpperCase())
        .slice(0, 2)
        .join('')
    : '??'
  
  const color = role === 'hamali' ? '#0D9488'
    : role === 'admin' ? '#6B6860'
    : '#FF6B2B'
  
  const content = (
    <div 
      onClick={onClick}
      style={{
        width: size, height: size,
        borderRadius: '50%',
        background: color,
        display: 'flex', alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-display), Syne, sans-serif',
        fontWeight: 700,
        fontSize: size * 0.35,
        color: 'white',
        flexShrink: 0,
        cursor: (onClick || href) ? 'pointer' : 'default',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {initials}
    </div>
  )

  if (href) {
    return <Link href={href} style={{ textDecoration: 'none' }}>{content}</Link>
  }

  return content
}

export default Avatar
