'use client'
import { motion } from 'framer-motion'
import { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'teal'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

export default function Button({ variant = 'primary', size = 'md', loading, children, className = '', disabled, style, ...props }: Props) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'Outfit, sans-serif', fontWeight: 500, borderRadius: 'var(--radius-md)',
    border: 'none', cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.5 : 1, transition: 'background 0.2s',
  }

  const variants: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--accent)', color: 'white' },
    secondary: { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border-strong)' },
    outline: { background: 'transparent', color: 'var(--accent)', border: '1.5px solid var(--accent)' },
    ghost: { background: 'transparent', color: 'var(--text-muted)' },
    danger: { background: '#DC2626', color: 'white' },
    teal: { background: 'var(--teal)', color: 'white' },
  }

  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: '8px 14px', fontSize: 14, minHeight: 36 },
    md: { padding: '12px 20px', fontSize: 15, minHeight: 48 },
    lg: { padding: '16px 24px', fontSize: 17, minHeight: 56 },
  }

  return (
    <motion.button
      whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
      whileTap={{ scale: 0.97 }}
      style={{ ...base, ...variants[variant], ...sizes[size], ...style }}
      disabled={disabled || loading}
      className={className}
      {...(props as any)}
    >
      {loading ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 16, height: 16, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'btn-spin 0.7s linear infinite' }} />
          Loading...
        </span>
      ) : children}
    </motion.button>
  )
}
