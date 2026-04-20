'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { ensureArray } from '@/lib/ensureArray'
import { socket } from '@/lib/socket'
import BookingRequestCard from '@/components/BookingRequestCard'
import EmptyState from '@/components/ui/EmptyState'
import { slideInTop } from '@/lib/motion'

export default function HamaliIncomingPage() {
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
        const res = await api.get('/api/hamali/incoming')
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
      toast('New job request')
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
      await api.put(`/api/hamali/bookings/${id}/accept`)
      removeBooking(bookingId)
      toast.success('Job accepted')
      router.push(`/hamali/bookings/${id}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to accept job')
    }
  }

  const handleReject = async (bookingId: string) => {
    try {
      const booking = bookings.find((item) => item._id === bookingId)
      const id = booking?.bookingId || bookingId
      await api.put(`/api/hamali/bookings/${id}/reject`)
      removeBooking(bookingId)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reject job')
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="page-shell compact">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between py-3 mb-4">
          <h1 className="font-display" style={{ fontWeight: 800, fontSize: 28, color: 'var(--text)' }}>Job Requests</h1>
          <span className="text-xs px-3 py-1 rounded-full font-500" style={{ background: 'var(--teal-light)', color: 'var(--teal)' }}>
            {bookings.length} available
          </span>
        </motion.div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 20 }} />)}
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState title="No job requests" subtitle="Stay online to receive new jobs." />
        ) : (
          <AnimatePresence>
            {bookings.map((booking) => (
              <motion.div key={booking._id} layout variants={slideInTop} initial="hidden" animate="show">
                <BookingRequestCard booking={booking} onAccept={() => handleAccept(booking._id)} onDecline={() => handleReject(booking._id)} themeColor="var(--teal)" />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
