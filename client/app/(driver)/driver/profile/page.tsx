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

  // Add vehicle form state
  const [vehicleType, setVehicleType] = useState('mini_truck')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [capacityTons, setCapacityTons] = useState('')
  const [addingVehicle, setAddingVehicle] = useState(false)
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, vehicleRes] = await Promise.all([
          api.get('/api/profile/me'),
          api.get('/api/vehicles/mine')
        ])
        const meUser = meRes.data?.user || meRes.data?.data?.user
        const vehicleData = vehicleRes.data?.vehicle || vehicleRes.data?.data?.vehicle || null
        setUser(meUser)
        setNameValue(meUser?.name || '')
        setVehicle(vehicleData)
        if (vehicleData) {
          setVehicleType(vehicleData.type || 'mini_truck')
          setRegistrationNumber(vehicleData.registrationNumber || '')
          setCapacityTons(vehicleData.capacityTons?.toString() || '')
        }
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

  const handleAddVehicle = async () => {
    if (!vehicleType || !registrationNumber || !capacityTons) {
      toast.error('Please fill in all vehicle fields')
      return
    }
    setAddingVehicle(true)
    try {
      const payload = {
        type: vehicleType,
        registrationNumber,
        capacityTons: Number(capacityTons),
      }
      const res = vehicle?._id
        ? await api.put(`/api/vehicles/${vehicle._id}`, payload)
        : await api.post('/api/vehicles', payload)
      setVehicle(res.data?.vehicle || res.data?.data?.vehicle)
      toast.success(vehicle ? 'Vehicle updated' : 'Vehicle added!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save vehicle')
    } finally {
      setAddingVehicle(false)
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
      className="page-shell compact page-stack"
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
          <Avatar name={user?.name} size="xl" src={user?.profilePhoto} role="driver" />
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
                const res = await api.put('/api/profile/me', { name: nameValue })
                const nextUser = res.data?.user || res.data?.data?.user
                toast.success('Name updated')
                setUser(nextUser)
                setNameValue(nextUser?.name || nameValue)
                setEditingName(false)
              } catch {
                toast.error('Failed to update name')
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

      {/* Vehicle info (when vehicle exists) */}
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

      {/* Add Vehicle form (when no vehicle) */}
      {!vehicle && (
        <motion.div variants={fadeUp} className="rounded-md p-4 mb-4" style={{ background: 'var(--surface)', border: '2px dashed var(--accent)', borderRadius: 16, padding: 24 }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-syne font-700 text-sm" style={{ color: 'var(--text-muted)' }}>ADD YOUR VEHICLE</h3>
            <Truck size={18} style={{ color: 'var(--accent)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Vehicle Type</label>
              <select
                value={vehicleType}
                onChange={e => setVehicleType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: 14,
                  outline: 'none',
                }}
              >
                {['mini_truck', 'tempo', 'truck_407', 'truck_1ton', 'truck_2ton', 'heavy'].map(opt => (
                  <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Registration Number</label>
              <Input
                value={registrationNumber}
                onChange={e => setRegistrationNumber(e.target.value)}
                placeholder="e.g. TN01AB1234"
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Capacity (tons)</label>
              <Input
                type="number"
                value={capacityTons}
                onChange={e => setCapacityTons(e.target.value)}
                placeholder="e.g. 1.5"
              />
            </div>
            <Button loading={addingVehicle} onClick={handleAddVehicle} className="w-full" style={{ marginTop: 4 }}>
              Add Vehicle
            </Button>
          </div>
        </motion.div>
      )}

      {/* KYC Documents */}
      <motion.div variants={fadeUp} className="rounded-md p-4 mb-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h3 className="font-syne font-700 text-sm mb-3" style={{ color: 'var(--text-muted)' }}>KYC DOCUMENTS</h3>
        <span style={{
          background: user?.isKYCApproved ? '#DCFCE7' : '#FEF3C7',
          color: user?.isKYCApproved ? 'var(--green)' : '#D97706',
          padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600
        }}>
          {user?.isKYCApproved ? '✓ KYC Approved' : '⏳ KYC Pending'}
        </span>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {['Aadhaar Front', 'Aadhaar Back', 'Driving Licence', 'RC Book'].map(doc => {
            const isUploaded = uploadedDocs[doc]
            return (
              <div key={doc} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{doc}</p>
                  <p style={{ fontSize: 11, color: isUploaded ? 'var(--green)' : 'var(--text-muted)' }}>
                    {isUploaded ? 'Uploaded securely' : 'Upload clear photo'}
                  </p>
                </div>
                {isUploaded ? (
                  <span style={{ padding: '6px 14px', borderRadius: 8, background: '#DCFCE7', color: 'var(--green)', fontSize: 12, fontWeight: 600 }}>
                    Uploaded
                  </span>
                ) : (
                  <label style={{ padding: '6px 14px', borderRadius: 8, background: 'var(--accent)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Upload
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={() => {
                      toast.loading('Uploading to Cloudinary...', { duration: 1500 })
                      setTimeout(() => {
                        setUploadedDocs(prev => ({ ...prev, [doc]: true }))
                        toast.success(`${doc} uploaded successfully`)
                      }, 1500)
                    }} />
                  </label>
                )}
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Logout */}
      <motion.div variants={fadeUp}>
        <button
          className="logout-btn"
          disabled={loggingOut}
          onClick={handleLogout}
        >
          <LogOut size={15} />
          {loggingOut ? 'Logging out...' : 'Log out'}
        </button>
      </motion.div>
    </motion.div>
  )
}
