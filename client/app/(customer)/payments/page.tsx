'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { fadeUp, staggerContainer } from '@/lib/animations'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'

const FILTERS = ['All', 'Paid', 'Pending', 'Refunded']
const STATUS_MAP: Record<string, string> = {
  All: '', Paid: 'paid', Pending: 'pending', Refunded: 'refunded'
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [summary, setSummary] = useState({ totalSpent: 0, totalTrips: 0 })

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const params: any = { limit: 10 }
        if (STATUS_MAP[filter]) params.paymentStatus = STATUS_MAP[filter]
        const { data } = await api.get('/api/payments/my', { params })
        const list = data?.payments || data || []
        setPayments(list)
        const paid = list.filter((p: any) => p.paymentStatus === 'paid')
        setSummary({ totalSpent: paid.reduce((s: number, p: any) => s + (p.amount || 0), 0), totalTrips: paid.length })
      } catch { toast.error('Failed to load payments') }
      finally { setLoading(false) }
    }
    fetch()
  }, [filter])

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
      <motion.h1 variants={fadeUp} custom={0} style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24, marginBottom: 20 }}>Payments</motion.h1>

      {/* Summary card */}
      <motion.div variants={fadeUp} custom={1} style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 4 }}>Total Spent (This Month)</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: 'white' }}>₹{summary.totalSpent.toFixed(0)}</div>
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 4 }}>Total Trips</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: 'white' }}>{summary.totalTrips}</div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} custom={2} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 16px', borderRadius: 999, border: '1.5px solid',
            borderColor: filter === f ? 'var(--accent)' : 'var(--border-strong)',
            background: filter === f ? 'var(--accent-light)' : 'var(--surface)',
            color: filter === f ? 'var(--accent)' : 'var(--text-muted)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0
          }}>{f}</button>
        ))}
      </motion.div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => <Skeleton key={i} height={80} style={{ borderRadius: 'var(--radius-md)' }} />)}
        </div>
      ) : payments.length === 0 ? (
        <EmptyState title="No payments found" subtitle="Your payment history will appear here" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {payments.map((p, i) => (
            <motion.div key={p._id || i} variants={fadeUp} custom={i}
              style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '16px 18px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 3 }}>
                  #{(p.bookingId?.bookingId || p.bookingId?._id || p._id).toString().slice(-8).toUpperCase()}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                  {new Date(p.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <Badge status={p.paymentStatus || 'pending'} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--accent)', marginBottom: 6 }}>₹{p.amount}</div>
                <a href="#" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }}>Receipt</a>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
