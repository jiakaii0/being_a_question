import { supabase } from '@/lib/supabase'
import { DateRange, CsatSummaryRow, DailyTrendRow, HourlyTrendRow, IntentHourlyRow, IntentDailyRow } from '@/types'
import { formatForQuery, getPreviousRange, getBaselineRange, getQuickRange } from '@/lib/csatUtils'

export type DateRangeInput =
  | { preset: 'today' | 'week' | 'month'; start?: never; end?: never }
  | { preset?: never; start: string; end: string }

export function resolveDateRange(input: DateRangeInput | undefined): DateRange {
  if (!input) return getQuickRange('today')
  if (input.preset) return getQuickRange(input.preset)
  return { start: new Date(input.start), end: new Date(input.end) }
}

const EMPTY_AGG: CsatSummaryRow = { total: 0, good: 0, bad: 0, average: 0, unrated: 0 }

export interface FetchedDashboardData {
  currSummary: CsatSummaryRow
  prevSummary: CsatSummaryRow
  dailyCurrent: DailyTrendRow[]
  dailyPrevious: DailyTrendRow[]
  hourlyCurrent: HourlyTrendRow[]
  intentHourly: IntentHourlyRow[]
  intentDailyCurrent: IntentDailyRow[]
  intentDailyBaseline: IntentDailyRow[]
}

export async function fetchDashboardData(range: DateRange): Promise<FetchedDashboardData> {
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
    supabase.rpc('get_csat_summary',        { start_ts: startStr,                       end_ts: endStr }),
    supabase.rpc('get_csat_summary',        { start_ts: formatForQuery(prev.start),     end_ts: formatForQuery(prev.end) }),
    supabase.rpc('get_daily_trend',         { start_ts: startStr,                       end_ts: endStr }),
    supabase.rpc('get_daily_trend',         { start_ts: formatForQuery(prev.start),     end_ts: formatForQuery(prev.end) }),
    supabase.rpc('get_hourly_trend',        { start_ts: startStr,                       end_ts: endStr }),
    supabase.rpc('get_intent_hourly_stats', { start_ts: startStr,                       end_ts: endStr }),
    supabase.rpc('get_intent_daily_stats',  { start_ts: startStr,                       end_ts: endStr }),
    supabase.rpc('get_intent_daily_stats',  { start_ts: formatForQuery(baseline.start), end_ts: formatForQuery(baseline.end) }),
  ])

  const err = e1 || e2 || e3 || e4 || e5 || e6 || e7 || e8
  if (err) throw new Error(err.message)

  return {
    currSummary:         (currSummaryData  as CsatSummaryRow[])?.[0]  ?? EMPTY_AGG,
    prevSummary:         (prevSummaryData  as CsatSummaryRow[])?.[0]  ?? EMPTY_AGG,
    dailyCurrent:        (dailyCurrData    ?? []) as DailyTrendRow[],
    dailyPrevious:       (dailyPrevData    ?? []) as DailyTrendRow[],
    hourlyCurrent:       (hourlyCurrData   ?? []) as HourlyTrendRow[],
    intentHourly:        (intentHourlyData ?? []) as IntentHourlyRow[],
    intentDailyCurrent:  (intentDailyCurr  ?? []) as IntentDailyRow[],
    intentDailyBaseline: (intentDailyBase  ?? []) as IntentDailyRow[],
  }
}
