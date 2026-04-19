'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export default function Modal({ isOpen, onClose, title, children }: Props) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'black', zIndex: 100 }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101,
              background: 'var(--surface)', borderRadius: '24px 24px 0 0',
              maxHeight: '90vh', overflowY: 'auto',
              paddingBottom: 'max(24px, env(safe-area-inset-bottom))'
            }}>
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)' }} />
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>{title || ''}</h2>
              <button onClick={onClose} style={{ background: 'var(--surface-raised)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '24px' }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
