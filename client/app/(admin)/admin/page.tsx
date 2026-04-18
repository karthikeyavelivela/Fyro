'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { fadeUp, staggerContainer, springPop } from '@/lib/animations'
import api from '@/lib/api'
import Badge from '@/components/ui/Badge'
import { Users, BookOpen, TrendingUp, AlertCircle, FileCheck, Activity } from 'lucide-react'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/admin/stats')
      .then(r => setStats(r.data.stats || r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="shimmer h-8 w-48 rounded" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="shimmer h-28 rounded-md" />)}
        </div>
      </div>
    )
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers?.total || 0, icon: Users, color: 'var(--accent)' },
    { label: 'Bookings Today', value: stats?.bookingsToday || 0, icon: BookOpen, color: '#3B82F6' },
    { label: 'Revenue Today', value: `₹${stats?.revenueToday || 0}`, icon: TrendingUp, color: 'var(--green)' },
    { label: 'Open Complaints', value: stats?.openComplaints || 0, icon: AlertCircle, color: 'var(--red)' },
    { label: 'Pending KYC', value: stats?.pendingKYC || 0, icon: FileCheck, color: '#D97706' },
    { label: 'Active Drivers', value: stats?.totalUsers?.driver || 0, icon: Activity, color: '#0D9488' },
  ]

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="p-6">
      <motion.div variants={fadeUp} className="mb-6">
        <h1 className="font-syne font-800 text-2xl" style={{ color: 'var(--text)' }}>Admin Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </motion.div>

      <motion.div variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <motion.div
            key={label}
            variants={springPop}
            className="rounded-md p-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-500 mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
                <p className="font-syne font-800 text-2xl" style={{ color }}>{value}</p>
              </div>
              <div
                className="w-10 h-10 rounded-md flex items-center justify-center"
                style={{ background: color + '18' }}
              >
                <Icon size={20} style={{ color }} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* User breakdown */}
      {stats?.totalUsers && (
        <motion.div
          variants={fadeUp}
          className="rounded-md p-4 mb-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h3 className="font-syne font-700 text-base mb-3" style={{ color: 'var(--text)' }}>Users by Role</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { role: 'Customers', count: stats.totalUsers.customer || 0 },
              { role: 'Drivers', count: stats.totalUsers.driver || 0 },
              { role: 'Hamali', count: stats.totalUsers.hamali || 0 },
            ].map(({ role, count }) => (
              <div key={role} className="text-center p-3 rounded-sm" style={{ background: 'var(--bg)' }}>
                <p className="font-syne font-800 text-xl" style={{ color: 'var(--text)' }}>{count}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{role}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent activity */}
      {stats?.recentActivity && stats.recentActivity.length > 0 && (
        <motion.div
          variants={fadeUp}
          className="rounded-md p-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h3 className="font-syne font-700 text-base mb-3" style={{ color: 'var(--text)' }}>Recent Activity</h3>
          <div className="space-y-2">
            {stats.recentActivity.slice(0, 10).map((item: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between py-2"
                style={{ borderBottom: i < 9 ? '1px solid var(--border)' : 'none' }}
              >
                <div>
                  <p className="text-sm font-500" style={{ color: 'var(--text)' }}>
                    {item.data?.bookingId || item.data?.complaintId || (item.type === 'booking' ? 'Booking' : 'Complaint')}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(item.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {item.data?.customerId?.name && ` · ${item.data.customerId.name}`}
                  </p>
                </div>
                <Badge status={item.data?.status} />
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
