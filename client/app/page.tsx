'use client'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { fadeUp, staggerContainer, slideInRight, springPop } from '@/lib/animations'
import { Truck, Package, Clock, MapPin, Star, Shield, Headphones, CheckCircle, ChevronRight, Zap, Users } from 'lucide-react'

function CountUp({ target, prefix = '', suffix = '' }: { target: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const duration = 1500
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target])

  return <span ref={ref}>{prefix}{count}{suffix}</span>
}

const features = [
  { icon: MapPin, title: 'Real-time Tracking', desc: 'Watch your goods move on a live map with GPS accuracy to 10 meters.' },
  { icon: Zap, title: 'Instant Booking', desc: 'Match with a verified driver or hamali worker in under 5 minutes.' },
  { icon: Star, title: 'Fair Pricing', desc: 'Transparent fare breakdown with no hidden charges. Ever.' },
  { icon: Package, title: 'Hamali Services', desc: 'Book skilled loading/unloading workers by the hour.' },
  { icon: Shield, title: 'Verified Providers', desc: 'Every driver and hamali worker is KYC verified before onboarding.' },
  { icon: Headphones, title: '24/7 Support', desc: 'Our support team is available round the clock for any issue.' },
]

const steps = [
  { num: '01', title: 'Book', desc: 'Choose truck or hamali, set pickup & dropoff' },
  { num: '02', title: 'Match', desc: 'Get matched with a nearby verified provider' },
  { num: '03', title: 'Track', desc: 'Watch live on map, chat with your provider' },
  { num: '04', title: 'Done', desc: 'Pay digitally, rate your experience' },
]

