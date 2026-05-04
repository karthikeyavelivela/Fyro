'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useTransform, animate, useInView } from 'framer-motion'
import { Truck, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { ensureArray } from '@/lib/ensureArray'
import { socket } from '@/lib/socket'
import AvailabilityToggle from '@/components/AvailabilityToggle'

function CountUp({ to }: { to: number }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, v => Math.round(v).toLocaleString('en-IN'))
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref as any, { once: true })
  useEffect(() => { if (inView) animate(count, to, { duration: 1.4, ease: 'easeOut' }) }, [inView, to, count])
  return <motion.span ref={ref}>{rounded}</motion.span>
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function DriverHomePage() {
  const [user, setUser] = useState<any>(null)
  const [vehicle, setVehicle] = useState<any>(null)
  const [earnings, setEarnings] = useState<any>({ today: 0, thisWeek: 0, thisMonth: 0, allTime: 0, tripCount: 0 })
  const [incoming, setIncoming] = useState<any[]>([])
  const [recentTrips, setRecentTrips] = useState<any[]>([])
  const [isOnline, setIsOnline] = useState(false)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    let mounted = true
    const load = async () => {
      try {
        const [me, earningsRes, incomingRes, bookingsRes, vehicleRes] = await Promise.allSettled([
          api.get('/api/auth/me'),
          api.get('/api/driver/earnings'),
          api.get('/api/driver/incoming'),
          api.get('/api/driver/bookings'),
          api.get('/api/driver/vehicles/mine'),
        ])
        if (!mounted) return

        const meUser = me.status === 'fulfilled' ? (me.value.data?.user || me.value.data?.data?.user) : null
        setUser(meUser)
        if (meUser?._id) socket.emit('join:user', { userId: meUser._id })

        const ed = earningsRes.status === 'fulfilled'
          ? (earningsRes.value.data?.earnings || earningsRes.value.data?.data?.earnings || {})
          : {}
        setEarnings({
          today: Number(ed.today || 0),
          thisWeek: Number(ed.thisWeek || 0),
          thisMonth: Number(ed.thisMonth || 0),
          allTime: Number(ed.allTime || 0),
          tripCount: Number(ed.tripCount || 0),
        })

        const v = vehicleRes.status === 'fulfilled'
          ? (vehicleRes.value.data?.vehicle || vehicleRes.value.data?.data?.vehicle)
          : null
        setVehicle(v)
        setIsOnline(Boolean(v?.isAvailable))

        setIncoming(
          (incomingRes.status === 'fulfilled'
            ? ensureArray<any>(incomingRes.value.data?.bookings ?? incomingRes.value.data?.data?.bookings)
            : []
          ).slice(0, 3)
        )
        setRecentTrips(
          (bookingsRes.status === 'fulfilled'
            ? ensureArray<any>(bookingsRes.value.data?.bookings ?? bookingsRes.value.data?.data?.bookings)
            : []
          ).slice(0, 4)
        )
      } catch {
        if (mounted) setError(true)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()

    const handleNewBooking = (b: any) => {
      const next = b?.booking || b
      if (!next?._id) return
      setIncoming(prev => prev.some(x => x._id === next._id) ? prev : [next, ...prev].slice(0, 3))
      toast('New booking request')
    }
    socket.on('booking:new', handleNewBooking)
    return () => { mounted = false; socket.off('booking:new', handleNewBooking) }
  }, [])

  const toggleAvailability = async (value: boolean) => {
    setAvailabilityLoading(true)
    try {
      await api.put('/api/driver/availability', { isAvailable: value })
      setIsOnline(value)
      setVehicle((p: any) => p ? { ...p, isAvailable: value } : p)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed')
    } finally {
      setAvailabilityLoading(false)
    }
  }

  return (
    <div className="fyro-page">

      {/* Greeting */}
      <div className="fade-up fade-up-1" style={{ marginBottom: 16 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', margin: '0 0 2px' }}>
          {getGreeting()},
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(22px,4vw,30px)', color: 'var(--text)', letterSpacing: '-0.025em', margin: 0 }}>
          {user?.name?.split(' ')[0] || (loading ? '' : 'Driver')}
        </h1>
      </div>

      {/* Dark earnings hero */}
      <div className="fyro-card-dark fade-up fade-up-1" style={{
        padding: '24px 22px', marginBottom: 14,
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: -50, right: -50, width: 180, height: 180,
          borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(255,107,43,0.22) 0%, transparent 70%)',
          animation: 'pulseDot 4s ease-in-out infinite'
        }} />
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.36)', fontFamily: 'var(--font-body)', margin: '0 0 6px' }}>This Month</p>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, color: 'var(--orange)', letterSpacing: '-0.025em', lineHeight: 1, margin: 0 }}>
          ₹<CountUp to={earnings.thisMonth} />
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.28)', margin: '5px 0 0' }}>
          Lifetime ₹{(earnings.allTime || 0).toLocaleString('en-IN')}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {[
            { label: 'Today', value: `₹${(earnings.today || 0).toLocaleString('en-IN')}` },
            { label: 'This Week', value: `₹${(earnings.thisWeek || 0).toLocaleString('en-IN')}` },
            { label: 'Trips', value: String(earnings.tripCount || 0), accent: true },
          ].map(({ label, value, accent }) => (
            <div key={label}>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: accent ? 'var(--orange)' : 'rgba(255,255,255,0.85)', margin: 0 }}>{value}</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '2px 0 0' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Availability toggle */}
      <div className="fade-up fade-up-2" style={{
        background: isOnline ? 'rgba(22,163,74,0.06)' : 'var(--surface)',
        border: `1px solid ${isOnline ? 'rgba(22,163,74,0.2)' : 'var(--border)'}`,
        borderRadius: 16, padding: '16px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 14, marginBottom: 12, transition: 'all 280ms cubic-bezier(0.16,1,0.3,1)'
      }}>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: isOnline ? '#16A34A' : 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
            {isOnline && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A', display: 'inline-block', animation: 'pulseDot 2s ease infinite' }} />}
            Availability
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
            {isOnline ? 'Receiving incoming jobs' : 'Toggle to start receiving jobs'}
          </p>
        </div>
        <AvailabilityToggle isAvailable={isOnline} onChange={toggleAvailability} loading={availabilityLoading} />
      </div>

      {/* Vehicle */}
      {!vehicle ? (
        <Link href="/driver/profile" style={{ textDecoration: 'none' }}>
          <div className="fade-up fade-up-3" style={{
            border: '2px dashed rgba(255,107,43,0.28)', borderRadius: 16,
            padding: '18px', textAlign: 'center', cursor: 'pointer',
            marginBottom: 14, transition: 'all 220ms cubic-bezier(0.16,1,0.3,1)'
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,107,43,0.5)'; e.currentTarget.style.background = 'rgba(255,107,43,0.03)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,107,43,0.28)'; e.currentTarget.style.background = ''; }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(255,107,43,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
              <Truck size={19} color="var(--orange)" />
            </div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text)', margin: '0 0 3px' }}>Add your vehicle</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Complete profile to go online</p>
          </div>
        </Link>
      ) : (
        <div className="fade-up fade-up-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 18px', marginBottom: 14, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: 'rgba(255,107,43,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Truck size={19} color="var(--orange)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text)', margin: 0 }}>{vehicle.registrationNumber || 'Vehicle'}</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0', textTransform: 'capitalize' }}>{vehicle.type?.replace(/_/g, ' ') || ''}</p>
            </div>
            <span style={{
              padding: '4px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700,
              fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.06em',
              background: vehicle.isAvailable ? 'rgba(22,163,74,0.1)' : 'rgba(15,14,12,0.06)',
              color: vehicle.isAvailable ? '#16A34A' : 'var(--text-muted)'
            }}>
              {vehicle.isAvailable ? 'Active' : 'Offline'}
            </span>
          </div>
        </div>
      )}

      {/* Incoming */}
      <div className="fade-up fade-up-4" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, margin: 0 }}>Incoming jobs</h2>
          <Link href="/driver/incoming" style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--orange)', textDecoration: 'none' }}>See all →</Link>
        </div>
        {loading ? (
          <div className="skel" style={{ height: 80, borderRadius: 14 }} />
        ) : error ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-body)' }}>
            Could not load data. Pull to refresh.
          </div>
        ) : incoming.length === 0 ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-body)' }}>
            {isOnline ? 'No incoming jobs right now' : 'Go online to receive jobs'}
          </div>
        ) : (
          incoming.map(job => (
            <div key={job._id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', marginBottom: 8, boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {job.pickup?.address || 'Pickup'}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  → {job.dropoff?.address || 'Dropoff'}
                </p>
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--orange)', flexShrink: 0 }}>₹{job.estimatedFare || 0}</span>
            </div>
          ))
        )}
      </div>

      {/* Recent trips */}
      <div className="fade-up fade-up-5">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, margin: 0 }}>Recent trips</h2>
          <Link href="/driver/earnings" style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--orange)', textDecoration: 'none' }}>Earnings →</Link>
        </div>
        {recentTrips.length === 0 ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-body)' }}>
            No trips yet
          </div>
        ) : (
          recentTrips.map(trip => (
            <Link key={trip._id} href={`/driver/bookings/${trip.bookingId || trip._id}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', marginBottom: 8, boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{trip.customerId?.name || 'Customer'}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0', textTransform: 'capitalize' }}>{trip.status?.replace('_', ' ') || ''}</p>
                </div>
                <ArrowRight size={16} color="var(--orange)" />
              </div>
            </Link>
          ))
        )}
      </div>

    </div>
  )
}
