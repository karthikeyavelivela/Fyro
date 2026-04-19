'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { fadeUp, staggerContainer } from '@/lib/animations'
import api from '@/lib/api'
import { ensureArray } from '@/lib/ensureArray'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (typeFilter !== 'all') params.set('bookingType', typeFilter)
      const res = await api.get(`/api/admin/bookings?${params}`)
      setBookings(ensureArray<any>(res.data?.bookings ?? res.data?.data?.bookings ?? res.data?.data ?? res.data))
      setTotalPages(res.data.pages || 1)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchBookings() }, [page, statusFilter, typeFilter])

  const statuses = ['all', 'pending', 'accepted', 'in_progress', 'completed', 'cancelled']
  const types = ['all', 'transport', 'hamali']

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="p-6">
      <motion.h1 variants={fadeUp} className="font-syne font-800 text-2xl mb-6" style={{ color: 'var(--text)' }}>
        Bookings
      </motion.h1>

      {/* Filters */}
      <motion.div variants={fadeUp} className="space-y-2 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className="px-3 py-1.5 rounded-full text-sm font-500 whitespace-nowrap capitalize"
              style={{
                background: statusFilter === s ? 'var(--accent)' : 'var(--surface)',
                color: statusFilter === s ? 'white' : 'var(--text-muted)',
                border: '1px solid var(--border-strong)',
              }}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {types.map(t => (
            <button
              key={t}
              onClick={() => { setTypeFilter(t); setPage(1) }}
              className="px-3 py-1.5 rounded-full text-sm font-500 capitalize"
              style={{
                background: typeFilter === t ? '#0D9488' : 'var(--surface)',
                color: typeFilter === t ? 'white' : 'var(--text-muted)',
                border: '1px solid var(--border-strong)',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </motion.div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="shimmer h-16 rounded-md" />)}
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState title="No bookings found" subtitle="Try different filters" />
      ) : (
        <motion.div variants={staggerContainer} className="space-y-2">
          {bookings.map((b, i) => (
            <motion.div
              key={b._id}
              variants={fadeUp}
              custom={i}
              className="rounded-md p-4 flex items-start justify-between gap-3"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-syne font-700 text-sm" style={{ color: 'var(--text)' }}>
                    {b.bookingId}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full capitalize font-500"
                    style={{
                      background: b.bookingType === 'transport' ? 'var(--accent-light)' : '#CCFBF1',
                      color: b.bookingType === 'transport' ? 'var(--accent)' : '#0D9488'
                    }}
                  >
                    {b.bookingType}
                  </span>
                  <Badge status={b.status} />
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {b.pickup?.address?.substring(0, 30)}
                  {b.dropoff ? ` → ${b.dropoff.address?.substring(0, 30)}` : ''}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                  {new Date(b.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {b.customerId?.name && ` · ${b.customerId.name}`}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-syne font-700 text-base" style={{ color: 'var(--accent)' }}>
                  ₹{b.finalFare || b.estimatedFare || 0}
                </p>
                <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                  {b.paymentStatus}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className="w-9 h-9 rounded-md text-sm font-500"
              style={{
                background: page === p ? 'var(--accent)' : 'var(--surface)',
                color: page === p ? 'white' : 'var(--text-muted)',
                border: '1px solid var(--border-strong)'
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}
