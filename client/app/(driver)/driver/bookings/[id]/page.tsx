'use client'
import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { fadeUp, springPop } from '@/lib/animations'
import api from '@/lib/api'
import { getSocket } from '@/lib/socket'
import toast from 'react-hot-toast'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import StatusTimeline from '@/components/StatusTimeline'
import ChatBox from '@/components/ChatBox'
import FareBreakdown from '@/components/FareBreakdown'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { ArrowLeft, Phone, MapPin, Flag, Navigation, CheckCircle, Copy } from 'lucide-react'

const LiveTrackingMap = dynamic(() => import('@/components/LiveTrackingMap'), { ssr: false })

export default function DriverBookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [driverLocation, setDriverLocation] = useState<{lat:number,lng:number}|null>(null)
  const watchIdRef = useRef<number | null>(null)
  const lastEmitRef = useRef<number>(0)
  const [currentUserId, setCurrentUserId] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await api.get('/api/auth/me')
        setCurrentUserId(meRes.data.user?.id || meRes.data.user?._id)
        const res = await api.get(`/api/bookings/${bookingId}`)
        setBooking(res.data.booking)
      } catch {
        // handled
      } finally {
        setLoading(false)
      }
    }
    load()

    const socket = getSocket()
    socket.emit('join:booking', { bookingId })
    socket.on('booking:status_update', ({ status, booking: updated }: any) => {
      setBooking((prev: any) => ({ ...prev, status, ...(updated || {}) }))
    })

    return () => {
      socket.off('booking:status_update')
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [bookingId])

  // Start emitting location when in_progress
  useEffect(() => {
    if (booking?.status !== 'in_progress') return
    const socket = getSocket()

    const emitLocation = (lat: number, lng: number) => {
      const now = Date.now()
      if (now - lastEmitRef.current < 4000) return
      lastEmitRef.current = now
      setDriverLocation({ lat, lng })
      socket.emit('driver:location_update', { bookingId, lat, lng })
      api.put('/api/driver/location', { lat, lng }).catch(() => {})
    }

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        pos => emitLocation(pos.coords.latitude, pos.coords.longitude),
        () => {},
        { enableHighAccuracy: true }
      )
    }

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [booking?.status, bookingId])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied!')
  }

  const handleAction = async (action: 'start' | 'complete') => {
    setActionLoading(true)
    try {
      await api.put(`/api/driver/bookings/${bookingId}/${action}`)
      toast.success(action === 'start' ? 'Trip started!' : 'Trip completed!')
      const res = await api.get(`/api/bookings/${bookingId}`)
      setBooking(res.data.booking)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="shimmer h-8 w-32 rounded" />
        <div className="shimmer h-56 rounded-md" />
        <div className="shimmer h-32 rounded-md" />
      </div>
    )
  }

  if (!booking) return <div className="p-4 text-center" style={{ color: 'var(--text-muted)' }}>Booking not found</div>

  const customer = booking.customerId

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-8"
      style={{ background: 'var(--bg)' }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        <button onClick={() => router.back()} className="p-2 rounded-full" style={{ background: 'var(--surface-raised)' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-xs font-500" style={{ color: 'var(--text-muted)' }}>{booking.bookingId}</p>
          <Badge status={booking.status} />
        </div>
      </div>

      {/* Map */}
      <div className="h-56 md:h-72">
        <LiveTrackingMap
          pickup={booking.pickup}
          dropoff={booking.dropoff}
          driverLocation={driverLocation}
          bookingStatus={booking.status}
        />
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Customer info */}
        <motion.div
          variants={springPop}
          initial="hidden"
          animate="show"
          className="rounded-md p-4 flex items-center gap-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <Avatar name={customer?.name || 'C'} size="lg" />
          <div className="flex-1">
            <p className="font-syne font-700 text-base" style={{ color: 'var(--text)' }}>{customer?.name}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Customer</p>
          </div>
          {customer?.phone && (
            <a
              href={`tel:${customer.phone}`}
              className="flex items-center justify-center w-10 h-10 rounded-full"
              style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
            >
              <Phone size={18} />
            </a>
          )}
        </motion.div>

        {/* Addresses */}
        <motion.div
          variants={fadeUp}
          className="rounded-md p-4 space-y-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-light)' }}>
              <MapPin size={14} style={{ color: 'var(--accent)' }} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-500 mb-1" style={{ color: 'var(--text-muted)' }}>PICKUP</p>
              <p className="font-500 text-sm" style={{ color: 'var(--text)' }}>{booking.pickup?.address}</p>
            </div>
            <button onClick={() => copyToClipboard(booking.pickup?.address)} className="p-1">
              <Copy size={14} style={{ color: 'var(--text-faint)' }} />
            </button>
          </div>
          <div className="ml-4 w-px h-4 bg-gray-200" />
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--surface-raised)' }}>
              <Flag size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-500 mb-1" style={{ color: 'var(--text-muted)' }}>DROPOFF</p>
              <p className="font-500 text-sm" style={{ color: 'var(--text)' }}>{booking.dropoff?.address}</p>
            </div>
          </div>
        </motion.div>

        {/* Fare */}
        <div className="rounded-md p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-500 mb-1" style={{ color: 'var(--text-muted)' }}>FARE</p>
          <p className="font-syne font-800 text-3xl" style={{ color: 'var(--accent)' }}>
            ₹{booking.finalFare || booking.estimatedFare}
          </p>
          <FareBreakdown fare={booking.fareBreakdown || {}} bookingId={booking._id} status={booking.status} />
        </div>

        {/* Status timeline */}
        <StatusTimeline currentStatus={booking.status} timestamps={{ accepted: booking.acceptedAt, in_progress: booking.startedAt, completed: booking.completedAt, paid: booking.paidAt }} />

        {/* Action buttons */}
        {booking.status === 'accepted' && (
          <Button
            variant="primary"
            className="w-full"
            loading={actionLoading}
            onClick={() => handleAction('start')}
          >
            Start Trip
          </Button>
        )}
        {booking.status === 'in_progress' && (
          <Button
            variant="teal"
            className="w-full"
            loading={actionLoading}
            onClick={() => handleAction('complete')}
          >
            <CheckCircle size={18} className="mr-2" />
            Complete Trip
          </Button>
        )}

        {/* Navigate button */}
        <button
          onClick={() => window.open(`https://maps.google.com/?q=${booking.pickup?.lat},${booking.pickup?.lng}`, '_blank')}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-md font-500"
          style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', color: 'var(--text)' }}
        >
          <Navigation size={18} style={{ color: 'var(--accent)' }} />
          Navigate to Pickup
        </button>

        {/* Chat */}
        {(booking.status === 'accepted' || booking.status === 'in_progress') && currentUserId && (
          <div className="rounded-md overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <div className="p-3" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
              <p className="font-syne font-700 text-sm" style={{ color: 'var(--text)' }}>
                Messages with {customer?.name}
              </p>
            </div>
            <ChatBox bookingId={bookingId} currentUserId={currentUserId} currentUserRole="driver" />
          </div>
        )}
      </div>
    </motion.div>
  )
}
