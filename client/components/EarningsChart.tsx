'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface DataPoint {
  date: string
  amount: number
}

interface Props {
  data: DataPoint[]
}

function formatLabel(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 3)
}

function formatAxis(v: number) {
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}k`
  return `₹${v}`
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '8px 14px', boxShadow: 'var(--shadow-md)', fontSize: 13 }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 15 }}>₹{payload[0]?.value?.toFixed(0)}</div>
    </div>
  )
}

export default function EarningsChart({ data }: Props) {
  const formatted = data.map(d => ({ ...d, label: formatLabel(d.date) }))

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={formatted} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={formatAxis} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,107,43,0.06)', radius: 6 }} />
        <Bar dataKey="amount" fill="#FF6B2B" radius={[6, 6, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  )
}
