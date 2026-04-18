'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { fadeUp, staggerContainer } from '@/lib/animations'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => {
    api.get('/api/complaints/my').then(res => {
      setComplaints(res.data?.complaints || res.data || [])
    }).catch(() => toast.error('Failed to load complaints')).finally(() => setLoading(false))
  }, [])

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
      <motion.h1 variants={fadeUp} custom={0} style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24, marginBottom: 20 }}>Support</motion.h1>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2].map(i => <Skeleton key={i} height={90} style={{ borderRadius: 'var(--radius-md)' }} />)}
        </div>
      ) : complaints.length === 0 ? (
        <EmptyState title="No complaints" subtitle="You haven't raised any support requests yet" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {complaints.map((c, i) => (
            <motion.div key={c._id} variants={fadeUp} custom={i} whileTap={{ scale: 0.98 }} onClick={() => setSelected(c)}
              style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '16px 18px', border: '1px solid var(--border)', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'capitalize' as const }}>{c.category?.replace(/_/g, ' ')}</span>
                </div>
                <Badge status={c.status || 'open'} />
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                {c.description}
              </p>
              <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 8 }}>
                {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Complaint Detail">
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize' as const }}>{selected.category?.replace(/_/g, ' ')}</span>
              <Badge status={selected.status || 'open'} />
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>{selected.description}</p>
            {selected.adminNote && (
              <div style={{ background: 'var(--surface-raised)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Admin Response</div>
                <p style={{ fontSize: 14, color: 'var(--text)' }}>{selected.adminNote}</p>
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
              Raised on {new Date(selected.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}
