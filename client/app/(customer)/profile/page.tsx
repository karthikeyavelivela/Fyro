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
import {
  Eye, EyeOff, LogOut, ChevronDown, ChevronUp, ChevronRight,
  User, MapPin, CreditCard, FileText, Bell, Globe, Gift,
  HelpCircle, Headphones, Flag, Shield, BookOpen, Info,
  Check, Settings as SettingsIcon,
} from 'lucide-react'

type Lang = 'EN' | 'HI' | 'TE'

type Section = 'personal' | 'security' | 'language' | 'notifications' | 'addresses' | 'referral' | null
type ExpandableSection = Exclude<Section, null>
type MenuItemKey = ExpandableSection | 'logout' | 'static'

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
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [openSection, setOpenSection] = useState<Section>(null)
  const [notifPrefs, setNotifPrefs] = useState({
    push: true, bookings: true, promotions: false, email: true,
  })
  const nameInputRef = useRef<HTMLInputElement>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.get('/api/auth/me').then(res => {
      const u = res.data?.user || res.data
      setUser(u); setName(u.name || ''); setEmail(u.email || ''); setLang((u.language as Lang) || 'EN')
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
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to change password') }
    finally { setSaving(false) }
  }

  const logout = async () => {
    setLoggingOut(true)
    try { await api.post('/api/auth/logout') } catch { /* ignore */ }
    finally { router.push('/login') }
  }

  const toggleSection = (s: Section) => setOpenSection(openSection === s ? null : s)

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 48,
    borderRadius: 12,
    border: '1px solid var(--border-light)',
    background: 'var(--bg)',
    padding: '0 14px',
    fontSize: 15,
    fontFamily: 'var(--font-body)',
    color: 'var(--text)',
    outline: 'none',
  }

  if (loading) return (
    <div className="page-shell narrow" style={{ padding: 24 }}>
      <Skeleton height={120} style={{ borderRadius: 20, marginBottom: 20 }} />
      <Skeleton height={200} style={{ borderRadius: 16, marginBottom: 14 }} />
      <Skeleton height={200} style={{ borderRadius: 16 }} />
    </div>
  )

  const role = (user?.role || 'customer').toString()
  const roleColor = role === 'driver' ? 'var(--orange)'
    : role === 'hamali' ? 'var(--teal)'
    : role === 'admin' ? 'var(--dark)' : 'var(--orange)'

  const menuSections: Array<{
    heading: string
    items: Array<{
      key: MenuItemKey
      icon: any
      label: string
      meta?: string
      onClick?: () => void
      danger?: boolean
    }>
  }> = [
    {
      heading: 'ACCOUNT',
      items: [
        { key: 'personal', icon: User, label: 'Personal info' },
        { key: 'addresses', icon: MapPin, label: 'Addresses', meta: `${(user?.addresses?.length || 0)} saved` },
        { key: 'static', icon: CreditCard, label: 'Payment methods', onClick: () => router.push('/payments') },
        { key: 'static', icon: FileText, label: 'GST & business', onClick: () => toast('Coming soon') },
      ],
    },
    {
      heading: 'PREFERENCES',
      items: [
        { key: 'notifications', icon: Bell, label: 'Notifications' },
        { key: 'language', icon: Globe, label: 'Language', meta: lang === 'EN' ? 'English' : lang === 'HI' ? 'हिंदी' : 'తెలుగు' },
        { key: 'referral', icon: Gift, label: 'Refer & earn', meta: '₹500/friend' },
        { key: 'security', icon: Shield, label: 'Security' },
      ],
    },
    {
      heading: 'SUPPORT',
      items: [
        { key: 'static', icon: HelpCircle, label: 'Help center', onClick: () => toast('Coming soon') },
        { key: 'static', icon: Headphones, label: 'Contact us', onClick: () => toast('Coming soon') },
        { key: 'static', icon: Flag, label: 'Report an issue', onClick: () => router.push('/complaints') },
      ],
    },
    {
      heading: 'MORE',
      items: [
        { key: 'static', icon: BookOpen, label: 'Terms & policies', onClick: () => toast('Coming soon') },
        { key: 'static', icon: Info, label: 'About FYRO', onClick: () => toast('FYRO v3.2.1') },
        { key: 'logout', icon: LogOut, label: loggingOut ? 'Logging out…' : 'Log out', onClick: logout, danger: true },
      ],
    },
  ]

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="page-shell narrow"
      style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}
    >
      {/* Header row */}
      <motion.div variants={fadeUp} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className="syne" style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
          Profile
        </h1>
        <button
          aria-label="Settings"
          onClick={() => toggleSection('security')}
          style={{
            width: 40, height: 40, borderRadius: 12,
            background: '#fff', border: '1px solid var(--border-light)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <SettingsIcon size={16} />
        </button>
      </motion.div>

      {/* Profile card */}
      <motion.div
        variants={fadeUp}
        style={{
          background: 'var(--surface)',
          borderRadius: 20,
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)',
          padding: 20,
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Avatar name={name} src={user?.photo} size="xl" />
        </div>
        <div className="syne" style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginTop: 12, letterSpacing: '-0.01em' }}>
          {name || 'User'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          {user?.phone || '—'}{user?.email ? ` · ${user.email}` : ''}
        </div>
        <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'var(--orange-light)', color: 'var(--orange-dark)', border: '1px solid var(--orange-border)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: roleColor }} /> {role}
        </div>
        {user?.rating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 }}>
            <RatingStars value={user.rating} readonly size={14} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              ({user.ratingCount || 0})
            </span>
          </div>
        )}

        {/* Stats strip */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--divider)' }}>
          <div>
            <div className="syne" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>{user?.tripCount ?? 0}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Trips</div>
          </div>
          <div style={{ width: 1, background: 'var(--divider)' }} />
          <div>
            <div className="syne" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--orange)' }}>
              {user?.rating ? user.rating.toFixed(1) : '—'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Rating</div>
          </div>
          <div style={{ width: 1, background: 'var(--divider)' }} />
          <div>
            <div className="syne" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>{lang}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Lang</div>
          </div>
        </div>
      </motion.div>

      {/* Menu sections */}
      {menuSections.map((section) => (
        <motion.div key={section.heading} variants={fadeUp}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', padding: '0 4px 8px' }}>
            {section.heading}
          </div>
          <div style={{
            background: 'var(--surface)',
            borderRadius: 16,
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}>
            {section.items.map((item, i) => {
              const Ic = item.icon
              const hasSection = item.key !== 'static' && item.key !== 'logout'
              const isOpen = hasSection && item.key === openSection
              return (
                <div key={item.label} style={{ borderBottom: i < section.items.length - 1 ? '1px solid var(--divider)' : 'none' }}>
                  <button
                    onClick={() => {
                      if (item.onClick) item.onClick()
                      else if (item.key !== 'static' && item.key !== 'logout') toggleSection(item.key)
                    }}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <Ic size={18} color={item.danger ? 'var(--red)' : 'var(--text-muted)'} />
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: item.danger ? 'var(--red)' : 'var(--text)' }}>
                      {item.label}
                    </span>
                    {item.meta && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.meta}</span>}
                    {!item.danger && (
                      hasSection
                        ? (isOpen ? <ChevronUp size={14} color="var(--text-faint)" /> : <ChevronDown size={14} color="var(--text-faint)" />)
                        : <ChevronRight size={14} color="var(--text-faint)" />
                    )}
                  </button>

                  {/* Collapsible sub-section */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden', background: 'var(--bg)' }}
                      >
                        <div style={{ padding: 16, borderTop: '1px solid var(--divider)' }}>
                          {item.key === 'personal' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              {/* Name */}
                              <div>
                                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Full name</label>
                                {editName ? (
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <input ref={nameInputRef} value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
                                    <button onClick={() => saveField('name', name)} disabled={saving} style={{ padding: '0 14px', borderRadius: 12, background: 'var(--orange)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Save</button>
                                    <button onClick={() => { setEditName(false); setName(user?.name || '') }} style={{ padding: '0 10px', borderRadius: 12, background: '#fff', border: '1px solid var(--border-light)', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid var(--border-light)', borderRadius: 12, padding: '12px 14px' }}>
                                    <span style={{ fontSize: 15 }}>{name}</span>
                                    <button onClick={() => setEditName(true)} style={{ background: 'none', border: 'none', color: 'var(--orange)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                                  </div>
                                )}
                              </div>

                              {/* Phone */}
                              <div>
                                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Phone</label>
                                <div style={{ background: '#fff', border: '1px solid var(--border-light)', borderRadius: 12, padding: '12px 14px', fontSize: 15, color: 'var(--text-muted)' }}>
                                  {user?.phone || 'Not set'}
                                </div>
                              </div>

                              {/* Email */}
                              <div>
                                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Email</label>
                                {editEmail ? (
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <input ref={emailInputRef} type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
                                    <button onClick={() => saveField('email', email)} disabled={saving} style={{ padding: '0 14px', borderRadius: 12, background: 'var(--orange)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Save</button>
                                    <button onClick={() => { setEditEmail(false); setEmail(user?.email || '') }} style={{ padding: '0 10px', borderRadius: 12, background: '#fff', border: '1px solid var(--border-light)', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid var(--border-light)', borderRadius: 12, padding: '12px 14px' }}>
                                    <span style={{ fontSize: 15 }}>{email || '—'}</span>
                                    <button onClick={() => setEditEmail(true)} style={{ background: 'none', border: 'none', color: 'var(--orange)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {item.key === 'security' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Change password</label>
                              {[
                                { placeholder: 'Current password', value: currentPw, set: setCurrentPw, showToggle: true },
                                { placeholder: 'New password', value: newPw, set: setNewPw, showToggle: false },
                                { placeholder: 'Confirm new password', value: confirmPw, set: setConfirmPw, showToggle: false },
                              ].map((f, i) => (
                                <div key={i} style={{ position: 'relative' }}>
                                  <input
                                    type={showPw ? 'text' : 'password'}
                                    placeholder={f.placeholder}
                                    value={f.value}
                                    onChange={e => f.set(e.target.value)}
                                    style={{ ...inputStyle, paddingRight: f.showToggle ? 44 : 14 }}
                                  />
                                  {f.showToggle && (
                                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button
                                onClick={changePassword}
                                disabled={saving}
                                style={{
                                  height: 48, borderRadius: 12,
                                  background: 'var(--orange)', color: '#fff', border: 'none',
                                  fontWeight: 600, fontSize: 14,
                                  cursor: saving ? 'not-allowed' : 'pointer',
                                  opacity: saving ? 0.7 : 1,
                                }}
                              >
                                {saving ? 'Saving…' : 'Update password'}
                              </button>
                            </div>
                          )}

                          {item.key === 'language' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {[
                                { id: 'EN' as Lang, label: 'English' },
                                { id: 'HI' as Lang, label: 'हिंदी' },
                                { id: 'TE' as Lang, label: 'తెలుగు' },
                              ].map(l => {
                                const sel = lang === l.id
                                return (
                                  <button
                                    key={l.id}
                                    onClick={() => { setLang(l.id); saveField('language', l.id) }}
                                    style={{
                                      padding: '12px 14px',
                                      borderRadius: 12,
                                      display: 'flex',
                                      alignItems: 'center',
                                      background: sel ? 'var(--orange-tint)' : '#fff',
                                      border: sel ? '1.5px solid var(--orange)' : '1px solid var(--border-light)',
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <span style={{ flex: 1, fontWeight: sel ? 600 : 500, fontSize: 14, color: sel ? 'var(--orange-dark)' : 'var(--text)' }}>{l.label}</span>
                                    {sel && <Check size={16} color="var(--orange)" strokeWidth={2.5} />}
                                  </button>
                                )
                              })}
                            </div>
                          )}

                          {item.key === 'notifications' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {[
                                { key: 'push', label: 'Push notifications' },
                                { key: 'bookings', label: 'Booking updates' },
                                { key: 'promotions', label: 'Promotions & offers' },
                                { key: 'email', label: 'Email digest' },
                              ].map(({ key, label }, idx, arr) => {
                                const v = (notifPrefs as any)[key]
                                return (
                                  <div key={key} style={{
                                    padding: '12px 0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderBottom: idx < arr.length - 1 ? '1px solid var(--divider)' : 'none',
                                  }}>
                                    <span style={{ flex: 1, fontSize: 14 }}>{label}</span>
                                    <button
                                      onClick={() => setNotifPrefs(p => ({ ...p, [key]: !v }))}
                                      style={{
                                        width: 42, height: 24, borderRadius: 999,
                                        background: v ? 'var(--orange)' : 'rgba(0,0,0,0.15)',
                                        padding: 2, border: 'none',
                                        display: 'flex',
                                        justifyContent: v ? 'flex-end' : 'flex-start',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                      }}
                                    >
                                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {item.key === 'addresses' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {(user?.addresses || []).length === 0 ? (
                                <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: 12, textAlign: 'center' }}>
                                  No saved addresses yet
                                </div>
                              ) : (
                                (user?.addresses || []).map((addr: any, idx: number) => (
                                  <div key={idx} style={{
                                    padding: 12,
                                    background: '#fff',
                                    borderRadius: 12,
                                    border: '1px solid var(--border-light)',
                                    display: 'flex', gap: 10, alignItems: 'flex-start',
                                  }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--orange-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      <MapPin size={14} color="var(--orange)" />
                                    </div>
                                    <div style={{ flex: 1, fontSize: 13 }}>
                                      <div style={{ fontWeight: 600 }}>{addr.label || 'Address'}</div>
                                      <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
                                        {addr.address || `${addr.lat}, ${addr.lng}`}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                              <button
                                onClick={() => router.push('/book')}
                                style={{
                                  padding: '10px 14px',
                                  borderRadius: 12,
                                  background: 'transparent',
                                  border: '1px dashed var(--orange-border)',
                                  color: 'var(--orange)',
                                  fontSize: 13, fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                + Add address
                              </button>
                            </div>
                          )}

                          {item.key === 'referral' && (
                            <div>
                              <div style={{
                                background: 'linear-gradient(135deg, #FF6B2B, #C94A10)',
                                color: '#fff',
                                borderRadius: 16,
                                padding: 20,
                                textAlign: 'center',
                                position: 'relative',
                                overflow: 'hidden',
                              }}>
                                <Gift size={32} color="rgba(255,255,255,0.25)" style={{ position: 'absolute', top: 12, right: 12 }} />
                                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', opacity: 0.85 }}>EARN</div>
                                <div className="syne" style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', margin: '2px 0' }}>
                                  ₹500
                                </div>
                                <div style={{ fontSize: 12, opacity: 0.9 }}>for every friend's first trip</div>
                              </div>
                              <div style={{
                                marginTop: 12,
                                padding: 12,
                                background: '#fff',
                                borderRadius: 12,
                                border: '2px dashed var(--orange-border)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                              }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>YOUR CODE</div>
                                  <div className="syne mono" style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--orange)', letterSpacing: '0.04em' }}>
                                    {(user?.referralCode || `${(name || 'USER').split(' ')[0].toUpperCase()}500`)}
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    const code = user?.referralCode || `${(name || 'USER').split(' ')[0].toUpperCase()}500`
                                    navigator.clipboard?.writeText(code)
                                    toast.success('Code copied')
                                  }}
                                  style={{
                                    padding: '8px 14px',
                                    borderRadius: 999,
                                    background: 'var(--orange)',
                                    color: '#fff',
                                    border: 'none',
                                    fontSize: 12, fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Copy
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </motion.div>
      ))}

      <motion.div variants={fadeUp} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-faint)', marginTop: 8 }}>
        FYRO · Made in Vijayawada
      </motion.div>
    </motion.div>
  )
}
