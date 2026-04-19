'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CountdownTimer from './CountdownTimer'
import { MapPin, Package, Truck } from 'lucide-react'

interface Booking {
  _id: string
  bookingId?: string
  pickup?: { address?: string }
  dropoff?: { address?: string }
  workLocation?: { address?: string }
  totalFare?: number
  estimatedFare?: number
  vehicleType?: string
  bookingType?: string
  distanceKm?: number
  createdAt?: string
  userId?: { name?: string; photo?: string }
  hamaliDetails?: { jobType?: string; type?: string; hours?: number; estimatedHours?: number; floor?: number; heavyGoods?: boolean }
}

interface Props {
  booking: Booking
  onAccept: () => void
  onDecline: () => void
  themeColor?: string
}

function timeAgo(iso?: string): string {
  if (!iso) return 'just now'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

export default function BookingRequestCard({ booking, onAccept, onDecline, themeColor = 'var(--orange)' }: Props) {
  const [exiting, setExiting] = useState<null | 'accept' | 'decline'>(null)
  const expiresAt = booking.createdAt
    ? new Date(booking.createdAt).getTime() + 120000
    : Date.now() + 120000

  const pickupAddr = booking.pickup?.address || booking.workLocation?.address || 'N/A'
  const dropoffAddr = booking.dropoff?.address
  const fare = booking.totalFare ?? booking.estimatedFare ?? 0
  const badgeType = booking.bookingType === 'return_load' ? 'RETURN LOAD' : booking.bookingType === 'hamali' ? 'HAMALI' : 'TRANSPORT'
  const isTeal = themeColor === 'var(--teal)' || themeColor.toString().includes('teal') || themeColor === '#0D9488'

  const handleAccept = () => { setExiting('accept'); setTimeout(() => onAccept(), 350) }
  const handleDecline = () => { setExiting('decline'); setTimeout(() => onDecline(), 350) }

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          initial={{ y: -20, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={exiting === 'accept' ? { x: 120, opacity: 0 } : { x: -120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          style={{
            background: 'var(--surface)',
            borderRadius: 20,
            padding: 18,
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          {/* header: type + fare */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{
              padding: '4px 10px',
              borderRadius: 999,
              background: badgeType === 'RETURN LOAD' ? 'var(--dark)' : isTeal ? 'var(--teal-light)' : 'var(--orange-light)',
              color: badgeType === 'RETURN LOAD' ? 'var(--orange)' : isTeal ? 'var(--teal)' : 'var(--orange-dark)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              fontFamily: 'var(--font-body)'
            }}>{badgeType}</span>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontVariantNumeric: 'tabular-nums',
              fontSize: 26,
              fontWeight: 800,
              color: themeColor,
              letterSpacing: '-0.02em',
              lineHeight: 1
            }}>
              ₹{Number(fare).toLocaleString('en-IN')}
            </div>
          </div>

          {/* route with dots */}
          <div style={{ display: 'flex', marginTop: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 12, paddingTop: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: themeColor }} />
              {dropoffAddr && (
                <>
                  <div style={{ width: 2, height: 28, background: 'var(--border-light)', margin: '3px 0' }} />
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--dark)' }} />
                </>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 15, color: 'var(--text)' }}>{pickupAddr}</div>
              {dropoffAddr && (
                <>
                  <div style={{ height: 16 }} />
                  <div style={{ fontWeight: 500, fontSize: 15, color: 'var(--text)' }}>{dropoffAddr}</div>
                </>
              )}
            </div>
          </div>

          {/* meta row */}
          <div style={{ display: 'flex', marginTop: 14, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap', gap: 10 }}>
            {booking.distanceKm != null && <div>{booking.distanceKm.toFixed(1)} km</div>}
            {booking.vehicleType && (
              <>
                <div>·</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Truck size={12} /> {booking.vehicleType.replace(/_/g, ' ')}
                </div>
              </>
            )}
            {booking.hamaliDetails?.type && (
              <>
                <div>·</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textTransform: 'capitalize' }}>
                  <Package size={12} /> {booking.hamaliDetails.type}
                </div>
              </>
            )}
            {(booking.hamaliDetails?.estimatedHours || booking.hamaliDetails?.hours) && (
              <>
                <div>·</div>
                <div>~{booking.hamaliDetails.estimatedHours || booking.hamaliDetails.hours}h</div>
              </>
            )}
            <div>·</div>
            <div>{timeAgo(booking.createdAt)}</div>
          </div>

          {/* countdown */}
          <div style={{ marginTop: 14 }}>
            <CountdownTimer expiresAt={expiresAt} onExpire={handleDecline} themeColor={themeColor} />
          </div>

          {/* actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button
              onClick={handleDecline}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                background: 'transparent',
                border: '1.5px solid var(--text)',
                color: 'var(--text)',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)'
              }}
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                background: themeColor,
                border: 'none',
                color: '#fff',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                boxShadow: `0 4px 12px ${isTeal ? 'rgba(13,148,136,0.3)' : 'rgba(255,107,43,0.3)'}`
              }}
            >
              Accept
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
