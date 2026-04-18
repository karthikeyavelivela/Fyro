'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import {
  ArrowRight,
  Check,
  Clock,
  Languages,
  MapPin,
  MessageCircle,
  Package,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Users,
  WalletCards,
} from 'lucide-react'
import { fadeUp, springCard, stagger } from '@/lib/motion'

const features = [
  {
    icon: MapPin,
    title: 'Real-time GPS Tracking',
    desc: 'Pickup, route, provider movement, and ETA stay visible from request to delivery.',
  },
  {
    icon: Sparkles,
    title: 'Return Load Matching',
    desc: 'FYRO reduces empty return trips by matching trucks with nearby reverse demand.',
    highlight: true,
  },
  {
    icon: Clock,
    title: 'Instant Booking',
    desc: 'Post the movement, see nearby capacity, and request verified operators in under 60 seconds.',
  },
  {
    icon: MessageCircle,
    title: 'In-app Messaging',
    desc: 'Coordinate pickup details without sharing personal phone numbers across the marketplace.',
  },
  {
    icon: Package,
    title: 'Hamali Booking',
    desc: 'India-first loading and unloading workflows with team size, floor, and heavy-goods pricing.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified Operators',
    desc: 'Driver, vehicle, and worker profiles are checked before they can accept jobs.',
  },
]

const steps = [
  ['01', 'Create account', 'Pick customer, driver, or hamali and set your service preferences.'],
  ['02', 'Post your need', 'Add pickup, dropoff, goods, team size, schedule, and service type.'],
  ['03', 'Get matched', 'Nearby verified providers receive the request and can accept in real time.'],
  ['04', 'Track and pay', 'Follow live movement, chat in-app, pay digitally, and rate the job.'],
]

function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let frame = 0
    const frames = 70
    const id = window.setInterval(() => {
      frame += 1
      setCount(Math.round((value * frame) / frames))
      if (frame >= frames) window.clearInterval(id)
    }, 18)
    return () => window.clearInterval(id)
  }, [inView, value])

  return <span ref={ref}>{count.toLocaleString('en-IN')}{suffix}</span>
}

function HeroWords() {
  const words = ['Find', 'Your', 'Right', 'One']
  return (
    <motion.h1 className="hero-title" variants={stagger} initial="hidden" animate="show">
      {words.map((word, index) => (
        <motion.span
          key={word}
          variants={fadeUp}
          custom={index}
          className={word === 'Your' ? 'accent-word' : undefined}
        >
          {word}{index === words.length - 1 ? '' : ' '}
        </motion.span>
      ))}
      <motion.span variants={fadeUp} custom={4} className="hero-subline">
        for trucks, hamali, and urgent movement.
      </motion.span>
    </motion.h1>
  )
}

