'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Truck } from 'lucide-react'

const DriverAvatar3D = dynamic(() => import('@/components/3d/DriverAvatar3D'), { ssr: false, loading: () => <div style={{ width: '100%', height: '100%' }} /> })
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { ensureArray } from '@/lib/ensureArray'
import { socket } from '@/lib/socket'
import AvailabilityToggle from '@/components/AvailabilityToggle'
import { fadeUp, stagger, springCard } from '@/lib/motion'

function SectionSkeleton() {
  return <div className="skeleton" style={{ height: 148, borderRadius: 22 }} />
}

export default function DriverHomePage() {
  const [user, setUser] = useState<any>(null)
  const [vehicle, setVehicle] = useState<any>(null)
  const [earnings, setEarnings] = useState<any>({ today: 0, todayCount: 0, thisWeek: 0 })
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
    socket.on('booking:new', (booking: any) => {
      const next = booking?.booking || booking
      if (!next?._id) return
      setIncoming((prev) => prev.some((item) => item._id === next._id) ? prev : [next, ...prev].slice(0, 3))
      toast('New booking request available')
    })
    return () => {
      mounted = false
      socket.off('booking:new')
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

  const todayLabel = useMemo(() => `₹${Number(earnings.today || 0).toLocaleString('en-IN')}`, [earnings.today])

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="page-shell compact page-stack">
      <motion.section variants={fadeUp} custom={0} className="surface-panel panel-pad" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: -10, right: 12, width: 115, height: 135, pointerEvents: 'none', zIndex: 2 }}>
          <DriverAvatar3D />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', paddingRight: 120 }}>
          <div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Driver Workspace</p>
            <h1 className="font-display" style={{ margin: '8px 0 0', fontSize: '2rem' }}>{user?.name?.split(' ')[0] || 'Driver'}</h1>
          </div>
          <AvailabilityToggle isAvailable={isAvailable} onChange={toggleAvailability} loading={availabilityLoading} />
        </div>
        {error && <p style={{ margin: '14px 0 0', color: 'var(--red)', fontSize: 14 }}>{error}</p>}
      </motion.section>

      {loading ? (
        <>
          <SectionSkeleton />
          <SectionSkeleton />
          <SectionSkeleton />
          <SectionSkeleton />
        </>
      ) : (
        <>
          <motion.section variants={fadeUp} custom={1} className="surface-panel panel-pad">
            <div className="section-head">
              <h2>Today Stats</h2>
            </div>
            <div className="compact-stat-grid">
              <div className="compact-stat">
                <strong className="stat-number">{todayLabel}</strong>
                <span>Earnings</span>
              </div>
              <div className="compact-stat">
                <strong className="stat-number">{earnings.todayCount || 0}</strong>
                <span>Trips</span>
              </div>
              <div className="compact-stat">
                <strong className="stat-number">₹{Number(earnings.thisWeek || 0).toLocaleString('en-IN')}</strong>
                <span>This Week</span>
              </div>
            </div>
          </motion.section>

          <motion.section variants={springCard} className="surface-panel panel-pad">
            <div className="section-head">
              <h2>Vehicle Status</h2>
              <Truck size={18} color="var(--accent)" />
            </div>
            {vehicle ? (
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{vehicle.type?.replace(/_/g, ' ') || 'Registered vehicle'}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{vehicle.registrationNumber || 'Registration not added yet'}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{vehicle.isAvailable ? 'Available for trips' : 'Currently offline'}</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 18 }}>No vehicle added</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Add your vehicle to start accepting trips.</div>
                <Link href="/driver/profile" className="muted-link" style={{ color: 'var(--accent)' }}>Go to profile</Link>
              </div>
            )}
          </motion.section>

          <motion.section variants={fadeUp} custom={2} className="surface-panel panel-pad">
            <div className="section-head">
              <h2>Incoming Requests Preview</h2>
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
