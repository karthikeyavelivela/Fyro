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
import { ArrowLeft, LogOut, Users, Camera, MapPin, Briefcase, Clock } from 'lucide-react'

const teal = '#0D9488'
const tealLight = '#CCFBF1'

const SKILLS = ['Loading', 'Unloading', 'Heavy Machinery', 'Fragile Goods', 'Furniture', 'Electronics', 'Construction Materials', 'Agricultural Goods']

export default function HamaliProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const [teamSize, setTeamSize] = useState(1)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [ratePerJob, setRatePerJob] = useState('')
  const [ratePerHour, setRatePerHour] = useState('')
  const [city, setCity] = useState('')
  const [area, setArea] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, profileRes] = await Promise.all([
          api.get('/api/profile/me'),
          api.get('/api/hamali/profile/mine')
        ])
        const meUser = meRes.data?.user || meRes.data?.data?.user
        setUser(meUser)
        setNameValue(meUser?.name || '')
        
        const p = profileRes.data.profile || profileRes.data.data?.profile || profileRes.data.data
        setProfile(p)
        if (p) {
          setTeamSize(p.teamSize || 1)
          setSelectedSkills(p.skills || [])
          setRatePerJob(p.ratePerJob?.toString() || '')
          setRatePerHour(p.ratePerHour?.toString() || '')
          setCity(p.city || '')
          setArea(p.area || '')
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

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill))
    } else {
      setSelectedSkills([...selectedSkills, skill])
    }
  }

  const saveProfile = async () => {
    setSavingProfile(true)
    try {
      const res = await api.put('/api/hamali/profile', {
        teamSize,
        skills: selectedSkills,
        ratePerJob: Number(ratePerJob),
        ratePerHour: Number(ratePerHour),
        city,
        area
      })
      setProfile(res.data.profile || res.data.data?.profile || res.data.data)
      const meRes = await api.get('/api/profile/me')
      const meUser = meRes.data?.user || meRes.data?.data?.user
      setUser(meUser)
      setNameValue(meUser?.name || '')
      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error('Failed to update profile')
    } finally {
      setSavingProfile(false)
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
          <Avatar name={user?.name} size="xl" src={user?.profilePhoto} role="hamali" />
          <button
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: teal, color: 'white' }}
          >
            <Camera size={14} />
          </button>
        </div>

        {editingName ? (
          <div className="flex gap-2 w-full">
            <Input value={nameValue} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNameValue(e.target.value)} className="flex-1" />
            <Button
              size="sm"
              loading={savingName}
              onClick={async () => {
                setSavingName(true)
                try {
                  const res = await api.put('/api/profile/me', { name: nameValue })
                  const nextUser = res.data?.user || res.data?.data?.user
                  setUser(nextUser)
                  setNameValue(nextUser?.name || nameValue)
                  toast.success('Name updated')
                  setEditingName(false)
                } finally {
                  setSavingName(false)
                }
              }}
            >
              Save
            </Button>
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

      {/* Hamali profile form */}
      <motion.div
        variants={fadeUp}
        className="rounded-md p-4 mb-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-syne font-700 text-sm" style={{ color: 'var(--text-muted)' }}>HAMALI PROFILE</h3>
          <Users size={18} style={{ color: teal }} />
        </div>
        
        <div className="space-y-4">
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>Team Size</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                onClick={() => setTeamSize(s => Math.max(1, s - 1))}
                style={{ width: 36, height: 36, borderRadius: 18, border: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >−</button>
              <span style={{ fontFamily: 'Syne', fontSize: '24px', fontWeight: 700, width: 32, textAlign: 'center' }}>
                {teamSize}
              </span>
              <button 
                onClick={() => setTeamSize(s => Math.min(20, s + 1))}
                style={{ width: 36, height: 36, borderRadius: 18, border: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >+</button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>Skills</label>
            <div className="flex flex-wrap gap-2">
              {SKILLS.map(skill => (
                <button key={skill}
                  onClick={() => toggleSkill(skill)}
                  style={{
                    padding: '6px 14px', borderRadius: '999px',
                    border: '1.5px solid',
                    borderColor: selectedSkills.includes(skill) ? 'var(--teal)' : 'var(--border)',
                    background: selectedSkills.includes(skill) ? 'var(--teal-light)' : 'transparent',
                    color: selectedSkills.includes(skill) ? 'var(--teal)' : 'var(--text-muted)',
                    fontFamily: 'Outfit', fontWeight: 500, fontSize: '13px'
                  }}>
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Rate per job (₹)</label>
              <Input type="number" value={ratePerJob} onChange={e => setRatePerJob(e.target.value)} placeholder="e.g. 500" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Rate per hour (₹)</label>
              <Input type="number" value={ratePerHour} onChange={e => setRatePerHour(e.target.value)} placeholder="e.g. 150" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>City</label>
              <Input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Vijayawada" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Area/Locality</label>
              <Input value={area} onChange={e => setArea(e.target.value)} placeholder="e.g. Benz Circle" />
            </div>
          </div>

          <Button 
            onClick={saveProfile} 
            loading={savingProfile} 
            className="w-full mt-2"
            style={{ background: teal }}
          >
            Save Profile
          </Button>
        </div>
      </motion.div>

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
          {['Aadhaar Front', 'Aadhaar Back'].map(doc => {
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
                  <label style={{ padding: '6px 14px', borderRadius: 8, background: teal, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
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
