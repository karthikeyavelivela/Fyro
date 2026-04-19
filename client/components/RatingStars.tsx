'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
  size?: number
}

export default function RatingStars({ value, onChange, readonly = false, size = 24 }: Props) {
  const [hovered, setHovered] = useState(0)

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(star => {
        const filled = (hovered || value) >= star
        return (
          <motion.button
            key={star}
            type="button"
            disabled={readonly}
            whileHover={!readonly ? { scale: 1.2 } : {}}
            whileTap={!readonly ? { scale: 0.9 } : {}}
            animate={filled ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            style={{ background: 'none', border: 'none', padding: 2, cursor: readonly ? 'default' : 'pointer' }}>
            <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#FF6B2B' : 'none'} stroke={filled ? '#FF6B2B' : 'var(--border-strong)'} strokeWidth={1.5}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </motion.button>
        )
      })}
    </div>
  )
}
