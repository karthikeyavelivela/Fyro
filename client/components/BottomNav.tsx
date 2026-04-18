'use client'
import Link from 'next/link'
import { Home, Plus, Clock, User, Truck, TrendingUp, Briefcase } from 'lucide-react'

type Role = 'customer' | 'driver' | 'hamali'

interface Props {
  role: Role
  activePath: string
}

const TABS: Record<Role, { label: string; path: string; Icon: any }[]> = {
  customer: [
    { label: 'Home', path: '/dashboard', Icon: Home },
    { label: 'Book', path: '/book', Icon: Plus },
    { label: 'Trips', path: '/bookings', Icon: Clock },
    { label: 'Profile', path: '/profile', Icon: User },
  ],
  driver: [
    { label: 'Home', path: '/driver', Icon: Home },
    { label: 'Jobs', path: '/driver/incoming', Icon: Truck },
    { label: 'Earnings', path: '/driver/earnings', Icon: TrendingUp },
    { label: 'Profile', path: '/driver/profile', Icon: User },
  ],
  hamali: [
    { label: 'Home', path: '/hamali', Icon: Home },
    { label: 'Jobs', path: '/hamali/incoming', Icon: Briefcase },
    { label: 'Earnings', path: '/hamali/earnings', Icon: TrendingUp },
    { label: 'Profile', path: '/hamali/profile', Icon: User },
  ],
}

const ACTIVE_COLORS: Record<Role, string> = {
  customer: '#FF6B2B',
  driver: '#FF6B2B',
  hamali: '#0D9488',
}

export default function BottomNav({ role, activePath }: Props) {
  const tabs = TABS[role]
  const activeColor = ACTIVE_COLORS[role]

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      height: 64, background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
      display: 'flex', alignItems: 'stretch'
    }}>
      {tabs.map(({ label, path, Icon }) => {
        const isActive = activePath === path || (path !== '/dashboard' && path !== '/driver' && path !== '/hamali' && activePath.startsWith(path))
        return (
          <Link key={path} href={path} style={{ flex: 1, textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 48, position: 'relative' }}>
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <Icon size={22} color={isActive ? activeColor : 'var(--text-faint)'} strokeWidth={isActive ? 2.2 : 1.8} />
              <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? activeColor : 'var(--text-faint)' }}>{label}</span>
              {isActive && (
                <div style={{
                  position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)',
                  width: 20, height: 3, background: activeColor, borderRadius: 2
                }} />
              )}
            </div>
          </Link>
        )
      })}
    </nav>
  )
}
