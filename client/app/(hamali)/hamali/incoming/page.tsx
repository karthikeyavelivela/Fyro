'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeUp, staggerContainer } from '@/lib/animations'
import api from '@/lib/api'
import { ensureArray } from '@/lib/ensureArray'
import { socket } from '@/lib/socket'
import toast from 'react-hot-toast'
import BookingRequestCard from '@/components/BookingRequestCard'
import EmptyState from '@/components/ui/EmptyState'
import { useRouter } from 'next/navigation'

export default function HamaliIncomingPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.get('/api/hamali/incoming')
        setBookings(ensureArray<any>(res.data?.bookings ?? res.data?.data?.bookings ?? res.data?.data ?? res.data))
      } catch {
        // handled by interceptor
      } finally {
        setLoading(false)
      }
    }
    init()

    socket.on('booking:new', (data: any) => {
      const booking = data.booking || data
      setBookings(prev => {
        if (prev.find(b => b._id === booking._id)) return prev
        return [booking, ...prev]
      })
      toast('New job request! 👷', { icon: '👷', duration: 5000 })
    })

    return () => { socket.off('booking:new') }
  }, [])

  const handleAccept = async (bookingId: string) => {
    try {
      // bookingId here is the MongoDB _id from the booking object
      const booking = bookings.find(b => b._id === bookingId)
      const id = booking?.bookingId || bookingId
      await api.put(`/api/hamali/bookings/${id}/accept`)
      setBookings(prev => prev.filter(b => b._id !== bookingId))
      toast.success('Job confirmed!')
      router.push(`/hamali/bookings/${id}`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to accept')
    }
  }

  const handleDecline = async (bookingId: string) => {
    try {
      const booking = bookings.find(b => b._id === bookingId)
      const id = booking?.bookingId || bookingId
      await api.put(`/api/hamali/bookings/${id}/reject`)
      setBookings(prev => prev.filter(b => b._id !== bookingId))
      toast('Job declined', { icon: '👋' })
    } catch {
      setBookings(prev => prev.filter(b => b._id !== bookingId))
    }
  }

  const teal = '#0D9488'
  const tealLight = '#CCFBF1'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="page-shell compact">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between py-3 mb-4"
        >
          <h1 className="font-syne font-800 text-2xl" style={{ color: 'var(--text)' }}>
            Job Requests
          </h1>
          <span
            className="text-xs px-3 py-1 rounded-full font-500"
            style={{ background: tealLight, color: teal }}
          >
            {bookings.length} available
          </span>
        </motion.div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="shimmer h-48 rounded-md" />)}
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            title="No job requests"
            subtitle="No incoming job requests right now. Stay online to receive new jobs."
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
                  {/* Hamali details badge overlay */}
                  {booking.hamaliDetails && (
                    <div
                      className="flex gap-2 mb-1 flex-wrap"
                      style={{ paddingLeft: 4 }}
                    >
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-500 capitalize"
                        style={{ background: tealLight, color: teal }}
                      >
                        {booking.hamaliDetails.type}
                      </span>
                      {booking.hamaliDetails.estimatedHours && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-500"
                          style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                        >
                          ~{booking.hamaliDetails.estimatedHours}h
                        </span>
                      )}
                      {booking.hamaliDetails.heavyGoods && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-500"
                          style={{ background: '#FEF3C7', color: '#D97706' }}
                        >
                          Heavy goods
                        </span>
                      )}
                    </div>
                  )}
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
