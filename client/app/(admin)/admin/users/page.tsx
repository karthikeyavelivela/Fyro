'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { ensureArray } from '@/lib/ensureArray'
import toast from 'react-hot-toast'
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
      const params = new URLSearchParams({ page: String(page), limit: '15' })
      if (search) params.set('search', search)
      if (roleFilter !== 'all') params.set('role', roleFilter)
      if (kycFilter !== 'all') params.set('kyc', kycFilter)
      const res = await api.get(`/api/admin/users?${params}`)
      setUsers(ensureArray<any>(res.data?.users ?? res.data?.data?.users ?? res.data?.data ?? res.data))
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
  const kycPills = ['all', 'pending', 'approved']

  const roleBadge = (role: string) => {
    if (role === 'driver') return 'badge-orange'
    if (role === 'hamali') return 'badge-teal'
    if (role === 'admin') return 'badge-red'
    return 'badge-accepted'
  }

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>Users</h1>
          <div className="sub">Manage customers, drivers, hamali and admins</div>
        </div>
      </div>

      <div className="admin-filter-bar">
        <div className="admin-search">
          <Search size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone…"
          />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {rolePills.map((r) => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPage(1) }}
              className={`admin-chip${roleFilter === r ? ' active' : ''}`}
              style={{ textTransform: 'capitalize' }}
            >
              {r}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          {kycPills.map((k) => (
            <button
              key={k}
              onClick={() => { setKycFilter(k); setPage(1) }}
              className={`admin-chip${kycFilter === k ? ' active-teal' : ''}`}
              style={{ textTransform: 'capitalize' }}
            >
              KYC: {k}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="shimmer" style={{ height: 48, borderRadius: 10 }} />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>No users found</div>
            <div style={{ fontSize: 13 }}>Try adjusting your filters</div>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Name</th>
                <th>Role</th>
                <th>Phone</th>
                <th>KYC</th>
                <th>Status</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right', paddingRight: 20 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td style={{ paddingLeft: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={u.name} src={u.profilePhoto} size="sm" />
                      <span style={{ fontWeight: 500 }}>{u.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${roleBadge(u.role)}`} style={{ fontSize: 9 }}>
                      {u.role}
                    </span>
                  </td>
                  <td className="mono" style={{ color: 'var(--text-muted)' }}>
                    {u.phone}
                  </td>
                  <td>
                    {u.role === 'customer' || u.role === 'admin' ? (
                      <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>—</span>
                    ) : u.isKYCApproved ? (
                      <span className="badge badge-completed" style={{ fontSize: 9 }}>APPROVED</span>
                    ) : (
                      <span className="badge badge-pending" style={{ fontSize: 9 }}>PENDING</span>
                    )}
                  </td>
                  <td>
                    {u.isActive ? (
                      <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 500 }}>Active</span>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 500 }}>Inactive</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {new Date(u.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td style={{ paddingRight: 20 }}>
                    <div className="admin-row-actions">
                      {!u.isKYCApproved && u.role !== 'customer' && u.role !== 'admin' && (
                        <button
                          onClick={() => approveKYC(u._id)}
                          className="admin-btn-sm admin-btn-approve"
                          title="Approve KYC"
                        >
                          <CheckCircle size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                          Approve
                        </button>
                      )}
                      {u.isActive && u.role !== 'admin' && (
                        <button
                          onClick={() => deactivate(u._id)}
                          className="admin-btn-sm admin-btn-reject"
                          title="Deactivate"
                        >
                          <XCircle size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="admin-pager">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={page === p ? 'active' : ''}>
              {p}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
