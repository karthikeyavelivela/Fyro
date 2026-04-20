'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Bell, Truck, Package, List, RefreshCcw, FileText, Gift, ArrowRight } from 'lucide-react'

const CustomerAvatar3D = dynamic(() => import('@/components/3d/CustomerAvatar3D'), { ssr: false, loading: () => <div style={{ width: '100%', height: '100%' }} /> })
const FloatingTruck3D = dynamic(() => import('@/components/3d/FloatingTruck3D'), { ssr: false, loading: () => <div style={{ width: '100%', height: '100%' }} /> })
const FloatingBoxes3D = dynamic(() => import('@/components/3d/FloatingBoxes3D'), { ssr: false, loading: () => <div style={{ width: '100%', height: '100%' }} /> })
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

function initials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
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
    const load = async () => {
      try {
        const [meRes, activeRes, recentRes] = await Promise.all([
          api.get('/api/auth/me'),
          api.get('/api/bookings/my?status=in_progress&status=accepted&limit=1').catch(() => ({ data: { bookings: [] } })),
          api.get('/api/bookings/my?limit=4').catch(() => ({ data: { bookings: [] } })),
        ])

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
        toast.error('Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    load()
    socket.on('booking:accepted', () => {
      toast.success('Your booking was accepted')
      load()
    })

    return () => {
      socket.off('booking:accepted')
    }
  }, [])

  const quickActions = [
    { icon: List, label: 'Schedule' },
    { icon: RefreshCcw, label: 'Repeat' },
    { icon: FileText, label: 'Invoices' },
    { icon: Gift, label: 'Refer' },
  ]

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      style={{ padding: '16px 20px 120px', maxWidth: 460, margin: '0 auto' }}
    >
      {/* Header */}
      <motion.div variants={fadeUp} style={{ position: 'relative', minHeight: 110 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 120 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Customer Workspace</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{greeting()},</div>
            <div className="syne" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
              {user?.name?.split(' ')[0] || 'there'}
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', top: -6, right: 0, width: 115, height: 130, pointerEvents: 'none', zIndex: 2 }}>
          <CustomerAvatar3D />
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10 }}>
          <button style={{ width: 40, height: 40, borderRadius: 12, background: '#fff', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }}>
            <Bell size={18} />
            <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', background: 'var(--orange)', border: '2px solid #fff' }} />
          </button>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', background: 'var(--orange)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-display)',
          }}>{user?.name ? initials(user.name) : 'U'}</div>
        </div>
      </motion.div>

      {/* Active booking */}
      {activeBooking && (
        <motion.div
          variants={fadeUp}
          style={{
            background: '#fff',
            borderRadius: 16,
            border: '1px solid var(--border-light)',
            padding: 16,
            marginTop: 16,
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
              <div style={{ fontWeight: 600, fontSize: 14, marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeBooking.pickup?.address || activeBooking.workLocation?.address || 'Active booking'}
              </div>
              <div className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                #{(activeBooking.bookingId || activeBooking._id).slice(-8).toUpperCase()}
              </div>
            </div>
            <button style={{ color: 'var(--orange)', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
              Track <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Book now */}
      <motion.div variants={fadeUp} className="syne" style={{ fontSize: 18, fontWeight: 700, marginTop: 24 }}>Book now</motion.div>
      <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
        <Link href="/book?type=transport" style={{ textDecoration: 'none' }}>
          <button style={{
            width: '100%', height: 120, borderRadius: 20, background: 'var(--orange)', color: '#fff',
            position: 'relative', overflow: 'hidden', textAlign: 'left', padding: '20px 22px',
            border: 'none', cursor: 'pointer'
          }}>
            <div className="syne" style={{ fontSize: 22, fontWeight: 700 }}>Book a Truck</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>Transport goods instantly</div>
            <div style={{ position: 'absolute', right: -10, top: -15, width: 160, height: 150, pointerEvents: 'none' }}>
              <FloatingTruck3D />
            </div>
            <ArrowRight size={20} color="#fff" style={{ position: 'absolute', right: 18, bottom: 18, zIndex: 2 }} />
          </button>
        </Link>
        <Link href="/book?type=hamali" style={{ textDecoration: 'none' }}>
          <button style={{
            width: '100%', height: 120, borderRadius: 20, background: 'var(--teal)', color: '#fff',
            position: 'relative', overflow: 'hidden', textAlign: 'left', padding: '20px 22px',
            border: 'none', cursor: 'pointer'
          }}>
            <div className="syne" style={{ fontSize: 22, fontWeight: 700 }}>Book Hamali</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>Loading & unloading workers</div>
            <div style={{ position: 'absolute', right: -10, top: -15, width: 160, height: 150, pointerEvents: 'none' }}>
              <FloatingBoxes3D />
            </div>
            <ArrowRight size={20} color="#fff" style={{ position: 'absolute', right: 18, bottom: 18, zIndex: 2 }} />
          </button>
        </Link>
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 20 }}>
        {quickActions.map(qa => (
          <button key={qa.label} style={{
            background: '#fff', borderRadius: 14, padding: '14px 8px',
            border: '1px solid var(--border-light)', display: 'flex',
            flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer'
          }}>
            <qa.icon size={18} color="var(--orange)" />
            <span style={{ fontSize: 11, fontWeight: 500 }}>{qa.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Recent trips */}
      <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 24 }}>
        <div className="syne" style={{ fontSize: 18, fontWeight: 700 }}>Recent trips</div>
        <Link href="/bookings" style={{ fontSize: 13, color: 'var(--orange)', fontWeight: 600, textDecoration: 'none' }}>
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
                  border: '1px solid var(--border-light)',
                  padding: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: isHamali ? 'var(--teal-light)' : 'var(--orange-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {isHamali
                    ? <Package size={18} color="var(--teal)" />
                    : <Truck size={18} color="var(--orange)" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {route}
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    #{(b.bookingId || b._id).slice(-8).toUpperCase()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="syne mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--orange)' }}>
                    ₹{b.totalFare || 0}
                  </div>
                  <div style={{ marginTop: 2 }}>
                    <Badge status={b.status} />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </motion.div>
    </motion.div>
  )
}
