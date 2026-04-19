'use client'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { springPop } from '@/lib/animations'
import Badge from './ui/Badge'
import { Flag, MapPin } from 'lucide-react'

interface Booking {
  _id: string
  bookingId?: string
  bookingType?: string
  pickup?: { address?: string }
  dropoff?: { address?: string }
  workLocation?: { address?: string }
  status: string
  totalFare?: number
  createdAt?: string
  scheduledTime?: string
}

function truncate(str: string, max: number) {
  if (!str) return ''
  return str.length > max ? `${str.slice(0, max)}...` : str
}

function formatDate(iso: string) {
  const date = new Date(iso)
  return `${date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} | ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
}

export default function BookingCard({ booking }: { booking: Booking }) {
  const router = useRouter()
  const isHamali = booking.bookingType === 'hamali'
  const pickupAddr = booking.pickup?.address || booking.workLocation?.address || 'N/A'
  const dropoffAddr = booking.dropoff?.address || ''
  const dateStr = booking.createdAt ? formatDate(booking.createdAt) : ''

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
        padding: '18px 20px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: isHamali ? 'var(--teal)' : 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {isHamali ? 'Hamali' : 'Transport'}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-faint)', fontWeight: 500 }}>
            #{(booking.bookingId || booking._id).slice(-8).toUpperCase()}
          </span>
        </div>
        <Badge status={booking.status} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MapPin size={14} color="var(--accent)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{truncate(pickupAddr, 42)}</span>
        </div>
        {dropoffAddr && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Flag size={14} color="var(--teal)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{truncate(dropoffAddr, 42)}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{dateStr}</span>
        {booking.totalFare !== undefined && (
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>
            ₹{booking.totalFare.toFixed(0)}
          </span>
        )}
      </div>
    </motion.div>
  )
}
