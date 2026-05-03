'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { CalendarDays, RotateCcw, Receipt, Gift, Truck, Package, ChevronRight, ArrowRight } from 'lucide-react'
import api from '@/lib/api'
import { socket } from '@/lib/socket'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function toArr<T>(v: unknown): T[] { return Array.isArray(v) ? v : [] }

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [activeBooking, setActiveBooking] = useState<any>(null)
  const [recentTrips, setRecentTrips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    let cancelled = false
    const load = async () => {
      try {
        const [meRes, activeRes, recentRes] = await Promise.all([
          api.get('/api/auth/me'),
          api.get('/api/bookings/my?status=in_progress&status=accepted&limit=1').catch(() => ({ data: { bookings: [] } })),
          api.get('/api/bookings/my?limit=4').catch(() => ({ data: { bookings: [] } })),
        ])
        if (cancelled) return
        const me = meRes.data?.user || meRes.data?.data?.user || null
        setUser(me)
        setActiveBooking(toArr<any>(activeRes.data?.bookings ?? activeRes.data?.data?.bookings)[0] || null)
        setRecentTrips(toArr<any>(recentRes.data?.bookings ?? recentRes.data?.data?.bookings))
      } catch {
        if (!cancelled) toast.error('Failed to load dashboard')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()

    const handleAccepted = () => { toast.success('Your booking was accepted'); load() }
    socket.on('booking:accepted', handleAccepted)
    return () => {
      cancelled = true
      socket.off('booking:accepted', handleAccepted)
    }
  }, [])

  const userName = user?.name?.split(' ')[0] || 'there'

  return (
    <div className="fyro-page" style={{
      background: 'radial-gradient(ellipse 80% 45% at 75% -5%, rgba(255,107,43,0.08) 0%, transparent 55%), var(--bg)'
    }}>

      {/* GREETING — single header, single date */}
      <div className="fade-up fade-up-1" style={{ marginBottom: 24 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)', margin: '0 0 2px' }}>
          {getGreeting()},
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <h1 style={{ fontSize: 'clamp(26px, 6vw, 38px)', margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.025em' }}>
            {userName}
          </h1>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 999,
            background: 'var(--surface)', border: '1px solid var(--border)',
            fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
            color: 'var(--text-muted)', boxShadow: 'var(--shadow-sm)'
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#16A34A', display: 'inline-block',
              animation: 'pulseDot 2s ease infinite'
            }} />
            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* ACTIVE BOOKING (if any) */}
      {activeBooking && (
        <div
          className="fade-up fade-up-2"
          onClick={() => router.push(`/bookings/${activeBooking._id}/tracking`)}
          style={{
            background: 'var(--surface)', borderRadius: 16,
            border: '1px solid var(--border)', padding: '14px 16px',
            position: 'relative', overflow: 'hidden', marginBottom: 18,
            boxShadow: 'var(--shadow-md)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 14
          }}
        >
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'var(--orange)' }} />
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: 'rgba(255,107,43,0.09)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, marginLeft: 6
          }}>
            <Truck size={17} color="var(--orange)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#16A34A', margin: 0 }}>
              {activeBooking.status === 'accepted' ? 'Driver on the way' : 'Trip in progress'}
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeBooking.pickup?.address || 'Active booking'}
            </p>
          </div>
          <div style={{ color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
            Track <ArrowRight size={14} />
          </div>
        </div>
      )}

      {/* BOOK NOW CARDS */}
      <div className="fade-up fade-up-2" style={{ marginBottom: 22 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 8px' }}>
          Book now
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

          <Link href="/book?type=transport" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(140deg, #FF6B2B 0%, #E85520 100%)',
              borderRadius: 18, padding: '20px 16px 0',
              minHeight: 140, position: 'relative', overflow: 'hidden',
              transition: 'transform 260ms cubic-bezier(0.16,1,0.3,1), box-shadow 260ms cubic-bezier(0.16,1,0.3,1)',
              cursor: 'pointer'
            }}
              onMouseEnter={e => {
                const t = e.currentTarget
                t.style.transform = 'translateY(-5px) scale(1.01)'
                t.style.boxShadow = '0 20px 40px rgba(255,107,43,0.28)'
              }}
              onMouseLeave={e => {
                const t = e.currentTarget
                t.style.transform = ''
                t.style.boxShadow = ''
              }}
            >
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: '#fff', marginBottom: 3 }}>Book a Truck</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.72)', margin: 0 }}>Transport goods</p>
              <svg viewBox="0 0 120 70" fill="none" style={{ width: '100%', marginTop: 8, display: 'block' }}>
                <rect x="4" y="18" width="66" height="32" rx="4" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8"/>
                <rect x="68" y="26" width="26" height="24" rx="4" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8"/>
                <rect x="70" y="29" width="18" height="11" rx="2" fill="rgba(255,255,255,0.3)"/>
                <circle cx="20" cy="53" r="7" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.6)" strokeWidth="2.2"/>
                <circle cx="20" cy="53" r="3" fill="rgba(255,255,255,0.35)"/>
                <circle cx="54" cy="53" r="7" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.6)" strokeWidth="2.2"/>
                <circle cx="54" cy="53" r="3" fill="rgba(255,255,255,0.35)"/>
                <circle cx="80" cy="53" r="7" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.6)" strokeWidth="2.2"/>
                <circle cx="80" cy="53" r="3" fill="rgba(255,255,255,0.35)"/>
                <text x="18" y="36" fill="rgba(255,255,255,0.45)" fontSize="8" fontWeight="800" fontFamily="Syne, sans-serif">FYRO</text>
              </svg>
            </div>
          </Link>

          <Link href="/book?type=hamali" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(140deg, #0D9488 0%, #0A7A6F 100%)',
              borderRadius: 18, padding: '20px 16px 0',
              minHeight: 140, position: 'relative', overflow: 'hidden',
              transition: 'transform 260ms cubic-bezier(0.16,1,0.3,1), box-shadow 260ms cubic-bezier(0.16,1,0.3,1)',
              cursor: 'pointer'
            }}
              onMouseEnter={e => {
                const t = e.currentTarget
                t.style.transform = 'translateY(-5px) scale(1.01)'
                t.style.boxShadow = '0 20px 40px rgba(13,148,136,0.28)'
              }}
              onMouseLeave={e => {
                const t = e.currentTarget
                t.style.transform = ''
                t.style.boxShadow = ''
              }}
            >
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: '#fff', marginBottom: 3 }}>Book Hamali</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.72)', margin: 0 }}>Loading workers</p>
              <svg viewBox="0 0 90 70" fill="none" style={{ width: '100%', marginTop: 12, display: 'block' }}>
                <path d="M45 8 L78 24 L45 40 L12 24 Z" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.42)" strokeWidth="1.5"/>
                <path d="M12 24 L12 52 L45 68 L45 40 Z" fill="rgba(255,255,255,0.09)" stroke="rgba(255,255,255,0.32)" strokeWidth="1.5"/>
                <path d="M78 24 L78 52 L45 68 L45 40 Z" fill="rgba(255,255,255,0.13)" stroke="rgba(255,255,255,0.32)" strokeWidth="1.5"/>
              </svg>
            </div>
          </Link>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="fade-up fade-up-3" style={{ marginBottom: 24 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 8px' }}>
          Quick actions
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {([
            { Icon: CalendarDays, label: 'Schedule', href: '/bookings' },
            { Icon: RotateCcw, label: 'Repeat', href: '/bookings' },
            { Icon: Receipt, label: 'Invoices', href: '/payments' },
            { Icon: Gift, label: 'Refer', href: '/profile' },
          ] as const).map(({ Icon, label, href }) => (
            <Link key={label} href={href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                padding: '14px 6px', borderRadius: 14,
                background: 'var(--surface)', border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 220ms cubic-bezier(0.16,1,0.3,1)', textAlign: 'center', cursor: 'pointer'
              }}
                onMouseEnter={e => { const t = e.currentTarget; t.style.transform = 'translateY(-3px)'; t.style.boxShadow = 'var(--shadow-md)'; t.style.borderColor = 'rgba(255,107,43,0.25)'; }}
                onMouseLeave={e => { const t = e.currentTarget; t.style.transform = ''; t.style.boxShadow = 'var(--shadow-sm)'; t.style.borderColor = 'var(--border)'; }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,107,43,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} color="var(--orange)" strokeWidth={2} />
                </div>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* RECENT TRIPS */}
      <div className="fade-up fade-up-4">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', margin: 0 }}>Recent trips</h2>
          <Link href="/bookings" style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: 2, textDecoration: 'none' }}>
            See all <ChevronRight size={14} />
          </Link>
        </div>

        {loading && [1, 2].map(i => (
          <div key={i} className="skeleton" style={{ height: 68, marginBottom: 10 }} />
        ))}

        {!loading && recentTrips.length === 0 && (
          <div style={{
            background: 'var(--surface)', borderRadius: 16,
            border: '1px solid var(--border)', padding: '28px 20px',
            textAlign: 'center', overflow: 'hidden', position: 'relative'
          }}>
            <div style={{ position: 'relative', height: 32, marginBottom: 14, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'repeating-linear-gradient(90deg, var(--border) 0, var(--border) 8px, transparent 8px, transparent 16px)' }} />
              <div className="truck-drive" style={{ position: 'absolute', bottom: 3 }}>
                <svg width="34" height="22" viewBox="0 0 34 22" fill="none">
                  <rect x="1" y="5" width="20" height="10" rx="2" fill="var(--orange)" opacity="0.8"/>
                  <rect x="20" y="8" width="10" height="7" rx="2" fill="var(--orange)"/>
                  <rect x="22" y="9" width="6" height="3.5" rx="1" fill="rgba(255,255,255,0.3)"/>
                  <circle cx="7" cy="18" r="2.8" fill="var(--dark)" stroke="var(--orange)" strokeWidth="1.4"/>
                  <circle cx="18" cy="18" r="2.8" fill="var(--dark)" stroke="var(--orange)" strokeWidth="1.4"/>
                  <circle cx="27" cy="18" r="2.8" fill="var(--dark)" stroke="var(--orange)" strokeWidth="1.4"/>
                </svg>
              </div>
            </div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text)', margin: '0 0 4px' }}>No trips yet</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Book your first trip to get started</p>
          </div>
        )}

        {!loading && recentTrips.map((trip: any) => {
          const isHamali = trip.bookingType === 'hamali'
          const route = isHamali
            ? (trip.pickup?.address || 'Hamali service')
            : `${(trip.pickup?.address || 'Pickup').split(',')[0]} → ${(trip.dropoff?.address || 'Dropoff').split(',')[0]}`
          return (
            <Link key={trip._id} href={`/bookings/${trip._id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'var(--surface)', borderRadius: 14, padding: '14px 16px',
                border: '1px solid var(--border)', marginBottom: 8,
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)', cursor: 'pointer'
              }}
                onMouseEnter={e => { const t = e.currentTarget; t.style.borderColor = 'rgba(255,107,43,0.2)'; t.style.transform = 'translateX(3px)'; }}
                onMouseLeave={e => { const t = e.currentTarget; t.style.borderColor = 'var(--border)'; t.style.transform = ''; }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 11,
                  background: isHamali ? 'rgba(13,148,136,0.09)' : 'rgba(255,107,43,0.09)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {isHamali
                    ? <Package size={17} color="var(--teal)" />
                    : <Truck size={17} color="var(--orange)" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {route}
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    {new Date(trip.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15,
                    color: isHamali ? 'var(--teal)' : 'var(--orange)'
                  }}>
                    ₹{trip.finalFare || trip.estimatedFare || 0}
                  </span>
                  <span style={{
                    padding: '2px 8px', borderRadius: 999,
                    fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-body)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    background: trip.status === 'completed' ? 'rgba(22,163,74,0.1)' : 'rgba(255,107,43,0.1)',
                    color: trip.status === 'completed' ? '#16A34A' : 'var(--orange)'
                  }}>
                    {trip.status}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

    </div>
  )
}