export default function LandingPage() {
  const featureRef = useRef(null)
  const stepsRef = useRef(null)
  const rolesRef = useRef(null)
  const featuresVisible = useInView(featureRef, { once: true, margin: '-120px' })
  const stepsVisible = useInView(stepsRef, { once: true, margin: '-120px' })
  const rolesVisible = useInView(rolesRef, { once: true, margin: '-120px' })
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)

  return (
    <motion.main className="landing" variants={fadeUp} initial="hidden" animate="show">
      <header className="nav-shell">
        <Link href="/" className="brand" aria-label="FYRO home">
          <span className="brand-mark">F</span>
          <span>
            <strong>FYRO</strong>
            <small>FIND YOUR RIGHT ONE</small>
          </span>
        </Link>
        <nav aria-label="Landing page navigation">
          <a href="#features">Features</a>
          <a href="#roles">Roles</a>
          <a href="#early-access">Early access</a>
        </nav>
        <div className="nav-actions">
          <Link href="/login" className="ghost-link">Log in</Link>
          <Link href="/register" className="solid-link">Get Started</Link>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Ola/Rapido for Indian logistics</p>
          <HeroWords />
          <motion.p variants={fadeUp} custom={5} className="hero-body">
            Book trucks and hamali workers instantly, track live, and pay via UPI. FYRO turns empty return trips into a dispatch network for shippers, truck owners, and worker teams.
          </motion.p>
          <motion.div variants={fadeUp} custom={6} className="hero-actions">
            <Link href="/book?type=transport">
              <motion.span whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className="cta-primary">
                Start booking <ArrowRight size={18} />
              </motion.span>
            </Link>
            <Link href="/register">
              <motion.span whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className="cta-secondary">
                Become a provider
              </motion.span>
            </Link>
          </motion.div>
        </div>

        <motion.aside className="booking-card" variants={springCard} initial="hidden" animate="show">
          <div className="card-top">
            <span>Live booking</span>
            <strong>FY-2026-1048</strong>
          </div>
          <div className="vehicle-row">
            <span className="truck-icon"><Truck size={26} /></span>
            <div>
              <p>Tempo assigned</p>
              <small>AP39 CD 5678 · verified operator</small>
            </div>
          </div>
          <div className="route-list">
            <div>
              <span className="route-dot pickup" />
              <p><small>Pickup</small>Auto Nagar, Vijayawada</p>
            </div>
            <div>
              <span className="route-dot drop" />
              <p><small>Dropoff</small>Benz Circle, Vijayawada</p>
            </div>
          </div>
          <div className="booking-metrics">
            <div>
              <small>ETA</small>
              <strong>8 min</strong>
            </div>
            <div>
              <small>Fare</small>
              <strong>₹642</strong>
            </div>
            <div>
              <small>Status</small>
              <strong>Live</strong>
            </div>
          </div>
          <div className="mini-map" aria-hidden="true">
            <span className="map-line" />
            <span className="map-pin start" />
            <span className="map-pin end" />
            <span className="map-truck"><Truck size={16} /></span>
          </div>
        </motion.aside>
      </section>

      <section className="stats-row" aria-label="FYRO stats">
        <div><strong><CountUp value={1200} suffix="+" /></strong><span>trucks registered</span></div>
        <div><strong><CountUp value={58} suffix=" sec" /></strong><span>average match time</span></div>
        <div><strong><CountUp value={9} /></strong><span>launch cities</span></div>
      </section>

      <section id="features" ref={featureRef} className="features-section">
        <div className="section-heading">
          <p className="eyebrow">WHY FYRO</p>
          <h2>Logistics, finally built right.</h2>
        </div>
        <motion.div className="feature-grid" variants={stagger} initial="hidden" animate={featuresVisible ? 'show' : 'hidden'}>
          {features.map((feature) => (
            <motion.article key={feature.title} variants={springCard} className={feature.highlight ? 'feature-card highlight' : 'feature-card'}>
              <feature.icon size={24} />
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </motion.article>
          ))}
        </motion.div>
      </section>

      <section ref={stepsRef} className="steps-section">
        <div className="section-heading">
          <p className="eyebrow">HOW IT WORKS</p>
          <h2>Move anything in 4 steps.</h2>
        </div>
        <motion.div className="step-line" variants={stagger} initial="hidden" animate={stepsVisible ? 'show' : 'hidden'}>
          {steps.map(([num, title, desc], index) => (
            <motion.article key={num} variants={fadeUp} custom={index * 0.15} className="step-card">
              <strong>{num}</strong>
              <h3>{title}</h3>
              <p>{desc}</p>
            </motion.article>
          ))}
        </motion.div>
      </section>

      <section id="roles" ref={rolesRef} className="roles-section">
        <motion.article variants={fadeUp} initial="hidden" animate={rolesVisible ? 'show' : 'hidden'} className="role-card dark-role">
          <span className="role-badge">Shippers / Businesses</span>
          <h2>Move goods without calling ten operators.</h2>
          {['Instant truck and hamali booking', 'Live tracking with ETA', 'Transparent GST fare breakdown', 'Receipts, complaints, and chat in one place'].map((item) => (
            <p key={item}><Check size={18} />{item}</p>
          ))}
          <Link href="/register" className="role-cta">Start as customer</Link>
        </motion.article>
        <motion.article variants={fadeUp} custom={1} initial="hidden" animate={rolesVisible ? 'show' : 'hidden'} className="role-card light-role">
          <span className="role-badge">Drivers & Hamali</span>
          <h2>Earn from nearby demand and return loads.</h2>
          {['Go online when available', 'Receive nearby requests in real time', 'Counter within controlled fare range', 'Track earnings and completed jobs'].map((item) => (
            <p key={item}><Check size={18} />{item}</p>
          ))}
          <Link href="/register" className="role-cta">Become a provider</Link>
        </motion.article>
      </section>

      <section id="early-access" className="early-section">
        <div>
          <p className="eyebrow">EARLY ACCESS</p>
          <h2>Ready to move with FYRO?</h2>
          <p>Join the Vijayawada rollout list for shippers, truck owners, and hamali teams.</p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (phone.trim().length >= 10) setSubmitted(true)
          }}
        >
          <label htmlFor="early-phone">Mobile number</label>
          <div className="phone-row">
            <input id="early-phone" value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" placeholder="+91 98765 43210" />
            <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} type="submit">
              {submitted ? 'Added' : 'Get early access'}
            </motion.button>
          </div>
          <div className="language-pills" aria-label="Language options">
            <span><Languages size={15} /> English</span>
            <span>हिंदी</span>
            <span>తెలుగు</span>
          </div>
        </form>
      </section>

      <footer className="footer">
        <div className="brand">
          <span className="brand-mark">F</span>
          <span>
            <strong>FYRO</strong>
            <small>FIND YOUR RIGHT ONE</small>
          </span>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="#">Privacy</Link>
          <Link href="#">Terms</Link>
          <Link href="#">Support</Link>
          <Link href="/register">Partner with us</Link>
        </nav>
        <p>Copyright {new Date().getFullYear()} FYRO Logistics.</p>
      </footer>

      <style jsx>{`
        .landing {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          overflow-x: hidden;
        }
        .nav-shell {
          position: sticky;
          top: 0;
          z-index: 30;
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 24px;
          min-height: 76px;
          padding: 12px clamp(20px, 5vw, 64px);
          background: rgba(242, 239, 233, 0.88);
          border-bottom: 1px solid var(--border);
          backdrop-filter: blur(18px);
        }
        .brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: inherit;
          text-decoration: none;
        }
        .brand-mark {
          display: grid;
          place-items: center;
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          background: var(--accent);
          color: white;
          font: 800 20px/1 Syne, sans-serif;
          box-shadow: var(--shadow-sm);
        }
        .brand strong {
          display: block;
          font: 800 20px/1 Syne, sans-serif;
          letter-spacing: -0.02em;
        }
        .brand small {
          display: block;
          margin-top: 3px;
          color: var(--text-muted);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
        }
        .nav-shell nav {
          display: flex;
          justify-content: center;
          gap: 28px;
        }
        .nav-shell a {
          color: var(--text-muted);
          font-weight: 500;
          text-decoration: none;
        }
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ghost-link,
        .solid-link,
        .cta-primary,
        .cta-secondary,
        .role-cta {
          min-height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 999px;
          padding: 0 22px;
          font-weight: 600;
          text-decoration: none;
        }
        .solid-link,
        .cta-primary,
        .role-cta {
          background: var(--accent);
          color: white;
        }
        .cta-secondary,
        .ghost-link {
          border: 1px solid var(--border-strong);
          color: var(--text);
          background: transparent;
        }
        .hero-section {
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(360px, 0.72fr);
          gap: clamp(32px, 6vw, 80px);
          align-items: center;
          max-width: 1240px;
          min-height: calc(100vh - 180px);
          padding: clamp(52px, 8vw, 96px) clamp(20px, 5vw, 64px) 44px;
          margin: 0 auto;
        }
        .eyebrow {
          color: var(--accent);
          font-size: var(--text-xs);
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .hero-title {
          margin: 18px 0 24px;
          max-width: 820px;
          font: 800 var(--text-hero)/1 Syne, sans-serif;
          letter-spacing: -0.04em;
        }
        .hero-title span {
          display: inline-block;
        }
        .accent-word {
          color: var(--accent);
        }
        .hero-subline {
          display: block !important;
          margin-top: 6px;
        }
        .hero-body {
          max-width: 640px;
          color: var(--text-muted);
          font-size: var(--text-lg);
        }
        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 34px;
        }
        .booking-card {
          width: 100%;
          max-width: 440px;
          justify-self: end;
          padding: 24px;
          border: 1px solid var(--border-dark);
          border-radius: var(--radius-xl);
          background: var(--surface-dark);
          color: var(--text-on-dark);
          box-shadow: var(--shadow-xl);
        }
        .card-top,
        .vehicle-row,
        .booking-metrics {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .card-top {
          margin-bottom: 24px;
          color: var(--text-muted-dark);
          font-size: var(--text-sm);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .card-top strong {
          color: var(--accent);
          font-family: Syne, sans-serif;
          letter-spacing: 0;
        }
        .vehicle-row {
          justify-content: flex-start;
          padding: 16px;
          border-radius: var(--radius-md);
          background: var(--surface-dark-2);
          border: 1px solid var(--border-dark);
        }
        .truck-icon {
          display: grid;
          place-items: center;
          width: 52px;
          height: 52px;
          border-radius: var(--radius-md);
          background: var(--accent);
        }
        .vehicle-row p,
        .route-list p {
          margin: 0;
          font-weight: 600;
        }
        .vehicle-row small,
        .route-list small,
        .booking-metrics small {
          display: block;
          color: var(--text-muted-dark);
          font-size: var(--text-xs);
          font-weight: 500;
        }
        .route-list {
          display: grid;
          gap: 18px;
          margin: 24px 0;
        }
        .route-list div {
          display: grid;
          grid-template-columns: 18px 1fr;
          gap: 12px;
          align-items: start;
        }
        .route-dot {
          width: 12px;
          height: 12px;
          margin-top: 8px;
          border-radius: 50%;
        }
        .pickup {
          background: var(--accent);
          box-shadow: 0 0 0 8px rgba(255, 107, 43, 0.14);
        }
        .drop {
          background: var(--text-on-dark);
        }
        .booking-metrics {
          padding: 16px;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.05);
        }
        .booking-metrics strong {
          display: block;
          margin-top: 2px;
          font: 800 24px/1 Syne, sans-serif;
          color: var(--accent);
        }
        .mini-map {
          position: relative;
          height: 148px;
          margin-top: 18px;
          overflow: hidden;
          border-radius: var(--radius-lg);
          background:
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            #11100E;
          background-size: 42px 42px;
        }
        .map-line {
          position: absolute;
          inset: 42px 64px 54px 52px;
          border: 2px dashed rgba(255, 107, 43, 0.72);
          border-left: 0;
          border-bottom: 0;
          border-radius: 0 40px 0 0;
        }
        .map-pin,
        .map-truck {
          position: absolute;
          display: grid;
          place-items: center;
          border-radius: 50%;
        }
        .map-pin {
          width: 16px;
          height: 16px;
          background: var(--accent);
        }
        .map-pin.start { left: 44px; bottom: 44px; }
        .map-pin.end { right: 54px; top: 34px; background: var(--text-on-dark); }
        .map-truck {
          left: 54%;
          top: 44px;
          width: 36px;
          height: 36px;
          color: white;
          background: var(--accent);
          animation: floatTruck 2.4s ease-in-out infinite;
        }
        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          max-width: 1112px;
          margin: 0 auto 0;
          overflow: hidden;
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          background: var(--border);
        }
        .stats-row div {
          padding: 28px 24px;
          background: rgba(255,255,255,0.45);
        }
        .stats-row strong {
          display: block;
          font: 800 var(--text-3xl)/1 Syne, sans-serif;
          color: var(--accent);
          font-variant-numeric: tabular-nums;
        }
        .stats-row span {
          color: var(--text-muted);
          font-weight: 500;
        }
        .features-section,
        .steps-section,
        .roles-section,
        .early-section,
        .footer {
          padding-left: clamp(20px, 5vw, 64px);
          padding-right: clamp(20px, 5vw, 64px);
        }
        .features-section {
          margin-top: 84px;
          padding-top: 88px;
          padding-bottom: 96px;
          background: var(--bg-secondary);
        }
        .section-heading {
          max-width: 720px;
          margin: 0 auto 40px;
          text-align: center;
        }
        .section-heading h2,
        .early-section h2,
        .role-card h2 {
          margin: 8px 0 0;
          font: 700 var(--text-3xl)/1.1 Syne, sans-serif;
          letter-spacing: -0.03em;
        }
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          max-width: 1112px;
          margin: 0 auto;
        }
        .feature-card {
          min-height: 230px;
          padding: 24px;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          background: var(--surface);
          box-shadow: var(--shadow-sm);
        }
        .feature-card svg {
          color: var(--accent);
        }
        .feature-card h3 {
          margin: 20px 0 8px;
          font: 600 var(--text-xl)/1.15 Syne, sans-serif;
          letter-spacing: -0.02em;
        }
        .feature-card p {
          color: var(--text-muted);
        }
        .feature-card.highlight {
          grid-column: span 2;
          background: var(--surface-dark);
          color: var(--text-on-dark);
        }
        .feature-card.highlight p {
          color: var(--text-muted-dark);
        }
        .steps-section {
          max-width: 1240px;
          margin: 0 auto;
          padding-top: 96px;
          padding-bottom: 96px;
        }
        .step-line {
          position: relative;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .step-line:before {
          content: '';
          position: absolute;
          top: 31px;
          left: 8%;
          right: 8%;
          height: 2px;
          background: var(--border-strong);
        }
        .step-card {
          position: relative;
          z-index: 1;
          padding: 0 8px;
        }
        .step-card strong {
          display: grid;
          place-items: center;
          width: 64px;
          height: 64px;
          margin-bottom: 20px;
          border-radius: 50%;
          background: var(--accent);
          color: white;
          font: 800 18px/1 Syne, sans-serif;
        }
        .step-card h3 {
          font: 600 var(--text-xl)/1.15 Syne, sans-serif;
          letter-spacing: -0.02em;
        }
        .step-card p {
          margin-top: 8px;
          color: var(--text-muted);
        }
        .roles-section {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
          max-width: 1240px;
          margin: 0 auto 96px;
        }
        .role-card {
          padding: clamp(28px, 5vw, 48px);
          border-radius: var(--radius-xl);
          border: 1px solid var(--border);
        }
        .dark-role {
          background: var(--surface-dark);
          color: var(--text-on-dark);
        }
        .light-role {
          background: var(--surface);
        }
        .role-badge {
          display: inline-flex;
          margin-bottom: 18px;
          border-radius: 999px;
          padding: 8px 12px;
          background: rgba(255, 107, 43, 0.13);
          color: var(--accent);
          font-size: var(--text-xs);
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .role-card p {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-top: 18px;
          color: inherit;
        }
        .dark-role p {
          color: var(--text-muted-dark);
        }
        .role-card p svg {
          color: var(--accent);
          flex: 0 0 auto;
        }
        .role-cta {
          margin-top: 28px;
        }
        .early-section {
          display: grid;
          grid-template-columns: 0.8fr 1fr;
          gap: 32px;
          align-items: center;
          padding-top: 64px;
          padding-bottom: 64px;
          background: var(--surface-dark);
          color: var(--text-on-dark);
        }
        .early-section > div,
        .early-section form {
          max-width: 560px;
        }
        .early-section p:not(.eyebrow) {
          color: var(--text-muted-dark);
        }
        .early-section label {
          display: block;
          margin-bottom: 8px;
          color: var(--text-muted-dark);
          font-size: var(--text-sm);
          font-weight: 600;
        }
        .phone-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
        }
        .phone-row input {
          min-height: 52px;
          width: 100%;
          border: 1px solid var(--border-dark);
          border-radius: var(--radius-md);
          padding: 0 16px;
          background: rgba(255,255,255,0.06);
          color: var(--text-on-dark);
          font: 400 16px/1 Outfit, sans-serif;
          outline: none;
        }
        .phone-row button {
          min-height: 52px;
          border: 0;
          border-radius: var(--radius-md);
          padding: 0 20px;
          background: var(--accent);
          color: white;
          font-weight: 700;
          cursor: pointer;
        }
        .language-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }
        .language-pills span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid var(--border-dark);
          border-radius: 999px;
          padding: 8px 12px;
          color: var(--text-muted-dark);
          font-weight: 600;
        }
        .footer {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 24px;
          padding-top: 32px;
          padding-bottom: 32px;
          background: var(--surface-dark);
          color: var(--text-on-dark);
          border-top: 1px solid var(--border-dark);
        }
        .footer nav {
          display: flex;
          justify-content: center;
          gap: 20px;
        }
        .footer a,
        .footer p {
          color: var(--text-muted-dark);
          text-decoration: none;
        }
        @keyframes floatTruck {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(10px, -5px, 0); }
        }
        @media (max-width: 920px) {
          .nav-shell {
            grid-template-columns: auto auto;
          }
          .nav-shell nav {
            display: none;
          }
          .hero-section,
          .early-section,
          .roles-section {
            grid-template-columns: 1fr;
          }
          .booking-card {
            justify-self: stretch;
            max-width: none;
          }
          .feature-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .step-line {
            grid-template-columns: 1fr;
          }
          .step-line:before {
            top: 0;
            bottom: 0;
            left: 31px;
            right: auto;
            width: 2px;
            height: auto;
          }
          .step-card {
            display: grid;
            grid-template-columns: 64px 1fr;
            column-gap: 16px;
          }
          .step-card strong {
            grid-row: span 2;
          }
          .footer {
            grid-template-columns: 1fr;
          }
          .footer nav {
            justify-content: flex-start;
            flex-wrap: wrap;
          }
        }
        @media (max-width: 640px) {
          .nav-shell {
            min-height: 68px;
          }
          .nav-actions .ghost-link {
            display: none;
          }
          .solid-link {
            padding: 0 16px;
          }
          .hero-section {
            min-height: auto;
            padding-top: 40px;
          }
          .hero-actions,
          .phone-row,
          .stats-row {
            grid-template-columns: 1fr;
          }
          .hero-actions a,
          .cta-primary,
          .cta-secondary {
            width: 100%;
          }
          .stats-row {
            display: grid;
          }
          .feature-grid {
            grid-template-columns: 1fr;
          }
          .feature-card.highlight {
            grid-column: auto;
          }
        }
      `}</style>
    </motion.main>
  )
}
