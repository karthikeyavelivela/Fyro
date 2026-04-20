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
    { label: 'Trips', path: '/bookings', icon: BookOpen },
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
  return pathname === href || (href !== '/dashboard' && href !== '/driver' && href !== '/hamali' && href !== '/admin' && pathname.startsWith(href))
}

export default function AppShell({
  role,
  children,
}: {
  role: Role
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const items = NAV_ITEMS[role]
  const meta = ROLE_META[role]

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link href="/" className="app-brand">
          <span className="app-brand-mark">F</span>
          <span>
            <strong>FYRO</strong>
            <small>{meta.subtitle}</small>
          </span>
        </Link>

        <div className="app-role-tag" style={{ ['--role-accent' as string]: meta.accent }}>
          <span>{meta.tag}</span>
        </div>

        <nav className="app-nav" aria-label={`${meta.tag} navigation`}>
          {items.map(({ path, label, icon: Icon }) => {
            const active = isActive(pathname, path)
            return (
              <Link
                key={path}
                href={path}
                className={active ? 'app-nav-link active' : 'app-nav-link'}
                style={{ ['--nav-accent' as string]: meta.accent }}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="app-content">
        <header className="app-topbar">
          <div>
            <p>{meta.tag} Workspace</p>
            <strong>{items.find((item) => isActive(pathname, item.path))?.label || 'Overview'}</strong>
          </div>
          <div className="app-topbar-badge">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </header>

        <main className="app-main" style={{ paddingBottom: '80px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
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
