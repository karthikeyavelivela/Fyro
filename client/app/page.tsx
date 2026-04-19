'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight, Check, MapPin, Zap, MessageCircle, Package,
  ShieldCheck, RefreshCw, User, FileText, Star
} from 'lucide-react'

const LANGS = ['EN', 'हिंदी', 'తెలుగు', 'தமிழ்']

function LangPills({ dark = false }: { dark?: boolean }) {
  const [active, setActive] = useState('EN')
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {LANGS.map(l => {
        const isActive = active === l
        return (
          <button
            key={l}
            onClick={() => setActive(l)}
            style={{
              padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500,
              border: '1px solid ' + (isActive ? 'var(--orange)' : (dark ? 'rgba(255,255,255,0.1)' : 'var(--border-light)')),
              background: isActive ? 'var(--orange)' : (dark ? 'rgba(255,255,255,0.05)' : '#fff'),
              color: isActive ? '#fff' : (dark ? '#F2EFE9' : 'var(--text-muted)'),
              cursor: 'pointer'
            }}
          >{l}</button>
        )
      })}
    </div>
  )
}

function Wordmark({ size = 22, color }: { size?: number; color?: string }) {
  return (
    <span className="syne" style={{ fontSize: size, fontWeight: 800, letterSpacing: '-0.03em', color: color || 'var(--text)' }}>
      FYRO
    </span>
  )
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(s => s[0]).slice(0, 2).join('')
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #FF6B2B, #C94A10)',
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.4, flexShrink: 0
    }}>{initials}</div>
  )
}

