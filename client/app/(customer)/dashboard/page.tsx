'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { getSocket } from '@/lib/socket'
import { fadeUp, staggerContainer } from '@/lib/animations'
import BookingCard from '@/components/BookingCard'
import Skeleton from '@/components/ui/Skeleton'
import Badge from '@/components/ui/Badge'
import { Truck, Users, ChevronRight, MapPin } from 'lucide-react'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
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
          api.get('/api/bookings/my?limit=3').catch(() => ({ data: { bookings: [] } })),
        ])
        setUser(meRes.data?.user || meRes.data)
        const ab = (activeRes.data?.bookings || activeRes.data)?.[0]
        if (ab) setActiveBooking(ab)
        setRecentBookings(recentRes.data?.bookings || recentRes.data || [])
      } catch { toast.error('Failed to load dashboard') }
      finally { setLoading(false) }
    }
    load()

    const socket = getSocket()
    socket.on('booking:accepted', () => { toast.success('Your booking was accepted!'); load() })
    socket.on('connect', () => { if (user?._id) socket.emit('join:user', user._id) })

    return () => { socket.off('booking:accepted') }
  }, [])

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>

      {/* Header */}
      <motion.div variants={fadeUp} custom={0} style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: 'var(--text-faint)', marginBottom: 4 }}>{today}</div>
        {loading ? (
          <Skeleton height={32} width={200} />
        ) : (
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24 }}>
            {greeting()}, {user?.name?.split(' ')[0] || 'there'}! 👋
          </h1>
        )}
      </motion.div>

      {/* Active booking banner */}
      {activeBooking && (
        <motion.div variants={fadeUp} custom={1}
          style={{
            background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '16px',
            border: '1px solid var(--border)', borderLeft: '4px solid var(--accent)',
            boxShadow: 'var(--shadow-md)', marginBottom: 24
          }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 4 }}>Active Booking</div>
              <Badge status={activeBooking.status} />
            </div>
            {activeBooking.status === 'in_progress' && (
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.2s infinite', display: 'inline-block' }} />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <MapPin size={14} color="var(--accent)" />
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
              {activeBooking.pickup?.address?.slice(0, 36) || activeBooking.workLocation?.address?.slice(0, 36)}…
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--accent)' }}>
              ₹{activeBooking.totalFare}
            </span>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => router.push(`/bookings/${activeBooking._id}`)}
              style={{ background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
              Track Live
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Quick Book */}
      <motion.div variants={fadeUp} custom={2} style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, marginBottom: 14 }}>Quick Book</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Truck */}
          <Link href="/book?type=transport" style={{ textDecoration: 'none' }}>
            <motion.div whileTap={{ scale: 0.98 }} whileHover={{ y: -3, boxShadow: 'var(--shadow-lg)' }}
              style={{
                background: 'linear-gradient(135deg, #FF6B2B 0%, #C94A10 100%)',
                borderRadius: 'var(--radius-md)', padding: '20px 16px', minHeight: 160,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                boxShadow: 'var(--shadow-md)', cursor: 'pointer'
              }}>
              <Truck size={28} color="white" />
              <div>
                <div style={{ color: 'white', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Book a Truck</div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 1.4 }}>Move goods across the city</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <ChevronRight size={18} color="rgba(255,255,255,0.8)" />
              </div>
            </motion.div>
          </Link>

          {/* Hamali */}
          <Link href="/book?type=hamali" style={{ textDecoration: 'none' }}>
            <motion.div whileTap={{ scale: 0.98 }} whileHover={{ y: -3, boxShadow: 'var(--shadow-lg)' }}
              style={{
                background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
                borderRadius: 'var(--radius-md)', padding: '20px 16px', minHeight: 160,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                boxShadow: 'var(--shadow-md)', cursor: 'pointer'
              }}>
              <Users size={28} color="white" />
              <div>
                <div style={{ color: 'white', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Book Hamali</div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 1.4 }}>Loading/unloading services</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <ChevronRight size={18} color="rgba(255,255,255,0.8)" />
              </div>
            </motion.div>
          </Link>
        </div>
      </motion.div>

      {/* Recent Trips */}
      <motion.div variants={fadeUp} custom={3}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18 }}>Recent Trips</h2>
          <Link href="/bookings" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            See all →
          </Link>
        </div>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => <Skeleton key={i} height={100} style={{ borderRadius: 'var(--radius-md)' }} />)}
          </div>
        ) : recentBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
            <div style={{ fontWeight: 500 }}>No trips yet</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Book your first truck or hamali service above</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentBookings.map(b => <BookingCard key={b._id} booking={b} />)}
          </div>
        )}
      </motion.div>

      <style jsx global>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </motion.div>
  )
}
