'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'

interface FareDetails {
  baseFare?: number
  distanceFare?: number
  hourlyFare?: number
  floorSurcharge?: number
  heavyGoodsSurcharge?: number
  returnLoadDiscount?: number
  subtotal?: number
  gst?: number
  total?: number
}

interface CounterOffer {
  amount: number
  message?: string
}

interface Props {
  fare: FareDetails
  bookingId?: string
  counterOffer?: CounterOffer
  status?: string
  onOfferResponse?: () => void
}

export default function FareBreakdown({ fare, bookingId, counterOffer, status, onOfferResponse }: Props) {
  const [open, setOpen] = useState(false)

  const rows: [string, number | undefined][] = [
    ['Base Fare', fare.baseFare],
    ['Distance Fare', fare.distanceFare],
    ['Hourly Fare', fare.hourlyFare],
    ['Floor Surcharge', fare.floorSurcharge],
    ['Heavy Goods Surcharge', fare.heavyGoodsSurcharge],
    ['Return Load Discount', fare.returnLoadDiscount ? -fare.returnLoadDiscount : undefined],
    ['Subtotal', fare.subtotal],
    ['GST (18%)', fare.gst],
  ]

  const handleCounterAccept = async () => {
    if (!bookingId) return
    try {
      await api.put(`/api/bookings/${bookingId}/counter-offer`, { action: 'accept' })
      toast.success('Counter offer accepted')
      onOfferResponse?.()
    } catch { toast.error('Failed to accept offer') }
  }

  const handleCounterDecline = async () => {
    if (!bookingId) return
    try {
      await api.put(`/api/bookings/${bookingId}/counter-offer`, { action: 'decline' })
      toast.success('Counter offer declined')
      onOfferResponse?.()
    } catch { toast.error('Failed to decline offer') }
  }

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      {/* Toggle header */}
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text)'
      }}>
        <span>Fare Breakdown</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: 'var(--accent)' }}>
            ₹{fare.total?.toFixed(0) || '—'}
          </span>
          {open ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 14 }}>
                {rows.filter(([, v]) => v !== undefined && v !== 0).map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ color: (value ?? 0) < 0 ? 'var(--green)' : 'var(--text)', fontWeight: 500 }}>
                      {(value ?? 0) < 0 ? '-' : ''}₹{Math.abs(value ?? 0).toFixed(0)}
                    </span>
                  </div>
                ))}
                <div style={{ borderTop: '1.5px solid var(--border-strong)', marginTop: 4, paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Total</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--accent)' }}>₹{fare.total?.toFixed(0) || '—'}</span>
                </div>
              </div>

              {/* Counter offer */}
              {counterOffer && status === 'pending' && (
                <div style={{ marginTop: 18, padding: 14, background: '#FEF3C7', borderRadius: 'var(--radius-sm)', border: '1px solid #FCD34D' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#D97706', marginBottom: 6 }}>Counter Offer Received</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 14 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Original</span>
                    <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>₹{fare.total?.toFixed(0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 15 }}>
                    <span style={{ fontWeight: 600 }}>Counter Offer</span>
                    <span style={{ fontWeight: 700, color: '#D97706' }}>₹{counterOffer.amount}</span>
                  </div>
                  {counterOffer.message && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{counterOffer.message}</p>}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={handleCounterAccept} style={{ flex: 1, background: '#16A34A', color: 'white', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                      Accept
                    </button>
                    <button onClick={handleCounterDecline} style={{ flex: 1, background: 'transparent', color: '#DC2626', border: '1.5px solid #DC2626', borderRadius: 8, padding: '10px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                      Decline
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
