'use client'
import Link from 'next/link'
import { Home, Plus, Clock, User, TrendingUp, Briefcase } from 'lucide-react'

type Role = 'customer' | 'driver' | 'hamali' | 'admin'
type NavItem = { label: string; path: string; icon: any }

interface Props {
  role: Role
  activePath: string
  admin?: boolean
  items?: NavItem[]
  accent?: string
}

const TABS: Record<Role, NavItem[]> = {
  customer: [
    { label: 'Home', path: '/dashboard', icon: Home },
    { label: 'Book', path: '/book', icon: Plus },
    { label: 'Trips', path: '/bookings', icon: Clock },
    { label: 'Profile', path: '/profile', icon: User },
  ],
  driver: [
    { label: 'Home', path: '/driver', icon: Home },
    { label: 'Jobs', path: '/driver/incoming', icon: Briefcase },
    { label: 'Earnings', path: '/driver/earnings', icon: TrendingUp },
    { label: 'Profile', path: '/driver/profile', icon: User },
  ],
  hamali: [
    { label: 'Home', path: '/hamali', icon: Home },
    { label: 'Jobs', path: '/hamali/incoming', icon: Briefcase },
    { label: 'Earnings', path: '/hamali/earnings', icon: TrendingUp },
    { label: 'Profile', path: '/hamali/profile', icon: User },
  ],
  admin: [
    { label: 'Dashboard', path: '/admin', icon: Home },
    { label: 'Users', path: '/admin/users', icon: Briefcase },
    { label: 'Bookings', path: '/admin/bookings', icon: Clock },
    { label: 'Profile', path: '/admin/profile', icon: User },
  ]
}

const ACTIVE_COLORS: Record<Role, string> = {
  customer: '#FF6B2B',
  driver: '#FF6B2B',
  hamali: '#0D9488',
  admin: '#1A1916',
}

export default function BottomNav({ role, activePath, admin, items, accent }: Props) {
  const tabs = items || TABS[role]
  const activeColor = accent || ACTIVE_COLORS[role]

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '64px',
      paddingBottom: 'env(safe-area-inset-bottom)',
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      zIndex: 50
    }}>
      {tabs.slice(0, 4).map(({ label, path, icon: Icon }) => {
        const isPrimaryRoot = path === '/dashboard' || path === '/driver' || path === '/hamali' || path === '/admin'
        const isActive = activePath === path || (!isPrimaryRoot && activePath.startsWith(path))
        return (
          <Link key={path} href={path} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', color: isActive ? activeColor : 'var(--text-faint)', textDecoration: 'none', fontSize: '11px', fontFamily: 'Outfit, sans-serif', fontWeight: isActive ? 600 : 400 }}>
            <Icon size={22} />
            {admin && label === 'Dashboard' ? 'Home' : label}
          </Link>
        )
      })}
      <style jsx>{`
        @media (min-width: 981px) {
          nav {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  )
}
