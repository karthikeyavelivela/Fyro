'use client'
import { motion } from 'framer-motion'
import { springPop } from '@/lib/animations'
import Avatar from './ui/Avatar'
import { CheckCircle, Clock } from 'lucide-react'

interface Provider {
  _id: string
  userId?: { name?: string; photo?: string; rating?: number; ratingCount?: number; isKYCApproved?: boolean }
  vehicleType?: string
  capacity?: string
  teamSize?: number
  skills?: string[]
  estimatedFare?: number
  distanceKm?: number
}

interface Props {
  provider: Provider
  selected: boolean
  onSelect: () => void
  bookingType: 'transport' | 'hamali'
}

export default function ProviderCard({ provider, selected, onSelect, bookingType }: Props) {
  const isHamali = bookingType === 'hamali'
  const name = provider.userId?.name || 'Provider'
  const rating = provider.userId?.rating ?? 4.5
  const ratingCount = provider.userId?.ratingCount ?? 0
  const isKYC = provider.userId?.isKYCApproved
  const accentColor = isHamali ? 'var(--teal)' : 'var(--accent)'
  const accentLight = isHamali ? 'var(--teal-light)' : 'var(--accent-light)'

  return (
    <motion.div
      variants={springPop}
      initial="hidden"
      animate="show"
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        border: `1.5px solid ${selected ? accentColor : 'var(--border)'}`,
        boxShadow: selected ? `0 0 0 3px ${isHamali ? 'rgba(13,148,136,0.15)' : 'rgba(255,107,43,0.15)'}` : 'var(--shadow-sm)',
        cursor: 'pointer',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        position: 'relative'
      }}>

      {/* Checkmark if selected */}
      {selected && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{
          position: 'absolute', top: 12, right: 12,
          width: 24, height: 24, borderRadius: '50%',
          background: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </motion.div>
      )}

      <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
        <Avatar name={name} src={provider.userId?.photo} size="md" />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16 }}>{name}</span>
            {isKYC && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, background: accentLight, color: accentColor, fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 999 }}>
                <CheckCircle size={10} /> Verified
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="#FF6B2B"><path d="M7 1l1.8 3.6L13 5.3l-3 2.9.7 4.1L7 10.2l-3.7 2.1.7-4.1-3-2.9 4.2-.7z" /></svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{rating.toFixed(1)}</span>
            <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>({ratingCount})</span>
          </div>
          {provider.distanceKm !== undefined && (
            <span style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)', fontSize: 12, padding: '2px 8px', borderRadius: 6 }}>
              {provider.distanceKm.toFixed(1)} km away
            </span>
          )}
        </div>
      </div>

      {/* Info row */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 14 }}>
        {!isHamali && provider.vehicleType && (
          <span style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)', fontSize: 12, padding: '4px 10px', borderRadius: 6, fontWeight: 500 }}>
            {provider.vehicleType.replace(/_/g, ' ')}
          </span>
        )}
        {!isHamali && provider.capacity && (
          <span style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)', fontSize: 12, padding: '4px 10px', borderRadius: 6 }}>
            {provider.capacity}
          </span>
        )}
        {isHamali && provider.teamSize && (
          <span style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)', fontSize: 12, padding: '4px 10px', borderRadius: 6 }}>
            Team of {provider.teamSize}
          </span>
        )}
        {isHamali && provider.skills?.slice(0, 3).map(s => (
          <span key={s} style={{ background: accentLight, color: accentColor, fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 500 }}>{s}</span>
        ))}
      </div>

      {/* Footer: responds + fare + select */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-faint)', fontSize: 12 }}>
          <Clock size={12} /> Usually responds in ~2 min
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {provider.estimatedFare !== undefined && (
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: accentColor }}>
              ₹{provider.estimatedFare}
            </span>
          )}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={e => { e.stopPropagation(); onSelect() }}
            style={{
              background: selected ? accentColor : 'transparent',
              color: selected ? 'white' : accentColor,
              border: `1.5px solid ${accentColor}`,
              padding: '8px 16px', borderRadius: 'var(--radius-sm)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif'
            }}>
            {selected ? 'Selected' : 'Select'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
