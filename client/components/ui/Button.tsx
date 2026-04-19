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
    fontFamily: 'var(--font-body)', fontWeight: 600, borderRadius: 999,
    border: 'none', cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.5 : 1, transition: 'background 0.15s, box-shadow 0.15s, transform 0.1s',
    gap: 8,
  }

  const variants: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--orange)', color: 'white' },
    secondary: { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border-light)', borderRadius: 12 },
    outline: { background: 'transparent', color: 'var(--text)', border: '1.5px solid var(--text)' },
    ghost: { background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-light)', borderRadius: 12 },
    danger: { background: 'var(--red)', color: 'white' },
    teal: { background: 'var(--teal)', color: 'white' },
  }

  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: '8px 16px', fontSize: 13, minHeight: 36 },
    md: { padding: '12px 22px', fontSize: 15, minHeight: 48 },
    lg: { padding: '16px 28px', fontSize: 16, minHeight: 54 },
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
