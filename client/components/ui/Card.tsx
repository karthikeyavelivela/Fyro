'use client'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { springPop } from '@/lib/animations'

interface Props {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  padding?: number | string
}

export default function Card({ children, className, style, onClick, padding = 20 }: Props) {
  return (
    <motion.div
      variants={springPop}
      initial="hidden"
      animate="show"
      onClick={onClick}
      className={className}
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border)',
        padding,
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}>
      {children}
    </motion.div>
  )
}
