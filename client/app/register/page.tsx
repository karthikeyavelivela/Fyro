'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { User, Truck, Package, ChevronLeft, Eye, EyeOff, Plus, Minus, ArrowRight } from 'lucide-react'

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

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [lang, setLang] = useState<Lang>('EN')

  const [vehicleType, setVehicleType] = useState('')
  const [regNumber, setRegNumber] = useState('')

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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 52,
    background: 'var(--bg)',
    border: '1px solid var(--border-light)',
    borderRadius: 12,
    padding: '0 16px',
    fontSize: 16,
    color: 'var(--text)',
    outline: 'none',
    fontFamily: 'var(--font-body)',
  }

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text)' }

  const roleCards: { r: Role; icon: any; title: string; sub: string; color: 'orange' | 'teal' }[] = [
    { r: 'customer', icon: User, title: 'Customer', sub: 'Book trucks and workers', color: 'orange' },
    { r: 'driver', icon: Truck, title: 'Truck Driver', sub: 'Accept trips, grow earnings', color: 'orange' },
    { r: 'hamali', icon: Package, title: 'Hamali Worker', sub: 'Loading/unloading jobs', color: 'teal' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '16px 0 32px' }}>
      <div style={{ maxWidth: 460, margin: '0 auto', padding: '0 20px' }}>

        {/* Progress header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => step === 1 ? router.back() : setStep(step - 1)}
            style={{ width: 36, height: 36, borderRadius: 10, background: '#fff', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <ChevronLeft size={18} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              STEP {step} OF 2
            </div>
            <div style={{ height: 3, background: 'rgba(26,25,22,0.08)', borderRadius: 999, marginTop: 4 }}>
              <div style={{ height: '100%', width: step === 1 ? '50%' : '100%', background: 'var(--orange)', borderRadius: 999, transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.35 }} style={{ marginTop: 24 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.04em' }}>FYRO</span>
              <h1 className="syne" style={{ fontSize: 28, fontWeight: 700, margin: '16px 0 4px' }}>Join FYRO</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Choose how you'll use FYRO</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
                {roleCards.map(rc => {
                  const active = role === rc.r
                  const col = rc.color === 'teal' ? 'var(--teal)' : 'var(--orange)'
                  const tint = rc.color === 'teal' ? 'var(--teal-tint)' : 'var(--orange-tint)'
                  const light = rc.color === 'teal' ? 'var(--teal-light)' : 'var(--orange-light)'
                  return (
                    <button
                      key={rc.r}
                      onClick={() => selectRole(rc.r)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: 16,
                        borderRadius: 16,
                        border: active ? `2px solid ${col}` : '1px solid var(--border-light)',
                        background: active ? tint : '#fff',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: light, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <rc.icon size={22} color={col} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="syne" style={{ fontWeight: 700, fontSize: 16 }}>{rc.title}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{rc.sub}</div>
                      </div>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', border: active ? `6px solid ${col}` : '2px solid var(--border-light)', background: '#fff' }} />
                    </button>
                  )
                })}
              </div>

              <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>
                Already have an account? <Link href="/login" style={{ color: 'var(--orange)', fontWeight: 600, textDecoration: 'none' }}>Login</Link>
              </div>
            </motion.div>
          )}

          {step === 2 && role && (
            <motion.div key="step2" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.35 }} style={{ marginTop: 24 }}>
              <h1 className="syne" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Create your account</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Fill in your details to get started</p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
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
                    <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" style={{ ...inputStyle, paddingRight: 44 }} />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                      {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter password" style={{ ...inputStyle, paddingRight: 44 }} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                      {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Preferred Language</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['EN', 'HI', 'TE'] as Lang[]).map(l => (
                      <button key={l} type="button" onClick={() => setLang(l)} style={{
                        flex: 1, padding: '10px', borderRadius: 10,
                        border: lang === l ? '2px solid var(--orange)' : '1px solid var(--border-light)',
                        background: lang === l ? 'var(--orange-tint)' : '#fff',
                        color: lang === l ? 'var(--orange)' : 'var(--text-muted)',
                        fontWeight: 600, fontSize: 13, cursor: 'pointer'
                      }}>{l}</button>
                    ))}
                  </div>
                </div>

                {role === 'driver' && (
                  <>
                    <div>
                      <label style={labelStyle}>Vehicle Type</label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {VEHICLE_TYPES.map(vt => (
                          <button key={vt} type="button" onClick={() => setVehicleType(vt)} style={{
                            padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                            border: vehicleType === vt ? '2px solid var(--orange)' : '1px solid var(--border-light)',
                            background: vehicleType === vt ? 'var(--orange-tint)' : '#fff',
                            color: vehicleType === vt ? 'var(--orange)' : 'var(--text-muted)', cursor: 'pointer'
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

                {role === 'hamali' && (
                  <>
                    <div>
                      <label style={labelStyle}>Team Size</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <button type="button" onClick={() => setTeamSize(Math.max(1, teamSize - 1))} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border-light)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={16} /></button>
                        <span style={{ fontSize: 18, fontWeight: 700, minWidth: 32, textAlign: 'center' }}>{teamSize}</span>
                        <button type="button" onClick={() => setTeamSize(Math.min(10, teamSize + 1))} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border-light)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={16} /></button>
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
                            padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                            border: skills.includes(s) ? '2px solid var(--teal)' : '1px solid var(--border-light)',
                            background: skills.includes(s) ? 'var(--teal-light)' : '#fff',
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

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: 52,
                    marginTop: 8,
                    background: role === 'hamali' ? 'var(--teal)' : 'var(--orange)',
                    color: '#fff',
                    borderRadius: 999,
                    border: 'none',
                    fontSize: 15,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {loading ? 'Creating...' : <>Create Account <ArrowRight size={16} /></>}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
