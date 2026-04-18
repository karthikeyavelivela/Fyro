'use client'
import { motion } from 'framer-motion'

interface Props {
  isAvailable: boolean
  onChange: (val: boolean) => void
  loading?: boolean
  themeColor?: string
}

export default function AvailabilityToggle({ isAvailable, onChange, loading, themeColor = '#16A34A' }: Props) {
  return (
    <motion.button
      layout
      onClick={() => !loading && onChange(!isAvailable)}
      whileTap={{ scale: 0.95 }}
      style={{
        minWidth: 140, height: 44, borderRadius: 999, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
        background: isAvailable ? themeColor : '#9CA3AF',
        display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px',
        transition: 'background 0.3s', opacity: loading ? 0.6 : 1, position: 'relative'
      }}>
      {/* Toggle knob */}
      <motion.div
        layout
        style={{
          width: 28, height: 28, borderRadius: '50%', background: 'white',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)', flexShrink: 0
        }}
        animate={{ x: isAvailable ? 0 : 0 }}
      />
      <span style={{ color: 'white', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' as const }}>
        {loading ? '...' : isAvailable ? "You're Online" : "You're Offline"}
      </span>
    </motion.button>
  )
}
