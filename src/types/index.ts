export interface ChatRating {
  id?: number
  'No.'?: string
  'Session ID': string
  'User ID'?: string
  'Time': string
  'Is Smart KB'?: string
  'Entry Point'?: string
  'Is Resolved'?: string
  'Service Rating'?: string
  "User's Utterance"?: string
  'Is to Live Agent'?: string
  'Node Point ID'?: string
  'Intent ID'?: string
  'Issue ID'?: string
}

export interface DateRange {
  start: Date
  end: Date
}

export type QuickFilter = 'today' | 'week' | 'month' | 'custom'

export interface IntentStat {
  intentId: string
  intentName: string
  category: string
  total: number
  good: number
  bad: number
  average: number
  unrated: number
  csat: number
  resolvedCount: number
  resolvedPct: number
  hourlyBad: number[]   // index 0-23
  hourlyGood: number[]  // index 0-23
}

export type EWSAlertType = 'csat_threshold' | 'wow_drop' | 'bad_spike' | 'volume_surge'
export type EWSSeverity = 'warning' | 'critical'

export interface EWSAlert {
  type: EWSAlertType
  severity: EWSSeverity
  message: string
  detail?: string
  intentId?: string
  intentName?: string
  category?: string
  zScore?: number
  value?: number
  drop?: number
  badCount?: number
  historicalMean?: number
}

export interface TrendPoint {
  date: string
  csat: number
  good: number
  bad: number
  total: number
}

export interface DashboardSummary {
  total: number
  good: number
  bad: number
  average: number
  unrated: number
  csat: number
  prevCsat: number
  csatDelta: number
}

export interface HeatmapCell {
  intentId: string
  intentName: string
  hour: number
  badCount: number
  totalCount: number
}

export interface CsatSummaryRow {
  total: number; good: number; bad: number; average: number; unrated: number
}

export interface DailyTrendRow {
  day: string; good: number; bad: number; total: number
}

export interface HourlyTrendRow {
  bucket: string; good: number; bad: number; total: number
}

export interface IntentHourlyRow {
  intent_id: string; hour: number; good: number; bad: number; total: number; resolved: number
}

export interface IntentDailyRow {
  intent_id: string; day: string; bad: number; total: number
}
