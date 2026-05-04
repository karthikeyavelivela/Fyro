'use client'
import { useEffect, useRef, useState } from 'react'
import { Truck } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'
import toast from 'react-hot-toast'

const STATUSES = ['all', 'completed', 'in_progress', 'cancelled']

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : []
}

export default function DriverBookings() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState('all')
  const hasFetched = useRef(false)
  const hasShownError = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const { data } = await api.get('/api/driver/bookings')
      const list = toArray<any>(
        data?.bookings ?? data?.data?.bookings ?? data?.data ?? []
      )
      setBookings(list)
    } catch {
      setError(true)
      if (!hasShownError.current) {
        hasShownError.current = true
        toast.error('Could not load jobs', { duration: 4000 })
      }
    } finally {
      setLoading(false)
    }
  }

  const filtered = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status === filter)

  return (
    <div className="fyro-page">
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(22px,4vw,30px)', marginBottom: 20, letterSpacing: '-0.025em' }}>
        Job History
      </h1>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`filter-pill${filter === s ? ' active' : ''}`}
          >
            {s === 'all' ? 'All' : s === 'in_progress' ? 'Active' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading && [1, 2, 3].map(i => (
        <div key={i} className="skel" style={{ height: 72, marginBottom: 10 }} />
      ))}

      {!loading && error && (
        <div style={{
          background: 'var(--surface)', borderRadius: 14,
          border: '1px solid var(--border)', padding: '24px 20px', textAlign: 'center'
        }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Could not load jobs. Pull to refresh.
          </p>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: '40px 24px', textAlign: 'center' }}>
          <Truck size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px', display: 'block' }} />
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text)', margin: '0 0 4px' }}>No jobs yet</p>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            {filter === 'all' ? 'Completed jobs will appear here' : `No ${filter} jobs`}
          </p>
        </div>
      )}

      {!loading && !error && filtered.map((b: any) => (
        <Link key={b._id} href={`/driver/bookings/${b._id}`} style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--surface)', borderRadius: 14,
            border: '1px solid var(--border)', padding: '14px 16px', marginBottom: 8,
            transition: 'all 200ms', cursor: 'pointer'
          }}
            onMouseEnter={e => { const t = e.currentTarget; t.style.borderColor = 'rgba(255,107,43,0.25)'; t.style.transform = 'translateX(3px)' }}
            onMouseLeave={e => { const t = e.currentTarget; t.style.borderColor = ''; t.style.transform = '' }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(255,107,43,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Truck size={17} color="var(--orange)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {b.bookingId || b._id?.slice(-8).toUpperCase()}
              </p>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {b.pickup?.address || 'Pickup'} → {b.dropoff?.address || 'Dropoff'}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--orange)' }}>
                ₹{b.finalFare || b.estimatedFare || 0}
              </span>
              <span style={{
                padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em',
                background: b.status === 'completed' ? 'rgba(22,163,74,0.1)' : b.status === 'cancelled' ? 'rgba(220,38,38,0.08)' : 'rgba(255,107,43,0.1)',
                color: b.status === 'completed' ? '#16A34A' : b.status === 'cancelled' ? '#DC2626' : 'var(--orange)'
              }}>
                {b.status?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
