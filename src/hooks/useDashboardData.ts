'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { DateRange, ChatRating, DashboardSummary, IntentStat, EWSAlert, TrendPoint, HeatmapCell } from '@/types'
import {
  formatForQuery, getPreviousRange, getBaselineRange,
  buildSummary, buildTrend, buildIntentStats, buildHeatmap, computeEWSAlerts
} from '@/lib/csatUtils'

const REFRESH_MS = 3 * 60 * 1000

interface DashboardData {
  summary: DashboardSummary
  intentStats: IntentStat[]
  currentTrend: TrendPoint[]
  prevTrend: TrendPoint[]
  heatmap: HeatmapCell[]
  ewsAlerts: EWSAlert[]
  lastRefreshed: Date | null
  isLoading: boolean
  error: string | null
}

const EMPTY_SUMMARY: DashboardSummary = { total: 0, good: 0, bad: 0, average: 0, unrated: 0, csat: 0, prevCsat: 0, csatDelta: 0 }

export function useDashboardData(range: DateRange): DashboardData & { refresh: () => void } {
  const [data, setData] = useState<DashboardData>({
    summary: EMPTY_SUMMARY, intentStats: [], currentTrend: [], prevTrend: [],
    heatmap: [], ewsAlerts: [], lastRefreshed: null, isLoading: true, error: null,
  })
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetch = useCallback(async () => {
    setData(d => ({ ...d, isLoading: true, error: null }))
    try {
      const startStr = formatForQuery(range.start)
      const endStr   = formatForQuery(range.end)
      const prev     = getPreviousRange(range)
      const baseline = getBaselineRange(range.start)

      const COLS = '"Session ID","User ID","Time","Service Rating","Intent ID","Is Resolved","Is to Live Agent"'

      const [currentRes, prevRes, baselineRes] = await Promise.all([
        supabase.from('chat_ratings').select(COLS).gte('Time', startStr).lte('Time', endStr).limit(100000),
        supabase.from('chat_ratings').select('"Time","Service Rating"').gte('Time', formatForQuery(prev.start)).lte('Time', formatForQuery(prev.end)).limit(50000),
        supabase.from('chat_ratings').select('"Time","Service Rating","Intent ID"').gte('Time', formatForQuery(baseline.start)).lte('Time', formatForQuery(baseline.end)).limit(50000),
      ])

      if (currentRes.error) throw new Error(currentRes.error.message)

      const current  = (currentRes.data ?? []) as ChatRating[]
      const prev_    = (prevRes.data ?? []) as ChatRating[]
      const baseline_= (baselineRes.data ?? []) as ChatRating[]

      const summary     = buildSummary(current, prev_)
      const intentStats = buildIntentStats(current)
      const currentTrend= buildTrend(current)
      const prevTrend   = buildTrend(prev_)
      const heatmap     = buildHeatmap(intentStats)
      const ewsAlerts   = computeEWSAlerts(current, baseline_, summary, summary.prevCsat)

      setData({ summary, intentStats, currentTrend, prevTrend, heatmap, ewsAlerts, lastRefreshed: new Date(), isLoading: false, error: null })
    } catch (e: unknown) {
      setData(d => ({ ...d, isLoading: false, error: e instanceof Error ? e.message : 'Unknown error' }))
    }
  }, [range])

  useEffect(() => {
    fetch()
    timerRef.current = setInterval(fetch, REFRESH_MS)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [fetch])

  return { ...data, refresh: fetch }
}
