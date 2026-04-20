'use client'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { ensureArray } from '@/lib/ensureArray'
import { socket } from '@/lib/socket'
import { Send } from 'lucide-react'

interface Message {
  _id: string
  senderId?: string
  senderRole?: string
  content: string
  type?: 'user' | 'system'
  createdAt?: string
  read?: boolean
}

interface Props {
  bookingId: string
  currentUserId: string
  currentUserRole: string
}

function formatTime(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function normalizeMessage(payload: any): Message | null {
  const raw = payload?.message ?? payload
  if (!raw || typeof raw !== 'object') return null
  const sender = raw.senderId
  return {
    ...raw,
    senderId: typeof sender === 'string' ? sender : sender?._id,
    senderRole: raw.senderRole || sender?.role,
  }
}

export default function ChatBox({ bookingId, currentUserId, currentUserRole }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.get(`/api/bookings/${bookingId}/messages`).then(res => {
      const list = ensureArray<any>(res.data?.messages ?? res.data?.data?.messages ?? res.data?.data ?? res.data)
      setMessages(list.map(normalizeMessage).filter(Boolean) as Message[])
    }).catch(() => {})

    socket.emit('join:booking', { bookingId })
    socket.on('message:new', (payload: any) => {
      const msg = normalizeMessage(payload)
      if (!msg) return
      setMessages(prev => prev.some(existing => existing._id === msg._id) ? prev : [...prev, msg])
    })
    return () => { socket.off('message:new') }
  }, [bookingId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return
    setSending(true)
    const content = input.trim()
    setInput('')
    try {
      await api.post(`/api/bookings/${bookingId}/messages`, { content })
    } catch {
      setInput(content)
    } finally {
      setSending(false)
    }
  }

  const isOwnMessage = (msg: Message) => msg.senderId === currentUserId || msg.senderRole === currentUserRole

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 320 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>
        Chat
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: 13, padding: '24px 0' }}>No messages yet</div>
        )}
        {messages.map((msg, i) => {
          if (msg.type === 'system') {
            return (
              <div key={msg._id || i} style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-faint)', fontStyle: 'italic', padding: '4px 0' }}>
                {msg.content}
              </div>
            )
          }
          const own = isOwnMessage(msg)
          const prevMsg = messages[i - 1]
          const showSender = !own && (i === 0 || prevMsg?.senderId !== msg.senderId)

          return (
            <motion.div key={msg._id || i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: own ? 'flex-end' : 'flex-start' }}>
              {showSender && (
                <span style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 3, paddingLeft: 4 }}>
                  {msg.senderRole || 'Provider'}
                </span>
              )}
              <div style={{
                maxWidth: '75%', padding: '10px 14px', borderRadius: 14,
                background: own ? 'var(--accent)' : 'var(--surface-raised)',
                color: own ? 'white' : 'var(--text)',
                fontSize: 14, lineHeight: 1.4,
                borderBottomRightRadius: own ? 4 : 14,
                borderBottomLeftRadius: own ? 14 : 4
              }}>
                {msg.content}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                {formatTime(msg.createdAt)}
                {own && (
                  <span style={{ color: msg.read ? 'var(--teal)' : 'var(--text-faint)' }}>✓✓</span>
                )}
              </div>
            </motion.div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="Type a message..."
          style={{
            flex: 1, background: 'var(--surface-raised)', border: '1.5px solid var(--border-strong)',
            borderRadius: 999, padding: '10px 16px', fontSize: 15, outline: 'none', fontFamily: 'Outfit, sans-serif'
          }}
        />
        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.15 }} onClick={sendMessage} disabled={sending || !input.trim()}
          style={{
            width: 42, height: 42, borderRadius: '50%', background: 'var(--accent)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            opacity: (!input.trim() || sending) ? 0.5 : 1, flexShrink: 0
          }}>
          <Send size={16} color="white" />
        </motion.button>
      </div>
    </div>
  )
}
