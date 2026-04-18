'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Avatar from './ui/Avatar'
import CountdownTimer from './CountdownTimer'
import { MapPin, Flag } from 'lucide-react'

interface Booking {
  _id: string
  bookingId?: string
  pickup?: { address?: string }
  dropoff?: { address?: string }
  workLocation?: { address?: string }
  totalFare?: number
  vehicleType?: string
  bookingType?: string
  distanceKm?: number
  createdAt?: string
  userId?: { name?: string; photo?: string }
  hamaliDetails?: { jobType?: string; hours?: number; floor?: number; heavyGoods?: boolean }
}

interface Props {
  booking: Booking
  onAccept: () => void
  onDecline: () => void
  themeColor?: string
}

function timeAgo(iso?: string): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  return `${Math.floor(mins / 60)}h ago`
}

export default function BookingRequestCard({ booking, onAccept, onDecline, themeColor = 'var(--accent)' }: Props) {
  const [exiting, setExiting] = useState<null | 'accept' | 'decline'>(null)
  const expiresAt = booking.createdAt
    ? new Date(booking.createdAt).getTime() + 120000
    : Date.now() + 120000

  const customerName = booking.userId?.name || 'Customer'
  const pickupAddr = booking.pickup?.address || booking.workLocation?.address || 'N/A'
  const dropoffAddr = booking.dropoff?.address

  const handleAccept = () => {
    setExiting('accept')
    setTimeout(() => onAccept(), 500)
  }
  const handleDecline = () => {
    setExiting('decline')
    setTimeout(() => onDecline(), 400)
  }

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={exiting === 'accept' ? { x: 100, opacity: 0 } : { x: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          style={{
            background: 'var(--surface)', borderRadius: 'var(--radius-md)',
            padding: '18px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)',
            position: 'relative', overflow: 'hidden'
          }}>

          {/* Flash overlay */}
          {exiting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              style={{
                position: 'absolute', inset: 0, borderRadius: 'var(--radius-md)',
                background: exiting === 'accept' ? '#16A34A' : '#DC2626',
                pointerEvents: 'none', zIndex: 10
              }}
            />
          )}

          {/* Header: fare + customer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar name={customerName} src={booking.userId?.photo} size="md" />
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{customerName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{timeAgo(booking.createdAt)}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: themeColor, lineHeight: 1 }}>
                ₹{booking.totalFare?.toFixed(0) || '--'}
              </div>
              {booking.distanceKm && (
                <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>{booking.distanceKm.toFixed(1)} km</div>
              )}
            </div>
          </div>

          {/* Route */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <MapPin size={15} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 14, fontWeight: 500 }}>{pickupAddr}</span>
            </div>
            {dropoffAddr && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <Flag size={15} color="var(--teal)" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{dropoffAddr}</span>
              </div>
            )}
          </div>

          {/* Chips */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' as const }}>
            {booking.vehicleType && (
              <span style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)', fontSize: 12, padding: '4px 10px', borderRadius: 6, fontWeight: 500 }}>
                {booking.vehicleType.replace(/_/g, ' ')}
              </span>
            )}
            {booking.hamaliDetails?.jobType && (
              <span style={{ background: 'var(--teal-light)', color: 'var(--teal)', fontSize: 12, padding: '4px 10px', borderRadius: 6, fontWeight: 500 }}>
                {booking.hamaliDetails.jobType}
              </span>
            )}
            {booking.hamaliDetails?.hours && (
              <span style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)', fontSize: 12, padding: '4px 10px', borderRadius: 6 }}>
                {booking.hamaliDetails.hours}h
              </span>
            )}
          </div>

          {/* Countdown */}
          <div style={{ marginBottom: 16 }}>
            <CountdownTimer expiresAt={expiresAt} onExpire={handleDecline} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleAccept}
              style={{
                width: '100%', background: '#16A34A', color: 'white', border: 'none',
                borderRadius: 'var(--radius-md)', padding: '16px', fontSize: 16, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Outfit, sans-serif', minHeight: 48
              }}>
              Accept Booking
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleDecline}
              style={{
                width: '100%', background: 'transparent', color: 'var(--text-muted)',
                border: '1.5px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)', padding: '14px', fontSize: 15, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'Outfit, sans-serif'
              }}>
              Decline
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
