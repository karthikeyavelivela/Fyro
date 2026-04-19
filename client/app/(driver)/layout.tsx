'use client'
import AppShell from '@/components/AppShell'

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="driver">{children}</AppShell>
}
