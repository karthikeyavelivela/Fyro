'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import LiveTrackingMap from '@/components/LiveTrackingMap'
import ProviderCard from '@/components/ProviderCard'
import Skeleton from '@/components/ui/Skeleton'
import { ArrowRight, Check, ChevronLeft, Package, Truck } from 'lucide-react'

type Coords = { lat: number; lng: number; address: string }
type Suggestion = { display_name: string; lat: string; lon: string }

const VEHICLE_TYPES = [
  { key: 'mini_truck', label: 'Mini Truck' },
  { key: 'tempo', label: 'Tempo' },
  { key: 'truck_407', label: 'Truck 407' },
  { key: 'truck_1ton', label: '1 Ton' },
  { key: 'truck_2ton', label: '2 Ton' },
  { key: 'heavy', label: 'Heavy' },
]

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function normalizeProviders(list: any[]) {
  return list.map((provider) => ({
    ...provider,
    userId: provider.userId || provider.driverId || provider.workerId || {},
    vehicleType: provider.type || provider.vehicleType,
    capacity: provider.capacityTons ? `${provider.capacityTons} ton` : undefined,
  }))
}

function BookPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const typeParam = searchParams.get('type') as 'transport' | 'hamali' | null

  const [step, setStep] = useState(typeParam ? 2 : 1)
  const [bookingType, setBookingType] = useState<'transport' | 'hamali' | null>(typeParam)
  const [pickup, setPickup] = useState<Coords | null>(null)
  const [dropoff, setDropoff] = useState<Coords | null>(null)
  const [pickupInput, setPickupInput] = useState('')
  const [dropoffInput, setDropoffInput] = useState('')
  const [workAddress, setWorkAddress] = useState('')
  const [pickupSuggestions, setPickupSuggestions] = useState<Suggestion[]>([])
  const [dropoffSuggestions, setDropoffSuggestions] = useState<Suggestion[]>([])
  const [workSuggestions, setWorkSuggestions] = useState<Suggestion[]>([])
  const [pickupLoading, setPickupLoading] = useState(false)
  const [vehicleType, setVehicleType] = useState('mini_truck')
  const [jobType, setJobType] = useState<'loading' | 'unloading' | 'both'>('loading')
  const [hours, setHours] = useState(2)
  const [goodsDesc, setGoodsDesc] = useState('')
  const [floor, setFloor] = useState(0)
  const [heavyGoods, setHeavyGoods] = useState(false)
  const [teamSize, setTeamSize] = useState(2)
  const [providers, setProviders] = useState<any[]>([])
  const [loadingProviders, setLoadingProviders] = useState(false)
  const [providersError, setProvidersError] = useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [booking, setBooking] = useState<any>(null)

  const pickupTimer = useRef<NodeJS.Timeout | null>(null)
  const dropoffTimer = useRef<NodeJS.Timeout | null>(null)
  const workTimer = useRef<NodeJS.Timeout | null>(null)

  const distanceKm = useMemo(() => pickup && dropoff ? haversine(pickup, dropoff) : 0, [pickup, dropoff])
  const estimatedFare = useMemo(() => {
    if (bookingType === 'hamali') {
      return Math.round((hours * 150 * teamSize) + (floor * 50) + (heavyGoods ? 200 : 0))
    }
    return Math.round((distanceKm * 12) + 300)
  }, [bookingType, distanceKm, hours, teamSize, floor, heavyGoods])

  const geocodeSearch = async (query: string) => {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`, {
      headers: { 'Accept-Language': 'en' }
    })
    return res.json()
  }

  const reverseGeocode = async (lat: number, lng: number) => {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
      headers: { 'Accept-Language': 'en' }
    })
    const data = await res.json()
    return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }

  const selectSuggestion = (type: 'pickup' | 'dropoff' | 'work', suggestion: Suggestion) => {
    const coords = { lat: Number(suggestion.lat), lng: Number(suggestion.lon), address: suggestion.display_name }
    if (type === 'pickup') {
      setPickup(coords)
      setPickupInput(coords.address)
      setPickupSuggestions([])
      return
    }
    if (type === 'dropoff') {
      setDropoff(coords)
      setDropoffInput(coords.address)
      setDropoffSuggestions([])
      return
    }
    setPickup(coords)
    setPickupInput(coords.address)
    setWorkAddress(coords.address)
    setWorkSuggestions([])
  }

  useEffect(() => {
    if (!navigator.geolocation) return
    setPickupLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        try {
          const address = await reverseGeocode(lat, lng)
          const next = { lat, lng, address }
          setPickup(next)
          setPickupInput(address)
          if (bookingType === 'hamali') setWorkAddress(address)
        } catch {
          const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
          setPickup({ lat, lng, address: fallback })
          setPickupInput(fallback)
        } finally {
          setPickupLoading(false)
        }
      },
      () => {
        const fallback = { lat: 16.5062, lng: 80.6480, address: 'Vijayawada, Andhra Pradesh' }
        setPickup(fallback)
        setPickupInput(fallback.address)
        setWorkAddress(fallback.address)
        setPickupLoading(false)
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    )
  }, [bookingType])

  const debouncedLookup = (
    value: string,
    setSuggestions: (items: Suggestion[]) => void,
    timerRef: React.MutableRefObject<NodeJS.Timeout | null>
  ) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!value.trim()) {
      setSuggestions([])
      return
    }
    timerRef.current = setTimeout(async () => {
      try {
        const items = await geocodeSearch(value)
        setSuggestions(Array.isArray(items) ? items : [])
      } catch {
        setSuggestions([])
      }
    }, 400)
  }

  const findProviders = async () => {
    setLoadingProviders(true)
    setProvidersError(null)
    setSelectedProvider(null)
    try {
      if (!pickup || (bookingType === 'transport' && !dropoff)) {
        toast.error('Add pickup and dropoff first')
        return
      }
      const endpoint = bookingType === 'transport' ? '/api/vehicles/available' : '/api/hamali/available'
      const params = bookingType === 'transport'
        ? { lat: pickup.lat, lng: pickup.lng, type: vehicleType }
        : { lat: pickup.lat, lng: pickup.lng }
      const res = await api.get(endpoint, { params })
      const data = res.data
      const raw = data?.vehicles || data?.profiles || data?.providers || data?.data?.vehicles || data?.data?.profiles || data?.data?.providers || data?.data || []
      const list = normalizeProviders(Array.isArray(raw) ? raw : [])
      setProviders(list)
      if (list.length === 0) {
        setProvidersError('No drivers available nearby. Try a different location or vehicle type.')
      }
      setStep(3)
    } catch (err: any) {
      setProvidersError('Could not find drivers right now. Please try again.')
      setStep(3)
    } finally {
      setLoadingProviders(false)
    }
  }

  const confirmBooking = async () => {
    try {
      if (!pickup) return
      const payload: any = {
        bookingType,
        pickup: { address: pickup.address, lat: pickup.lat, lng: pickup.lng },
      }
      if (bookingType === 'transport') {
        if (!dropoff) return
        payload.dropoff = { address: dropoff.address, lat: dropoff.lat, lng: dropoff.lng }
        payload.vehicleType = vehicleType
        payload.distanceKm = distanceKm
      } else {
        payload.hamaliDetails = {
          type: jobType,
          estimatedHours: hours,
          goodsDescription: goodsDesc,
          floorNumber: floor,
          heavyGoods,
          teamSize,
        }
      }
      const { data } = await api.post('/api/bookings', payload)
      setBooking(data?.booking || data?.data?.booking || data)
      toast.success(data?.message || 'Booking created')
      setStep(4)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create booking')
    }
  }

  const slideProps = {
    initial: { opacity: 0, x: 60 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -60 },
    transition: { duration: 0.3 }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 52,
    borderRadius: 12,
    border: '1px solid var(--border-light)',
    background: 'var(--surface)',
    padding: '0 16px',
    fontSize: 16,
    outline: 'none',
    color: 'var(--text)',
    fontFamily: 'var(--font-body)'
  }

  const suggestionsList = (items: Suggestion[], type: 'pickup' | 'dropoff' | 'work') => (
    items.length > 0 && (
      <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', marginTop: 8, overflow: 'hidden' }}>
        {items.map((item, index) => (
          <button key={`${type}-${item.lat}-${item.lon}-${index}`} onClick={() => selectSuggestion(type, item)} style={{ width: '100%', textAlign: 'left', padding: '12px 14px', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: index === items.length - 1 ? 'none' : '1px solid var(--border)' }}>
            {item.display_name}
          </button>
        ))}
      </div>
    )
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" {...slideProps} style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 10, background: '#fff', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <ChevronLeft size={18} />
                </button>
                <h1 className="font-display" style={{ fontWeight: 700, fontSize: 22, margin: 0 }}>What do you need?</h1>
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                <button onClick={() => { setBookingType('transport'); setStep(2) }} style={{ width: '100%', height: 140, borderRadius: 20, background: 'var(--orange)', color: '#fff', textAlign: 'left', padding: '22px 24px', border: 'none', cursor: 'pointer', position: 'relative' }}>
                  <div className="font-display" style={{ fontSize: 24, fontWeight: 700 }}>Book a Truck</div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.82)', marginTop: 4 }}>Move goods across the city</div>
                  <Truck size={96} color="rgba(255,255,255,0.2)" style={{ position: 'absolute', right: 10, bottom: 10 }} />
                </button>
                <button onClick={() => { setBookingType('hamali'); setStep(2) }} style={{ width: '100%', height: 140, borderRadius: 20, background: 'var(--teal)', color: '#fff', textAlign: 'left', padding: '22px 24px', border: 'none', cursor: 'pointer', position: 'relative' }}>
                  <div className="font-display" style={{ fontSize: 24, fontWeight: 700 }}>Book Hamali</div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.82)', marginTop: 4 }}>Loading and unloading workers</div>
                  <Package size={96} color="rgba(255,255,255,0.2)" style={{ position: 'absolute', right: 10, bottom: 10 }} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && bookingType === 'transport' && (
            <motion.div key="transport" {...slideProps}>
              <div style={{ height: '42vh' }}>
                <LiveTrackingMap pickup={pickup || undefined} dropoff={dropoff || undefined} />
              </div>
              <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', marginTop: -20, padding: '20px 20px 32px', position: 'relative', zIndex: 2 }}>
                <div style={{ width: 36, height: 4, borderRadius: 999, background: 'rgba(0,0,0,0.12)', margin: '0 auto 16px' }} />
                <div style={{ display: 'grid', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Pickup</label>
                    <input value={pickupInput} onChange={(e) => { setPickupInput(e.target.value); debouncedLookup(e.target.value, setPickupSuggestions, pickupTimer) }} style={inputStyle} placeholder={pickupLoading ? 'Detecting your location...' : 'Enter pickup address'} />
                    {suggestionsList(pickupSuggestions, 'pickup')}
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Dropoff</label>
                    <input value={dropoffInput} onChange={(e) => { setDropoffInput(e.target.value); debouncedLookup(e.target.value, setDropoffSuggestions, dropoffTimer) }} style={inputStyle} placeholder="Enter dropoff address" />
                    {suggestionsList(dropoffSuggestions, 'dropoff')}
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Vehicle type</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {VEHICLE_TYPES.map((vehicle) => {
                        const selected = vehicleType === vehicle.key
                        return (
                          <button key={vehicle.key} onClick={() => setVehicleType(vehicle.key)} style={{ padding: 14, borderRadius: 14, border: selected ? '2px solid var(--orange)' : '1px solid var(--border-light)', background: selected ? 'var(--orange-tint)' : '#fff', textAlign: 'left', cursor: 'pointer' }}>
                            <div style={{ fontWeight: 700 }}>{vehicle.label}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', borderRadius: 14, padding: '14px 16px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{distanceKm.toFixed(1)} km</span>
                    <span className="fare-number" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--orange)' }}>₹{estimatedFare}</span>
                  </div>
                  <button onClick={findProviders} disabled={!pickup || !dropoff} style={{ width: '100%', height: 52, background: 'var(--orange)', color: '#fff', borderRadius: 999, border: 'none', fontSize: 15, fontWeight: 600, cursor: !pickup || !dropoff ? 'not-allowed' : 'pointer', opacity: !pickup || !dropoff ? 0.5 : 1 }}>
                    Find providers <ArrowRight size={16} style={{ display: 'inline', marginLeft: 6 }} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && bookingType === 'hamali' && (
            <motion.div key="hamali" {...slideProps} style={{ padding: '16px 20px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <button onClick={() => setStep(1)} style={{ width: 36, height: 36, borderRadius: 10, background: '#fff', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <ChevronLeft size={18} />
                </button>
                <h1 className="font-display" style={{ fontWeight: 700, fontSize: 22, margin: 0 }}>Book Hamali</h1>
              </div>
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Work location</label>
                  <input value={workAddress} onChange={(e) => { setWorkAddress(e.target.value); debouncedLookup(e.target.value, setWorkSuggestions, workTimer) }} style={inputStyle} placeholder="Enter address" />
                  {suggestionsList(workSuggestions, 'work')}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Job type</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['loading', 'unloading', 'both'] as const).map((type) => (
                      <button key={type} onClick={() => setJobType(type)} style={{ flex: 1, padding: 12, borderRadius: 12, border: jobType === type ? '2px solid var(--teal)' : '1px solid var(--border-light)', background: jobType === type ? 'var(--teal-tint)' : '#fff', cursor: 'pointer', textTransform: 'capitalize' }}>
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Hours: {hours}</label>
                  <input type="range" min={1} max={12} value={hours} onChange={(e) => setHours(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--teal)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Goods description</label>
                  <textarea value={goodsDesc} onChange={(e) => setGoodsDesc(e.target.value)} rows={3} style={{ ...inputStyle, height: 110, padding: 14, resize: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Floor</label>
                    <input type="number" min={0} value={floor} onChange={(e) => setFloor(Number(e.target.value))} style={inputStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Team size</label>
                    <input type="number" min={1} value={teamSize} onChange={(e) => setTeamSize(Number(e.target.value))} style={inputStyle} />
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                  <input type="checkbox" checked={heavyGoods} onChange={(e) => setHeavyGoods(e.target.checked)} />
                  Heavy goods
                </label>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', borderRadius: 14, padding: '14px 16px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{jobType}</span>
                  <span className="fare-number" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--teal)' }}>₹{estimatedFare}</span>
                </div>
                <button onClick={findProviders} disabled={!pickup} style={{ width: '100%', height: 52, background: 'var(--teal)', color: '#fff', borderRadius: 999, border: 'none', fontSize: 15, fontWeight: 600, cursor: !pickup ? 'not-allowed' : 'pointer', opacity: !pickup ? 0.5 : 1 }}>
                  Find providers <ArrowRight size={16} style={{ display: 'inline', marginLeft: 6 }} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="providers" {...slideProps} style={{ padding: '16px 20px 120px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <button onClick={() => setStep(2)} style={{ width: 36, height: 36, borderRadius: 10, background: '#fff', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <ChevronLeft size={18} />
                </button>
                <h1 className="font-display" style={{ fontWeight: 700, fontSize: 20, margin: 0 }}>Choose provider</h1>
              </div>
              {loadingProviders ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  {[1, 2, 3].map((i) => <Skeleton key={i} height={140} style={{ borderRadius: 16 }} />)}
                </div>
              ) : providersError ? (
                <div style={{ textAlign:'center', padding:'32px 20px' }}>
                  <div style={{ fontSize:'40px', marginBottom:'12px' }}>🚫</div>
                  <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:'18px' }}>
                    {providersError}
                  </h3>
                  <button onClick={findProviders}
                    style={{ marginTop:'16px', background:'var(--orange)', color:'white', border:'none', borderRadius:'999px', padding:'10px 24px', cursor:'pointer' }}>
                    Try Again
                  </button>
                </div>
              ) : providers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', background: '#fff', borderRadius: 16, border: '1px solid var(--border-light)' }}>
                  <div className="font-display" style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No providers nearby</div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 13 }}>Your booking can still be created and providers will be notified when they come online.</div>
                  <button onClick={confirmBooking} style={{ background: bookingType === 'hamali' ? 'var(--teal)' : 'var(--orange)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 999, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                    Create booking anyway
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {providers.map((provider) => (
                    <ProviderCard key={provider._id} provider={provider} selected={selectedProvider?._id === provider._id} onSelect={() => setSelectedProvider(provider)} bookingType={bookingType!} />
                  ))}
                </div>
              )}
              {selectedProvider && (
                <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ position: 'fixed', bottom: 20, left: 16, right: 16, maxWidth: 488, margin: '0 auto', background: 'var(--dark)', borderRadius: 16, padding: 14, display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-lg)', zIndex: 100 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{selectedProvider.userId?.name || 'Provider'}</div>
                    <div className="font-display" style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Confirm booking</div>
                  </div>
                  <button onClick={confirmBooking} style={{ background: bookingType === 'hamali' ? 'var(--teal)' : 'var(--orange)', color: '#fff', border: 'none', borderRadius: 999, padding: '12px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    Confirm
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {step === 4 && booking && (
            <motion.div key="success" {...slideProps} style={{ padding: '64px 24px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '90vh', textAlign: 'center' }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }} style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={52} color="#fff" strokeWidth={3} />
              </motion.div>
              <h1 className="font-display" style={{ fontWeight: 800, fontSize: 30, marginTop: 28 }}>Booking confirmed!</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 15, marginTop: 8 }}>Your booking is live and nearby providers are being notified.</p>
              <div className="booking-id" style={{ fontSize: 14, fontWeight: 700, marginTop: 12, padding: '6px 14px', borderRadius: 999, background: 'var(--bg)', fontFamily: 'var(--font-display)' }}>
                #{String(booking.bookingId || booking._id).slice(-8).toUpperCase()}
              </div>
              <div style={{ display: 'grid', gap: 10, width: '100%', maxWidth: 300, marginTop: 36 }}>
                <button onClick={() => router.push(`/bookings/${booking.bookingId || booking._id}`)} style={{ width: '100%', height: 52, background: bookingType === 'hamali' ? 'var(--teal)' : 'var(--orange)', color: '#fff', borderRadius: 999, border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                  Track your booking
                </button>
                <button onClick={() => router.push('/dashboard')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer', padding: 8 }}>
                  Back to home
                </button>
              </div>
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
