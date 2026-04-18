'use client'
import BottomNav from '@/components/BottomNav'
import { usePathname } from 'next/navigation'

export default function HamaliLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: '80px' }}>
      {children}
      <BottomNav role="hamali" activePath={pathname} />
    </div>
  )
}
