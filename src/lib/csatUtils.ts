import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { ChatRating, DateRange, EWSAlert, IntentStat, TrendPoint, DashboardSummary, HeatmapCell } from '@/types'
import { getIntentCategory, getIntentId, getIntentName } from '@/lib/intentMap'

// ── Date helpers ─────────────────────────────────────────────────────────────

export function formatForQuery(d: Date): string {
  return format(d, 'yyyy-MM-dd HH:mm')
}

export function getQuickRange(filter: 'today' | 'week' | 'month'): DateRange {
  const now = new Date()
  if (filter === 'today') return { start: startOfDay(now), end: endOfDay(now) }
  if (filter === 'week')  return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
  return { start: startOfMonth(now), end: endOfMonth(now) }
}

export function getPreviousRange(range: DateRange): DateRange {
  const diff = range.end.getTime() - range.start.getTime()
  return {
    start: new Date(range.start.getTime() - diff - 1),
    end:   new Date(range.start.getTime() - 1),
  }
}

export function getBaselineRange(start: Date): DateRange {
  return { start: subDays(start, 7), end: new Date(start.getTime() - 1) }
}

// ── Rating normalisation ──────────────────────────────────────────────────────

export function normaliseRating(r?: string): 'good' | 'bad' | 'average' | 'unrated' {
  const v = (r ?? '').trim().toLowerCase()
  if (v === 'good') return 'good'
  if (v === 'bad')  return 'bad'
  if (v === 'average') return 'average'
  return 'unrated'
}

// ── CSAT ──────────────────────────────────────────────────────────────────────

export function calcCsat(good: number, bad: number): number {
  const rated = good + bad
  if (rated === 0) return 0
  return Math.round((good / rated) * 1000) / 10
}

// ── CSAT color (light → dark shading) ────────────────────────────────────────

export function csatColor(value: number): string {
  if (value >= 80) return '#15803d'   // green-700
  if (value >= 70) return '#16a34a'   // green-600
  if (value >= 60) return '#4ade80'   // green-400 (light)
  if (value >= 55) return '#fde047'   // yellow-300
  if (value >= 50) return '#eab308'   // yellow-500
  if (value >= 40) return '#fca5a5'   // red-300 (light)
  if (value >= 30) return '#ef4444'   // red-500
  return '#991b1b'                     // red-800 (dark)
}

export function csatBgClass(value: number): string {
  if (value >= 80) return 'bg-green-700 text-white'
  if (value >= 70) return 'bg-green-600 text-white'
  if (value >= 60) return 'bg-green-400 text-green-900'
  if (value >= 55) return 'bg-yellow-300 text-yellow-900'
  if (value >= 50) return 'bg-yellow-500 text-white'
  if (value >= 40) return 'bg-red-300 text-red-900'
  if (value >= 30) return 'bg-red-500 text-white'
  return 'bg-red-800 text-white'
}

// ── Summary ───────────────────────────────────────────────────────────────────

export function buildSummary(rows: ChatRating[], prevRows: ChatRating[]): DashboardSummary {
  let good = 0, bad = 0, average = 0, unrated = 0
  for (const r of rows) {
    const rating = normaliseRating(r['Service Rating'])
    if (rating === 'good') good++
    else if (rating === 'bad') bad++
    else if (rating === 'average') average++
    else unrated++
  }
  const csat = calcCsat(good, bad)

  let pGood = 0, pBad = 0
  for (const r of prevRows) {
    const rating = normaliseRating(r['Service Rating'])
    if (rating === 'good') pGood++
    else if (rating === 'bad') pBad++
  }
  const prevCsat = calcCsat(pGood, pBad)

  return { total: rows.length, good, bad, average, unrated, csat, prevCsat, csatDelta: Math.round((csat - prevCsat) * 10) / 10 }
}

// ── Trend (bucket by day) ─────────────────────────────────────────────────────

export function buildTrend(rows: ChatRating[]): TrendPoint[] {
  const map = new Map<string, { good: number; bad: number; total: number }>()
  for (const r of rows) {
    const day = r['Time']?.slice(0, 10) ?? 'unknown'
    const existing = map.get(day) ?? { good: 0, bad: 0, total: 0 }
    const rating = normaliseRating(r['Service Rating'])
    existing.total++
    if (rating === 'good') existing.good++
    if (rating === 'bad')  existing.bad++
    map.set(day, existing)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, s]) => ({ date, csat: calcCsat(s.good, s.bad), good: s.good, bad: s.bad, total: s.total }))
}

