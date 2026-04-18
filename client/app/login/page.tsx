'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { Eye, EyeOff } from 'lucide-react'
import { fadeUp, staggerContainer } from '@/lib/animations'

const ROLE_HOME: Record<string, string> = {
  customer: '/dashboard',
  driver: '/driver',
  hamali: '/hamali',
  admin: '/admin',
}

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier || !password) { toast.error('Please fill in all fields'); return }
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/login', { identifier, password })
      toast.success('Welcome back!')
      router.push(ROLE_HOME[data.user?.role] || '/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div variants={staggerContainer} initial="hidden" animate="show"
        style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <motion.div variants={fadeUp} custom={0} style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Syne, sans-serif', fontWeight: 800, color: 'white', fontSize: 22
            }}>F</div>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24 }}>FYRO</span>
          </div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 28, marginBottom: 6 }}>Welcome back</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Sign in to your account</p>
        </motion.div>

        <motion.form variants={fadeUp} custom={1} onSubmit={handleSubmit}
          style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6, color: 'var(--text)' }}>Phone or Email</label>
            <input
              value={identifier} onChange={e => setIdentifier(e.target.value)}
              placeholder="9876543210 or you@example.com"
              style={{
                width: '100%', background: 'var(--surface-raised)', border: '1.5px solid var(--border-strong)',
                borderRadius: 'var(--radius-sm)', padding: '14px 16px', fontSize: 16, color: 'var(--text)',
                outline: 'none', transition: 'border-color 0.2s', fontFamily: 'Outfit, sans-serif'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6, color: 'var(--text)' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', background: 'var(--surface-raised)', border: '1.5px solid var(--border-strong)',
                  borderRadius: 'var(--radius-sm)', padding: '14px 48px 14px 16px', fontSize: 16, color: 'var(--text)',
                  outline: 'none', transition: 'border-color 0.2s', fontFamily: 'Outfit, sans-serif'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <Link href="#" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>Forgot password?</Link>
          </div>

          <motion.button type="submit" disabled={loading}
            whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }} whileTap={{ scale: 0.97 }}
            style={{
              width: '100%', background: 'var(--accent)', color: 'white', border: 'none',
              borderRadius: 'var(--radius-md)', padding: '18px', fontSize: 16, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}>
            {loading ? (
              <><span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Signing in...</>
            ) : 'Login'}
          </motion.button>

          <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
            New to FYRO?{' '}
            <Link href="/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Register</Link>
          </div>
        </motion.form>
      </motion.div>
      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
