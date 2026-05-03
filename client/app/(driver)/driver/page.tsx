'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useMotionValue, useTransform, animate, useInView } from 'framer-motion'
import { ArrowRight, Truck } from 'lucide-react'

import toast from 'react-hot-toast'
import api from '@/lib/api'
import { ensureArray } from '@/lib/ensureArray'
import { socket } from '@/lib/socket'
import AvailabilityToggle from '@/components/AvailabilityToggle'
import { fadeUp, stagger, springCard } from '@/lib/motion'

function CountUp({ to, prefix = '' }: { to: number; prefix?: string }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, v => prefix + Math.round(v).toLocaleString('en-IN'))
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref as any, { once: true })
  useEffect(() => {
    if (inView) animate(count, to, { duration: 1.4, ease: 'easeOut' })
  }, [inView, to, count])
  return <motion.span ref={ref}>{rounded}</motion.span>
}

function SectionSkeleton() {
  return <div className="skeleton" style={{ height: 148, borderRadius: 22 }} />
}

export default function DriverHomePage() {
  const [user, setUser] = useState<any>(null)
  const [vehicle, setVehicle] = useState<any>(null)
  const [earnings, setEarnings] = useState<any>({ today: 0, todayCount: 0, thisWeek: 0, thisMonth: 0, allTime: 0, tripCount: 0 })
  const [incoming, setIncoming] = useState<any[]>([])
  const [recentTrips, setRecentTrips] = useState<any[]>([])
  const [isAvailable, setIsAvailable] = useState(false)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [me, earningsRes, incomingRes, bookingsRes, vehicleRes] = await Promise.allSettled([
          api.get('/api/auth/me'),
          api.get('/api/driver/earnings'),
          api.get('/api/driver/incoming'),
          api.get('/api/driver/bookings'),
          api.get('/api/driver/vehicles/mine'),
        ])

        if (!mounted) return

        const meUser = me.status === 'fulfilled' ? (me.value.data?.user || me.value.data?.data?.user || null) : null
        setUser(meUser)
        if (meUser?._id || meUser?.id) socket.emit('join:user', { userId: meUser._id || meUser.id })

        const earningsData = earningsRes.status === 'fulfilled'
          ? (earningsRes.value.data?.earnings || earningsRes.value.data?.data?.earnings || earningsRes.value.data?.data || {})
          : {}
        setEarnings({
          today: Number(earningsData.today || 0),
          todayCount: Number(earningsData.todayCount || earningsData.todayTrips || 0),
          thisWeek: Number(earningsData.thisWeek || earningsData.week || 0),
          thisMonth: Number(earningsData.thisMonth || earningsData.month || 0),
          allTime: Number(earningsData.allTime || earningsData.total || 0),
          tripCount: Number(earningsData.tripCount || earningsData.totalTrips || 0),
        })

        const vehicleData = vehicleRes.status === 'fulfilled'
          ? (vehicleRes.value.data?.vehicle || vehicleRes.value.data?.data?.vehicle || null)
          : null
        setVehicle(vehicleData)
        setIsAvailable(Boolean(vehicleData?.isAvailable))

        const incomingList = incomingRes.status === 'fulfilled'
          ? ensureArray<any>(incomingRes.value.data?.bookings ?? incomingRes.value.data?.data?.bookings ?? incomingRes.value.data?.data ?? incomingRes.value.data)
          : []
        setIncoming(incomingList.slice(0, 3))

        const bookingList = bookingsRes.status === 'fulfilled'
          ? ensureArray<any>(bookingsRes.value.data?.bookings ?? bookingsRes.value.data?.data?.bookings ?? bookingsRes.value.data?.data ?? bookingsRes.value.data)
          : []
        setRecentTrips(bookingList.slice(0, 4))
      } catch {
        if (mounted) setError('Unable to load driver dashboard right now.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    const handleNewBooking = (booking: any) => {
      const next = booking?.booking || booking
      if (!next?._id) return
      setIncoming((prev) => prev.some((item) => item._id === next._id) ? prev : [next, ...prev].slice(0, 3))
      toast('New booking request available')
    }
    socket.on('booking:new', handleNewBooking)
    return () => {
      mounted = false
      socket.off('booking:new', handleNewBooking)
    }
  }, [])

  const toggleAvailability = async (value: boolean) => {
    setAvailabilityLoading(true)
    try {
      await api.put('/api/driver/availability', { isAvailable: value })
      setIsAvailable(value)
      setVehicle((prev: any) => prev ? { ...prev, isAvailable: value } : prev)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update availability')
    } finally {
      setAvailabilityLoading(false)
    }
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="page-shell compact page-stack">

      {/* Dark earnings hero card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: 'linear-gradient(135deg, #1A1916 0%, #242220 100%)',
          borderRadius: 20, padding: '28px 28px 24px',
          border: '1px solid rgba(255,107,43,0.15)',
          position: 'relative', overflow: 'hidden'
        }}
      >
        <motion.div
          style={{
            position: 'absolute', top: -50, right: -50, width: 180, height: 180,
            borderRadius: '50%', pointerEvents: 'none',
            background: 'radial-gradient(circle, rgba(255,107,43,0.2) 0%, transparent 70%)'
          }}
          animate={{ scale: [1, 1.25, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', fontFamily: 'Outfit', marginBottom: 6 }}>THIS MONTH</div>
        <div style={{ fontSize: 44, fontWeight: 800, color: '#FF6B2B', fontFamily: 'Syne', lineHeight: 1.05, letterSpacing: '-0.02em' }}>
          ₹<CountUp to={earnings.thisMonth} />
        </div>
        <div style={{ color: 'rgba(255,255,255,0.28)', fontFamily: 'Outfit', fontSize: 13, marginTop: 4 }}>
          Lifetime: ₹{(earnings.allTime || 0).toLocaleString('en-IN')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {[
            { label: 'Today', value: `₹${(earnings.today || 0).toLocaleString('en-IN')}`, orange: false },
            { label: 'This Week', value: `₹${(earnings.thisWeek || 0).toLocaleString('en-IN')}`, orange: false },
            { label: 'Trips', value: String(earnings.tripCount || 0), orange: true }
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.1 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: item.orange ? '#FF6B2B' : 'rgba(255,255,255,0.88)', fontFamily: 'Syne' }}>{item.value}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', fontFamily: 'Outfit', marginTop: 2, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.label}</div>
            </motion.div>
          ))}
        </div>
        {error && <p style={{ margin: '14px 0 0', color: 'rgba(255,100,100,0.9)', fontSize: 13 }}>{error}</p>}
      </motion.div>

      {/* Availability toggle */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: '#fff', borderRadius: 16, padding: '18px 20px',
          border: '1px solid rgba(15,14,12,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
        }}
      >
        <div>
          <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>
            {isAvailable ? '🟢 Online' : '⚫ Offline'}
          </div>
          <div style={{ fontFamily: 'Outfit', fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {isAvailable ? 'Receiving incoming trips' : 'Go online to receive trips'}
          </div>
        </div>
        <AvailabilityToggle isAvailable={isAvailable} onChange={toggleAvailability} loading={availabilityLoading} />
      </motion.div>

      {loading ? (
        <>
          <SectionSkeleton />
          <SectionSkeleton />
        </>
      ) : (
        <>
          {/* Vehicle status */}
          <motion.section variants={springCard} className="surface-panel panel-pad">
            <div className="section-head">
              <h2>Vehicle Status</h2>
              <Truck size={18} color="var(--accent)" />
            </div>
            {vehicle ? (
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{vehicle.type?.replace(/_/g, ' ') || 'Registered vehicle'}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{vehicle.registrationNumber || 'Registration not added yet'}</div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                  background: vehicle.isAvailable ? 'rgba(22,163,74,0.1)' : 'rgba(15,14,12,0.06)',
                  color: vehicle.isAvailable ? '#16A34A' : 'var(--text-muted)',
                  width: 'fit-content'
                }}>
                  {vehicle.isAvailable ? 'Available for trips' : 'Currently offline'}
                </div>
              </div>
            ) : (
              <Link href="/driver/profile" style={{ textDecoration: 'none', display: 'block' }}>
                <motion.div
                  whileHover={{ borderColor: 'rgba(255,107,43,0.5)' }}
                  style={{
                    border: '2px dashed rgba(255,107,43,0.35)', borderRadius: 14,
                    padding: '20px', textAlign: 'center', cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🚛</div>
                  <div style={{ fontWeight: 700, fontSize: 16, fontFamily: 'Syne', color: 'var(--text)' }}>Add your vehicle</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Go to profile to add your truck</div>
                </motion.div>
              </Link>
            )}
          </motion.section>

          {/* Incoming jobs preview */}
          <motion.section variants={fadeUp} custom={2} className="surface-panel panel-pad">
            <div className="section-head">
              <h2>Incoming Requests</h2>
              <Link href="/driver/incoming" className="muted-link" style={{ color: 'var(--accent)' }}>See all</Link>
            </div>
            {incoming.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>{isAvailable ? 'No incoming requests right now.' : 'Go online to start receiving bookings.'}</div>
            ) : (
              <div className="page-stack" style={{ gap: 12 }}>
                {incoming.map((booking) => (
                  <div key={booking._id} style={{ padding: 16, borderRadius: 18, border: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700 }}>{booking.pickup?.address || 'Pickup pending'}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{booking.dropoff?.address || 'Dropoff pending'}</div>
                      </div>
                      <div className="fare-number" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent)' }}>₹{Number(booking.estimatedFare || 0).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.section>

          {/* Recent trips */}
          <motion.section variants={fadeUp} custom={3} className="surface-panel panel-pad">
            <div className="section-head">
              <h2>Recent Trips</h2>
              <Link href="/driver/earnings" className="muted-link" style={{ color: 'var(--accent)' }}>Earnings</Link>
            </div>
            {recentTrips.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>No trips yet.</div>
            ) : (
              <div className="page-stack" style={{ gap: 12 }}>
                {recentTrips.map((trip) => (
                  <Link key={trip._id} href={`/driver/bookings/${trip.bookingId || trip._id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ padding: 16, borderRadius: 18, border: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{trip.customerId?.name || 'Customer'}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{trip.status?.replace('_', ' ') || 'pending'}</div>
                        </div>
                        <ArrowRight size={18} color="var(--accent)" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.section>
        </>
      )}
    </motion.div>
  )
}
