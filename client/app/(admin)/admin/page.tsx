'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Users,
  Truck,
  IndianRupee,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Shield,
  Activity,
} from 'lucide-react'
import api from '@/lib/api'
import { fadeUp, staggerContainer, ease } from '@/lib/animations'

const STATUS_LABEL: Record<string, string> = {
  pending: 'PENDING',
  accepted: 'ACCEPTED',
  in_progress: 'IN PROGRESS',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
}

const STATUS_CLASS: Record<string, string> = {
  pending: 'badge-pending',
  accepted: 'badge-accepted',
  in_progress: 'badge-progress',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/api/admin/stats')
      .then((response) => setStats(response.data.stats || response.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <>
        <div className="admin-header">
          <div>
            <h1>Dashboard</h1>
            <div className="sub">Loading overview…</div>
          </div>
        </div>
        <div className="admin-stat-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="shimmer" style={{ height: 110, borderRadius: 16 }} />
          ))}
        </div>
        <div className="shimmer" style={{ height: 280, borderRadius: 16 }} />
      </>
    )
  }

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const statCards = [
    {
      label: 'Total users',
      value: stats?.totalUsers?.total?.toLocaleString('en-IN') ?? '0',
      icon: Users,
      color: 'var(--blue)',
    },
    {
      label: 'Bookings today',
      value: stats?.bookingsToday?.toLocaleString('en-IN') ?? '0',
      icon: Truck,
      color: 'var(--orange)',
    },
    {
      label: 'Revenue today',
      value: `Rs. ${(stats?.revenueToday ?? 0).toLocaleString('en-IN')}`,
      icon: IndianRupee,
      color: 'var(--green)',
      accent: true,
    },
    {
      label: 'Open complaints',
      value: stats?.openComplaints?.toLocaleString('en-IN') ?? '0',
      icon: AlertTriangle,
      color: 'var(--amber)',
    },
  ]

  const recent = Array.isArray(stats?.recentActivity) ? stats.recentActivity.slice(0, 6) : []
  const recentBookings = recent.filter((r: any) => r.type === 'booking')

  const roles = [
    { label: 'Customers', value: stats?.totalUsers?.customer ?? 0, color: 'var(--blue)' },
    { label: 'Drivers', value: stats?.totalUsers?.driver ?? 0, color: 'var(--orange)' },
    { label: 'Hamali', value: stats?.totalUsers?.hamali ?? 0, color: 'var(--teal)' },
  ]
  const rolesTotal = Math.max(1, roles.reduce((a, b) => a + b.value, 0))

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="admin-header">
        <div>
          <h1>Dashboard</h1>
          <div className="sub">{dateStr}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link
            href="/admin/kyc"
            className="admin-chip"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Shield size={14} /> KYC queue
            {stats?.pendingKYC ? (
              <span
                style={{
                  padding: '1px 7px',
                  borderRadius: 999,
                  background: 'var(--orange)',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {stats.pendingKYC}
              </span>
            ) : null}
          </Link>
        </div>
      </motion.div>

      <motion.div variants={staggerContainer} className="admin-stat-grid">
        {statCards.map(({ label, value, icon: Icon, color, accent }, i) => (
          <motion.div
            key={label}
            className="admin-stat"
            variants={fadeUp}
            custom={i}
            whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(15,14,12,0.1)', transition: { duration: 0.25, ease } }}
          >
            <div className="admin-stat-top">
              <div className="admin-stat-label">{label}</div>
              <div
                className="admin-stat-icon"
                style={{ background: `color-mix(in srgb, ${color} 14%, transparent)` }}
              >
                <Icon size={14} color={color} />
              </div>
            </div>
            <div
              className="admin-stat-value"
              style={{ color: accent ? 'var(--orange)' : 'var(--text)' }}
            >
              {value}
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <motion.div variants={fadeUp} className="admin-card">
          <div className="admin-card-head">
            <div className="admin-card-title">Recent bookings</div>
            <Link
              href="/admin/bookings"
              style={{ fontSize: 12, color: 'var(--orange)', fontWeight: 600, textDecoration: 'none' }}
            >
              View all <ArrowUpRight size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </Link>
          </div>
          {recentBookings.length === 0 ? (
            <div style={{ padding: '24px 4px', color: 'var(--text-muted)', fontSize: 13 }}>
              No recent bookings.
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'left' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((item: any, i: number) => {
                  const s = item.data?.status || 'pending'
                  return (
                    <tr key={i}>
                      <td className="mono" style={{ fontWeight: 600 }}>
                        {item.data?.bookingId || '—'}
                      </td>
                      <td style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {item.data?.bookingType || '—'}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {new Date(item.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td>
                        <span className={`badge ${STATUS_CLASS[s] || 'badge-pending'}`}>
                          {STATUS_LABEL[s] || s.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </motion.div>

        <motion.div variants={fadeUp} className="admin-card">
          <div className="admin-card-head">
            <div className="admin-card-title">Users by role</div>
            <Activity size={16} color="var(--text-muted)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {roles.map((r) => {
              const pct = Math.round((r.value / rolesTotal) * 100)
              return (
                <div key={r.label}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>{r.label}</span>
                    <span className="mono syne" style={{ fontWeight: 700 }}>
                      {r.value.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      background: 'var(--bg-secondary)',
                      borderRadius: 999,
                      overflow: 'hidden',
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.4, duration: 0.9, ease }}
                      style={{
                        height: '100%',
                        background: r.color,
                        borderRadius: 999,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div
            style={{
              marginTop: 18,
              padding: 12,
              background: 'var(--orange-tint)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <TrendingUp size={14} color="var(--orange)" />
            <span style={{ fontSize: 12, fontWeight: 500 }}>
              {stats?.totalUsers?.driver ?? 0} drivers active on the platform
            </span>
          </div>
        </motion.div>
      </div>

      <motion.div variants={fadeUp} className="admin-card">
        <div className="admin-card-head">
          <div className="admin-card-title">Recent activity</div>
        </div>
        {recent.length === 0 ? (
          <div style={{ padding: '16px 4px', color: 'var(--text-muted)', fontSize: 13 }}>
            No activity yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recent.map((item: any, i: number) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '12px 4px',
                  borderBottom: i < recent.length - 1 ? '1px solid var(--divider)' : 'none',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: item.type === 'booking' ? 'var(--orange)' : 'var(--red)',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>
                    {item.type === 'booking' ? 'Booking' : 'Complaint'}
                  </span>{' '}
                  <span className="mono" style={{ color: 'var(--text-muted)' }}>
                    {item.data?.bookingId || item.data?.complaintId || ''}
                  </span>
                  {item.data?.status && (
                    <span style={{ marginLeft: 10 }}>
                      <span
                        className={`badge ${STATUS_CLASS[item.data.status] || 'badge-pending'}`}
                        style={{ fontSize: 9 }}
                      >
                        {STATUS_LABEL[item.data.status] || item.data.status.toUpperCase()}
                      </span>
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {new Date(item.createdAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
