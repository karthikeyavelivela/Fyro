'use client'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { fadeUp, staggerContainer } from '@/lib/animations'
import Avatar from '@/components/ui/Avatar'
import RatingStars from '@/components/RatingStars'
import Skeleton from '@/components/ui/Skeleton'
import { Eye, EyeOff, LogOut, ChevronDown, ChevronUp } from 'lucide-react'

type Lang = 'EN' | 'HI' | 'TE'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editName, setEditName] = useState(false)
  const [editEmail, setEditEmail] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [lang, setLang] = useState<Lang>('EN')
  const [saving, setSaving] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.get('/api/auth/me').then(res => {
      const u = res.data?.user || res.data
      setUser(u); setName(u.name || ''); setEmail(u.email || ''); setLang(u.language || 'EN')
    }).catch(() => toast.error('Failed to load profile')).finally(() => setLoading(false))
  }, [])

  useEffect(() => { if (editName) setTimeout(() => nameInputRef.current?.focus(), 0) }, [editName])
  useEffect(() => { if (editEmail) setTimeout(() => emailInputRef.current?.focus(), 0) }, [editEmail])

  const saveField = async (field: string, value: string) => {
    setSaving(true)
    try {
      await api.put('/api/auth/profile', { [field]: value })
      setUser((prev: any) => ({ ...prev, [field]: value }))
      toast.success('Saved!')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false); setEditName(false); setEditEmail(false) }
  }

  const changePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) { toast.error('Fill all fields'); return }
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return }
    if (newPw.length < 6) { toast.error('Password must be 6+ chars'); return }
    setSaving(true)
    try {
      await api.put('/api/auth/password', { currentPassword: currentPw, newPassword: newPw })
      toast.success('Password changed!')
      setPwOpen(false); setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to change password') }
    finally { setSaving(false) }
  }

  const logout = async () => {
    setLoggingOut(true)
    try {
      await api.post('/api/auth/logout')
    } catch { /* ignore */ }
    finally { router.push('/login') }
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--surface-raised)', border: '1.5px solid var(--border-strong)',
    borderRadius: 10, padding: '12px 14px', fontSize: 16, outline: 'none', fontFamily: 'Outfit, sans-serif', color: 'var(--text)'
  }

  if (loading) return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 24 }}>
      <Skeleton height={80} style={{ borderRadius: '50%', width: 80, margin: '0 auto 20px' }} />
      <Skeleton height={32} style={{ marginBottom: 12 }} />
      <Skeleton height={24} style={{ marginBottom: 12 }} />
    </div>
  )

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px 40px' }}>
      <motion.h1 variants={fadeUp} custom={0} style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24, marginBottom: 24 }}>My Profile</motion.h1>

      {/* Avatar */}
      <motion.div variants={fadeUp} custom={1} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
        <Avatar name={name} src={user?.photo} size="xl" />
        <button style={{ marginTop: 10, fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>Change photo</button>
        {user?.rating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <RatingStars value={user.rating} readonly size={16} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>({user.ratingCount || 0} ratings)</span>
          </div>
        )}
      </motion.div>

      {/* Fields */}
      <motion.div variants={fadeUp} custom={2} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {/* Name */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Full Name</label>
          {editName ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input ref={nameInputRef} value={name} onChange={e => setName(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              <button onClick={() => saveField('name', name)} disabled={saving}
                style={{ background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 10, padding: '0 16px', cursor: 'pointer', fontWeight: 600 }}>Save</button>
              <button onClick={() => { setEditName(false); setName(user.name) }}
                style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '0 12px', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
              <span style={{ fontSize: 16 }}>{name}</span>
              <button onClick={() => setEditName(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Edit</button>
            </div>
          )}
        </div>

        {/* Phone (readonly) */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Phone</label>
          <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', fontSize: 16, color: 'var(--text-muted)' }}>
            {user?.phone || 'Not set'}
          </div>
        </div>

        {/* Email */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Email</label>
          {editEmail ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input ref={emailInputRef} type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              <button onClick={() => saveField('email', email)} disabled={saving}
                style={{ background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 10, padding: '0 16px', cursor: 'pointer', fontWeight: 600 }}>Save</button>
              <button onClick={() => { setEditEmail(false); setEmail(user.email) }}
                style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '0 12px', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
              <span style={{ fontSize: 16 }}>{email}</span>
              <button onClick={() => setEditEmail(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Edit</button>
            </div>
          )}
        </div>

        {/* Language */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Language</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['EN', 'HI', 'TE'] as Lang[]).map(l => (
              <button key={l} onClick={() => { setLang(l); saveField('language', l) }} style={{
                flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid',
                borderColor: lang === l ? 'var(--accent)' : 'var(--border-strong)',
                background: lang === l ? 'var(--accent-light)' : 'var(--surface)',
                color: lang === l ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: 600, fontSize: 14, cursor: 'pointer'
              }}>{l}</button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Change Password */}
      <motion.div variants={fadeUp} custom={3} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 20, overflow: 'hidden' }}>
        <button onClick={() => setPwOpen(!pwOpen)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
          Change Password {pwOpen ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
        </button>
        <AnimatePresence>
          {pwOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
              <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 14, borderTop: '1px solid var(--border)' }}>
                {[
                  { placeholder: 'Current password', value: currentPw, set: setCurrentPw },
                  { placeholder: 'New password', value: newPw, set: setNewPw },
                  { placeholder: 'Confirm new password', value: confirmPw, set: setConfirmPw },
                ].map((f, i) => (
                  <div key={i} style={{ position: 'relative', marginTop: i === 0 ? 14 : 0 }}>
                    <input type={showPw ? 'text' : 'password'} placeholder={f.placeholder} value={f.value} onChange={e => f.set(e.target.value)}
                      style={{ ...inputStyle, width: '100%', paddingRight: i === 0 ? 44 : 16 }} />
                    {i === 0 && (
                      <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                        {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    )}
                  </div>
                ))}
                <motion.button whileTap={{ scale: 0.97 }} onClick={changePassword} disabled={saving}
                  style={{ background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 10, padding: '14px', fontSize: 15, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'Outfit, sans-serif' }}>
                  {saving ? 'Saving...' : 'Update Password'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Logout */}
      <motion.button variants={fadeUp} custom={4} whileTap={{ scale: 0.97 }} onClick={logout} disabled={loggingOut}
        style={{
          width: '100%', background: '#FEE2E2', color: '#DC2626', border: '1.5px solid #FECACA',
          borderRadius: 'var(--radius-md)', padding: '16px', fontSize: 15, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}>
        <LogOut size={18} /> {loggingOut ? 'Logging out...' : 'Logout'}
      </motion.button>
    </motion.div>
  )
}