// ── Trend (bucket by hour) ────────────────────────────────────────────────────

export function buildTrendHourly(rows: ChatRating[]): TrendPoint[] {
  const map = new Map<string, { good: number; bad: number; total: number }>()
  for (const r of rows) {
    const bucket = r['Time']?.slice(0, 13) ?? 'unknown' // 'YYYY-MM-DD HH'
    const existing = map.get(bucket) ?? { good: 0, bad: 0, total: 0 }
    const rating = normaliseRating(r['Service Rating'])
    existing.total++
    if (rating === 'good') existing.good++
    if (rating === 'bad')  existing.bad++
    map.set(bucket, existing)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, s]) => ({ date, csat: calcCsat(s.good, s.bad), good: s.good, bad: s.bad, total: s.total }))
}

// ── Intent stats ──────────────────────────────────────────────────────────────

export function buildIntentStats(rows: ChatRating[]): IntentStat[] {
  const map = new Map<string, IntentStat>()

  for (const r of rows) {
    const raw = r['Intent ID'] ?? ''
    const id = getIntentId(raw)
    if (!id) continue

    const rating = normaliseRating(r['Service Rating'])
    const hour = r['Time'] ? parseInt(r['Time'].slice(11, 13), 10) : -1
    const isResolved = (r['Is Resolved'] ?? '').toLowerCase() === 'true'

    if (!map.has(id)) {
      map.set(id, {
        intentId: id,
        intentName: getIntentName(raw),
        category: getIntentCategory(raw),
        total: 0, good: 0, bad: 0, average: 0, unrated: 0,
        csat: 0, resolvedCount: 0, resolvedPct: 0,
        hourlyBad: Array(24).fill(0),
      })
    }
    const stat = map.get(id)!
    stat.total++
    if (rating === 'good') stat.good++
    else if (rating === 'bad') { stat.bad++; if (hour >= 0) stat.hourlyBad[hour]++ }
    else if (rating === 'average') stat.average++
    else stat.unrated++
    if (isResolved) stat.resolvedCount++
  }

  return Array.from(map.values()).map(s => ({
    ...s,
    csat: calcCsat(s.good, s.bad),
    resolvedPct: s.total > 0 ? Math.round((s.resolvedCount / s.total) * 1000) / 10 : 0,
  })).sort((a, b) => b.bad - a.bad)
}

// ── Heatmap ───────────────────────────────────────────────────────────────────

export function buildHeatmap(intentStats: IntentStat[], topN = 30): HeatmapCell[] {
  const top = intentStats.slice(0, topN)
  const cells: HeatmapCell[] = []
  for (const stat of top) {
    for (let h = 0; h < 24; h++) {
      cells.push({ intentId: stat.intentId, intentName: stat.intentName, hour: h, badCount: stat.hourlyBad[h], totalCount: stat.total })
    }
  }
  return cells
}

// ── EWS ───────────────────────────────────────────────────────────────────────

const MIN_BAD  = 10
const MIN_VOL  = 30
const Z_WARN   = 1.64
const Z_CRIT   = 2.33

function groupByIntentDay(rows: ChatRating[]): Map<string, Map<string, number>> {
  const outer = new Map<string, Map<string, number>>()
  for (const r of rows) {
    const id  = getIntentId(r['Intent ID'] ?? '')
    const day = r['Time']?.slice(0, 10) ?? 'unknown'
    if (!id) continue
    if (!outer.has(id)) outer.set(id, new Map())
    const inner = outer.get(id)!
    inner.set(day, (inner.get(day) ?? 0) + (normaliseRating(r['Service Rating']) === 'bad' ? 1 : 0))
  }
  return outer
}

function groupVolByIntentDay(rows: ChatRating[]): Map<string, Map<string, number>> {
  const outer = new Map<string, Map<string, number>>()
  for (const r of rows) {
    const id  = getIntentId(r['Intent ID'] ?? '')
    const day = r['Time']?.slice(0, 10) ?? 'unknown'
    if (!id) continue
    if (!outer.has(id)) outer.set(id, new Map())
    const inner = outer.get(id)!
    inner.set(day, (inner.get(day) ?? 0) + 1)
  }
  return outer
}

