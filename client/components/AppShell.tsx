'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import {
  Home, Plus, Clock, User, Truck, DollarSign,
  Package, BarChart2, Users, ShieldCheck,
  AlertCircle, LogOut, FileWarning, BookOpen
} from 'lucide-react'
import api from '@/lib/api'

type Role = 'customer' | 'driver' | 'hamali' | 'admin'

const NAV: Record<Role, { path: string; label: string; Icon: any }[]> = {
  customer: [
    { path: '/dashboard',  label: 'Home',       Icon: Home },
    { path: '/book',       label: 'Book',       Icon: Plus },
    { path: '/bookings',   label: 'Trips',      Icon: Clock },
    { path: '/payments',   label: 'Payments',   Icon: DollarSign },
    { path: '/complaints', label: 'Complaints', Icon: FileWarning },
    { path: '/profile',    label: 'Profile',    Icon: User },
  ],
  driver: [
    { path: '/driver',          label: 'Home',     Icon: Home },
    { path: '/driver/incoming', label: 'Jobs',     Icon: Truck },
    { path: '/driver/bookings', label: 'History',  Icon: Clock },
    { path: '/driver/earnings', label: 'Earnings', Icon: DollarSign },
    { path: '/driver/profile',  label: 'Profile',  Icon: User },
  ],
  hamali: [
    { path: '/hamali',          label: 'Home',     Icon: Home },
    { path: '/hamali/incoming', label: 'Jobs',     Icon: Package },
    { path: '/hamali/bookings', label: 'History',  Icon: Clock },
    { path: '/hamali/earnings', label: 'Earnings', Icon: DollarSign },
    { path: '/hamali/profile',  label: 'Profile',  Icon: User },
  ],
  admin: [
    { path: '/admin',            label: 'Dashboard',  Icon: BarChart2 },
    { path: '/admin/users',      label: 'Users',      Icon: Users },
    { path: '/admin/kyc',        label: 'KYC',        Icon: ShieldCheck },
    { path: '/admin/bookings',   label: 'Bookings',   Icon: BookOpen },
    { path: '/admin/complaints', label: 'Complaints', Icon: AlertCircle },
  ],
}

const ACCENT: Record<Role, 'orange' | 'teal' | 'dark'> = {
  customer: 'orange',
  driver:   'orange',
  hamali:   'teal',
  admin:    'dark',
}

interface Props {
  children: ReactNode
  role: Role
}

export default function AppShell({ children, role }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const items    = NAV[role]
  const accent   = ACCENT[role]
  const navAct   = `active-${accent}`
  const botAct   = `act-${accent}`

  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null)

  useEffect(() => {
    api.get('/api/auth/me')
      .then(res => setUser(res.data?.user || res.data?.data?.user || null))
      .catch(() => {})
  }, [])

  const isActive = (path: string) => {
    if (pathname === path) return true
    if (path === '/dashboard' || path === '/driver' || path === '/hamali' || path === '/admin') return false
    return pathname.startsWith(path + '/')
  }

  const logout = async () => {
    try { await api.post('/api/auth/logout') } catch {}
    router.push('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : role[0].toUpperCase()

  return (
    <div className="fyro-shell">

      {/* DESKTOP SIDEBAR */}
      <aside className="fyro-sidebar">
        <Link href="/" className="fyro-sidebar-logo" style={{ textDecoration: 'none' }}>
          FY<span className="dot">R</span>O
        </Link>

        <nav className="fyro-nav" aria-label={`${role} navigation`}>
          {items.map(({ path, label, Icon }) => (
            <Link
              key={path}
              href={path}
              className={`fyro-nav-link ${isActive(path) ? navAct : ''}`}
            >
              <Icon size={16} strokeWidth={2} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="fyro-sidebar-footer">
          <div className="fyro-user-row">
            <div className={`fyro-avatar ${accent}`}>{initials}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="fyro-user-name">{user?.name || role[0].toUpperCase() + role.slice(1)}</div>
              {user?.email && <div className="fyro-user-email">{user.email}</div>}
            </div>
          </div>
          <div className={`fyro-role-badge ${accent}`}>{role}</div>
          <button className="fyro-logout-btn" onClick={logout}>
            <LogOut size={14} />
            Log out
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <main className="fyro-content">

        <header className="fyro-mobile-header">
          <Link href="/" className="fyro-mobile-logo" style={{ textDecoration: 'none' }}>
            FY<span>R</span>O
          </Link>
          <div className="fyro-mobile-right">
            <div className={`fyro-role-badge ${accent}`}>{role}</div>
            <Link
              href={role === 'admin' ? '/admin' : `/${role === 'customer' ? 'profile' : `${role}/profile`}`}
              className={`fyro-avatar ${accent}`}
              style={{ width: 32, height: 32, fontSize: 12, textDecoration: 'none' }}
            >
              {initials}
            </Link>
          </div>
        </header>

        {children}
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="fyro-bottom-nav" aria-label={`${role} bottom navigation`}>
        {items.slice(0, 5).map(({ path, label, Icon }) => (
          <Link
            key={path}
            href={path}
            className={`fyro-bottom-link ${isActive(path) ? botAct : ''}`}
          >
            <Icon size={20} strokeWidth={1.8} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

    </div>
  )
}
