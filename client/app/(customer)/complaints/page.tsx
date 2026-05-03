'use client'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { ensureArray } from '@/lib/ensureArray'
import { fadeUp, staggerContainer } from '@/lib/animations'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import {
  Package, Clock, User, IndianRupee, HelpCircle, Camera,
  Info, Plus, ChevronRight, Flag, AlertTriangle, CheckCircle2, X,
} from 'lucide-react'

const CATEGORIES = [
  { id: 'damaged_goods', label: 'Damaged goods', Icon: Package },
  { id: 'late_arrival', label: 'Late arrival', Icon: Clock },
  { id: 'driver_behaviour', label: 'Driver behaviour', Icon: User },
  { id: 'wrong_charge', label: 'Wrong charge', Icon: IndianRupee },
  { id: 'other', label: 'Other', Icon: HelpCircle },
]

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  open: { bg: 'rgba(217,119,6,0.12)', color: 'var(--amber)' },
  pending: { bg: 'rgba(217,119,6,0.12)', color: 'var(--amber)' },
  in_progress: { bg: 'rgba(255,107,43,0.12)', color: 'var(--orange)' },
  resolved: { bg: 'rgba(22,163,74,0.12)', color: 'var(--green)' },
  closed: { bg: 'rgba(107,104,96,0.12)', color: 'var(--text-muted)' },
  rejected: { bg: 'rgba(220,38,38,0.12)', color: 'var(--red)' },
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // form state
  const [category, setCategory] = useState<string>('damaged_goods')
  const [description, setDescription] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const hasFetched = useRef(false)

  const load = () => {
    setLoading(true)
    api.get('/api/complaints/my')
      .then(res => {
        const list = ensureArray<any>(
          res.data?.complaints ?? res.data?.data?.complaints ?? res.data?.data ?? res.data
        )
        setComplaints(list)
      })
      .catch(() => toast.error('Failed to load complaints'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    load()
  }, [])

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (photos.length >= 3) { toast.error('Max 3 photos'); return }
    const reader = new FileReader()
    reader.onload = () => setPhotos(p => [...p, reader.result as string])
    reader.readAsDataURL(file)
  }

  const submit = async () => {
    if (!description.trim()) { toast.error('Please describe what happened'); return }
    setSubmitting(true)
    try {
      await api.post('/api/complaints', { category, description, evidence: photos })
      toast.success('Complaint submitted. We will respond within 2 hours.')
      setShowForm(false); setDescription(''); setPhotos([]); setCategory('damaged_goods')
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="page-shell narrow"
      style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}
    >
      {/* Header */}
      <motion.div variants={fadeUp} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 className="syne" style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
            Support
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Your complaints and support requests
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            height: 40, padding: '0 16px',
            borderRadius: 999, background: 'var(--orange)',
            color: '#fff', border: 'none', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontWeight: 600, fontSize: 14,
            boxShadow: '0 6px 14px rgba(255,107,43,0.25)',
            flexShrink: 0,
          }}
        >
          <Plus size={16} /> File new
        </button>
      </motion.div>

      {/* Info banner */}
      <motion.div
        variants={fadeUp}
        style={{
          padding: 12,
          background: 'rgba(37,99,235,0.05)',
          borderRadius: 12,
          border: '1px solid rgba(37,99,235,0.15)',
          fontSize: 12,
          color: 'var(--text-muted)',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <Info size={14} color="var(--blue)" style={{ flexShrink: 0 }} />
        We respond within 2 hours. Critical issues get refund-first treatment.
      </motion.div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2].map(i => <Skeleton key={i} height={100} style={{ borderRadius: 16 }} />)}
        </div>
      ) : complaints.length === 0 ? (
        <EmptyState title="No complaints yet" subtitle="We hope it stays that way. Tap 'File new' if something went wrong." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {complaints.map((c, i) => {
            const status = (c.status || 'open').toLowerCase()
            const style = STATUS_STYLES[status] || STATUS_STYLES.open
            const cat = CATEGORIES.find(x => x.id === c.category) || CATEGORIES[4]
            const CatIcon = cat.Icon
            return (
              <motion.button
                key={c._id || i}
                variants={fadeUp}
                custom={i}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelected(c)}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 16,
                  border: '1px solid var(--border-light)',
                  padding: 16,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: 'var(--orange-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <CatIcon size={16} color="var(--orange)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize' as const }}>
                      {cat.label}
                    </span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      background: style.bg,
                      color: style.color,
                    }}>
                      {status.replace('_', ' ')}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' as const,
                    margin: 0,
                  }}>
                    {c.description}
                  </p>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 6 }}>
                    {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-faint)" style={{ flexShrink: 0, marginTop: 4 }} />
              </motion.button>
            )
          })}
        </div>
      )}

      {/* Detail modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Complaint detail">
        {selected && (() => {
          const status = (selected.status || 'open').toLowerCase()
          const style = STATUS_STYLES[status] || STATUS_STYLES.open
          const cat = CATEGORIES.find(x => x.id === selected.category) || CATEGORIES[4]
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{cat.label}</span>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  background: style.bg,
                  color: style.color,
                }}>
                  {status.replace('_', ' ')}
                </span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{selected.description}</p>
              {selected.adminNote && (
                <div style={{ background: 'var(--orange-tint)', borderLeft: '3px solid var(--orange)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange-dark)', marginBottom: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Admin response
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--text)', margin: 0 }}>{selected.adminNote}</p>
                </div>
              )}
              <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                Raised on {new Date(selected.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* File new modal */}
      <Modal isOpen={showForm} onClose={() => !submitting && setShowForm(false)} title="Report an issue">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Category */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 8, display: 'block' }}>
              Category
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {CATEGORIES.map(({ id, label, Icon }) => {
                const sel = category === id
                return (
                  <button
                    key={id}
                    onClick={() => setCategory(id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: sel ? '2px solid var(--orange)' : '1px solid var(--border-light)',
                      background: sel ? 'var(--orange-tint)' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 13,
                      fontWeight: sel ? 600 : 500,
                      color: sel ? 'var(--orange-dark)' : 'var(--text)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <Icon size={16} color={sel ? 'var(--orange)' : 'var(--text-muted)'} />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 6, display: 'block' }}>
              Describe what happened
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Please give us details so we can help faster..."
              style={{
                width: '100%', height: 100,
                borderRadius: 12,
                border: '1px solid var(--border-light)',
                background: 'var(--bg)',
                padding: 12,
                fontSize: 14,
                fontFamily: 'var(--font-body)',
                color: 'var(--text)',
                resize: 'none',
                outline: 'none',
              }}
            />
          </div>

          {/* Photos */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 6, display: 'block' }}>
              Add photos (optional)
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <label
                style={{
                  width: 64, height: 64, borderRadius: 10,
                  background: 'var(--bg-secondary)',
                  border: '1px dashed var(--border-strong)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-muted)', cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <Camera size={18} />
                <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
              </label>
              {photos.map((src, i) => (
                <div key={i} style={{ position: 'relative', width: 64, height: 64, borderRadius: 10, overflow: 'hidden' }}>
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    onClick={() => setPhotos(p => p.filter((_, idx) => idx !== i))}
                    style={{
                      position: 'absolute', top: 2, right: 2,
                      width: 18, height: 18, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.7)', color: '#fff',
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={submit}
            disabled={submitting}
            style={{
              height: 52,
              borderRadius: 999,
              background: 'var(--orange)', color: '#fff', border: 'none',
              fontWeight: 600, fontSize: 15,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              marginTop: 4,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {submitting ? 'Submitting…' : (<><Flag size={16} /> Submit complaint</>)}
          </button>
        </div>
      </Modal>
    </motion.div>
  )
}