export default function LandingPage() {
  return (
    <main style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-body)', overflowX: 'hidden' }}>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(242,239,233,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--divider)',
        padding: '18px clamp(20px, 5vw, 72px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div>
          <Wordmark size={26} />
          <div style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--text-muted)', fontWeight: 600, marginTop: -2 }}>FIND YOUR RIGHT ONE</div>
        </div>
        <div style={{ display: 'none', gap: 36, fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }} className="nav-links">
          <a href="#features" style={{ textDecoration: 'none' }}>Features</a>
          <a href="#roles" style={{ textDecoration: 'none' }}>Roles</a>
          <a href="#how" style={{ textDecoration: 'none' }}>How it works</a>
          <a href="#cta" style={{ textDecoration: 'none' }}>Early Access</a>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/login" style={{
            padding: '10px 18px', fontSize: 14, fontWeight: 600,
            borderRadius: 999, border: '1px solid var(--border-light)',
            textDecoration: 'none', color: 'var(--text)'
          }}>Log in</Link>
          <Link href="/register" style={{
            padding: '11px 20px', fontSize: 14, fontWeight: 600,
            borderRadius: 999, background: 'var(--orange)', color: '#fff',
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8
          }}>Get started <ArrowRight size={14} /></Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: 'var(--bg)', padding: 'clamp(48px, 8vw, 72px) clamp(20px, 5vw, 72px) clamp(64px, 10vw, 96px)', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(26,25,22,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(26,25,22,0.03) 1px, transparent 1px)',
          backgroundSize: '64px 64px'
        }} />
        <div style={{ position: 'absolute', top: -100, left: -100, width: 500, height: 500, background: 'radial-gradient(circle, rgba(255,107,43,0.15), transparent 70%)', pointerEvents: 'none' }} />

        <div className="hero-grid" style={{
          display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 48, position: 'relative',
          alignItems: 'center', maxWidth: 1400, margin: '0 auto'
        }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="soft-entrance">
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--orange-light)', border: '1px solid var(--orange-border)',
              borderRadius: 999, padding: '7px 14px',
              color: 'var(--orange-dark)', fontSize: 12, fontWeight: 600, marginBottom: 32
            }}>
              <span className="dot-pulse pulse-glow" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--orange)', color: 'var(--orange)', display: 'inline-block' }} />
              Now live in Andhra Pradesh &amp; Telangana
            </div>
            <h1 className="syne" style={{ fontSize: 'clamp(48px, 9vw, 88px)', lineHeight: 1, margin: 0, fontWeight: 800, letterSpacing: '-0.04em' }}>
              Find Your<br />
              <span style={{ color: 'var(--orange)' }}>Right</span> One<br />
              for India.
            </h1>
            <p style={{ fontSize: 18, color: 'var(--text-muted)', maxWidth: 480, marginTop: 28, lineHeight: 1.6 }}>
              Book trucks and hamali workers instantly. Track live. Pay via UPI. Built for Indian roads.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 36, flexWrap: 'wrap' }}>
              <Link href="/register" style={{
                height: 52, padding: '0 26px', fontSize: 15, fontWeight: 600,
                borderRadius: 999, background: 'var(--orange)', color: '#fff',
                display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none'
              }}>Start booking <ArrowRight size={16} /></Link>
              <Link href="/register" style={{
                height: 52, padding: '0 26px', fontSize: 15, fontWeight: 600,
                borderRadius: 999, background: 'transparent', color: 'var(--text)',
                border: '1.5px solid var(--text)',
                display: 'inline-flex', alignItems: 'center', textDecoration: 'none'
              }}>Become a provider</Link>
            </div>
            <div style={{ marginTop: 32 }}>
              <LangPills />
            </div>
          </motion.div>

          {/* Dark booking card */}
          <motion.div
            initial={{ opacity: 0, x: 40, rotate: 0 }}
            animate={{ opacity: 1, x: 0, rotate: -2 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hero-card float-gentle soft-entrance soft-entrance-delay-1"
            style={{
              background: 'var(--dark)', color: '#fff', borderRadius: 28, padding: 28,
              maxWidth: 420, justifySelf: 'end',
              boxShadow: '0 30px 80px rgba(0,0,0,0.25)'
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)' }}>LIVE BOOKING</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'rgba(22,163,74,0.2)', color: '#4ADE80', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <span className="dot-pulse" style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ADE80', color: '#4ADE80', display: 'inline-block' }} /> In progress
              </span>
            </div>
            <div className="syne mono" style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>FY-2026-0042</div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>PICKUP</div>
              <div style={{ fontSize: 15, fontWeight: 500, marginTop: 2 }}>Auto Nagar, Vijayawada</div>
              <div style={{ margin: '12px 0 12px 4px', borderLeft: '1.5px dashed rgba(255,255,255,0.2)', height: 18, position: 'relative' }}>
                <div style={{ position: 'absolute', left: -4.5, top: 6, width: 8, height: 8, borderRadius: '50%', background: 'var(--orange)' }} />
              </div>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>DROPOFF</div>
              <div style={{ fontSize: 15, fontWeight: 500, marginTop: 2 }}>Benz Circle, Vijayawada</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {[['VEHICLE', 'Tempo'], ['ETA', '12 min'], ['FARE', '₹1,860']].map(([l, v], i) => (
                <div key={l} style={{ borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.1)' : 'none', paddingLeft: i > 0 ? 16 : 0 }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.1em' }}>{l}</div>
                  <div className="syne" style={{ fontSize: 18, fontWeight: 700, color: l === 'FARE' ? 'var(--orange)' : '#fff', marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 16, gap: 12 }}>
              <Avatar name="Ravi Kumar" size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Ravi Kumar</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Tempo · AP39CD5678</div>
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={13} fill="#FF6B2B" color="#FF6B2B" />)}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ background: '#fff', borderTop: '1px solid var(--divider)', borderBottom: '1px solid var(--divider)', padding: '48px clamp(20px, 5vw, 72px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 0, maxWidth: 1400, margin: '0 auto' }}>
          {[['2,400+', 'Trucks registered'], ['4 min', 'Average match time'], ['24', 'Cities active']].map(([n, l], i) => (
            <div key={l} style={{ textAlign: 'center', borderLeft: i > 0 ? '1px solid var(--divider)' : 'none', padding: '0 12px' }}>
              <div className="syne" style={{ fontSize: 52, fontWeight: 800, color: 'var(--orange)', letterSpacing: '-0.03em' }}>{n}</div>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: 'clamp(64px, 10vw, 96px) clamp(20px, 5vw, 72px)', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: 'var(--orange-light)', color: 'var(--orange-dark)', padding: '6px 14px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 20 }}>Why FYRO</div>
          <h2 className="syne" style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700, margin: 0, letterSpacing: '-0.03em', maxWidth: 700 }}>
            Logistics, finally<br />built right.
          </h2>
          <p style={{ fontSize: 17, color: 'var(--text-muted)', maxWidth: 560, marginTop: 20, lineHeight: 1.6 }}>
            Every feature designed for the realities of Indian transport — return loads, cash handling, multi-language crews.
          </p>

          <div className="feature-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 20, marginTop: 60 }}>
            {/* Hero feature */}
            <div style={{ gridRow: 'span 2', background: 'var(--dark)', color: '#fff', borderRadius: 24, padding: 40, position: 'relative', overflow: 'hidden', minHeight: 400 }}>
            <div className="float-gentle" style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, background: 'radial-gradient(circle, rgba(255,107,43,0.25), transparent 70%)' }} />
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32, position: 'relative' }}>
                <RefreshCw size={28} color="#fff" strokeWidth={2} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 14, position: 'relative' }}>★ Signature feature</div>
              <h3 className="syne" style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1, position: 'relative' }}>
                Return Load Matching.<br />Trucks never go back empty.
              </h3>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginTop: 20, maxWidth: 460, position: 'relative' }}>
                Our AI matches return trips across Vijayawada → Hyderabad → Chennai corridors. Drivers earn 40% more. Shippers pay 25% less.
              </p>
              <div style={{ display: 'flex', gap: 24, marginTop: 36, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                <div><div className="syne" style={{ fontSize: 28, fontWeight: 800, color: 'var(--orange)' }}>₹8.2L</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>saved this month</div></div>
                <div><div className="syne" style={{ fontSize: 28, fontWeight: 800 }}>1,284</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>return trips matched</div></div>
              </div>
            </div>

            {[
              { Ic: MapPin, t: 'Real-time GPS tracking', d: 'Watch your goods move in real time across the map.', bg: 'var(--orange-light)', c: 'var(--orange)' },
              { Ic: Zap, t: 'Book in 60 seconds', d: 'From need to confirmed driver, faster than a rickshaw.', bg: 'var(--orange-light)', c: 'var(--orange)' },
              { Ic: MessageCircle, t: 'In-app messaging', d: 'Chat or call drivers in English, Hindi, or Telugu.', bg: 'var(--orange-light)', c: 'var(--orange)' },
              { Ic: Package, t: 'Hamali workers', d: 'Book trusted loading/unloading crews on demand.', bg: 'var(--teal-light)', c: 'var(--teal)' },
              { Ic: ShieldCheck, t: 'Verified operators', d: 'Every driver KYC-verified. PAN, license, vehicle docs.', bg: 'var(--orange-light)', c: 'var(--orange)' },
            ].map(({ Ic, t, d, bg, c }) => (
              <div key={t} className="surface-lift" style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border-light)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: 24 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Ic size={22} color={c} strokeWidth={1.75} />
                </div>
                <div className="syne" style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>{t}</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.55, marginTop: 6 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ padding: 'clamp(64px, 10vw, 96px) clamp(20px, 5vw, 72px)', background: '#fff' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: '#F2EFE9', color: 'var(--text)', padding: '6px 14px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 20 }}>How it works</div>
          <h2 className="syne" style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700, margin: 0, letterSpacing: '-0.03em' }}>Move anything in 4 steps.</h2>

          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginTop: 72, position: 'relative' }}>
            {[
              { Ic: User, t: 'Create account', d: 'Sign up with phone, verify OTP, pick your role.' },
              { Ic: FileText, t: 'Post your need', d: 'Pickup, drop, vehicle type, date — under 60 seconds.' },
              { Ic: Zap, t: 'Get matched', d: 'Nearby verified providers respond in minutes.' },
              { Ic: MapPin, t: 'Track & pay', d: 'Live map, in-app chat, UPI on completion.' },
            ].map(({ Ic, t, d }, i) => (
              <div key={t} className="surface-lift" style={{ position: 'relative', borderRadius: 18, padding: 16 }}>
                <div className="syne" style={{ position: 'absolute', top: -8, right: 4, fontSize: 56, fontWeight: 800, color: 'rgba(26,25,22,0.06)', letterSpacing: '-0.04em' }}>0{i + 1}</div>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--orange-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, position: 'relative' }}>
                  <Ic size={26} color="var(--orange)" strokeWidth={1.75} />
                </div>
                <div className="syne" style={{ fontSize: 20, fontWeight: 700 }}>{t}</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.55, marginTop: 8 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role cards */}
      <section id="roles" style={{ padding: 'clamp(64px, 10vw, 96px) clamp(20px, 5vw, 72px)', background: 'var(--bg)' }}>
        <div className="roles-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 1400, margin: '0 auto' }}>
          <div className="surface-lift" style={{ background: 'var(--dark)', color: '#fff', borderRadius: 28, padding: 44, position: 'relative', overflow: 'hidden', minHeight: 440 }}>
            <div style={{ position: 'absolute', bottom: -60, right: -60, width: 260, height: 260, background: 'radial-gradient(circle, rgba(255,107,43,0.2), transparent 70%)' }} />
            <span style={{ display: 'inline-block', background: 'rgba(255,107,43,0.15)', color: 'var(--orange)', padding: '4px 9px', borderRadius: 999, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 24, position: 'relative' }}>SHIPPERS</span>
            <h3 className="syne" style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, margin: '16px 0 20px', letterSpacing: '-0.02em', lineHeight: 1.05, position: 'relative' }}>
              Move goods faster,<br />pay less.
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 28, position: 'relative' }}>
              {['Instant booking in 60s', 'Live GPS tracking', 'GST invoicing built-in', 'Return-load savings up to 40%'].map(t => (
                <div key={t} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 15 }}>
                  <Check size={18} color="var(--orange)" strokeWidth={2.5} /> {t}
                </div>
              ))}
            </div>
            <Link href="/register" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 36, padding: '12px 22px', borderRadius: 999, background: 'var(--orange)', color: '#fff', fontWeight: 600, textDecoration: 'none', fontSize: 15 }}>Start shipping <ArrowRight size={14} /></Link>
          </div>

          <div className="surface-lift" style={{ background: '#fff', borderRadius: 28, padding: 44, border: '1px solid var(--border-light)', minHeight: 440 }}>
            <span style={{ display: 'inline-block', background: 'var(--teal-light)', color: 'var(--teal)', padding: '4px 9px', borderRadius: 999, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 24 }}>PROVIDERS</span>
            <h3 className="syne" style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, margin: '16px 0 20px', letterSpacing: '-0.02em', lineHeight: 1.05 }}>
              More jobs.<br />Better earnings.
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 28 }}>
              {['Accept or reject freely', 'Smart return-load matching', 'Instant UPI payouts', 'Build reputation with ratings'].map(t => (
                <div key={t} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 15 }}>
                  <Check size={18} color="var(--teal)" strokeWidth={2.5} /> {t}
                </div>
              ))}
            </div>
            <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 36, padding: '12px 22px', borderRadius: 999, background: 'var(--dark)', color: '#fff', fontWeight: 600, textDecoration: 'none', fontSize: 15 }}>Join as provider <ArrowRight size={14} /></Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" style={{ background: 'var(--dark)', color: '#fff', padding: 'clamp(64px, 10vw, 96px) clamp(20px, 5vw, 72px)', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(255,107,43,0.15), transparent 60%)' }} />
        <h2 className="syne" style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, margin: 0, letterSpacing: '-0.03em', position: 'relative' }}>
          Ready to move with <span style={{ color: 'var(--orange)' }}>FYRO</span>?
        </h2>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.6)', marginTop: 16, position: 'relative' }}>Join 2,400+ Indian businesses already moving smarter.</p>
        <form
          onSubmit={(e) => e.preventDefault()}
          style={{ display: 'flex', gap: 8, maxWidth: 520, margin: '40px auto 0', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: 6, position: 'relative' }}
        >
          <input
            placeholder="+91 98XXX XXXXX"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', padding: '0 18px', fontSize: 15, minWidth: 0 }}
          />
          <Link href="/register" style={{ padding: '12px 22px', borderRadius: 999, background: 'var(--orange)', color: '#fff', fontWeight: 600, textDecoration: 'none', fontSize: 15, whiteSpace: 'nowrap' }}>Get early access</Link>
        </form>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 14, position: 'relative' }}>No app download needed to start</div>
        <div style={{ marginTop: 36, display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <LangPills dark />
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--bg)', padding: '36px clamp(20px, 5vw, 72px)', display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--divider)', fontSize: 13, color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Wordmark size={20} />
          <span>— Find Your Right One</span>
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <a href="#" style={{ textDecoration: 'none' }}>Privacy</a>
          <a href="#" style={{ textDecoration: 'none' }}>Terms</a>
          <a href="#" style={{ textDecoration: 'none' }}>Support</a>
          <a href="#" style={{ textDecoration: 'none' }}>Careers</a>
          <a href="#" style={{ textDecoration: 'none' }}>Partner with us</a>
        </div>
        <div>© 2026 FYRO Logistics Pvt Ltd</div>
      </footer>

      <style jsx global>{`
        @media (min-width: 900px) {
          nav .nav-links { display: flex !important; }
        }
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-card { justify-self: stretch !important; max-width: 100% !important; transform: none !important; }
          .feature-grid { grid-template-columns: 1fr !important; }
          .feature-grid > :first-child { grid-row: auto !important; }
          .steps-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .roles-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 560px) {
          .steps-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  )
}
