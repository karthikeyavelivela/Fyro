'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Navigation, TrendingUp, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { ensureArray } from '@/lib/ensureArray'
import { socket } from '@/lib/socket'
import AvailabilityToggle from '@/components/AvailabilityToggle'
import EarningsChart from '@/components/EarningsChart'

const ACCENT = 'var(--orange)'
const ACCENT_LIGHT = 'var(--orange-light)'
const ACCENT_BORDER = 'var(--orange-border)'
const ACCENT_DARK = 'var(--orange-dark)'

export default function DriverHomePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isAvailable, setIsAvailable] = useState(false)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [earnings, setEarnings] = useState<any>(null)
  const [activeBooking, setActiveBooking] = useState<any>(null)
  const [incoming, setIncoming] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [meResult, earningsResult, incomingResult, vehicleResult] = await Promise.allSettled([
          api.get('/api/auth/me'),
          api.get('/api/driver/earnings'),
          api.get('/api/driver/incoming'),
          api.get('/api/driver/vehicles/mine'),
        ])

        if (meResult.status === 'fulfilled') {
          setUser(meResult.value.data?.user || meResult.value.data?.data?.user || null)
        }

        if (earningsResult.status === 'fulfilled') {
          setEarnings(earningsResult.value.data?.earnings || earningsResult.value.data)
        } else {
          setEarnings({ today: 0, thisWeek: 0, todayTrips: 0, last7days: [] })
        }

        if (incomingResult.status === 'fulfilled') {
          const incomingList = ensureArray<any>(
            incomingResult.value.data?.bookings ?? incomingResult.value.data?.data?.bookings ?? incomingResult.value.data?.data ?? incomingResult.value.data
          )
          setIncoming(incomingList.slice(0, 2))
        } else {
          setIncoming([])
        }

        if (vehicleResult.status === 'fulfilled') {
          setIsAvailable(Boolean(vehicleResult.value.data?.vehicle?.isAvailable))
        } else {
          setIsAvailable(false)
        }

        try {
          const activeRes = await api.get('/api/driver/bookings?status=in_progress&limit=1')
          if (activeRes.data.bookings?.[0]) {
            setActiveBooking(activeRes.data.bookings[0])
          } else {
            const acceptedRes = await api.get('/api/driver/bookings?status=accepted&limit=1')
            setActiveBooking(acceptedRes.data.bookings?.[0] || null)
          }
        } catch {
          setActiveBooking(null)
        }
      } catch {
        toast.error('Failed to load driver dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
    socket.on('booking:new', () => toast('New booking request available'))
    return () => { socket.off('booking:new') }
  }, [])

  const toggleAvailability = async (value: boolean) => {
    setAvailabilityLoading(true)
    try {
      await api.put('/api/driver/availability', { isAvailable: value })
      setIsAvailable(value)
      toast.success(value ? 'You are now online' : 'You are now offline')
    } catch {
      toast.error('Failed to update availability')
    } finally {
      setAvailabilityLoading(false)
    }
  }

  const completeTrip = async (bookingId: string) => {
    try {
      await api.put(`/api/driver/bookings/${bookingId}/complete`)
      toast.success('Trip completed')
      setActiveBooking(null)
    } catch {
      toast.error('Failed to complete trip')
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="shimmer" style={{ height: 56, borderRadius: 14 }} />
        <div className="shimmer" style={{ height: 120, borderRadius: 20 }} />
        <div className="shimmer" style={{ height: 140, borderRadius: 16 }} />
        <div className="shimmer" style={{ height: 180, borderRadius: 16 }} />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: '16px 20px 100px', maxWidth: 560, margin: '0 auto', background: 'var(--bg)' }}
    >
      {/* Greeting + online toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Hi,</div>
          <div className="syne" style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>
            {user?.name?.split(' ')[0] || 'Driver'}
          </div>
        </div>
        <AvailabilityToggle isAvailable={isAvailable} onChange={toggleAvailability} loading={availabilityLoading} />
      </div>

      {/* Today's earnings card */}
      <div style={{
        marginTop: 18,
        padding: 24,
        background: '#fff',
        borderRadius: 20,
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Today&apos;s earnings
        </div>
        <div className="syne" style={{ fontSize: 44, fontWeight: 800, color: ACCENT, letterSpacing: '-0.02em', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
          ₹{Number(earnings?.today || 0).toLocaleString('en-IN')}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 13, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          <div><strong style={{ color: 'var(--text)' }}>{earnings?.todayTrips || 0}</strong> trips completed</div>
          <div>· <strong style={{ color: 'var(--text)' }}>{user?.rating?.toFixed(1) || '5.0'} ★</strong></div>
        </div>
      </div>

      {/* Active trip */}
      {activeBooking && (
        <div style={{
          marginTop: 14,
          padding: 16,
          background: ACCENT_LIGHT,
          borderRadius: 16,
          border: `1px solid ${ACCENT_BORDER}`
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: ACCENT_DARK }}>
            ACTIVE TRIP · {activeBooking.status.replace('_', ' ').toUpperCase()}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
              {activeBooking.customerId?.name || 'Customer'}
            </div>
            <div className="syne mono" style={{ fontWeight: 800, fontSize: 18, color: ACCENT, fontVariantNumeric: 'tabular-nums' }}>
              ₹{Number(activeBooking.totalFare || activeBooking.finalFare || activeBooking.estimatedFare || 0).toLocaleString('en-IN')}
            </div>
          </div>
          <div style={{ fontSize: 13, marginTop: 4, color: 'var(--text)' }}>
            {activeBooking.pickup?.address?.substring(0, 22) || '—'} → {activeBooking.dropoff?.address?.substring(0, 22) || '—'}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={() => window.open(`https://maps.google.com/?q=${activeBooking.pickup?.lat},${activeBooking.pickup?.lng}`, '_blank')}
              style={{
                flex: 1, height: 42, borderRadius: 999, background: '#fff',
                border: '1px solid rgba(26,25,22,0.1)', color: 'var(--text)',
                fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}
            >
              <Navigation size={14} /> Navigate
            </button>
            {activeBooking.status === 'in_progress' ? (
              <button
                onClick={() => completeTrip(activeBooking._id)}
                style={{
                  flex: 1, height: 42, borderRadius: 999, background: 'var(--green)',
                  border: 'none', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body)'
                }}
              >
                Complete Trip
              </button>
            ) : (
              <button
                onClick={() => router.push(`/driver/bookings/${activeBooking._id}`)}
                style={{
                  flex: 1, height: 42, borderRadius: 999, background: 'var(--dark)',
                  border: 'none', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body)'
                }}
              >
                View details
              </button>
            )}
          </div>
        </div>
      )}

      {/* Incoming preview */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 22 }}>
        <div className="syne" style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>Incoming requests</div>
        <Link href="/driver/incoming" style={{ fontSize: 12, color: ACCENT, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          See all {incoming.length ? `(${incoming.length})` : ''} <ArrowRight size={12} />
        </Link>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        {incoming.length === 0 && (
          <div style={{
            padding: 18, background: '#fff', borderRadius: 16,
            border: '1px solid var(--border-light)', color: 'var(--text-muted)',
            fontSize: 13, textAlign: 'center'
          }}>
            {isAvailable ? 'Waiting for new trips...' : 'Go online to receive trip requests'}
          </div>
        )}
        {incoming.map((b: any) => {
          const route = `${b.pickup?.address?.substring(0, 18) || '—'} → ${b.dropoff?.address?.substring(0, 18) || '—'}`
          return (
            <Link key={b._id} href={`/driver/incoming`} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: 12, background: '#fff', borderRadius: 16,
                border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {route}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {b.distanceKm ? `${b.distanceKm.toFixed(1)} km` : ''}{b.vehicleType ? ` · ${b.vehicleType.replace(/_/g, ' ')}` : ''}
                    </div>
                  </div>
                  <div className="syne mono" style={{ fontWeight: 800, color: ACCENT, fontSize: 17, marginLeft: 10, fontVariantNumeric: 'tabular-nums' }}>
                    ₹{Number(b.totalFare || b.estimatedFare || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Weekly chart */}
      {earnings?.last7days && (
        <div style={{
          marginTop: 18, padding: 20, background: '#fff',
          borderRadius: 16, border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div className="syne" style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>Last 7 days</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Total: ₹{Number(earnings?.thisWeek || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <Link href="/driver/earnings" style={{ color: ACCENT }}>
              <TrendingUp size={16} />
            </Link>
          </div>
          <div style={{ marginTop: 12 }}>
            <EarningsChart data={earnings.last7days} color="#FF6B2B" />
          </div>
        </div>
      )}
    </motion.div>
  )
}
