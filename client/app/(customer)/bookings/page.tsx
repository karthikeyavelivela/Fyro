'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { fadeUp, staggerContainer } from '@/lib/animations'
import BookingCard from '@/components/BookingCard'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

const FILTERS = ['All', 'Active', 'Completed', 'Cancelled']
const STATUS_MAP: Record<string, string[]> = {
  All: [],
  Active: ['pending', 'accepted', 'in_progress'],
  Completed: ['completed', 'paid'],
  Cancelled: ['cancelled'],
}

export default function BookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const fetchBookings = async (pg = 1, flt = filter) => {
    setLoading(true)
    try {
      const params: any = { limit: 10, page: pg }
      const statuses = STATUS_MAP[flt]
      if (statuses.length) params.status = statuses.join(',')
      const { data } = await api.get('/api/bookings/my', { params })
      const list = data?.bookings || data || []
      if (pg === 1) setBookings(list)
      else setBookings(prev => [...prev, ...list])
      setHasMore(list.length === 10)
    } catch { toast.error('Failed to load bookings') }
    finally { setLoading(false) }
  }

  useEffect(() => { setPage(1); fetchBookings(1, filter) }, [filter])

  const displayed = search
    ? bookings.filter(b =>
        (b.bookingId || b._id).toLowerCase().includes(search.toLowerCase()) ||
        b.pickup?.address?.toLowerCase().includes(search.toLowerCase()) ||
        b.dropoff?.address?.toLowerCase().includes(search.toLowerCase())
      )
    : bookings

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
      <motion.h1 variants={fadeUp} custom={0} style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24, marginBottom: 20 }}>
        My Trips
      </motion.h1>

      {/* Search */}
      <motion.div variants={fadeUp} custom={1} style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={16} color="var(--text-faint)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID or address..."
          style={{
            width: '100%', background: 'var(--surface)', border: '1.5px solid var(--border-strong)',
            borderRadius: 'var(--radius-sm)', padding: '12px 16px 12px 40px',
            fontSize: 16, outline: 'none', fontFamily: 'Outfit, sans-serif'
          }} />
      </motion.div>

      {/* Filter pills */}
      <motion.div variants={fadeUp} custom={2} style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 20 }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            flexShrink: 0, padding: '8px 16px', borderRadius: 999, border: '1.5px solid',
            borderColor: filter === f ? 'var(--accent)' : 'var(--border-strong)',
            background: filter === f ? 'var(--accent-light)' : 'var(--surface)',
            color: filter === f ? 'var(--accent)' : 'var(--text-muted)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}>{f}</button>
        ))}
      </motion.div>

      {/* List */}
      {loading && page === 1 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => <Skeleton key={i} height={110} style={{ borderRadius: 'var(--radius-md)' }} />)}
        </div>
      ) : displayed.length === 0 ? (
        <EmptyState title="No trips found" subtitle={search ? 'Try a different search' : 'Book your first trip now'} ctaLabel="Book Now" onCta={() => router.push('/book')} />
      ) : (
        <motion.div variants={staggerContainer} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {displayed.map((b, i) => (
            <motion.div key={b._id} variants={fadeUp} custom={i}>
              <BookingCard booking={b} />
            </motion.div>
          ))}
          {hasMore && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => { const next = page + 1; setPage(next); fetchBookings(next) }}
              disabled={loading}
              style={{
                width: '100%', background: 'var(--surface)', border: '1.5px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)', padding: '14px', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif'
              }}>
              {loading ? 'Loading...' : 'Load more'}
            </motion.button>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
