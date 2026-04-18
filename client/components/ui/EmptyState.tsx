'use client'
import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/animations'

interface Props {
  title: string
  subtitle?: string
  ctaLabel?: string
  onCta?: () => void
}

export default function EmptyState({ title, subtitle, ctaLabel, onCta }: Props) {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ marginBottom: 24 }}>
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <rect x="8" y="8" width="64" height="64" rx="12" stroke="var(--border-strong)" strokeWidth="2" strokeDasharray="6 4" fill="none" />
          <rect x="24" y="28" width="32" height="6" rx="3" fill="var(--surface-raised)" />
          <rect x="28" y="40" width="24" height="4" rx="2" fill="var(--surface-raised)" />
          <rect x="32" y="50" width="16" height="4" rx="2" fill="var(--surface-raised)" />
        </svg>
      </div>
      <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 20, color: 'var(--text)', marginBottom: 8 }}>{title}</h3>
      {subtitle && <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.5, maxWidth: 280, marginBottom: 24 }}>{subtitle}</p>}
      {ctaLabel && onCta && (
        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={onCta}
          style={{
            background: 'var(--accent)', color: 'white', border: 'none',
            padding: '12px 28px', borderRadius: 'var(--radius-md)', fontSize: 15, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Outfit, sans-serif'
          }}>
          {ctaLabel}
        </motion.button>
      )}
    </motion.div>
  )
}