export default function LandingPage() {
  const [lang, setLang] = useState<'EN' | 'HI' | 'TE'>('EN')
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const statsRef = useRef(null)
  const featRef = useRef(null)
  const stepsRef = useRef(null)
  const rolesRef = useRef(null)
  const statsInView = useInView(statsRef, { once: true, margin: '-80px' })
  const featInView = useInView(featRef, { once: true, margin: '-80px' })
  const stepsInView = useInView(stepsRef, { once: true, margin: '-80px' })
  const rolesInView = useInView(rolesRef, { once: true, margin: '-80px' })

  const heroLines = {
    EN: ['Find Your', 'Right One', 'Instantly.'],
    HI: ['अपना सही', 'साथी खोजें', 'तुरंत।'],
    TE: ['మీ సరైన', 'భాగస్వామిని', 'వెంటనే కనుగొనండి।'],
  }
  const subtext = {
    EN: 'Book trucks and hamali workers in minutes. Real-time tracking, fair pricing, verified providers.',
    HI: 'मिनटों में ट्रक और हमाली बुक करें। रियल-टाइम ट्रैकिंग, उचित मूल्य, सत्यापित प्रदाता।',
    TE: 'నిమిషాల్లో ట్రక్కులు మరియు హమాలీ వర్కర్లను బుక్ చేయండి.',
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Sticky Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        background: 'rgba(242,239,233,0.85)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Syne, sans-serif', fontWeight: 800, color: 'white', fontSize: 18
          }}>F</div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 20 }}>FYRO</span>
        </div>
        <Link href="/login">
          <motion.button
            whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
            style={{
              background: 'var(--text)', color: 'white', border: 'none',
              padding: '10px 24px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif', fontWeight: 500, fontSize: 15
            }}
          >Login</motion.button>
        </Link>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '80px 24px 64px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 48 }}>
          <motion.div variants={staggerContainer} initial="hidden" animate="show">
            {/* Live badge */}
            <motion.div variants={fadeUp} custom={0} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--teal-light)', color: 'var(--teal)', padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500, marginBottom: 28 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
              Now live in AP &amp; Telangana
            </motion.div>

            {/* Language pills */}
            <motion.div variants={fadeUp} custom={0.5} style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
              {(['EN', 'HI', 'TE'] as const).map(l => (
                <button key={l} onClick={() => setLang(l)} style={{
                  padding: '6px 16px', borderRadius: 999, border: '1.5px solid',
                  borderColor: lang === l ? 'var(--accent)' : 'var(--border-strong)',
                  background: lang === l ? 'var(--accent-light)' : 'transparent',
                  color: lang === l ? 'var(--accent)' : 'var(--text-muted)',
                  fontWeight: 500, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s'
                }}>{l}</button>
              ))}
            </motion.div>

            {/* Headline */}
            <div style={{ marginBottom: 24 }}>
              {heroLines[lang].map((line, i) => (
                <motion.h1 key={`${lang}-${i}`} variants={fadeUp} custom={i + 1}
                  style={{
                    fontFamily: 'Syne, sans-serif', fontWeight: 800,
                    fontSize: 'clamp(40px, 8vw, 72px)', lineHeight: 1.1,
                    color: i === 1 ? 'var(--accent)' : 'var(--text)',
                    marginBottom: 4
                  }}>{line}</motion.h1>
              ))}
            </div>

            <motion.p variants={fadeUp} custom={4} style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 40, maxWidth: 500 }}>
              {subtext[lang]}
            </motion.p>

            <motion.div variants={fadeUp} custom={5} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/book">
                <motion.button whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }} whileTap={{ scale: 0.97 }}
                  style={{
                    background: 'var(--accent)', color: 'white', border: 'none',
                    padding: '16px 32px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 16,
                    display: 'flex', alignItems: 'center', gap: 8
                  }}>
                  <Truck size={18} /> Book a Truck
                </motion.button>
              </Link>
              <Link href="/register">
                <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                  style={{
                    background: 'transparent', color: 'var(--accent)',
                    border: '1.5px solid var(--accent)',
                    padding: '16px 32px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 16
                  }}>
                  Register as Driver
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Mock booking card */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
            <div style={{
              background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 24,
              boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)',
              maxWidth: 380
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16 }}>Live Booking</span>
                <span style={{ background: 'var(--accent-light)', color: 'var(--accent)', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                  In Progress
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin size={16} color="var(--accent)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 2 }}>Pickup</div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>Ameerpet Metro, Hyderabad</div>
                  </div>
                </div>
                <div style={{ width: 1, height: 16, background: 'var(--border-strong)', marginLeft: 16 }} />
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--teal-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CheckCircle size={16} color="var(--teal)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 2 }}>Dropoff</div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>Gachibowli IT Hub, Hyderabad</div>
                  </div>
                </div>
              </div>
              <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Driver ETA</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--accent)' }}>4 min</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Fare</div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>₹480</div>
                </div>
              </div>
              {/* Shimmer placeholder for map */}
              <div className="shimmer" style={{ height: 100, borderRadius: 'var(--radius-sm)', marginBottom: 12 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="shimmer" style={{ height: 12, borderRadius: 6, flex: 2 }} />
                <div className="shimmer" style={{ height: 12, borderRadius: 6, flex: 1 }} />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <motion.section ref={statsRef}
        initial={{ opacity: 0, y: 30 }} animate={statsInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        style={{ background: 'var(--text)', padding: '40px 24px', margin: '0 0 80px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, textAlign: 'center' }}>
          {[
            { value: 500, suffix: '+', label: 'Trucks Available' },
            { value: 5, prefix: '< ', suffix: ' min', label: 'Average Match Time' },
            { value: 12, suffix: ' cities', label: 'Cities Covered' },
          ].map((stat, i) => (
            <div key={i}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(28px, 5vw, 48px)', color: 'var(--accent)' }}>
                <CountUp target={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Features */}
      <section ref={featRef} style={{ padding: '0 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={featInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: 12 }}>Why FYRO?</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 17, maxWidth: 480, margin: '0 auto' }}>Built ground-up for the Indian logistics market. Fast, fair, and reliable.</p>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {features.map((f, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 30 }} animate={featInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              style={{
                background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: 24,
                border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)'
              }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <f.icon size={22} color="var(--accent)" />
              </div>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section ref={stepsRef} style={{ padding: '0 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={stepsInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: 12 }}>How It Works</h2>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, position: 'relative' }}>
          {steps.map((step, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 30 }} animate={stepsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              style={{ textAlign: 'center', padding: 24 }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: i % 2 === 0 ? 'var(--accent)' : 'var(--text)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
                fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: 'white'
              }}>{step.num}</div>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>{step.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.5 }}>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Role Cards */}
      <section ref={rolesRef} style={{ padding: '0 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          <motion.div initial={{ opacity: 0, x: -40 }} animate={rolesInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6 }}>
            <Link href="/book" style={{ textDecoration: 'none' }}>
              <motion.div whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }} style={{
                background: 'var(--text)', color: 'white', borderRadius: 'var(--radius-lg)', padding: 36,
                cursor: 'pointer', transition: 'box-shadow 0.2s'
              }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <Package size={26} color="white" />
                </div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24, marginBottom: 10 }}>I need to<br />move goods</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.5, marginBottom: 20 }}>Book trucks and hamali workers for any move, large or small.</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontWeight: 600 }}>
                  Book Now <ChevronRight size={16} />
                </div>
              </motion.div>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 40 }} animate={rolesInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 }}>
            <Link href="/register" style={{ textDecoration: 'none' }}>
              <motion.div whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }} style={{
                background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 36,
                border: '1.5px solid var(--border-strong)', cursor: 'pointer', transition: 'box-shadow 0.2s'
              }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--teal-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <Truck size={26} color="var(--teal)" />
                </div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24, marginBottom: 10 }}>I provide<br />transport / labor</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.5, marginBottom: 20 }}>Join as a truck driver or hamali worker. Earn on your own schedule.</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--teal)', fontWeight: 600 }}>
                  Register Now <ChevronRight size={16} />
                </div>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ background: 'var(--text)', padding: '64px 24px', marginBottom: 0 }}>
        <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(28px, 4vw, 40px)', color: 'white', marginBottom: 12 }}>Get Early Access</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, marginBottom: 32, lineHeight: 1.5 }}>Enter your phone number and we'll notify you when FYRO launches in your city.</p>
          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 18 }}>
              <CheckCircle size={24} style={{ display: 'inline', marginRight: 8 }} />
              You're on the list!
            </motion.div>
          ) : (
            <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
              <input
                value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                style={{
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 'var(--radius-md)', padding: '16px 20px', color: 'white',
                  fontSize: 16, outline: 'none', width: '100%'
                }}
              />
              <motion.button
                whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                onClick={() => { if (phone.length >= 10) setSubmitted(true) }}
                style={{
                  background: 'var(--accent)', color: 'white', border: 'none',
                  padding: '16px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 16
                }}>
                Notify Me
              </motion.button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--text)', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '32px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 800, color: 'white', fontSize: 14 }}>F</div>
            <span style={{ color: 'white', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16 }}>FYRO</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>© {new Date().getFullYear()} FYRO Logistics. All rights reserved.</div>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacy', 'Terms', 'Contact'].map(link => (
              <Link key={link} href="#" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecoration: 'none' }}>{link}</Link>
            ))}
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  )
}
