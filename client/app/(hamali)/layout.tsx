'use client'
import AppShell from '@/components/AppShell'

export default function HamaliLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="hamali">{children}</AppShell>
}
