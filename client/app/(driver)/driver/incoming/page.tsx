'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import { ensureArray } from '@/lib/ensureArray'
import { socket } from '@/lib/socket'
import toast from 'react-hot-toast'
import BookingRequestCard from '@/components/BookingRequestCard'
import { ArrowLeft, Package } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DriverIncomingPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        await api.get('/api/auth/me')
        const res = await api.get('/api/driver/incoming')
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
      setBookings(prev => prev.filter(b => b._id !== bookingId))
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        background: '#fff',
        borderBottom: '1px solid var(--divider)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', display: 'inline-flex' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="syne" style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
          Incoming Requests
        </h1>
        <span style={{
          marginLeft: 'auto',
          minWidth: 24,
          height: 24,
          padding: '0 8px',
          borderRadius: 999,
          background: 'var(--orange)',
          color: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 700
        }}>
          {bookings.length}
        </span>
      </div>

      <div style={{ padding: '16px 16px 40px', maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <>
            {[1, 2, 3].map(i => <div key={i} className="shimmer" style={{ height: 200, borderRadius: 20 }} />)}
          </>
        ) : bookings.length === 0 ? (
          <div style={{
            padding: 40,
            background: '#fff',
            borderRadius: 20,
            textAlign: 'center',
            border: '1px solid var(--border-light)'
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: 'var(--orange-light)',
              margin: '0 auto 14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Package size={24} color="var(--orange)" />
            </div>
            <div className="syne" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
              You&apos;re all caught up
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
              Stay online to receive new booking requests.
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {bookings.map((booking) => (
              <motion.div
                key={booking._id}
                layout
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <BookingRequestCard
                  booking={booking}
                  onAccept={() => handleAccept(booking._id)}
                  onDecline={() => handleDecline(booking._id)}
                  themeColor="var(--orange)"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
