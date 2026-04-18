'use client'
import { InputHTMLAttributes, forwardRef, useState } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
}

const Input = forwardRef<HTMLInputElement, Props>(({ label, error, helper, className, ...props }, ref) => {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{label}</label>
      )}
      <input
        ref={ref}
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e) }}
        onBlur={e => { setFocused(false); props.onBlur?.(e) }}
        style={{
          width: '100%',
          background: 'var(--surface-raised)',
          border: `1.5px solid ${error ? 'var(--red)' : focused ? 'var(--accent)' : 'var(--border-strong)'}`,
          borderRadius: 'var(--radius-sm)',
          padding: '14px 16px',
          fontSize: 16,
          color: 'var(--text)',
          outline: 'none',
          fontFamily: 'Outfit, sans-serif',
          transition: 'border-color 0.2s',
          ...props.style
        }}
        className={className}
      />
      {error && <span style={{ fontSize: 12, color: 'var(--red)' }}>{error}</span>}
      {helper && !error && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{helper}</span>}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
