'use client'

import { useEffect, useRef } from 'react'

interface Props {
  pickup?: { lat?: number; lng?: number; address?: string } | null
  dropoff?: { lat?: number; lng?: number; address?: string } | null
  driverLocation?: { lat: number; lng: number } | null
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export default function TrackingMapInner({ pickup, dropoff, driverLocation }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const driverMarkerRef = useRef<any>(null)
  const targetRef = useRef({ lat: 0, lng: 0 })
  const currentRef = useRef({ lat: 0, lng: 0 })
  const frameRef = useRef<number>(0)
  const animatingRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let L: any
    const init = async () => {
      L = (await import('leaflet')).default
      // @ts-ignore - CSS module import
      await import('leaflet/dist/leaflet.css')

      const centerLat = pickup?.lat ?? 17.385
      const centerLng = pickup?.lng ?? 78.4867

      const map = L.map(containerRef.current!, {
        center: [centerLat, centerLng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      L.control.zoom({ position: 'bottomright' }).addTo(map)

      const dotIcon = (color: string, label: string) =>
        L.divIcon({
          className: '',
          html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.25);position:relative;">
            <div style="position:absolute;top:-22px;left:50%;transform:translateX(-50%);white-space:nowrap;font-family:Outfit,sans-serif;font-size:10px;font-weight:600;color:#1A1916;background:#fff;padding:2px 6px;border-radius:6px;box-shadow:0 1px 4px rgba(0,0,0,0.15);">${label}</div>
          </div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        })

      const truckIcon = L.divIcon({
        className: '',
        html: `<div style="font-size:26px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));transform-origin:center;">🚛</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })

      if (pickup?.lat && pickup?.lng) {
        L.marker([pickup.lat, pickup.lng], { icon: dotIcon('#FF6B2B', 'Pickup') }).addTo(map)
      }
      if (dropoff?.lat && dropoff?.lng) {
        L.marker([dropoff.lat, dropoff.lng], { icon: dotIcon('#0D9488', 'Drop') }).addTo(map)
      }

      if (pickup?.lat && pickup?.lng && dropoff?.lat && dropoff?.lng) {
        const bounds = L.latLngBounds([
          [pickup.lat, pickup.lng],
          [dropoff.lat, dropoff.lng],
        ])
        map.fitBounds(bounds, { padding: [60, 60] })

        L.polyline(
          [[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]],
          { color: '#FF6B2B', weight: 2.5, opacity: 0.4, dashArray: '8, 6' }
        ).addTo(map)
      }

      const driverMarker = L.marker([centerLat, centerLng], { icon: truckIcon }).addTo(map)
      driverMarkerRef.current = driverMarker
      mapRef.current = map

      currentRef.current = { lat: centerLat, lng: centerLng }
      targetRef.current = { lat: centerLat, lng: centerLng }
    }

    init()

    return () => {
      cancelAnimationFrame(frameRef.current)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        driverMarkerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!driverLocation || !driverMarkerRef.current) return

    targetRef.current = { lat: driverLocation.lat, lng: driverLocation.lng }

    if (animatingRef.current) return
    animatingRef.current = true

    const tick = () => {
      const dx = Math.abs(currentRef.current.lat - targetRef.current.lat)
      const dy = Math.abs(currentRef.current.lng - targetRef.current.lng)
      if (dx < 0.000001 && dy < 0.000001) {
        animatingRef.current = false
        return
      }
      currentRef.current.lat = lerp(currentRef.current.lat, targetRef.current.lat, 0.08)
      currentRef.current.lng = lerp(currentRef.current.lng, targetRef.current.lng, 0.08)
      driverMarkerRef.current?.setLatLng([currentRef.current.lat, currentRef.current.lng])
      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
  }, [driverLocation])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', minHeight: 300 }}
    />
  )
}
