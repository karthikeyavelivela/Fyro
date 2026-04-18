'use client'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, BookOpen, AlertCircle, FileCheck, LogOut } from 'lucide-react'
import api from '@/lib/api'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/bookings', label: 'Bookings', icon: BookOpen },
  { href: '/admin/complaints', label: 'Complaints', icon: AlertCircle },
  { href: '/admin/kyc', label: 'KYC', icon: FileCheck },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await api.post('/api/auth/logout').catch(() => {})
    router.push('/login')
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Sidebar - desktop only */}
      <aside
        className="hidden md:flex flex-col w-60 fixed top-0 left-0 h-full z-20"
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="font-syne font-800 text-xl" style={{ color: 'var(--accent)' }}>FYRO</span>
          <span
            className="ml-2 text-xs font-500 px-2 py-0.5 rounded-full"
            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
          >
            Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-500 transition-colors"
                style={{
                  background: active ? 'var(--accent-light)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  fontWeight: active ? 600 : 400,
                }}
              >
                <Icon size={18} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-500 w-full"
            style={{ color: 'var(--red)' }}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-60 min-h-screen pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-20 flex"
        style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          height: 64,
          paddingBottom: 'max(0px, env(safe-area-inset-bottom))'
        }}
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 text-xs"
              style={{ color: active ? 'var(--accent)' : 'var(--text-faint)' }}
            >
              <Icon size={20} />
              <span className="hidden sm:block">{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
