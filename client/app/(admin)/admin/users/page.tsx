'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { fadeUp, staggerContainer } from '@/lib/animations'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import Avatar from '@/components/ui/Avatar'
import { Search, CheckCircle, XCircle } from 'lucide-react'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [kycFilter, setKycFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' })
      if (search) params.set('search', search)
      if (roleFilter !== 'all') params.set('role', roleFilter)
      if (kycFilter !== 'all') params.set('kyc', kycFilter)
      const res = await api.get(`/api/admin/users?${params}`)
      setUsers(res.data.users || [])
      setTotalPages(res.data.pages || 1)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [page, roleFilter, kycFilter])

  useEffect(() => {
    const t = setTimeout(fetchUsers, 400)
    return () => clearTimeout(t)
  }, [search])

  const approveKYC = async (userId: string) => {
    try {
      await api.put(`/api/admin/kyc/${userId}`, { approved: true })
      toast.success('KYC approved')
      fetchUsers()
    } catch { toast.error('Failed') }
  }

  const deactivate = async (userId: string) => {
    if (!confirm('Deactivate this user?')) return
    try {
      await api.put(`/api/admin/users/${userId}/deactivate`)
      toast.success('User deactivated')
      fetchUsers()
    } catch { toast.error('Failed') }
  }

  const rolePills = ['all', 'customer', 'driver', 'hamali', 'admin']

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="p-6">
      <motion.div variants={fadeUp} className="mb-6">
        <h1 className="font-syne font-800 text-2xl" style={{ color: 'var(--text)' }}>Users</h1>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} className="space-y-3 mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-9 pr-4 py-3 rounded-md text-sm font-500"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-strong)',
              color: 'var(--text)',
              fontSize: 16,
              outline: 'none'
            }}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {rolePills.map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className="px-3 py-1.5 rounded-full text-sm font-500 whitespace-nowrap capitalize transition-colors"
              style={{
                background: roleFilter === r ? 'var(--accent)' : 'var(--surface)',
                color: roleFilter === r ? 'white' : 'var(--text-muted)',
                border: '1px solid var(--border-strong)',
              }}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'approved'].map(k => (
            <button
              key={k}
              onClick={() => setKycFilter(k)}
              className="px-3 py-1.5 rounded-full text-sm font-500 capitalize transition-colors"
              style={{
                background: kycFilter === k ? '#3B82F6' : 'var(--surface)',
                color: kycFilter === k ? 'white' : 'var(--text-muted)',
                border: '1px solid var(--border-strong)',
              }}
            >
              KYC: {k}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Users list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="shimmer h-16 rounded-md" />)}
        </div>
      ) : users.length === 0 ? (
        <EmptyState title="No users found" subtitle="Try adjusting your filters" />
      ) : (
        <motion.div variants={staggerContainer} className="space-y-2">
          {users.map((u, i) => (
            <motion.div
              key={u._id}
              variants={fadeUp}
              custom={i}
              className="rounded-md p-4 flex items-center gap-3"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <Avatar name={u.name} size="md" src={u.profilePhoto} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-500 text-sm" style={{ color: 'var(--text)' }}>{u.name}</p>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full capitalize font-500"
                    style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                  >
                    {u.role}
                  </span>
                  {!u.isKYCApproved && u.role !== 'customer' && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-500"
                      style={{ background: '#FEF3C7', color: '#D97706' }}
                    >
                      KYC Pending
                    </span>
                  )}
                  {!u.isActive && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-500"
                      style={{ background: '#FEE2E2', color: 'var(--red)' }}
                    >
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {u.phone} · Joined{' '}
                  {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {!u.isKYCApproved && u.role !== 'customer' && u.role !== 'admin' && (
                  <button
                    onClick={() => approveKYC(u._id)}
                    className="p-2 rounded-md"
                    style={{ background: '#DCFCE7', color: 'var(--green)' }}
                    title="Approve KYC"
                  >
                    <CheckCircle size={16} />
                  </button>
                )}
                {u.isActive && u.role !== 'admin' && (
                  <button
                    onClick={() => deactivate(u._id)}
                    className="p-2 rounded-md"
                    style={{ background: '#FEE2E2', color: 'var(--red)' }}
                    title="Deactivate"
                  >
                    <XCircle size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className="w-9 h-9 rounded-md text-sm font-500"
              style={{
                background: page === p ? 'var(--accent)' : 'var(--surface)',
                color: page === p ? 'white' : 'var(--text-muted)',
                border: '1px solid var(--border-strong)',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}
