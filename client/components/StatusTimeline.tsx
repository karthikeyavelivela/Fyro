'use client'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

type Status = 'requested' | 'accepted' | 'in_progress' | 'completed' | 'paid'

interface Props {
  currentStatus: string
  timestamps?: Partial<Record<Status, string>>
}

const STEPS: { key: Status; label: string }[] = [
  { key: 'requested', label: 'Requested' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'paid', label: 'Paid' },
]

const ORDER: Status[] = ['requested', 'accepted', 'in_progress', 'completed', 'paid']

function formatTime(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export default function StatusTimeline({ currentStatus, timestamps = {} }: Props) {
  const currentIndex = ORDER.indexOf(currentStatus as Status)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex
        const isCurrent = i === currentIndex
        const isFuture = i > currentIndex

        return (
          <div key={step.key} style={{ display: 'flex', gap: 14 }}>
            {/* Circle + line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.06 }}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: isFuture ? '2px solid var(--border-strong)' : 'none',
                  background: isDone ? 'var(--accent)' : isCurrent ? 'transparent' : 'transparent',
                  boxShadow: isCurrent ? '0 0 0 2px var(--accent), 0 0 0 5px rgba(255,107,43,0.15)' : 'none',
                  position: 'relative', zIndex: 1
                }}>
                {isDone && <Check size={14} color="white" strokeWidth={3} />}
                {isCurrent && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--accent)' }}
                  />
                )}
                {isFuture && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--border-strong)' }} />}
              </motion.div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 2, flex: 1, minHeight: 28, background: isDone ? 'var(--accent)' : 'var(--border-strong)', transition: 'background 0.4s' }} />
              )}
            </div>

            {/* Label + time */}
            <div style={{ paddingBottom: i < STEPS.length - 1 ? 20 : 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: 4 }}>
              <span style={{
                fontSize: 14, fontWeight: isCurrent ? 700 : 500,
                color: isFuture ? 'var(--text-faint)' : 'var(--text)'
              }}>{step.label}</span>
              {timestamps[step.key] && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {formatTime(timestamps[step.key])}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
