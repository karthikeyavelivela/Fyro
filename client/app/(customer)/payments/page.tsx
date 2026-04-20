'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'

const CreditCard3D = dynamic(() => import('@/components/3d/CreditCard3D'), { ssr: false, loading: () => <div style={{ width: '100%', height: '100%' }} /> })
import toast from 'react-hot-toast'
import api from '@/lib/api'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import { fadeUp, staggerContainer } from '@/lib/animations'
import { ArrowDown, ArrowUp, CreditCard, Download, Receipt, Wallet as WalletIcon, Plus, Send } from 'lucide-react'

const FILTERS = ['All', 'Paid', 'Pending', 'Refunded']
const STATUS_MAP: Record<string, string> = {
  All: '',
  Paid: 'paid',
  Pending: 'pending',
  Refunded: 'refunded',
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  paid: { bg: 'rgba(22,163,74,0.12)', color: 'var(--green)' },
  pending: { bg: 'rgba(217,119,6,0.12)', color: 'var(--amber)' },
  refunded: { bg: 'rgba(37,99,235,0.12)', color: 'var(--blue)' },
  failed: { bg: 'rgba(220,38,38,0.12)', color: 'var(--red)' },
}

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : []
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [summary, setSummary] = useState({ totalSpent: 0, totalTrips: 0 })

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true)
      try {
        const params: any = { limit: 20 }
        if (STATUS_MAP[filter]) params.paymentStatus = STATUS_MAP[filter]
        const { data } = await api.get('/api/payments/my', { params })
        const list = toArray<any>(
          data?.payments ?? data?.data?.payments ?? data?.data ?? data
        )
        setPayments(list)
        const paid = list.filter((p: any) => p.paymentStatus === 'paid')
        setSummary({
          totalSpent: paid.reduce((s: number, p: any) => s + (p.amount || 0), 0),
          totalTrips: paid.length,
        })
      } catch {
        toast.error('Failed to load payments')
      } finally {
        setLoading(false)
      }
    }
    fetchPayments()
  }, [filter])

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="page-shell narrow"
      style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}
    >
      {/* Header */}
      <motion.div variants={fadeUp} style={{ position: 'relative' }}>
        <h1 className="syne" style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
          Payments
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          Transactions, invoices, and wallet balance
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 220, height: 150 }}>
            <CreditCard3D />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, fontFamily: 'var(--font-body, Outfit)' }}>
            Secure payments powered by Razorpay
          </p>
        </div>
      </motion.div>

      {/* Wallet balance card - dark */}
      <motion.div
        variants={fadeUp}
        style={{
          background: 'linear-gradient(135deg, #1A1916, #2C2A26)',
          color: '#fff',
          borderRadius: 24,
          padding: 24,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', top: -50, right: -50, width: 200, height: 200,
          background: 'radial-gradient(circle, rgba(255,107,43,0.25), transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase' }}>
              Total spent
            </div>
            <div className="syne mono" style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 800, marginTop: 4, letterSpacing: '-0.02em' }}>
              ₹{summary.totalSpent.toLocaleString('en-IN')}
              <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)' }}>.00</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
              {summary.totalTrips} paid trip{summary.totalTrips !== 1 ? 's' : ''}
            </div>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(255,107,43,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <WalletIcon size={20} color="#FF6B2B" strokeWidth={1.8} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20, position: 'relative' }}>
          <button
            style={{
              flex: 1, height: 42, borderRadius: 999,
              background: 'var(--orange)', color: '#fff', border: 'none',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
            onClick={() => toast('Coming soon')}
          >
            <Plus size={14} /> Add money
          </button>
          <button
            style={{
              flex: 1, height: 42, borderRadius: 999,
              background: 'transparent', color: '#fff',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
            onClick={() => toast('Coming soon')}
          >
            <Send size={14} /> Statement
          </button>
        </div>
      </motion.div>

      {/* Filter chips */}
      <motion.div variants={fadeUp} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {FILTERS.map((opt) => {
          const active = filter === opt
          return (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                border: active ? '1.5px solid var(--orange)' : '1px solid var(--border-light)',
                background: active ? 'var(--orange-tint)' : '#fff',
                color: active ? 'var(--orange-dark)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {opt}
            </button>
          )
        })}
      </motion.div>

      {/* Transactions list */}
      <motion.div variants={fadeUp}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div className="syne" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Transactions</div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{payments.length} total</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} height={76} style={{ borderRadius: 16 }} />)}
          </div>
        ) : payments.length === 0 ? (
          <EmptyState title="No payments yet" subtitle="Your payment history will appear here" />
        ) : (
          <div style={{
            background: 'var(--surface)',
            borderRadius: 16,
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}>
            {payments.map((p, i) => {
              const status = (p.paymentStatus || 'pending').toLowerCase()
              const style = STATUS_STYLES[status] || STATUS_STYLES.pending
              const isIn = status === 'refunded'
              const bookingCode = (p.bookingId?.bookingId || p.bookingId?._id || p._id || '').toString().slice(-8).toUpperCase()
              return (
                <motion.div
                  key={p._id || i}
                  variants={fadeUp}
                  custom={i}
                  style={{
                    padding: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    borderBottom: i < payments.length - 1 ? '1px solid var(--divider)' : 'none',
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: isIn ? 'rgba(22,163,74,0.1)' : 'var(--orange-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {isIn ? (
                      <ArrowDown size={16} color="var(--green)" />
                    ) : (
                      <ArrowUp size={16} color="var(--orange)" />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="mono" style={{ fontWeight: 600, fontSize: 14 }}>FY-{bookingCode}</span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        background: style.bg,
                        color: style.color,
                      }}>
                        {status}
                      </span>
                    </div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {new Date(p.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {p.paymentMethod && ` · ${p.paymentMethod.toUpperCase()}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div
                      className="syne mono"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 800,
                        fontSize: 16,
                        color: isIn ? 'var(--green)' : 'var(--text)',
                      }}
                    >
                      {isIn ? '+' : ''}₹{(p.amount || 0).toLocaleString('en-IN')}
                    </div>
                    <button
                      onClick={() => toast('Receipt coming soon')}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        background: 'none', border: 'none',
                        fontSize: 11, color: 'var(--orange)',
                        fontWeight: 600, cursor: 'pointer', padding: 0, marginTop: 2,
                      }}
                    >
                      <Receipt size={11} /> Receipt
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { icon: CreditCard, label: 'Methods' },
          { icon: Receipt, label: 'Invoices' },
          { icon: Download, label: 'Statement' },
        ].map(({ icon: Ic, label }) => (
          <button
            key={label}
            onClick={() => toast('Coming soon')}
            style={{
              background: '#fff',
              border: '1px solid var(--border-light)',
              borderRadius: 14,
              padding: '14px 6px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Ic size={18} color="var(--orange)" />
            <span style={{ fontSize: 12, fontWeight: 500 }}>{label}</span>
          </button>
        ))}
      </motion.div>
    </motion.div>
  )
}
