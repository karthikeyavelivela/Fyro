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
import { MapPin, CheckCircle, TrendingUp, Star, Users } from 'lucide-react'

export default function HamaliHomePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isAvailable, setIsAvailable] = useState(false)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [earnings, setEarnings] = useState<any>(null)
  const [activeBooking, setActiveBooking] = useState<any>(null)
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, earningsRes, bookingsRes, profileRes] = await Promise.all([
          api.get('/api/auth/me'),
          api.get('/api/hamali/earnings'),
          api.get('/api/hamali/bookings?limit=5'),
          api.get('/api/hamali/profile/mine')
        ])
        setUser(meRes.data.user)
        setEarnings(earningsRes.data.earnings || earningsRes.data)
        setRecentBookings(bookingsRes.data.bookings || [])
        const prof = profileRes.data.profile
        setProfile(prof)
        setIsAvailable(prof?.isAvailable || false)

        const activeRes = await api.get('/api/hamali/bookings?status=in_progress&limit=1')
        if (activeRes.data.bookings?.[0]) {
          setActiveBooking(activeRes.data.bookings[0])
        } else {
          const accRes = await api.get('/api/hamali/bookings?status=accepted&limit=1')
          if (accRes.data.bookings?.[0]) setActiveBooking(accRes.data.bookings[0])
        }
      } catch {
        // handled by interceptor
      } finally {
        setLoading(false)
      }
    }
    load()

    const socket = getSocket()
    socket.on('booking:new', () => {
      toast('New job request!', { icon: '👷', duration: 5000 })
    })
    return () => { socket.off('booking:new') }
  }, [])

  const toggleAvailability = async (val: boolean) => {
    setAvailabilityLoading(true)
    try {
      await api.put('/api/hamali/availability', { isAvailable: val })
      setIsAvailable(val)
      toast.success(val ? 'You are now online' : 'You are now offline')
    } catch {
      toast.error('Failed to update')
    } finally {
      setAvailabilityLoading(false)
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
        {[1, 2, 3].map(i => <div key={i} className="shimmer h-24 rounded-md" />)}
      </div>
    )
  }

  const teal = '#0D9488'
  const tealLight = '#CCFBF1'

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
          <h2 className="font-syne font-800 text-2xl" style={{ color: teal }}>
            {user?.name?.split(' ')[0] || 'Hamali'}
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

      {/* Stats */}
      <motion.div variants={springPop} className="grid grid-cols-3 gap-3">
        {[
          { label: 'Today', value: `₹${earnings?.today || 0}`, icon: TrendingUp },
          { label: 'Team', value: profile?.teamSize || 1, icon: Users },
          { label: 'Rating', value: user?.rating?.toFixed(1) || '5.0', icon: Star },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-md p-3 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <Icon size={18} style={{ color: teal, margin: '0 auto 6px' }} />
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
          style={{ background: tealLight, border: `2px solid ${teal}` }}
        >
          <div className="flex items-center justify-between">
            <span className="font-syne font-700 text-sm" style={{ color: teal }}>ACTIVE JOB</span>
            <span
              className="text-xs px-2 py-1 rounded-full font-500"
              style={{ background: teal, color: 'white' }}
            >
              {activeBooking.status.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <MapPin size={14} style={{ color: teal, marginTop: 2, flexShrink: 0 }} />
            <span className="line-clamp-1" style={{ color: 'var(--text)' }}>
              {activeBooking.pickup?.address}
            </span>
          </div>
          <div className="flex gap-2">
            {activeBooking.status === 'in_progress' && (
              <button
                onClick={async () => {
                  try {
                    await api.put(`/api/hamali/bookings/${activeBooking.bookingId}/complete`)
                    toast.success('Job completed!')
                    setActiveBooking(null)
                  } catch {
                    toast.error('Failed')
                  }
                }}
                className="flex-1 py-2 rounded-sm text-sm font-500 text-white"
                style={{ background: 'var(--green)' }}
              >
                <CheckCircle size={14} className="inline mr-1" /> Complete
              </button>
            )}
            <button
              onClick={() => router.push(`/hamali/bookings/${activeBooking.bookingId}`)}
              className="flex-1 py-2 rounded-sm text-sm font-500 text-white"
              style={{ background: teal }}
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
              onClick={() => router.push('/hamali/earnings')}
              className="text-sm font-500"
              style={{ color: teal }}
            >
              View all →
            </button>
          </div>
          <EarningsChart data={earnings.last7days} color={teal} />
        </motion.div>
      )}

      {/* Recent bookings */}
      {recentBookings.length > 0 && (
        <motion.div variants={fadeUp}>
          <h3 className="font-syne font-700 text-base mb-3" style={{ color: 'var(--text)' }}>
            Recent Jobs
          </h3>
          <div className="space-y-2">
            {recentBookings.map(b => <BookingCard key={b._id} booking={b} />)}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
