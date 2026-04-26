'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

import toast from 'react-hot-toast'
import api from '@/lib/api'
import { ensureArray } from '@/lib/ensureArray'
import { socket } from '@/lib/socket'
import AvailabilityToggle from '@/components/AvailabilityToggle'
import { fadeUp, stagger, springCard } from '@/lib/motion'

function SectionSkeleton() {
  return <div className="skeleton" style={{ height: 148, borderRadius: 22 }} />
}

export default function HamaliHomePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [earnings, setEarnings] = useState<any>({ today: 0, todayCount: 0, thisWeek: 0 })
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
    socket.on('booking:new', (booking: any) => {
      const next = booking?.booking || booking
      if (!next?._id) return
      setIncoming((prev) => prev.some((item) => item._id === next._id) ? prev : [next, ...prev].slice(0, 3))
      toast('New job request')
    })
    return () => {
      mounted = false
      socket.off('booking:new')
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

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="page-shell compact page-stack">
      <motion.section variants={fadeUp} custom={0} className="surface-panel panel-pad" style={{ position: 'relative' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', paddingRight: 120 }}>
          <div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Hamali Workspace</p>
            <h1 className="font-display" style={{ margin: '8px 0 0', fontSize: '2rem' }}>{user?.name?.split(' ')[0] || 'Hamali'}</h1>
          </div>
          <AvailabilityToggle isAvailable={isAvailable} onChange={toggleAvailability} loading={availabilityLoading} themeColor="var(--teal)" />
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
                <strong className="stat-number">₹{Number(earnings.today || 0).toLocaleString('en-IN')}</strong>
                <span>Earnings</span>
              </div>
              <div className="compact-stat">
                <strong className="stat-number">{earnings.todayCount || 0}</strong>
                <span>Jobs</span>
              </div>
              <div className="compact-stat">
                <strong className="stat-number">₹{Number(earnings.thisWeek || 0).toLocaleString('en-IN')}</strong>
                <span>This Week</span>
              </div>
            </div>
          </motion.section>

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

          <motion.section variants={fadeUp} custom={2} className="surface-panel panel-pad">
            <div className="section-head">
              <h2>Incoming Jobs Preview</h2>
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
                      <div style={{ fontWeight: 700 }}>{job.customerId?.name || 'Customer'}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{job.status?.replace('_', ' ') || 'pending'}</div>
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
