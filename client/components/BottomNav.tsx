'use client'
import Link from 'next/link'
import { Home, Plus, Clock, User, Truck, TrendingUp, Briefcase } from 'lucide-react'

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
    { label: 'Jobs', path: '/driver/incoming', icon: Truck },
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
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      height: 72, background: 'rgba(255,255,255,0.94)',
      borderTop: '1px solid var(--border)',
      paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
      display: 'flex', alignItems: 'stretch',
      backdropFilter: 'blur(18px)'
    }}>
      {tabs.slice(0, 5).map(({ label, path, icon: Icon }) => {
        const isPrimaryRoot = path === '/dashboard' || path === '/driver' || path === '/hamali' || path === '/admin'
        const isActive = activePath === path || (!isPrimaryRoot && activePath.startsWith(path))
        return (
          <Link key={path} href={path} style={{ flex: 1, textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 56, position: 'relative' }}>
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <Icon size={20} color={isActive ? activeColor : 'var(--text-faint)'} strokeWidth={isActive ? 2.2 : 1.8} />
              <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? activeColor : 'var(--text-faint)' }}>{admin && label === 'Overview' ? 'Home' : label}</span>
              {isActive && (
                <div style={{
                  position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
                  width: 22, height: 3, background: activeColor, borderRadius: 2
                }} />
              )}
            </div>
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
