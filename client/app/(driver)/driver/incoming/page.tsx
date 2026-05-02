'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'

const TrafficLight3D = dynamic(() => import('@/components/3d/TrafficLight3D'), { ssr: false, loading: () => <div style={{ width: '100%', height: '100%' }} /> })
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { ensureArray } from '@/lib/ensureArray'
import { socket } from '@/lib/socket'
import BookingRequestCard from '@/components/BookingRequestCard'
import { ArrowLeft, Package } from 'lucide-react'
import { slideInTop } from '@/lib/motion'

export default function DriverIncomingPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const mergeBookings = (incoming: any[]) => {
      setBookings((prev) => {
        const map = new Map<string, any>()
        ;[...incoming, ...prev].forEach((booking) => {
          if (booking?._id) map.set(booking._id, booking)
        })
        return Array.from(map.values()).sort((a, b) => +new Date(b.createdAt || 0) - +new Date(a.createdAt || 0))
      })
    }

    const init = async () => {
      try {
        const me = await api.get('/api/auth/me')
        const currentUser = me.data?.user || me.data?.data?.user
        if (currentUser?._id || currentUser?.id) socket.emit('join:user', { userId: currentUser._id || currentUser.id })

        const res = await api.get('/api/driver/incoming')
        if (!mounted) return
        mergeBookings(ensureArray<any>(res.data?.bookings ?? res.data?.data?.bookings ?? res.data?.data ?? res.data))
      } catch {
        // handled by interceptor
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()
    const handleNewBooking = (payload: any) => {
      const booking = payload?.booking || payload
      if (!booking?._id) return
      mergeBookings([booking])
      toast('New booking request available')
    }
    socket.on('booking:new', handleNewBooking)

    return () => {
      mounted = false
      socket.off('booking:new', handleNewBooking)
    }
  }, [])

  const removeBooking = (bookingId: string) => {
    setBookings((prev) => prev.filter((booking) => booking._id !== bookingId))
  }

  const handleAccept = async (bookingId: string) => {
    try {
      const booking = bookings.find((item) => item._id === bookingId)
      const id = booking?.bookingId || bookingId
      await api.put(`/api/driver/bookings/${id}/accept`)
      removeBooking(bookingId)
      toast.success('Booking accepted')
      router.push(`/driver/bookings/${id}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to accept booking')
    }
  }

  const handleReject = async (bookingId: string) => {
    try {
      const booking = bookings.find((item) => item._id === bookingId)
      const id = booking?.bookingId || bookingId
      await api.put(`/api/driver/bookings/${id}/reject`)
      removeBooking(bookingId)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reject booking')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 40 }}>
      <div style={{ padding: '16px 20px', background: '#fff', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => router.back()} style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', display: 'inline-flex' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display" style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text)' }}>Incoming Requests</h1>
      </div>

      <div style={{ padding: '16px 16px 40px', maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <>
            {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 20 }} />)}
          </>
        ) : bookings.length === 0 ? (
          <div style={{ padding: '32px 20px', background: '#fff', borderRadius: 20, textAlign: 'center', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 160, height: 200 }}>
              <TrafficLight3D />
            </div>
            <div className="font-display" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginTop: 14 }}>No requests right now</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, maxWidth: 240 }}>Stay online — you&apos;ll be notified instantly.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
              <div className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A', position: 'relative' }} />
              <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 500 }}>Connected</span>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {bookings.map((booking) => (
              <motion.div key={booking._id} layout variants={slideInTop} initial="hidden" animate="show">
                <BookingRequestCard booking={booking} onAccept={() => handleAccept(booking._id)} onDecline={() => handleReject(booking._id)} themeColor="var(--orange)" />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
