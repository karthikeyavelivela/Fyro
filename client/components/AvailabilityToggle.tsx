'use client'
import { motion } from 'framer-motion'

interface Props {
  isAvailable: boolean
  onChange: (val: boolean) => void
  loading?: boolean
  themeColor?: string
}

export default function AvailabilityToggle({ isAvailable, onChange, loading, themeColor }: Props) {
  const onColor = themeColor || 'var(--green)'
  const offColor = 'rgba(26,25,22,0.18)'
  return (
    <motion.button
      onClick={() => !loading && onChange(!isAvailable)}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      disabled={loading}
      style={{
        padding: '6px 10px 6px 6px',
        borderRadius: 999,
        border: 'none',
        background: isAvailable ? onColor : 'var(--surface)',
        color: isAvailable ? '#fff' : 'var(--text)',
        fontSize: 13,
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        cursor: loading ? 'wait' : 'pointer',
        opacity: loading ? 0.7 : 1,
        transition: 'background 0.3s, box-shadow 0.2s',
        boxShadow: isAvailable ? `0 8px 24px ${onColor === 'var(--teal)' ? 'rgba(13,148,136,0.24)' : 'rgba(22,163,74,0.24)'}` : 'var(--shadow-sm)',
        fontFamily: 'var(--font-body)'
      }}
    >
      <span style={{ position: 'relative', width: 42, height: 24, borderRadius: 999, background: isAvailable ? 'rgba(255,255,255,0.24)' : offColor, display: 'inline-flex', alignItems: 'center', padding: 2 }}>
        <motion.span
          layoutId="toggle-pill"
          style={{ display: 'inline-block', width: 20, height: 20, borderRadius: '50%', background: '#fff', marginLeft: isAvailable ? 18 : 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        />
      </span>
      {loading ? '...' : isAvailable ? 'Online' : 'Offline'}
    </motion.button>
  )
}
