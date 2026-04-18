'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { getSocket } from '@/lib/socket'
import { fadeUp, staggerContainer } from '@/lib/animations'
import LiveTrackingMap from '@/components/LiveTrackingMap'
import StatusTimeline from '@/components/StatusTimeline'
import FareBreakdown from '@/components/FareBreakdown'
import ChatBox from '@/components/ChatBox'
import RatingStars from '@/components/RatingStars'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Skeleton from '@/components/ui/Skeleton'
import { ChevronLeft, Phone, Copy, AlertCircle } from 'lucide-react'

const COMPLAINT_CATEGORIES = ['overcharging', 'no_show', 'behaviour', 'goods_damage', 'payment_issue', 'other']

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [booking, setBooking] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [driverLocation, setDriverLocation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [ratingLoading, setRatingLoading] = useState(false)
  const [complaintOpen, setComplaintOpen] = useState(false)
  const [complaintCategory, setComplaintCategory] = useState('')
  const [complaintDesc, setComplaintDesc] = useState('')
  const [submittingComplaint, setSubmittingComplaint] = useState(false)

  const fetchBooking = useCallback(async () => {
    try {
      const [bRes, meRes] = await Promise.all([api.get(`/api/bookings/${id}`), api.get('/api/auth/me')])
      setBooking(bRes.data?.booking || bRes.data)
      setUser(meRes.data?.user || meRes.data)
    } catch { toast.error('Failed to load booking') }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => {
    fetchBooking()
    const socket = getSocket()
    socket.emit('join:booking', { bookingId: id })
    socket.on('driver:location', (loc: any) => setDriverLocation(loc))
    socket.on('booking:status_update', () => fetchBooking())
    return () => { socket.off('driver:location'); socket.off('booking:status_update') }
  }, [id, fetchBooking])

  // Razorpay payment
  const handlePay = async () => {
    setPaying(true)
    try {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      document.body.appendChild(script)
      await new Promise(res => { script.onload = res; script.onerror = res })

      const { data } = await api.post('/api/payments/create-order', { bookingId: id })
      const rzp = new (window as any).Razorpay({
        key: data.key,
        order_id: data.orderId,
        amount: data.amount * 100,
        currency: 'INR',
        name: 'FYRO',
        description: `Booking ${booking?.bookingId}`,
        handler: async (response: any) => {
          await api.post('/api/payments/verify', { bookingId: id, ...response })
          toast.success('Payment successful!')
          fetchBooking()
        }
      })
      rzp.open()
    } catch { toast.error('Payment failed') }
    finally { setPaying(false) }
  }

  const handleRate = async () => {
    if (!rating) { toast.error('Please select a rating'); return }
    setRatingLoading(true)
    try {
      await api.post(`/api/bookings/${id}/rate`, { rating, review })
      toast.success('Thank you for your feedback!')
      fetchBooking()
    } catch { toast.error('Failed to submit rating') }
    finally { setRatingLoading(false) }
  }

  const handleComplaint = async () => {
    if (!complaintCategory) { toast.error('Select a category'); return }
    if (!complaintDesc.trim()) { toast.error('Describe the issue'); return }
    setSubmittingComplaint(true)
    try {
      await api.post('/api/complaints', { bookingId: id, category: complaintCategory, description: complaintDesc })
      toast.success('Complaint raised successfully')
      setComplaintOpen(false)
      setComplaintCategory(''); setComplaintDesc('')
    } catch { toast.error('Failed to raise complaint') }
    finally { setSubmittingComplaint(false) }
  }

  const provider = booking?.driverId || booking?.hamaliId
  const isTransport = booking?.bookingType === 'transport'
  const isCompleted = ['completed', 'paid'].includes(booking?.status)
  const needsPayment = booking?.status === 'completed' && booking?.paymentStatus === 'pending'
  const alreadyRated = !!booking?.rating

  const timestamps: any = {}
  if (booking?.createdAt) timestamps.requested = booking.createdAt
  if (booking?.acceptedAt) timestamps.accepted = booking.acceptedAt
  if (booking?.startedAt) timestamps.in_progress = booking.startedAt
  if (booking?.completedAt) timestamps.completed = booking.completedAt
  if (booking?.paidAt) timestamps.paid = booking.paidAt

  if (loading) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
        <Skeleton height={280} style={{ borderRadius: 'var(--radius-md)', marginBottom: 16 }} />
        <Skeleton height={120} style={{ borderRadius: 'var(--radius-md)', marginBottom: 12 }} />
        <Skeleton height={80} style={{ borderRadius: 'var(--radius-md)' }} />
      </div>
    )
  }

  if (!booking) return <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Booking not found</div>

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" style={{ maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <motion.div variants={fadeUp} custom={0} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 0' }}>
        <button onClick={() => router.back()} style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex' }}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>#{(booking.bookingId || booking._id).slice(-8).toUpperCase()}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18 }}>
              {isTransport ? 'Truck Booking' : 'Hamali Booking'}
            </h1>
            <Badge status={booking.status} />
          </div>
        </div>
      </motion.div>

      {/* Map */}
      <motion.div variants={fadeUp} custom={1} style={{ height: '45vh', margin: '16px 0' }}>
        <LiveTrackingMap
          pickup={booking.pickup}
          dropoff={booking.dropoff}
          driverLocation={['accepted', 'in_progress'].includes(booking.status) ? driverLocation : undefined}
          bookingStatus={booking.status}
        />
      </motion.div>

      <div style={{ padding: '0 16px 120px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Status timeline */}
        <motion.div variants={fadeUp} custom={2} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '20px', border: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Status</div>
          <StatusTimeline currentStatus={booking.status} timestamps={timestamps} />
        </motion.div>

        {/* Provider info */}
        {provider && (
          <motion.div variants={fadeUp} custom={3} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
              {isTransport ? 'Your Driver' : 'Your Team'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar name={provider.userId?.name || 'Provider'} src={provider.userId?.photo} size="lg" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{provider.userId?.name || 'Provider'}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
                  {isTransport ? `${booking.vehicleType?.replace(/_/g, ' ')} · ${provider.registrationNumber || ''}` : `Team of ${provider.teamSize}`}
                </div>
                {['accepted', 'in_progress', 'completed', 'paid'].includes(booking.status) && provider.userId?.phone && (
                  <a href={`tel:${provider.userId.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--teal)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                    <Phone size={14} /> Call Provider
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Fare breakdown */}
        <motion.div variants={fadeUp} custom={4}>
          <FareBreakdown
            fare={booking.fareDetails || { total: booking.totalFare }}
            bookingId={id}
            counterOffer={booking.counterOffer}
            status={booking.status}
            onOfferResponse={fetchBooking}
          />
        </motion.div>

        {/* Pay Now */}
        {needsPayment && (
          <motion.button variants={fadeUp} custom={5} whileTap={{ scale: 0.97 }} onClick={handlePay} disabled={paying}
            style={{
              width: '100%', background: 'var(--accent)', color: 'white', border: 'none',
              borderRadius: 'var(--radius-md)', padding: '18px', fontSize: 16, fontWeight: 700,
              cursor: paying ? 'not-allowed' : 'pointer', opacity: paying ? 0.7 : 1, fontFamily: 'Outfit, sans-serif'
            }}>
            {paying ? 'Processing...' : `Pay ₹${booking.totalFare} Now`}
          </motion.button>
        )}

        {/* Rating section */}
        {isCompleted && !alreadyRated && (
          <motion.div variants={fadeUp} custom={6} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '20px', border: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Rate your experience</div>
            <RatingStars value={rating} onChange={setRating} />
            <textarea value={review} onChange={e => setReview(e.target.value)} placeholder="Tell us what you think..." rows={3}
              style={{ width: '100%', background: 'var(--surface-raised)', border: '1.5px solid var(--border-strong)', borderRadius: 10, padding: '12px', fontSize: 15, resize: 'none', outline: 'none', marginTop: 12, fontFamily: 'Outfit, sans-serif' }} />
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleRate} disabled={ratingLoading}
              style={{
                marginTop: 12, background: 'var(--accent)', color: 'white', border: 'none',
                borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 600,
                cursor: ratingLoading ? 'not-allowed' : 'pointer', fontFamily: 'Outfit, sans-serif'
              }}>
              {ratingLoading ? 'Submitting...' : 'Submit Rating'}
            </motion.button>
          </motion.div>
        )}

        {/* Chat */}
        {user && ['accepted', 'in_progress', 'completed', 'paid'].includes(booking.status) && (
          <motion.div variants={fadeUp} custom={7} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', overflow: 'hidden', minHeight: 360 }}>
            <ChatBox bookingId={id} currentUserId={user._id} currentUserRole={user.role} />
          </motion.div>
        )}

        {/* Raise complaint */}
        <motion.button variants={fadeUp} custom={8} whileTap={{ scale: 0.97 }} onClick={() => setComplaintOpen(true)}
          style={{
            width: '100%', background: 'transparent', color: '#DC2626', border: '1.5px solid #DC2626',
            borderRadius: 'var(--radius-md)', padding: '14px', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
          }}>
          <AlertCircle size={16} /> Raise a Complaint
        </motion.button>
      </div>

      {/* Complaint Modal */}
      <Modal isOpen={complaintOpen} onClose={() => setComplaintOpen(false)} title="Raise a Complaint">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Category</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COMPLAINT_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setComplaintCategory(cat)} style={{
                  padding: '7px 14px', borderRadius: 8, border: '1.5px solid',
                  borderColor: complaintCategory === cat ? '#DC2626' : 'var(--border-strong)',
                  background: complaintCategory === cat ? '#FEE2E2' : 'transparent',
                  color: complaintCategory === cat ? '#DC2626' : 'var(--text-muted)',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize' as const
                }}>{cat.replace(/_/g, ' ')}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Description</label>
            <textarea value={complaintDesc} onChange={e => setComplaintDesc(e.target.value)} rows={4} placeholder="Describe what happened..."
              style={{ width: '100%', background: 'var(--surface-raised)', border: '1.5px solid var(--border-strong)', borderRadius: 10, padding: '12px', fontSize: 15, resize: 'none', outline: 'none', fontFamily: 'Outfit, sans-serif' }} />
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleComplaint} disabled={submittingComplaint}
            style={{
              width: '100%', background: '#DC2626', color: 'white', border: 'none',
              borderRadius: 'var(--radius-md)', padding: '16px', fontSize: 15, fontWeight: 600,
              cursor: submittingComplaint ? 'not-allowed' : 'pointer', opacity: submittingComplaint ? 0.7 : 1, fontFamily: 'Outfit, sans-serif'
            }}>
            {submittingComplaint ? 'Submitting...' : 'Submit Complaint'}
          </motion.button>
        </div>
      </Modal>
    </motion.div>
  )
}
