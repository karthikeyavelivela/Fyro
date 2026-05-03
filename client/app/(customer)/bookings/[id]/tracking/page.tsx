'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Phone } from 'lucide-react'
import dynamic from 'next/dynamic'
import api from '@/lib/api'
import { io } from 'socket.io-client'

const TrackingMap = dynamic(() => import('@/components/TrackingMapInner'), { ssr: false })

const STATUS_LABELS: Record<string, string> = {
  pending: 'Finding your driver...',
  accepted: 'Driver on the way',
  arrived: 'Driver has arrived',
  in_progress: 'Trip in progress',
  completed: 'Trip completed',
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#D97706',
  accepted: '#FF6B2B',
  arrived: '#0D9488',
  in_progress: '#0D9488',
  completed: '#16A34A',
}

export default function TrackingPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  const [booking, setBooking] = useState<any>(null)
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const socketRef = useRef<any>(null)

  useEffect(() => {
    if (!id) return
    const fetchBooking = async () => {
      try {
        const res = await api.get(`/api/bookings/${id}`)
        const b = res.data?.booking || res.data?.data?.booking
        setBooking(b)
      } catch {
        router.push('/bookings')
      } finally {
        setLoading(false)
      }
    }
    fetchBooking()
  }, [id, router])

  useEffect(() => {
    if (!booking?._id) return
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      withCredentials: true
    })
    socketRef.current = socket
    socket.emit('join_booking', booking.bookingId)
    socket.on('location_update', (data: { lat: number; lng: number }) => {
      setDriverLocation(data)
    })
    socket.on('booking:status_update', (data: { status: string; booking: any }) => {
      setBooking((prev: any) => ({ ...prev, status: data.status, ...data.booking }))
    })
    return () => { socket.disconnect() }
  }, [booking?._id])

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <motion.div
        style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,107,43,0.2)', borderTopColor: '#FF6B2B' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )

  if (!booking) return null

  const status = booking.status || 'pending'
  const provider = booking.providerId
  const otp = booking.otp

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Top bar */}
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(242,239,233,0.92)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(15,14,12,0.07)'
        }}
      >
        <button
          onClick={() => router.push('/bookings')}
          style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(15,14,12,0.1)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <ArrowLeft size={16} color="var(--text)" />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
            {booking.bookingId}
          </div>
          <div style={{ fontFamily: 'Outfit', fontSize: 12, color: STATUS_COLORS[status] || 'var(--text-muted)' }}>
            {STATUS_LABELS[status] || status}
          </div>
        </div>
        <div style={{
          padding: '4px 12px', borderRadius: 20,
          background: (STATUS_COLORS[status] || '#888') + '18',
          border: `1px solid ${(STATUS_COLORS[status] || '#888')}40`,
          fontFamily: 'Outfit', fontSize: 11, fontWeight: 600,
          color: STATUS_COLORS[status] || '#888',
          textTransform: 'uppercase', letterSpacing: '0.06em'
        }}>
          {status.replace('_', ' ')}
        </div>
      </motion.div>

      {/* Map */}
      <div style={{ flex: 1, marginTop: 68 }}>
        <TrackingMap
          pickup={booking.pickup}
          dropoff={booking.dropoff}
          driverLocation={driverLocation}
        />
      </div>

      {/* Bottom sheet */}
      <motion.div
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px', boxShadow: '0 -8px 40px rgba(15,14,12,0.12)' }}
      >
        {/* OTP when driver arrives */}
        <AnimatePresence>
          {status === 'arrived' && otp && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)', borderRadius: 14, padding: '14px 16px', marginBottom: 16, textAlign: 'center' }}
            >
              <div style={{ fontFamily: 'Outfit', fontSize: 12, color: '#0D9488', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Share this OTP with driver</div>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 36, color: '#0D9488', letterSpacing: '0.15em' }}>{otp}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Driver info */}
        {provider ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: '#fff', flexShrink: 0 }}>
              {(provider.name || 'D')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{provider.name || 'Your driver'}</div>
              <div style={{ fontFamily: 'Outfit', fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                {booking.vehicleType || 'Transport'} · {booking.vehicleId?.registrationNumber || ''}
              </div>
            </div>
            {provider.phone && (
              <motion.a
                href={`tel:${provider.phone}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ width: 44, height: 44, borderRadius: '50%', background: '#FF6B2B', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}
              >
                <Phone size={18} color="#fff" />
              </motion.a>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <motion.div
              style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(255,107,43,0.2)', borderTopColor: '#FF6B2B', margin: '0 auto 12px' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
            <div style={{ fontFamily: 'Outfit', fontSize: 14, color: 'var(--text-muted)' }}>Searching for a driver nearby...</div>
          </div>
        )}

        {/* Fare and route info */}
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontFamily: 'Outfit', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Fare</div>
            <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, color: 'var(--orange)' }}>₹{booking.finalFare || booking.estimatedFare || 0}</div>
          </div>
          <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontFamily: 'Outfit', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Distance</div>
            <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, color: 'var(--text)' }}>{(booking.distanceKm || 0).toFixed(1)} km</div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
