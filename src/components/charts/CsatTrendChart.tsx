'use client'
import { useState } from 'react'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'
import { TrendPoint } from '@/types'
import { format, parseISO } from 'date-fns'

interface Props {
  current: TrendPoint[]
  previous: TrendPoint[]
  hourly: TrendPoint[]
}

type Mode = 'hourly' | 'dod' | 'wow' | 'mom'

export default function CsatTrendChart({ current, previous, hourly }: Props) {
  const [mode, setMode] = useState<Mode>('hourly')

  const merged = (() => {
    if (mode === 'hourly') {
      return hourly.map(p => ({
        label: p.date.slice(11, 13) + ':00', // 'HH:00'
        good: p.good,
        bad: p.bad,
        csat: p.csat ?? null as number | null,
        prevCsat: null as number | null,
      }))
    }
    if (mode === 'dod') {
      return current.map(c => ({
        label: format(parseISO(c.date), 'MMM d'),
        good: c.good,
        bad: c.bad,
        csat: c.csat ?? null as number | null,
        prevCsat: null as number | null,
      }))
    }
    const len = Math.max(current.length, previous.length)
    return Array.from({ length: len }, (_, i) => {
      const c = current[i]
      const p = previous[i]
      return {
        label: c?.date ? format(parseISO(c.date), 'MMM d') : `Day ${i + 1}`,
        good: c?.good ?? 0,
        bad: c?.bad ?? 0,
        csat: c?.csat ?? null as number | null,
        prevCsat: p?.csat ?? null as number | null,
      }
    })
  })()

  const MODES: { key: Mode; label: string }[] = [
    { key: 'hourly', label: 'Hourly' },
    { key: 'dod', label: 'Day on Day' },
    { key: 'wow', label: 'Week on Week' },
    { key: 'mom', label: 'Month on Month' },
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md p-3 text-xs">
        <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
        {payload.map((entry: any) => (
          entry.value != null && (
            <p key={entry.name} style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('CSAT') ? `${Number(entry.value).toFixed(1)}%` : Number(entry.value).toLocaleString()}
            </p>
          )
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">CSAT Trend</h2>
        <div className="flex gap-1">
          {MODES.map(({ key, label }) => (
            <button key={key} onClick={() => setMode(key)}
              className={`px-3 py-1 text-xs font-medium rounded transition ${
                mode === key ? 'bg-shopee-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {merged.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data for selected period</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={merged} margin={{ top: 4, right: 48, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={mode === 'hourly' ? 1 : 'preserveStartEnd'} />
            <YAxis yAxisId="count" orientation="left" tick={{ fontSize: 11 }} width={45} tickFormatter={v => v.toLocaleString()} />
            <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} width={40} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine yAxisId="pct" y={60} stroke="#4ade80" strokeDasharray="4 4" label={{ value: '60% target', fontSize: 10, fill: '#16a34a', position: 'insideTopRight' }} />
            <Bar yAxisId="count" dataKey="good" name="Good" stackId="a" fill="#4ade80" maxBarSize={32} />
            <Bar yAxisId="count" dataKey="bad" name="Bad" stackId="a" fill="#EE4D2D" radius={[3, 3, 0, 0]} maxBarSize={32} />
            <Line yAxisId="pct" type="monotone" dataKey="csat" name="CSAT %" stroke="#f97316" strokeWidth={2.5} dot={{ r: 2 }} connectNulls />
            {(mode === 'wow' || mode === 'mom') && (
              <Line yAxisId="pct" type="monotone" dataKey="prevCsat" name="Prev CSAT %" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="5 5" dot={false} connectNulls />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
