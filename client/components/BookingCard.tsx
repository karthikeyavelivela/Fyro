'use client'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { springPop } from '@/lib/animations'
import Badge from './ui/Badge'
import { Truck, Package } from 'lucide-react'

interface Booking {
  _id: string
  bookingId?: string
  bookingType?: string
  pickup?: { address?: string }
  dropoff?: { address?: string }
  workLocation?: { address?: string }
  status: string
  totalFare?: number
  estimatedFare?: number
  createdAt?: string
  scheduledTime?: string
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pending': return '#D97706' // amber
    case 'accepted': case 'in_progress': return '#2563EB' // blue
    case 'completed': case 'paid': return '#16A34A' // green
    case 'cancelled': return '#DC2626' // red
    default: return '#6B6860'
  }
}

export default function BookingCard({ booking }: { booking: Booking }) {
  const router = useRouter()
  const isHamali = booking.bookingType === 'hamali'
  const route = isHamali
    ? (booking.workLocation?.address || 'Hamali service')
    : `${booking.pickup?.address?.split(',')[0] || 'Pickup'} → ${booking.dropoff?.address?.split(',')[0] || 'Dropoff'}`

  const dateStr = booking.createdAt 
    ? new Date(booking.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
    : ''

  return (
    <motion.div
      variants={springPop}
      initial="hidden"
      animate="show"
      whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
      whileTap={{ scale: 0.98 }}
      onClick={() => router.push(`/bookings/${booking._id}`)}
      style={{
        background: 'var(--surface)',
        borderRadius: 16,
        padding: '16px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 16
      }}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 12, background: isHamali ? 'var(--teal-light)' : 'var(--orange-light)', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: -4, right: -4, width: 12, height: 12, borderRadius: '50%', background: getStatusColor(booking.status), border: '2px solid var(--surface)' }} />
        {isHamali ? <Package size={20} color="var(--teal)" /> : <Truck size={20} color="var(--orange)" />}
      </div>
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>
          {(booking.bookingId || booking._id).toUpperCase()}
        </div>
        <div className="syne" style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: '2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {route}
        </div>
        <div style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>
          {dateStr}
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        <div className="syne" style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>
          ₹{booking.totalFare || booking.estimatedFare || 0}
        </div>
        <Badge status={booking.status} />
      </div>
    </motion.div>
  )
}