export function computeEWSAlerts(
  currentRows: ChatRating[],
  baselineRows: ChatRating[],
  summary: DashboardSummary,
  prevCsat: number
): EWSAlert[] {
  const alerts: EWSAlert[] = []

  // 1. CSAT threshold
  if (summary.csat < 50) {
    alerts.push({ type: 'csat_threshold', severity: 'critical', message: `CSAT is critically low at ${summary.csat}%`, detail: 'Below 50% threshold', value: summary.csat })
  } else if (summary.csat < 60) {
    alerts.push({ type: 'csat_threshold', severity: 'warning', message: `CSAT is below target at ${summary.csat}%`, detail: 'Below 60% target', value: summary.csat })
  }

  // 2. WoW CSAT drop
  const drop = Math.round((prevCsat - summary.csat) * 10) / 10
  if (drop >= 10) {
    alerts.push({ type: 'wow_drop', severity: 'critical', message: `CSAT dropped ${drop}pp vs previous period`, detail: `${prevCsat}% → ${summary.csat}%`, drop })
  } else if (drop >= 5) {
    alerts.push({ type: 'wow_drop', severity: 'warning', message: `CSAT dropped ${drop}pp vs previous period`, detail: `${prevCsat}% → ${summary.csat}%`, drop })
  }

  // 3. Bad spike (Z-score per intent)
  const baselineBad = groupByIntentDay(baselineRows)
  const currentBad  = new Map<string, number>()
  for (const r of currentRows) {
    const id = getIntentId(r['Intent ID'] ?? '')
    if (normaliseRating(r['Service Rating']) === 'bad') currentBad.set(id, (currentBad.get(id) ?? 0) + 1)
  }
  const currentVol = new Map<string, number>()
  for (const r of currentRows) {
    const id = getIntentId(r['Intent ID'] ?? '')
    if (id) currentVol.set(id, (currentVol.get(id) ?? 0) + 1)
  }

  for (const [id, dayMap] of baselineBad) {
    const history = Array.from(dayMap.values())
    if (history.length < 2) continue
    const bad = currentBad.get(id) ?? 0
    const vol = currentVol.get(id) ?? 0
    if (bad < MIN_BAD || vol < MIN_VOL) continue
    const mean = history.reduce((a, b) => a + b, 0) / history.length
    const std  = Math.sqrt(history.reduce((s, v) => s + (v - mean) ** 2, 0) / history.length)
    const z    = std > 0 ? (bad - mean) / std : bad - mean
    if (z >= Z_WARN) {
      const raw = currentRows.find(r => getIntentId(r['Intent ID'] ?? '') === id)?.['Intent ID'] ?? id
      alerts.push({
        type: 'bad_spike', severity: z >= Z_CRIT ? 'critical' : 'warning',
        message: `Bad rating spike on Intent ${id}`,
        detail: `Z-score ${z.toFixed(2)} — ${bad} bad today vs avg ${mean.toFixed(1)}`,
        intentId: id, intentName: getIntentName(raw), category: getIntentCategory(raw),
        zScore: z, badCount: bad, historicalMean: mean,
      })
    }
  }

  // 4. Volume surge
  const baselineVol = groupVolByIntentDay(baselineRows)
  const currentVolMap = new Map<string, number>()
  for (const r of currentRows) {
    const id = getIntentId(r['Intent ID'] ?? '')
    if (id) currentVolMap.set(id, (currentVolMap.get(id) ?? 0) + 1)
  }
  for (const [id, dayMap] of baselineVol) {
    const history = Array.from(dayMap.values())
    if (history.length < 2) continue
    const vol  = currentVolMap.get(id) ?? 0
    if (vol < MIN_VOL) continue
    const mean = history.reduce((a, b) => a + b, 0) / history.length
    const std  = Math.sqrt(history.reduce((s, v) => s + (v - mean) ** 2, 0) / history.length)
    const z    = std > 0 ? (vol - mean) / std : vol - mean
    if (z >= 2) {
      const raw = currentRows.find(r => getIntentId(r['Intent ID'] ?? '') === id)?.['Intent ID'] ?? id
      alerts.push({
        type: 'volume_surge', severity: z >= 3 ? 'critical' : 'warning',
        message: `Volume surge on Intent ${id}`,
        detail: `${vol} chats today vs avg ${mean.toFixed(1)}`,
        intentId: id, intentName: getIntentName(raw), category: getIntentCategory(raw),
        zScore: z,
      })
    }
  }

  return alerts.sort((a, b) => (a.severity === 'critical' ? 0 : 1) - (b.severity === 'critical' ? 0 : 1))
}
