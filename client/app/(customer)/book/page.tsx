'use client'
import { useState, useEffect, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { fadeUp } from '@/lib/animations'
import LiveTrackingMap from '@/components/LiveTrackingMap'
import ProviderCard from '@/components/ProviderCard'
import Skeleton from '@/components/ui/Skeleton'
import { Truck, Users, ChevronLeft, Plus, Minus, CheckCircle } from 'lucide-react'

const VEHICLE_TYPES = [
  { key: 'mini_truck', label: 'Mini Truck', fare: 300 },
  { key: 'tempo', label: 'Tempo', fare: 400 },
  { key: 'truck_407', label: 'Truck 407', fare: 600 },
  { key: 'truck_1ton', label: '1 Ton', fare: 750 },
  { key: 'truck_2ton', label: '2 Ton', fare: 1000 },
  { key: 'heavy', label: 'Heavy', fare: 1500 },
]

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function BookPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const typeParam = searchParams.get('type') as 'transport' | 'hamali' | null

  const [step, setStep] = useState(typeParam ? 2 : 1)
  const [bookingType, setBookingType] = useState<'transport' | 'hamali' | null>(typeParam)

  // Transport state
  const [pickup, setPickup] = useState<{ lat: number; lng: number; address: string } | null>(null)
  const [dropoff, setDropoff] = useState<{ lat: number; lng: number; address: string } | null>(null)
  const [pinMode, setPinMode] = useState<'pickup' | 'dropoff'>('pickup')
  const [vehicleType, setVehicleType] = useState('')
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now')
  const [scheduleTime, setScheduleTime] = useState('')

  // Hamali state
  const [workAddress, setWorkAddress] = useState('')
  const [workLocation, setWorkLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [jobType, setJobType] = useState<'loading' | 'unloading' | 'both'>('loading')
  const [hours, setHours] = useState(2)
  const [goodsDesc, setGoodsDesc] = useState('')
  const [floor, setFloor] = useState(0)
  const [heavyGoods, setHeavyGoods] = useState(false)
  const [teamSize, setTeamSize] = useState(2)

  // Step 3
  const [providers, setProviders] = useState<any[]>([])
  const [loadingProviders, setLoadingProviders] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [booking, setBooking] = useState<any>(null)

  const distanceKm = pickup && dropoff ? haversine(pickup, dropoff) : 0
  const baseFare = vehicleType ? (VEHICLE_TYPES.find(v => v.key === vehicleType)?.fare || 0) : 0
  const estimatedFare = Math.round(baseFare + distanceKm * 12)

  const hamaliRate = 150
  const floorSurcharge = floor > 0 ? floor * 50 : 0
  const heavySurcharge = heavyGoods ? 200 : 0
  const hamaliEstimate = Math.round(hours * hamaliRate * teamSize + floorSurcharge + heavySurcharge)

  const goToProviders = async () => {
    setStep(3)
    setLoadingProviders(true)
    try {
      const endpoint = bookingType === 'transport' ? '/api/vehicles/available' : '/api/hamali/available'
      const params = bookingType === 'transport'
        ? { lat: pickup?.lat, lng: pickup?.lng, vehicleType }
        : { lat: workLocation?.lat || 17.385, lng: workLocation?.lng || 78.4867 }
      const { data } = await api.get(endpoint, { params })
      setProviders(data?.providers || data || [])
    } catch { toast.error('Failed to fetch providers'); setProviders([]) }
    finally { setLoadingProviders(false) }
  }

  const confirmBooking = async () => {
    if (!selectedProvider) return
    try {
      const payload: any = { bookingType, providerId: selectedProvider._id }
      if (bookingType === 'transport') {
        payload.pickup = pickup
        payload.dropoff = dropoff
        payload.vehicleType = vehicleType
        if (scheduleMode === 'later') payload.scheduledTime = scheduleTime
      } else {
        payload.workLocation = workLocation ? { ...workLocation, address: workAddress } : { lat: 17.385, lng: 78.4867, address: workAddress }
        payload.hamaliDetails = { jobType, hours, goodsDescription: goodsDesc, floorNumber: floor, heavyGoods, teamSize }
      }
      const { data } = await api.post('/api/bookings', payload)
      setBooking(data?.booking || data)
      setStep(4)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create booking')
    }
  }

  const slideProps = {
    initial: { opacity: 0, x: 60 }, animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -60 }, transition: { duration: 0.3 }
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh' }}>
      <AnimatePresence mode="wait">

        {/* STEP 1: Service selector */}
        {step === 1 && (
          <motion.div key="s1" {...slideProps} style={{ padding: '24px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
              <button onClick={() => router.back()} style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex' }}><ChevronLeft size={18} /></button>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 22 }}>What do you need?</h1>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { type: 'transport' as const, icon: Truck, title: 'Book a Truck', sub: 'Move goods across the city', color: 'var(--accent)', bg: 'linear-gradient(135deg, #FF6B2B 0%, #C94A10 100%)' },
                { type: 'hamali' as const, icon: Users, title: 'Book Hamali', sub: 'Loading/unloading services', color: 'var(--teal)', bg: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)' },
              ].map(opt => (
                <motion.div key={opt.type} whileTap={{ scale: 0.98 }} whileHover={{ y: -2, boxShadow: 'var(--shadow-lg)' }}
                  onClick={() => { setBookingType(opt.type); setStep(2) }}
                  style={{ background: opt.bg, borderRadius: 'var(--radius-lg)', padding: '28px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <opt.icon size={32} color="white" />
                  <div>
                    <div style={{ color: 'white', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 20, marginBottom: 4 }}>{opt.title}</div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{opt.sub}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP 2: Transport details */}
        {step === 2 && bookingType === 'transport' && (
          <motion.div key="s2t" {...slideProps}>
            {/* Map */}
            <div style={{ height: '55vh', position: 'relative' }}>
              <LiveTrackingMap pickup={pickup || undefined} dropoff={dropoff || undefined} />
              <div style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 10, display: 'flex', gap: 8 }}>
                <button onClick={() => router.back()} style={{ background: 'white', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', boxShadow: 'var(--shadow-sm)', display: 'flex' }}><ChevronLeft size={18} /></button>
                <div style={{ flex: 1, background: 'white', borderRadius: 8, padding: '8px 14px', boxShadow: 'var(--shadow-sm)', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>
                  {pinMode === 'pickup' ? '📍 Tap map to set pickup' : '🏁 Tap map to set dropoff'}
                </div>
              </div>
            </div>

            <div style={{ padding: '16px', background: 'var(--bg)' }}>
              {/* Pin toggles */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {['pickup', 'dropoff'].map(m => (
                  <button key={m} onClick={() => setPinMode(m as 'pickup' | 'dropoff')} style={{
                    flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid',
                    borderColor: pinMode === m ? 'var(--accent)' : 'var(--border-strong)',
                    background: pinMode === m ? 'var(--accent-light)' : 'var(--surface)',
                    color: pinMode === m ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer'
                  }}>
                    {m === 'pickup' ? `📍 ${pickup ? pickup.address.slice(0, 20) + '…' : 'Set Pickup'}` : `🏁 ${dropoff ? dropoff.address.slice(0, 20) + '…' : 'Set Dropoff'}`}
                  </button>
                ))}
              </div>

              {/* Demo: set coords via address */}
              <input
                placeholder={pinMode === 'pickup' ? 'Enter pickup address' : 'Enter dropoff address'}
                style={{ width: '100%', background: 'var(--surface-raised)', border: '1.5px solid var(--border-strong)', borderRadius: 10, padding: '12px 16px', fontSize: 16, marginBottom: 14, outline: 'none', fontFamily: 'Outfit, sans-serif' }}
                onBlur={e => {
                  const addr = e.target.value.trim()
                  if (!addr) return
                  const coords = { lat: 17.385 + Math.random() * 0.05, lng: 78.4867 + Math.random() * 0.05 }
                  if (pinMode === 'pickup') setPickup({ ...coords, address: addr })
                  else setDropoff({ ...coords, address: addr })
                }}
              />

              {/* Vehicle type */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Vehicle Type</div>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                  {VEHICLE_TYPES.map(vt => (
                    <button key={vt.key} onClick={() => setVehicleType(vt.key)} style={{
                      flexShrink: 0, padding: '8px 14px', borderRadius: 8, border: '1.5px solid',
                      borderColor: vehicleType === vt.key ? 'var(--accent)' : 'var(--border-strong)',
                      background: vehicleType === vt.key ? 'var(--accent-light)' : 'var(--surface)',
                      color: vehicleType === vt.key ? 'var(--accent)' : 'var(--text-muted)',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
                    }}>
                      {vt.label}<br />
                      <span style={{ fontSize: 11, fontWeight: 400 }}>from ₹{vt.fare}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {(['now', 'later'] as const).map(m => (
                  <button key={m} onClick={() => setScheduleMode(m)} style={{
                    flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid',
                    borderColor: scheduleMode === m ? 'var(--accent)' : 'var(--border-strong)',
                    background: scheduleMode === m ? 'var(--accent-light)' : 'var(--surface)',
                    color: scheduleMode === m ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer'
                  }}>{m === 'now' ? 'Now' : 'Schedule Later'}</button>
                ))}
              </div>
              {scheduleMode === 'later' && (
                <input type="datetime-local" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                  style={{ width: '100%', background: 'var(--surface-raised)', border: '1.5px solid var(--border-strong)', borderRadius: 10, padding: '12px 16px', fontSize: 16, marginBottom: 14, outline: 'none' }} />
              )}

              {/* Fare estimate */}
              {pickup && dropoff && vehicleType && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '14px 16px', border: '1px solid var(--border)', marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{distanceKm.toFixed(1)} km · {vehicleType.replace(/_/g, ' ')}</span>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--accent)' }}>₹{estimatedFare}</span>
                  </div>
                </motion.div>
              )}

              <motion.button whileTap={{ scale: 0.97 }} onClick={goToProviders}
                disabled={!pickup || !dropoff || !vehicleType}
                style={{
                  width: '100%', background: 'var(--accent)', color: 'white', border: 'none',
                  borderRadius: 'var(--radius-md)', padding: '18px', fontSize: 16, fontWeight: 700,
                  cursor: (!pickup || !dropoff || !vehicleType) ? 'not-allowed' : 'pointer',
                  opacity: (!pickup || !dropoff || !vehicleType) ? 0.5 : 1,
                  fontFamily: 'Outfit, sans-serif'
                }}>
                Find Providers →
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Hamali details */}
        {step === 2 && bookingType === 'hamali' && (
          <motion.div key="s2h" {...slideProps} style={{ padding: '24px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <button onClick={() => setStep(1)} style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex' }}><ChevronLeft size={18} /></button>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 22 }}>Book Hamali</h1>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Work Location</label>
                <input value={workAddress} onChange={e => setWorkAddress(e.target.value)} placeholder="Enter address" style={{ width: '100%', background: 'var(--surface-raised)', border: '1.5px solid var(--border-strong)', borderRadius: 10, padding: '14px 16px', fontSize: 16, outline: 'none', fontFamily: 'Outfit, sans-serif' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Job Type</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['loading', 'unloading', 'both'] as const).map(jt => (
                    <button key={jt} onClick={() => setJobType(jt)} style={{
                      flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid',
                      borderColor: jobType === jt ? 'var(--teal)' : 'var(--border-strong)',
                      background: jobType === jt ? 'var(--teal-light)' : 'var(--surface)',
                      color: jobType === jt ? 'var(--teal)' : 'var(--text-muted)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' as const
                    }}>{jt}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Duration: {hours} hours</label>
                <input type="range" min={1} max={12} value={hours} onChange={e => setHours(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--teal)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Goods Description</label>
                <textarea value={goodsDesc} onChange={e => setGoodsDesc(e.target.value)} rows={3} placeholder="Describe what needs to be moved..." style={{ width: '100%', background: 'var(--surface-raised)', border: '1.5px solid var(--border-strong)', borderRadius: 10, padding: '12px 16px', fontSize: 16, resize: 'none', outline: 'none', fontFamily: 'Outfit, sans-serif' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
                  Floor Number {floor > 0 ? <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>(+₹{floor * 50} surcharge)</span> : ''}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <button onClick={() => setFloor(Math.max(0, floor - 1))} style={{ width: 36, height: 36, borderRadius: 8, border: '1.5px solid var(--border-strong)', background: 'var(--surface-raised)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={16} /></button>
                  <span style={{ fontSize: 16, fontWeight: 600, minWidth: 80, textAlign: 'center' }}>{floor === 0 ? 'Ground' : `Floor ${floor}`}</span>
                  <button onClick={() => setFloor(floor + 1)} style={{ width: 36, height: 36, borderRadius: 8, border: '1.5px solid var(--border-strong)', background: 'var(--surface-raised)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={16} /></button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 14, fontWeight: 500 }}>Heavy Goods (+₹200)</label>
                <button onClick={() => setHeavyGoods(!heavyGoods)} style={{
                  width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
                  background: heavyGoods ? 'var(--teal)' : 'var(--border-strong)',
                  position: 'relative', transition: 'background 0.2s'
                }}>
                  <motion.div animate={{ x: heavyGoods ? 26 : 2 }} style={{ width: 22, height: 22, borderRadius: '50%', background: 'white', position: 'absolute', top: 3 }} />
                </button>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Team Size: {teamSize}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <button onClick={() => setTeamSize(Math.max(1, teamSize - 1))} style={{ width: 36, height: 36, borderRadius: 8, border: '1.5px solid var(--border-strong)', background: 'var(--surface-raised)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={16} /></button>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>{teamSize}</span>
                  <button onClick={() => setTeamSize(Math.min(10, teamSize + 1))} style={{ width: 36, height: 36, borderRadius: 8, border: '1.5px solid var(--border-strong)', background: 'var(--surface-raised)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={16} /></button>
                </div>
              </div>

              {/* Live fare */}
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '14px 16px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>{hours}h · Team of {teamSize}{heavyGoods ? ' · Heavy' : ''}{floor > 0 ? ` · Floor ${floor}` : ''}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>Estimated total</div>
                  </div>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: 'var(--teal)' }}>₹{hamaliEstimate}</span>
                </div>
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={goToProviders} disabled={!workAddress}
                style={{
                  width: '100%', background: 'var(--teal)', color: 'white', border: 'none',
                  borderRadius: 'var(--radius-md)', padding: '18px', fontSize: 16, fontWeight: 700,
                  cursor: !workAddress ? 'not-allowed' : 'pointer', opacity: !workAddress ? 0.5 : 1, fontFamily: 'Outfit, sans-serif'
                }}>
                Find Providers →
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Provider selection */}
        {step === 3 && (
          <motion.div key="s3" {...slideProps} style={{ padding: '24px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <button onClick={() => setStep(2)} style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex' }}><ChevronLeft size={18} /></button>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 20 }}>Choose Provider</h1>
            </div>

            {loadingProviders ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>Finding providers near you...</div>
                {[1, 2, 3].map(i => <Skeleton key={i} height={140} style={{ borderRadius: 'var(--radius-md)' }} />)}
              </div>
            ) : providers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>😔</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No providers nearby</div>
                <div style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Try again in a few minutes</div>
                <button onClick={goToProviders} style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '12px 28px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600 }}>Retry</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {providers.map(p => (
                  <ProviderCard key={p._id} provider={p} selected={selectedProvider?._id === p._id}
                    onSelect={() => setSelectedProvider(p)} bookingType={bookingType!} />
                ))}
              </div>
            )}

            {selectedProvider && (
              <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                style={{ position: 'sticky', bottom: 90, left: 16, right: 16, marginTop: 16 }}>
                <motion.button whileTap={{ scale: 0.97 }} onClick={confirmBooking}
                  style={{
                    width: '100%', background: bookingType === 'hamali' ? 'var(--teal)' : 'var(--accent)',
                    color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: '18px',
                    fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                    boxShadow: 'var(--shadow-lg)'
                  }}>
                  Confirm Booking with {selectedProvider.userId?.name?.split(' ')[0]}
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* STEP 4: Confirmation */}
        {step === 4 && booking && (
          <motion.div key="s4" {...slideProps} style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center' }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="38" stroke={bookingType === 'hamali' ? 'var(--teal)' : 'var(--accent)'} strokeWidth="4" fill="none" />
                <motion.path d="M22 40 L34 52 L58 28" stroke={bookingType === 'hamali' ? 'var(--teal)' : 'var(--accent)'} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 0.6 }} />
              </svg>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} initial="hidden" animate="show" style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, marginTop: 20, marginBottom: 8 }}>
              Booking Confirmed!
            </motion.h1>
            <motion.div variants={fadeUp} custom={2} initial="hidden" animate="show" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '10px 20px', marginBottom: 16, border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Booking ID</span>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>
                #{(booking.bookingId || booking._id).slice(-8).toUpperCase()}
              </div>
            </motion.div>
            <motion.p variants={fadeUp} custom={3} initial="hidden" animate="show" style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.5, marginBottom: 32, maxWidth: 280 }}>
              Your provider has been notified. They will accept soon.
            </motion.p>
            <motion.div variants={fadeUp} custom={4} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 280 }}>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push(`/bookings/${booking._id}`)}
                style={{ background: bookingType === 'hamali' ? 'var(--teal)' : 'var(--accent)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: '16px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                Track your booking
              </motion.button>
              <button onClick={() => router.push('/dashboard')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer', padding: '8px' }}>
                Back to Home
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function BookPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
      <BookPageInner />
    </Suspense>
  )
}
