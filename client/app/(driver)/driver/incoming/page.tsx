'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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
    socket.on('booking:new', (payload: any) => {
      const booking = payload?.booking || payload
      if (!booking?._id) return
      mergeBookings([booking])
      toast('New booking request available')
    })

    return () => {
      mounted = false
      socket.off('booking:new')
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
          <div style={{ padding: 40, background: '#fff', borderRadius: 20, textAlign: 'center', border: '1px solid var(--border-light)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--orange-light)', margin: '0 auto 14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={24} color="var(--orange)" />
            </div>
            <div className="font-display" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>No requests right now</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>Stay online to receive new booking requests.</p>
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
