'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useTransform, animate, useInView } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

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

export default function HamaliHomePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [earnings, setEarnings] = useState<any>({ today: 0, todayCount: 0, thisWeek: 0, thisMonth: 0, allTime: 0 })
  const [incoming, setIncoming] = useState<any[]>([])
  const [recentJobs, setRecentJobs] = useState<any[]>([])
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
        const [me, profileRes, earningsRes, incomingRes, bookingsRes] = await Promise.allSettled([
          api.get('/api/auth/me'),
          api.get('/api/hamali/profile/mine'),
          api.get('/api/hamali/earnings'),
          api.get('/api/hamali/incoming'),
          api.get('/api/hamali/bookings'),
        ])

        if (!mounted) return

        const meUser = me.status === 'fulfilled' ? (me.value.data?.user || me.value.data?.data?.user || null) : null
        setUser(meUser)
        if (meUser?._id || meUser?.id) socket.emit('join:user', { userId: meUser._id || meUser.id })

        const profileData = profileRes.status === 'fulfilled'
          ? (profileRes.value.data?.profile || profileRes.value.data?.data?.profile || null)
          : null
        setProfile(profileData)
        setIsAvailable(Boolean(profileData?.isAvailable))

        const earningsData = earningsRes.status === 'fulfilled'
          ? (earningsRes.value.data?.earnings || earningsRes.value.data?.data?.earnings || {})
          : {}
        setEarnings({
          today: Number(earningsData.today || 0),
          todayCount: Number(earningsData.todayCount || 0),
          thisWeek: Number(earningsData.thisWeek || 0),
          thisMonth: Number(earningsData.thisMonth || earningsData.month || 0),
          allTime: Number(earningsData.allTime || earningsData.total || 0),
        })

        const incomingList = incomingRes.status === 'fulfilled'
          ? ensureArray<any>(incomingRes.value.data?.bookings ?? incomingRes.value.data?.data?.bookings ?? incomingRes.value.data?.data ?? incomingRes.value.data)
          : []
        setIncoming(incomingList.slice(0, 3))

        const bookingList = bookingsRes.status === 'fulfilled'
          ? ensureArray<any>(bookingsRes.value.data?.bookings ?? bookingsRes.value.data?.data?.bookings ?? bookingsRes.value.data?.data ?? bookingsRes.value.data)
          : []
        setRecentJobs(bookingList.slice(0, 4))
      } catch {
        if (mounted) setError('Unable to load hamali dashboard right now.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    const handleNewBooking = (booking: any) => {
      const next = booking?.booking || booking
      if (!next?._id) return
      setIncoming((prev) => prev.some((item) => item._id === next._id) ? prev : [next, ...prev].slice(0, 3))
      toast('New job request')
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
      await api.put('/api/hamali/availability', { isAvailable: value })
      setIsAvailable(value)
      setProfile((prev: any) => prev ? { ...prev, isAvailable: value } : prev)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update availability')
    } finally {
      setAvailabilityLoading(false)
    }
  }

  const profileComplete = profile
    ? Math.min(100, [profile.city, profile.skills?.length, profile.ratePerJob, profile.ratePerHour, profile.teamSize].filter(Boolean).length * 20)
    : 0

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="page-shell compact page-stack">

      {/* Teal earnings hero card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: 'linear-gradient(135deg, #0a2622 0%, #0d3330 100%)',
          borderRadius: 20, padding: '28px 28px 24px',
          border: '1px solid rgba(13,148,136,0.18)',
          position: 'relative', overflow: 'hidden'
        }}
      >
        <motion.div
          style={{
            position: 'absolute', top: -50, right: -50, width: 180, height: 180,
            borderRadius: '50%', pointerEvents: 'none',
            background: 'radial-gradient(circle, rgba(13,148,136,0.3) 0%, transparent 70%)'
          }}
          animate={{ scale: [1, 1.25, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', fontFamily: 'Outfit', marginBottom: 6 }}>THIS MONTH</div>
        <div style={{ fontSize: 44, fontWeight: 800, color: '#0D9488', fontFamily: 'Syne', lineHeight: 1.05, letterSpacing: '-0.02em' }}>
          ₹<CountUp to={earnings.thisMonth} />
        </div>
        <div style={{ color: 'rgba(255,255,255,0.28)', fontFamily: 'Outfit', fontSize: 13, marginTop: 4 }}>
          Lifetime: ₹{(earnings.allTime || 0).toLocaleString('en-IN')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {[
            { label: 'Today', value: `₹${(earnings.today || 0).toLocaleString('en-IN')}`, teal: false },
            { label: 'This Week', value: `₹${(earnings.thisWeek || 0).toLocaleString('en-IN')}`, teal: false },
            { label: 'Jobs', value: String(earnings.todayCount || 0), teal: true }
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.1 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: item.teal ? '#0D9488' : 'rgba(255,255,255,0.88)', fontFamily: 'Syne' }}>{item.value}</div>
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
            {isAvailable ? 'Receiving job requests' : 'Go online to receive jobs'}
          </div>
        </div>
        <AvailabilityToggle isAvailable={isAvailable} onChange={toggleAvailability} loading={availabilityLoading} themeColor="var(--teal)" />
      </motion.div>

      {loading ? (
        <>
          <SectionSkeleton />
          <SectionSkeleton />
        </>
      ) : (
        <>
          {/* Profile completion */}
          {profileComplete < 100 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.2)',
                borderRadius: 14, padding: '14px 16px'
              }}
            >
              <div style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 14, color: '#B45309' }}>Complete your profile</div>
              <div style={{ fontFamily: 'Outfit', fontSize: 13, color: '#92400E', marginTop: 2 }}>Add skills and rates to start receiving jobs</div>
              <div style={{ marginTop: 10, height: 4, borderRadius: 4, background: 'rgba(217,119,6,0.15)' }}>
                <motion.div
                  style={{ height: '100%', borderRadius: 4, background: '#D97706' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${profileComplete}%` }}
                  transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </motion.div>
          )}

          {/* Profile summary */}
          <motion.section variants={springCard} className="surface-panel panel-pad">
            <div className="section-head">
              <h2>Profile Summary</h2>
            </div>
            {profile ? (
              <div className="page-stack" style={{ gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 18 }}>Team of {profile.teamSize || 1}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Rate per job: ₹{Number(profile.ratePerJob || 0).toLocaleString('en-IN')}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Skills: {ensureArray<string>(profile.skills).join(', ') || 'Not added yet'}</div>
              </div>
            ) : (
              <div className="page-stack" style={{ gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 18 }}>Complete your profile to receive jobs</div>
                <Link href="/hamali/profile" className="muted-link" style={{ color: 'var(--teal)' }}>Go to profile</Link>
              </div>
            )}
          </motion.section>

          {/* Incoming jobs */}
          <motion.section variants={fadeUp} custom={2} className="surface-panel panel-pad">
            <div className="section-head">
              <h2>Incoming Jobs</h2>
              <Link href="/hamali/incoming" className="muted-link" style={{ color: 'var(--teal)' }}>See all</Link>
            </div>
            {incoming.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>{isAvailable ? 'No incoming jobs right now.' : 'Go online to start receiving jobs.'}</div>
            ) : (
              <div className="page-stack" style={{ gap: 12 }}>
                {incoming.map((job) => (
                  <div key={job._id} style={{ padding: 16, borderRadius: 18, border: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                    <div style={{ fontWeight: 700 }}>{job.pickup?.address || 'Pickup pending'}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{job.hamaliDetails?.type || 'General job'}</div>
                  </div>
                ))}
              </div>
            )}
          </motion.section>

          {/* Recent jobs */}
          <motion.section variants={fadeUp} custom={3} className="surface-panel panel-pad">
            <div className="section-head">
              <h2>Recent Jobs</h2>
              <Link href="/hamali/earnings" className="muted-link" style={{ color: 'var(--teal)' }}>Earnings</Link>
            </div>
            {recentJobs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>No jobs yet.</div>
            ) : (
              <div className="page-stack" style={{ gap: 12 }}>
                {recentJobs.map((job) => (
                  <Link key={job._id} href={`/hamali/bookings/${job.bookingId || job._id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ padding: 16, borderRadius: 18, border: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{job.customerId?.name || 'Customer'}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{job.status?.replace('_', ' ') || 'pending'}</div>
                        </div>
                        <ArrowRight size={18} color="var(--teal)" />
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
