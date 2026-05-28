import { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { fetchDashboardData, resolveDateRange, DateRangeInput } from '../lib/dataFetcher'
import { buildSummaryFromAgg, computeEWSAlertsFromAgg } from '@/lib/csatUtils'
import { EWSSeverity } from '@/types'

export async function handleGetEwsAlerts(args: Record<string, unknown>): Promise<CallToolResult> {
  const range = resolveDateRange(args.date_range as DateRangeInput | undefined)
  const severityFilter = (args.severity_filter as string | undefined) ?? 'all'

  const { currSummary, prevSummary, intentDailyCurrent, intentDailyBaseline } = await fetchDashboardData(range)
  const summary = buildSummaryFromAgg(currSummary, prevSummary)
  let alerts = computeEWSAlertsFromAgg(intentDailyCurrent, intentDailyBaseline, summary, summary.prevCsat)

  if (severityFilter !== 'all') {
    alerts = alerts.filter(a => a.severity === (severityFilter as EWSSeverity))
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        period: { start: range.start.toISOString(), end: range.end.toISOString() },
        total_alerts: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        alerts,
      }, null, 2),
    }],
  }
}
