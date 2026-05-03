'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  BookOpen,
  Briefcase,
  CreditCard,
  FileWarning,
  Home,
  LayoutDashboard,
  ShieldCheck,
  Truck,
  TrendingUp,
  User,
  Users,
} from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import dynamic from 'next/dynamic'
import Avatar from '@/components/ui/Avatar'
import { useEffect, useState } from 'react'
import api from '@/lib/api'

type Role = 'customer' | 'driver' | 'hamali' | 'admin'

type NavItem = {
  label: string
  path: string
  icon: typeof Home
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
  customer: [
    { label: 'Overview', path: '/dashboard', icon: Home },
    { label: 'Book Service', path: '/book', icon: Truck },
    { label: 'My Trips', path: '/bookings', icon: BookOpen },
    { label: 'Payments', path: '/payments', icon: CreditCard },
    { label: 'Complaints', path: '/complaints', icon: FileWarning },
    { label: 'Profile', path: '/profile', icon: User },
  ],
  driver: [
    { label: 'Overview', path: '/driver', icon: Home },
    { label: 'Incoming Jobs', path: '/driver/incoming', icon: Bell },
    { label: 'Earnings', path: '/driver/earnings', icon: TrendingUp },
    { label: 'Profile', path: '/driver/profile', icon: User },
  ],
  hamali: [
    { label: 'Overview', path: '/hamali', icon: Home },
    { label: 'Incoming Jobs', path: '/hamali/incoming', icon: Briefcase },
    { label: 'Earnings', path: '/hamali/earnings', icon: TrendingUp },
    { label: 'Profile', path: '/hamali/profile', icon: User },
  ],
  admin: [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Bookings', path: '/admin/bookings', icon: BookOpen },
    { label: 'Complaints', path: '/admin/complaints', icon: FileWarning },
    { label: 'KYC', path: '/admin/kyc', icon: ShieldCheck },
  ],
}

const ROLE_META: Record<Role, { tag: string; accent: string; subtitle: string }> = {
  customer: { tag: 'Customer', accent: 'var(--accent)', subtitle: 'Logistics control center' },
  driver: { tag: 'Driver', accent: 'var(--accent)', subtitle: 'Dispatch and earnings cockpit' },
  hamali: { tag: 'Hamali', accent: 'var(--teal)', subtitle: 'Crew operations workspace' },
  admin: { tag: 'Admin', accent: 'var(--accent)', subtitle: 'Marketplace oversight' },
}

function isActive(pathname: string, href: string) {
  if (pathname === href) return true
  // Exact root paths don't use prefix matching
  if (href === '/dashboard' || href === '/driver' || href === '/hamali' || href === '/admin') return false
  // For prefix matching, require the next char to be '/' or end of string
  return pathname.startsWith(href) && (pathname.length === href.length || pathname[href.length] === '/')
}

export default function AppShell({
  role,
  children,
}: {
  role: Role
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  useEffect(() => {
    api.get('/api/auth/me').then(res => setUser(res.data?.user || res.data?.data?.user)).catch(() => {})
  }, [])
  const items = NAV_ITEMS[role]
  const meta = ROLE_META[role]

  return (
    <div className="app-shell">
      <motion.aside
        className="app-sidebar"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <Link href="/" className="app-brand">
          <span className="app-brand-mark">F</span>
          <span style={{ minWidth: 0, overflow: 'hidden' }}>
            <strong>FYRO</strong>
            <small>{meta.subtitle}</small>
          </span>
        </Link>

        <motion.div
          className="app-role-tag"
          style={{ ['--role-accent' as string]: meta.accent }}
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2, repeat: 3, ease: 'easeInOut' }}
        >
          <span>{meta.tag}</span>
        </motion.div>

        <nav className="app-nav" aria-label={`${meta.tag} navigation`}>
          {items.map(({ path, label, icon: Icon }, index) => {
            const active = isActive(pathname, path)
            return (
              <motion.div
                key={path}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={path}
                  className={active ? 'app-nav-link active' : 'app-nav-link'}
                  style={{ ['--nav-accent' as string]: meta.accent }}
                >
                  <motion.span whileHover={{ rotate: 5, scale: 1.1 }} transition={{ duration: 0.2 }}>
                    <Icon size={18} />
                  </motion.span>
                  <motion.span
                    whileHover={{ x: 3 }}
                    transition={{ duration: 0.2 }}
                    style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {label}
                  </motion.span>
                </Link>
              </motion.div>
            )
          })}
        </nav>
      </motion.aside>

      <div className="app-content">
        <header className="app-topbar" style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(242,239,233,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>{meta.tag} Workspace</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, color: 'var(--text)', lineHeight: 1.1 }}>{items.find((item) => isActive(pathname, item.path))?.label || 'Overview'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative', color: 'var(--text-muted)' }}>
              <Bell size={22} />
              <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '10px', height: '10px', background: 'var(--accent)', borderRadius: '50%', border: '2px solid var(--bg)' }}></span>
            </button>
            <Link href={role === 'admin' ? '/admin' : `/${role === 'customer' ? 'profile' : `${role}/profile`}`} style={{ textDecoration: 'none' }}>
              <Avatar name={user?.name} role={role} size="sm" />
            </Link>
          </div>
        </header>

        <div style={{ padding: '12px 32px 0' }}>
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', background: 'var(--surface)', padding: '4px 12px', borderRadius: '999px', border: '1px solid var(--border)' }}>
            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        <main className="app-main" style={{ paddingBottom: '80px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0.7, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0.7, y: -6 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <BottomNav role={role} activePath={pathname} admin={role === 'admin'} accent={meta.accent} />
    </div>
  )
}
