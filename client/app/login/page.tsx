'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, Phone, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import api from '@/lib/api'

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
  const [lang, setLang] = useState<'en' | 'hi' | 'te'>('en')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/login', { identifier, password })
      const loggedInUser = data?.user || data?.data?.user
      toast.success('Welcome back')
      router.push(ROLE_HOME[loggedInUser?.role] || '/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const langs: { id: 'en' | 'hi' | 'te'; l: string }[] = [
    { id: 'en', l: 'English' },
    { id: 'hi', l: 'हिंदी' },
    { id: 'te', l: 'తెలుగు' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 460, width: '100%', margin: '0 auto' }}>
        <button
          onClick={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 12, background: '#fff', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <ArrowLeft size={18} />
        </button>
        <div style={{ display: 'flex', gap: 6 }}>
          {langs.map(x => (
            <button
              key={x.id}
              onClick={() => setLang(x.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                background: lang === x.id ? 'var(--orange)' : '#fff',
                color: lang === x.id ? '#fff' : 'var(--text-muted)',
                border: `1px solid ${lang === x.id ? 'var(--orange)' : 'var(--border-light)'}`,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >{x.l}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            width: '100%',
            maxWidth: 420,
            background: '#fff',
            borderRadius: 24,
            padding: 32,
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-light)',
          }}
        >
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, letterSpacing: '-0.04em' }}>FYRO</span>
          <h1 className="syne" style={{ fontSize: 28, fontWeight: 700, margin: '18px 0 4px', letterSpacing: '-0.02em' }}>Welcome back</h1>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Sign in to your account</div>

          <form onSubmit={handleSubmit} style={{ marginTop: 28 }}>
            <label style={{ fontWeight: 500, fontSize: 13, color: 'var(--text)', marginBottom: 6, display: 'block' }}>Email or Phone</label>
            <input
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: '100%',
                height: 52,
                borderRadius: 12,
                border: '1px solid var(--border-light)',
                background: 'var(--bg)',
                padding: '0 16px',
                fontSize: 16,
                outline: 'none',
                color: 'var(--text)',
              }}
            />

            <label style={{ fontWeight: 500, fontSize: 13, color: 'var(--text)', marginBottom: 6, display: 'block', marginTop: 14 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                style={{
                  width: '100%',
                  height: 52,
                  borderRadius: 12,
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg)',
                  padding: '0 44px 0 16px',
                  fontSize: 16,
                  outline: 'none',
                  color: 'var(--text)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div style={{ textAlign: 'right', marginTop: 8 }}>
              <a style={{ fontSize: 13, color: 'var(--orange)', fontWeight: 500, cursor: 'pointer' }}>Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: 52,
                marginTop: 22,
                background: 'var(--orange)',
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
              {loading ? 'Signing in...' : <>Sign in <ArrowRight size={16} /></>}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0', color: 'var(--text-faint)', fontSize: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--divider)' }} /> or <div style={{ flex: 1, height: 1, background: 'var(--divider)' }} />
          </div>

          <button
            type="button"
            style={{
              width: '100%',
              height: 52,
              borderRadius: 999,
              background: 'transparent',
              color: 'var(--text)',
              border: '1px solid var(--border-light)',
              fontSize: 15,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >
            <Phone size={16} /> Continue with OTP
          </button>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
            New to FYRO?{' '}
            <Link href="/register" style={{ color: 'var(--orange)', fontWeight: 600, textDecoration: 'none' }}>
              Register
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
