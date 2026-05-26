'use client'
import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'
import { TrendPoint } from '@/types'
import { format, parseISO } from 'date-fns'

interface Props {
  current: TrendPoint[]
  previous: TrendPoint[]
}

type Mode = 'dod' | 'wow' | 'mom'

export default function CsatTrendChart({ current, previous }: Props) {
  const [mode, setMode] = useState<Mode>('dod')

  const merged = (() => {
    if (mode === 'dod') {
      return current.map(c => ({
        label: format(parseISO(c.date), 'MMM d'),
        current: c.csat ?? null,
        previous: null as number | null,
        cTotal: c.total,
        pTotal: 0,
      }))
    }
    const len = Math.max(current.length, previous.length)
    return Array.from({ length: len }, (_, i) => {
      const c = current[i]
      const p = previous[i]
      return {
        label: c?.date ? format(parseISO(c.date), 'MMM d') : p?.date ? format(parseISO(p.date), 'MMM d') : `Day ${i + 1}`,
        current:  c?.csat  ?? null,
        previous: p?.csat  ?? null,
        cTotal:   c?.total ?? 0,
        pTotal:   p?.total ?? 0,
      }
    })
  })()

  const MODES: { key: Mode; label: string }[] = [
    { key: 'dod', label: 'Day on Day' },
    { key: 'wow', label: 'Week on Week' },
    { key: 'mom', label: 'Month on Month' },
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800">CSAT Trend</h2>
        <div className="flex gap-1">
          {MODES.map(({ key, label }) => (
            <button key={key} onClick={() => setMode(key)}
              className={`px-3 py-1 text-xs font-medium rounded transition ${
                mode === key ? 'bg-shopee-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {merged.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data for selected period</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={merged} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} width={40} />
            <Tooltip formatter={(v) => typeof v === 'number' ? `${v.toFixed(1)}%` : v} />
            <Legend />
            <ReferenceLine y={60} stroke="#4ade80" strokeDasharray="4 4" label={{ value: '60% target', fontSize: 10, fill: '#16a34a' }} />
            <Line type="monotone" dataKey="current" name="Current Period" stroke="#EE4D2D" strokeWidth={2.5} dot={false} connectNulls />
            {mode !== 'dod' && (
              <Line type="monotone" dataKey="previous" name="Previous Period" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="5 5" dot={false} connectNulls />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
