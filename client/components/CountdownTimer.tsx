'use client'
import { useEffect, useState, useRef } from 'react'

interface Props {
  expiresAt: string | number
  onExpire?: () => void
  totalDurationMs?: number
  themeColor?: string
}

export default function CountdownTimer({ expiresAt, onExpire, totalDurationMs = 120000, themeColor = 'var(--orange)' }: Props) {
  const expireTs = typeof expiresAt === 'string' ? new Date(expiresAt).getTime() : expiresAt
  const [msLeft, setMsLeft] = useState(() => Math.max(0, expireTs - Date.now()))
  const expiredRef = useRef(false)

  useEffect(() => {
    if (msLeft <= 0 && !expiredRef.current) { expiredRef.current = true; onExpire?.(); return }
    const timer = setInterval(() => {
      const remaining = Math.max(0, expireTs - Date.now())
      setMsLeft(remaining)
      if (remaining <= 0 && !expiredRef.current) { expiredRef.current = true; onExpire?.(); clearInterval(timer) }
    }, 500)
    return () => clearInterval(timer)
  }, [expireTs, onExpire])

  const secs = Math.ceil(msLeft / 1000)
  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')
  const pct = Math.max(0, Math.min(100, (msLeft / totalDurationMs) * 100))

  const barColor = pct > 60 ? 'var(--green)' : pct > 30 ? 'var(--amber)' : 'var(--red)'

  return (
    <div>
      <div style={{ height: 3, background: 'rgba(26,25,22,0.08)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: barColor,
          borderRadius: 999,
          transition: 'width 0.5s linear, background 0.3s'
        }} />
      </div>
      <div style={{ textAlign: 'right', fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
        {mm}:{ss} remaining
      </div>
    </div>
  )
}
