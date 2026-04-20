'use client'
import { useEffect, useRef, useState } from 'react'

interface LatLng { lat: number; lng: number }
interface Props {
  pickup?: LatLng & { address?: string }
  dropoff?: LatLng & { address?: string }
  driverLocation?: LatLng
  bookingStatus?: string
}

function haversine(a: LatLng, b: LatLng): number {
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

export default function LiveTrackingMapInner({ pickup, dropoff, driverLocation, bookingStatus }: Props) {
  const mapRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<{ pickup?: any; dropoff?: any; driver?: any }>({})
  const currentDriverPos = useRef<LatLng | null>(null)
  const targetDriverPos = useRef<LatLng | null>(null)
  const animFrameRef = useRef<number>()

  const [eta, setEta] = useState<string | null>(null)

  useEffect(() => {
    let L: any
    const init = async () => {
      // @ts-ignore
      await import('leaflet/dist/leaflet.css')
      const leaflet = await import('leaflet')
      L = leaflet.default

      // Fix default icon
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({ iconRetinaUrl: '', iconUrl: '', shadowUrl: '' })

      if (!containerRef.current || mapRef.current) return

      const center: [number, number] = pickup ? [pickup.lat, pickup.lng] : [17.385, 78.4867]
      mapRef.current = L.map(containerRef.current, { zoomControl: false }).setView(center, 13)

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© CartoDB', maxZoom: 19
      }).addTo(mapRef.current)

      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current)

      // Add markers
      const pickupSVG = `<div style="width:32px;height:32px;border-radius:50%;background:#FF6B2B;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-weight:700;color:white;font-size:13px">P</div>`
      const dropoffSVG = `<div style="width:32px;height:32px;border-radius:50%;background:#0F0E0C;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-weight:700;color:white;font-size:13px">D</div>`
      const driverSVG = `<div style="width:36px;height:36px;border-radius:50%;background:#FF6B2B;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(255,107,43,0.5);font-size:18px">🚛</div>`

      if (pickup) {
        markersRef.current.pickup = L.marker([pickup.lat, pickup.lng], {
          icon: L.divIcon({ html: pickupSVG, className: '', iconSize: [32, 32], iconAnchor: [16, 16] })
        }).addTo(mapRef.current).bindPopup(pickup.address || 'Pickup')
      }

      if (dropoff) {
        markersRef.current.dropoff = L.marker([dropoff.lat, dropoff.lng], {
          icon: L.divIcon({ html: dropoffSVG, className: '', iconSize: [32, 32], iconAnchor: [16, 16] })
        }).addTo(mapRef.current).bindPopup(dropoff.address || 'Dropoff')
      }

      if (driverLocation) {
        currentDriverPos.current = driverLocation
        targetDriverPos.current = driverLocation
        markersRef.current.driver = L.marker([driverLocation.lat, driverLocation.lng], {
          icon: L.divIcon({ html: driverSVG, className: '', iconSize: [36, 36], iconAnchor: [18, 18] })
        }).addTo(mapRef.current)
      }

      // Fit bounds
      const points: [number, number][] = []
      if (pickup) points.push([pickup.lat, pickup.lng])
      if (dropoff) points.push([dropoff.lat, dropoff.lng])
      if (driverLocation) points.push([driverLocation.lat, driverLocation.lng])
      if (points.length > 1) mapRef.current.fitBounds(points, { padding: [40, 40] })
    }

    init()
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current) return

    if (pickup && markersRef.current.pickup) {
      markersRef.current.pickup.setLatLng([pickup.lat, pickup.lng]).bindPopup(pickup.address || 'Pickup')
      mapRef.current.setView([pickup.lat, pickup.lng], 15, { animate: true })
    }

    if (dropoff && markersRef.current.dropoff) {
      markersRef.current.dropoff.setLatLng([dropoff.lat, dropoff.lng]).bindPopup(dropoff.address || 'Dropoff')
    }
  }, [pickup, dropoff])

  // Update driver location with smooth interpolation
  useEffect(() => {
    if (!driverLocation || !mapRef.current) return
    targetDriverPos.current = driverLocation

    // Update ETA
    if (dropoff || pickup) {
      const destination = dropoff || pickup
      const dist = haversine(driverLocation, destination!)
      const etaMins = Math.round((dist / 30) * 60)
      setEta(etaMins <= 1 ? '< 1 min' : `${etaMins} min`)
    }

    const animate = async () => {
      if (!currentDriverPos.current || !targetDriverPos.current) return
      const t = 0.08
      const newLat = lerp(currentDriverPos.current.lat, targetDriverPos.current.lat, t)
      const newLng = lerp(currentDriverPos.current.lng, targetDriverPos.current.lng, t)
      const dist = haversine(currentDriverPos.current, { lat: newLat, lng: newLng })
      if (dist < 0.001) return
      currentDriverPos.current = { lat: newLat, lng: newLng }

      if (markersRef.current.driver) {
        markersRef.current.driver.setLatLng([newLat, newLng])
        mapRef.current?.panTo([newLat, newLng], { animate: true, duration: 0.5 })
      }
      animFrameRef.current = requestAnimationFrame(animate)
    }

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    animFrameRef.current = requestAnimationFrame(animate)
  }, [driverLocation, pickup, dropoff])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {eta && (
        <div style={{
          position: 'absolute', top: 12, left: 12, zIndex: 1000,
          background: 'var(--accent)', color: 'white',
          padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700,
          boxShadow: 'var(--shadow-md)'
        }}>
          🚛 {eta} away
        </div>
      )}
    </div>
  )
}
