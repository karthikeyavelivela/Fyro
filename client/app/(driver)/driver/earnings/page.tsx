'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { useRouter } from 'next/navigation'
import EarningsChart from '@/components/EarningsChart'
import { ArrowLeft, ArrowRight } from 'lucide-react'

const RupeeCoin3D = dynamic(() => import('@/components/3d/RupeeCoin3D'), { ssr: false, loading: () => <div style={{ width: '100%', height: '100%' }} /> })

const ACCENT = 'var(--orange)'

export default function DriverEarningsPage() {
  const router = useRouter()
  const [earnings, setEarnings] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [earningsRes, bookingsRes] = await Promise.all([
          api.get('/api/driver/earnings'),
          api.get('/api/driver/bookings?status=completed&limit=30')
        ])
        setEarnings(earningsRes.data.earnings || earningsRes.data)
        setBookings(bookingsRes.data.bookings || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="shimmer" style={{ height: 48, borderRadius: 12 }} />
        <div className="shimmer" style={{ height: 180, borderRadius: 20 }} />
        <div className="shimmer" style={{ height: 100, borderRadius: 16 }} />
        <div className="shimmer" style={{ height: 200, borderRadius: 16 }} />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: '#fff',
        borderBottom: '1px solid var(--divider)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <button onClick={() => router.back()} style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="syne" style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
          Earnings
        </h1>
        <div style={{ marginLeft: 'auto', width: 90, height: 90, pointerEvents: 'none' }}>
          <RupeeCoin3D teal={false} />
        </div>
      </div>

      <div style={{ padding: '16px 20px', maxWidth: 560, margin: '0 auto' }}>
        {/* Hero this-month card */}
        <div style={{
          background: 'var(--dark)',
          color: '#fff',
          borderRadius: 20,
          padding: 22,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 180,
            height: 180,
            background: 'radial-gradient(circle, rgba(255,107,43,0.3), transparent 70%)'
          }} />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
            This month
          </div>
          <div className="syne mono" style={{ fontSize: 44, fontWeight: 800, color: ACCENT, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
            ₹{Number(earnings?.thisMonth || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
            Lifetime: ₹{Number(earnings?.allTime || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Today</div>
              <div className="syne" style={{ fontSize: 20, fontWeight: 700 }}>₹{Number(earnings?.today || 0).toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>This week</div>
              <div className="syne" style={{ fontSize: 20, fontWeight: 700 }}>₹{Number(earnings?.thisWeek || 0).toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Trips</div>
              <div className="syne" style={{ fontSize: 20, fontWeight: 700, color: ACCENT }}>
                {earnings?.todayTrips || bookings.length || 0}
              </div>
            </div>
          </div>
        </div>

        {/* 7-day chart */}
        {earnings?.last7days && (
          <div style={{
            marginTop: 18,
            background: '#fff',
            borderRadius: 16,
            padding: 20,
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div className="syne" style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 10 }}>
              Last 7 days
            </div>
            <EarningsChart data={earnings.last7days} color="#FF6B2B" />
          </div>
        )}

        {/* Recent trips */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 22, marginBottom: 10 }}>
          <div className="syne" style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>
            Recent payouts
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {bookings.length === 0 ? (
            <div style={{
              padding: 24, background: '#fff', borderRadius: 16,
              border: '1px solid var(--border-light)', color: 'var(--text-muted)',
              textAlign: 'center', fontSize: 13
            }}>
              No completed trips yet.
            </div>
          ) : bookings.map((b) => (
            <div
              key={b._id}
              style={{
                padding: 14, background: '#fff', borderRadius: 16,
                border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)',
                display: 'flex', alignItems: 'center', gap: 12
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(22,163,74,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <ArrowRight size={16} color="var(--green)" style={{ transform: 'rotate(-135deg)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {b.pickup?.address?.substring(0, 20) || 'Trip'} → {b.dropoff?.address?.substring(0, 15) || ''}
                </div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {new Date(b.completedAt || b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {b.bookingId}
                </div>
              </div>
              <div className="syne mono" style={{ fontWeight: 700, color: 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>
                +₹{Number(b.finalFare || b.estimatedFare || 0).toLocaleString('en-IN')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
