'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { Truck, Package, Users, ChevronLeft, Eye, EyeOff, Plus, Minus } from 'lucide-react'
import { fadeUp, staggerContainer } from '@/lib/animations'

type Role = 'customer' | 'driver' | 'hamali'
type Lang = 'EN' | 'HI' | 'TE'

const VEHICLE_TYPES = ['mini_truck', 'tempo', 'truck_407', 'truck_1ton', 'truck_2ton', 'heavy']
const SKILLS = ['Heavy Lifting', 'Furniture', 'Electronics', 'Fragile Items', 'Packing', 'Unpacking']

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Common fields
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [lang, setLang] = useState<Lang>('EN')

  // Driver fields
  const [vehicleType, setVehicleType] = useState('')
  const [regNumber, setRegNumber] = useState('')

  // Hamali fields
  const [teamSize, setTeamSize] = useState(1)
  const [ratePerJob, setRatePerJob] = useState('')
  const [ratePerHour, setRatePerHour] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [city, setCity] = useState('')
  const [area, setArea] = useState('')

  const selectRole = (r: Role) => { setRole(r); setStep(2) }

  const toggleSkill = (s: string) => {
    setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const validate = () => {
    if (!name.trim()) { toast.error('Name is required'); return false }
    if (!/^\d{10}$/.test(phone)) { toast.error('Enter a valid 10-digit phone number'); return false }
    if (!email.includes('@')) { toast.error('Enter a valid email'); return false }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return false }
    if (password !== confirm) { toast.error('Passwords do not match'); return false }
    if (role === 'driver' && !vehicleType) { toast.error('Select vehicle type'); return false }
    if (role === 'driver' && !regNumber.trim()) { toast.error('Registration number is required'); return false }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const payload: any = { name, phone, email, password, role, language: lang }
      if (role === 'driver') { payload.vehicleType = vehicleType; payload.registrationNumber = regNumber }
      if (role === 'hamali') { payload.teamSize = teamSize; payload.ratePerJob = Number(ratePerJob); payload.ratePerHour = Number(ratePerHour); payload.skills = skills; payload.city = city; payload.area = area }
      await api.post('/api/auth/register', payload)
      toast.success('Account created! Please login.')
      router.push('/login')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', background: 'var(--surface-raised)', border: '1.5px solid var(--border-strong)',
    borderRadius: 'var(--radius-sm)', padding: '14px 16px', fontSize: 16, color: 'var(--text)',
    outline: 'none', fontFamily: 'Outfit, sans-serif'
  }

  const labelStyle = { display: 'block' as const, fontSize: 14, fontWeight: 500, marginBottom: 6, color: 'var(--text)' }

  const roleCards = [
    { r: 'customer' as Role, icon: Package, label: 'Customer', sub: "I'm sending goods", color: 'var(--accent)', bg: 'var(--accent-light)' },
    { r: 'driver' as Role, icon: Truck, label: 'Truck Driver', sub: 'I drive trucks', color: 'var(--accent)', bg: 'var(--accent-light)' },
    { r: 'hamali' as Role, icon: Users, label: 'Hamali Worker', sub: 'I provide loading services', color: 'var(--teal)', bg: 'var(--teal-light)' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 800, color: 'white', fontSize: 18 }}>F</div>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20 }}>FYRO</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.35 }}>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontSize: 13, color: 'var(--text-faint)', marginBottom: 8 }}>Step 1 of 2</div>
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, marginBottom: 8 }}>Choose your role</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>How will you use FYRO?</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {roleCards.map(rc => (
                  <motion.div key={rc.r} whileTap={{ scale: 0.98 }} whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }} onClick={() => selectRole(rc.r)}
                    style={{
                      background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '20px 24px',
                      border: '1.5px solid var(--border-strong)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 16, boxShadow: 'var(--shadow-sm)'
                    }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: rc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <rc.icon size={24} color={rc.color} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 17, marginBottom: 3 }}>{rc.label}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{rc.sub}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>
                Already have an account? <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Login</Link>
              </div>
            </motion.div>
          )}

          {step === 2 && role && (
            <motion.div key="step2" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.35 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <button onClick={() => setStep(1)} style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <ChevronLeft size={18} />
                </button>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>Step 2 of 2</div>
                  <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 22 }}>Create your account</h1>
                </div>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Ravi Kumar" style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Phone Number</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" maxLength={10} style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" style={{ ...inputStyle, paddingRight: 48 }} />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                      {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter password" style={{ ...inputStyle, paddingRight: 48 }} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                      {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {/* Language selector */}
                <div>
                  <label style={labelStyle}>Preferred Language</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['EN', 'HI', 'TE'] as Lang[]).map(l => (
                      <button key={l} type="button" onClick={() => setLang(l)} style={{
                        flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)',
                        border: '1.5px solid', borderColor: lang === l ? 'var(--accent)' : 'var(--border-strong)',
                        background: lang === l ? 'var(--accent-light)' : 'transparent',
                        color: lang === l ? 'var(--accent)' : 'var(--text-muted)',
                        fontWeight: 600, fontSize: 14, cursor: 'pointer'
                      }}>{l}</button>
                    ))}
                  </div>
                </div>

                {/* Driver extra fields */}
                {role === 'driver' && (
                  <>
                    <div>
                      <label style={labelStyle}>Vehicle Type</label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {VEHICLE_TYPES.map(vt => (
                          <button key={vt} type="button" onClick={() => setVehicleType(vt)} style={{
                            padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500,
                            border: '1.5px solid', borderColor: vehicleType === vt ? 'var(--accent)' : 'var(--border-strong)',
                            background: vehicleType === vt ? 'var(--accent-light)' : 'transparent',
                            color: vehicleType === vt ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer'
                          }}>{vt.replace(/_/g, ' ')}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Vehicle Registration Number</label>
                      <input value={regNumber} onChange={e => setRegNumber(e.target.value.toUpperCase())} placeholder="TS 09 EA 1234" style={inputStyle} />
                    </div>
                  </>
                )}

                {/* Hamali extra fields */}
                {role === 'hamali' && (
                  <>
                    <div>
                      <label style={labelStyle}>Team Size</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <button type="button" onClick={() => setTeamSize(Math.max(1, teamSize - 1))} style={{ width: 36, height: 36, borderRadius: 8, border: '1.5px solid var(--border-strong)', background: 'var(--surface-raised)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={16} /></button>
                        <span style={{ fontSize: 18, fontWeight: 700, minWidth: 32, textAlign: 'center' }}>{teamSize}</span>
                        <button type="button" onClick={() => setTeamSize(Math.min(10, teamSize + 1))} style={{ width: 36, height: 36, borderRadius: 8, border: '1.5px solid var(--border-strong)', background: 'var(--surface-raised)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={16} /></button>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={labelStyle}>Rate per Job (₹)</label>
                        <input type="number" value={ratePerJob} onChange={e => setRatePerJob(e.target.value)} placeholder="500" style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Rate per Hour (₹)</label>
                        <input type="number" value={ratePerHour} onChange={e => setRatePerHour(e.target.value)} placeholder="150" style={inputStyle} />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Skills</label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {SKILLS.map(s => (
                          <button key={s} type="button" onClick={() => toggleSkill(s)} style={{
                            padding: '6px 12px', borderRadius: 999, fontSize: 13, fontWeight: 500,
                            border: '1.5px solid', borderColor: skills.includes(s) ? 'var(--teal)' : 'var(--border-strong)',
                            background: skills.includes(s) ? 'var(--teal-light)' : 'transparent',
                            color: skills.includes(s) ? 'var(--teal)' : 'var(--text-muted)', cursor: 'pointer'
                          }}>{s}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={labelStyle}>City</label>
                        <input value={city} onChange={e => setCity(e.target.value)} placeholder="Hyderabad" style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Area</label>
                        <input value={area} onChange={e => setArea(e.target.value)} placeholder="Ameerpet" style={inputStyle} />
                      </div>
                    </div>
                  </>
                )}

                <motion.button type="submit" disabled={loading}
                  whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }} whileTap={{ scale: 0.97 }}
                  style={{
                    width: '100%', border: 'none', borderRadius: 'var(--radius-md)', padding: '18px', fontSize: 16, fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                    fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: role === 'hamali' ? 'var(--teal)' : 'var(--accent)', color: 'white'
                  }}>
                  {loading ? (
                    <><span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Creating account...</>
                  ) : 'Create Account'}
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
