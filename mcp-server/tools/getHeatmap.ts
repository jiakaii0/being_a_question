import { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { fetchDashboardData, resolveDateRange, DateRangeInput } from '../lib/dataFetcher'
import { buildIntentStatsFromAgg, buildHeatmap } from '@/lib/csatUtils'

export async function handleGetHeatmap(args: Record<string, unknown>): Promise<CallToolResult> {
  const range = resolveDateRange(args.date_range as DateRangeInput | undefined)
  const topN = Math.min(Number(args.top_n ?? 20), 50)
  const categoryFilter = args.category_filter as string | undefined

  const { intentHourly } = await fetchDashboardData(range)
  let stats = buildIntentStatsFromAgg(intentHourly)

  if (categoryFilter) stats = stats.filter(s => s.category === categoryFilter)

  const heatmap = buildHeatmap(stats, topN)

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        period: { start: range.start.toISOString(), end: range.end.toISOString() },
        filters: { top_n: topN, category: categoryFilter ?? null },
        cells: heatmap.length,
        heatmap,
      }, null, 2),
    }],
  }
}
