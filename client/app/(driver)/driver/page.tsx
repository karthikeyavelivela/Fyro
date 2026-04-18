'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { fadeUp, staggerContainer, springPop } from '@/lib/animations'
import api from '@/lib/api'
import { getSocket } from '@/lib/socket'
import toast from 'react-hot-toast'
import AvailabilityToggle from '@/components/AvailabilityToggle'
import EarningsChart from '@/components/EarningsChart'
import BookingCard from '@/components/BookingCard'
import { useRouter } from 'next/navigation'
import { MapPin, Navigation, CheckCircle, TrendingUp, Star, Truck } from 'lucide-react'

export default function DriverHomePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isAvailable, setIsAvailable] = useState(false)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [earnings, setEarnings] = useState<any>(null)
  const [activeBooking, setActiveBooking] = useState<any>(null)
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, earningsRes, bookingsRes] = await Promise.all([
          api.get('/api/auth/me'),
          api.get('/api/driver/earnings'),
          api.get('/api/driver/bookings?limit=5')
        ])
        setUser(meRes.data.user)
        setEarnings(earningsRes.data)
        setRecentBookings(bookingsRes.data.bookings || [])

        // Get vehicle availability
        const vehicleRes = await api.get('/api/vehicles/mine')
        if (vehicleRes.data.vehicle) {
          setIsAvailable(vehicleRes.data.vehicle.isAvailable)
        }

        // Check active booking
        const activeRes = await api.get('/api/driver/bookings?status=in_progress&limit=1')
        if (activeRes.data.bookings?.[0]) {
          setActiveBooking(activeRes.data.bookings[0])
        } else {
          const acceptedRes = await api.get('/api/driver/bookings?status=accepted&limit=1')
          if (acceptedRes.data.bookings?.[0]) setActiveBooking(acceptedRes.data.bookings[0])
        }
      } catch (err) {
        // handled by interceptor
      } finally {
        setLoading(false)
      }
    }
    load()

    const socket = getSocket()
    if (user?.id) socket.emit('join:user', { userId: user.id })
    socket.on('booking:new', () => {
      toast('New booking request!', { icon: '🚛' })
    })
    return () => { socket.off('booking:new') }
  }, [])

  const toggleAvailability = async (val: boolean) => {
    setAvailabilityLoading(true)
    try {
      await api.put('/api/driver/availability', { isAvailable: val })
      setIsAvailable(val)
      toast.success(val ? 'You are now online' : 'You are now offline')
    } catch {
      toast.error('Failed to update availability')
    } finally {
      setAvailabilityLoading(false)
    }
  }

  const completeTrip = async (bookingId: string) => {
    try {
      await api.put(`/api/driver/bookings/${bookingId}/complete`)
      toast.success('Trip completed!')
      setActiveBooking(null)
    } catch {
      toast.error('Failed to complete trip')
    }
  }

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="shimmer h-16 rounded-md" />
        <div className="shimmer h-32 rounded-md" />
        <div className="shimmer h-48 rounded-md" />
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="p-4 space-y-4 max-w-lg mx-auto"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between pt-2">
        <div>
          <h1 className="font-syne font-700 text-2xl" style={{ color: 'var(--text)' }}>
            {getGreeting()},
          </h1>
          <h2 className="font-syne font-800 text-2xl" style={{ color: 'var(--accent)' }}>
            {user?.name?.split(' ')[0] || 'Driver'}
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <AvailabilityToggle
          isAvailable={isAvailable}
          onChange={toggleAvailability}
          loading={availabilityLoading}
        />
      </motion.div>

      {/* Today's stats */}
      <motion.div variants={springPop} className="grid grid-cols-3 gap-3">
        {[
          { label: 'Today', value: `₹${earnings?.today || 0}`, icon: TrendingUp },
          { label: 'Trips', value: earnings?.todayTrips || 0, icon: Truck },
          { label: 'Rating', value: user?.rating?.toFixed(1) || '5.0', icon: Star },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-md p-3 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <Icon size={18} style={{ color: 'var(--accent)', margin: '0 auto 6px' }} />
            <div className="font-syne font-700 text-lg" style={{ color: 'var(--text)' }}>{value}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </motion.div>

      {/* Active booking */}
      {activeBooking && (
        <motion.div
          variants={springPop}
          className="rounded-md p-4 space-y-3"
          style={{
            background: 'var(--accent-light)',
            border: '2px solid var(--accent)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="font-syne font-700 text-sm" style={{ color: 'var(--accent)' }}>
              ACTIVE TRIP
            </span>
            <span
              className="text-xs px-2 py-1 rounded-full font-500"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              {activeBooking.status.replace('_', ' ')}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-start gap-2 text-sm">
              <MapPin size={14} style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }} />
              <span style={{ color: 'var(--text)' }} className="line-clamp-1">{activeBooking.pickup?.address}</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <MapPin size={14} style={{ color: 'var(--text-muted)', marginTop: 2, flexShrink: 0 }} />
              <span style={{ color: 'var(--text-muted)' }} className="line-clamp-1">{activeBooking.dropoff?.address}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => window.open(`https://maps.google.com/?q=${activeBooking.pickup?.lat},${activeBooking.pickup?.lng}`, '_blank')}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-sm text-sm font-500"
              style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', color: 'var(--text)' }}
            >
              <Navigation size={14} /> Navigate
            </button>
            {activeBooking.status === 'in_progress' && (
              <button
                onClick={() => completeTrip(activeBooking._id)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-sm text-sm font-500 text-white"
                style={{ background: 'var(--green)' }}
              >
                <CheckCircle size={14} /> Complete
              </button>
            )}
            <button
              onClick={() => router.push(`/driver/bookings/${activeBooking._id}`)}
              className="flex-1 py-2 rounded-sm text-sm font-500"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              View Details
            </button>
          </div>
        </motion.div>
      )}

      {/* Earnings chart */}
      {earnings?.last7days && (
        <motion.div
          variants={fadeUp}
          className="rounded-md p-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-syne font-700 text-base" style={{ color: 'var(--text)' }}>This Week</h3>
            <button
              onClick={() => router.push('/driver/earnings')}
              className="text-sm font-500"
              style={{ color: 'var(--accent)' }}
            >
              View all →
            </button>
          </div>
          <EarningsChart data={earnings.last7days} />
        </motion.div>
      )}

      {/* Recent bookings */}
      {recentBookings.length > 0 && (
        <motion.div variants={fadeUp}>
          <h3 className="font-syne font-700 text-base mb-3" style={{ color: 'var(--text)' }}>Recent Trips</h3>
          <div className="space-y-2">
            {recentBookings.map((b) => <BookingCard key={b._id} booking={b} />)}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
