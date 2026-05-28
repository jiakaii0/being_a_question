'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { DateRange, DashboardSummary, IntentStat, EWSAlert, TrendPoint, HeatmapCell, CsatSummaryRow, DailyTrendRow, HourlyTrendRow, IntentHourlyRow, IntentDailyRow } from '@/types'
import {
  formatForQuery, getPreviousRange, getBaselineRange,
  buildSummaryFromAgg, buildTrendFromAgg, buildTrendHourlyFromAgg,
  buildIntentStatsFromAgg, buildHeatmap, computeEWSAlertsFromAgg,
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
const EMPTY_AGG: CsatSummaryRow = { total: 0, good: 0, bad: 0, average: 0, unrated: 0 }

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

      const [
        { data: currSummaryData,  error: e1 },
        { data: prevSummaryData,  error: e2 },
        { data: dailyCurrData,    error: e3 },
        { data: dailyPrevData,    error: e4 },
        { data: hourlyCurrData,   error: e5 },
        { data: intentHourlyData, error: e6 },
        { data: intentDailyCurr,  error: e7 },
        { data: intentDailyBase,  error: e8 },
      ] = await Promise.all([
        supabase.rpc('get_csat_summary',        { start_ts: startStr,                          end_ts: endStr }),
        supabase.rpc('get_csat_summary',        { start_ts: formatForQuery(prev.start),        end_ts: formatForQuery(prev.end) }),
        supabase.rpc('get_daily_trend',         { start_ts: startStr,                          end_ts: endStr }),
        supabase.rpc('get_daily_trend',         { start_ts: formatForQuery(prev.start),        end_ts: formatForQuery(prev.end) }),
        supabase.rpc('get_hourly_trend',        { start_ts: startStr,                          end_ts: endStr }),
        supabase.rpc('get_intent_hourly_stats', { start_ts: startStr,                          end_ts: endStr }),
        supabase.rpc('get_intent_daily_stats',  { start_ts: startStr,                          end_ts: endStr }),
        supabase.rpc('get_intent_daily_stats',  { start_ts: formatForQuery(baseline.start),    end_ts: formatForQuery(baseline.end) }),
      ])

      const err = e1 || e2 || e3 || e4 || e5 || e6 || e7 || e8
      if (err) throw new Error(err.message)

      const currSummary  = (currSummaryData as CsatSummaryRow[])?.[0]  ?? EMPTY_AGG
      const prevSummary  = (prevSummaryData as CsatSummaryRow[])?.[0]  ?? EMPTY_AGG
      const summary      = buildSummaryFromAgg(currSummary, prevSummary)
      const intentStats  = buildIntentStatsFromAgg((intentHourlyData ?? []) as IntentHourlyRow[])
      const currentTrend = buildTrendFromAgg((dailyCurrData   ?? []) as DailyTrendRow[])
      const prevTrend    = buildTrendFromAgg((dailyPrevData   ?? []) as DailyTrendRow[])
      const hourlyTrend  = buildTrendHourlyFromAgg((hourlyCurrData ?? []) as HourlyTrendRow[])
      const heatmap      = buildHeatmap(intentStats)
      const ewsAlerts    = computeEWSAlertsFromAgg(
        (intentDailyCurr ?? []) as IntentDailyRow[],
        (intentDailyBase ?? []) as IntentDailyRow[],
        summary, summary.prevCsat,
      )

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
