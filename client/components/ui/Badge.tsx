'use client'
import { motion } from 'framer-motion'

type Status = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'paid' | 'open' | 'resolved' | 'under_review' | string

interface Props {
  status: Status
  className?: string
}

const CONFIG: Record<string, { bg: string; color: string; label: string; pulse?: boolean }> = {
  pending: { bg: '#FEF3C7', color: '#D97706', label: 'Pending' },
  accepted: { bg: '#DBEAFE', color: '#2563EB', label: 'Accepted' },
  in_progress: { bg: '#FFF0E9', color: '#FF6B2B', label: 'In Progress', pulse: true },
  completed: { bg: '#DCFCE7', color: '#16A34A', label: 'Completed' },
  cancelled: { bg: '#F3F4F6', color: '#6B7280', label: 'Cancelled' },
  paid: { bg: '#DCFCE7', color: '#16A34A', label: 'Paid' },
  open: { bg: '#FEE2E2', color: '#DC2626', label: 'Open' },
  resolved: { bg: '#DCFCE7', color: '#16A34A', label: 'Resolved' },
  under_review: { bg: '#FEF3C7', color: '#D97706', label: 'Under Review' },
}

export default function Badge({ status, className }: Props) {
  const cfg = CONFIG[status] || { bg: '#F3F4F6', color: '#6B7280', label: status }

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: cfg.bg, color: cfg.color,
        padding: '4px 10px', borderRadius: 999,
        fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' as const
      }}>
      {cfg.pulse && (
        <span style={{
          width: 7, height: 7, borderRadius: '50%', background: cfg.color,
          display: 'inline-block', animation: 'badge-dot 1.2s ease-in-out infinite'
        }} />
      )}
      {cfg.label}
      <style jsx global>{`
        @keyframes badge-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
      `}</style>
    </motion.span>
  )
}
