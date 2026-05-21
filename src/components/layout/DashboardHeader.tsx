'use client'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'

interface Props {
  lastRefreshed: Date | null
  onRefresh: () => void
  isLoading: boolean
}

export default function DashboardHeader({ lastRefreshed, onRefresh, isLoading }: Props) {
  const [countdown, setCountdown] = useState(180)

  useEffect(() => {
    if (lastRefreshed) setCountdown(180)
  }, [lastRefreshed])

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [])

  const mm = String(Math.floor(countdown / 60)).padStart(2, '0')
  const ss = String(countdown % 60).padStart(2, '0')

  return (
    <header className="bg-shopee-500 text-white shadow-md">
      <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded px-2 py-1">
            <span className="text-shopee-500 font-extrabold text-xl tracking-tight">shopee</span>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Chatbot Monitoring Dashboard</h1>
            <p className="text-shopee-100 text-xs">Live CSAT & EWS</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          {lastRefreshed && (
            <span className="text-shopee-100 hidden sm:inline">
              Last updated: {format(lastRefreshed, 'HH:mm:ss')}
            </span>
          )}
          <span className="text-shopee-100 tabular-nums">Next refresh: {mm}:{ss}</span>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="bg-white text-shopee-500 font-semibold text-xs px-3 py-1.5 rounded hover:bg-shopee-50 disabled:opacity-50 transition"
          >
            {isLoading ? 'Loading…' : '↻ Refresh'}
          </button>
        </div>
      </div>
    </header>
  )
}
