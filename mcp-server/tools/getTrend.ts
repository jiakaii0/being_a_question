import { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { fetchDashboardData, resolveDateRange, DateRangeInput } from '../lib/dataFetcher'
import { buildTrendFromAgg, buildTrendHourlyFromAgg } from '@/lib/csatUtils'

export async function handleGetTrend(args: Record<string, unknown>): Promise<CallToolResult> {
  const range = resolveDateRange(args.date_range as DateRangeInput | undefined)
  const granularity = (args.granularity as string | undefined) ?? 'daily'
  const includePrev = Boolean(args.include_previous_period)

  const { dailyCurrent, dailyPrevious, hourlyCurrent } = await fetchDashboardData(range)

  const trend = granularity === 'hourly'
    ? buildTrendHourlyFromAgg(hourlyCurrent)
    : buildTrendFromAgg(dailyCurrent)

  const previousTrend = includePrev
    ? buildTrendFromAgg(dailyPrevious)
    : null

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        period: { start: range.start.toISOString(), end: range.end.toISOString() },
        granularity,
        trend,
        previous_trend: previousTrend,
      }, null, 2),
    }],
  }
}
