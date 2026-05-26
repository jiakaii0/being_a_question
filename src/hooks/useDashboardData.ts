'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { DateRange, ChatRating, DashboardSummary, IntentStat, EWSAlert, TrendPoint, HeatmapCell } from '@/types'
import {
  formatForQuery, getPreviousRange, getBaselineRange,
  buildSummary, buildTrend, buildTrendHourly, buildIntentStats, buildHeatmap, computeEWSAlerts
} from '@/lib/csatUtils'

const REFRESH_MS = 3 * 60 * 1000

interface DashboardData {
  summary: DashboardSummary
  intentStats: IntentStat[]
  currentTrend: TrendPoint[]
  prevTrend: TrendPoint[]
  hourlyTrend: TrendPoint[]
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
    hourlyTrend: [], heatmap: [], ewsAlerts: [], lastRefreshed: null, isLoading: true, error: null,
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
      const PAGE = 10000

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async function fetchAll(baseQuery: any): Promise<ChatRating[]> {
        const results: ChatRating[] = []
        let from = 0
        while (true) {
          const { data, error } = await baseQuery.range(from, from + PAGE - 1)
          if (error) throw new Error(error.message)
          results.push(...((data ?? []) as ChatRating[]))
          if (!data || data.length < PAGE) break
          from += PAGE
        }
        return results
      }

      const [current, prev_, baseline_] = await Promise.all([
        fetchAll(supabase.from('chat_ratings').select(COLS).gte('Time', startStr).lte('Time', endStr).order('Time', { ascending: true })),
        fetchAll(supabase.from('chat_ratings').select('"Time","Service Rating"').gte('Time', formatForQuery(prev.start)).lte('Time', formatForQuery(prev.end))),
        fetchAll(supabase.from('chat_ratings').select('"Time","Service Rating","Intent ID"').gte('Time', formatForQuery(baseline.start)).lte('Time', formatForQuery(baseline.end))),
      ])

      const summary     = buildSummary(current, prev_)
      const intentStats = buildIntentStats(current)
      const currentTrend= buildTrend(current)
      const prevTrend   = buildTrend(prev_)
      const hourlyTrend = buildTrendHourly(current)
      const heatmap     = buildHeatmap(intentStats)
      const ewsAlerts   = computeEWSAlerts(current, baseline_, summary, summary.prevCsat)

      setData({ summary, intentStats, currentTrend, prevTrend, hourlyTrend, heatmap, ewsAlerts, lastRefreshed: new Date(), isLoading: false, error: null })
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
