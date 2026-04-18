'use client'
import { useEffect, useState, useRef } from 'react'

interface Props {
  expiresAt: string | number
  onExpire?: () => void
  totalDurationMs?: number
}

export default function CountdownTimer({ expiresAt, onExpire, totalDurationMs = 120000 }: Props) {
  const expireTs = typeof expiresAt === 'string' ? new Date(expiresAt).getTime() : expiresAt
  const [msLeft, setMsLeft] = useState(() => Math.max(0, expireTs - Date.now()))
  const expiredRef = useRef(false)

  useEffect(() => {
    if (msLeft <= 0 && !expiredRef.current) { expiredRef.current = true; onExpire?.(); return }
    const timer = setInterval(() => {
      const remaining = Math.max(0, expireTs - Date.now())
      setMsLeft(remaining)
      if (remaining <= 0 && !expiredRef.current) { expiredRef.current = true; onExpire?.(); clearInterval(timer) }
    }, 1000)
    return () => clearInterval(timer)
  }, [expireTs, onExpire])

  const secs = Math.ceil(msLeft / 1000)
  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')
  const pct = Math.max(0, Math.min(100, (msLeft / totalDurationMs) * 100))
  const isRed = secs <= 30

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Time to respond</span>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: isRed ? 'var(--red)' : 'var(--text)' }}>{mm}:{ss}</span>
      </div>
      <div style={{ height: 4, background: 'var(--surface-raised)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: isRed ? 'var(--red)' : 'var(--accent)',
          width: `${pct}%`, transition: 'width 1s linear, background 0.3s'
        }} />
      </div>
    </div>
  )
}
