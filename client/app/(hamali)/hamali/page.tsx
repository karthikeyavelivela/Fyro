'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useTransform, animate, useInView } from 'framer-motion'
import { Package, ArrowRight } from 'lucide-react'
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

export default function HamaliHomePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [earnings, setEarnings] = useState<any>({ today: 0, thisWeek: 0, thisMonth: 0, allTime: 0, todayCount: 0 })
  const [incoming, setIncoming] = useState<any[]>([])
  const [recentJobs, setRecentJobs] = useState<any[]>([])
  const [isOnline, setIsOnline] = useState(false)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    let mounted = true
    const load = async () => {
      try {
        const [me, profileRes, earningsRes, incomingRes, bookingsRes] = await Promise.allSettled([
          api.get('/api/auth/me'),
          api.get('/api/hamali/profile/mine'),
          api.get('/api/hamali/earnings'),
          api.get('/api/hamali/incoming'),
          api.get('/api/hamali/bookings'),
        ])
        if (!mounted) return

        const meUser = me.status === 'fulfilled' ? (me.value.data?.user || me.value.data?.data?.user) : null
        setUser(meUser)
        if (meUser?._id) socket.emit('join:user', { userId: meUser._id })

        const p = profileRes.status === 'fulfilled' ? (profileRes.value.data?.profile || profileRes.value.data?.data?.profile) : null
        setProfile(p)
        setIsOnline(Boolean(p?.isAvailable))

        const ed = earningsRes.status === 'fulfilled' ? (earningsRes.value.data?.earnings || earningsRes.value.data?.data?.earnings || {}) : {}
        setEarnings({
          today: Number(ed.today || 0),
          thisWeek: Number(ed.thisWeek || 0),
          thisMonth: Number(ed.thisMonth || 0),
          allTime: Number(ed.allTime || 0),
          todayCount: Number(ed.todayCount || 0),
        })

        setIncoming(
          (incomingRes.status === 'fulfilled'
            ? ensureArray<any>(incomingRes.value.data?.bookings ?? incomingRes.value.data?.data?.bookings)
            : []
          ).slice(0, 3)
        )
        setRecentJobs(
          (bookingsRes.status === 'fulfilled'
            ? ensureArray<any>(bookingsRes.value.data?.bookings ?? bookingsRes.value.data?.data?.bookings)
            : []
          ).slice(0, 4)
        )
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()

    const handleNewBooking = (b: any) => {
      const next = b?.booking || b
      if (!next?._id) return
      setIncoming(prev => prev.some(x => x._id === next._id) ? prev : [next, ...prev].slice(0, 3))
      toast('New job request')
    }
    socket.on('booking:new', handleNewBooking)
    return () => { mounted = false; socket.off('booking:new', handleNewBooking) }
  }, [])

  const toggleAvailability = async (value: boolean) => {
    setAvailabilityLoading(true)
    try {
      await api.put('/api/hamali/availability', { isAvailable: value })
      setIsOnline(value)
      setProfile((p: any) => p ? { ...p, isAvailable: value } : p)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed')
    } finally {
      setAvailabilityLoading(false)
    }
  }

  const profileComplete = profile
    ? Math.min(100, [profile.city, profile.skills?.length, profile.ratePerJob, profile.ratePerHour, profile.teamSize].filter(Boolean).length * 20)
    : 0

  return (
    <div className="fyro-page">

      {/* Teal earnings hero */}
      <div className="fyro-card-dark fade-up fade-up-1" style={{
        padding: '24px 22px', marginBottom: 14,
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #0a2622 0%, #0d3330 100%)',
        border: '1px solid rgba(13,148,136,0.18)'
      }}>
        <div style={{
          position: 'absolute', top: -50, right: -50, width: 180, height: 180,
          borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(13,148,136,0.28) 0%, transparent 70%)',
          animation: 'pulseDot 4s ease-in-out infinite'
        }} />
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.36)', fontFamily: 'var(--font-body)', margin: '0 0 6px' }}>This Month</p>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, color: 'var(--teal)', letterSpacing: '-0.025em', lineHeight: 1, margin: 0 }}>
          ₹<CountUp to={earnings.thisMonth} />
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.28)', margin: '5px 0 0' }}>
          Lifetime ₹{(earnings.allTime || 0).toLocaleString('en-IN')}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {[
            { label: 'Today', value: `₹${(earnings.today || 0).toLocaleString('en-IN')}` },
            { label: 'This Week', value: `₹${(earnings.thisWeek || 0).toLocaleString('en-IN')}` },
            { label: 'Jobs', value: String(earnings.todayCount || 0), accent: true },
          ].map(({ label, value, accent }) => (
            <div key={label}>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: accent ? 'var(--teal)' : 'rgba(255,255,255,0.85)', margin: 0 }}>{value}</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '2px 0 0' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Availability toggle */}
      <div className="fade-up fade-up-2" style={{
        background: isOnline ? 'rgba(13,148,136,0.06)' : 'var(--surface)',
        border: `1px solid ${isOnline ? 'rgba(13,148,136,0.22)' : 'var(--border)'}`,
        borderRadius: 16, padding: '16px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 14, marginBottom: 12, transition: 'all 280ms cubic-bezier(0.16,1,0.3,1)'
      }}>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: isOnline ? 'var(--teal)' : 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
            {isOnline && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)', display: 'inline-block', animation: 'pulseDot 2s ease infinite' }} />}
            {isOnline ? 'Online' : 'Offline'}
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
            {isOnline ? 'Receiving job requests' : 'Toggle to start receiving jobs'}
          </p>
        </div>
        <AvailabilityToggle isAvailable={isOnline} onChange={toggleAvailability} loading={availabilityLoading} themeColor="var(--teal)" />
      </div>

      {/* Profile completion */}
      {profileComplete < 100 && (
        <div className="fade-up fade-up-3" style={{
          background: 'rgba(217,119,6,0.07)', border: '1px solid rgba(217,119,6,0.16)',
          borderRadius: 14, padding: '14px 16px', marginBottom: 14
        }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#92400E', margin: '0 0 2px' }}>Complete your profile</p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#A16207', margin: '0 0 10px' }}>Add skills and rates to receive jobs</p>
          <div style={{ height: 5, borderRadius: 999, background: 'rgba(217,119,6,0.12)' }}>
            <div style={{ height: '100%', borderRadius: 999, background: '#D97706', width: `${profileComplete}%`, transition: 'width 1s cubic-bezier(0.16,1,0.3,1)' }} />
          </div>
        </div>
      )}

      {/* Incoming */}
      <div className="fade-up fade-up-4" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, margin: 0 }}>Incoming jobs</h2>
          <Link href="/hamali/incoming" style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--teal)', textDecoration: 'none' }}>See all →</Link>
        </div>
        {loading ? (
          <div className="skeleton" style={{ height: 80 }} />
        ) : incoming.length === 0 ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-body)' }}>
            {isOnline ? 'No incoming jobs right now' : 'Go online to receive jobs'}
          </div>
        ) : (
          incoming.map(job => (
            <div key={job._id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', marginBottom: 8, boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(13,148,136,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Package size={17} color="var(--teal)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {job.pickup?.address || 'Job location'}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0', textTransform: 'capitalize' }}>
                  {job.hamaliDetails?.type || 'General'}
                </p>
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--teal)', flexShrink: 0 }}>₹{job.estimatedFare || 0}</span>
            </div>
          ))
        )}
      </div>

      {/* Recent jobs */}
      <div className="fade-up fade-up-5">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, margin: 0 }}>Recent jobs</h2>
          <Link href="/hamali/earnings" style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--teal)', textDecoration: 'none' }}>Earnings →</Link>
        </div>
        {recentJobs.length === 0 ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-body)' }}>
            No jobs yet
          </div>
        ) : (
          recentJobs.map(job => (
            <Link key={job._id} href={`/hamali/bookings/${job.bookingId || job._id}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', marginBottom: 8, boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{job.customerId?.name || 'Customer'}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0', textTransform: 'capitalize' }}>{job.status?.replace('_', ' ') || ''}</p>
                </div>
                <ArrowRight size={16} color="var(--teal)" />
              </div>
            </Link>
          ))
        )}
      </div>

    </div>
  )
}
