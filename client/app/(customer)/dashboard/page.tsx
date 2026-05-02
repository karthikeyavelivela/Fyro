'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Bell, Truck, Package, List, RefreshCcw, FileText, Gift, ArrowRight } from 'lucide-react'

import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { socket } from '@/lib/socket'
import Skeleton from '@/components/ui/Skeleton'
import Badge from '@/components/ui/Badge'
import { fadeUp, staggerContainer } from '@/lib/animations'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}


function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : []
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [activeBooking, setActiveBooking] = useState<any>(null)
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [meRes, activeRes, recentRes] = await Promise.all([
          api.get('/api/auth/me'),
          api.get('/api/bookings/my?status=in_progress&status=accepted&limit=1').catch(() => ({ data: { bookings: [] } })),
          api.get('/api/bookings/my?limit=4').catch(() => ({ data: { bookings: [] } })),
        ])

        if (cancelled) return

        const me = meRes.data?.user || meRes.data?.data?.user || meRes.data
        const activeList = toArray<any>(
          activeRes.data?.bookings ?? activeRes.data?.data?.bookings ?? activeRes.data?.data ?? activeRes.data
        )
        const recentList = toArray<any>(
          recentRes.data?.bookings ?? recentRes.data?.data?.bookings ?? recentRes.data?.data ?? recentRes.data
        )

        setUser(me)
        setActiveBooking(activeList[0] || null)
        setRecentBookings(recentList)
      } catch {
        if (!cancelled) toast.error('Failed to load dashboard')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    
    const handleAccepted = () => {
      toast.success('Your booking was accepted')
      load()
    }
    
    socket.on('booking:accepted', handleAccepted)

    return () => {
      cancelled = true
      socket.off('booking:accepted', handleAccepted)
    }
  }, [])

  const quickActions = [
    { icon: List, label: 'Schedule', path: '/schedule' },
    { icon: RefreshCcw, label: 'Repeat', path: '/book' },
    { icon: FileText, label: 'Invoices', path: '/payments' },
    { icon: Gift, label: 'Refer', path: '/profile#refer' },
  ]

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      style={{ padding: '0', maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
      {/* Greeting */}
      <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 16, color: 'var(--text-muted)' }}>{greeting()},</div>
          <div className="syne" style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 4 }}>
            {user?.name?.split(' ')[0] || 'there'}
          </div>
        </div>
        <div style={{ padding: '4px 14px', borderRadius: '999px', background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 500 }}>
          {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </motion.div>

      {/* Book now */}
      <motion.div variants={fadeUp}>
        <div className="syne" style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Book now</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <Link href="/book?type=transport" style={{ textDecoration: 'none' }}>
            <motion.div 
              whileHover={{ y: -3, boxShadow: 'var(--shadow-md)' }}
              whileTap={{ scale: 0.98 }}
              style={{
                height: '100%', minHeight: 110, borderRadius: 20, background: '#FF6B2B', color: '#fff',
                display: 'flex', alignItems: 'center', padding: '0 24px', overflow: 'hidden'
              }}
            >
              <div style={{ flex: 1 }}>
                <div className="syne" style={{ fontSize: 22, fontWeight: 700 }}>Book a Truck</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Transport goods instantly</div>
              </div>
              <div style={{ width: 120, position: 'relative' }}>
                <svg viewBox="0 0 120 80" fill="none">
                  <rect x="0" y="15" width="75" height="45" rx="4" fill="rgba(255,255,255,0.2)" />
                  <rect x="75" y="25" width="35" height="35" rx="4" fill="rgba(255,255,255,0.3)" />
                  <rect x="100" y="28" width="8" height="20" rx="2" fill="rgba(255,255,255,0.5)" />
                  <circle cx="20" cy="63" r="10" fill="rgba(0,0,0,0.3)" />
                  <circle cx="20" cy="63" r="5" fill="rgba(255,255,255,0.4)" />
                  <circle cx="88" cy="63" r="10" fill="rgba(0,0,0,0.3)" />
                  <circle cx="88" cy="63" r="5" fill="rgba(255,255,255,0.4)" />
                  <text x="22" y="42" fill="rgba(255,255,255,0.6)" fontSize="11" fontWeight="700">FYRO</text>
                </svg>
              </div>
            </motion.div>
          </Link>
          <Link href="/book?type=hamali" style={{ textDecoration: 'none' }}>
            <motion.div 
              whileHover={{ y: -3, boxShadow: 'var(--shadow-md)' }}
              whileTap={{ scale: 0.98 }}
              style={{
                height: '100%', minHeight: 110, borderRadius: 20, background: '#0D9488', color: '#fff',
                display: 'flex', alignItems: 'center', padding: '0 24px', overflow: 'hidden'
              }}
            >
              <div style={{ flex: 1 }}>
                <div className="syne" style={{ fontSize: 22, fontWeight: 700 }}>Book Hamali</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Loading & unloading workers</div>
              </div>
              <div style={{ width: 120, position: 'relative' }}>
                <svg viewBox="0 0 120 80" fill="none">
                  <rect x="20" y="40" width="30" height="30" rx="2" fill="rgba(255,255,255,0.3)" />
                  <rect x="55" y="40" width="30" height="30" rx="2" fill="rgba(255,255,255,0.2)" />
                  <rect x="37.5" y="10" width="30" height="30" rx="2" fill="rgba(255,255,255,0.4)" />
                  <path d="M20 40 l15 -15 l30 0 l-15 15 z" fill="rgba(255,255,255,0.15)" />
                  <path d="M55 40 l15 -15 l30 0 l-15 15 z" fill="rgba(255,255,255,0.1)" />
                  <path d="M37.5 10 l15 -15 l30 0 l-15 15 z" fill="rgba(255,255,255,0.25)" />
                </svg>
              </div>
            </motion.div>
          </Link>
        </div>
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {quickActions.map(qa => (
          <Link key={qa.label} href={qa.path} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#fff', borderRadius: 16, padding: '16px 8px',
              border: '1px solid var(--border)', display: 'flex',
              flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s'
            }}>
              <qa.icon size={20} color="var(--orange)" />
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{qa.label}</span>
            </div>
          </Link>
        ))}
      </motion.div>

      {/* Active booking */}
      {activeBooking && (
        <motion.div
          variants={fadeUp}
          style={{
            background: '#fff',
            borderRadius: 16,
            border: '1px solid var(--border)',
            padding: 20,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)',
            cursor: 'pointer',
          }}
          onClick={() => router.push(`/bookings/${activeBooking._id}`)}
        >
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'var(--orange)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginLeft: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Badge status={activeBooking.status} />
              <div style={{ fontWeight: 600, fontSize: 15, marginTop: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeBooking.pickup?.address || activeBooking.workLocation?.address || 'Active booking'}
              </div>
              <div className="mono" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                #{(activeBooking.bookingId || activeBooking._id).slice(-8).toUpperCase()}
              </div>
            </div>
            <button style={{ color: 'var(--orange)', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
              Track <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Recent trips */}
      <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div className="syne" style={{ fontSize: 18, fontWeight: 700 }}>Recent trips</div>
        <Link href="/bookings" style={{ fontSize: 14, color: 'var(--orange)', fontWeight: 600, textDecoration: 'none' }}>
          See all
        </Link>
      </motion.div>

      <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        {loading ? (
          [1, 2, 3].map(i => <Skeleton key={i} height={72} style={{ borderRadius: 16 }} />)
        ) : recentBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: 14, background: '#fff', borderRadius: 16, border: '1px dashed var(--border-light)' }}>
            No recent trips yet
          </div>
        ) : (
          recentBookings.map(b => {
            const isHamali = b.bookingType === 'hamali'
            const route = isHamali
              ? (b.workLocation?.address || 'Hamali service')
              : `${b.pickup?.address?.split(',')[0] || 'Pickup'} → ${b.dropoff?.address?.split(',')[0] || 'Dropoff'}`
            return (
              <div
                key={b._id}
                onClick={() => router.push(`/bookings/${b._id}`)}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  border: '1px solid var(--border)',
                  padding: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.2s',
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: isHamali ? 'var(--teal-light)' : 'var(--orange-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {isHamali
                    ? <Package size={24} color="var(--teal)" />
                    : <Truck size={24} color="var(--orange)" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="syne" style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {route}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <div className="mono" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      #{(b.bookingId || b._id).slice(-8).toUpperCase()}
                    </div>
                    <span style={{ color: 'var(--text-faint)' }}>•</span>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {new Date(b.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <div className="syne mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--orange)' }}>
                    ₹{b.totalFare || b.estimatedFare || 0}
                  </div>
                  <Badge status={b.status} />
                </div>
              </div>
            )
          })
        )}
      </motion.div>
    </motion.div>
  )
}
