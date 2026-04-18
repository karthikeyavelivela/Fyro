'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeUp, staggerContainer } from '@/lib/animations'
import api from '@/lib/api'
import { getSocket } from '@/lib/socket'
import toast from 'react-hot-toast'
import BookingRequestCard from '@/components/BookingRequestCard'
import EmptyState from '@/components/ui/EmptyState'
import { useRouter } from 'next/navigation'

export default function DriverIncomingPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await api.get('/api/auth/me')
        const id = meRes.data.user?.id || meRes.data.user?._id
        setUserId(id)

        const res = await api.get('/api/driver/incoming')
        setBookings(res.data.bookings || [])
      } catch {
        // handled by interceptor
      } finally {
        setLoading(false)
      }
    }
    init()

    const socket = getSocket()
    socket.on('booking:new', (data: any) => {
      const booking = data.booking || data
      setBookings(prev => {
        if (prev.find(b => b._id === booking._id)) return prev
        return [booking, ...prev]
      })
      toast('New booking request!', { icon: '🚛', duration: 5000 })
    })

    return () => { socket.off('booking:new') }
  }, [])

  const handleAccept = async (bookingId: string) => {
    try {
      await api.put(`/api/driver/bookings/${bookingId}/accept`)
      setBookings(prev => prev.filter(b => b._id !== bookingId))
      toast.success('Booking confirmed!')
      router.push(`/driver/bookings/${bookingId}`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to accept')
    }
  }

  const handleDecline = async (bookingId: string) => {
    try {
      await api.put(`/api/driver/bookings/${bookingId}/reject`)
      setBookings(prev => prev.filter(b => b._id !== bookingId))
      toast('Booking declined', { icon: '👋' })
    } catch {
      // remove from UI anyway
      setBookings(prev => prev.filter(b => b._id !== bookingId))
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="p-4 max-w-lg mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between py-3 mb-4"
        >
          <h1 className="font-syne font-800 text-2xl" style={{ color: 'var(--text)' }}>
            Incoming Requests
          </h1>
          <span
            className="text-xs px-3 py-1 rounded-full font-500"
            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
          >
            {bookings.length} active
          </span>
        </motion.div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="shimmer h-48 rounded-md" />)}
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            title="You're all caught up"
            subtitle="No incoming booking requests right now. Stay online to receive new bookings."
          />
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            <AnimatePresence>
              {bookings.map((booking) => (
                <motion.div
                  key={booking._id}
                  layout
                  initial={{ opacity: 0, y: -60 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <BookingRequestCard
                    booking={booking}
                    onAccept={() => handleAccept(booking._id)}
                    onDecline={() => handleDecline(booking._id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  )
}
