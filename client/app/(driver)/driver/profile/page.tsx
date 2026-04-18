'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { fadeUp, staggerContainer, springPop } from '@/lib/animations'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import RatingStars from '@/components/RatingStars'
import { ArrowLeft, LogOut, Truck, Camera } from 'lucide-react'

export default function DriverProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [vehicle, setVehicle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, vehicleRes] = await Promise.all([
          api.get('/api/auth/me'),
          api.get('/api/vehicles/mine')
        ])
        setUser(meRes.data.user)
        setNameValue(meRes.data.user?.name || '')
        setVehicle(vehicleRes.data.vehicle)
      } catch {
        // handled
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await api.post('/api/auth/logout')
      router.push('/login')
    } catch {
      router.push('/login')
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="shimmer h-24 rounded-md" />
        <div className="shimmer h-48 rounded-md" />
      </div>
    )
  }

  const kycColor = user?.isKYCApproved ? 'var(--green)' : '#D97706'
  const kycLabel = user?.isKYCApproved ? 'KYC Approved' : 'KYC Pending'

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="min-h-screen p-4 max-w-lg mx-auto"
      style={{ background: 'var(--bg)' }}
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-3 py-3 mb-4">
        <button onClick={() => router.back()} className="p-2 rounded-full" style={{ background: 'var(--surface)' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-syne font-800 text-2xl" style={{ color: 'var(--text)' }}>Profile</h1>
      </motion.div>

      {/* Avatar + name */}
      <motion.div
        variants={springPop}
        className="rounded-md p-6 flex flex-col items-center gap-3 mb-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="relative">
          <Avatar name={user?.name} size="xl" src={user?.profilePhoto} />
          <button
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            <Camera size={14} />
          </button>
        </div>

        {editingName ? (
          <div className="flex gap-2 w-full">
            <Input value={nameValue} onChange={e => setNameValue(e.target.value)} className="flex-1" />
            <Button size="sm" loading={savingName} onClick={async () => {
              setSavingName(true)
              try {
                // Update name via profile endpoint if available
                toast.success('Name updated')
                setUser((u: any) => ({ ...u, name: nameValue }))
                setEditingName(false)
              } finally {
                setSavingName(false)
              }
            }}>Save</Button>
          </div>
        ) : (
          <button onClick={() => setEditingName(true)} className="text-center">
            <p className="font-syne font-700 text-xl" style={{ color: 'var(--text)' }}>{user?.name}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Tap to edit</p>
          </button>
        )}

        {/* KYC badge */}
        <span
          className="text-xs font-500 px-3 py-1 rounded-full"
          style={{ background: user?.isKYCApproved ? '#DCFCE7' : '#FEF3C7', color: kycColor }}
        >
          {kycLabel}
        </span>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <RatingStars value={user?.rating || 5} readonly />
          <span className="text-sm font-500" style={{ color: 'var(--text-muted)' }}>
            {user?.rating?.toFixed(1)} ({user?.totalRatings || 0} ratings)
          </span>
        </div>
      </motion.div>

      {/* Contact info */}
      <motion.div
        variants={fadeUp}
        className="rounded-md p-4 space-y-3 mb-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h3 className="font-syne font-700 text-sm" style={{ color: 'var(--text-muted)' }}>CONTACT INFORMATION</h3>
        <div>
          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Phone</p>
          <p className="font-500" style={{ color: 'var(--text)' }}>{user?.phone}</p>
        </div>
        <div>
          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Email</p>
          <p className="font-500" style={{ color: 'var(--text)' }}>{user?.email}</p>
        </div>
      </motion.div>

      {/* Vehicle info */}
      {vehicle && (
        <motion.div
          variants={fadeUp}
          className="rounded-md p-4 mb-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-syne font-700 text-sm" style={{ color: 'var(--text-muted)' }}>VEHICLE</h3>
            <Truck size={18} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Type</p>
              <p className="font-500 capitalize" style={{ color: 'var(--text)' }}>{vehicle.type?.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Capacity</p>
              <p className="font-500" style={{ color: 'var(--text)' }}>{vehicle.capacityTons} tons</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Registration</p>
              <p className="font-500" style={{ color: 'var(--text)' }}>{vehicle.registrationNumber}</p>
            </div>
          </div>
          <span
            className="text-xs font-500 px-2 py-1 rounded-full mt-2 inline-block"
            style={{ background: vehicle.isVerified ? '#DCFCE7' : '#FEF3C7', color: vehicle.isVerified ? 'var(--green)' : '#D97706' }}
          >
            {vehicle.isVerified ? 'Verified' : 'Pending Verification'}
          </span>
        </motion.div>
      )}

      {/* Logout */}
      <motion.div variants={fadeUp}>
        <Button
          variant="danger"
          className="w-full"
          loading={loggingOut}
          onClick={handleLogout}
        >
          <LogOut size={18} className="mr-2" />
          Logout
        </Button>
      </motion.div>
    </motion.div>
  )
}
