'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { fadeUp, staggerContainer, springPop } from '@/lib/animations'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import EmptyState from '@/components/ui/EmptyState'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import { CheckCircle, XCircle, Truck, Users } from 'lucide-react'

export default function AdminKYCPage() {
  const [pendingUsers, setPendingUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchPending = async () => {
    setLoading(true)
    try {
      const [driverRes, hamaliRes] = await Promise.all([
        api.get('/api/admin/users?role=driver&kyc=pending&limit=50'),
        api.get('/api/admin/users?role=hamali&kyc=pending&limit=50'),
      ])
      const all = [...(driverRes.data.users || []), ...(hamaliRes.data.users || [])]
      setPendingUsers(all.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()))
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPending() }, [])

  const handleApprove = async (userId: string) => {
    setActionLoading(userId)
    try {
      await api.put(`/api/admin/kyc/${userId}`, { approved: true })
      toast.success('KYC approved')
      setPendingUsers(prev => prev.filter(u => u._id !== userId))
    } catch { toast.error('Failed to approve') }
    finally { setActionLoading(null) }
  }

  const handleReject = async (userId: string) => {
    setActionLoading(userId)
    try {
      await api.put(`/api/admin/kyc/${userId}`, { approved: false, reason: rejectReason })
      toast.success('KYC rejected')
      setPendingUsers(prev => prev.filter(u => u._id !== userId))
      setRejecting(null)
      setRejectReason('')
    } catch { toast.error('Failed to reject') }
    finally { setActionLoading(null) }
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="p-6">
      <motion.div variants={fadeUp} className="mb-6">
        <h1 className="font-syne font-800 text-2xl" style={{ color: 'var(--text)' }}>KYC Verification</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {pendingUsers.length} pending verification{pendingUsers.length !== 1 ? 's' : ''}
        </p>
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="shimmer h-40 rounded-md" />)}
        </div>
      ) : pendingUsers.length === 0 ? (
        <EmptyState
          title="All clear!"
          subtitle="No pending KYC verifications. All providers are verified."
        />
      ) : (
        <motion.div variants={staggerContainer} className="space-y-4">
          {pendingUsers.map((u) => (
            <motion.div
              key={u._id}
              variants={springPop}
              className="rounded-md p-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              {/* User header */}
              <div className="flex items-center gap-3 mb-4">
                <Avatar name={u.name} size="lg" src={u.profilePhoto} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-syne font-700 text-base" style={{ color: 'var(--text)' }}>{u.name}</p>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-500 capitalize flex items-center gap-1"
                      style={{
                        background: u.role === 'driver' ? 'var(--accent-light)' : '#CCFBF1',
                        color: u.role === 'driver' ? 'var(--accent)' : '#0D9488'
                      }}
                    >
                      {u.role === 'driver' ? <Truck size={10} /> : <Users size={10} />}
                      {u.role}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {u.phone}{u.email ? ` · ${u.email}` : ''}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                    Registered{' '}
                    {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Reject reason input */}
              {rejecting === u._id && (
                <div className="mb-3">
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection..."
                    rows={2}
                    className="w-full p-3 rounded-md text-sm resize-none"
                    style={{
                      background: 'var(--surface-raised)',
                      border: '1px solid var(--border-strong)',
                      color: 'var(--text)',
                      fontSize: 16,
                      outline: 'none'
                    }}
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="danger"
                      className="flex-1"
                      loading={actionLoading === u._id}
                      onClick={() => handleReject(u._id)}
                    >
                      Confirm Reject
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => { setRejecting(null); setRejectReason('') }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {rejecting !== u._id && (
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    className="flex-1"
                    loading={actionLoading === u._id}
                    onClick={() => handleApprove(u._id)}
                  >
                    <CheckCircle size={16} className="mr-2" />
                    Approve KYC
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setRejecting(u._id)}
                  >
                    <XCircle size={16} className="mr-2" style={{ color: 'var(--red)' }} />
                    Reject
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
