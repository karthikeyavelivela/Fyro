'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { fadeUp, staggerContainer } from '@/lib/animations'
import api from '@/lib/api'
import { ensureArray } from '@/lib/ensureArray'
import toast from 'react-hot-toast'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { AlertCircle, CheckCircle, X } from 'lucide-react'

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('open')
  const [page, setPage] = useState(1)
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null)
  const [adminNote, setAdminNote] = useState('')
  const [resolving, setResolving] = useState(false)

  const fetchComplaints = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await api.get(`/api/admin/complaints?${params}`)
      setComplaints(ensureArray<any>(res.data?.complaints ?? res.data?.data?.complaints ?? res.data?.data ?? res.data))
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchComplaints() }, [page, statusFilter])

  const handleAction = async (status: 'resolved' | 'rejected') => {
    if (!selectedComplaint) return
    setResolving(true)
    try {
      await api.put(`/api/admin/complaints/${selectedComplaint._id}`, { status, adminNote })
      toast.success(`Complaint ${status}`)
      setSelectedComplaint(null)
      setAdminNote('')
      fetchComplaints()
    } catch { toast.error('Action failed') }
    finally { setResolving(false) }
  }

  const categoryColors: Record<string, string> = {
    overcharging: '#D97706',
    no_show: '#DC2626',
    behaviour: '#7C3AED',
    goods_damage: '#2563EB',
    payment_issue: '#059669',
    other: '#6B7280',
  }

  const statuses = ['all', 'open', 'under_review', 'resolved', 'rejected']

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="p-6">
      <motion.h1 variants={fadeUp} className="font-syne font-800 text-2xl mb-6" style={{ color: 'var(--text)' }}>
        Complaints
      </motion.h1>

      <motion.div variants={fadeUp} className="flex gap-2 overflow-x-auto pb-1 mb-4">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className="px-3 py-1.5 rounded-full text-sm font-500 whitespace-nowrap capitalize"
            style={{
              background: statusFilter === s ? 'var(--red)' : 'var(--surface)',
              color: statusFilter === s ? 'white' : 'var(--text-muted)',
              border: '1px solid var(--border-strong)',
            }}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="shimmer h-24 rounded-md" />)}
        </div>
      ) : complaints.length === 0 ? (
        <EmptyState title="No complaints" subtitle={`No ${statusFilter} complaints found`} />
      ) : (
        <motion.div variants={staggerContainer} className="space-y-3">
          {complaints.map((c, i) => (
            <motion.div
              key={c._id}
              variants={fadeUp}
              custom={i}
              className="rounded-md p-4 cursor-pointer transition-colors"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              onClick={() => { setSelectedComplaint(c); setAdminNote(c.adminNote || '') }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle
                    size={16}
                    style={{ color: categoryColors[c.category] || '#6B7280', flexShrink: 0 }}
                  />
                  <span className="font-500 text-sm capitalize" style={{ color: 'var(--text)' }}>
                    {c.category?.replace('_', ' ')}
                  </span>
                </div>
                <Badge status={c.status} />
              </div>
              <p className="text-sm line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                {c.description}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--text-faint)' }}>
                <span>{c.complaintId}</span>
                <span>·</span>
                <span>By: {c.raisedBy?.name || 'Unknown'}</span>
                <span>·</span>
                <span>{new Date(c.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Detail modal */}
      <Modal isOpen={!!selectedComplaint} onClose={() => setSelectedComplaint(null)} title="Complaint Detail">
        {selectedComplaint && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-500 mb-1" style={{ color: 'var(--text-muted)' }}>CATEGORY</p>
              <p className="font-500 capitalize" style={{ color: 'var(--text)' }}>
                {selectedComplaint.category?.replace('_', ' ')}
              </p>
            </div>
            <div>
              <p className="text-xs font-500 mb-1" style={{ color: 'var(--text-muted)' }}>DESCRIPTION</p>
              <p className="text-sm" style={{ color: 'var(--text)' }}>{selectedComplaint.description}</p>
            </div>
            <div>
              <p className="text-xs font-500 mb-1" style={{ color: 'var(--text-muted)' }}>RAISED BY</p>
              <p className="text-sm font-500" style={{ color: 'var(--text)' }}>
                {selectedComplaint.raisedBy?.name}
                {selectedComplaint.raisedBy?.phone && ` (${selectedComplaint.raisedBy.phone})`}
              </p>
            </div>
            {selectedComplaint.bookingId?.bookingId && (
              <div>
                <p className="text-xs font-500 mb-1" style={{ color: 'var(--text-muted)' }}>BOOKING</p>
                <p className="text-sm font-500" style={{ color: 'var(--text)' }}>
                  {selectedComplaint.bookingId.bookingId}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs font-500 mb-2" style={{ color: 'var(--text-muted)' }}>ADMIN NOTE</p>
              <textarea
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder="Add resolution note..."
                rows={3}
                className="w-full p-3 rounded-md text-sm resize-none"
                style={{
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text)',
                  fontSize: 16,
                  outline: 'none'
                }}
              />
            </div>
            {(selectedComplaint.status === 'open' || selectedComplaint.status === 'under_review') ? (
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  className="flex-1"
                  loading={resolving}
                  onClick={() => handleAction('resolved')}
                >
                  <CheckCircle size={16} className="mr-1" /> Resolve
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  loading={resolving}
                  onClick={() => handleAction('rejected')}
                >
                  <X size={16} className="mr-1" /> Reject
                </Button>
              </div>
            ) : (
              <div className="p-3 rounded-md text-center" style={{ background: 'var(--surface-raised)' }}>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Complaint is {selectedComplaint.status}
                  {selectedComplaint.resolvedAt && (
                    <> · {new Date(selectedComplaint.resolvedAt).toLocaleDateString('en-IN')}</>
                  )}
                </p>
                {selectedComplaint.adminNote && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                    Note: {selectedComplaint.adminNote}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </motion.div>
  )
}
