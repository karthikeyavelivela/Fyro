'use client'
import dynamic from 'next/dynamic'

const MapInner = dynamic(() => import('./LiveTrackingMapInner'), {
  ssr: false,
  loading: () => <div className="shimmer" style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-md)' }} />
})

export default function LiveTrackingMap(props: any) {
  return <MapInner {...props} />
}
