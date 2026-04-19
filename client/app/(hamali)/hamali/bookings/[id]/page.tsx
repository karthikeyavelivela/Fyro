'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { fadeUp, springPop } from '@/lib/animations'
import api from '@/lib/api'
import { socket } from '@/lib/socket'
import toast from 'react-hot-toast'
import { useParams, useRouter } from 'next/navigation'
import StatusTimeline from '@/components/StatusTimeline'
import ChatBox from '@/components/ChatBox'
import FareBreakdown from '@/components/FareBreakdown'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { ArrowLeft, Phone, MapPin, CheckCircle, Copy, Users, Clock, Layers, Weight, Package } from 'lucide-react'

const teal = '#0D9488'
const tealLight = '#CCFBF1'

export default function HamaliBookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await api.get('/api/auth/me')
        setCurrentUserId(meRes.data.user?.id || meRes.data.user?._id)
        const res = await api.get(`/api/bookings/${bookingId}`)
        setBooking(res.data.booking)
      } catch {
        // handled
      } finally {
        setLoading(false)
      }
    }
    load()

    socket.emit('join:booking', { bookingId })
    socket.on('booking:status_update', ({ status, booking: updated }: any) => {
      setBooking((prev: any) => ({ ...prev, status, ...(updated || {}) }))
    })

    return () => {
      socket.off('booking:status_update')
    }
  }, [bookingId])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied!')
  }

  const handleAction = async (action: 'start' | 'complete') => {
    setActionLoading(true)
    try {
      await api.put(`/api/hamali/bookings/${bookingId}/${action}`)
      toast.success(action === 'start' ? 'Job started!' : 'Job completed!')
      const res = await api.get(`/api/bookings/${bookingId}`)
      setBooking(res.data.booking)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="shimmer h-8 w-32 rounded" />
        <div className="shimmer h-32 rounded-md" />
        <div className="shimmer h-48 rounded-md" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="p-4 text-center" style={{ color: 'var(--text-muted)' }}>
        Booking not found
      </div>
    )
  }

  const customer = booking.customerId
  const hd = booking.hamaliDetails

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-8"
      style={{ background: 'var(--bg)' }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full"
          style={{ background: 'var(--surface-raised)' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-xs font-500" style={{ color: 'var(--text-muted)' }}>{booking.bookingId}</p>
          <Badge status={booking.status} />
        </div>
      </div>

      <div className="page-shell compact page-stack">
        {/* Customer info — shown after acceptance */}
        {(booking.status === 'accepted' || booking.status === 'in_progress' || booking.status === 'completed') && (
          <motion.div
            variants={springPop}
            initial="hidden"
            animate="show"
            className="rounded-md p-4 flex items-center gap-3"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <Avatar name={customer?.name || 'C'} size="lg" />
            <div className="flex-1">
              <p className="font-syne font-700 text-base" style={{ color: 'var(--text)' }}>
                {customer?.name}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Customer</p>
              {customer?.phone && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{customer.phone}</p>
              )}
            </div>
            {customer?.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="flex items-center justify-center w-10 h-10 rounded-full"
                style={{ background: tealLight, color: teal }}
              >
                <Phone size={18} />
              </a>
            )}
          </motion.div>
        )}

        {/* Pickup address */}
        <motion.div
          variants={fadeUp}
          className="rounded-md p-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: tealLight }}
            >
              <MapPin size={14} style={{ color: teal }} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-500 mb-1" style={{ color: 'var(--text-muted)' }}>PICKUP LOCATION</p>
              <p className="font-500 text-sm" style={{ color: 'var(--text)' }}>{booking.pickup?.address}</p>
            </div>
            <button onClick={() => copyToClipboard(booking.pickup?.address || '')} className="p-1">
              <Copy size={14} style={{ color: 'var(--text-faint)' }} />
            </button>
          </div>
        </motion.div>

        {/* Hamali details */}
        {hd && (
          <motion.div
            variants={fadeUp}
            className="rounded-md p-4 space-y-3"
            style={{ background: tealLight, border: `1px solid ${teal}` }}
          >
            <h3 className="font-syne font-700 text-sm" style={{ color: teal }}>JOB DETAILS</h3>
            <div className="grid grid-cols-2 gap-3">
              {hd.type && (
                <div className="flex items-center gap-2">
                  <Package size={14} style={{ color: teal }} />
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Job Type</p>
                    <p className="font-500 text-sm capitalize" style={{ color: 'var(--text)' }}>{hd.type}</p>
                  </div>
                </div>
              )}
              {hd.estimatedHours != null && (
                <div className="flex items-center gap-2">
                  <Clock size={14} style={{ color: teal }} />
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Est. Hours</p>
                    <p className="font-500 text-sm" style={{ color: 'var(--text)' }}>{hd.estimatedHours}h</p>
                  </div>
                </div>
              )}
              {hd.teamSize != null && (
                <div className="flex items-center gap-2">
                  <Users size={14} style={{ color: teal }} />
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Team Size</p>
                    <p className="font-500 text-sm" style={{ color: 'var(--text)' }}>{hd.teamSize} person{hd.teamSize > 1 ? 's' : ''}</p>
                  </div>
                </div>
              )}
              {hd.floorNumber != null && hd.floorNumber > 0 && (
                <div className="flex items-center gap-2">
                  <Layers size={14} style={{ color: teal }} />
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Floor</p>
                    <p className="font-500 text-sm" style={{ color: 'var(--text)' }}>Floor {hd.floorNumber}</p>
                  </div>
                </div>
              )}
            </div>
            {hd.goodsDescription && (
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--text-faint)' }}>Goods Description</p>
                <p className="text-sm" style={{ color: 'var(--text)' }}>{hd.goodsDescription}</p>
              </div>
            )}
            {hd.heavyGoods && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-md"
                style={{ background: '#FEF3C7' }}
              >
                <Weight size={14} style={{ color: '#D97706' }} />
                <span className="text-xs font-500" style={{ color: '#D97706' }}>Heavy goods — extra care required</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Fare */}
        <div
          className="rounded-md p-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs font-500 mb-1" style={{ color: 'var(--text-muted)' }}>FARE</p>
          <p className="font-syne font-800 text-3xl" style={{ color: teal }}>
            ₹{booking.finalFare || booking.estimatedFare}
          </p>
          <FareBreakdown fare={booking.fareBreakdown || {}} bookingId={booking._id} status={booking.status} />
        </div>

        {/* Status timeline */}
        <StatusTimeline currentStatus={booking.status} timestamps={{ accepted: booking.acceptedAt, in_progress: booking.startedAt, completed: booking.completedAt, paid: booking.paidAt }} />

        {/* Action buttons */}
        {booking.status === 'accepted' && (
          <Button
            variant="primary"
            className="w-full"
            loading={actionLoading}
            onClick={() => handleAction('start')}
            style={{ background: teal }}
          >
            Start Job
          </Button>
        )}
        {booking.status === 'in_progress' && (
          <Button
            variant="primary"
            className="w-full"
            loading={actionLoading}
            onClick={() => handleAction('complete')}
            style={{ background: 'var(--green)' }}
          >
            <CheckCircle size={18} className="mr-2" />
            Complete Job
          </Button>
        )}

        {/* Chat */}
        {(booking.status === 'accepted' || booking.status === 'in_progress') && currentUserId && (
          <div
            className="rounded-md overflow-hidden"
            style={{ border: '1px solid var(--border)' }}
          >
            <div
              className="p-3"
              style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
            >
              <p className="font-syne font-700 text-sm" style={{ color: 'var(--text)' }}>
                Messages with {customer?.name}
              </p>
            </div>
            <ChatBox bookingId={bookingId} currentUserId={currentUserId} currentUserRole="hamali" />
          </div>
        )}
      </div>
    </motion.div>
  )
}
