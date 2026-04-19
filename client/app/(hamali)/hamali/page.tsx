'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle, MapPin, Star, TrendingUp, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { ensureArray } from '@/lib/ensureArray'
import { socket } from '@/lib/socket'
import AvailabilityToggle from '@/components/AvailabilityToggle'
import EarningsChart from '@/components/EarningsChart'
import BookingCard from '@/components/BookingCard'
import { fadeUp, staggerContainer, springPop } from '@/lib/animations'

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
        const [meResult, earningsResult, bookingsResult, profileResult] = await Promise.allSettled([
          api.get('/api/auth/me'),
          api.get('/api/hamali/earnings'),
          api.get('/api/hamali/bookings?limit=4'),
          api.get('/api/hamali/profile/mine'),
        ])

        if (meResult.status === 'fulfilled') {
          setUser(meResult.value.data?.user || meResult.value.data?.data?.user || null)
        }

        if (earningsResult.status === 'fulfilled') {
          setEarnings(earningsResult.value.data?.earnings || earningsResult.value.data)
        } else {
          setEarnings({ today: 0, thisWeek: 0, todayCount: 0, last7days: [] })
        }

        if (bookingsResult.status === 'fulfilled') {
          setRecentBookings(
            ensureArray<any>(
              bookingsResult.value.data?.bookings ?? bookingsResult.value.data?.data?.bookings ?? bookingsResult.value.data?.data ?? bookingsResult.value.data
            )
          )
        } else {
          setRecentBookings([])
        }

        if (profileResult.status === 'fulfilled') {
          const prof = profileResult.value.data?.profile || profileResult.value.data?.data?.profile || null
          setProfile(prof)
          setIsAvailable(Boolean(prof?.isAvailable))
        } else {
          setProfile(null)
          setIsAvailable(false)
        }

        try {
          const activeRes = await api.get('/api/hamali/bookings?status=in_progress&limit=1')
          if (activeRes.data.bookings?.[0]) {
            setActiveBooking(activeRes.data.bookings[0])
          } else {
            const acceptedRes = await api.get('/api/hamali/bookings?status=accepted&limit=1')
            setActiveBooking(acceptedRes.data.bookings?.[0] || null)
          }
        } catch {
          setActiveBooking(null)
        }
      } catch {
        toast.error('Failed to load hamali dashboard')
      } finally {
        setLoading(false)
      }
    }

    load()
    socket.on('booking:new', () => toast('New job request'))
    return () => {
      socket.off('booking:new')
    }
  }, [])

  const toggleAvailability = async (value: boolean) => {
    setAvailabilityLoading(true)
    try {
      await api.put('/api/hamali/availability', { isAvailable: value })
      setIsAvailable(value)
      toast.success(value ? 'You are now online' : 'You are now offline')
    } catch {
      toast.error('Failed to update availability')
    } finally {
      setAvailabilityLoading(false)
    }
  }

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  if (loading) {
    return (
      <div className="page-shell compact page-stack">
        <div className="shimmer" style={{ height: 96, borderRadius: 18 }} />
        <div className="shimmer" style={{ height: 140, borderRadius: 18 }} />
        <div className="shimmer" style={{ height: 260, borderRadius: 18 }} />
      </div>
    )
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="page-shell page-stack">
      <motion.div variants={fadeUp} className="page-title">
        <div>
          <h1>{greeting}, {user?.name?.split(' ')[0] || 'Hamali'}</h1>
          <p>Keep team availability, active jobs, and earnings visible in a proper desktop workspace.</p>
        </div>
        <AvailabilityToggle isAvailable={isAvailable} onChange={toggleAvailability} loading={availabilityLoading} themeColor="var(--teal)" />
      </motion.div>

      <motion.div variants={springPop} className="compact-stat-grid">
        {[
          { label: 'Today', value: `₹${earnings?.today || 0}`, icon: TrendingUp },
          { label: 'Team size', value: String(profile?.teamSize || 1), icon: Users },
          { label: 'Rating', value: user?.rating?.toFixed(1) || '5.0', icon: Star },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="compact-stat">
            <Icon size={18} color="var(--teal)" />
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </motion.div>

      <div className="dashboard-grid">
        <div className="dashboard-main page-stack">
          {activeBooking ? (
            <motion.section variants={fadeUp} className="surface-panel panel-pad" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(242,251,249,0.9))' }}>
              <div className="section-head">
                <div>
                  <h2>Active job</h2>
                  <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>{activeBooking.status.replace('_', ' ')}</p>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem', lineHeight: 1, color: 'var(--teal)' }}>
                  ₹{activeBooking.totalFare || activeBooking.finalFare || 0}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <MapPin size={16} color="var(--teal)" style={{ marginTop: 4 }} />
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Location</div>
                  <div>{activeBooking.pickup?.address || activeBooking.workLocation?.address}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
                {activeBooking.status === 'in_progress' && (
                  <button
                    onClick={async () => {
                      try {
                        await api.put(`/api/hamali/bookings/${activeBooking.bookingId || activeBooking._id}/complete`)
                        toast.success('Job completed')
                        setActiveBooking(null)
                      } catch {
                        toast.error('Failed to complete job')
                      }
                    }}
                    style={{ minHeight: 46, padding: '0 18px', borderRadius: 999, border: 0, background: 'var(--green)', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-body)' }}
                  >
                    <CheckCircle size={15} style={{ display: 'inline-block', marginRight: 8 }} />
                    Complete
                  </button>
                )}
                <button
                  onClick={() => router.push(`/hamali/bookings/${activeBooking.bookingId || activeBooking._id}`)}
                  style={{ minHeight: 46, padding: '0 18px', borderRadius: 999, border: 0, background: 'var(--teal)', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-body)' }}
                >
                  View details
                </button>
              </div>
            </motion.section>
          ) : (
            <motion.section variants={fadeUp} className="surface-panel panel-pad">
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.35rem', lineHeight: 1 }}>No active job</h2>
              <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Stay online to receive new hamali requests.</p>
            </motion.section>
          )}

          {earnings?.last7days && (
            <motion.section variants={fadeUp} className="surface-panel panel-pad">
              <div className="section-head">
                <h3>This Week</h3>
                <Link href="/hamali/earnings" className="muted-link">Open earnings</Link>
              </div>
              <EarningsChart data={earnings.last7days} color="var(--teal)" />
            </motion.section>
          )}
        </div>

        <div className="dashboard-side page-stack">
          <motion.section variants={fadeUp} className="surface-panel panel-pad">
            <div className="section-head">
              <h3>Recent jobs</h3>
              <Link href="/hamali/incoming" className="muted-link">Incoming jobs</Link>
            </div>
            <div className="page-stack" style={{ gap: 12 }}>
              {recentBookings.length ? recentBookings.map((booking) => <BookingCard key={booking._id} booking={booking} />) : <div style={{ color: 'var(--text-muted)' }}>No recent jobs.</div>}
            </div>
          </motion.section>
        </div>
      </div>
    </motion.div>
  )
}
