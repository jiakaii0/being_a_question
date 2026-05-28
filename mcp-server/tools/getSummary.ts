import { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { fetchDashboardData, resolveDateRange, DateRangeInput } from '../lib/dataFetcher'
import { buildSummaryFromAgg } from '@/lib/csatUtils'

export async function handleGetSummary(args: Record<string, unknown>): Promise<CallToolResult> {
  const range = resolveDateRange(args.date_range as DateRangeInput | undefined)
  const { currSummary, prevSummary } = await fetchDashboardData(range)
  const summary = buildSummaryFromAgg(currSummary, prevSummary)

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        period: { start: range.start.toISOString(), end: range.end.toISOString() },
        csat: summary.csat,
        csatDelta: summary.csatDelta,
        prevCsat: summary.prevCsat,
        total: summary.total,
        good: summary.good,
        bad: summary.bad,
        average: summary.average,
        unrated: summary.unrated,
      }, null, 2),
    }],
  }
}
