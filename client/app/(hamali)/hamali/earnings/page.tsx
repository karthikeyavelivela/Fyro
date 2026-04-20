'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'

const RupeeCoin3D = dynamic(() => import('@/components/3d/RupeeCoin3D'), { ssr: false, loading: () => <div style={{ width: '100%', height: '100%' }} /> })
import { fadeUp, staggerContainer, springPop } from '@/lib/animations'
import api from '@/lib/api'
import { useRouter } from 'next/navigation'
import EarningsChart from '@/components/EarningsChart'
import { ArrowLeft, TrendingUp } from 'lucide-react'

const teal = '#0D9488'
const tealLight = '#CCFBF1'

export default function HamaliEarningsPage() {
  const router = useRouter()
  const [earnings, setEarnings] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [earningsRes, bookingsRes] = await Promise.all([
          api.get('/api/hamali/earnings'),
          api.get('/api/hamali/bookings?status=completed&limit=30')
        ])
        setEarnings(earningsRes.data.earnings || earningsRes.data)
        setBookings(bookingsRes.data.bookings || [])
      } catch {
        // handled
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const summaryCards = [
    { label: 'Today', value: earnings?.today || 0 },
    { label: 'This Week', value: earnings?.thisWeek || 0 },
    { label: 'This Month', value: earnings?.thisMonth || 0 },
  ]

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="shimmer h-8 w-48 rounded" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="shimmer h-20 rounded-md" />)}
        </div>
        <div className="shimmer h-48 rounded-md" />
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="page-shell compact page-stack"
      style={{ background: 'var(--bg)' }}
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-3 py-3 mb-4">
        <button onClick={() => router.back()} className="p-2 rounded-full" style={{ background: 'var(--surface)' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-syne font-800 text-2xl" style={{ color: 'var(--text)' }}>Earnings</h1>
        <div style={{ marginLeft: 'auto', width: 90, height: 90, pointerEvents: 'none' }}>
          <RupeeCoin3D teal={true} />
        </div>
      </motion.div>

      {/* Summary cards */}
      <motion.div variants={springPop} className="grid grid-cols-3 gap-3 mb-4">
        {summaryCards.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-md p-3 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="font-syne font-800 text-lg" style={{ color: teal }}>₹{value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
          </div>
        ))}
      </motion.div>

      {/* All-time */}
      <motion.div
        variants={fadeUp}
        className="rounded-md p-4 mb-4 flex items-center gap-3"
        style={{ background: tealLight, border: `1px solid ${teal}` }}
      >
        <TrendingUp size={24} style={{ color: teal }} />
        <div>
          <p className="text-xs font-500" style={{ color: teal }}>ALL TIME EARNINGS</p>
          <p className="font-syne font-800 text-2xl" style={{ color: teal }}>₹{earnings?.allTime || 0}</p>
        </div>
      </motion.div>

      {/* Chart */}
      {earnings?.last7days && (
        <motion.div
          variants={fadeUp}
          className="rounded-md p-4 mb-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h3 className="font-syne font-700 text-base mb-3" style={{ color: 'var(--text)' }}>Last 7 Days</h3>
          <EarningsChart data={earnings.last7days} color={teal} />
        </motion.div>
      )}

      {/* Recent jobs table */}
      <motion.div variants={fadeUp}>
        <h3 className="font-syne font-700 text-base mb-3" style={{ color: 'var(--text)' }}>Completed Jobs</h3>
        <div
          className="rounded-md overflow-hidden"
          style={{ border: '1px solid var(--border)' }}
        >
          {bookings.length === 0 ? (
            <div className="p-6 text-center" style={{ color: 'var(--text-muted)' }}>No completed jobs yet</div>
          ) : bookings.map((b, i) => (
            <div
              key={b._id}
              className="flex items-center justify-between p-3"
              style={{
                borderBottom: i < bookings.length - 1 ? '1px solid var(--border)' : 'none',
                background: i % 2 === 0 ? 'var(--surface)' : 'var(--bg)'
              }}
            >
              <div>
                <p className="text-xs font-500" style={{ color: 'var(--text-muted)' }}>
                  {new Date(b.completedAt || b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
                <p className="text-sm font-500" style={{ color: 'var(--text)' }}>
                  {b.pickup?.address?.substring(0, 30)}...
                </p>
                <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                  {b.bookingId}
                  {b.hamaliDetails?.type && ` · ${b.hamaliDetails.type}`}
                </p>
              </div>
              <p className="font-syne font-700 text-base" style={{ color: teal }}>
                ₹{b.finalFare || b.estimatedFare}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
