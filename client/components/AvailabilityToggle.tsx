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
  const offColor = '#6B6860'
  return (
    <motion.button
      onClick={() => !loading && onChange(!isAvailable)}
      whileTap={{ scale: 0.97 }}
      disabled={loading}
      style={{
        padding: '9px 16px',
        borderRadius: 999,
        border: 'none',
        background: isAvailable ? onColor : offColor,
        color: '#fff',
        fontSize: 13,
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        cursor: loading ? 'wait' : 'pointer',
        opacity: loading ? 0.7 : 1,
        transition: 'background 0.3s, box-shadow 0.2s',
        boxShadow: isAvailable ? `0 4px 12px ${onColor === 'var(--teal)' ? 'rgba(13,148,136,0.3)' : 'rgba(22,163,74,0.3)'}` : 'none',
        fontFamily: 'var(--font-body)'
      }}
    >
      <span
        className="dot dot-pulse"
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#fff',
          color: '#fff',
          position: 'relative'
        }}
      />
      {loading ? '...' : isAvailable ? 'Online' : 'Offline'}
    </motion.button>
  )
}
