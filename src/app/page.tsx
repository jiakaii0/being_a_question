'use client'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useDateFilter } from '@/hooks/useDateFilter'
import DashboardHeader from '@/components/layout/DashboardHeader'
import DateFilterBar from '@/components/layout/DateFilterBar'
import SummaryCards from '@/components/summary/SummaryCards'
import EWSPanel from '@/components/ews/EWSPanel'
import CsatTrendChart from '@/components/charts/CsatTrendChart'
import IntentHeatmap from '@/components/charts/IntentHeatmap'
import IntentBreakdownTable from '@/components/table/IntentBreakdownTable'

export default function Home() {
  const { quickFilter, range, selectQuick, selectCustom } = useDateFilter()
  const { summary, intentStats, currentTrend, prevTrend, hourlyTrend, heatmap, ewsAlerts, lastRefreshed, isLoading, error, refresh } = useDashboardData(range)

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader lastRefreshed={lastRefreshed} onRefresh={refresh} isLoading={isLoading} />

      <main className="max-w-screen-2xl mx-auto px-4 py-6 space-y-6">
        {/* Date filter */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <DateFilterBar quickFilter={quickFilter} range={range} onQuick={selectQuick} onCustom={selectCustom} />
          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-1">
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="text-center py-2">
            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              <span className="animate-spin inline-block">⟳</span> Loading data…
            </div>
          </div>
        )}

        {/* EWS */}
        <EWSPanel alerts={ewsAlerts} />

        {/* Summary cards */}
        <SummaryCards summary={summary} />

        {/* Trend chart */}
        <CsatTrendChart current={currentTrend} previous={prevTrend} hourly={hourlyTrend} />

        {/* Heatmap */}
        <IntentHeatmap cells={heatmap} />

        {/* Intent table */}
        <IntentBreakdownTable intentStats={intentStats} />
      </main>
    </div>
  )
}
