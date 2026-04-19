'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Flag,
  Shield,
  LogOut,
} from 'lucide-react'

const NAV: {
  section: string
  items: { label: string; path: string; icon: any; exact?: boolean }[]
}[] = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    section: 'Operations',
    items: [
      { label: 'Bookings', path: '/admin/bookings', icon: BookOpen },
      { label: 'Complaints', path: '/admin/complaints', icon: Flag },
    ],
  },
  {
    section: 'People',
    items: [
      { label: 'Users', path: '/admin/users', icon: Users },
      { label: 'KYC Queue', path: '/admin/kyc', icon: Shield },
    ],
  },
]

function isActive(pathname: string, path: string, exact?: boolean) {
  if (exact) return pathname === path
  return pathname === path || pathname.startsWith(path + '/')
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand">
          <span className="admin-brand-word">FYRO</span>
          <span className="admin-brand-tag">ADMIN</span>
        </Link>

        <nav className="admin-nav" aria-label="Admin navigation">
          {NAV.map((group) => (
            <div key={group.section}>
              <div className="admin-nav-section">{group.section}</div>
              {group.items.map(({ label, path, icon: Icon, exact }) => {
                const active = isActive(pathname, path, exact)
                return (
                  <Link
                    key={path}
                    href={path}
                    className={active ? 'admin-nav-item active' : 'admin-nav-item'}
                  >
                    <Icon size={16} />
                    <span className="nav-label">{label}</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="admin-user">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--orange)',
              display: 'grid',
              placeItems: 'center',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 13,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            A
          </div>
          <div style={{ flex: 1 }}>
            <div className="admin-user-name">Admin</div>
            <div className="admin-user-role">Super admin</div>
          </div>
          <Link href="/login" style={{ color: 'rgba(255,255,255,0.5)', display: 'inline-flex' }} aria-label="Logout">
            <LogOut size={16} />
          </Link>
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  )
}
