import { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { fetchDashboardData, resolveDateRange, DateRangeInput } from '../lib/dataFetcher'
import { buildIntentStatsFromAgg } from '@/lib/csatUtils'
import { IntentStat } from '@/types'

type SortField = 'bad_count' | 'csat' | 'total'

function sortStats(stats: IntentStat[], sortBy: SortField): IntentStat[] {
  return [...stats].sort((a, b) => {
    if (sortBy === 'csat') return a.csat - b.csat
    if (sortBy === 'total') return b.total - a.total
    return b.bad - a.bad
  })
}

export async function handleGetIntentBreakdown(args: Record<string, unknown>): Promise<CallToolResult> {
  const range = resolveDateRange(args.date_range as DateRangeInput | undefined)
  const categoryFilter = args.category_filter as string | undefined
  const sortBy = (args.sort_by as SortField | undefined) ?? 'bad_count'
  const limit = Math.min(Number(args.limit ?? 20), 100)
  const minTotal = Number(args.min_total ?? 10)

  const { intentHourly } = await fetchDashboardData(range)
  let stats = buildIntentStatsFromAgg(intentHourly)

  if (categoryFilter) stats = stats.filter(s => s.category === categoryFilter)
  stats = stats.filter(s => s.total >= minTotal)
  stats = sortStats(stats, sortBy).slice(0, limit)

  const result = stats.map(({ hourlyBad: _hb, hourlyGood: _hg, ...rest }) => rest)

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        period: { start: range.start.toISOString(), end: range.end.toISOString() },
        filters: { category: categoryFilter ?? null, sort_by: sortBy, limit, min_total: minTotal },
        count: result.length,
        intents: result,
      }, null, 2),
    }],
  }
}
