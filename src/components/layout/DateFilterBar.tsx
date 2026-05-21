'use client'
import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { DateRange, QuickFilter } from '@/types'

interface Props {
  quickFilter: QuickFilter
  range: DateRange
  onQuick: (f: 'today' | 'week' | 'month') => void
  onCustom: (r: DateRange) => void
}

export default function DateFilterBar({ quickFilter, range, onQuick, onCustom }: Props) {
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo]     = useState('')

  const QUICK: { key: 'today' | 'week' | 'month'; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week',  label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ]

  function applyCustom() {
    if (from && to) {
      onCustom({ start: parseISO(from), end: new Date(parseISO(to).setHours(23, 59, 59)) })
      setOpen(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {QUICK.map(({ key, label }) => (
        <button key={key} onClick={() => { onQuick(key); setOpen(false) }}
          className={`px-3 py-1.5 rounded text-sm font-medium transition border ${
            quickFilter === key
              ? 'bg-shopee-500 text-white border-shopee-500'
              : 'bg-white text-gray-600 border-gray-300 hover:border-shopee-400 hover:text-shopee-500'
          }`}>
          {label}
        </button>
      ))}

      <div className="relative">
        <button onClick={() => setOpen(o => !o)}
          className={`px-3 py-1.5 rounded text-sm font-medium transition border ${
            quickFilter === 'custom'
              ? 'bg-shopee-500 text-white border-shopee-500'
              : 'bg-white text-gray-600 border-gray-300 hover:border-shopee-400 hover:text-shopee-500'
          }`}>
          {quickFilter === 'custom'
            ? `${format(range.start, 'MMM d')} – ${format(range.end, 'MMM d')}`
            : 'Custom Range'}
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex flex-col gap-2 min-w-[220px]">
            <label className="text-xs text-gray-500 font-medium">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-shopee-400" />
            <label className="text-xs text-gray-500 font-medium">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-shopee-400" />
            <div className="flex gap-2 mt-1">
              <button onClick={applyCustom} disabled={!from || !to}
                className="flex-1 bg-shopee-500 text-white text-sm py-1.5 rounded font-medium disabled:opacity-50 hover:bg-shopee-600 transition">
                Apply
              </button>
              <button onClick={() => setOpen(false)}
                className="flex-1 bg-gray-100 text-gray-600 text-sm py-1.5 rounded font-medium hover:bg-gray-200 transition">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
