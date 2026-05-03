'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const skipLenis = pathname?.includes('/book') || pathname?.includes('/tracking')

  useEffect(() => {
    if (skipLenis) return
    let lenis: any
    import('lenis').then(({ default: Lenis }) => {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      })
      function raf(time: number) {
        lenis.raf(time)
        requestAnimationFrame(raf)
      }
      requestAnimationFrame(raf)
    })
    return () => lenis?.destroy()
  }, [skipLenis])

  return <>{children}</>
}
