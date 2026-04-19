'use client'
import { useState, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { fadeUp } from '@/lib/animations'
import LiveTrackingMap from '@/components/LiveTrackingMap'
import ProviderCard from '@/components/ProviderCard'
import Skeleton from '@/components/ui/Skeleton'
import { Truck, Package, ChevronLeft, Plus, Minus, ArrowRight, MapPin, Flag, Check } from 'lucide-react'

const VEHICLE_TYPES = [
  { key: 'mini_truck', label: 'Mini Truck', fare: 300, cap: '500 kg' },
  { key: 'tempo', label: 'Tempo', fare: 400, cap: 'Up to 750 kg' },
  { key: 'truck_407', label: 'Truck 407', fare: 600, cap: '1 ton' },
  { key: 'truck_1ton', label: '1 Ton', fare: 750, cap: '1-2 tons' },
  { key: 'truck_2ton', label: '2 Ton', fare: 1000, cap: '2-3 tons' },
  { key: 'heavy', label: 'Heavy', fare: 1500, cap: '4+ tons' },
]

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : []
}

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

  const [pickup, setPickup] = useState<{ lat: number; lng: number; address: string } | null>(null)
  const [dropoff, setDropoff] = useState<{ lat: number; lng: number; address: string } | null>(null)
  const [pinMode, setPinMode] = useState<'pickup' | 'dropoff'>('pickup')
  const [vehicleType, setVehicleType] = useState('')
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now')
  const [scheduleTime, setScheduleTime] = useState('')

  const [workAddress, setWorkAddress] = useState('')
  const [workLocation, setWorkLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [jobType, setJobType] = useState<'loading' | 'unloading' | 'both'>('loading')
  const [hours, setHours] = useState(2)
  const [goodsDesc, setGoodsDesc] = useState('')
  const [floor, setFloor] = useState(0)
  const [heavyGoods, setHeavyGoods] = useState(false)
  const [teamSize, setTeamSize] = useState(2)

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
        ? { lat: pickup?.lat, lng: pickup?.lng, type: vehicleType }
        : { lat: workLocation?.lat || 17.385, lng: workLocation?.lng || 78.4867 }
      const { data } = await api.get(endpoint, { params })
      const list = toArray<any>(
        data?.providers ??
        data?.vehicles ??
        data?.profiles ??
        data?.data?.providers ??
        data?.data?.vehicles ??
        data?.data?.profiles ??
        data?.data ??
        data
      )
      setProviders(list)
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

  const accent = bookingType === 'hamali' ? 'var(--teal)' : 'var(--orange)'
  const accentTint = bookingType === 'hamali' ? 'var(--teal-tint)' : 'var(--orange-tint)'
  const accentLight = bookingType === 'hamali' ? 'var(--teal-light)' : 'var(--orange-light)'

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 52,
    borderRadius: 12,
    border: '1px solid var(--border-light)',
    background: 'var(--bg)',
    padding: '0 16px',
    fontSize: 16,
    outline: 'none',
    color: 'var(--text)',
    fontFamily: 'var(--font-body)',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 460, margin: '0 auto' }}>
        <AnimatePresence mode="wait">

          {/* STEP 1 */}
          {step === 1 && (
            <motion.div key="s1" {...slideProps} style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 10, background: '#fff', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <ChevronLeft size={18} />
                </button>
                <h1 className="syne" style={{ fontWeight: 700, fontSize: 22 }}>What do you need?</h1>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button
                  onClick={() => { setBookingType('transport'); setStep(2) }}
                  style={{
                    width: '100%', height: 140, borderRadius: 20, background: 'var(--orange)', color: '#fff',
                    position: 'relative', overflow: 'hidden', textAlign: 'left', padding: '22px 24px',
                    border: 'none', cursor: 'pointer'
                  }}
                >
                  <div className="syne" style={{ fontSize: 24, fontWeight: 700 }}>Book a Truck</div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>Move goods across the city</div>
                  <Truck size={96} color="rgba(255,255,255,0.25)" style={{ position: 'absolute', right: -8, bottom: -12 }} />
                  <ArrowRight size={22} color="#fff" style={{ position: 'absolute', right: 20, bottom: 20 }} />
                </button>
                <button
                  onClick={() => { setBookingType('hamali'); setStep(2) }}
                  style={{
                    width: '100%', height: 140, borderRadius: 20, background: 'var(--teal)', color: '#fff',
                    position: 'relative', overflow: 'hidden', textAlign: 'left', padding: '22px 24px',
                    border: 'none', cursor: 'pointer'
                  }}
                >
                  <div className="syne" style={{ fontSize: 24, fontWeight: 700 }}>Book Hamali</div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>Loading & unloading workers</div>
                  <Package size={96} color="rgba(255,255,255,0.25)" style={{ position: 'absolute', right: -8, bottom: -12 }} />
                  <ArrowRight size={22} color="#fff" style={{ position: 'absolute', right: 20, bottom: 20 }} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2 TRANSPORT */}
          {step === 2 && bookingType === 'transport' && (
            <motion.div key="s2t" {...slideProps}>
              {/* Map */}
              <div style={{ height: '42vh', position: 'relative' }}>
                <LiveTrackingMap pickup={pickup || undefined} dropoff={dropoff || undefined} />
                <div style={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 10, display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => router.back()}
                    style={{ width: 40, height: 40, borderRadius: 12, background: '#fff', border: 'none', boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: '10px 14px', boxShadow: 'var(--shadow-md)', fontSize: 13, fontWeight: 500, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {pinMode === 'pickup' ? <MapPin size={14} color="var(--orange)" /> : <Flag size={14} color="var(--dark)" />}
                    {pinMode === 'pickup' ? 'Set pickup' : 'Set dropoff'}
                  </div>
                </div>
              </div>

              <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', marginTop: -20, padding: '20px 20px 32px', position: 'relative', zIndex: 5 }}>
                <div style={{ width: 36, height: 4, borderRadius: 999, background: 'rgba(0,0,0,0.12)', margin: '0 auto 16px' }} />

                {/* Route card */}
                <div style={{ background: 'var(--bg)', borderRadius: 16, padding: 14, marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    {(['pickup', 'dropoff'] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => setPinMode(m)}
                        style={{
                          flex: 1, padding: '8px', borderRadius: 10,
                          border: pinMode === m ? '2px solid var(--orange)' : '1px solid var(--border-light)',
                          background: pinMode === m ? 'var(--orange-tint)' : '#fff',
                          color: pinMode === m ? 'var(--orange)' : 'var(--text-muted)',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        {m === 'pickup' ? 'Pickup' : 'Dropoff'}
                      </button>
                    ))}
                  </div>
                  <input
                    placeholder={pinMode === 'pickup' ? 'Enter pickup address' : 'Enter dropoff address'}
                    style={inputStyle}
                    onBlur={e => {
                      const addr = e.target.value.trim()
                      if (!addr) return
                      const coords = { lat: 17.385 + Math.random() * 0.05, lng: 78.4867 + Math.random() * 0.05 }
                      if (pinMode === 'pickup') setPickup({ ...coords, address: addr })
                      else setDropoff({ ...coords, address: addr })
                    }}
                  />
                  {(pickup || dropoff) && (
                    <div style={{ marginTop: 12, fontSize: 12 }}>
                      {pickup && <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--text-muted)' }}><MapPin size={12} color="var(--orange)" /> {pickup.address}</div>}
                      {dropoff && <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--text-muted)', marginTop: 4 }}><Flag size={12} color="var(--dark)" /> {dropoff.address}</div>}
                    </div>
                  )}
                </div>

                {/* Vehicle type */}
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Vehicle type</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {VEHICLE_TYPES.map(vt => {
                    const sel = vehicleType === vt.key
                    return (
                      <button
                        key={vt.key}
                        onClick={() => setVehicleType(vt.key)}
                        style={{
                          padding: 14, borderRadius: 14, textAlign: 'left',
                          background: sel ? 'var(--orange-tint)' : '#fff',
                          border: sel ? '2px solid var(--orange)' : '1px solid var(--border-light)',
                          cursor: 'pointer',
                        }}
                      >
                        <Truck size={22} color={sel ? 'var(--orange)' : 'var(--text)'} />
                        <div className="syne" style={{ fontWeight: 700, fontSize: 14, marginTop: 6 }}>{vt.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{vt.cap}</div>
                        <div className="syne" style={{ fontSize: 12, color: sel ? 'var(--orange)' : 'var(--text)', fontWeight: 700, marginTop: 2 }}>from ₹{vt.fare}</div>
                      </button>
                    )
                  })}
                </div>

                {/* Schedule */}
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>When</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  {(['now', 'later'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setScheduleMode(m)}
                      style={{
                        flex: 1, padding: 12, borderRadius: 12,
                        border: scheduleMode === m ? '2px solid var(--orange)' : '1px solid var(--border-light)',
                        background: scheduleMode === m ? 'var(--orange-tint)' : '#fff',
                        color: scheduleMode === m ? 'var(--orange)' : 'var(--text)',
                        fontWeight: 600, fontSize: 13, cursor: 'pointer',
                      }}
                    >
                      {m === 'now' ? 'Now' : 'Schedule'}
                    </button>
                  ))}
                </div>
                {scheduleMode === 'later' && (
                  <input type="datetime-local" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} style={{ ...inputStyle, marginBottom: 14 }} />
                )}

                {/* Fare estimate */}
                {pickup && dropoff && vehicleType && (
                  <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    style={{ background: 'var(--bg)', borderRadius: 14, padding: '14px 16px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{distanceKm.toFixed(1)} km · {vehicleType.replace(/_/g, ' ')}</span>
                    <span className="syne" style={{ fontWeight: 800, fontSize: 20, color: 'var(--orange)' }}>₹{estimatedFare}</span>
                  </motion.div>
                )}

                <button
                  onClick={goToProviders}
                  disabled={!pickup || !dropoff || !vehicleType}
                  style={{
                    width: '100%', height: 52, background: 'var(--orange)', color: '#fff',
                    borderRadius: 999, border: 'none', fontSize: 15, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    cursor: (!pickup || !dropoff || !vehicleType) ? 'not-allowed' : 'pointer',
                    opacity: (!pickup || !dropoff || !vehicleType) ? 0.5 : 1,
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Find providers <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2 HAMALI */}
          {step === 2 && bookingType === 'hamali' && (
            <motion.div key="s2h" {...slideProps} style={{ padding: '16px 20px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <button onClick={() => setStep(1)} style={{ width: 36, height: 36, borderRadius: 10, background: '#fff', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <ChevronLeft size={18} />
                </button>
                <h1 className="syne" style={{ fontWeight: 700, fontSize: 22 }}>Book Hamali</h1>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Work Location</label>
                  <input value={workAddress} onChange={e => setWorkAddress(e.target.value)} placeholder="Enter address" style={inputStyle} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Job Type</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['loading', 'unloading', 'both'] as const).map(jt => (
                      <button
                        key={jt}
                        onClick={() => setJobType(jt)}
                        style={{
                          flex: 1, padding: 12, borderRadius: 12,
                          border: jobType === jt ? '2px solid var(--teal)' : '1px solid var(--border-light)',
                          background: jobType === jt ? 'var(--teal-tint)' : '#fff',
                          color: jobType === jt ? 'var(--teal)' : 'var(--text-muted)',
                          fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          textTransform: 'capitalize',
                        }}
                      >{jt}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Duration: {hours} hours</label>
                  <input type="range" min={1} max={12} value={hours} onChange={e => setHours(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--teal)' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Goods Description</label>
                  <textarea value={goodsDesc} onChange={e => setGoodsDesc(e.target.value)} rows={3} placeholder="Describe what needs to be moved..."
                    style={{ ...inputStyle, height: 'auto', padding: '12px 16px', resize: 'none' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                    Floor Number {floor > 0 && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>(+₹{floor * 50})</span>}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => setFloor(Math.max(0, floor - 1))} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border-light)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={16} /></button>
                    <span style={{ fontSize: 15, fontWeight: 600, minWidth: 80, textAlign: 'center' }}>{floor === 0 ? 'Ground' : `Floor ${floor}`}</span>
                    <button onClick={() => setFloor(floor + 1)} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border-light)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={16} /></button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                  <label style={{ fontSize: 14, fontWeight: 500 }}>Heavy Goods (+₹200)</label>
                  <button onClick={() => setHeavyGoods(!heavyGoods)} style={{
                    width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
                    background: heavyGoods ? 'var(--teal)' : 'rgba(26,25,22,0.12)',
                    position: 'relative', transition: 'background 0.2s'
                  }}>
                    <motion.div animate={{ x: heavyGoods ? 26 : 2 }} style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3 }} />
                  </button>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Team Size</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => setTeamSize(Math.max(1, teamSize - 1))} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border-light)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={16} /></button>
                    <span style={{ fontSize: 18, fontWeight: 700, minWidth: 32, textAlign: 'center' }}>{teamSize}</span>
                    <button onClick={() => setTeamSize(Math.min(10, teamSize + 1))} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border-light)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={16} /></button>
                  </div>
                </div>

                <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{hours}h · Team of {teamSize}{heavyGoods ? ' · Heavy' : ''}{floor > 0 ? ` · Floor ${floor}` : ''}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Estimated total</div>
                  </div>
                  <span className="syne" style={{ fontWeight: 800, fontSize: 22, color: 'var(--teal)' }}>₹{hamaliEstimate}</span>
                </div>

                <button
                  onClick={goToProviders}
                  disabled={!workAddress}
                  style={{
                    width: '100%', height: 52, background: 'var(--teal)', color: '#fff',
                    borderRadius: 999, border: 'none', fontSize: 15, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    cursor: !workAddress ? 'not-allowed' : 'pointer',
                    opacity: !workAddress ? 0.5 : 1,
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Find providers <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <motion.div key="s3" {...slideProps} style={{ padding: '16px 20px 120px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <button onClick={() => setStep(2)} style={{ width: 36, height: 36, borderRadius: 10, background: '#fff', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <ChevronLeft size={18} />
                </button>
                <h1 className="syne" style={{ fontWeight: 700, fontSize: 20 }}>Choose provider</h1>
              </div>

              {loadingProviders ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginBottom: 4 }}>Finding providers near you...</div>
                  {[1, 2, 3].map(i => <Skeleton key={i} height={140} style={{ borderRadius: 16 }} />)}
                </div>
              ) : providers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', background: '#fff', borderRadius: 16, border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>😔</div>
                  <div className="syne" style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No providers nearby</div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 13 }}>Try again in a few minutes</div>
                  <button
                    onClick={goToProviders}
                    style={{ background: accent, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 999, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
                  >Retry</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {providers.map(p => (
                    <ProviderCard
                      key={p._id}
                      provider={p}
                      selected={selectedProvider?._id === p._id}
                      onSelect={() => setSelectedProvider(p)}
                      bookingType={bookingType!}
                    />
                  ))}
                </div>
              )}

              {selectedProvider && (
                <motion.div
                  initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  style={{ position: 'fixed', bottom: 20, left: 16, right: 16, maxWidth: 428, margin: '0 auto', background: 'var(--dark)', borderRadius: 16, padding: 14, display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-lg)', zIndex: 100 }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{selectedProvider.userId?.name || 'Provider'}</div>
                    <div className="syne" style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Confirm booking</div>
                  </div>
                  <button
                    onClick={confirmBooking}
                    style={{
                      background: accent, color: '#fff', border: 'none',
                      borderRadius: 999, padding: '12px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    Confirm
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* STEP 4 */}
          {step === 4 && booking && (
            <motion.div
              key="s4" {...slideProps}
              style={{ padding: '64px 24px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '90vh', textAlign: 'center' }}
            >
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 32px rgba(22,163,74,0.3)' }}
              >
                <Check size={52} color="#fff" strokeWidth={3} />
              </motion.div>
              <motion.h1
                variants={fadeUp} custom={1} initial="hidden" animate="show"
                className="syne"
                style={{ fontWeight: 800, fontSize: 30, marginTop: 28, letterSpacing: '-0.02em' }}
              >
                Booking confirmed!
              </motion.h1>
              <motion.p variants={fadeUp} custom={2} initial="hidden" animate="show" style={{ color: 'var(--text-muted)', fontSize: 15, marginTop: 8 }}>
                Your provider has been notified
              </motion.p>
              <motion.div
                variants={fadeUp} custom={3} initial="hidden" animate="show"
                className="mono syne"
                style={{ fontSize: 14, fontWeight: 700, marginTop: 12, padding: '6px 14px', borderRadius: 999, background: 'var(--bg)' }}
              >
                #{(booking.bookingId || booking._id).slice(-8).toUpperCase()}
              </motion.div>

              <motion.div
                variants={fadeUp} custom={4} initial="hidden" animate="show"
                style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300, marginTop: 36 }}
              >
                <button
                  onClick={() => router.push(`/bookings/${booking._id}`)}
                  style={{
                    width: '100%', height: 52, background: accent, color: '#fff',
                    borderRadius: 999, border: 'none', fontSize: 15, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'var(--font-body)',
                  }}
                >
                  Track your booking
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer', padding: 8 }}
                >
                  Back to home
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
